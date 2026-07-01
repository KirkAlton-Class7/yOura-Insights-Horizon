import Card from './Card';
import SubScoreBar from './SubScoreBar';
import { useToast } from '../context/toast';
import { getStatusColor, SEMANTIC_COLORS } from '../utils/colors';
import { buildStressResilienceCardSnapshot } from '../utils/cardSnapshots';

export default function StressResilienceCard({ stressData, resilienceData, daytimeStressData }) {
  const { showToast } = useToast();

  // Compute average stress/recovery from daytimestress
  const stressVals = daytimeStressData.map(r => Number(r.stress_value)).filter(v => !isNaN(v) && v > 0);
  const recovVals = daytimeStressData.map(r => Number(r.recovery_value)).filter(v => !isNaN(v) && v > 0);
  const avgStress = stressVals.length ? Math.round(stressVals.reduce((a, b) => a + b, 0) / stressVals.length) : null;
  const avgRecov = recovVals.length ? Math.round(recovVals.reduce((a, b) => a + b, 0) / recovVals.length) : null;

  if (!stressData && !resilienceData && !avgStress) {
    return (
      <Card title="Stress & Resilience" subtitle="No data available" onCopyFailure={() => showToast('No data to copy')}>
        <div className="text-slate-400 text-center py-8">No stress or resilience data for this date</div>
      </Card>
    );
  }

  const fmtDuration = (secs) => {
    if (!secs) return '0m';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };

  const stressHigh = stressData?.stress_high ? Number(stressData.stress_high) : 0;
  const recovHigh = stressData?.recovery_high ? Number(stressData.recovery_high) : 0;
  const totalTime = stressHigh + recovHigh || 1;
  const daySummary = stressData?.day_summary || null;
  const summaryColor = getStatusColor(daySummary);

  const levelLabel = resilienceData?.level ? resilienceData.level.charAt(0).toUpperCase() + resilienceData.level.slice(1) : null;
  const levelColor = getStatusColor(resilienceData?.level);
  const resContrib = resilienceData?.contributors || {};

  return (
    <Card
      title="Stress & Resilience"
      subtitle="Daily stress, recovery, and resilience"
      snapshotText={buildStressResilienceCardSnapshot(stressData, resilienceData, daytimeStressData)}
      snapshotLabel="Stress & Resilience snapshot"
      onCopyFailure={() => showToast('Failed to copy Stress & Resilience snapshot.')}
      onCopySuccess={() => showToast('Stress & Resilience snapshot copied to clipboard.')}
    >
      <div className="space-y-4">
        {(stressHigh > 0 || recovHigh > 0) && (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 w-16">Stress</span>
              <div className="flex-1 h-2 bg-slate-700/50 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(stressHigh / totalTime) * 100}%`, backgroundColor: SEMANTIC_COLORS.bad }} />
              </div>
              <span className="w-16 text-right text-xs font-outfit font-medium tabular-nums text-slate-400">{fmtDuration(stressHigh)}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 w-16">Recovery</span>
              <div className="flex-1 h-2 bg-slate-700/50 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(recovHigh / totalTime) * 100}%`, backgroundColor: SEMANTIC_COLORS.optimal }} />
              </div>
              <span className="w-16 text-right text-xs font-outfit font-medium tabular-nums text-slate-400">{fmtDuration(recovHigh)}</span>
            </div>
          </div>
        )}

        {(avgStress !== null || avgRecov !== null) && (
          <div className="grid grid-cols-2 gap-2 text-sm">
            {avgStress !== null && (
              <div><span className="text-slate-400">Avg Stress</span><br /><span className="font-outfit font-semibold tabular-nums text-white">{avgStress}</span></div>
            )}
            {avgRecov !== null && (
              <div><span className="text-slate-400">Avg Recovery</span><br /><span className="font-outfit font-semibold tabular-nums text-white">{avgRecov}</span></div>
            )}
          </div>
        )}

        {daySummary && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Day Summary:</span>
            <span className="text-sm font-medium" style={{ color: summaryColor }}>{daySummary.charAt(0).toUpperCase() + daySummary.slice(1)}</span>
          </div>
        )}

        {resilienceData && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 uppercase tracking-wider">Resilience</span>
              {levelLabel && <span className="font-outfit font-bold" style={{ color: levelColor }}>{levelLabel}</span>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              {resContrib.daytime_recovery !== undefined && (
                <SubScoreBar label="Daytime Recovery" value={Math.round(resContrib.daytime_recovery)} />
              )}
              {resContrib.sleep_recovery !== undefined && (
                <SubScoreBar label="Sleep Recovery" value={Math.round(resContrib.sleep_recovery)} />
              )}
              {resContrib.stress !== undefined && (
                <SubScoreBar label="Stress Capacity" value={Math.round(resContrib.stress)} />
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
