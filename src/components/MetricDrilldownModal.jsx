import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import CalendarPicker from './CalendarPicker';
import { formatChartPointLabel, SvgChartAxisLabel, SvgChartPointLabel, useChartPointLabel } from './ChartPointLabel';
import TrendPeriodFooter from './TrendPeriodFooter';
import UnavailableState from './UnavailableState';
import useSwipePaging from '../hooks/useSwipePaging';
import { useToast } from '../context/toast';
import { calendarDates } from '../utils/dateService';
import {
  getMetricAvailableDates,
  getMetricAvailableDateRange,
  getMetricDrilldownSeries,
  METRIC_DRILLDOWN_RANGES,
  shiftMetricDrilldownAnchor,
} from '../utils/metricDrilldown';

const MODES = Object.freeze([
  ['day', 'Day'],
  ['week', 'Week'],
  ['month', 'Month'],
]);

const PERIOD_KINDS = Object.freeze({
  day: 'dayToDay',
  week: 'weekToWeek',
  month: 'monthToMonth',
});

const roundedAxis = (values, step) => {
  if (!values.length) return { minimum: 0, maximum: step * 2, ticks: [0, step, step * 2] };
  const rawMinimum = Math.min(...values);
  const rawMaximum = Math.max(...values);
  const span = Math.max(step, rawMaximum - rawMinimum);
  const roughStep = Math.max(step, span / 4);
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const normalized = roughStep / magnitude;
  const multiplier = [1, 2, 2.5, 5, 10].find(candidate => candidate >= normalized) || 10;
  const tickStep = multiplier * magnitude;
  let minimum = Math.floor(rawMinimum / tickStep) * tickStep;
  let maximum = Math.ceil(rawMaximum / tickStep) * tickStep;
  if (maximum === minimum) {
    minimum -= tickStep;
    maximum += tickStep;
  }
  const ticks = [];
  for (let value = minimum; value <= maximum + tickStep / 100; value += tickStep) {
    ticks.push(Number(value.toFixed(4)));
  }
  return { minimum, maximum, ticks };
};

const formatValue = (value, precision) => (
  value === null || value === undefined ? '--' : Number(value).toFixed(precision)
);

const formatMetricValue = (metric, value) => {
  if (value === null || value === undefined) return '--';
  if (!metric.durationHours) return formatValue(value, metric.precision);
  const minutes = Math.max(0, Math.round(Number(value) * 60));
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${hours}h${remainder ? ` ${remainder}m` : ''}`;
};

const formatAxisValue = (metric, value) => {
  if (metric.durationHours) return `${Number(value).toFixed(Number.isInteger(value) ? 0 : 1)}h`;
  const absolute = Math.abs(value);
  if (absolute >= 1000) return `${Number(value / 1000).toFixed(absolute >= 10000 ? 0 : 1)}k`;
  return formatValue(value, metric.precision);
};

function TrendChart({ series, selectedKey, onSelect }) {
  const labelState = useChartPointLabel();
  const observed = series.points
    .map((point, index) => ({ ...point, index }))
    .filter(point => point.value !== null);
  if (!observed.length) {
    return <UnavailableState title="Trend unavailable" description="No metric data is available in this period." />;
  }

  const width = 960;
  const height = 390;
  const padding = { left: 82, right: 72, top: 28, bottom: 86 };
  const axis = roundedAxis(observed.map(point => point.value), series.metric.axisStep);
  const range = Math.max(series.metric.axisStep, axis.maximum - axis.minimum);
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const xFor = index => padding.left + (index / Math.max(1, series.points.length - 1)) * chartWidth;
  const yFor = value => padding.top + ((axis.maximum - value) / range) * chartHeight;
  const path = observed.map(point => `${xFor(point.index)},${yFor(point.value)}`).join(' ');
  const baseline = series.baseline;
  const labelEvery = Math.max(1, Math.ceil(series.points.length / 8));

  return (
    <div className="overflow-x-auto scrollbar-hide">
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[44rem] w-full" role="img" aria-label={`${series.metric.title} trend`}>
        {axis.ticks.map(value => (
          <g key={value}>
            <line
              x1={padding.left}
              y1={yFor(value)}
              x2={width - padding.right}
              y2={yFor(value)}
              stroke="rgba(148,163,184,0.16)"
              strokeDasharray="8 7"
            />
            <text
              x={width - 6}
              y={yFor(value) + 6}
              textAnchor="end"
              fill="rgba(203,213,225,0.82)"
              fontSize="17"
              fontWeight="600"
            >
              {formatAxisValue(series.metric, value)}
            </text>
          </g>
        ))}
        {baseline !== null && (
          <>
            <line
              x1={padding.left}
              y1={yFor(baseline)}
              x2={width - padding.right}
              y2={yFor(baseline)}
              stroke="rgba(226,232,240,0.78)"
              strokeWidth="2"
              strokeDasharray="6 7"
            />
            <text
              x={padding.left - 8}
              y={yFor(baseline) - 8}
              textAnchor="end"
              fill="#f1f5f9"
              fontSize="17"
              fontWeight="700"
            >
              {formatAxisValue(series.metric, baseline)}
            </text>
          </>
        )}
        <polyline
          points={path}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {observed.map((point) => {
          const isSelected = point.key === selectedKey;
          return (
            <g
              key={point.key}
              role="button"
              tabIndex="0"
              aria-label={`Select ${point.label}, ${formatMetricValue(series.metric, point.value)}`}
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
              <circle cx={xFor(point.index)} cy={yFor(point.value)} r="16" fill="transparent" />
              <circle
                cx={xFor(point.index)}
                cy={yFor(point.value)}
                r={isSelected ? 10 : 6}
                fill="#f8fafc"
                stroke={isSelected ? '#67e8f9' : 'transparent'}
                strokeWidth="4"
              />
            </g>
          );
        })}
        {series.points.map((point, index) => (
          index % labelEvery === 0 || index === series.points.length - 1 ? (
            <SvgChartAxisLabel
              key={point.key}
              x={xFor(index)}
              y={height - 24}
              chartKey={point.key}
              fallback={point.label}
              active={point.key === selectedKey}
              fontSize={15}
            />
          ) : null
        ))}
        {observed.map(point => point.key === labelState.activeKey ? (
          <SvgChartPointLabel
            key={`label-${point.key}`}
            x={xFor(point.index)}
            y={yFor(point.value)}
            label={formatChartPointLabel(point.key, point.label)}
            chartWidth={width}
            chartHeight={height}
            fading={labelState.fading}
          />
        ) : null)}
      </svg>
    </div>
  );
}

function MetricDrilldownContent({ appData, metricKey, initialDate, onClose }) {
  const { showToast } = useToast();
  const [mode, setMode] = useState('day');
  const [anchorDate, setAnchorDate] = useState(initialDate);
  const [selectedPointKey, setSelectedPointKey] = useState(initialDate);
  const [ranges, setRanges] = useState(() => Object.fromEntries(
    Object.entries(METRIC_DRILLDOWN_RANGES).map(([key, config]) => [key, config.defaultValue]),
  ));
  const [rangeDrafts, setRangeDrafts] = useState(() => Object.fromEntries(
    Object.entries(METRIC_DRILLDOWN_RANGES).map(([key, config]) => [key, String(config.defaultValue)]),
  ));
  const rangeConfig = METRIC_DRILLDOWN_RANGES[mode];
  const series = useMemo(
    () => getMetricDrilldownSeries(appData, metricKey, mode, anchorDate, ranges[mode]),
    [anchorDate, appData, metricKey, mode, ranges],
  );
  const availableRange = useMemo(
    () => getMetricAvailableDateRange(appData, metricKey),
    [appData, metricKey],
  );
  const availableDates = useMemo(
    () => getMetricAvailableDates(appData, metricKey),
    [appData, metricKey],
  );
  const observed = series.points.filter(point => point.value !== null);
  const selectedPoint = observed.find(point => point.key === selectedPointKey) || observed[observed.length - 1] || null;
  const effectiveSelectedKey = selectedPoint?.key || null;
  const currentValue = selectedPoint?.value ?? null;
  const observedValues = observed.map(point => point.value);
  const minimum = observedValues.length ? Math.min(...observedValues) : null;
  const maximum = observedValues.length ? Math.max(...observedValues) : null;
  const canPrevious = Boolean(availableRange && availableRange.earliest < series.windowStart);
  const canNext = Boolean(availableRange && availableRange.latest > series.windowEnd);
  const swipePaging = useSwipePaging({
    canPrevious,
    canNext,
    onPrevious: () => setAnchorDate(current => shiftMetricDrilldownAnchor(current, mode, -1, ranges[mode])),
    onNext: () => setAnchorDate(current => shiftMetricDrilldownAnchor(current, mode, 1, ranges[mode])),
  });

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

  const shift = direction => {
    setAnchorDate(current => shiftMetricDrilldownAnchor(current, mode, direction, ranges[mode]));
  };

  const selectCalendarDate = date => {
    setAnchorDate(date);
    setSelectedPointKey(mode === 'week'
      ? calendarDates.getWeekDates(date)[0]
      : mode === 'month' ? calendarDates.toYearMonth(date) : date);
  };

  const updateRangeDraft = value => {
    setRangeDrafts(current => ({ ...current, [mode]: value }));
  };

  const commitRange = () => {
    const value = Number(rangeDrafts[mode]);
    const isValid = Number.isInteger(value)
      && value >= rangeConfig.minimum
      && value <= rangeConfig.maximum;
    if (!isValid) {
      showToast({
        title: 'Invalid Range',
        message: `Enter a whole number from ${rangeConfig.minimum} to ${rangeConfig.maximum} for ${rangeConfig.unit}.`,
        type: 'warning',
      });
      setRangeDrafts(current => ({ ...current, [mode]: String(ranges[mode]) }));
      return;
    }
    setRanges(current => ({ ...current, [mode]: value }));
    setRangeDrafts(current => ({ ...current, [mode]: String(value) }));
  };

  return (
    <motion.div
      className="fixed inset-0 z-[180] flex items-center justify-center bg-slate-950/90 p-3 backdrop-blur-lg sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={onClose}
      data-metric-drilldown="true"
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={`${series.metric.title} trends`}
        className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-white/10 bg-slate-950 shadow-2xl shadow-black/70"
        initial={{ opacity: 0, scale: 0.98, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 12 }}
        transition={{ duration: 0.18 }}
        onMouseDown={event => event.stopPropagation()}
      >
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-slate-950/95 px-4 py-4 backdrop-blur-xl sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Back to details"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h2 className="font-outfit text-lg font-medium text-slate-100 sm:text-2xl">{series.metric.title}</h2>
          <div className="flex items-center gap-1">
            <CalendarPicker
              availableDates={availableDates}
              selectedDate={anchorDate}
              onSelect={selectCalendarDate}
              calendarScope="nested"
              buttonClassName="rounded-xl p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-100"
              buttonLabel={`Choose ${series.metric.title} date`}
            />
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
              aria-label={`Close ${series.metric.title} trends`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="space-y-7 p-4 sm:p-7">
          <div className="grid grid-cols-3 rounded-2xl bg-slate-900/80 p-1">
            {MODES.map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => selectMode(key)}
                className={`rounded-xl px-3 py-3 font-outfit text-base font-semibold transition-colors sm:text-lg ${
                  mode === key
                    ? 'bg-slate-600 text-white shadow-sm'
                    : 'text-cyan-300 hover:bg-white/5'
                }`}
                aria-pressed={mode === key}
              >
                {label}
              </button>
            ))}
          </div>

          <form
            className="flex justify-end"
            noValidate
            onSubmit={event => {
              event.preventDefault();
              commitRange();
            }}
          >
            <label className="flex items-center gap-3 text-sm font-medium text-slate-300">
              <span>Range</span>
              <input
                type="number"
                min={rangeConfig.minimum}
                max={rangeConfig.maximum}
                step="1"
                inputMode="numeric"
                value={rangeDrafts[mode]}
                onChange={event => updateRangeDraft(event.target.value)}
                onBlur={commitRange}
                className="w-20 rounded-xl border border-white/15 bg-slate-900 px-3 py-2 text-right font-semibold tabular-nums text-slate-100 outline-none transition-colors focus:border-cyan-400/70 focus:ring-2 focus:ring-cyan-400/15"
                aria-label={`${mode} trend range`}
              />
              <span className="w-14 text-left text-slate-400">{rangeConfig.unit}</span>
              <span className="sr-only">
                Enter {rangeConfig.minimum} through {rangeConfig.maximum} {rangeConfig.unit}
              </span>
            </label>
          </form>

          <div className="flex items-baseline gap-2">
            <span className="font-outfit text-5xl font-light tabular-nums text-slate-100 sm:text-6xl">
              {formatMetricValue(series.metric, currentValue)}
            </span>
            {currentValue !== null && !series.metric.durationHours && <span className="text-2xl text-slate-300">{series.metric.unit}</span>}
          </div>

          <div className="flex touch-pan-y items-center gap-2" {...swipePaging}>
            <motion.button
              type="button"
              onClick={() => shift(-1)}
              disabled={!canPrevious}
              className="h-12 w-11 flex-shrink-0 rounded-xl border border-white/10 bg-slate-900 text-slate-300 hover:border-white/25 disabled:cursor-not-allowed disabled:opacity-25"
              whileTap={canPrevious ? { scale: 0.95 } : undefined}
              aria-label={`Previous ${mode} trend points`}
            >
              <ChevronLeft className="mx-auto h-5 w-5" />
            </motion.button>
            <div className="min-w-0 flex-1">
              <TrendChart series={series} selectedKey={effectiveSelectedKey} onSelect={setSelectedPointKey} />
            </div>
            <motion.button
              type="button"
              onClick={() => shift(1)}
              disabled={!canNext}
              className="h-12 w-11 flex-shrink-0 rounded-xl border border-white/10 bg-slate-900 text-slate-300 hover:border-white/25 disabled:cursor-not-allowed disabled:opacity-25"
              whileTap={canNext ? { scale: 0.95 } : undefined}
              aria-label={`Next ${mode} trend points`}
            >
              <ChevronRight className="mx-auto h-5 w-5" />
            </motion.button>
          </div>

          <TrendPeriodFooter
            kind={PERIOD_KINDS[mode]}
            startDate={series.windowStart}
            endDate={series.windowEnd}
            summary={(
              <>
              {formatMetricValue(series.metric, minimum)}{series.metric.durationHours ? '' : ` ${series.metric.unit}`} – {formatMetricValue(series.metric, maximum)}{series.metric.durationHours ? '' : ` ${series.metric.unit}`}
              </>
            )}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function MetricDrilldownModal(props) {
  if (typeof document === 'undefined') return null;
  return createPortal(<MetricDrilldownContent {...props} />, document.body);
}
