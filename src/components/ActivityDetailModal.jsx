import { useEffect, useId, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, Info, X } from 'lucide-react';
import ActivityInfoModal from './ActivityInfoModal';
import ActivityBenefitsDrilldownModal from './ActivityBenefitsDrilldownModal';
import ActivityMovementDrilldownModal from './ActivityMovementDrilldownModal';
import ActivityZoneDrilldownModal from './ActivityZoneDrilldownModal';
import CalendarPicker from './CalendarPicker';
import { formatChartPointLabel, SvgChartPointLabel, useChartPointLabel } from './ChartPointLabel';
import MetricDrilldownModal from './MetricDrilldownModal';
import SubScoreBar from './SubScoreBar';
import UnavailableState from './UnavailableState';
import { getScoreColor } from '../utils/colors';
import { getAvailableRecordDates } from '../utils/dataAvailability';
import { calendarDates } from '../utils/dateService';
import {
  formatActivityDuration,
  getActivityTimeSeconds,
  getDailyMovementBuckets,
  getGoalProgress,
  getWeeklyActivityBenefits,
  HEART_RATE_ZONES,
} from '../utils/activityDetails';

const CONTRIBUTOR_DEFINITIONS = Object.freeze([
  ['meet_daily_targets', 'Meet Daily Targets', 'meetDailyTargetsContributor'],
  ['move_every_hour', 'Move Every Hour', 'moveEveryHourContributor'],
  ['recovery_time', 'Recovery Time', 'recoveryTimeContributor'],
  ['stay_active', 'Stay Active', 'stayActiveContributor'],
  ['training_frequency', 'Training Frequency', 'trainingFrequencyContributor'],
  ['training_volume', 'Training Volume', 'trainingVolumeContributor'],
]);

const ZONE_COLORS = Object.freeze(['#94a3b8', '#7dd3fc', '#38bdf8', '#34d399', '#f59e0b', '#f43f5e']);

const displayNumber = value => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number).toLocaleString() : '--';
};

function MetricCard({ label, value, unit, onOpen }) {
  return (
    <button type="button" onClick={onOpen} className="rounded-2xl border border-white/10 bg-slate-900/65 p-5 text-left transition-colors hover:border-cyan-300/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300" aria-label={`Open ${label} trends`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
          <p className="mt-3 font-outfit text-2xl font-medium tabular-nums text-slate-100">{value}{value !== '--' && unit ? <span className="ml-1 text-base text-slate-400">{unit}</span> : null}</p>
        </div>
        <ChevronRight className="h-5 w-5 text-slate-500" />
      </div>
    </button>
  );
}

function DailyMovementCard({ activity, selectedHour, onSelectHour, onOpenDetails, onOpenInfo }) {
  const labelState = useChartPointLabel();
  const buckets = getDailyMovementBuckets(activity);
  const hasIntradayData = buckets.length === 24;
  const selected = buckets.find(bucket => bucket.hour === selectedHour) || buckets[0];
  const width = 900;
  const height = 330;
  const padding = { left: 24, right: 106, top: 30, bottom: 64 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const slotWidth = plotWidth / buckets.length;
  const yFor = value => padding.top + ((3 - value) / 3) * plotHeight;
  const activeLevel = selected?.intensity >= 2.34 ? 'High' : selected?.intensity >= 1.34 ? 'Medium' : selected?.intensity > 0 ? 'Low' : null;

  return (
    <section role="button" tabIndex="0" onClick={onOpenDetails} onKeyDown={event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onOpenDetails();
      }
    }} className="w-full cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-slate-900/55 text-left transition-colors hover:border-cyan-300/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300" aria-label="Open Daily Movement trends">
      <div className="flex items-start justify-between gap-4 p-5 sm:p-6">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">Daily Movement</h3>
          <p className="mt-2 text-sm text-slate-400">{hasIntradayData ? `${selected?.label || ''} · ${selected?.activeMinutes || 0} active minutes` : 'Daily activity total · intraday timing unavailable'}</p>
        </div>
        <button type="button" onClick={event => { event.stopPropagation(); onOpenInfo(); }} className="p-2 text-slate-400 hover:text-white" aria-label="Learn about Daily Movement"><Info className="h-5 w-5" /></button>
      </div>
      {hasIntradayData ? (
        <div className="overflow-x-auto border-t border-white/10 px-2 pb-2 scrollbar-hide sm:px-5">
          <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[44rem] w-full" role="img" aria-label="Hourly movement intensity from 12 AM to 11:59 PM">
            {[0, 1, 2, 3].map(value => <line key={value} x1={padding.left} y1={yFor(value)} x2={width - padding.right} y2={yFor(value)} stroke="rgba(148,163,184,0.15)" />)}
            {[['Low', 1], ['Medium', 2], ['High', 3]].map(([label, value]) => <text key={label} x={width - 8} y={yFor(value) + 6} textAnchor="end" fill={activeLevel === label ? '#67e8f9' : 'rgba(203,213,225,0.64)'} fontSize={activeLevel === label ? '20' : '18'} fontWeight={activeLevel === label ? '800' : '500'}>{label}</text>)}
            {buckets.map((bucket, index) => {
              const barWidth = Math.max(5, slotWidth * 0.42);
              const x = padding.left + index * slotWidth + (slotWidth - barWidth) / 2;
              const y = yFor(Math.max(0.06, bucket.intensity));
              const isSelected = bucket.hour === selected?.hour;
              return (
                <g key={bucket.label} role="button" tabIndex="0" aria-label={`Select ${bucket.label}, ${bucket.activeMinutes} active minutes`} onClick={event => { event.stopPropagation(); onSelectHour(bucket.hour); labelState.showClicked(String(bucket.hour)); }} onMouseEnter={() => labelState.showHovered(String(bucket.hour))} onMouseLeave={() => labelState.hideHovered(String(bucket.hour))} onFocus={() => labelState.showHovered(String(bucket.hour))} onBlur={() => labelState.hideHovered(String(bucket.hour))} onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    event.stopPropagation();
                    onSelectHour(bucket.hour);
                    labelState.showClicked(String(bucket.hour));
                  }
                }} className="cursor-pointer outline-none">
                  <rect x={x - 5} y={padding.top} width={barWidth + 10} height={plotHeight} fill="transparent" />
                  <rect x={x} y={y} width={barWidth} height={padding.top + plotHeight - y} rx="3" fill={isSelected ? '#67e8f9' : '#e2e8f0'} opacity={isSelected ? '1' : '0.42'} />
                </g>
              );
            })}
            {buckets.map((bucket, index) => String(bucket.hour) === labelState.activeKey ? (
              <SvgChartPointLabel key={`label-${bucket.hour}`} x={padding.left + index * slotWidth + slotWidth / 2} y={yFor(Math.max(0.06, bucket.intensity))} label={bucket.label} chartWidth={width} chartHeight={height} fading={labelState.fading} />
            ) : null)}
            {[0, 6, 12, 18].map(hour => <text key={hour} x={padding.left + (hour / 24) * plotWidth} y={height - 25} textAnchor={hour === 0 ? 'start' : 'middle'} fill="rgba(148,163,184,0.82)" fontSize="16">{hour === 0 ? '12 AM' : hour === 6 ? '6 AM' : hour === 12 ? '12 PM' : '6 PM'}</text>)}
            <text x={width - padding.right} y={height - 25} textAnchor="end" fill="rgba(148,163,184,0.82)" fontSize="16">11:59 PM</text>
          </svg>
        </div>
      ) : (
        <div className="border-t border-white/10 p-8 text-center">
          <p className="font-outfit text-4xl font-light text-slate-100">{formatActivityDuration((buckets[0]?.activeMinutes || 0) * 60)}</p>
          <p className="mt-2 text-sm text-slate-500">Daily activity total</p>
        </div>
      )}
    </section>
  );
}

function WeeklyBenefitsChart({ weekly, selectedDate, onSelectDate }) {
  const labelState = useChartPointLabel();
  const clipPrefix = useId().replaceAll(':', '');
  const width = 900;
  const height = 350;
  const padding = { left: 66, right: 34, top: 34, bottom: 72 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const values = weekly.days.map(day => weekly.hasHeartRateData
    ? day.metabolicMinutes + day.cardiovascularMinutes
    : day.activityMinutes);
  const maximum = Math.max(30, Math.ceil(Math.max(...values, 0) / 30) * 30);
  const ticks = [0, maximum / 2, maximum];
  const slotWidth = plotWidth / weekly.days.length;
  const yFor = value => padding.top + ((maximum - value) / maximum) * plotHeight;

  return (
    <div className="overflow-x-auto scrollbar-hide">
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[43rem] w-full" role="img" aria-label={weekly.hasHeartRateData ? 'Estimated weekly heart-rate benefit time' : 'Weekly daily activity totals'}>
        {ticks.map(value => (
          <g key={value}>
            <line x1={padding.left} y1={yFor(value)} x2={width - padding.right} y2={yFor(value)} stroke="rgba(148,163,184,0.16)" />
            <text x={padding.left - 10} y={yFor(value) + 6} textAnchor="end" fill="rgba(203,213,225,0.72)" fontSize="16">{Math.round(value)}m</text>
          </g>
        ))}
        {weekly.days.map((day, index) => {
          const barWidth = Math.min(54, slotWidth * 0.55);
          const x = padding.left + index * slotWidth + (slotWidth - barWidth) / 2;
          const metabolic = weekly.hasHeartRateData ? day.metabolicMinutes : day.activityMinutes;
          const cardiovascular = weekly.hasHeartRateData ? day.cardiovascularMinutes : 0;
          const total = metabolic + cardiovascular;
          const metabolicHeight = (metabolic / maximum) * plotHeight;
          const cardiovascularHeight = (cardiovascular / maximum) * plotHeight;
          const isSelected = day.date === selectedDate;
          const selectable = Boolean(onSelectDate);
          const barTop = yFor(total);
          const barHeight = padding.top + plotHeight - barTop;
          const metabolicTop = yFor(metabolic);
          const clipId = `${clipPrefix}-weekly-benefit-${index}`;
          return (
            <g key={day.date} role={selectable ? 'button' : undefined} tabIndex={selectable ? '0' : undefined} aria-label={`${day.label}, ${total} minutes`} onClick={() => { onSelectDate?.(day.date); labelState.showClicked(day.date); }} onMouseEnter={() => labelState.showHovered(day.date)} onMouseLeave={() => labelState.hideHovered(day.date)} onFocus={() => labelState.showHovered(day.date)} onBlur={() => labelState.hideHovered(day.date)} onKeyDown={event => {
              if (selectable && (event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault();
                onSelectDate(day.date);
                labelState.showClicked(day.date);
              }
            }} className={selectable ? 'cursor-pointer outline-none' : undefined}>
              <rect x={x - 8} y={padding.top} width={barWidth + 16} height={plotHeight} fill="transparent" />
              {total > 0 && <defs><clipPath id={clipId}><rect x={x} y={barTop} width={barWidth} height={barHeight} rx="8" /></clipPath></defs>}
              <g clipPath={`url(#${clipId})`}>
                {metabolic > 0 && <rect x={x} y={metabolicTop} width={barWidth} height={metabolicHeight} fill={weekly.hasHeartRateData ? '#7dd3fc' : '#e2e8f0'} opacity="0.9" />}
                {cardiovascular > 0 && <rect x={x} y={barTop} width={barWidth} height={cardiovascularHeight} fill="#f59e0b" opacity="0.95" />}
                {metabolic > 0 && cardiovascular > 0 && <line x1={x} x2={x + barWidth} y1={metabolicTop} y2={metabolicTop} stroke="#020617" strokeOpacity="0.45" strokeWidth="1.5" />}
              </g>
              {isSelected && total > 0 && <rect x={x - 3} y={barTop - 3} width={barWidth + 6} height={barHeight + 6} rx="11" fill="none" stroke="#67e8f9" strokeWidth="4" />}
              <text x={x + barWidth / 2} y={height - 28} textAnchor="middle" fill={isSelected ? '#f8fafc' : 'rgba(148,163,184,0.8)'} fontSize="17" fontWeight={isSelected ? '800' : '600'}>{day.label}</text>
            </g>
          );
        })}
        {weekly.days.map((day, index) => {
          const total = weekly.hasHeartRateData ? day.metabolicMinutes + day.cardiovascularMinutes : day.activityMinutes;
          return total > 0 && day.date === labelState.activeKey ? (
            <SvgChartPointLabel key={`label-${day.date}`} x={padding.left + index * slotWidth + slotWidth / 2} y={yFor(total)} label={formatChartPointLabel(day.date, day.label)} chartWidth={width} chartHeight={height} fading={labelState.fading} />
          ) : null;
        })}
      </svg>
    </div>
  );
}

function WeeklyBenefitsCard({ weekly, selectedDate, onOpenDetails, onOpenInfo }) {
  return (
    <section role="button" tabIndex="0" onClick={onOpenDetails} onKeyDown={event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onOpenDetails();
      }
    }} className="cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-slate-900/55 transition-colors hover:border-cyan-300/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300" aria-label="Open Benefits Totals">
      <div className="flex items-start justify-between gap-4 p-5 sm:p-6">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">Benefits This Week</h2>
          <p className="mt-1 text-sm text-slate-400">{weekly.hasHeartRateData ? 'Estimated benefit time from observed heart-rate samples' : 'Daily activity totals · heart-rate benefit detail unavailable'}</p>
        </div>
        <button type="button" onClick={event => { event.stopPropagation(); onOpenInfo(); }} className="rounded-lg border border-white/10 bg-slate-950/45 p-2 text-slate-400 hover:text-white" aria-label="Learn about long-term activity benefits"><Info className="h-5 w-5" /></button>
      </div>
      <div className="border-t border-white/10 p-3 sm:p-5">
        <WeeklyBenefitsChart weekly={weekly} selectedDate={selectedDate} />
        <div className="mt-2 flex flex-wrap justify-center gap-5 text-xs text-slate-400">
          {weekly.hasHeartRateData ? (
            <>
              <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-sky-300" /> Metabolic benefit</span>
              <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-amber-500" /> Cardiovascular and metabolic benefit</span>
            </>
          ) : <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-slate-200" /> Daily activity total</span>}
        </div>
      </div>
    </section>
  );
}

function WeeklyZoneMinutes({ weekly, onOpenDetails, onOpenInfo }) {
  return (
    <section role="button" tabIndex="0" onClick={onOpenDetails} onKeyDown={event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onOpenDetails();
      }
    }} className="cursor-pointer rounded-2xl border border-white/10 bg-slate-900/55 p-5 transition-colors hover:border-cyan-300/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 sm:p-6" aria-label="Open Weekly Zone Minutes trends">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">Weekly Zone Minutes</h2>
          <p className="mt-2 text-sm text-slate-500">Estimated from observed heart-rate samples</p>
        </div>
        <button type="button" onClick={event => { event.stopPropagation(); onOpenInfo(); }} className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Learn about weekly heart-rate zones"><Info className="h-5 w-5" /></button>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {HEART_RATE_ZONES.map((zone, index) => (
          <div key={zone.label} className="flex items-center gap-3 rounded-xl border border-white/5 bg-slate-950/25 px-4 py-3">
            <span className="h-6 w-1 rounded-full" style={{ backgroundColor: ZONE_COLORS[index] }} aria-hidden="true" />
            <span className="font-outfit text-lg text-slate-100">{zone.label}</span>
            <span className="ml-auto font-outfit text-lg tabular-nums text-slate-300">{weekly.zoneMinutes[index]}m</span>
          </div>
        ))}
      </div>
      {!weekly.hasHeartRateData && <p className="mt-4 text-sm text-slate-500">No heart-rate samples were available for this week.</p>}
    </section>
  );
}

export default function ActivityDetailModal({ appData, selectedDate, initialTarget = 'top', onClose }) {
  const [detailDate, setDetailDate] = useState(selectedDate);
  const [drillMetric, setDrillMetric] = useState(() => (
    initialTarget.startsWith('metric:') ? initialTarget.slice('metric:'.length) : null
  ));
  const [infoTopic, setInfoTopic] = useState(null);
  const [movementDrilldownMode, setMovementDrilldownMode] = useState(initialTarget === 'movement' ? 'day' : null);
  const [isBenefitsDrilldownOpen, setIsBenefitsDrilldownOpen] = useState(initialTarget === 'benefits');
  const [isZoneDrilldownOpen, setIsZoneDrilldownOpen] = useState(initialTarget === 'zones');
  const [selectedMovementHour, setSelectedMovementHour] = useState(0);
  const availableDates = useMemo(() => getAvailableRecordDates(appData.activity), [appData.activity]);
  const activity = appData.activity?.[detailDate]?.[0] || null;
  const contributors = activity?.contributors || {};
  const goalProgress = getGoalProgress(activity);
  const activityTime = getActivityTimeSeconds(activity);
  const weekly = useMemo(() => getWeeklyActivityBenefits(appData, detailDate), [appData, detailDate]);
  const presentation = calendarDates.getDatePresentation(detailDate);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = event => {
      if (
        event.key === 'Escape'
        && !document.querySelector('[data-calendar-dialog="true"]')
        && !document.querySelector('[data-activity-info-dialog="true"]')
        && !document.querySelector('[data-activity-benefits-dialog="true"]')
        && !document.querySelector('[data-activity-movement-dialog="true"]')
        && !document.querySelector('[data-activity-zone-dialog="true"]')
        && !document.querySelector('[data-metric-drilldown="true"]')
      ) onClose();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [onClose]);

  return (
    <>
      <motion.div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/85 p-3 backdrop-blur-md sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} data-activity-detail-dialog="true">
        <motion.div role="dialog" aria-modal="true" aria-label="Activity details" className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-white/10 bg-slate-950/95 shadow-2xl shadow-black/60" initial={{ opacity: 0, scale: 0.98, y: 14 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 14 }} transition={{ duration: 0.18 }} onMouseDown={event => event.stopPropagation()}>
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-slate-950/95 px-5 py-4 backdrop-blur-xl sm:px-7">
            <div>
              <h2 className="font-outfit text-xl font-semibold text-slate-100">Activity</h2>
              <p className="mt-0.5 text-xs text-slate-500">{presentation.weekdayLong}, {presentation.monthLong} {presentation.dayOfMonth}</p>
            </div>
            <div className="flex items-center gap-1">
              <CalendarPicker availableDates={availableDates} selectedDate={detailDate} onSelect={setDetailDate} calendarScope="nested" buttonClassName="rounded-xl p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-100" buttonLabel="Choose Activity date" />
              <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Close activity details"><X className="h-5 w-5" /></button>
            </div>
          </header>

          <div className="space-y-8 p-5 sm:p-7">
            <section>
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-outfit text-xl font-semibold text-slate-100">Contributors</h2>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Activity score</p>
                  <p className="font-outfit text-3xl font-semibold tabular-nums" style={{ color: getScoreColor(activity?.score) }}>{activity?.score ?? '--'}</p>
                </div>
              </div>
              {activity ? (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {CONTRIBUTOR_DEFINITIONS.map(([key, label, metricKey]) => <SubScoreBar key={key} label={label} value={contributors[key]} onOpen={() => setDrillMetric(metricKey)} />)}
                </div>
              ) : <UnavailableState title="Activity contributors unavailable" description="No daily activity score was available for this date." />}
            </section>

            <section>
              <h2 className="font-outfit text-xl font-semibold text-slate-100">Key Metrics</h2>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <MetricCard label="Goal Progress" value={goalProgress === null ? '--' : goalProgress} unit="%" onOpen={() => setDrillMetric('activityGoalProgress')} />
                <MetricCard label="Total Burn" value={displayNumber(activity?.total_calories)} unit="kcal" onOpen={() => setDrillMetric('activityTotalBurn')} />
                <MetricCard label="Activity Time" value={activity ? formatActivityDuration(activityTime) : '--'} onOpen={() => setDrillMetric('activityTime')} />
                <MetricCard label="Steps" value={displayNumber(activity?.steps)} onOpen={() => setDrillMetric('activitySteps')} />
              </div>
            </section>

            <section>
              <h2 className="font-outfit text-xl font-semibold text-slate-100">Activities</h2>
              <div className="mt-4">
                <DailyMovementCard
                  activity={activity}
                  selectedHour={selectedMovementHour}
                  onSelectHour={setSelectedMovementHour}
                  onOpenDetails={() => setMovementDrilldownMode('day')}
                  onOpenInfo={() => setInfoTopic('movement')}
                />
              </div>
            </section>

            <section>
              <WeeklyBenefitsCard
                weekly={weekly}
                selectedDate={detailDate}
                onOpenDetails={() => setIsBenefitsDrilldownOpen(true)}
                onOpenInfo={() => setInfoTopic('benefits')}
              />
            </section>

            <WeeklyZoneMinutes weekly={weekly} onOpenDetails={() => setIsZoneDrilldownOpen(true)} onOpenInfo={() => setInfoTopic('zones')} />
          </div>
        </motion.div>
      </motion.div>
      <AnimatePresence>{infoTopic && <ActivityInfoModal topic={infoTopic} onClose={() => setInfoTopic(null)} />}</AnimatePresence>
      <AnimatePresence>{drillMetric && <MetricDrilldownModal appData={appData} metricKey={drillMetric} initialDate={detailDate} onClose={() => setDrillMetric(null)} />}</AnimatePresence>
      <AnimatePresence>{movementDrilldownMode && <ActivityMovementDrilldownModal appData={appData} initialDate={detailDate} initialMode={movementDrilldownMode} onClose={() => setMovementDrilldownMode(null)} />}</AnimatePresence>
      <AnimatePresence>{isBenefitsDrilldownOpen && <ActivityBenefitsDrilldownModal appData={appData} initialDate={detailDate} onClose={() => setIsBenefitsDrilldownOpen(false)} />}</AnimatePresence>
      <AnimatePresence>{isZoneDrilldownOpen && <ActivityZoneDrilldownModal appData={appData} initialDate={detailDate} onClose={() => setIsZoneDrilldownOpen(false)} />}</AnimatePresence>
    </>
  );
}
