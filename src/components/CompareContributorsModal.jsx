import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import ScoreRing from './ScoreRing';
import SubScoreBar from './SubScoreBar';
import UnavailableState from './UnavailableState';
import { calendarDates } from '../utils/dateService';

const CONTRIBUTOR_DEFINITIONS = Object.freeze({
  readiness: Object.freeze([
    ['activity_balance', 'Activity Balance'],
    ['body_temperature', 'Body Temperature'],
    ['hrv_balance', 'HRV Balance'],
    ['previous_day_activity', 'Previous Day Activity'],
    ['previous_night', 'Previous Night'],
    ['recovery_index', 'Recovery Index'],
    ['resting_heart_rate', 'Resting Heart Rate'],
    ['sleep_balance', 'Sleep Balance'],
  ]),
  sleep: Object.freeze([
    ['deep_sleep', 'Deep Sleep'],
    ['rem_sleep', 'REM Sleep'],
    ['total_sleep', 'Total Sleep'],
    ['efficiency', 'Efficiency'],
    ['restfulness', 'Restfulness'],
    ['latency', 'Latency'],
    ['timing', 'Timing'],
  ]),
  activity: Object.freeze([
    ['meet_daily_targets', 'Meet Daily Targets'],
    ['move_every_hour', 'Move Every Hour'],
    ['recovery_time', 'Recovery Time'],
    ['stay_active', 'Stay Active'],
    ['training_frequency', 'Training Frequency'],
    ['training_volume', 'Training Volume'],
  ]),
});

const TITLES = Object.freeze({
  readiness: 'Readiness',
  sleep: 'Sleep',
  activity: 'Activity',
});

export default function CompareContributorsModal({ appData, category, selectedDate, onClose, constrained = false }) {
  const record = appData[category]?.[selectedDate]?.[0] || null;
  const contributors = record?.contributors || {};
  const title = TITLES[category] || 'Score';
  const definitions = CONTRIBUTOR_DEFINITIONS[category] || [];
  const presentation = calendarDates.getDatePresentation(selectedDate);

  const dialogClass = constrained
    ? 'max-h-[calc(100%-1.5rem)] w-[calc(100%-1.5rem)] max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/95 shadow-2xl shadow-black/60'
    : 'w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-slate-950/95 shadow-2xl shadow-black/60';
  const headerClass = constrained
    ? 'sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-slate-950/95 px-4 py-3 backdrop-blur-xl'
    : 'flex items-center justify-between border-b border-white/10 bg-slate-950/95 px-5 py-4 backdrop-blur-xl sm:px-7';
  const bodyClass = constrained ? 'space-y-4 p-4' : 'space-y-6 p-5 sm:p-7';
  const scoreSectionClass = constrained
    ? 'rounded-2xl border border-white/10 bg-slate-900/55 p-4'
    : 'rounded-2xl border border-white/10 bg-slate-900/55 p-5';
  const contributorSectionClass = constrained
    ? 'rounded-2xl border border-white/10 bg-slate-900/55 p-4'
    : 'rounded-2xl border border-white/10 bg-slate-900/55 p-4 sm:p-5';
  const ringSize = constrained ? 96 : 124;

  useEffect(() => {
    const closeOnEscape = event => {
      if (event.key === 'Escape') {
        event.stopImmediatePropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  return (
    <motion.div
      className={`${constrained ? 'absolute p-3' : 'fixed p-3 sm:p-6'} inset-0 z-[120] flex items-center justify-center bg-slate-950/75 backdrop-blur-md`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={onClose}
      data-compare-contributors-dialog="true"
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={`${title} contributors`}
        className={dialogClass}
        initial={{ opacity: 0, scale: 0.98, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 12 }}
        transition={{ duration: 0.18 }}
        onMouseDown={event => event.stopPropagation()}
      >
        <header className={headerClass}>
          <div>
            <h2 className={`font-outfit font-semibold text-slate-100 ${constrained ? 'text-lg' : 'text-xl'}`}>{title} Contributors</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {presentation.weekdayLong}, {presentation.monthLong} {presentation.dayOfMonth}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Close contributors">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className={bodyClass}>
          <section className={scoreSectionClass}>
            <div className={`flex items-center justify-between ${constrained ? 'gap-3' : 'flex-col gap-5 sm:flex-row'}`}>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{title} score</p>
                <p className={`${constrained ? 'mt-1 text-xs' : 'mt-2 text-sm'} text-slate-500`}>Detailed contributors for this comparison date</p>
              </div>
              <ScoreRing score={record?.score ?? null} size={ringSize} />
            </div>
          </section>

          {record ? (
            <section className={contributorSectionClass}>
              <div className={`grid grid-cols-1 ${constrained ? 'gap-2' : 'gap-3 sm:grid-cols-2'}`}>
                {definitions.map(([key, label]) => (
                  <SubScoreBar key={key} label={label} value={contributors[key]} />
                ))}
              </div>
            </section>
          ) : (
            <UnavailableState title={`${title} contributors unavailable`} description="No score record was available for this comparison date." />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
