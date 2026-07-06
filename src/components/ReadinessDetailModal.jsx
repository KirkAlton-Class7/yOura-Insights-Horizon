import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import CalendarPicker from './CalendarPicker';
import { formatChartPointLabel, SvgChartPointLabel, useChartPointLabel } from './ChartPointLabel';
import MetricDrilldownModal from './MetricDrilldownModal';
import SubScoreBar from './SubScoreBar';
import UnavailableState from './UnavailableState';
import useSwipePaging from '../hooks/useSwipePaging';
import { avoidCircleLabelCollision } from '../utils/chartGeometry';
import { getScoreColor } from '../utils/colors';
import { calendarDates } from '../utils/dateService';
import { getAvailableRecordDates } from '../utils/dataAvailability';
import {
  getLongSleepRecord,
  getReadinessDetailPeriod,
  getReadinessPeriodStart,
  parseMetricSeries,
} from '../utils/readinessDetails';

const CONTRIBUTOR_DEFINITIONS = Object.freeze([
  ['hrv_balance', 'HRV Balance', 'readinessHrvBalanceContributor'],
  ['resting_heart_rate', 'Resting Heart Rate', 'readinessRestingHeartRateContributor'],
  ['recovery_index', 'Recovery Index', 'readinessRecoveryIndexContributor'],
  ['body_temperature', 'Body Temperature', 'readinessBodyTemperatureContributor'],
  ['previous_night', 'Previous Night', 'readinessPreviousNightContributor'],
  ['previous_day_activity', 'Previous Day Activity', 'readinessPreviousDayActivityContributor'],
  ['sleep_balance', 'Sleep Balance', 'readinessSleepBalanceContributor'],
  ['activity_balance', 'Activity Balance', 'readinessActivityBalanceContributor'],
  ['sleep_regularity', 'Sleep Regularity', 'readinessSleepRegularityContributor'],
]);

const displayNumber = (value, decimals = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(decimals) : '--';
};

function ReadinessHistory({
  history,
  selectedDate,
  onSelectDate,
  onPreviousPeriod,
  onNextPeriod,
  canPreviousPeriod,
  canNextPeriod,
}) {
  const labelState = useChartPointLabel();
  const swipePaging = useSwipePaging({
    canPrevious: canPreviousPeriod,
    canNext: canNextPeriod,
    onPrevious: onPreviousPeriod,
    onNext: onNextPeriod,
  });
  const scrollContainerRef = useRef(null);
  const restingValues = history
    .map(day => day.restingHeartRate)
    .filter(value => value !== null);
  const restingMinimum = restingValues.length ? Math.min(...restingValues) : 45;
  const restingMaximum = restingValues.length ? Math.max(...restingValues) : 75;
  const restingRange = Math.max(8, restingMaximum - restingMinimum);
  const width = 1100;
  const height = 320;
  const baseline = 245;
  const barMaximumHeight = 165;
  const slotWidth = width / history.length;
  const linePoints = history
    .filter(day => day.restingHeartRate !== null)
    .map((day) => {
      const index = history.findIndex(candidate => candidate.date === day.date);
      const x = slotWidth * index + slotWidth / 2;
      const y = 185 - ((day.restingHeartRate - restingMinimum) / restingRange) * 85;
      return `${x},${y}`;
    })
    .join(' ');
  const selected = calendarDates.getDatePresentation(selectedDate);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const selectedIndex = history.findIndex(day => day.date === selectedDate);
    if (selectedIndex < 0) return;
    const slotWidthPixels = container.scrollWidth / history.length;
    container.scrollLeft = Math.max(
      0,
      slotWidthPixels * (selectedIndex + 0.5) - container.clientWidth / 2,
    );
  }, [history, selectedDate]);

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950/35 p-4 sm:p-6">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Overview</p>
        <h3 className="mt-1 font-outfit text-2xl font-semibold text-slate-100">
          {selected.weekdayShort}, {selected.monthShort} {selected.dayOfMonth}
        </h3>
      </div>
      <div className="mt-4 flex touch-pan-y items-center gap-2" {...swipePaging}>
        <motion.button
          type="button"
          onClick={onPreviousPeriod}
          disabled={!canPreviousPeriod}
          className="h-12 w-10 flex-shrink-0 rounded-xl border border-white/10 bg-slate-800/70 text-slate-300 transition-colors hover:border-white/25 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-25"
          whileTap={canPreviousPeriod ? { scale: 0.95 } : undefined}
          aria-label="Previous two weeks"
        >
          <ChevronLeft className="mx-auto h-5 w-5" />
        </motion.button>
        <div ref={scrollContainerRef} className="min-w-0 flex-1 overflow-x-auto pb-2 scrollbar-hide">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="min-w-[52rem] w-full"
            role="img"
            aria-label="Readiness scores and resting heart rate for a two-week Sunday-through-Saturday period"
          >
          <line x1="0" y1={baseline} x2={width} y2={baseline} stroke="rgba(148,163,184,0.22)" />
            {history.map((day, index) => {
            const score = day.readinessScore;
            const x = slotWidth * index + slotWidth * 0.16;
            const barWidth = slotWidth * 0.68;
            const barHeight = score === null ? 5 : Math.max(12, (score / 100) * barMaximumHeight);
            const circleY = day.restingHeartRate === null
              ? null
              : 185 - ((day.restingHeartRate - restingMinimum) / restingRange) * 85;
            const scoreLabelY = avoidCircleLabelCollision(
              baseline - barHeight - 10,
              circleY,
              { minimum: 20, maximum: baseline - 12 },
            );
            const presentation = calendarDates.getDatePresentation(day.date);
            const isAvailable = day.readinessScore !== null;
            return (
              <g
                key={day.date}
                role={isAvailable ? 'button' : undefined}
                tabIndex={isAvailable ? 0 : undefined}
                aria-label={isAvailable ? `Select ${presentation.weekdayLong}, ${day.date}` : `${day.date}, no readiness data`}
                onClick={isAvailable ? () => { onSelectDate(day.date); labelState.showClicked(day.date); } : undefined}
                onMouseEnter={isAvailable ? () => labelState.showHovered(day.date) : undefined}
                onMouseLeave={isAvailable ? () => labelState.hideHovered(day.date) : undefined}
                onFocus={isAvailable ? () => labelState.showHovered(day.date) : undefined}
                onBlur={isAvailable ? () => labelState.hideHovered(day.date) : undefined}
                onKeyDown={isAvailable ? event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelectDate(day.date);
                    labelState.showClicked(day.date);
                  }
                } : undefined}
                className={isAvailable ? 'cursor-pointer outline-none' : undefined}
              >
                <rect
                  x={slotWidth * index}
                  y="0"
                  width={slotWidth}
                  height={height}
                  fill="transparent"
                />
                <rect
                  x={x}
                  y={baseline - barHeight}
                  width={barWidth}
                  height={barHeight}
                  rx="9"
                  fill={score === null ? 'rgba(148,163,184,0.12)' : getScoreColor(score)}
                  opacity={day.isSelected ? 1 : 0.58}
                  stroke={day.isSelected ? 'rgba(248,250,252,0.9)' : 'transparent'}
                  strokeWidth="3"
                />
                {score !== null && (
                  <text
                    x={slotWidth * index + slotWidth / 2}
                    y={scoreLabelY}
                    textAnchor="middle"
                    fill="rgba(226,232,240,0.85)"
                    fontSize="19"
                    fontWeight="700"
                  >
                    {score}
                  </text>
                )}
                <text
                  x={slotWidth * index + slotWidth / 2}
                  y="276"
                  textAnchor="middle"
                  fill={day.isSelected ? '#67e8f9' : 'rgba(148,163,184,0.72)'}
                  fontSize="17"
                  fontWeight={day.isSelected ? '700' : '500'}
                >
                  {presentation.weekdayShort}
                </text>
                <text
                  x={slotWidth * index + slotWidth / 2}
                  y="302"
                  textAnchor="middle"
                  fill={day.isSelected ? '#67e8f9' : 'rgba(148,163,184,0.72)'}
                  fontSize="15"
                  fontWeight={day.isSelected ? '700' : '500'}
                >
                  {presentation.month}/{presentation.dayOfMonth}
                </text>
              </g>
            );
          })}
          {linePoints && (
            <polyline
              points={linePoints}
              fill="none"
              stroke="rgba(226,232,240,0.62)"
              strokeWidth="5"
              strokeDasharray="9 8"
              strokeLinejoin="round"
              pointerEvents="none"
            />
          )}
          {history.map((day, index) => {
            if (day.restingHeartRate === null) return null;
            const x = slotWidth * index + slotWidth / 2;
            const y = 185 - ((day.restingHeartRate - restingMinimum) / restingRange) * 85;
            return (
              <g key={`${day.date}-rhr`} pointerEvents="none">
                <circle cx={x} cy={y} r="21" fill="#e2e8f0" stroke={day.isSelected ? '#67e8f9' : '#cbd5e1'} strokeWidth="4" />
                <text x={x} y={y + 7} textAnchor="middle" fill="#0f172a" fontSize="20" fontWeight="800">
                  {Math.round(day.restingHeartRate)}
                </text>
              </g>
            );
          })}
          {history.map((day, index) => day.date === labelState.activeKey && day.readinessScore !== null ? (() => {
            const scoreHeight = Math.max(12, (day.readinessScore / 100) * barMaximumHeight);
            const pointY = day.restingHeartRate === null
              ? baseline - scoreHeight
              : 185 - ((day.restingHeartRate - restingMinimum) / restingRange) * 85;
            return <SvgChartPointLabel key={`label-${day.date}`} x={slotWidth * index + slotWidth / 2} y={pointY} label={formatChartPointLabel(day.date)} chartWidth={width} chartHeight={height} fading={labelState.fading} />;
          })() : null)}
          </svg>
        </div>
        <motion.button
          type="button"
          onClick={onNextPeriod}
          disabled={!canNextPeriod}
          className="h-12 w-10 flex-shrink-0 rounded-xl border border-white/10 bg-slate-800/70 text-slate-300 transition-colors hover:border-white/25 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-25"
          whileTap={canNextPeriod ? { scale: 0.95 } : undefined}
          aria-label="Next two weeks"
        >
          <ChevronRight className="mx-auto h-5 w-5" />
        </motion.button>
      </div>
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-slate-400">
        <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-cyan-400" /> Readiness</span>
        <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-slate-200" /> Resting HR</span>
      </div>
    </section>
  );
}

function KeyMetric({ label, value, unit, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="rounded-2xl border border-white/10 bg-slate-900/65 p-5 text-left transition-colors hover:border-cyan-300/35 hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
      aria-label={`Open ${label} trends`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-3 font-outfit text-2xl font-medium tabular-nums text-slate-100">
        {value}{value !== '--' && unit ? <span className="ml-1 text-base text-slate-400">{unit}</span> : null}
      </p>
    </button>
  );
}

export function MetricTrendChart({
  title,
  headline,
  unit,
  secondaryLabel,
  secondaryValue,
  baselineValue,
  series,
  startTimestamp,
  endTimestamp,
  axisKind,
  onOpen,
}) {
  if (!series) {
    return (
      <section className="relative rounded-2xl border border-white/10 bg-slate-900/55 p-5">
        {onOpen && (
          <button
            type="button"
            onClick={onOpen}
            className="absolute inset-0 z-10 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-300"
            aria-label={`Open ${title} trends`}
          />
        )}
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">{title}</h3>
        <UnavailableState title={`${title} chart unavailable`} description="This export does not include the detailed overnight series." compact />
      </section>
    );
  }

  const width = 820;
  const height = 260;
  const paddingX = 34;
  const paddingTop = 20;
  const paddingBottom = 48;
  const baseline = Number(baselineValue);
  const allValues = Number.isFinite(baseline) ? [...series.values, baseline] : series.values;
  const minimum = Math.min(...allValues);
  const maximum = Math.max(...allValues);
  const step = axisKind === 'hrv' ? 20 : 10;
  const chartMinimum = axisKind === 'hrv' ? 0 : Math.floor(minimum / step) * step;
  const chartMaximum = axisKind === 'hrv'
    ? Math.max(100, Math.ceil(maximum / step) * step)
    : Math.max(chartMinimum + 30, Math.ceil(maximum / step) * step);
  const range = Math.max(1, chartMaximum - chartMinimum);
  const chartHeight = height - paddingTop - paddingBottom;
  const xFor = index => paddingX + (index / Math.max(1, series.points.length - 1)) * (width - paddingX * 2);
  const yFor = value => paddingTop + ((chartMaximum - value) / range) * chartHeight;
  const observedPoints = series.points.filter(point => point.value !== null);
  const path = observedPoints.map(point => `${xFor(point.index)},${yFor(point.value)}`).join(' ');
  const gridValues = Array.from(
    { length: Math.ceil((chartMaximum - chartMinimum) / step) },
    (_, index) => chartMinimum + index * step,
  );
  const timeTicks = calendarDates.getTimeAxisTicks(startTimestamp, endTimestamp);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/55 transition-colors hover:border-cyan-300/35">
      {onOpen && (
        <button
          type="button"
          onClick={onOpen}
          className="absolute inset-0 z-10 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-300"
          aria-label={`Open ${title} trends`}
        />
      )}
      <div className="p-5 sm:p-6">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">{title}</h3>
        <div className="mt-3 flex flex-wrap items-end gap-x-3 gap-y-1">
          <span className="font-outfit text-4xl font-light tabular-nums text-slate-100">{headline}</span>
          <span className="pb-1 text-lg text-slate-300">{unit}</span>
        </div>
        <p className="mt-1 text-sm text-slate-400">{secondaryLabel} {secondaryValue} {unit}</p>
      </div>
      <div className="border-t border-white/10 px-2 pb-4 sm:px-5">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label={`${title} overnight trend`}>
          {gridValues.map(value => (
            <g key={value}>
              <line x1={paddingX} y1={yFor(value)} x2={width - paddingX} y2={yFor(value)} stroke="rgba(148,163,184,0.16)" />
              <text x={width - 4} y={yFor(value) + 6} textAnchor="end" fill="rgba(148,163,184,0.8)" fontSize="17">
                {Math.round(value)}
              </text>
            </g>
          ))}
          {timeTicks.map(tick => {
            const x = paddingX + tick.position * (width - paddingX * 2);
            return (
              <g key={`${tick.position}-${tick.label}`}>
                <line x1={x} y1={paddingTop} x2={x} y2={height - paddingBottom} stroke="rgba(148,163,184,0.11)" />
                <text
                  x={x}
                  y={height - 12}
                  textAnchor={tick.position === 0 ? 'start' : tick.position === 1 ? 'end' : 'middle'}
                  fill="rgba(148,163,184,0.78)"
                  fontSize="16"
                >
                  {tick.label}
                </text>
              </g>
            );
          })}
          {Number.isFinite(baseline) && (
            <>
              <line
                x1={paddingX}
                y1={yFor(baseline)}
                x2={width - paddingX}
                y2={yFor(baseline)}
                stroke="rgba(226,232,240,0.88)"
                strokeWidth="2"
                strokeDasharray="5 7"
              />
              <text
                x={paddingX - 6}
                y={yFor(baseline) - 8}
                textAnchor="end"
                fill="#f1f5f9"
                fontSize="17"
              >
                {Math.round(baseline)}
              </text>
            </>
          )}
          <polyline points={path} fill="none" stroke="#e2e8f0" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
          {observedPoints.length > 0 && (
            <>
              <circle cx={xFor(observedPoints[0].index)} cy={yFor(observedPoints[0].value)} r="5" fill="#f8fafc" />
              <circle cx={xFor(observedPoints[observedPoints.length - 1].index)} cy={yFor(observedPoints[observedPoints.length - 1].value)} r="5" fill="#f8fafc" />
            </>
          )}
        </svg>
      </div>
    </section>
  );
}

export default function ReadinessDetailModal({ appData, selectedDate, initialTarget = 'top', onClose }) {
  const [drillMetric, setDrillMetric] = useState(() => (
    initialTarget.startsWith('metric:') ? initialTarget.slice('metric:'.length) : null
  ));
  const [detailDate, setDetailDate] = useState(selectedDate);
  const [periodStart, setPeriodStart] = useState(() => getReadinessPeriodStart(selectedDate));
  const availableReadinessDates = useMemo(
    () => getAvailableRecordDates(appData.readiness),
    [appData.readiness],
  );
  const readiness = appData.readiness?.[detailDate]?.[0] || null;
  const sleepModel = getLongSleepRecord(appData.sleepmodel?.[detailDate]);
  const history = useMemo(
    () => getReadinessDetailPeriod(appData, periodStart, detailDate),
    [appData, detailDate, periodStart],
  );
  const heartRateSeries = useMemo(() => parseMetricSeries(sleepModel?.heart_rate), [sleepModel]);
  const hrvSeries = useMemo(() => parseMetricSeries(sleepModel?.hrv), [sleepModel]);
  const contributors = readiness?.contributors || {};
  const periodEnd = calendarDates.addDays(periodStart, 13);
  const canPreviousPeriod = availableReadinessDates.some(date => date < periodStart);
  const canNextPeriod = availableReadinessDates.some(date => date > periodEnd);

  const selectDetailDate = date => {
    setDetailDate(date);
    if (date < periodStart || date > periodEnd) {
      setPeriodStart(getReadinessPeriodStart(date));
    }
  };

  const shiftPeriod = direction => {
    const selectedIndex = history.findIndex(day => day.date === detailDate);
    const nextStart = calendarDates.addDays(periodStart, direction * 14);
    const nextEnd = calendarDates.addDays(nextStart, 13);
    const preferredDate = calendarDates.addDays(nextStart, Math.max(0, selectedIndex));
    const availableInPeriod = availableReadinessDates.filter(date => date >= nextStart && date <= nextEnd);
    const nextDate = availableInPeriod.includes(preferredDate)
      ? preferredDate
      : availableInPeriod[0] || preferredDate;
    setPeriodStart(nextStart);
    setDetailDate(nextDate);
  };

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = event => {
      if (
        event.key === 'Escape'
        && !document.querySelector('[data-calendar-dialog="true"]')
        && !document.querySelector('[data-metric-drilldown="true"]')
      ) onClose();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [onClose]);

  const lowestHeartRate = displayNumber(sleepModel?.lowest_heart_rate);
  const averageHeartRate = displayNumber(sleepModel?.average_heart_rate);
  const averageHrv = displayNumber(sleepModel?.average_hrv);
  const maximumHrv = hrvSeries ? displayNumber(Math.max(...hrvSeries.values)) : '--';
  const temperature = displayNumber(readiness?.temperature_deviation, 2);
  const respiratoryRate = displayNumber(sleepModel?.average_breath, 1);

  return (
    <>
      <motion.div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/85 p-3 backdrop-blur-md sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Readiness details"
        className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-white/10 bg-slate-950/95 shadow-2xl shadow-black/60"
        initial={{ opacity: 0, scale: 0.98, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 14 }}
        transition={{ duration: 0.18 }}
        onMouseDown={event => event.stopPropagation()}
      >
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-slate-950/95 px-5 py-4 backdrop-blur-xl sm:px-7">
          <div>
            <h2 className="font-outfit text-xl font-semibold text-slate-100">Readiness</h2>
            <p className="mt-0.5 text-xs text-slate-500">Daily contributors and overnight recovery details</p>
          </div>
          <div className="flex items-center gap-1">
            <CalendarPicker
              availableDates={availableReadinessDates}
              selectedDate={detailDate}
              onSelect={selectDetailDate}
              calendarScope="nested"
              buttonClassName="rounded-xl p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-100"
              buttonLabel="Choose Readiness date"
            />
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-100"
              aria-label="Close readiness details"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="space-y-8 p-5 sm:p-7">
          <ReadinessHistory
            history={history}
            selectedDate={detailDate}
            onSelectDate={selectDetailDate}
            onPreviousPeriod={() => shiftPeriod(-1)}
            onNextPeriod={() => shiftPeriod(1)}
            canPreviousPeriod={canPreviousPeriod}
            canNextPeriod={canNextPeriod}
          />

          <section>
            <h2 className="font-outfit text-xl font-semibold text-slate-100">Contributors</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {CONTRIBUTOR_DEFINITIONS.map(([key, label, metricKey]) => (
                <SubScoreBar key={key} label={label} value={contributors[key]} onOpen={() => setDrillMetric(metricKey)} />
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-outfit text-xl font-semibold text-slate-100">Key Metrics</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <KeyMetric label="Resting Heart Rate" value={lowestHeartRate} unit="bpm" onOpen={() => setDrillMetric('restingHeartRate')} />
              <KeyMetric label="Heart Rate Variability" value={averageHrv} unit="ms" onOpen={() => setDrillMetric('averageHrv')} />
              <KeyMetric label="Body Temperature" value={temperature} unit="°C" onOpen={() => setDrillMetric('bodyTemperature')} />
              <KeyMetric label="Respiratory Rate" value={respiratoryRate} unit="/ min" onOpen={() => setDrillMetric('respiratoryRate')} />
            </div>
          </section>

          <section>
            <h2 className="font-outfit text-xl font-semibold text-slate-100">Details</h2>
            <div className="mt-4 space-y-4">
              <MetricTrendChart
                title="Lowest Heart Rate"
                headline={lowestHeartRate}
                unit="bpm"
                secondaryLabel="Average"
                secondaryValue={averageHeartRate}
                baselineValue={averageHeartRate}
                series={heartRateSeries}
                startTimestamp={sleepModel?.bedtime_start}
                endTimestamp={sleepModel?.bedtime_end}
                axisKind="heartRate"
                onOpen={() => setDrillMetric('restingHeartRate')}
              />
              <MetricTrendChart
                title="Average HRV"
                headline={averageHrv}
                unit="ms"
                secondaryLabel="Max"
                secondaryValue={maximumHrv}
                baselineValue={averageHrv}
                series={hrvSeries}
                startTimestamp={sleepModel?.bedtime_start}
                endTimestamp={sleepModel?.bedtime_end}
                axisKind="hrv"
                onOpen={() => setDrillMetric('averageHrv')}
              />
            </div>
          </section>
        </div>
      </motion.div>
      </motion.div>
      <AnimatePresence>
        {drillMetric && (
          <MetricDrilldownModal
            appData={appData}
            metricKey={drillMetric}
            initialDate={detailDate}
            onClose={() => setDrillMetric(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
