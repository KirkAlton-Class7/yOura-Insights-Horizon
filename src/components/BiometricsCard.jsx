import Card from './Card';
import { useToast } from '../context/toast';
import { getBloodOxygenColor, METRIC_COLORS } from '../utils/colors';

export default function BiometricsCard({ spo2Data, heartrateData, temperatureData }) {
  const { showToast } = useToast();

  const spo2Val = spo2Data?.spo2_percentage?.average ? Number(spo2Data.spo2_percentage.average).toFixed(1) : null;
  const bdi = spo2Data?.breathing_disturbance_index;

  const bpms = heartrateData.map(r => Number(r.bpm)).filter(v => v > 0 && v < 250);
  const avgBpm = bpms.length ? Math.round(bpms.reduce((a, b) => a + b, 0) / bpms.length) : null;
  const minBpm = bpms.length ? Math.min(...bpms) : null;
  const maxBpm = bpms.length ? Math.max(...bpms) : null;

  const temps = temperatureData.map(r => Number(r.skin_temp)).filter(v => v > 0);
  const avgTemp = temps.length ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1) : null;
  const minTemp = temps.length ? Math.min(...temps).toFixed(1) : null;
  const maxTemp = temps.length ? Math.max(...temps).toFixed(1) : null;

  if (!spo2Val && !avgBpm && !avgTemp) {
    return (
      <Card title="Biometrics" subtitle="No biometric data available" onCopyFailure={() => showToast('No data to copy')}>
        <div className="text-slate-400 text-center py-8">No biometric data for this date</div>
      </Card>
    );
  }

  return (
    <Card
      title="Biometrics"
      subtitle="Blood oxygen, heart rate, and temperature"
      snapshotText={`SpO2: ${spo2Val || 'N/A'}%, HR: ${avgBpm || 'N/A'} bpm`}
      snapshotLabel="Biometrics snapshot"
      onCopyFailure={() => showToast('Failed to copy Biometrics snapshot.')}
      onCopySuccess={() => showToast('Biometrics snapshot copied to clipboard.')}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {spo2Val && (
          <div className="bg-white/5 p-4 rounded-xl">
            <div className="text-xs text-slate-400 uppercase tracking-wider">Blood Oxygen (SpO₂)</div>
            <div className="text-3xl font-outfit font-bold tabular-nums" style={{ color: getBloodOxygenColor(spo2Val) }}>
              {spo2Val}%
            </div>
            {bdi !== undefined && <div className="text-xs text-slate-400 mt-1">Breathing disturbance: {bdi}</div>}
          </div>
        )}
        {avgBpm && (
          <div className="bg-white/5 p-4 rounded-xl">
            <div className="text-xs text-slate-400 uppercase tracking-wider">Heart Rate</div>
            <div className="text-3xl font-outfit font-bold tabular-nums" style={{ color: METRIC_COLORS.heartRate }}>{avgBpm} bpm</div>
            <div className="text-xs text-slate-400 mt-1">Min {minBpm} · Max {maxBpm} · {bpms.length} readings</div>
          </div>
        )}
        {avgTemp && (
          <div className="bg-white/5 p-4 rounded-xl sm:col-span-2">
            <div className="text-xs text-slate-400 uppercase tracking-wider">Skin Temperature</div>
            <div className="text-3xl font-outfit font-bold tabular-nums" style={{ color: METRIC_COLORS.skinTemperature }}>{avgTemp}°C</div>
            <div className="text-xs text-slate-400 mt-1">Range {minTemp}° – {maxTemp}° · {temps.length} readings</div>
          </div>
        )}
      </div>
    </Card>
  );
}
