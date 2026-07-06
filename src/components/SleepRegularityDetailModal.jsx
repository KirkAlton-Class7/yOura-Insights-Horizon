import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Info, X } from 'lucide-react';
import CalendarPicker from './CalendarPicker';
import { formatChartPointLabel, SvgChartPointLabel, useChartPointLabel } from './ChartPointLabel';
import SleepInfoModal from './SleepInfoModal';
import TrendPeriodFooter from './TrendPeriodFooter';
import UnavailableState from './UnavailableState';
import { calendarDates } from '../utils/dateService';
import { getAvailableRecordDates } from '../utils/dataAvailability';
import { SEMANTIC_COLORS } from '../utils/colors';
import { formatClockMinutes, getSleepRegularityHistory } from '../utils/sleepRegularityDetails';

const REGULARITY_TICKS = Object.freeze([0, 60, 70, 85, 100]);
const REGULARITY_BANDS = Object.freeze([
  { label: 'Bad', middle: 30, color: SEMANTIC_COLORS.bad },
  { label: 'Fair', middle: 65, color: SEMANTIC_COLORS.fair },
  { label: 'Good', middle: 77.5, color: SEMANTIC_COLORS.good },
  { label: 'Optimal', middle: 92.5, color: SEMANTIC_COLORS.optimal },
]);
const CLOCK_TICKS = Object.freeze([
  { value: 18 * 60, label: '6 PM' },
  { value: 24 * 60, label: '12 AM' },
  { value: 30 * 60, label: '6 AM' },
  { value: 36 * 60, label: '12 PM' },
]);

const normalizeInterval = day => {
  if (day.bedtimeMinutes === null || day.wakeMinutes === null) return null;
  const bedtime = day.bedtimeMinutes < 12 * 60 ? day.bedtimeMinutes + 24 * 60 : day.bedtimeMinutes;
  let wake = day.wakeMinutes;
  if (wake <= bedtime) wake += 24 * 60;
  return { bedtime, wake };
};

const activateWithKeyboard = (event, callback) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    callback();
  }
};

function RegularityChart({ history, selected, onSelect }) {
  const labelState = useChartPointLabel();
  const width = 920;
  const height = 390;
  const padding = { left: 72, right: 126, top: 36, bottom: 66 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const xFor = index => padding.left + (index / Math.max(1, history.length - 1)) * plotWidth;
  const yFor = value => padding.top + ((100 - value) / 100) * plotHeight;
  const observed = history
    .map((day, index) => ({ day, index }))
    .filter(point => point.day.score !== null);

  if (!observed.length) {
    return <UnavailableState title="Sleep regularity unavailable" description="At least five nights of bedtime and wake-time data are required." />;
  }

  return (
    <div className="overflow-x-auto scrollbar-hide">
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[45rem] w-full" role="img" aria-label="Sleep regularity over seven days">
        {REGULARITY_TICKS.map(value => (
          <g key={value}>
            <line x1={padding.left} y1={yFor(value)} x2={width - padding.right} y2={yFor(value)} stroke="rgba(148,163,184,0.16)" />
            <text x={padding.left - 13} y={yFor(value) + 6} textAnchor="end" fill="rgba(203,213,225,0.76)" fontSize="17">{value}</text>
          </g>
        ))}

        {REGULARITY_BANDS.map(band => {
          const active = selected?.status === band.label;
          return (
            <text
              key={band.label}
              x={width - 10}
              y={yFor(band.middle) + 6}
              textAnchor="end"
              fill={active ? band.color : 'rgba(203,213,225,0.58)'}
              fontSize={active ? '20' : '18'}
              fontWeight={active ? '800' : '500'}
            >
              {band.label}
            </text>
          );
        })}

        <polyline
          points={observed.map(point => `${xFor(point.index)},${yFor(point.day.score)}`).join(' ')}
          fill="none"
          stroke="#f8fafc"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {observed.map(point => {
          const isSelected = point.day.date === selected?.date;
          return (
            <g
              key={point.day.date}
              role="button"
              tabIndex="0"
              aria-label={`Select ${point.day.date}, ${point.day.status} sleep regularity, score ${point.day.score}`}
              onClick={() => { onSelect(point.day.date); labelState.showClicked(point.day.date); }}
              onMouseEnter={() => labelState.showHovered(point.day.date)}
              onMouseLeave={() => labelState.hideHovered(point.day.date)}
              onFocus={() => labelState.showHovered(point.day.date)}
              onBlur={() => labelState.hideHovered(point.day.date)}
              onKeyDown={event => activateWithKeyboard(event, () => { onSelect(point.day.date); labelState.showClicked(point.day.date); })}
              className="cursor-pointer outline-none"
            >
              <circle cx={xFor(point.index)} cy={yFor(point.day.score)} r="18" fill="transparent" />
              <circle
                cx={xFor(point.index)}
                cy={yFor(point.day.score)}
                r={isSelected ? 10 : 5}
                fill="#f8fafc"
                stroke={isSelected ? '#67e8f9' : '#f8fafc'}
                strokeWidth={isSelected ? 5 : 2}
              />
            </g>
          );
        })}

        {history.map((day, index) => (
          <text
            key={day.date}
            x={xFor(index)}
            y={height - 25}
            textAnchor="middle"
            fill={day.date === selected?.date ? '#f8fafc' : 'rgba(148,163,184,0.72)'}
            fontSize="16"
            fontWeight={day.date === selected?.date ? '700' : '500'}
          >
            {calendarDates.getDatePresentation(day.date).weekdayShort}
          </text>
        ))}
        {observed.map(point => point.day.date === labelState.activeKey ? (
          <SvgChartPointLabel key={`label-${point.day.date}`} x={xFor(point.index)} y={yFor(point.day.score)} label={formatChartPointLabel(point.day.date)} chartWidth={width} chartHeight={height} fading={labelState.fading} />
        ) : null)}
      </svg>
    </div>
  );
}

function TimeInBedChart({ history, selected, onSelect }) {
  const labelState = useChartPointLabel();
  const width = 920;
  const height = 390;
  const padding = { left: 82, right: 34, top: 34, bottom: 66 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const xFor = index => padding.left + ((index + 0.5) / history.length) * plotWidth;
  const yFor = value => padding.top + ((value - CLOCK_TICKS[0].value) / (CLOCK_TICKS.at(-1).value - CLOCK_TICKS[0].value)) * plotHeight;
  const observed = history
    .map((day, index) => ({ day, index, interval: normalizeInterval(day) }))
    .filter(point => point.interval !== null);

  if (!observed.length) {
    return <UnavailableState title="Time in bed unavailable" description="No bedtime and wake-time intervals were available for this period." />;
  }

  return (
    <div className="overflow-x-auto scrollbar-hide">
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[45rem] w-full" role="img" aria-label="Time in bed over seven days">
        {CLOCK_TICKS.map(tick => (
          <g key={tick.value}>
            <line x1={padding.left} y1={yFor(tick.value)} x2={width - padding.right} y2={yFor(tick.value)} stroke="rgba(148,163,184,0.16)" />
            <text x={padding.left - 12} y={yFor(tick.value) + 6} textAnchor="end" fill="rgba(203,213,225,0.76)" fontSize="17">{tick.label}</text>
          </g>
        ))}

        {observed.map(point => {
          const isSelected = point.day.date === selected?.date;
          const x = xFor(point.index);
          const start = Math.max(CLOCK_TICKS[0].value, point.interval.bedtime);
          const end = Math.min(CLOCK_TICKS.at(-1).value, point.interval.wake);
          const top = yFor(start);
          const bottom = yFor(end);
          return (
            <g
              key={point.day.date}
              role="button"
              tabIndex="0"
              aria-label={`Select ${point.day.date}, ${formatClockMinutes(point.day.bedtimeMinutes)} to ${formatClockMinutes(point.day.wakeMinutes)}`}
              onClick={() => { onSelect(point.day.date); labelState.showClicked(point.day.date); }}
              onMouseEnter={() => labelState.showHovered(point.day.date)}
              onMouseLeave={() => labelState.hideHovered(point.day.date)}
              onFocus={() => labelState.showHovered(point.day.date)}
              onBlur={() => labelState.hideHovered(point.day.date)}
              onKeyDown={event => activateWithKeyboard(event, () => { onSelect(point.day.date); labelState.showClicked(point.day.date); })}
              className="cursor-pointer outline-none"
            >
              <rect x={x - 24} y={padding.top} width="48" height={plotHeight} fill="transparent" />
              <line x1={x} y1={top} x2={x} y2={bottom} stroke={isSelected ? '#67e8f9' : '#f8fafc'} strokeWidth={isSelected ? '17' : '13'} strokeLinecap="round" opacity={isSelected ? '1' : '0.82'} />
              <circle cx={x} cy={top} r={isSelected ? '8' : '6'} fill="#f8fafc" stroke={isSelected ? '#67e8f9' : '#f8fafc'} strokeWidth="3" />
              <circle cx={x} cy={bottom} r={isSelected ? '8' : '6'} fill="#f8fafc" stroke={isSelected ? '#67e8f9' : '#f8fafc'} strokeWidth="3" />
            </g>
          );
        })}

        {history.map((day, index) => (
          <text key={day.date} x={xFor(index)} y={height - 25} textAnchor="middle" fill={day.date === selected?.date ? '#f8fafc' : 'rgba(148,163,184,0.72)'} fontSize="16" fontWeight={day.date === selected?.date ? '700' : '500'}>
            {calendarDates.getDatePresentation(day.date).weekdayShort}
          </text>
        ))}
        {observed.map(point => point.day.date === labelState.activeKey ? (
          <SvgChartPointLabel key={`label-${point.day.date}`} x={xFor(point.index)} y={Math.min(yFor(point.interval.bedtime), yFor(point.interval.wake))} label={formatChartPointLabel(point.day.date)} chartWidth={width} chartHeight={height} fading={labelState.fading} />
        ) : null)}
      </svg>
    </div>
  );
}

export default function SleepRegularityDetailModal({ appData, selectedDate, onClose }) {
  const [mode, setMode] = useState('regularity');
  const [anchorDate, setAnchorDate] = useState(selectedDate);
  const [selectedPointDate, setSelectedPointDate] = useState(selectedDate);
  const [showInfo, setShowInfo] = useState(false);
  const history = useMemo(() => getSleepRegularityHistory(appData.sleepmodel || {}, anchorDate), [anchorDate, appData.sleepmodel]);
  const availableDates = useMemo(() => getAvailableRecordDates(
    appData.sleepmodel,
    record => Boolean(record?.bedtime_start && record?.bedtime_end),
  ), [appData.sleepmodel]);
  const selected = history.find(day => day.date === selectedPointDate) || history.findLast(day => day.score !== null || day.bedtimeMinutes !== null) || history.at(-1);
  const firstAvailable = availableDates[0];
  const lastAvailable = availableDates.at(-1);
  const canPrevious = Boolean(firstAvailable && firstAvailable < history[0].date);
  const canNext = Boolean(lastAvailable && lastAvailable > anchorDate);

  const movePeriod = days => {
    const nextAnchor = calendarDates.addDays(anchorDate, days);
    setAnchorDate(nextAnchor);
    setSelectedPointDate(nextAnchor);
  };

  useEffect(() => {
    const closeOnEscape = event => {
      if (
        event.key === 'Escape'
        && !document.querySelector('[data-calendar-dialog="true"]')
        && !document.querySelector('[data-sleep-info-dialog="true"]')
      ) onClose();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  return (
    <>
      <motion.div
        className="fixed inset-0 z-[180] flex items-center justify-center bg-slate-950/90 p-3 backdrop-blur-lg sm:p-6"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        data-sleep-regularity-dialog="true"
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Sleep regularity details"
          className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-white/10 bg-slate-950 shadow-2xl"
          initial={{ opacity: 0, scale: 0.98, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 12 }}
          onMouseDown={event => event.stopPropagation()}
        >
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-slate-950/95 px-4 py-4 backdrop-blur-xl sm:px-6">
            <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-300 hover:bg-white/10 hover:text-white" aria-label="Back to Sleep details"><ChevronLeft className="h-6 w-6" /></button>
            <h2 className="font-outfit text-xl font-semibold text-slate-100">Sleep Regularity</h2>
            <div className="flex items-center gap-1">
              <CalendarPicker availableDates={availableDates} selectedDate={anchorDate} onSelect={date => { setAnchorDate(date); setSelectedPointDate(date); }} calendarScope="nested" buttonClassName="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-slate-100" buttonLabel="Choose Sleep Regularity date" />
              <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Close sleep regularity details"><X className="h-5 w-5" /></button>
            </div>
          </header>

          <div className="space-y-7 p-4 sm:p-7">
            <div className="grid grid-cols-2 rounded-2xl bg-slate-900/80 p-1">
              {[['regularity', 'Sleep Regularity'], ['timeInBed', 'Time in Bed']].map(([key, label]) => (
                <button key={key} type="button" onClick={() => setMode(key)} className={`rounded-xl px-3 py-3 font-outfit text-base font-semibold transition-colors ${mode === key ? 'bg-slate-100 text-slate-950' : 'text-slate-300 hover:bg-white/5'}`} aria-pressed={mode === key}>{label}</button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button type="button" disabled={!canPrevious} onClick={() => movePeriod(-7)} className="h-12 w-11 flex-shrink-0 rounded-xl border border-white/10 bg-slate-900 text-slate-300 disabled:opacity-25" aria-label="Previous seven sleep days"><ChevronLeft className="mx-auto h-5 w-5" /></button>
              <div className="min-w-0 flex-1">
                {mode === 'regularity'
                  ? <RegularityChart history={history} selected={selected} onSelect={setSelectedPointDate} />
                  : <TimeInBedChart history={history} selected={selected} onSelect={setSelectedPointDate} />}
              </div>
              <button type="button" disabled={!canNext} onClick={() => movePeriod(7)} className="h-12 w-11 flex-shrink-0 rounded-xl border border-white/10 bg-slate-900 text-slate-300 disabled:opacity-25" aria-label="Next seven sleep days"><ChevronRight className="mx-auto h-5 w-5" /></button>
            </div>

            <TrendPeriodFooter
              kind="dayToDay"
              startDate={history[0]?.date}
              endDate={history.at(-1)?.date}
              summary={mode === 'regularity'
                ? selected?.status
                : selected?.bedtimeMinutes === null || selected?.wakeMinutes === null
                  ? null
                  : `${formatClockMinutes(selected.bedtimeMinutes)} – ${formatClockMinutes(selected.wakeMinutes)}`}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => setShowInfo(true)} className="rounded-2xl border border-white/10 bg-slate-900/65 p-5 text-left transition-colors hover:border-cyan-300/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Sleep Regularity</p>
                    <p className="mt-3 font-outfit text-3xl font-light" style={{ color: selected?.color || SEMANTIC_COLORS.neutral }}>{selected?.status || '--'}</p>
                  </div>
                  <Info className="h-5 w-5 text-slate-400" />
                </div>
              </button>
              <div className="rounded-2xl border border-white/10 bg-slate-900/65 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Time in Bed</p>
                <p className="mt-3 font-outfit text-2xl font-light tabular-nums text-slate-100">
                  {selected?.bedtimeMinutes === null || selected?.wakeMinutes === null ? '--' : `${formatClockMinutes(selected.bedtimeMinutes)} – ${formatClockMinutes(selected.wakeMinutes)}`}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
      <AnimatePresence>{showInfo && <SleepInfoModal topic="regularity" onClose={() => setShowInfo(false)} />}</AnimatePresence>
    </>
  );
}
