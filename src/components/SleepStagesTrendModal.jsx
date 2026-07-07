import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import CalendarPicker from './CalendarPicker';
import { formatChartPointLabel, SvgChartAxisLabel, SvgChartPointLabel, useChartPointLabel } from './ChartPointLabel';
import TrendPeriodFooter from './TrendPeriodFooter';
import UnavailableState from './UnavailableState';
import { calendarDates } from '../utils/dateService';
import { getAvailableRecordDates } from '../utils/dataAvailability';
import { formatSleepDuration } from '../utils/sleepDetails';
import { SLEEP_STAGE_COLORS } from '../utils/sleepStageColors';
import { getSleepStageTrendSeries, shiftSleepStageAnchor } from '../utils/sleepStageTrends';
import { METRIC_DRILLDOWN_RANGES } from '../utils/metricDrilldown';
import { TREND_DEFAULT_RANGES } from '../utils/trendRanges';
import { useToast } from '../context/toast';
import useSwipePaging from '../hooks/useSwipePaging';

const MODES = Object.freeze([['day', 'Day'], ['week', 'Week'], ['month', 'Month']]);
const PERIOD_KINDS = Object.freeze({ day: 'dayToDay', week: 'weekToWeek', month: 'monthToMonth' });
const STAGES = Object.freeze([
  ['deep', 'Deep', SLEEP_STAGE_COLORS.deep],
  ['light', 'Light', SLEEP_STAGE_COLORS.light],
  ['rem', 'REM', SLEEP_STAGE_COLORS.rem],
  ['awake', 'Awake', SLEEP_STAGE_COLORS.awake],
]);

function StackedChart({ series, selectedKey, onSelect }) {
  const labelState = useChartPointLabel();
  const observed = series.points.filter(point => point.stages);
  if (!observed.length) return <UnavailableState title="Sleep stages unavailable" description="No sleep-stage data is available in this period." />;
  const width = 920;
  const height = 390;
  const padding = { left: 30, right: 70, top: 30, bottom: 70 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maximum = Math.max(10, Math.ceil(Math.max(...observed.map(point => point.totalDuration)) / 2) * 2);
  const xFor = index => padding.left + (index / Math.max(1, series.points.length - 1)) * chartWidth;
  const yFor = value => padding.top + ((maximum - value) / maximum) * chartHeight;
  const cumulative = series.points.map(point => ({ deep: 0, light: 0, rem: 0, awake: 0, ...(point.stages || {}) }));
  const boundaries = { base: cumulative.map(() => 0) };
  let previous = boundaries.base;
  STAGES.forEach(([key]) => {
    boundaries[key] = cumulative.map((stages, index) => previous[index] + stages[key]);
    previous = boundaries[key];
  });
  const areaPoints = (top, bottom) => [
    ...top.map((value, index) => `${xFor(index)},${yFor(value)}`),
    ...bottom.map((value, index) => `${xFor(bottom.length - 1 - index)},${yFor(bottom[bottom.length - 1 - index])}`),
  ].join(' ');
  const ticks = Array.from({ length: Math.floor(maximum / 2) + 1 }, (_, index) => index * 2);

  return (
    <div className="overflow-x-auto scrollbar-hide">
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[44rem] w-full" role="img" aria-label="Sleep stages over time">
        {ticks.map(value => (
          <g key={value}>
            <line x1={padding.left} y1={yFor(value)} x2={width - padding.right} y2={yFor(value)} stroke="rgba(148,163,184,0.15)" strokeDasharray="8 7" />
            <text x={width - 8} y={yFor(value) + 6} textAnchor="end" fill="rgba(203,213,225,0.82)" fontSize="17">{value}h 0m</text>
          </g>
        ))}
        {STAGES.map(([key, , color], index) => {
          const lowerKey = index === 0 ? 'base' : STAGES[index - 1][0];
          return <polygon key={key} points={areaPoints(boundaries[key], boundaries[lowerKey])} fill={color} opacity="0.9" />;
        })}
        <polyline
          points={boundaries.awake.map((value, index) => `${xFor(index)},${yFor(value)}`).join(' ')}
          fill="none"
          stroke="#f8fafc"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {series.points.map((point, index) => {
          if (!point.stages) return null;
          const isSelected = point.key === selectedKey;
          return (
            <g
              key={`${point.key}-point`}
              role="button"
              tabIndex="0"
              aria-label={`Select ${point.label}, ${formatSleepDuration(point.totalSleep * 3600)}`}
              onClick={() => { onSelect(point.key); labelState.showClicked(point.key); }}
              onMouseEnter={() => labelState.showHovered(point.key)}
              onMouseLeave={() => labelState.hideHovered(point.key)}
              onFocus={() => labelState.showHovered(point.key)}
              onBlur={() => labelState.hideHovered(point.key)}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelect(point.key);
                  labelState.showClicked(point.key);
                }
              }}
              className="cursor-pointer outline-none"
            >
              <circle cx={xFor(index)} cy={yFor(boundaries.awake[index])} r="17" fill="transparent" />
              <circle cx={xFor(index)} cy={yFor(boundaries.awake[index])} r={isSelected ? 10 : 6} fill="#f8fafc" stroke={isSelected ? '#67e8f9' : '#f8fafc'} strokeWidth={isSelected ? 5 : 2} />
            </g>
          );
        })}
        {series.points.map((point, index) => (
          <SvgChartAxisLabel key={point.key} x={xFor(index)} y={height - 46} chartKey={point.key} fallback={point.label} active={point.key === selectedKey} />
        ))}
        {series.points.map((point, index) => point.stages && point.key === labelState.activeKey ? (
          <SvgChartPointLabel key={`label-${point.key}`} x={xFor(index)} y={yFor(boundaries.awake[index])} label={formatChartPointLabel(point.key, point.label)} chartWidth={width} chartHeight={height} fading={labelState.fading} />
        ) : null)}
      </svg>
      <div className="flex flex-wrap justify-center gap-5 text-sm text-slate-300">
        {[...STAGES].reverse().map(([key, label, color]) => (
          <span key={key} className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm" style={{ backgroundColor: color }} />{label}</span>
        ))}
      </div>
    </div>
  );
}

function SleepStagesTrendContent({ appData, initialDate, onClose, onBack = onClose }) {
  const { showToast } = useToast();
  const [mode, setMode] = useState('day');
  const [anchorDate, setAnchorDate] = useState(initialDate);
  const [selectedPointKey, setSelectedPointKey] = useState(initialDate);
  const [ranges, setRanges] = useState(() => ({ ...TREND_DEFAULT_RANGES }));
  const [rangeDrafts, setRangeDrafts] = useState(() => Object.fromEntries(
    Object.entries(TREND_DEFAULT_RANGES).map(([key, value]) => [key, String(value)]),
  ));
  const rangeConfig = METRIC_DRILLDOWN_RANGES[mode];
  const series = useMemo(() => getSleepStageTrendSeries(appData, mode, anchorDate, ranges[mode]), [anchorDate, appData, mode, ranges]);
  const availableDates = useMemo(() => getAvailableRecordDates(
    appData.sleepmodel,
    record => Number(record?.total_sleep_duration) > 0
      || Number(record?.deep_sleep_duration || 0) + Number(record?.rem_sleep_duration || 0) + Number(record?.light_sleep_duration || 0) > 0,
  ), [appData.sleepmodel]);
  const selected = series.points.find(point => point.key === selectedPointKey && point.totalSleep !== null)
    || [...series.points].reverse().find(point => point.totalSleep !== null)
    || null;
  const effectiveSelectedKey = selected?.key || null;
  const observedTotals = series.points.map(point => point.totalSleep).filter(value => value !== null);
  const footerSummary = observedTotals.length
    ? `${formatSleepDuration(Math.min(...observedTotals) * 3600)} – ${formatSleepDuration(Math.max(...observedTotals) * 3600)}`
    : null;
  const canPrevious = Boolean(availableDates[0] && availableDates[0] < series.windowStart);
  const canNext = Boolean(availableDates[availableDates.length - 1] && availableDates[availableDates.length - 1] > series.windowEnd);
  const shift = direction => setAnchorDate(date => shiftSleepStageAnchor(date, mode, direction, ranges[mode]));
  const swipePaging = useSwipePaging({ canPrevious, canNext, onPrevious: () => shift(-1), onNext: () => shift(1) });

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

  const selectMode = nextMode => {
    setMode(nextMode);
    setAnchorDate(initialDate);
    setSelectedPointKey(initialDate);
  };

  const selectCalendarDate = date => {
    setAnchorDate(date);
    setSelectedPointKey(mode === 'week'
      ? calendarDates.getWeekDates(date)[0]
      : mode === 'month' ? calendarDates.toYearMonth(date) : date);
  };

  const commitRange = () => {
    const value = Number(rangeDrafts[mode]);
    if (!Number.isInteger(value) || value < rangeConfig.minimum || value > rangeConfig.maximum) {
      showToast({ title: 'Invalid Range', message: `Enter a whole number from ${rangeConfig.minimum} to ${rangeConfig.maximum} ${rangeConfig.unit}.`, type: 'warning' });
      setRangeDrafts(current => ({ ...current, [mode]: String(ranges[mode]) }));
      return;
    }
    setRanges(current => ({ ...current, [mode]: value }));
  };

  return (
    <motion.div
      className="fixed inset-0 z-[190] flex items-center justify-center bg-slate-950/90 p-3 backdrop-blur-lg sm:p-6"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onMouseDown={onClose}
      data-sleep-stages-dialog="true"
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Sleep stages trends"
        className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-white/10 bg-slate-950 shadow-2xl"
        initial={{ opacity: 0, scale: 0.98, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 12 }}
        onMouseDown={event => event.stopPropagation()}
      >
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-slate-950/95 px-4 py-4 backdrop-blur-xl sm:px-6">
          <button type="button" onClick={onBack} className="rounded-xl p-2 text-slate-300 hover:bg-white/10 hover:text-white" aria-label="Back to Sleep details"><ChevronLeft className="h-6 w-6" /></button>
          <h2 className="font-outfit text-xl font-semibold text-slate-100">Sleep Stages</h2>
          <div className="flex items-center gap-1">
            <CalendarPicker availableDates={availableDates} selectedDate={anchorDate} onSelect={selectCalendarDate} calendarScope="nested" buttonClassName="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-slate-100" buttonLabel="Choose Sleep Stages date" />
            <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Close sleep stages trends"><X className="h-5 w-5" /></button>
          </div>
        </header>
        <div className="space-y-7 p-4 sm:p-7">
          <div className="grid grid-cols-3 rounded-2xl bg-slate-900/80 p-1">
            {MODES.map(([key, label]) => (
              <button key={key} type="button" onClick={() => selectMode(key)} className={`rounded-xl px-3 py-3 font-outfit text-base font-semibold transition-colors sm:text-lg ${mode === key ? 'bg-slate-600 text-white' : 'text-cyan-300 hover:bg-white/5'}`} aria-pressed={mode === key}>{label}</button>
            ))}
          </div>
          <div className="flex justify-end">
            <label className="flex items-center gap-2 text-sm text-slate-400">Range
              <input type="number" min={rangeConfig.minimum} max={rangeConfig.maximum} value={rangeDrafts[mode]} onChange={event => setRangeDrafts(current => ({ ...current, [mode]: event.target.value }))} onBlur={commitRange} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); commitRange(); event.currentTarget.blur(); } }} className="w-20 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-center font-outfit text-slate-100 outline-none focus:border-cyan-300" aria-label={`Sleep stages range in ${rangeConfig.unit}`} />
              <span>{rangeConfig.unit}</span>
            </label>
          </div>
          <p className="font-outfit text-5xl font-light tabular-nums text-slate-100 sm:text-6xl">
            {selected ? formatSleepDuration(selected.totalSleep * 3600) : '--'}
          </p>
          <div className="flex touch-pan-y items-center gap-2" {...swipePaging}>
            <button type="button" disabled={!canPrevious} onClick={() => shift(-1)} className="h-12 w-11 flex-shrink-0 rounded-xl border border-white/10 bg-slate-900 text-slate-300 disabled:opacity-25" aria-label={`Previous ${mode} sleep stages`}><ChevronLeft className="mx-auto h-5 w-5" /></button>
            <div className="min-w-0 flex-1"><StackedChart series={series} selectedKey={effectiveSelectedKey} onSelect={setSelectedPointKey} /></div>
            <button type="button" disabled={!canNext} onClick={() => shift(1)} className="h-12 w-11 flex-shrink-0 rounded-xl border border-white/10 bg-slate-900 text-slate-300 disabled:opacity-25" aria-label={`Next ${mode} sleep stages`}><ChevronRight className="mx-auto h-5 w-5" /></button>
          </div>
          <TrendPeriodFooter kind={PERIOD_KINDS[mode]} startDate={series.windowStart} endDate={series.windowEnd} summary={footerSummary} />
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function SleepStagesTrendModal(props) {
  if (typeof document === 'undefined') return null;
  return createPortal(<SleepStagesTrendContent {...props} />, document.body);
}
