import Card from './Card';
import SubScoreBar from './SubScoreBar';
import { useToast } from '../context/toast';
import { getScoreColor } from '../utils/colors';
import { buildActivityCardSnapshot } from '../utils/cardSnapshots';
import UnavailableState from './UnavailableState';
import { formatActivityDuration, getActivityTimeSeconds, getGoalProgress } from '../utils/activityDetails';

const CONTRIBUTOR_TARGETS = Object.freeze({
  meet_daily_targets: 'metric:meetDailyTargetsContributor',
  move_every_hour: 'metric:moveEveryHourContributor',
  recovery_time: 'metric:recoveryTimeContributor',
  stay_active: 'metric:stayActiveContributor',
  training_frequency: 'metric:trainingFrequencyContributor',
  training_volume: 'metric:trainingVolumeContributor',
});

const CONTRIBUTOR_KEYS = Object.freeze(Object.keys(CONTRIBUTOR_TARGETS));

const displayNumber = value => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number).toLocaleString() : '--';
};

function MetricWidget({ label, value, unit, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="relative z-20 rounded-xl border border-white/10 bg-slate-900/55 p-3 text-left transition-colors hover:border-cyan-300/35 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
      aria-label={`Open ${label} trends`}
    >
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 font-outfit text-lg font-semibold tabular-nums text-slate-100">
        {value}{value !== '--' && unit ? <span className="ml-1 text-xs text-slate-400">{unit}</span> : null}
      </div>
    </button>
  );
}

export default function ActivityCard({ data, onOpenDetails }) {
  const { showToast } = useToast();
  if (!data) {
    return (
      <Card title="Activity" subtitle="Activity score and breakdown">
        <UnavailableState title="Activity unavailable" />
      </Card>
    );
  }
  const { score, contributors = {} } = data;
  const goalProgress = getGoalProgress(data);
  const activityTime = getActivityTimeSeconds(data);
  const openTarget = (event, target = 'top') => {
    event.stopPropagation();
    onOpenDetails?.(target);
  };

  return (
    <Card
      title="Activity"
      subtitle="Activity score and breakdown"
      snapshotText={buildActivityCardSnapshot(data)}
      snapshotLabel="Activity snapshot"
      onCopyFailure={() => showToast('Failed to copy Activity snapshot.')}
      onCopySuccess={() => showToast('Activity snapshot copied to clipboard.')}
      onOpen={() => onOpenDetails?.('top')}
      openLabel="Open Activity details"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">Score</span>
          <span className="text-2xl font-outfit font-bold tabular-nums" style={{ color: getScoreColor(score) }}>{score ?? '--'}</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CONTRIBUTOR_KEYS.map(key => (
            <SubScoreBar
              key={key}
              label={key.replace(/_/g, ' ')}
              value={contributors[key]}
              onOpen={event => openTarget(event, CONTRIBUTOR_TARGETS[key])}
            />
          ))}
        </div>
        <div className="border-t border-white/10 pt-4">
          <div className="mb-3 text-xs uppercase tracking-wider text-slate-500">Key Metrics</div>
          <div className="grid grid-cols-2 gap-3">
            <MetricWidget label="Goal Progress" value={goalProgress === null ? '--' : goalProgress} unit="%" onOpen={event => openTarget(event, 'metric:activityGoalProgress')} />
            <MetricWidget label="Total Burn" value={displayNumber(data.total_calories)} unit="kcal" onOpen={event => openTarget(event, 'metric:activityTotalBurn')} />
            <MetricWidget label="Activity Time" value={formatActivityDuration(activityTime)} onOpen={event => openTarget(event, 'metric:activityTime')} />
            <MetricWidget label="Steps" value={displayNumber(data.steps)} onOpen={event => openTarget(event, 'metric:activitySteps')} />
          </div>
        </div>
      </div>
    </Card>
  );
}
