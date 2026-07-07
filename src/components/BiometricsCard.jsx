import Card from './Card';
import { useToast } from '../context/toast';
import { getBloodOxygenColor, METRIC_COLORS } from '../utils/colors';
import { buildBiometricsCardSnapshot } from '../utils/cardSnapshots';
import UnavailableState from './UnavailableState';

export default function BiometricsCard({ spo2Data, heartrateData, temperatureData, onOpenDetails, onOpenMetric }) {
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
      <Card title="Biometrics" subtitle="Blood oxygen, heart rate, and temperature">
        <UnavailableState title="Biometrics unavailable" />
      </Card>
    );
  }

  return (
    <Card
      title="Biometrics"
      subtitle="Blood oxygen, heart rate, and temperature"
      snapshotText={buildBiometricsCardSnapshot(spo2Data, heartrateData, temperatureData)}
      snapshotLabel="Biometrics snapshot"
      onCopyFailure={() => showToast('Failed to copy Biometrics snapshot.')}
      onCopySuccess={() => showToast('Biometrics snapshot copied to clipboard.')}
      onOpen={onOpenDetails}
      openLabel="Open Biometrics details"
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
        {!spo2Val && (
          <UnavailableState title="Blood oxygen unavailable" description="No SpO₂ data was available for this date." compact />
        )}
        {avgBpm && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onOpenMetric?.('biometricsHeartRate');
            }}
            className="relative z-20 rounded-xl bg-white/5 p-4 text-left transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            aria-label="Open Heart Rate trends"
          >
            <div className="text-xs text-slate-400 uppercase tracking-wider">Heart Rate</div>
            <div className="text-3xl font-outfit font-bold tabular-nums" style={{ color: METRIC_COLORS.heartRate }}>{avgBpm} bpm</div>
            <div className="text-xs text-slate-400 mt-1">Min {minBpm} · Max {maxBpm} · {bpms.length} readings</div>
          </button>
        )}
        {!avgBpm && (
          <UnavailableState title="Heart rate unavailable" description="No heart-rate readings were available for this date." compact />
        )}
        {avgTemp && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onOpenMetric?.('biometricsSkinTemperature');
            }}
            className="relative z-20 rounded-xl bg-white/5 p-4 text-left transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 sm:col-span-2"
            aria-label="Open Skin Temperature trends"
          >
            <div className="text-xs text-slate-400 uppercase tracking-wider">Skin Temperature</div>
            <div className="text-3xl font-outfit font-bold tabular-nums" style={{ color: METRIC_COLORS.skinTemperature }}>{avgTemp}°C</div>
            <div className="text-xs text-slate-400 mt-1">Range {minTemp}° – {maxTemp}° · {temps.length} readings</div>
          </button>
        )}
        {!avgTemp && (
          <UnavailableState title="Skin temperature unavailable" description="No temperature readings were available for this date." compact className="sm:col-span-2" />
        )}
      </div>
    </Card>
  );
}
