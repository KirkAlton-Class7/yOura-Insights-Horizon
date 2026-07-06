import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import CalendarPicker from './CalendarPicker';
import { formatChartPointLabel, SvgChartPointLabel, useChartPointLabel } from './ChartPointLabel';
import UnavailableState from './UnavailableState';
import useSwipePaging from '../hooks/useSwipePaging';
import { SEMANTIC_COLORS } from '../utils/colors';
import { calendarDates } from '../utils/dateService';
import { getAvailableRecordDates } from '../utils/dataAvailability';
import { formatWearDuration, getWearCoverage, getWearCoverageHistory } from '../utils/wearCoverage';

const coverageColor = value => {
  if (value >= 90) return SEMANTIC_COLORS.optimal;
  if (value >= 75) return SEMANTIC_COLORS.good;
  if (value >= 50) return SEMANTIC_COLORS.fair;
  return SEMANTIC_COLORS.bad;
};

const smoothPath = points => {
  if (!points.length) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  return points.slice(1).reduce((path, point, index) => {
    const previous = points[index];
    const midpoint = (previous.x + point.x) / 2;
    return `${path} C ${midpoint} ${previous.y}, ${midpoint} ${point.y}, ${point.x} ${point.y}`;
  }, `M ${points[0].x} ${points[0].y}`);
};

const continuousSegments = points => points.reduce((segments, point) => {
  if (!point) return [...segments, []];
  const current = segments.at(-1);
  current.push(point);
  return segments;
}, [[]]).filter(segment => segment.length);

function WearCoverageOverview({ history, selectedDate, onSelectDate, onPrevious, onNext, canPrevious, canNext }) {
  const gradientId = useId().replaceAll(':', '');
  const labelState = useChartPointLabel();
  const scrollRef = useRef(null);
  const width = 1100;
  const height = 340;
  const padding = { left: 30, right: 90, top: 42, bottom: 76 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const slotWidth = plotWidth / history.length;
  const xFor = index => padding.left + index * slotWidth + slotWidth / 2;
  const yFor = value => padding.top + ((100 - value) / 100) * plotHeight;
  const chartPoints = history.map((day, index) => day.completeness === null ? null : ({ ...day, index, x: xFor(index), y: yFor(day.completeness) }));
  const segments = continuousSegments(chartPoints);
  const selected = calendarDates.getDatePresentation(selectedDate);
  const swipe = useSwipePaging({ canPrevious, canNext, onPrevious, onNext });

  useEffect(() => {
    const container = scrollRef.current;
    const index = history.findIndex(day => day.date === selectedDate);
    if (!container || index < 0) return;
    const slotPixels = container.scrollWidth / history.length;
    container.scrollLeft = Math.max(0, slotPixels * (index + 0.5) - container.clientWidth / 2);
  }, [history, selectedDate]);

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950/35 p-4 sm:p-6">
      <div className="text-center"><p className="text-xs uppercase tracking-[0.16em] text-slate-500">Overview</p><h3 className="mt-1 font-outfit text-2xl font-semibold text-slate-100">{selected.weekdayShort}, {selected.monthShort} {selected.dayOfMonth}</h3><p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-500">Past 14 Days</p></div>
      <div className="mt-4 flex touch-pan-y items-center gap-2" {...swipe}>
        <button type="button" onClick={onPrevious} disabled={!canPrevious} className="h-12 w-10 flex-shrink-0 rounded-xl border border-white/10 bg-slate-800/70 text-slate-300 disabled:opacity-25" aria-label="Previous fourteen wear coverage days"><ChevronLeft className="mx-auto h-5 w-5" /></button>
        <div ref={scrollRef} className="min-w-0 flex-1 overflow-x-auto pb-2 scrollbar-hide">
          <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[52rem] w-full" role="img" aria-label="Ring wear and activity record completeness over fourteen days">
            <defs><linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1="0" y1={padding.top} x2="0" y2={padding.top + plotHeight}><stop offset="0%" stopColor={SEMANTIC_COLORS.optimal} /><stop offset="10%" stopColor={SEMANTIC_COLORS.optimal} /><stop offset="25%" stopColor={SEMANTIC_COLORS.good} /><stop offset="50%" stopColor={SEMANTIC_COLORS.fair} /><stop offset="100%" stopColor={SEMANTIC_COLORS.bad} /></linearGradient></defs>
            {[100, 75, 50, 0].map(value => <g key={value}><line x1={padding.left} y1={yFor(value)} x2={width - padding.right} y2={yFor(value)} stroke="rgba(148,163,184,0.14)" /><text x={width - 8} y={yFor(value) + 6} textAnchor="end" fill="rgba(203,213,225,0.62)" fontSize="16">{value}%</text></g>)}
            {segments.map((segment, index) => <path key={index} d={smoothPath(segment)} fill="none" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />)}
            {history.map((day, index) => {
              const presentation = calendarDates.getDatePresentation(day.date);
              const active = day.date === selectedDate;
              const point = chartPoints[index];
              const selectable = day.result.available;
              return <g key={day.date} role={selectable ? 'button' : undefined} tabIndex={selectable ? 0 : undefined} className={selectable ? 'cursor-pointer outline-none' : undefined} onClick={selectable ? () => { onSelectDate(day.date); labelState.showClicked(day.date); } : undefined} onMouseEnter={selectable ? () => labelState.showHovered(day.date) : undefined} onMouseLeave={selectable ? () => labelState.hideHovered(day.date) : undefined} onFocus={selectable ? () => labelState.showHovered(day.date) : undefined} onBlur={selectable ? () => labelState.hideHovered(day.date) : undefined} onKeyDown={selectable ? event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelectDate(day.date); labelState.showClicked(day.date); } } : undefined}>
                <rect x={padding.left + index * slotWidth} y={padding.top} width={slotWidth} height={plotHeight + padding.bottom} fill="transparent" />
                {point ? <><circle cx={point.x} cy={point.y} r={active ? 8 : 5.5} fill={coverageColor(day.completeness)} stroke={active ? '#67e8f9' : day.isPartial ? 'rgba(248,250,252,0.65)' : '#f8fafc'} strokeWidth={active ? 4 : 2} strokeDasharray={day.isPartial ? '3 2' : undefined} />{day.date === labelState.activeKey && <SvgChartPointLabel x={point.x} y={point.y} label={`${formatChartPointLabel(day.date)} · ${day.completeness.toFixed(1)}%`} chartWidth={width} chartHeight={height} fading={labelState.fading} />}</> : <circle cx={xFor(index)} cy={padding.top + plotHeight} r="4" fill="rgba(148,163,184,0.18)" />}
                <text x={xFor(index)} y={height - 42} textAnchor="middle" fill={active ? '#67e8f9' : 'rgba(148,163,184,0.72)'} fontSize="16" fontWeight={active ? '700' : '500'}>{presentation.weekdayShort}</text><text x={xFor(index)} y={height - 17} textAnchor="middle" fill={active ? '#67e8f9' : 'rgba(148,163,184,0.72)'} fontSize="14" fontWeight={active ? '700' : '500'}>{presentation.month}/{presentation.dayOfMonth}</text>
              </g>;
            })}
          </svg>
        </div>
        <button type="button" onClick={onNext} disabled={!canNext} className="h-12 w-10 flex-shrink-0 rounded-xl border border-white/10 bg-slate-800/70 text-slate-300 disabled:opacity-25" aria-label="Next fourteen wear coverage days"><ChevronRight className="mx-auto h-5 w-5" /></button>
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-5 text-xs text-slate-400">{[['Excellent', SEMANTIC_COLORS.optimal], ['Good', SEMANTIC_COLORS.good], ['Fair', SEMANTIC_COLORS.fair], ['Poor', SEMANTIC_COLORS.bad]].map(([label, color]) => <span key={label} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />{label}</span>)}<span className="text-slate-500">Partial days plot activity-record completeness.</span></div>
    </section>
  );
}

export default function WearCoverageDetailModal({ appData, selectedDate, onClose }) {
  const [detailDate, setDetailDate] = useState(selectedDate);
  const [anchorDate, setAnchorDate] = useState(selectedDate);
  const availableDates = useMemo(() => getAvailableRecordDates(appData.activity, record => getWearCoverage(record).available), [appData.activity]);
  const history = useMemo(() => getWearCoverageHistory(appData.activity, anchorDate), [anchorDate, appData.activity]);
  const result = getWearCoverage(appData.activity?.[detailDate]?.[0]);
  const earliest = availableDates[0];
  const latest = availableDates.at(-1);
  const canPrevious = Boolean(earliest && earliest < history[0]?.date);
  const canNext = Boolean(latest && latest > history.at(-1)?.date);
  const shift = direction => { const next = calendarDates.addDays(anchorDate, direction * 14); setAnchorDate(next); setDetailDate(next); };

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const close = event => { if (event.key === 'Escape' && !document.querySelector('[data-calendar-dialog="true"]')) onClose(); };
    document.addEventListener('keydown', close);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', close); };
  }, [onClose]);

  const summary = !result.available ? 'Wear coverage unavailable' : result.isPartial ? `Incomplete day · ${result.recordedPercentage.toFixed(1)}% activity record available` : `${result.coverage.toFixed(1)}% coverage · ${formatWearDuration(result.nonWearSeconds)} non-wear`;
  return <motion.div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/85 p-3 backdrop-blur-md sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose} data-wear-coverage-dialog="true"><motion.div role="dialog" aria-modal="true" aria-label="Ring Wear Coverage details" className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-white/10 bg-slate-950/95 shadow-2xl shadow-black/60" initial={{ opacity: 0, scale: 0.98, y: 14 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 14 }} onMouseDown={event => event.stopPropagation()}><header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-slate-950 px-5 py-4 sm:px-7"><div><h2 className="font-outfit text-xl font-semibold text-slate-100">Ring Wear Coverage</h2><p className="mt-0.5 text-xs text-slate-500">{summary}</p></div><div className="flex items-center gap-1"><CalendarPicker availableDates={availableDates} selectedDate={detailDate} onSelect={date => { setDetailDate(date); setAnchorDate(date); }} calendarScope="nested" buttonClassName="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-slate-100" buttonLabel="Choose Ring Wear Coverage date" /><button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Close Ring Wear Coverage"><X className="h-5 w-5" /></button></div></header><div className="p-5 sm:p-7">{history.some(day => day.completeness !== null) ? <WearCoverageOverview history={history} selectedDate={detailDate} onSelectDate={setDetailDate} onPrevious={() => shift(-1)} onNext={() => shift(1)} canPrevious={canPrevious} canNext={canNext} /> : <UnavailableState title="Wear coverage trend unavailable" description="No Daily Activity records were available in this period." />}</div></motion.div></motion.div>;
}
