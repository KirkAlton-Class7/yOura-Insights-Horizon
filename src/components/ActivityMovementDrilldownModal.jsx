import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import CalendarPicker from './CalendarPicker';
import { formatChartPointLabel, SvgChartAxisLabel, SvgChartPointLabel, useChartPointLabel } from './ChartPointLabel';
import TrendPeriodFooter from './TrendPeriodFooter';
import UnavailableState from './UnavailableState';
import { useToast } from '../context/toast';
import { calendarDates } from '../utils/dateService';
import { getAvailableRecordDates } from '../utils/dataAvailability';
import { formatActivityDuration, getActivityTimeSeconds, getDailyMovementBuckets } from '../utils/activityDetails';
import { getTrendPeriods, recordsInPeriod, TREND_DEFAULT_RANGES, TREND_RANGE_CONFIG } from '../utils/trendRanges';
import useSwipePaging from '../hooks/useSwipePaging';

const MODES = Object.freeze([
  ['day', 'Day'],
  ['week', 'Week'],
  ['month', 'Month'],
]);

const formatHour = hour => {
  const normalized = ((hour % 24) + 24) % 24;
  return `${normalized % 12 || 12} ${normalized < 12 ? 'AM' : 'PM'}`;
};

const hourRangeLabel = (startHour, length) => {
  const endHour = Math.min(24, startHour + length);
  if (length === 1) return formatHour(startHour);
  return `${formatHour(startHour)}–${endHour === 24 ? '11:59 PM' : formatHour(endHour)}`;
};

const aggregateHourlyBuckets = (record, aggregationHours) => {
  const hourly = getDailyMovementBuckets(record);
  if (hourly.length !== 24) return hourly;
  const buckets = [];
  for (let start = 0; start < 24; start += aggregationHours) {
    const group = hourly.slice(start, Math.min(24, start + aggregationHours));
    const observed = group.filter(bucket => bucket.hasIntradayData);
    buckets.push(Object.freeze({
      key: String(start),
      label: hourRangeLabel(start, group.length),
      hour: start,
      activeMinutes: group.reduce((total, bucket) => total + bucket.activeMinutes, 0),
      intensity: observed.length ? observed.reduce((total, bucket) => total + bucket.intensity, 0) / observed.length : 0,
      hasIntradayData: observed.length > 0,
    }));
  }
  return Object.freeze(buckets);
};

const datePoints = (appData, mode, anchorDate, range) => getTrendPeriods(mode, anchorDate, range).map(period => Object.freeze({
  ...period,
  value: Math.round(recordsInPeriod(appData.activity, period.startDate, period.endDate)
    .reduce((total, record) => total + getActivityTimeSeconds(record), 0) / 60),
}));

const activateWithKeyboard = (event, callback) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    callback();
  }
};

function DayMovementChart({ buckets, selectedKey, onSelect }) {
  const labelState = useChartPointLabel();
  if (!buckets.length) return <UnavailableState title="Daily movement unavailable" />;
  const hasIntradayData = buckets.length > 1 && buckets.some(bucket => bucket.intensity !== null);
  if (!hasIntradayData) {
    const total = buckets[0]?.activeMinutes || 0;
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-900/45 p-8 text-center">
        <p className="text-sm text-slate-400">Intraday timing was not included in this export.</p>
        <p className="mt-3 font-outfit text-5xl font-light tabular-nums text-slate-100">{formatActivityDuration(total * 60)}</p>
        <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-500">Daily activity total</p>
      </div>
    );
  }

  const width = 980;
  const height = 390;
  const padding = { left: 34, right: 118, top: 36, bottom: 78 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const slotWidth = plotWidth / buckets.length;
  const yFor = value => padding.top + ((3 - value) / 3) * plotHeight;
  const bands = [['Low', 1], ['Medium', 2], ['High', 3]];
  const selected = buckets.find(bucket => bucket.key === selectedKey) || buckets[0];
  const activeBand = selected?.intensity >= 2.34 ? 'High' : selected?.intensity >= 1.34 ? 'Medium' : selected?.intensity > 0 ? 'Low' : null;

  return (
    <div className="overflow-x-auto scrollbar-hide">
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[48rem] w-full" role="img" aria-label="Movement intensity across the selected day">
        {[0, 1, 2, 3].map(value => <line key={value} x1={padding.left} y1={yFor(value)} x2={width - padding.right} y2={yFor(value)} stroke="rgba(148,163,184,0.16)" />)}
        {bands.map(([label, value]) => {
          const active = activeBand === label;
          return <text key={label} x={width - 8} y={yFor(value) + 6} textAnchor="end" fill={active ? '#67e8f9' : 'rgba(203,213,225,0.64)'} fontSize={active ? '20' : '18'} fontWeight={active ? '800' : '500'}>{label}</text>;
        })}
        {buckets.map((bucket, index) => {
          const barWidth = Math.max(5, Math.min(30, slotWidth * 0.55));
          const x = padding.left + index * slotWidth + (slotWidth - barWidth) / 2;
          const isSelected = bucket.key === selected?.key;
          const y = yFor(Math.max(0.06, bucket.intensity));
          return (
            <g key={bucket.key} role="button" tabIndex="0" aria-label={`Select ${bucket.label}, ${bucket.activeMinutes} active minutes`} onClick={() => { onSelect(bucket.key); labelState.showClicked(bucket.key); }} onMouseEnter={() => labelState.showHovered(bucket.key)} onMouseLeave={() => labelState.hideHovered(bucket.key)} onFocus={() => labelState.showHovered(bucket.key)} onBlur={() => labelState.hideHovered(bucket.key)} onKeyDown={event => activateWithKeyboard(event, () => { onSelect(bucket.key); labelState.showClicked(bucket.key); })} className="cursor-pointer outline-none">
              <rect x={x - 5} y={padding.top} width={barWidth + 10} height={plotHeight} fill="transparent" />
              <rect x={x} y={y} width={barWidth} height={padding.top + plotHeight - y} rx="4" fill={isSelected ? '#67e8f9' : '#e2e8f0'} opacity={isSelected ? '1' : '0.48'} />
              {(buckets.length <= 12 || index % Math.max(1, Math.ceil(buckets.length / 8)) === 0 || index === buckets.length - 1) && (
                <text x={x + barWidth / 2} y={height - 28} textAnchor="middle" fill={isSelected ? '#f8fafc' : 'rgba(148,163,184,0.76)'} fontSize="15" fontWeight={isSelected ? '800' : '500'}>{bucket.label}</text>
              )}
            </g>
          );
        })}
        {buckets.map((bucket, index) => bucket.key === labelState.activeKey ? (
          <SvgChartPointLabel key={`label-${bucket.key}`} x={padding.left + index * slotWidth + slotWidth / 2} y={yFor(Math.max(0.06, bucket.intensity))} label={bucket.label} chartWidth={width} chartHeight={height} fading={labelState.fading} />
        ) : null)}
      </svg>
    </div>
  );
}

function PeriodMovementChart({ points, selectedKey, onSelect }) {
  const labelState = useChartPointLabel();
  const width = 980;
  const height = 390;
  const padding = { left: 68, right: 34, top: 34, bottom: 76 };
  const observed = points.filter(point => point.value > 0);
  if (!observed.length) return <UnavailableState title="Movement totals unavailable" description="No daily activity totals were available for this period." />;
  const maximum = Math.max(60, Math.ceil(Math.max(...observed.map(point => point.value)) / 60) * 60);
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const slotWidth = plotWidth / points.length;
  const yFor = value => padding.top + ((maximum - value) / maximum) * plotHeight;
  const ticks = [0, maximum / 2, maximum];
  const labelEvery = Math.max(1, Math.ceil(points.length / 10));
  return (
    <div className="overflow-x-auto scrollbar-hide">
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[46rem] w-full" role="img" aria-label="Movement totals">
        {ticks.map(value => (
          <g key={value}>
            <line x1={padding.left} y1={yFor(value)} x2={width - padding.right} y2={yFor(value)} stroke="rgba(148,163,184,0.16)" />
            <text x={padding.left - 10} y={yFor(value) + 6} textAnchor="end" fill="rgba(203,213,225,0.72)" fontSize="16">{Math.round(value)}m</text>
          </g>
        ))}
        {points.map((point, index) => {
          const barWidth = Math.max(6, Math.min(50, slotWidth * 0.55));
          const x = padding.left + index * slotWidth + (slotWidth - barWidth) / 2;
          const y = yFor(point.value);
          const isSelected = point.key === selectedKey;
          return (
            <g key={point.key} role="button" tabIndex="0" aria-label={`Select ${point.label}, ${point.value} movement minutes`} onClick={() => { onSelect(point.key); labelState.showClicked(point.key); }} onMouseEnter={() => labelState.showHovered(point.key)} onMouseLeave={() => labelState.hideHovered(point.key)} onFocus={() => labelState.showHovered(point.key)} onBlur={() => labelState.hideHovered(point.key)} onKeyDown={event => activateWithKeyboard(event, () => { onSelect(point.key); labelState.showClicked(point.key); })} className="cursor-pointer outline-none">
              <rect x={x - 5} y={padding.top} width={barWidth + 10} height={plotHeight} fill="transparent" />
              <rect x={x} y={y} width={barWidth} height={padding.top + plotHeight - y} rx="7" fill={isSelected ? '#67e8f9' : '#e2e8f0'} opacity={isSelected ? '1' : '0.62'} />
              {(index % labelEvery === 0 || index === points.length - 1) && <SvgChartAxisLabel x={x + barWidth / 2} y={height - 45} chartKey={point.key} fallback={point.label} active={isSelected} />}
            </g>
          );
        })}
        {points.map((point, index) => point.value > 0 && point.key === labelState.activeKey ? (
          <SvgChartPointLabel key={`label-${point.key}`} x={padding.left + index * slotWidth + slotWidth / 2} y={yFor(point.value)} label={formatChartPointLabel(point.key, point.label)} chartWidth={width} chartHeight={height} fading={labelState.fading} />
        ) : null)}
      </svg>
    </div>
  );
}

function ActivityMovementContent({ appData, initialDate, initialMode = 'day', onClose, onBack = onClose }) {
  const { showToast } = useToast();
  const [mode, setMode] = useState(initialMode);
  const [anchorDate, setAnchorDate] = useState(initialDate);
  const [aggregationHours, setAggregationHours] = useState(7);
  const [ranges, setRanges] = useState(() => ({ ...TREND_DEFAULT_RANGES }));
  const [rangeDrafts, setRangeDrafts] = useState(() => Object.fromEntries(
    Object.entries(TREND_DEFAULT_RANGES).map(([key, value]) => [key, String(value)]),
  ));
  const [selectedKey, setSelectedKey] = useState(initialMode === 'day' ? '0' : initialDate);
  const availableDates = useMemo(() => getAvailableRecordDates(appData.activity), [appData.activity]);
  const dayBuckets = useMemo(() => aggregateHourlyBuckets(appData.activity?.[anchorDate]?.[0], aggregationHours), [aggregationHours, anchorDate, appData.activity]);
  const periodPoints = useMemo(() => mode === 'day' ? [] : datePoints(appData, mode, anchorDate, ranges[mode]), [anchorDate, appData, mode, ranges]);
  const selectedBucket = dayBuckets.find(bucket => bucket.key === selectedKey) || dayBuckets[0];
  const selectedPoint = periodPoints.find(point => point.key === selectedKey) || periodPoints.find(point => point.key === anchorDate) || periodPoints.findLast(point => point.value > 0);
  const earliest = availableDates[0];
  const latest = availableDates.at(-1);
  const windowStart = mode === 'day' ? anchorDate : periodPoints[0]?.startDate;
  const windowEnd = mode === 'day' ? anchorDate : periodPoints.at(-1)?.endDate;
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
    setSelectedKey(nextMode === 'day' ? '0' : initialDate);
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
      setSelectedKey(mode === 'day' ? '0' : nextDate);
    }
  };
  const swipePaging = useSwipePaging({ canPrevious, canNext, onPrevious: () => shift(-1), onNext: () => shift(1) });

  const commitRange = () => {
    const config = mode === 'day' ? { minimum: 3, maximum: 24, unit: 'hours' } : TREND_RANGE_CONFIG[mode];
    const value = Number(rangeDrafts[mode]);
    if (!Number.isInteger(value) || value < config.minimum || value > config.maximum) {
      showToast({ title: 'Invalid Range', message: `Enter a whole number from ${config.minimum} to ${config.maximum} ${config.unit}.`, type: 'warning' });
      setRangeDrafts(current => ({ ...current, [mode]: String(mode === 'day' ? aggregationHours : ranges[mode]) }));
      return;
    }
    if (mode === 'day') setAggregationHours(value);
    else setRanges(current => ({ ...current, [mode]: value }));
    setRangeDrafts(current => ({ ...current, [mode]: String(value) }));
    setSelectedKey('0');
  };

  const headline = mode === 'day'
    ? `${selectedBucket?.activeMinutes || 0}m`
    : formatActivityDuration((selectedPoint?.value || 0) * 60);
  const observedPeriodValues = periodPoints.map(point => point.value).filter(value => Number.isFinite(value));
  const footerSummary = mode === 'day'
    ? `${aggregationHours}-hour interval${aggregationHours === 1 ? '' : 's'}`
    : observedPeriodValues.length
      ? `${formatActivityDuration(Math.min(...observedPeriodValues) * 60)} – ${formatActivityDuration(Math.max(...observedPeriodValues) * 60)}`
      : null;

  return (
    <motion.div className="fixed inset-0 z-[180] flex items-center justify-center bg-slate-950/90 p-3 backdrop-blur-lg sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose} data-activity-movement-dialog="true">
      <motion.div role="dialog" aria-modal="true" aria-label="Movement totals" className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-white/10 bg-slate-950 shadow-2xl" initial={{ opacity: 0, scale: 0.98, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 12 }} onMouseDown={event => event.stopPropagation()}>
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-slate-950/95 px-4 py-4 backdrop-blur-xl sm:px-6">
          <button type="button" onClick={onBack} className="rounded-xl p-2 text-slate-300 hover:bg-white/10 hover:text-white" aria-label="Back to Activity details"><ChevronLeft className="h-6 w-6" /></button>
          <h2 className="font-outfit text-xl font-semibold text-slate-100">Movement Totals</h2>
          <div className="flex items-center gap-1">
            <CalendarPicker availableDates={availableDates} selectedDate={anchorDate} onSelect={date => { setAnchorDate(date); setSelectedKey(mode === 'day' ? '0' : date); }} calendarScope="nested" buttonClassName="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-slate-100" buttonLabel="Choose Movement date" />
            <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Close movement totals"><X className="h-5 w-5" /></button>
          </div>
        </header>

        <div className="space-y-6 p-4 sm:p-7">
          <div className="grid grid-cols-3 rounded-2xl bg-slate-900/80 p-1">
            {MODES.map(([key, label]) => <button key={key} type="button" onClick={() => changeMode(key)} className={`rounded-xl px-3 py-3 font-outfit text-base font-semibold transition-colors ${mode === key ? 'bg-slate-100 text-slate-950' : 'text-cyan-300 hover:bg-white/5'}`} aria-pressed={mode === key}>{label}</button>)}
          </div>

          <div className="flex justify-end">
            <label className="flex items-center gap-2 text-sm text-slate-400">Range
              <input type="number" min={mode === 'day' ? 3 : TREND_RANGE_CONFIG[mode].minimum} max={mode === 'day' ? 24 : TREND_RANGE_CONFIG[mode].maximum} value={rangeDrafts[mode]} onChange={event => setRangeDrafts(current => ({ ...current, [mode]: event.target.value }))} onBlur={commitRange} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); commitRange(); event.currentTarget.blur(); } }} className="w-20 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-center font-outfit text-slate-100 outline-none focus:border-cyan-300" aria-label={`Movement range in ${mode === 'day' ? 'hours' : TREND_RANGE_CONFIG[mode].unit}`} />
              <span>{mode === 'day' ? 'hours' : TREND_RANGE_CONFIG[mode].unit}</span>
            </label>
          </div>

          <div>
            <p className="font-outfit text-5xl font-light tabular-nums text-slate-100">{headline}</p>
            <p className="mt-2 text-sm text-slate-400">{mode === 'day' ? `${selectedBucket?.label || ''} · active movement` : 'Activity time'}</p>
          </div>

          <div className="flex touch-pan-y items-center gap-2" {...swipePaging}>
            <button type="button" disabled={!canPrevious} onClick={() => shift(-1)} className="h-12 w-11 flex-shrink-0 rounded-xl border border-white/10 bg-slate-900 text-slate-300 disabled:opacity-25" aria-label={`Previous ${mode} movement period`}><ChevronLeft className="mx-auto h-5 w-5" /></button>
            <div className="min-w-0 flex-1">
              {mode === 'day'
                ? <DayMovementChart buckets={dayBuckets} selectedKey={selectedBucket?.key} onSelect={setSelectedKey} />
                : <PeriodMovementChart points={periodPoints} selectedKey={selectedPoint?.key} onSelect={setSelectedKey} />}
            </div>
            <button type="button" disabled={!canNext} onClick={() => shift(1)} className="h-12 w-11 flex-shrink-0 rounded-xl border border-white/10 bg-slate-900 text-slate-300 disabled:opacity-25" aria-label={`Next ${mode} movement period`}><ChevronRight className="mx-auto h-5 w-5" /></button>
          </div>
          <TrendPeriodFooter kind={mode} startDate={windowStart} endDate={windowEnd} summary={footerSummary} />
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ActivityMovementDrilldownModal(props) {
  if (typeof document === 'undefined') return null;
  return createPortal(<ActivityMovementContent {...props} />, document.body);
}
