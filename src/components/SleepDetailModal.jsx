import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, Info, X } from 'lucide-react';
import CalendarPicker from './CalendarPicker';
import MetricDrilldownModal from './MetricDrilldownModal';
import SleepDebtDetailModal from './SleepDebtDetailModal';
import SleepInfoModal from './SleepInfoModal';
import SleepRegularityDetailModal from './SleepRegularityDetailModal';
import SleepStageBars from './SleepStageBars';
import SleepStageTimeline from './SleepStageTimeline';
import SleepStagesTrendModal from './SleepStagesTrendModal';
import SubScoreBar from './SubScoreBar';
import UnavailableState from './UnavailableState';
import { getScoreColor, SEMANTIC_COLORS } from '../utils/colors';
import { calendarDates } from '../utils/dateService';
import { getAvailableDatesAcrossDatasets } from '../utils/dataAvailability';
import { getLongSleepRecord } from '../utils/readinessDetails';
import {
  SLEEP_DEBT_CATEGORIES,
  calculateSleepDebt,
  formatSleepDebt,
  getSleepDebtMarkerPlacement,
} from '../utils/sleepDebt';
import {
  formatSleepDuration,
  getAverageOxygenSaturation,
  getNighttimeBreathingMarkerPosition,
  getNighttimeBreathingStatus,
  getSleepStageSummary,
} from '../utils/sleepDetails';
import { calculateSleepRegularity } from '../utils/sleepRegularity';

const CONTRIBUTOR_DEFINITIONS = Object.freeze([
  ['deep_sleep', 'Deep Sleep', 'deepSleepContributor'],
  ['rem_sleep', 'REM Sleep', 'remSleepContributor'],
  ['total_sleep', 'Total Sleep', 'totalSleepContributor'],
  ['efficiency', 'Efficiency', 'efficiencyContributor'],
  ['restfulness', 'Restfulness', 'restfulnessContributor'],
  ['latency', 'Latency', 'latencyContributor'],
  ['timing', 'Timing', 'timingContributor'],
]);

const displayNumber = (value, decimals = 0) => {
  if (value === '' || value === null || value === undefined) return '--';
  const number = Number(value);
  return Number.isFinite(number)
    ? number.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : '--';
};

function StaticMetric({ label, value, unit, onOpen }) {
  return (
    <button type="button" onClick={onOpen} className="rounded-2xl border border-white/10 bg-slate-900/65 p-5 text-left transition-colors hover:border-cyan-300/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300" aria-label={`Open ${label} trends`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
          <p className="mt-3 font-outfit text-2xl font-medium tabular-nums text-slate-100">
            {value}
            {value !== '--' && unit ? <span className="ml-1 text-base text-slate-400">{unit}</span> : null}
          </p>
        </div>
        <ChevronRight className="h-5 w-5 text-slate-500" />
      </div>
    </button>
  );
}

function SleepHabitMetric({ label, value, placeholder }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/65 p-5 sm:col-span-2">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      {value ? (
        <p className="mt-3 font-outfit text-2xl font-medium tabular-nums text-slate-100">{value}</p>
      ) : (
        <p className="mt-3 text-sm leading-relaxed text-slate-400">{placeholder}</p>
      )}
    </section>
  );
}

function SleepDebtMetric({ sleepDebt, onOpen }) {
  if (!sleepDebt) {
    return (
      <div className="sm:col-span-2">
        <UnavailableState
          title="Sleep debt unavailable"
          description="At least five nights of sleep data within the previous 14 days are required."
          compact
        />
      </div>
    );
  }
  const markerPlacement = getSleepDebtMarkerPlacement(sleepDebt.debtSeconds);
  const categories = Object.entries(SLEEP_DEBT_CATEGORIES);
  return (
    <button type="button" onClick={onOpen} className="rounded-2xl border border-white/10 bg-slate-900/65 p-5 text-left transition-colors hover:border-cyan-300/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 sm:col-span-2" aria-label="Open Sleep Debt details">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Sleep Debt</p>
      <div className="mt-3 flex flex-wrap items-baseline gap-3">
        <span className="font-outfit text-4xl font-light tabular-nums text-slate-100">
          {formatSleepDebt(sleepDebt.debtSeconds)}
        </span>
        <span
          className="font-outfit text-base font-semibold uppercase tracking-[0.14em]"
          style={{ color: sleepDebt.category.color }}
        >
          {sleepDebt.category.label}
        </span>
      </div>
      <div className="relative mt-6" aria-label={`${sleepDebt.category.label} sleep debt`}>
        <div className="grid grid-cols-4 gap-2" aria-hidden="true">
          {categories.map(([categoryKey, category]) => (
            <div
              key={category.label}
              className="relative h-1.5 rounded-full"
              style={{ backgroundColor: categoryKey === markerPlacement.categoryKey ? category.color : 'rgba(148,163,184,0.28)' }}
            >
              {categoryKey === markerPlacement.categoryKey && (
                <span
                  className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-slate-100 bg-slate-900"
                  style={{ left: `${markerPlacement.position}%` }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex justify-between text-xs text-slate-400">
        <span>None</span>
        <span>High</span>
      </div>
    </button>
  );
}

function SleepRegularityMetric({ regularity, onOpen }) {
  if (!regularity) {
    return (
      <div className="sm:col-span-2">
        <UnavailableState title="Sleep regularity unavailable" description="At least five nights of bedtime and wake-time data within the previous 14 days are required." compact />
      </div>
    );
  }
  return (
    <button type="button" onClick={onOpen} className="rounded-2xl border border-white/10 bg-slate-900/65 p-5 text-left transition-colors hover:border-cyan-300/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 sm:col-span-2" aria-label="Open Sleep Regularity details">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Sleep Regularity</p>
          <p className="mt-3 font-outfit text-3xl font-light" style={{ color: regularity.color }}>{regularity.status}</p>
        </div>
        <ChevronRight className="h-5 w-5 text-slate-500" />
      </div>
    </button>
  );
}

function SleepStagesChart({ sleepModel, summary, onOpen }) {
  if (!summary) {
    return <UnavailableState title="Time asleep unavailable" description="No sleep-stage data was available for this date." />;
  }
  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/55 transition-colors hover:border-cyan-300/35">
      <button type="button" onClick={onOpen} className="absolute inset-0 z-10 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-300" aria-label="Open Time Asleep trends" />
      <div className="p-5 sm:p-6">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">Sleep Stages</h3>
        <div className="mt-3 flex flex-wrap items-end gap-x-3 gap-y-1">
          <span className="font-outfit text-4xl font-light tabular-nums text-slate-100">
            {formatSleepDuration(summary.totalSleep)}
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-400">Total duration {formatSleepDuration(summary.timeInBed)}</p>
      </div>

      {summary.phases.length > 0 ? (
        <div className="border-t border-white/10 px-2 sm:px-5">
          <SleepStageTimeline
            phases={summary.phases}
            startTimestamp={sleepModel?.bedtime_start}
            endTimestamp={sleepModel?.bedtime_end}
          />
        </div>
      ) : (
        <div className="border-t border-white/10 p-5">
          <UnavailableState title="Sleep-stage timeline unavailable" description="This export does not include a sleep-stage sequence." compact />
        </div>
      )}

      <div className="border-t border-white/10 p-5 sm:p-6">
        <SleepStageBars stages={summary.stages} />
      </div>

      <div className="border-t border-white/10 p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Movement</p>
        <p className="mt-2 text-sm text-slate-300">
          {summary.restlessPeriods === null
            ? 'Movement detail was not included in this export.'
            : `${Math.round(summary.restlessPeriods)} restless ${Math.round(summary.restlessPeriods) === 1 ? 'period' : 'periods'} recorded.`}
        </p>
      </div>
    </section>
  );
}

function OxygenCard({ value, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-2xl border border-white/10 bg-slate-900/55 p-5 text-left transition-colors hover:border-cyan-300/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 sm:p-6"
      aria-label="Learn about average oxygen saturation"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">Average Oxygen Saturation</p>
          <p className="mt-3 font-outfit text-4xl font-light tabular-nums text-slate-100">
            {value === null ? '--' : displayNumber(value, 1)}{value !== null && <span className="text-2xl">%</span>}
          </p>
        </div>
        <Info className="h-5 w-5 text-slate-400" />
      </div>
    </button>
  );
}

function NighttimeBreathingCard({ status, onOpen }) {
  if (!status) {
    return <UnavailableState title="Nighttime breathing unavailable" description="No breathing-disturbance index was available for this date." />;
  }
  const marker = Math.min(98, Math.max(2, getNighttimeBreathingMarkerPosition(status.index)));
  const statusColor = {
    few: SEMANTIC_COLORS.optimal,
    occasional: SEMANTIC_COLORS.good,
    frequent: SEMANTIC_COLORS.bad,
  }[status.level];
  return (
    <button type="button" onClick={onOpen} className="w-full rounded-2xl border border-white/10 bg-slate-900/55 p-5 text-left transition-colors hover:border-cyan-300/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 sm:p-6" aria-label="Learn about nighttime breathing">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">Nighttime Breathing</p>
          <h3 className="mt-3 font-outfit text-4xl font-light" style={{ color: statusColor }}>{status.label}</h3>
        </div>
        <Info className="h-5 w-5 text-slate-500" aria-hidden="true" />
      </div>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300">{status.description}</p>
      <div className="mt-7">
        <div
          className="relative h-2 rounded-full"
          style={{ background: `linear-gradient(90deg, ${SEMANTIC_COLORS.optimal} 0%, ${SEMANTIC_COLORS.good} 33.333%, ${SEMANTIC_COLORS.fair} 66.667%, ${SEMANTIC_COLORS.bad} 100%)` }}
        >
          <span
            className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-slate-100 bg-slate-900"
            style={{ left: `${marker}%` }}
          />
        </div>
        <div className="mt-3 flex justify-between text-xs">
          <span style={{ color: SEMANTIC_COLORS.optimal }}>Few</span>
          <span style={{ color: SEMANTIC_COLORS.good }}>Occasional</span>
          <span style={{ color: SEMANTIC_COLORS.bad }}>Frequent</span>
        </div>
        <p className="mt-4 text-xs text-slate-500">Nightly disturbance index: {displayNumber(status.index, 1)}</p>
      </div>
    </button>
  );
}

export default function SleepDetailModal({ appData, selectedDate, initialTarget = 'top', onClose }) {
  const [detailDate, setDetailDate] = useState(selectedDate);
  const [infoTopic, setInfoTopic] = useState(null);
  const [drillMetric, setDrillMetric] = useState(() => (
    initialTarget.startsWith('metric:') ? initialTarget.slice('metric:'.length) : null
  ));
  const [isSleepDebtOpen, setIsSleepDebtOpen] = useState(initialTarget === 'debt');
  const [isSleepRegularityOpen, setIsSleepRegularityOpen] = useState(initialTarget === 'regularity');
  const [isSleepStagesOpen, setIsSleepStagesOpen] = useState(initialTarget === 'stages');
  const availableSleepDates = useMemo(() => getAvailableDatesAcrossDatasets(
    ['sleep', 'sleepmodel', 'spo2', 'sleeptime'].map(key => appData[key]),
  ), [appData]);
  const sleep = appData.sleep?.[detailDate]?.[0] || null;
  const sleepModel = getLongSleepRecord(appData.sleepmodel?.[detailDate]);
  const sleeptime = appData.sleeptime?.[detailDate]?.[0] || null;
  const spo2 = appData.spo2?.[detailDate]?.[0] || null;
  const summary = useMemo(() => getSleepStageSummary(sleepModel), [sleepModel]);
  const sleepDebt = useMemo(
    () => calculateSleepDebt(appData.sleepmodel || {}, detailDate),
    [appData.sleepmodel, detailDate],
  );
  const sleepRegularity = useMemo(
    () => calculateSleepRegularity(appData.sleepmodel || {}, detailDate),
    [appData.sleepmodel, detailDate],
  );
  const optimalBedtime = calendarDates.formatOptimalBedtime(
    sleeptime?.day || detailDate,
    sleeptime?.optimal_bedtime,
  );
  const oxygen = getAverageOxygenSaturation(spo2);
  const breathingStatus = getNighttimeBreathingStatus(spo2);
  const contributors = sleep?.contributors || {};
  const datePresentation = calendarDates.getDatePresentation(detailDate);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = event => {
      if (
        event.key === 'Escape'
        && !document.querySelector('[data-calendar-dialog="true"]')
        && !document.querySelector('[data-sleep-info-dialog="true"]')
        && !document.querySelector('[data-metric-drilldown="true"]')
        && !document.querySelector('[data-sleep-debt-dialog="true"]')
        && !document.querySelector('[data-sleep-regularity-dialog="true"]')
        && !document.querySelector('[data-sleep-stages-dialog="true"]')
      ) onClose();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [onClose]);

  return (
    <>
      <motion.div
        className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/85 p-3 backdrop-blur-md sm:p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onMouseDown={onClose}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Sleep details"
          className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-white/10 bg-slate-950/95 shadow-2xl shadow-black/60"
          initial={{ opacity: 0, scale: 0.98, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 14 }}
          transition={{ duration: 0.18 }}
          onMouseDown={event => event.stopPropagation()}
        >
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-slate-950/95 px-5 py-4 backdrop-blur-xl sm:px-7">
            <div>
              <h2 className="font-outfit text-xl font-semibold text-slate-100">Sleep</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {datePresentation.weekdayLong}, {datePresentation.monthLong} {datePresentation.dayOfMonth}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <CalendarPicker
                availableDates={availableSleepDates}
                selectedDate={detailDate}
                onSelect={setDetailDate}
                calendarScope="nested"
                buttonClassName="rounded-xl p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-100"
                buttonLabel="Choose Sleep date"
              />
              <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Close sleep details">
                <X className="h-5 w-5" />
              </button>
            </div>
          </header>

          <div className="space-y-8 p-5 sm:p-7">
            <section>
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-outfit text-xl font-semibold text-slate-100">Contributors</h2>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Sleep score</p>
                  <p className="font-outfit text-3xl font-semibold tabular-nums" style={{ color: getScoreColor(sleep?.score) }}>
                    {sleep?.score ?? '--'}
                  </p>
                </div>
              </div>
              {sleep ? (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {CONTRIBUTOR_DEFINITIONS.map(([key, label, metricKey]) => (
                    <SubScoreBar key={key} label={label} value={contributors[key]} onOpen={() => setDrillMetric(metricKey)} />
                  ))}
                </div>
              ) : (
                <UnavailableState title="Sleep contributors unavailable" description="No daily sleep score was available for this date." />
              )}
            </section>

            <section>
              <h2 className="font-outfit text-xl font-semibold text-slate-100">Key Metrics</h2>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <StaticMetric label="Total Sleep" value={summary ? formatSleepDuration(summary.totalSleep) : '--'} onOpen={() => setDrillMetric('totalSleep')} />
                <StaticMetric label="Time in Bed" value={summary ? formatSleepDuration(summary.timeInBed) : '--'} onOpen={() => setDrillMetric('timeInBed')} />
                <StaticMetric label="Sleep Efficiency" value={summary ? displayNumber(summary.efficiency) : '--'} unit="%" onOpen={() => setDrillMetric('sleepEfficiency')} />
                <StaticMetric label="Resting Heart Rate" value={summary ? displayNumber(summary.restingHeartRate) : '--'} unit="bpm" onOpen={() => setDrillMetric('restingHeartRate')} />
              </div>
            </section>

            <section>
              <h2 className="font-outfit text-xl font-semibold text-slate-100">Sleep Habits</h2>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <SleepRegularityMetric regularity={sleepRegularity} onOpen={() => setIsSleepRegularityOpen(true)} />
                <SleepDebtMetric sleepDebt={sleepDebt} onOpen={() => setIsSleepDebtOpen(true)} />
                <SleepHabitMetric
                  label="Optimal Bedtime"
                  value={optimalBedtime}
                  placeholder="No optimal bedtime window is available for this date."
                />
                <SleepHabitMetric
                  label="Chronotype"
                  placeholder="Chronotype insights will be available in a future update."
                />
              </div>
            </section>

            <section>
              <h2 className="font-outfit text-xl font-semibold text-slate-100">Details</h2>
              <div className="mt-4 space-y-4">
                <SleepStagesChart sleepModel={sleepModel} summary={summary} onOpen={() => setIsSleepStagesOpen(true)} />
                <OxygenCard value={oxygen} onOpen={() => setInfoTopic('oxygen')} />
                <NighttimeBreathingCard status={breathingStatus} onOpen={() => setInfoTopic('breathing')} />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <StaticMetric label="Breathing Rate" value={sleepModel ? displayNumber(sleepModel.average_breath, 1) : '--'} unit="br/min" onOpen={() => setDrillMetric('respiratoryRate')} />
                  <StaticMetric label="Average Heart Rate" value={summary ? displayNumber(summary.averageHeartRate) : '--'} unit="bpm" onOpen={() => setDrillMetric('averageHeartRate')} />
                  <StaticMetric label="Lowest Heart Rate" value={summary ? displayNumber(summary.lowestHeartRate) : '--'} unit="bpm" onOpen={() => setDrillMetric('lowestHeartRate')} />
                  <StaticMetric label="Average HRV" value={sleepModel ? displayNumber(sleepModel.average_hrv) : '--'} unit="ms" onOpen={() => setDrillMetric('averageHrv')} />
                </div>
              </div>
            </section>
          </div>
        </motion.div>
      </motion.div>

      <AnimatePresence>{infoTopic && <SleepInfoModal topic={infoTopic} onClose={() => setInfoTopic(null)} />}</AnimatePresence>
      <AnimatePresence>{drillMetric && <MetricDrilldownModal appData={appData} metricKey={drillMetric} initialDate={detailDate} onClose={() => setDrillMetric(null)} />}</AnimatePresence>
      <AnimatePresence>{isSleepDebtOpen && <SleepDebtDetailModal appData={appData} selectedDate={detailDate} onClose={() => setIsSleepDebtOpen(false)} />}</AnimatePresence>
      <AnimatePresence>{isSleepRegularityOpen && <SleepRegularityDetailModal appData={appData} selectedDate={detailDate} onClose={() => setIsSleepRegularityOpen(false)} />}</AnimatePresence>
      <AnimatePresence>{isSleepStagesOpen && <SleepStagesTrendModal appData={appData} initialDate={detailDate} onClose={() => setIsSleepStagesOpen(false)} />}</AnimatePresence>
    </>
  );
}
