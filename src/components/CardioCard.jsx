import Card from './Card';
import { useToast } from '../context/ToastContext';
import { METRIC_COLORS } from '../utils/colors';

export default function CardioCard({ data, dateWindow, allData, selectedDate }) {
  const { showToast } = useToast();
  if (!data) return null;

  const vasAge = data.vascular_age ? Number(data.vascular_age) : null;
  const pwv = data.pulse_wave_velocity ? Number(data.pulse_wave_velocity).toFixed(2) : null;

  // Trend bars
  const trendItems = dateWindow.map(d => {
    const rec = allData?.[d]?.[0];
    return rec ? Number(rec.vascular_age) : null;
  }).filter(v => v !== null);

  const minAge = trendItems.length ? Math.min(...trendItems) : null;
  const maxAge = trendItems.length ? Math.max(...trendItems) : null;

  const trendBars = dateWindow.map((d, idx) => {
    const rec = allData?.[d]?.[0];
    const v = rec ? Number(rec.vascular_age) : null;
    if (v === null) {
      return <div key={idx} className="flex-1 h-6 bg-slate-700/30 rounded-sm" />;
    }
    const range = (maxAge - minAge) || 1;
    const height = Math.max(6, Math.round(((v - minAge) / range) * 26) + 6);
    const isActive = d === selectedDate;
    return (
      <div key={idx} className={`flex-1 flex flex-col items-end justify-end ${isActive ? 'active' : ''}`}>
        <div className="w-full rounded-sm" style={{ height: `${height}px`, backgroundColor: METRIC_COLORS.cardiovascular, opacity: isActive ? 1 : 0.35 }} />
      </div>
    );
  });

  return (
    <Card
      title="Cardiovascular Health"
      subtitle="Vascular age and pulse wave velocity"
      snapshotText={`Vascular Age: ${vasAge || 'N/A'}`}
      snapshotLabel="Cardiovascular snapshot"
      onCopyFailure={() => showToast('Failed to copy Cardiovascular snapshot.')}
      onCopySuccess={() => showToast('Cardiovascular snapshot copied to clipboard.')}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {vasAge !== null && (
            <div><span className="text-xs text-slate-400">Vascular Age</span><br /><span className="text-2xl font-outfit font-bold tabular-nums" style={{ color: METRIC_COLORS.cardiovascular }}>{vasAge} years</span></div>
          )}
          {pwv !== null && (
            <div><span className="text-xs text-slate-400">Pulse Wave Velocity</span><br /><span className="text-2xl font-outfit font-bold tabular-nums" style={{ color: METRIC_COLORS.cardiovascular }}>{pwv} m/s</span></div>
          )}
        </div>
        {trendBars.length > 0 && (
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider">7‑Day Vascular Age Trend</div>
            <div className="flex items-end gap-1 h-10 mt-1">{trendBars}</div>
          </div>
        )}
      </div>
    </Card>
  );
}
