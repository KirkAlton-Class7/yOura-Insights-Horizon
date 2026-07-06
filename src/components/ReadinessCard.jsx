import Card from './Card';
import SubScoreBar from './SubScoreBar';
import { getScoreColor } from '../utils/colors';
import { buildReadinessCardSnapshot } from '../utils/cardSnapshots';
import { useToast } from '../context/toast';
import { getLongSleepRecord } from '../utils/readinessDetails';
import UnavailableState from './UnavailableState';

const displayNumber = (value, decimals = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(decimals) : '--';
};

function KeyMetric({ label, value, unit, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="relative z-20 rounded-xl bg-white/5 p-4 text-left transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
      aria-label={`Open ${label} trends`}
    >
      <p className="text-xs uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-2 font-outfit text-xl font-semibold tabular-nums text-slate-100">
        {value}
        {value !== '--' && unit ? <span className="ml-1 text-sm text-slate-400">{unit}</span> : null}
      </p>
    </button>
  );
}

export default function ReadinessCard({ data, sleepmodelData, onOpenDetails }) {
  const { showToast } = useToast();
  if (!data) {
    return (
      <Card title="Readiness" subtitle="Daily readiness and contributors">
        <UnavailableState title="Readiness unavailable" />
      </Card>
    );
  }
  const { score, contributors, temperature_deviation } = data;
  const sleepModel = getLongSleepRecord(sleepmodelData);
  const keys = ['hrv_balance', 'resting_heart_rate', 'recovery_index', 'body_temperature', 'previous_night', 'previous_day_activity', 'sleep_balance', 'activity_balance', 'sleep_regularity'];
  const contributorTargets = {
    hrv_balance: 'metric:readinessHrvBalanceContributor',
    resting_heart_rate: 'metric:readinessRestingHeartRateContributor',
    recovery_index: 'metric:readinessRecoveryIndexContributor',
    body_temperature: 'metric:readinessBodyTemperatureContributor',
    previous_night: 'metric:readinessPreviousNightContributor',
    previous_day_activity: 'metric:readinessPreviousDayActivityContributor',
    sleep_balance: 'metric:readinessSleepBalanceContributor',
    activity_balance: 'metric:readinessActivityBalanceContributor',
    sleep_regularity: 'metric:readinessSleepRegularityContributor',
  };
  const openTarget = (event, target = 'top') => {
    event.stopPropagation();
    onOpenDetails?.(target);
  };

  return (
    <Card
      title="Readiness"
      subtitle="Daily readiness and contributors"
      snapshotText={buildReadinessCardSnapshot(data, { sleepModel })}
      snapshotLabel="Readiness snapshot"
      onCopyFailure={() => showToast('Failed to copy Readiness snapshot.')}
      onCopySuccess={() => showToast('Readiness snapshot copied to clipboard.')}
      onOpen={() => onOpenDetails?.('top')}
      openLabel="Open Readiness details"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">Score</span>
          <span className="text-2xl font-outfit font-bold tabular-nums" style={{ color: getScoreColor(score) }}>{score ?? '--'}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {keys.map((key) => (
            <SubScoreBar
              key={key}
              label={key.replace(/_/g, ' ')}
              value={contributors?.[key]}
              onOpen={event => openTarget(event, contributorTargets[key])}
            />
          ))}
        </div>
        <div className="border-t border-white/10 pt-4">
          <p className="mb-3 text-xs uppercase tracking-wider text-slate-500">Key Metrics</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <KeyMetric label="Resting HR" value={displayNumber(sleepModel?.lowest_heart_rate)} unit="bpm" onOpen={event => openTarget(event, 'metric:restingHeartRate')} />
            <KeyMetric label="Avg HRV" value={displayNumber(sleepModel?.average_hrv)} unit="ms" onOpen={event => openTarget(event, 'metric:averageHrv')} />
            <KeyMetric
              label="Body Temp"
              value={displayNumber(temperature_deviation, 2)}
              unit="°C"
              onOpen={event => openTarget(event, 'metric:bodyTemperature')}
            />
            <KeyMetric label="Respiratory Rate" value={displayNumber(sleepModel?.average_breath, 1)} unit="/ min" onOpen={event => openTarget(event, 'metric:respiratoryRate')} />
          </div>
        </div>
      </div>
    </Card>
  );
}
