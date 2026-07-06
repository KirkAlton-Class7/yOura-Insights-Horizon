import { useEffect, useId, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import CalendarPicker from './CalendarPicker';
import { formatChartPointLabel, SvgChartPointLabel, useChartPointLabel } from './ChartPointLabel';
import TrendPeriodFooter from './TrendPeriodFooter';
import UnavailableState from './UnavailableState';
import { calendarDates } from '../utils/dateService';
import { getAvailableRecordDates } from '../utils/dataAvailability';
import { formatActivityDuration, getDailyHeartRateZoneMinutes, HEART_RATE_ZONES } from '../utils/activityDetails';
import { getTrendPeriods, recordsInPeriod, TREND_DEFAULT_RANGES, TREND_RANGE_CONFIG } from '../utils/trendRanges';
import { useToast } from '../context/toast';

const ZONE_COLORS = Object.freeze(['#94a3b8', '#7dd3fc', '#38bdf8', '#34d399', '#f59e0b', '#f43f5e']);

const getZonePoints = (appData, mode, anchorDate, range) => getTrendPeriods(mode, anchorDate, range).map(period => {
  const zoneMinutes = getDailyHeartRateZoneMinutes(recordsInPeriod(appData.heartrate, period.startDate, period.endDate));
  return Object.freeze({
    ...period,
    zoneMinutes,
    total: zoneMinutes.reduce((sum, minutes) => sum + minutes, 0),
  });
});

const getHourlyZonePoints = (appData, date, aggregationHours = TREND_DEFAULT_RANGES.day) => Array.from({ length: Math.ceil(24 / aggregationHours) }, (_, index) => {
  const hour = index * aggregationHours;
  const endHour = Math.min(24, hour + aggregationHours);
  const records = (appData.heartrate?.[date] || []).filter(record => {
    const match = String(record.timestamp || '').match(/T(\d{2}):/);
    return match && Number(match[1]) >= hour && Number(match[1]) < endHour;
  });
  const zoneMinutes = getDailyHeartRateZoneMinutes(records);
  return Object.freeze({
    key: String(hour),
    label: `${hour % 12 || 12} ${hour < 12 ? 'AM' : 'PM'}–${endHour === 24 ? '11:59 PM' : `${endHour % 12 || 12} ${endHour < 12 ? 'AM' : 'PM'}`}`,
    zoneMinutes,
    total: zoneMinutes.reduce((sum, minutes) => sum + minutes, 0),
  });
});

const getLatestObservedHourKey = (appData, date, aggregationHours = TREND_DEFAULT_RANGES.day) => {
  const points = getHourlyZonePoints(appData, date, aggregationHours);
  for (let index = points.length - 1; index >= 0; index -= 1) {
    if (points[index].total > 0) return points[index].key;
  }
  return '0';
};

function ZoneChart({ points, selectedKey, onSelect }) {
  const labelState = useChartPointLabel();
  const clipPrefix = useId().replaceAll(':', '');
  const observed = points.filter(point => point.total > 0);
  if (!observed.length) return <UnavailableState title="Zone minutes unavailable" description="No heart-rate samples were available for this period." />;
  const width = 980;
  const height = 410;
  const padding = { left: 66, right: 34, top: 34, bottom: 78 };
  const maximum = Math.max(30, Math.ceil(Math.max(...observed.map(point => point.total)) / 30) * 30);
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const slotWidth = plotWidth / points.length;
  const yFor = value => padding.top + ((maximum - value) / maximum) * plotHeight;
  const ticks = [0, maximum / 2, maximum];
  const labelEvery = Math.max(1, Math.ceil(points.length / 10));

  return (
    <div className="overflow-x-auto scrollbar-hide">
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[46rem] w-full" role="img" aria-label="Heart-rate zone minutes by date">
        {ticks.map(value => (
          <g key={value}>
            <line x1={padding.left} y1={yFor(value)} x2={width - padding.right} y2={yFor(value)} stroke="rgba(148,163,184,0.16)" />
            <text x={padding.left - 10} y={yFor(value) + 6} textAnchor="end" fill="rgba(203,213,225,0.72)" fontSize="16">{Math.round(value)}m</text>
          </g>
        ))}
        {points.map((point, index) => {
          const barWidth = Math.max(6, Math.min(58, slotWidth * 0.58));
          const x = padding.left + index * slotWidth + (slotWidth - barWidth) / 2;
          const isSelected = point.key === selectedKey;
          const positiveZoneIndexes = point.zoneMinutes.reduce((indexes, minutes, zoneIndex) => (
            minutes > 0 ? [...indexes, zoneIndex] : indexes
          ), []);
          const lastZoneIndex = positiveZoneIndexes.at(-1);
          const barTop = yFor(point.total);
          const barHeight = padding.top + plotHeight - barTop;
          const clipId = `${clipPrefix}-zone-bar-${index}`;
          let accumulated = 0;
          const segments = point.zoneMinutes.map((minutes, zoneIndex) => {
            const segmentBottom = accumulated;
            accumulated += minutes;
            return { minutes, zoneIndex, segmentBottom, segmentTop: accumulated };
          });
          return (
            <g key={point.key} role="button" tabIndex="0" aria-label={`Select ${point.label}, ${point.total} total zone minutes`} onClick={() => { onSelect(point.key); labelState.showClicked(point.key); }} onMouseEnter={() => labelState.showHovered(point.key)} onMouseLeave={() => labelState.hideHovered(point.key)} onFocus={() => labelState.showHovered(point.key)} onBlur={() => labelState.hideHovered(point.key)} onKeyDown={event => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onSelect(point.key);
                labelState.showClicked(point.key);
              }
            }} className="cursor-pointer outline-none">
              <rect x={x - 6} y={padding.top} width={barWidth + 12} height={plotHeight} fill="transparent" />
              {point.total > 0 && (
                <defs>
                  <clipPath id={clipId}>
                    <rect x={x} y={barTop} width={barWidth} height={barHeight} rx="7" />
                  </clipPath>
                </defs>
              )}
              <g clipPath={`url(#${clipId})`}>
                {segments.map(({ minutes, zoneIndex, segmentBottom, segmentTop }) => minutes > 0 ? (
                  <rect
                    key={HEART_RATE_ZONES[zoneIndex].label}
                    x={x}
                    y={yFor(segmentTop)}
                    width={barWidth}
                    height={Math.max(2, yFor(segmentBottom) - yFor(segmentTop))}
                    fill={ZONE_COLORS[zoneIndex]}
                    opacity={isSelected ? '1' : '0.82'}
                  />
                ) : null)}
                {segments.map(({ minutes, zoneIndex, segmentTop }) => minutes > 0 && zoneIndex !== lastZoneIndex ? (
                  <line key={`separator-${zoneIndex}`} x1={x} x2={x + barWidth} y1={yFor(segmentTop)} y2={yFor(segmentTop)} stroke="#020617" strokeOpacity="0.55" strokeWidth="1.5" />
                ) : null)}
              </g>
              {isSelected && point.total > 0 && <rect x={x - 3} y={barTop - 3} width={barWidth + 6} height={barHeight + 6} rx="10" fill="none" stroke="#67e8f9" strokeWidth="4" />}
              {(index % labelEvery === 0 || index === points.length - 1) && <text x={x + barWidth / 2} y={height - 28} textAnchor="middle" fill={isSelected ? '#f8fafc' : 'rgba(148,163,184,0.78)'} fontSize="16" fontWeight={isSelected ? '800' : '600'}>{point.label}</text>}
            </g>
          );
        })}
        {points.map((point, index) => point.total > 0 && point.key === labelState.activeKey ? (
          <SvgChartPointLabel key={`label-${point.key}`} x={padding.left + index * slotWidth + slotWidth / 2} y={yFor(point.total)} label={formatChartPointLabel(point.key, point.label)} chartWidth={width} chartHeight={height} fading={labelState.fading} />
        ) : null)}
      </svg>
    </div>
  );
}

function ActivityZoneContent({ appData, initialDate, onClose }) {
  const { showToast } = useToast();
  const [mode, setMode] = useState('week');
  const [anchorDate, setAnchorDate] = useState(initialDate);
  const [selectedKey, setSelectedKey] = useState(initialDate);
  const [ranges, setRanges] = useState(() => ({ ...TREND_DEFAULT_RANGES }));
  const [rangeDrafts, setRangeDrafts] = useState(() => Object.fromEntries(
    Object.entries(TREND_DEFAULT_RANGES).map(([key, value]) => [key, String(value)]),
  ));
  const availableDates = useMemo(() => getAvailableRecordDates(
    appData.heartrate,
    record => Number.isFinite(Number(record?.bpm)),
  ), [appData.heartrate]);
  const points = useMemo(() => mode === 'day' ? getHourlyZonePoints(appData, anchorDate, ranges.day) : getZonePoints(appData, mode, anchorDate, ranges[mode]), [anchorDate, appData, mode, ranges]);
  const selected = points.find(point => point.key === selectedKey) || points.find(point => point.key === anchorDate) || points.findLast(point => point.total > 0);
  const earliest = availableDates[0];
  const latest = availableDates.at(-1);
  const windowStart = mode === 'day' ? anchorDate : points[0]?.startDate;
  const windowEnd = mode === 'day' ? anchorDate : points.at(-1)?.endDate;
  const canPrevious = Boolean(earliest && earliest < windowStart);
  const canNext = Boolean(latest && latest > windowEnd);

  useEffect(() => {
    const closeOnEscape = event => {
      if (event.key === 'Escape' && !document.querySelector('[data-calendar-dialog="true"]')) {
        event.stopImmediatePropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  const changeMode = nextMode => {
    setMode(nextMode);
    setAnchorDate(initialDate);
    setSelectedKey(nextMode === 'day' ? getLatestObservedHourKey(appData, initialDate, ranges.day) : initialDate);
  };

  const shift = direction => {
    let nextDate;
    if (mode === 'day') {
      const currentIndex = availableDates.indexOf(anchorDate);
      nextDate = availableDates[currentIndex + direction];
    } else if (mode === 'week') nextDate = calendarDates.addDays(anchorDate, direction * ranges.week * 7);
    else nextDate = calendarDates.addDateMonths(anchorDate, direction * ranges.month);
    if (nextDate) {
      setAnchorDate(nextDate);
      setSelectedKey(mode === 'day' ? getLatestObservedHourKey(appData, nextDate, ranges.day) : nextDate);
    }
  };

  const commitRange = () => {
    const config = mode === 'day' ? { minimum: 3, maximum: 24, unit: 'hours' } : TREND_RANGE_CONFIG[mode];
    const value = Number(rangeDrafts[mode]);
    if (!Number.isInteger(value) || value < config.minimum || value > config.maximum) {
      showToast({ title: 'Invalid Range', message: `Enter a whole number from ${config.minimum} to ${config.maximum} ${config.unit}.`, type: 'warning' });
      setRangeDrafts(current => ({ ...current, [mode]: String(ranges[mode]) }));
      return;
    }
    setRanges(current => ({ ...current, [mode]: value }));
    setSelectedKey(mode === 'day' ? getLatestObservedHourKey(appData, anchorDate, value) : initialDate);
  };

  return (
    <motion.div className="fixed inset-0 z-[180] flex items-center justify-center bg-slate-950/90 p-3 backdrop-blur-lg sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} data-activity-zone-dialog="true">
      <motion.div role="dialog" aria-modal="true" aria-label="Weekly zone minutes" className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-white/10 bg-slate-950 shadow-2xl" initial={{ opacity: 0, scale: 0.98, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 12 }} onMouseDown={event => event.stopPropagation()}>
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-slate-950/95 px-4 py-4 backdrop-blur-xl sm:px-6">
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-300 hover:bg-white/10 hover:text-white" aria-label="Back to Activity details"><ChevronLeft className="h-6 w-6" /></button>
          <h2 className="font-outfit text-xl font-semibold text-slate-100">Zone Minutes</h2>
          <div className="flex items-center gap-1">
            <CalendarPicker availableDates={availableDates} selectedDate={anchorDate} onSelect={date => { setAnchorDate(date); setSelectedKey(mode === 'day' ? getLatestObservedHourKey(appData, date, ranges.day) : date); }} calendarScope="nested" buttonClassName="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-slate-100" buttonLabel="Choose Zone Minutes date" />
            <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Close Zone Minutes"><X className="h-5 w-5" /></button>
          </div>
        </header>
        <div className="space-y-6 p-4 sm:p-7">
          <div className="grid grid-cols-3 rounded-2xl bg-slate-900/80 p-1">
            {[['day', 'Day'], ['week', 'Week'], ['month', 'Month']].map(([key, label]) => (
              <button key={key} type="button" onClick={() => changeMode(key)} className={`rounded-xl px-3 py-3 font-outfit text-base font-semibold transition-colors ${mode === key ? 'bg-slate-100 text-slate-950' : 'text-cyan-300 hover:bg-white/5'}`} aria-pressed={mode === key}>{label}</button>
            ))}
          </div>
          <div className="flex justify-end">
            <label className="flex items-center gap-2 text-sm text-slate-400">Range
              <input type="number" min={mode === 'day' ? 3 : TREND_RANGE_CONFIG[mode].minimum} max={mode === 'day' ? 24 : TREND_RANGE_CONFIG[mode].maximum} value={rangeDrafts[mode]} onChange={event => setRangeDrafts(current => ({ ...current, [mode]: event.target.value }))} onBlur={commitRange} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); commitRange(); event.currentTarget.blur(); } }} className="w-20 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-center font-outfit text-slate-100 outline-none focus:border-cyan-300" aria-label={`Zone minutes range in ${mode === 'day' ? 'hours' : TREND_RANGE_CONFIG[mode].unit}`} />
              <span>{mode === 'day' ? 'hours' : TREND_RANGE_CONFIG[mode].unit}</span>
            </label>
          </div>
          <div>
            <p className="font-outfit text-5xl font-light tabular-nums text-slate-100">{formatActivityDuration((selected?.total || 0) * 60)}</p>
            <p className="mt-2 text-sm text-slate-400">Total observed zone time</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" disabled={!canPrevious} onClick={() => shift(-1)} className="h-12 w-11 flex-shrink-0 rounded-xl border border-white/10 bg-slate-900 text-slate-300 disabled:opacity-25" aria-label={`Previous ${mode} zone period`}><ChevronLeft className="mx-auto h-5 w-5" /></button>
            <div className="min-w-0 flex-1"><ZoneChart points={points} selectedKey={selected?.key} onSelect={setSelectedKey} /></div>
            <button type="button" disabled={!canNext} onClick={() => shift(1)} className="h-12 w-11 flex-shrink-0 rounded-xl border border-white/10 bg-slate-900 text-slate-300 disabled:opacity-25" aria-label={`Next ${mode} zone period`}><ChevronRight className="mx-auto h-5 w-5" /></button>
          </div>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-3 rounded-2xl border border-white/10 bg-slate-900/45 p-4">
            {HEART_RATE_ZONES.map((zone, index) => <span key={zone.label} className="flex items-center gap-2 text-sm text-slate-300"><span className="h-3 w-3 rounded-sm" style={{ backgroundColor: ZONE_COLORS[index] }} />{zone.label}</span>)}
          </div>
          <TrendPeriodFooter kind={mode} startDate={windowStart} endDate={windowEnd} summary="Zone 0 – Zone 5" />
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ActivityZoneDrilldownModal(props) {
  if (typeof document === 'undefined') return null;
  return createPortal(<ActivityZoneContent {...props} />, document.body);
}
