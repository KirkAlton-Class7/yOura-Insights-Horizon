import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Info, X } from 'lucide-react';
import CalendarPicker from './CalendarPicker';
import { formatChartPointLabel, SvgChartPointLabel, useChartPointLabel } from './ChartPointLabel';
import MetricDrilldownModal from './MetricDrilldownModal';
import SleepInfoModal from './SleepInfoModal';
import TrendPeriodFooter from './TrendPeriodFooter';
import UnavailableState from './UnavailableState';
import { calendarDates } from '../utils/dateService';
import { getAvailableRecordDates } from '../utils/dataAvailability';
import { formatSleepDebt } from '../utils/sleepDebt';
import { getSleepDebtHistory } from '../utils/sleepDebtDetails';
import { formatSleepDuration } from '../utils/sleepDetails';

const hourValue = seconds => seconds === null ? null : seconds / 3600;

function DebtChart({ history, mode, selectedKey, onSelect }) {
  const labelState = useChartPointLabel();
  const width = 900;
  const height = 360;
  const padding = { left: 78, right: 142, top: 44, bottom: 70 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const selected = history.find(day => day.date === selectedKey) || history[history.length - 1];
  const xFor = index => padding.left + (index / Math.max(1, history.length - 1)) * plotWidth;
  const maxHours = mode === 'debt'
    ? Math.max(6, ...history.map(day => hourValue(day.debtSeconds) || 0))
    : Math.max(9, ...history.map(day => hourValue(day.totalSleepSeconds) || 0));
  const yFor = hours => padding.top + ((maxHours - hours) / maxHours) * plotHeight;
  const ticks = mode === 'debt' ? [0, 2, 5] : [0, 3, 6, 9].filter(value => value <= maxHours);
  const observed = history
    .map((day, index) => ({ day, index, value: hourValue(mode === 'debt' ? day.debtSeconds : day.totalSleepSeconds) }))
    .filter(point => point.value !== null);

  if (!observed.length) {
    return <UnavailableState title={`${mode === 'debt' ? 'Sleep debt' : 'Total sleep'} trend unavailable`} description="Not enough sleep history is available for this chart." />;
  }

  return (
    <div className="overflow-x-auto scrollbar-hide">
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[43rem] w-full" role="img" aria-label={`${mode === 'debt' ? 'Sleep debt' : 'Total sleep'} over seven days`}>
        {ticks.map(value => (
          <g key={value}>
            <line x1={padding.left} y1={yFor(value)} x2={width - padding.right} y2={yFor(value)} stroke="rgba(148,163,184,0.17)" />
            <text x={padding.left - 10} y={yFor(value) + 6} textAnchor="end" fill="rgba(203,213,225,0.78)" fontSize="17">
              {value}h 0m
            </text>
          </g>
        ))}
        {mode === 'debt' && [
          ['Low', 1],
          ['Moderate', 3.5],
          ['High', Math.max(5.5, maxHours - 0.5)],
        ].map(([label, value]) => {
          const activeLabel = selected.category?.label === 'None' ? 'Low' : selected.category?.label;
          const isActive = label === activeLabel;
          return (
            <text key={label} x={width - 10} y={yFor(value)} textAnchor="end" fill={isActive ? (selected.category?.color || '#67e8f9') : 'rgba(226,232,240,0.58)'} fontSize={isActive ? '20' : '18'} fontWeight={isActive ? '800' : '500'}>
              {label}
            </text>
          );
        })}

        {mode === 'debt' ? (
          <>
            <polyline
              points={observed.map(point => `${xFor(point.index)},${yFor(point.value)}`).join(' ')}
              fill="none"
              stroke="#f8fafc"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {observed.map((point) => {
              const isSelected = point.day.date === selected.date;
              return (
                <g
                  key={point.day.date}
                  role="button"
                  tabIndex="0"
                  aria-label={`Select ${point.day.date}, ${formatSleepDebt(point.day.debtSeconds)}`}
                  onClick={() => { onSelect(point.day.date); labelState.showClicked(point.day.date); }}
                  onMouseEnter={() => labelState.showHovered(point.day.date)}
                  onMouseLeave={() => labelState.hideHovered(point.day.date)}
                  onFocus={() => labelState.showHovered(point.day.date)}
                  onBlur={() => labelState.hideHovered(point.day.date)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onSelect(point.day.date);
                      labelState.showClicked(point.day.date);
                    }
                  }}
                  className="cursor-pointer outline-none"
                >
                  <circle cx={xFor(point.index)} cy={yFor(point.value)} r="17" fill="transparent" />
                  <circle
                    cx={xFor(point.index)}
                    cy={yFor(point.value)}
                    r={isSelected ? 10 : 5}
                    fill="#f8fafc"
                    stroke={isSelected ? '#67e8f9' : '#f8fafc'}
                    strokeWidth={isSelected ? 5 : 2}
                  />
                </g>
              );
            })}
          </>
        ) : (
          observed.map(point => {
            const barWidth = Math.min(34, plotWidth / history.length * 0.45);
            const x = xFor(point.index) - barWidth / 2;
            const y = yFor(point.value);
            const isSelected = point.day.date === selected.date;
            return (
              <g
                key={point.day.date}
                role="button"
                tabIndex="0"
                aria-label={`Select ${point.day.date}, ${formatSleepDuration(point.day.totalSleepSeconds)}`}
                onClick={() => { onSelect(point.day.date); labelState.showClicked(point.day.date); }}
                onMouseEnter={() => labelState.showHovered(point.day.date)}
                onMouseLeave={() => labelState.hideHovered(point.day.date)}
                onFocus={() => labelState.showHovered(point.day.date)}
                onBlur={() => labelState.hideHovered(point.day.date)}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelect(point.day.date);
                    labelState.showClicked(point.day.date);
                  }
                }}
                className="cursor-pointer outline-none"
              >
                <rect x={x - 8} y={padding.top} width={barWidth + 16} height={height - padding.bottom - padding.top} fill="transparent" />
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={height - padding.bottom - y}
                  rx="8"
                  fill={point.day.sleepNeedMet ? '#22d3ee' : '#f59e0b'}
                  opacity={isSelected ? 1 : 0.75}
                  stroke={isSelected ? '#67e8f9' : 'transparent'}
                  strokeWidth={isSelected ? 4 : 0}
                />
              </g>
            );
          })
        )}

        {history.map((day, index) => {
          const date = calendarDates.getDatePresentation(day.date);
          return (
            <text key={day.date} x={xFor(index)} y={height - 28} textAnchor="middle" fill={day.date === selected.date ? '#f8fafc' : 'rgba(148,163,184,0.75)'} fontSize="16" fontWeight={day.date === selected.date ? '700' : '500'}>
              {date.weekdayShort}
            </text>
          );
        })}
        {observed.map(point => point.day.date === labelState.activeKey ? (
          <SvgChartPointLabel key={`label-${point.day.date}`} x={xFor(point.index)} y={yFor(point.value)} label={formatChartPointLabel(point.day.date)} chartWidth={width} chartHeight={height} fading={labelState.fading} />
        ) : null)}
      </svg>
      {mode === 'total' && (
        <div className="flex flex-wrap justify-center gap-5 text-xs text-slate-400">
          <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-cyan-400" /> Sleep need met</span>
          <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-amber-500" /> Sleep need not met</span>
        </div>
      )}
    </div>
  );
}

function InfoMetricCard({ title, value, badge, onOpen }) {
  return (
    <button type="button" onClick={onOpen} className="w-full rounded-2xl border border-white/10 bg-slate-900/65 p-5 text-left transition-colors hover:border-cyan-300/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{title}</p>
          <p className="mt-3 font-outfit text-3xl font-light tabular-nums text-slate-100">{value}</p>
        </div>
        <div className="flex items-center gap-2">
          {badge && <span className="rounded-full bg-slate-700 px-3 py-1 text-xs font-semibold text-slate-200">{badge}</span>}
          <Info className="h-5 w-5 text-slate-400" />
        </div>
      </div>
    </button>
  );
}

export default function SleepDebtDetailModal({ appData, selectedDate, onClose }) {
  const [mode, setMode] = useState('debt');
  const [anchorDate, setAnchorDate] = useState(selectedDate);
  const [selectedPointDate, setSelectedPointDate] = useState(selectedDate);
  const [infoTopic, setInfoTopic] = useState(null);
  const [showTotalSleepTrend, setShowTotalSleepTrend] = useState(false);
  const history = useMemo(() => getSleepDebtHistory(appData.sleepmodel || {}, anchorDate), [anchorDate, appData.sleepmodel]);
  const availableDates = useMemo(() => getAvailableRecordDates(
    appData.sleepmodel,
    record => Number(record?.total_sleep_duration) > 0
      || Number(record?.deep_sleep_duration || 0) + Number(record?.rem_sleep_duration || 0) + Number(record?.light_sleep_duration || 0) > 0,
  ), [appData.sleepmodel]);
  const selected = history.find(day => day.date === selectedPointDate) || history[history.length - 1];
  const firstAvailable = availableDates[0];
  const lastAvailable = availableDates[availableDates.length - 1];
  const canPrevious = Boolean(firstAvailable && firstAvailable < history[0].date);
  const canNext = Boolean(lastAvailable && lastAvailable > anchorDate);

  useEffect(() => {
    const closeOnEscape = event => {
      if (
        event.key === 'Escape'
        && !document.querySelector('[data-calendar-dialog="true"]')
        && !document.querySelector('[data-sleep-info-dialog="true"]')
        && !document.querySelector('[data-metric-drilldown="true"]')
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
        data-sleep-debt-dialog="true"
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Sleep debt details"
          className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-white/10 bg-slate-950 shadow-2xl"
          initial={{ opacity: 0, scale: 0.98, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 12 }}
          onMouseDown={event => event.stopPropagation()}
        >
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-slate-950/95 px-4 py-4 backdrop-blur-xl sm:px-6">
            <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-300 hover:bg-white/10 hover:text-white" aria-label="Back to Sleep details">
              <ChevronLeft className="h-6 w-6" />
            </button>
            <h2 className="font-outfit text-xl font-semibold text-slate-100">Sleep Debt</h2>
            <div className="flex items-center gap-1">
              <CalendarPicker availableDates={availableDates} selectedDate={anchorDate} onSelect={date => { setAnchorDate(date); setSelectedPointDate(date); }} calendarScope="nested" buttonClassName="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-slate-100" buttonLabel="Choose Sleep Debt date" />
              <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Close sleep debt details">
                <X className="h-5 w-5" />
              </button>
            </div>
          </header>

          <div className="space-y-7 p-4 sm:p-7">
            <div className="grid grid-cols-2 rounded-2xl bg-slate-900/80 p-1">
              {[['debt', 'Sleep Debt'], ['total', 'Total Sleep']].map(([key, label]) => (
                <button key={key} type="button" onClick={() => setMode(key)} className={`rounded-xl px-3 py-3 font-outfit text-base font-semibold transition-colors ${mode === key ? 'bg-slate-100 text-slate-950' : 'text-slate-300 hover:bg-white/5'}`} aria-pressed={mode === key}>
                  {label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button type="button" disabled={!canPrevious} onClick={() => setAnchorDate(date => calendarDates.addDays(date, -7))} className="h-12 w-11 flex-shrink-0 rounded-xl border border-white/10 bg-slate-900 text-slate-300 disabled:opacity-25" aria-label="Previous seven sleep days">
                <ChevronLeft className="mx-auto h-5 w-5" />
              </button>
              <div className="min-w-0 flex-1"><DebtChart history={history} mode={mode} selectedKey={selected.date} onSelect={setSelectedPointDate} /></div>
              <button type="button" disabled={!canNext} onClick={() => setAnchorDate(date => calendarDates.addDays(date, 7))} className="h-12 w-11 flex-shrink-0 rounded-xl border border-white/10 bg-slate-900 text-slate-300 disabled:opacity-25" aria-label="Next seven sleep days">
                <ChevronRight className="mx-auto h-5 w-5" />
              </button>
            </div>

            <TrendPeriodFooter
              kind="dayToDay"
              startDate={history[0]?.date}
              endDate={history.at(-1)?.date}
              summary={mode === 'debt'
                ? (selected.debtSeconds === null ? null : formatSleepDebt(selected.debtSeconds))
                : (selected.totalSleepSeconds === null ? null : formatSleepDuration(selected.totalSleepSeconds))}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <InfoMetricCard title="Sleep Debt" value={selected.debtSeconds === null ? '--' : formatSleepDebt(selected.debtSeconds)} badge={selected.category?.label} onOpen={() => setInfoTopic('debt')} />
              </div>
              <InfoMetricCard title="Sleep Need" value={selected.sleepNeedSeconds === null ? '--' : formatSleepDuration(selected.sleepNeedSeconds)} onOpen={() => setInfoTopic('need')} />
              <button type="button" onClick={() => setShowTotalSleepTrend(true)} className="w-full rounded-2xl border border-white/10 bg-slate-900/65 p-5 text-left transition-colors hover:border-cyan-300/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Total Sleep</p>
                    <p className="mt-3 font-outfit text-3xl font-light tabular-nums text-slate-100">{selected.totalSleepSeconds === null ? '--' : formatSleepDuration(selected.totalSleepSeconds)}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                </div>
              </button>
            </div>

            {selected.category && (
              <section className="rounded-2xl border border-white/10 bg-slate-900/45 p-5 sm:p-6">
                <h3 className="font-outfit text-2xl font-medium text-slate-100">{selected.category.label}</h3>
                <p className="mt-3 leading-relaxed text-slate-300">{selected.category.description}</p>
              </section>
            )}
          </div>
        </motion.div>
      </motion.div>

      <AnimatePresence>{infoTopic && <SleepInfoModal topic={infoTopic} onClose={() => setInfoTopic(null)} />}</AnimatePresence>
      <AnimatePresence>{showTotalSleepTrend && <MetricDrilldownModal appData={appData} metricKey="totalSleep" initialDate={anchorDate} onClose={() => setShowTotalSleepTrend(false)} />}</AnimatePresence>
    </>
  );
}
