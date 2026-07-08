import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import CalendarPicker from './CalendarPicker';
import MetricDrilldownModal from './MetricDrilldownModal';
import { formatChartPointLabel, SvgChartPointLabel, useChartPointLabel } from './ChartPointLabel';
import UnavailableState from './UnavailableState';
import useSwipePaging from '../hooks/useSwipePaging';
import { getBiometricsHistory } from '../utils/biometricsDetails';
import { calendarDates } from '../utils/dateService';
import { getAvailableDatesAcrossDatasets, getAvailableRecordDates } from '../utils/dataAvailability';
import { getBloodOxygenColor, SEMANTIC_COLORS } from '../utils/colors';
import { avoidCircleLabelCollision } from '../utils/chartGeometry';

const displayNumber = (value, decimals = 0) => {
  const number = Number(value);
  return Number.isFinite(number)
    ? number.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : '--';
};

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

function averageHeartRate(records = []) {
  const values = records.map(record => Number(record?.bpm)).filter(value => value > 0 && value < 250);
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function averageTemperature(records = []) {
  const values = records.map(record => Number(record?.skin_temp)).filter(value => value > 0);
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function BiometricsHistory({ history, selectedDate, onSelectDate, onPrevious, onNext, canPrevious, canNext }) {
  const labelState = useChartPointLabel();
  const width = 1100;
  const height = 340;
  const baseline = 252;
  const circleTop = 86;
  const circleBottom = 176;
  const slotWidth = width / history.length;
  const oxygenValues = history.map(day => day.bloodOxygen).filter(value => value !== null);
  const disturbanceValues = history.map(day => day.breathingDisturbance).filter(value => value !== null);
  const oxygenMinimum = oxygenValues.length ? Math.min(...oxygenValues) : 90;
  const oxygenMaximum = oxygenValues.length ? Math.max(...oxygenValues) : 100;
  const oxygenRange = Math.max(2, oxygenMaximum - oxygenMinimum);
  const disturbanceMaximum = Math.max(3, ...(disturbanceValues.length ? disturbanceValues : [0]));
  const barHeightFor = value => value === null ? 5 : 36 + ((value - oxygenMinimum) / oxygenRange) * 116;
  const disturbanceYFor = value => circleTop + (Math.min(Math.max(value, 0), disturbanceMaximum) / disturbanceMaximum) * (circleBottom - circleTop);
  const selected = calendarDates.getDatePresentation(selectedDate);
  const swipe = useSwipePaging({ canPrevious, canNext, onPrevious, onNext });

  const linePoints = history
    .map((day, index) => day.breathingDisturbance === null ? null : ({
      x: slotWidth * index + slotWidth / 2,
      y: disturbanceYFor(day.breathingDisturbance),
    }))
    .filter(Boolean);

  const smoothPath = points => {
    if (!points.length) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    return points.reduce((path, point, index) => {
      if (index === 0) return `M ${point.x} ${point.y}`;
      const previous = points[index - 1];
      const midpointX = (previous.x + point.x) / 2;
      return `${path} C ${midpointX} ${previous.y}, ${midpointX} ${point.y}, ${point.x} ${point.y}`;
    }, '');
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950/35 p-4 sm:p-6">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Overview</p>
        <h3 className="mt-1 font-outfit text-2xl font-semibold text-slate-100">{selected.weekdayShort}, {selected.monthShort} {selected.dayOfMonth}</h3>
        <p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-500">Past 14 Days</p>
      </div>
      <div className="mt-4 flex touch-pan-y items-center gap-2" {...swipe}>
        <button type="button" onClick={onPrevious} disabled={!canPrevious} className="h-12 w-10 flex-shrink-0 rounded-xl border border-white/10 bg-slate-800/70 text-slate-300 disabled:opacity-25" aria-label="Previous fourteen biometric days"><ChevronLeft className="mx-auto h-5 w-5" /></button>
        <div className="min-w-0 flex-1 overflow-x-auto pb-2 scrollbar-hide">
          <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[52rem] w-full" role="img" aria-label="Blood oxygen bars and breathing disturbances for fourteen days">
            <line x1="0" y1={baseline} x2={width} y2={baseline} stroke="rgba(148,163,184,0.22)" />
            {history.map((day, index) => {
              const x = slotWidth * index + slotWidth * 0.18;
              const barWidth = slotWidth * 0.64;
              const barHeight = barHeightFor(day.bloodOxygen);
              const centerX = slotWidth * index + slotWidth / 2;
              const circleY = day.breathingDisturbance === null ? null : disturbanceYFor(day.breathingDisturbance);
              const oxygenLabelY = avoidCircleLabelCollision(
                baseline - barHeight - 10,
                circleY,
                { minimum: 28, maximum: baseline - 14 },
              );
              const date = calendarDates.getDatePresentation(day.date);
              const active = day.date === selectedDate;
              const available = day.bloodOxygen !== null || day.breathingDisturbance !== null;
              const fill = day.bloodOxygen === null ? 'rgba(148,163,184,0.12)' : getBloodOxygenColor(day.bloodOxygen);
              return (
                <g
                  key={day.date}
                  role={available ? 'button' : undefined}
                  tabIndex={available ? 0 : undefined}
                  className={available ? 'cursor-pointer outline-none' : undefined}
                  onClick={available ? () => { onSelectDate(day.date); labelState.showClicked(day.date); } : undefined}
                  onMouseEnter={available ? () => labelState.showHovered(day.date) : undefined}
                  onMouseLeave={available ? () => labelState.hideHovered(day.date) : undefined}
                  onFocus={available ? () => labelState.showHovered(day.date) : undefined}
                  onBlur={available ? () => labelState.hideHovered(day.date) : undefined}
                  onKeyDown={available ? event => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onSelectDate(day.date);
                      labelState.showClicked(day.date);
                    }
                  } : undefined}
                >
                  <rect x={slotWidth * index} y="0" width={slotWidth} height={height} fill="transparent" />
                  <rect
                    x={x}
                    y={baseline - barHeight}
                    width={barWidth}
                    height={barHeight}
                    rx="9"
                    fill={fill}
                    opacity={active ? 1 : day.bloodOxygen === null ? 0.08 : 0.42}
                    stroke={active ? '#67e8f9' : 'transparent'}
                    strokeWidth="3"
                  />
                  {day.bloodOxygen !== null && (
                    <text x={centerX} y={oxygenLabelY} textAnchor="middle" fill="rgba(226,232,240,0.9)" fontSize="17" fontWeight="700">
                      {day.bloodOxygen.toFixed(1)}
                    </text>
                  )}
                  <text x={centerX} y="286" textAnchor="middle" fill={active ? '#67e8f9' : 'rgba(148,163,184,0.72)'} fontSize="17" fontWeight={active ? '700' : '500'}>{date.weekdayShort}</text>
                  <text x={centerX} y="312" textAnchor="middle" fill={active ? '#67e8f9' : 'rgba(148,163,184,0.72)'} fontSize="15" fontWeight={active ? '700' : '500'}>{date.month}/{date.dayOfMonth}</text>
                </g>
              );
            })}
            {linePoints.length > 1 && <path d={smoothPath(linePoints)} fill="none" stroke="rgba(226,232,240,0.58)" strokeWidth="4" strokeDasharray="9 8" strokeLinejoin="round" strokeLinecap="round" pointerEvents="none" />}
            {history.map((day, index) => day.breathingDisturbance === null ? null : (
              <g key={`${day.date}-disturbance`} pointerEvents="none">
                <circle cx={slotWidth * index + slotWidth / 2} cy={disturbanceYFor(day.breathingDisturbance)} r="16" fill="#e2e8f0" stroke={day.date === selectedDate ? '#67e8f9' : '#cbd5e1'} strokeWidth="4" />
                <text x={slotWidth * index + slotWidth / 2} y={disturbanceYFor(day.breathingDisturbance) + 5} textAnchor="middle" fill="#0f172a" fontSize="14" fontWeight="800">{Math.round(day.breathingDisturbance)}</text>
              </g>
            ))}
            {history.map((day, index) => day.date === labelState.activeKey ? (
              <SvgChartPointLabel
                key={`label-${day.date}`}
                x={slotWidth * index + slotWidth / 2}
                y={day.breathingDisturbance === null ? baseline - barHeightFor(day.bloodOxygen) : disturbanceYFor(day.breathingDisturbance)}
                label={formatChartPointLabel(day.date)}
                chartWidth={width}
                chartHeight={height}
                fading={labelState.fading}
              />
            ) : null)}
          </svg>
        </div>
        <button type="button" onClick={onNext} disabled={!canNext} className="h-12 w-10 flex-shrink-0 rounded-xl border border-white/10 bg-slate-800/70 text-slate-300 disabled:opacity-25" aria-label="Next fourteen biometric days"><ChevronRight className="mx-auto h-5 w-5" /></button>
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-6 text-sm text-slate-400">
        <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm" style={{ backgroundColor: SEMANTIC_COLORS.optimal }} />Blood Oxygen</span>
        <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-slate-200 ring-2 ring-slate-400" />Breathing Disturbances</span>
      </div>
    </section>
  );
}

export default function BiometricsDetailModal({ appData, selectedDate, onClose }) {
  const [detailDate, setDetailDate] = useState(selectedDate);
  const [anchorDate, setAnchorDate] = useState(selectedDate);
  const [drillMetric, setDrillMetric] = useState(null);
  const availableDates = useMemo(
    () => getAvailableDatesAcrossDatasets([appData.spo2, appData.heartrate, appData.temperature]),
    [appData],
  );
  const availableSpo2Dates = useMemo(
    () => getAvailableRecordDates(appData.spo2, record => record?.spo2_percentage?.average || record?.breathing_disturbance_index),
    [appData.spo2],
  );
  const history = useMemo(() => getBiometricsHistory(appData.spo2, anchorDate), [anchorDate, appData.spo2]);
  const earliest = availableSpo2Dates[0];
  const latest = availableSpo2Dates.at(-1);
  const canPrevious = Boolean(earliest && earliest < history[0]?.date);
  const canNext = Boolean(latest && latest > history.at(-1)?.date);
  const heartRate = averageHeartRate(appData.heartrate?.[detailDate]);
  const skinTemperature = averageTemperature(appData.temperature?.[detailDate]);

  const shift = direction => {
    const next = calendarDates.addDays(anchorDate, direction * 14);
    setAnchorDate(next);
    setDetailDate(next);
  };

  const selectDate = date => {
    setDetailDate(date);
    setAnchorDate(date);
  };

  const closeStack = () => {
    setDrillMetric(null);
    onClose();
  };

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const close = event => {
      if (event.key === 'Escape' && !document.querySelector('[data-calendar-dialog="true"]') && !document.querySelector('[data-metric-drilldown="true"]')) onClose();
    };
    document.addEventListener('keydown', close);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', close); };
  }, [onClose]);

  return (
    <>
      <motion.div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/85 p-3 backdrop-blur-md sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose} data-biometrics-detail-dialog="true">
        <motion.div role="dialog" aria-modal="true" aria-label="Biometrics details" className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-white/10 bg-slate-950/95 shadow-2xl shadow-black/60" initial={{ opacity: 0, scale: 0.98, y: 14 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 14 }} onMouseDown={event => event.stopPropagation()}>
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-slate-950 px-5 py-4 sm:px-7">
            <div><h2 className="font-outfit text-xl font-semibold text-slate-100">Biometrics</h2><p className="mt-0.5 text-xs text-slate-500">Blood oxygen, breathing disturbances, heart rate, and skin temperature</p></div>
            <div className="flex items-center gap-1">
              <CalendarPicker availableDates={availableDates} selectedDate={detailDate} onSelect={selectDate} calendarScope="nested" buttonClassName="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-slate-100" buttonLabel="Choose Biometrics date" />
              <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Close Biometrics details"><X className="h-5 w-5" /></button>
            </div>
          </header>
          <div className="space-y-7 p-5 sm:p-7">
            {history.some(day => day.bloodOxygen !== null || day.breathingDisturbance !== null)
              ? <BiometricsHistory history={history} selectedDate={detailDate} onSelectDate={selectDate} onPrevious={() => shift(-1)} onNext={() => shift(1)} canPrevious={canPrevious} canNext={canNext} />
              : <UnavailableState title="Biometrics overview unavailable" description="No blood oxygen or breathing-disturbance data was available in this period." />}
            <section>
              <h2 className="font-outfit text-xl font-semibold text-slate-100">Key Metrics</h2>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <KeyMetric label="Heart Rate" value={displayNumber(heartRate)} unit="bpm" onOpen={() => setDrillMetric('biometricsHeartRate')} />
                <KeyMetric label="Skin Temperature" value={displayNumber(skinTemperature, 1)} unit="°C" onOpen={() => setDrillMetric('biometricsSkinTemperature')} />
              </div>
            </section>
          </div>
        </motion.div>
      </motion.div>
      <AnimatePresence>{drillMetric && <MetricDrilldownModal appData={appData} metricKey={drillMetric} initialDate={detailDate} onClose={closeStack} onBack={() => setDrillMetric(null)} />}</AnimatePresence>
    </>
  );
}
