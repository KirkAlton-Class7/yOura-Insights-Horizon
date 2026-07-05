import Card from './Card';
import UnavailableState from './UnavailableState';
import { useToast } from '../context/toast';
import { SEMANTIC_COLORS } from '../utils/colors';
import { buildWearCoverageCardSnapshot } from '../utils/cardSnapshots';
import { formatWearDuration, getWearCoverage } from '../utils/wearCoverage';

export default function WearCoverageCard({ data, selectedDate }) {
  const { showToast } = useToast();
  const result = getWearCoverage(data);

  if (!result.available) {
    return (
      <Card title="Ring Wear Coverage" subtitle="Daily non-wear time and data completeness">
        <UnavailableState
          title="Wear coverage unavailable"
          description="No Daily Activity non-wear data was available for this date."
        />
      </Card>
    );
  }

  const color = result.isPartial
    ? SEMANTIC_COLORS.bad
    : SEMANTIC_COLORS[result.band.level];
  const statusLabel = result.isPartial ? 'Incomplete day' : result.band.label;
  const description = result.isPartial
    ? 'The exported activity record does not contain a complete day, so wear coverage cannot be rated and daily insights may be incomplete.'
    : result.band.description;

  return (
    <Card
      title="Ring Wear Coverage"
      subtitle="Daily non-wear time and data completeness"
      snapshotText={buildWearCoverageCardSnapshot(data, selectedDate)}
      snapshotLabel="Ring Wear Coverage snapshot"
      onCopyFailure={() => showToast('Failed to copy Ring Wear Coverage snapshot.')}
      onCopySuccess={() => showToast('Ring Wear Coverage snapshot copied to clipboard.')}
    >
      <div className="space-y-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-500">Wear Coverage</div>
            <div className="mt-1 text-4xl font-outfit font-bold" style={{ color }}>
              {result.isPartial ? 'Incomplete' : `${result.coverage.toFixed(1)}%`}
            </div>
          </div>
          <div className="sm:text-right">
            <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-semibold" style={{ color }}>
              {statusLabel}
            </div>
            <div className="mt-2 text-sm text-slate-400">
              {result.isPartial ? 'Non-wear time:' : result.nonWearSeconds > 0 ? 'Non-wear detected:' : 'Non-wear time:'}{' '}
              <span
                className="font-semibold tabular-nums"
                style={{ color: result.isPartial || result.nonWearSeconds > 0 ? SEMANTIC_COLORS.bad : SEMANTIC_COLORS.neutral }}
              >
                {result.isPartial ? 'N/A' : formatWearDuration(result.nonWearSeconds)}
              </span>
            </div>
            {result.isPartial && (
              <div className="mt-1 space-y-1 text-xs">
                <div style={{ color: SEMANTIC_COLORS.bad }}>
                  Unclassified time: {formatWearDuration(result.unclassifiedSeconds)}
                </div>
                <div className="text-slate-500">
                  Activity record: {formatWearDuration(result.recordedSeconds)} of 24h
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-700/50">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${result.isPartial ? result.recordedPercentage : result.coverage}%`,
                backgroundColor: color,
              }}
            />
          </div>
          {result.isPartial && (
            <div className="mt-1 text-xs font-medium tabular-nums" style={{ color }}>
              {result.recordedPercentage.toFixed(1)}% of the daily activity record is available
            </div>
          )}
          <p className="mt-2 text-sm text-slate-400">{description}</p>
        </div>
      </div>
    </Card>
  );
}
