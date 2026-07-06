import Card from './Card';
import SubScoreBar from './SubScoreBar';
import { useToast } from '../context/toast';
import { getScoreColor } from '../utils/colors';
import { buildActivityCardSnapshot } from '../utils/cardSnapshots';
import UnavailableState from './UnavailableState';

export default function ActivityCard({ data, onOpenDetails }) {
  const { showToast } = useToast();
  if (!data) {
    return (
      <Card title="Activity" subtitle="Activity score and breakdown">
        <UnavailableState title="Activity unavailable" />
      </Card>
    );
  }
  const { score, contributors } = data;

  const keys = ['meet_daily_targets', 'move_every_hour', 'recovery_time', 'stay_active', 'training_frequency', 'training_volume'];
  const contributorTargets = {
    meet_daily_targets: 'metric:meetDailyTargetsContributor',
    move_every_hour: 'metric:moveEveryHourContributor',
    recovery_time: 'metric:recoveryTimeContributor',
    stay_active: 'metric:stayActiveContributor',
    training_frequency: 'metric:trainingFrequencyContributor',
    training_volume: 'metric:trainingVolumeContributor',
  };
  const openTarget = (event, target = 'top') => {
    event.stopPropagation();
    onOpenDetails?.(target);
  };

  const steps = data.steps ? Number(data.steps).toLocaleString() : '--';
  const activeCal = data.active_calories || '--';
  const totalCal = data.total_calories || '--';
  const equivDist = data.equivalent_walking_distance ? (Number(data.equivalent_walking_distance) / 1609.344).toFixed(2) : '--';

  const highT = Number(data.high_activity_time || 0);
  const medT = Number(data.medium_activity_time || 0);
  const lowT = Number(data.low_activity_time || 0);
  const sedT = Number(data.sedentary_time || 0);
  const totalT = highT + medT + lowT + sedT || 1;

  const fmtDuration = (secs) => {
    if (!secs) return '0m';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };

  const activityBreakdown = (
    <button
      type="button"
      onClick={event => openTarget(event, 'movement')}
      className="relative z-20 mt-4 block w-full rounded-xl p-2 text-left transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
      aria-label="Open daily movement details"
    >
      <div className="space-y-2">
      {[
        { label: 'Vigorous', t: highT, c: '#f43f5e' },
        { label: 'Moderate', t: medT, c: '#f59e0b' },
        { label: 'Light', t: lowT, c: '#06b6d4' },
        { label: 'Sedentary', t: sedT, c: 'rgba(255,255,255,0.2)' },
      ].map(row => (
        <div key={row.label} className="flex items-center gap-3">
          <span className="text-xs text-slate-400 w-16">{row.label}</span>
          <div className="flex-1 h-2 bg-slate-700/50 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${(row.t / totalT) * 100}%`, background: row.c }} />
          </div>
          <span className="w-16 text-right text-xs font-outfit font-medium tabular-nums text-slate-400">{fmtDuration(row.t)}</span>
        </div>
      ))}
      </div>
    </button>
  );

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
        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
          {[
            ['Steps', steps, 'metric:activitySteps'],
            ['Active Cal', activeCal, 'metric:activityGoalProgress'],
            ['Total Cal', totalCal, 'metric:activityTotalBurn'],
            ['Equiv Walk', `${equivDist} mi`, 'top'],
            ['Inactivity Alerts', data.inactivity_alerts || 0, 'top'],
          ].map(([label, value, target]) => (
            <button
              key={label}
              type="button"
              onClick={event => openTarget(event, target)}
              className="relative z-20 rounded-xl p-2 text-left transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              <span className="text-slate-400">{label}</span><br />
              <span className="font-outfit font-semibold tabular-nums text-white">{value}</span>
            </button>
          ))}
        </div>
        {activityBreakdown}
      </div>
    </Card>
  );
}
