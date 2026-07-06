import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import CalendarPicker from './CalendarPicker';
import { formatChartPointLabel, SvgChartPointLabel, useChartPointLabel } from './ChartPointLabel';
import UnavailableState from './UnavailableState';
import useSwipePaging from '../hooks/useSwipePaging';
import { avoidCircleLabelCollision } from '../utils/chartGeometry';
import { getCardiovascularHistory } from '../utils/cardiovascularDetails';
import { calendarDates } from '../utils/dateService';
import { getAvailableRecordDates } from '../utils/dataAvailability';
import { METRIC_COLORS } from '../utils/colors';

function CardiovascularHistory({ history, selectedDate, onSelectDate, onPrevious, onNext, canPrevious, canNext }) {
  const labelState = useChartPointLabel();
  const width = 1100;
  const height = 340;
  const baseline = 252;
  const top = 70;
  const slotWidth = width / history.length;
  const pulseValues = history.map(day => day.pulseWaveVelocity).filter(value => value !== null);
  const ageValues = history.map(day => day.vascularAge).filter(value => value !== null);
  const pulseMinimum = pulseValues.length ? Math.min(...pulseValues) : 5;
  const pulseMaximum = pulseValues.length ? Math.max(...pulseValues) : 7;
  const pulseRange = Math.max(0.25, pulseMaximum - pulseMinimum);
  const ageMinimum = ageValues.length ? Math.min(...ageValues) : 35;
  const ageMaximum = ageValues.length ? Math.max(...ageValues) : 45;
  const ageRange = Math.max(4, ageMaximum - ageMinimum);
  const barHeightFor = value => value === null ? 5 : 42 + ((value - pulseMinimum) / pulseRange) * 112;
  const ageYFor = value => top + ((ageMaximum - value) / ageRange) * 92;
  const linePoints = history
    .map((day, index) => day.vascularAge === null ? null : `${slotWidth * index + slotWidth / 2},${ageYFor(day.vascularAge)}`)
    .filter(Boolean)
    .join(' ');
  const selected = calendarDates.getDatePresentation(selectedDate);
  const swipe = useSwipePaging({ canPrevious, canNext, onPrevious, onNext });

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950/35 p-4 sm:p-6">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Overview</p>
        <h3 className="mt-1 font-outfit text-2xl font-semibold text-slate-100">{selected.weekdayShort}, {selected.monthShort} {selected.dayOfMonth}</h3>
        <p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-500">7-Day Trend · Past 14 Days</p>
      </div>
      <div className="mt-4 flex touch-pan-y items-center gap-2" {...swipe}>
        <button type="button" onClick={onPrevious} disabled={!canPrevious} className="h-12 w-10 flex-shrink-0 rounded-xl border border-white/10 bg-slate-800/70 text-slate-300 disabled:opacity-25" aria-label="Previous fourteen cardiovascular days"><ChevronLeft className="mx-auto h-5 w-5" /></button>
        <div className="min-w-0 flex-1 overflow-x-auto pb-2 scrollbar-hide">
          <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[52rem] w-full" role="img" aria-label="Pulse wave velocity bars and vascular age for fourteen days">
            <line x1="0" y1={baseline} x2={width} y2={baseline} stroke="rgba(148,163,184,0.22)" />
            {history.map((day, index) => {
              const x = slotWidth * index + slotWidth * 0.18;
              const barWidth = slotWidth * 0.64;
              const barHeight = barHeightFor(day.pulseWaveVelocity);
              const centerX = slotWidth * index + slotWidth / 2;
              const circleY = day.vascularAge === null ? null : ageYFor(day.vascularAge);
              const rawLabelY = baseline - barHeight - 10;
              const labelY = avoidCircleLabelCollision(rawLabelY, circleY, { minimum: 22, maximum: baseline - 12 });
              const date = calendarDates.getDatePresentation(day.date);
              const active = day.date === selectedDate;
              const available = day.pulseWaveVelocity !== null || day.vascularAge !== null;
              return (
                <g key={day.date} role={available ? 'button' : undefined} tabIndex={available ? 0 : undefined} className={available ? 'cursor-pointer outline-none' : undefined} onClick={available ? () => { onSelectDate(day.date); labelState.showClicked(day.date); } : undefined} onMouseEnter={available ? () => labelState.showHovered(day.date) : undefined} onMouseLeave={available ? () => labelState.hideHovered(day.date) : undefined} onFocus={available ? () => labelState.showHovered(day.date) : undefined} onBlur={available ? () => labelState.hideHovered(day.date) : undefined} onKeyDown={available ? event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelectDate(day.date); labelState.showClicked(day.date); } } : undefined}>
                  <rect x={slotWidth * index} y="0" width={slotWidth} height={height} fill="transparent" />
                  <rect x={x} y={baseline - barHeight} width={barWidth} height={barHeight} rx="9" fill={METRIC_COLORS.cardiovascular} opacity={active ? 1 : day.pulseWaveVelocity === null ? 0.08 : 0.38} stroke={active ? '#67e8f9' : 'transparent'} strokeWidth="3" />
                  {day.pulseWaveVelocity !== null && <text x={centerX} y={labelY} textAnchor="middle" fill="rgba(226,232,240,0.9)" fontSize="17" fontWeight="700">{day.pulseWaveVelocity.toFixed(2)}</text>}
                  <text x={centerX} y="286" textAnchor="middle" fill={active ? '#67e8f9' : 'rgba(148,163,184,0.72)'} fontSize="17" fontWeight={active ? '700' : '500'}>{date.weekdayShort}</text>
                  <text x={centerX} y="312" textAnchor="middle" fill={active ? '#67e8f9' : 'rgba(148,163,184,0.72)'} fontSize="15" fontWeight={active ? '700' : '500'}>{date.month}/{date.dayOfMonth}</text>
                </g>
              );
            })}
            {linePoints && <polyline points={linePoints} fill="none" stroke="rgba(226,232,240,0.62)" strokeWidth="5" strokeDasharray="9 8" strokeLinejoin="round" pointerEvents="none" />}
            {history.map((day, index) => day.vascularAge === null ? null : (
              <g key={`${day.date}-age`} pointerEvents="none">
                <circle cx={slotWidth * index + slotWidth / 2} cy={ageYFor(day.vascularAge)} r="21" fill="#e2e8f0" stroke={day.date === selectedDate ? '#67e8f9' : '#cbd5e1'} strokeWidth="4" />
                <text x={slotWidth * index + slotWidth / 2} y={ageYFor(day.vascularAge) + 7} textAnchor="middle" fill="#0f172a" fontSize="20" fontWeight="800">{Math.round(day.vascularAge)}</text>
              </g>
            ))}
            {history.map((day, index) => day.date === labelState.activeKey ? <SvgChartPointLabel key={`label-${day.date}`} x={slotWidth * index + slotWidth / 2} y={day.vascularAge === null ? baseline - barHeightFor(day.pulseWaveVelocity) : ageYFor(day.vascularAge)} label={formatChartPointLabel(day.date)} chartWidth={width} chartHeight={height} fading={labelState.fading} /> : null)}
          </svg>
        </div>
        <button type="button" onClick={onNext} disabled={!canNext} className="h-12 w-10 flex-shrink-0 rounded-xl border border-white/10 bg-slate-800/70 text-slate-300 disabled:opacity-25" aria-label="Next fourteen cardiovascular days"><ChevronRight className="mx-auto h-5 w-5" /></button>
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-6 text-sm text-slate-400">
        <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-slate-200" />Pulse Wave Velocity (m/s)</span>
        <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-slate-200 ring-2 ring-slate-400" />Vascular Age</span>
      </div>
    </section>
  );
}

export default function CardioDetailModal({ appData, selectedDate, onClose }) {
  const [detailDate, setDetailDate] = useState(selectedDate);
  const [anchorDate, setAnchorDate] = useState(selectedDate);
  const availableDates = useMemo(() => getAvailableRecordDates(appData.cardiovascularage, record => {
    const vascularAge = record?.vascular_age;
    const pulseWaveVelocity = record?.pulse_wave_velocity;
    return (vascularAge !== '' && vascularAge !== null && vascularAge !== undefined && Number.isFinite(Number(vascularAge)))
      || (pulseWaveVelocity !== '' && pulseWaveVelocity !== null && pulseWaveVelocity !== undefined && Number.isFinite(Number(pulseWaveVelocity)));
  }), [appData.cardiovascularage]);
  const history = useMemo(() => getCardiovascularHistory(appData.cardiovascularage, anchorDate), [anchorDate, appData.cardiovascularage]);
  const earliest = availableDates[0];
  const latest = availableDates.at(-1);
  const canPrevious = Boolean(earliest && earliest < history[0]?.date);
  const canNext = Boolean(latest && latest > history.at(-1)?.date);

  const shift = direction => {
    const next = calendarDates.addDays(anchorDate, direction * 14);
    setAnchorDate(next);
    setDetailDate(next);
  };

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const close = event => { if (event.key === 'Escape' && !document.querySelector('[data-calendar-dialog="true"]')) onClose(); };
    document.addEventListener('keydown', close);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', close); };
  }, [onClose]);

  return (
    <motion.div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/85 p-3 backdrop-blur-md sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose} data-cardio-detail-dialog="true">
      <motion.div role="dialog" aria-modal="true" aria-label="Cardiovascular Health details" className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-white/10 bg-slate-950/95 shadow-2xl shadow-black/60" initial={{ opacity: 0, scale: 0.98, y: 14 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 14 }} onMouseDown={event => event.stopPropagation()}>
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-slate-950 px-5 py-4 sm:px-7">
          <div><h2 className="font-outfit text-xl font-semibold text-slate-100">Cardiovascular Health</h2><p className="mt-0.5 text-xs text-slate-500">Vascular age and pulse wave velocity</p></div>
          <div className="flex items-center gap-1">
            <CalendarPicker availableDates={availableDates} selectedDate={detailDate} onSelect={date => { setDetailDate(date); setAnchorDate(date); }} calendarScope="nested" buttonClassName="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-slate-100" buttonLabel="Choose Cardiovascular Health date" />
            <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Close Cardiovascular Health details"><X className="h-5 w-5" /></button>
          </div>
        </header>
        <div className="space-y-7 p-5 sm:p-7">
          {(history.some(day => day.vascularAge !== null || day.pulseWaveVelocity !== null)) ? <CardiovascularHistory history={history} selectedDate={detailDate} onSelectDate={setDetailDate} onPrevious={() => shift(-1)} onNext={() => shift(1)} canPrevious={canPrevious} canNext={canNext} /> : <UnavailableState title="Cardiovascular trend unavailable" />}
        </div>
      </motion.div>
    </motion.div>
  );
}
