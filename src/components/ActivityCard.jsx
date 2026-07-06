import Card from './Card';
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
  const { score } = data;

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
      </div>
    </Card>
  );
}
