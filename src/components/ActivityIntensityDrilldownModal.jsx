import { useEffect, useId, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import CalendarPicker from './CalendarPicker';
import { formatChartPointLabel, SvgChartAxisLabel, SvgChartPointLabel, useChartPointLabel } from './ChartPointLabel';
import TrendPeriodFooter from './TrendPeriodFooter';
import UnavailableState from './UnavailableState';
import useSwipePaging from '../hooks/useSwipePaging';
import { useToast } from '../context/toast';
import { ACTIVITY_INTENSITY_LEVELS, formatActivityDuration, getActivityIntensityDurations } from '../utils/activityDetails';
import { calendarDates } from '../utils/dateService';
import { getAvailableRecordDates } from '../utils/dataAvailability';
import { getTrendPeriods, recordsInPeriod, TREND_DEFAULT_RANGES, TREND_RANGE_CONFIG } from '../utils/trendRanges';

const averageDurations = records => {
  if (!records.length) return ACTIVITY_INTENSITY_LEVELS.map(() => 0);
  const totals = records.reduce((result, record) => getActivityIntensityDurations(record).map((item, index) => result[index] + item.seconds), ACTIVITY_INTENSITY_LEVELS.map(() => 0));
  return totals.map(total => Math.round(total / records.length / 60));
};

const dayPeriod = date => {
  const presentation = calendarDates.getDatePresentation(date);
  return { key: date, label: `${presentation.weekdayShort} ${presentation.month}/${presentation.dayOfMonth}`, startDate: date, endDate: date };
};

const getIntensityPoints = (activityData, mode, anchorDate, range) => {
  const periods = mode === 'day'
    ? Array.from({ length: range }, (_, index) => dayPeriod(calendarDates.addDays(anchorDate, index - (range - 1))))
    : getTrendPeriods(mode, anchorDate, range);
  return periods.map(period => {
    const records = recordsInPeriod(activityData, period.startDate, period.endDate);
    const durations = averageDurations(records);
    return Object.freeze({ ...period, durations, total: durations.reduce((sum, value) => sum + value, 0) });
  });
};

function IntensityChart({ points, selectedKey, onSelect }) {
  const labelState = useChartPointLabel();
  const clipPrefix = useId().replaceAll(':', '');
  const observed = points.filter(point => point.total > 0);
  if (!observed.length) return <UnavailableState title="Activity intensity unavailable" description="No activity durations were available for this period." />;
  const width = 980;
  const height = 410;
  const padding = { left: 72, right: 30, top: 34, bottom: 78 };
  const maximum = Math.max(60, Math.ceil(Math.max(...observed.map(point => point.total)) / 60) * 60);
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const slotWidth = plotWidth / points.length;
  const yFor = value => padding.top + ((maximum - value) / maximum) * plotHeight;
  const ticks = [0, maximum / 2, maximum];
  const labelEvery = Math.max(1, Math.ceil(points.length / 10));

  return (
    <div className="overflow-x-auto scrollbar-hide">
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[46rem] w-full" role="img" aria-label="Activity intensity duration by period">
        {ticks.map(value => <g key={value}><line x1={padding.left} y1={yFor(value)} x2={width - padding.right} y2={yFor(value)} stroke="rgba(148,163,184,0.16)" /><text x={padding.left - 10} y={yFor(value) + 6} textAnchor="end" fill="rgba(203,213,225,0.72)" fontSize="16">{formatActivityDuration(value * 60)}</text></g>)}
        {points.map((point, index) => {
          const barWidth = Math.max(7, Math.min(58, slotWidth * 0.58));
          const x = padding.left + index * slotWidth + (slotWidth - barWidth) / 2;
          const isSelected = point.key === selectedKey;
          const barTop = yFor(point.total);
          const clipId = `${clipPrefix}-intensity-${index}`;
          let accumulated = 0;
          const segments = point.durations.map((minutes, levelIndex) => {
            const bottom = accumulated;
            accumulated += minutes;
            return { minutes, levelIndex, bottom, top: accumulated };
          });
          return (
            <g key={point.key} role="button" tabIndex="0" className="cursor-pointer outline-none" aria-label={`${point.label}, ${formatActivityDuration(point.total * 60)}`} onClick={() => { onSelect(point.key); labelState.showClicked(point.key); }} onMouseEnter={() => labelState.showHovered(point.key)} onMouseLeave={() => labelState.hideHovered(point.key)} onFocus={() => labelState.showHovered(point.key)} onBlur={() => labelState.hideHovered(point.key)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(point.key); labelState.showClicked(point.key); } }}>
              <rect x={x - 6} y={padding.top} width={barWidth + 12} height={plotHeight} fill="transparent" />
              {point.total > 0 && <defs><clipPath id={clipId}><rect x={x} y={barTop} width={barWidth} height={padding.top + plotHeight - barTop} rx="7" /></clipPath></defs>}
              <g clipPath={`url(#${clipId})`}>
                {segments.map(({ minutes, levelIndex, bottom, top }) => minutes > 0 ? <rect key={ACTIVITY_INTENSITY_LEVELS[levelIndex].key} x={x} y={yFor(top)} width={barWidth} height={Math.max(2, yFor(bottom) - yFor(top))} fill={ACTIVITY_INTENSITY_LEVELS[levelIndex].color} opacity={isSelected ? 1 : 0.82} /> : null)}
              </g>
              {isSelected && point.total > 0 && <rect x={x - 3} y={barTop - 3} width={barWidth + 6} height={padding.top + plotHeight - barTop + 6} rx="10" fill="none" stroke="#67e8f9" strokeWidth="4" />}
              {(index % labelEvery === 0 || index === points.length - 1) && <SvgChartAxisLabel x={x + barWidth / 2} y={height - 46} chartKey={point.key} fallback={point.label} active={isSelected} />}
            </g>
          );
        })}
        {points.map((point, index) => point.total > 0 && point.key === labelState.activeKey ? <SvgChartPointLabel key={`label-${point.key}`} x={padding.left + index * slotWidth + slotWidth / 2} y={yFor(point.total)} label={formatChartPointLabel(point.key, point.label)} chartWidth={width} chartHeight={height} fading={labelState.fading} /> : null)}
      </svg>
    </div>
  );
}

function ActivityIntensityContent({ appData, initialDate, onClose, onBack = onClose }) {
  const { showToast } = useToast();
  const [mode, setMode] = useState('day');
  const [anchorDate, setAnchorDate] = useState(initialDate);
  const [selectedKey, setSelectedKey] = useState(initialDate);
  const [ranges, setRanges] = useState(() => ({ ...TREND_DEFAULT_RANGES }));
  const [rangeDrafts, setRangeDrafts] = useState(() => Object.fromEntries(Object.entries(TREND_DEFAULT_RANGES).map(([key, value]) => [key, String(value)])));
  const availableDates = useMemo(() => getAvailableRecordDates(appData.activity), [appData.activity]);
  const points = useMemo(() => getIntensityPoints(appData.activity, mode, anchorDate, ranges[mode]), [anchorDate, appData.activity, mode, ranges]);
  const selected = points.find(point => point.key === selectedKey) || points.findLast(point => point.total > 0);
  const earliest = availableDates[0];
  const latest = availableDates.at(-1);
  const windowStart = points[0]?.startDate;
  const windowEnd = points.at(-1)?.endDate;
  const canPrevious = Boolean(earliest && earliest < windowStart);
  const canNext = Boolean(latest && latest > windowEnd);

  useEffect(() => {
    const close = event => { if (event.key === 'Escape' && !document.querySelector('[data-calendar-dialog="true"]')) { event.stopImmediatePropagation(); onClose(); } };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [onClose]);

  const shift = direction => {
    const days = mode === 'day' ? ranges.day : mode === 'week' ? ranges.week * 7 : null;
    const next = days ? calendarDates.addDays(anchorDate, direction * days) : calendarDates.addDateMonths(anchorDate, direction * ranges.month);
    setAnchorDate(next);
    setSelectedKey(next);
  };
  const swipe = useSwipePaging({ canPrevious, canNext, onPrevious: () => shift(-1), onNext: () => shift(1) });
  const commitRange = () => {
    const config = TREND_RANGE_CONFIG[mode];
    const value = Number(rangeDrafts[mode]);
    if (!Number.isInteger(value) || value < config.minimum || value > config.maximum) {
      showToast({ title: 'Invalid Range', message: `Enter a whole number from ${config.minimum} to ${config.maximum} ${config.unit}.`, type: 'warning' });
      setRangeDrafts(current => ({ ...current, [mode]: String(ranges[mode]) }));
      return;
    }
    setRanges(current => ({ ...current, [mode]: value }));
  };

  return (
    <motion.div className="fixed inset-0 z-[180] flex items-center justify-center bg-slate-950/90 p-3 backdrop-blur-lg sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose} data-activity-intensity-dialog="true">
      <motion.div role="dialog" aria-modal="true" aria-label="Activity intensity breakdown" className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-white/10 bg-slate-950 shadow-2xl" initial={{ opacity: 0, scale: 0.98, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 12 }} onMouseDown={event => event.stopPropagation()}>
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-slate-950/95 px-4 py-4 backdrop-blur-xl sm:px-6">
          <button type="button" onClick={onBack} className="rounded-xl p-2 text-slate-300 hover:bg-white/10 hover:text-white" aria-label="Back to Activity details"><ChevronLeft className="h-6 w-6" /></button>
          <h2 className="font-outfit text-xl font-semibold text-slate-100">Activity Intensity</h2>
          <div className="flex items-center gap-1"><CalendarPicker availableDates={availableDates} selectedDate={anchorDate} onSelect={date => { setAnchorDate(date); setSelectedKey(date); }} calendarScope="nested" buttonClassName="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-slate-100" buttonLabel="Choose Activity Intensity date" /><button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Close Activity Intensity"><X className="h-5 w-5" /></button></div>
        </header>
        <div className="space-y-6 p-4 sm:p-7">
          <div className="grid grid-cols-3 rounded-2xl bg-slate-900/80 p-1">{[['day', 'Day'], ['week', 'Week'], ['month', 'Month']].map(([key, label]) => <button key={key} type="button" onClick={() => { setMode(key); setAnchorDate(initialDate); setSelectedKey(initialDate); }} className={`rounded-xl px-3 py-3 font-outfit text-base font-semibold ${mode === key ? 'bg-slate-100 text-slate-950' : 'text-cyan-300 hover:bg-white/5'}`}>{label}</button>)}</div>
          <div className="flex justify-end"><label className="flex items-center gap-2 text-sm text-slate-400">Range<input type="number" min={TREND_RANGE_CONFIG[mode].minimum} max={TREND_RANGE_CONFIG[mode].maximum} value={rangeDrafts[mode]} onChange={event => setRangeDrafts(current => ({ ...current, [mode]: event.target.value }))} onBlur={commitRange} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); commitRange(); event.currentTarget.blur(); } }} className="w-20 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-center font-outfit text-slate-100 outline-none focus:border-cyan-300" /> <span>{TREND_RANGE_CONFIG[mode].unit}</span></label></div>
          <div><p className="font-outfit text-5xl font-light tabular-nums text-slate-100">{formatActivityDuration((selected?.total || 0) * 60)}</p><p className="mt-2 text-sm text-slate-400">Average intensity-classified time</p></div>
          <div className="flex touch-pan-y items-center gap-2" {...swipe}><button type="button" disabled={!canPrevious} onClick={() => shift(-1)} className="h-12 w-11 flex-shrink-0 rounded-xl border border-white/10 bg-slate-900 text-slate-300 disabled:opacity-25"><ChevronLeft className="mx-auto h-5 w-5" /></button><div className="min-w-0 flex-1"><IntensityChart points={points} selectedKey={selected?.key} onSelect={setSelectedKey} /></div><button type="button" disabled={!canNext} onClick={() => shift(1)} className="h-12 w-11 flex-shrink-0 rounded-xl border border-white/10 bg-slate-900 text-slate-300 disabled:opacity-25"><ChevronRight className="mx-auto h-5 w-5" /></button></div>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-3 rounded-2xl border border-white/10 bg-slate-900/45 p-4">{ACTIVITY_INTENSITY_LEVELS.map(level => <span key={level.key} className="flex items-center gap-2 text-sm text-slate-300"><span className="h-3 w-3 rounded-sm" style={{ backgroundColor: level.color }} />{level.label}</span>)}</div>
          <TrendPeriodFooter kind={mode} startDate={windowStart} endDate={windowEnd} summary="Vigorous – Sedentary" />
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ActivityIntensityDrilldownModal(props) {
  if (typeof document === 'undefined') return null;
  return createPortal(<ActivityIntensityContent {...props} />, document.body);
}
