import Card from './Card';
import SubScoreBar from './SubScoreBar';
import { getScoreColor, SEMANTIC_COLORS } from '../utils/colors';
import { buildReadinessCardSnapshot } from '../utils/cardSnapshots';
import { useToast } from '../context/toast';
import UnavailableState from './UnavailableState';

export default function ReadinessCard({ data }) {
  const { showToast } = useToast();
  if (!data) {
    return (
      <Card title="Readiness" subtitle="Daily readiness and contributors">
        <UnavailableState title="Readiness unavailable" />
      </Card>
    );
  }
  const { score, contributors, temperature_deviation } = data;
  const keys = ['hrv_balance', 'resting_heart_rate', 'recovery_index', 'body_temperature', 'previous_night', 'previous_day_activity', 'sleep_balance', 'activity_balance', 'sleep_regularity'];
  const temperatureColor = Number(temperature_deviation) > 0.5
    ? SEMANTIC_COLORS.bad
    : Number(temperature_deviation) < -0.5
      ? SEMANTIC_COLORS.optimal
      : SEMANTIC_COLORS.good;

  return (
    <Card
      title="Readiness"
      subtitle="Daily readiness and contributors"
      snapshotText={buildReadinessCardSnapshot(data)}
      snapshotLabel="Readiness snapshot"
      onCopyFailure={() => showToast('Failed to copy Readiness snapshot.')}
      onCopySuccess={() => showToast('Readiness snapshot copied to clipboard.')}
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
            />
          ))}
        </div>
        {temperature_deviation !== undefined && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Temperature Deviation</span>
              <span className="font-outfit font-semibold tabular-nums" style={{ color: temperatureColor }}>
                {Number(temperature_deviation).toFixed(2)}°C
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
