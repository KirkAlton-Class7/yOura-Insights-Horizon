import Card from './Card';
import { useToast } from '../context/toast';
import { METRIC_COLORS } from '../utils/colors';
import { buildCardiovascularCardSnapshot } from '../utils/cardSnapshots';
import UnavailableState from './UnavailableState';
import { formatChartPointLabel, HtmlChartPointLabel, useChartPointLabel } from './ChartPointLabel';

export default function CardioCard({ data, dateWindow, allData, selectedDate }) {
  const { showToast } = useToast();
  const labelState = useChartPointLabel();
  const vasAge = data?.vascular_age ? Number(data.vascular_age) : null;
  const pwv = data?.pulse_wave_velocity ? Number(data.pulse_wave_velocity).toFixed(2) : null;

  // Trend bars
  const trendItems = dateWindow.map(d => {
    const rec = allData?.[d]?.[0];
    const value = rec?.vascular_age;
    return value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value))
      ? Number(value)
      : null;
  }).filter(v => v !== null);

  const minAge = trendItems.length ? Math.min(...trendItems) : null;
  const maxAge = trendItems.length ? Math.max(...trendItems) : null;

  const trendBars = dateWindow.map((d, idx) => {
    const rec = allData?.[d]?.[0];
    const value = rec?.vascular_age;
    const v = value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value))
      ? Number(value)
      : null;
    if (v === null) {
      return <div key={idx} className="flex-1 h-6 bg-slate-700/30 rounded-sm" />;
    }
    const range = (maxAge - minAge) || 1;
    const height = Math.max(6, Math.round(((v - minAge) / range) * 26) + 6);
    const isActive = d === selectedDate;
    return (
      <div
        key={idx}
        role="button"
        tabIndex="0"
        className={`relative flex flex-1 cursor-pointer flex-col items-end justify-end outline-none ${isActive ? 'active' : ''}`}
        onClick={() => labelState.showClicked(d)}
        onMouseEnter={() => labelState.showHovered(d)}
        onMouseLeave={() => labelState.hideHovered(d)}
        onFocus={() => labelState.showHovered(d)}
        onBlur={() => labelState.hideHovered(d)}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            labelState.showClicked(d);
          }
        }}
        aria-label={`${formatChartPointLabel(d)}, vascular age ${v}`}
      >
        {d === labelState.activeKey && <HtmlChartPointLabel label={formatChartPointLabel(d)} fading={labelState.fading} className={`bottom-[calc(100%+0.35rem)] ${idx === 0 ? 'left-0' : idx === dateWindow.length - 1 ? 'right-0' : 'left-1/2 -translate-x-1/2'}`} />}
        <div className="w-full rounded-sm" style={{ height: `${height}px`, backgroundColor: METRIC_COLORS.cardiovascular, opacity: isActive ? 1 : 0.35 }} />
      </div>
    );
  });

  return (
    <Card
      title="Cardiovascular Health"
      subtitle="Vascular age and pulse wave velocity"
      snapshotText={(data || trendItems.length) ? buildCardiovascularCardSnapshot(data, dateWindow, allData, selectedDate) : undefined}
      snapshotLabel="Cardiovascular snapshot"
      onCopyFailure={() => showToast('Failed to copy Cardiovascular snapshot.')}
      onCopySuccess={() => showToast('Cardiovascular snapshot copied to clipboard.')}
    >
      <div className="space-y-4">
        {(vasAge !== null || pwv !== null) ? (
          <div className="grid grid-cols-2 gap-4">
            {vasAge !== null && (
              <div><span className="text-xs text-slate-400">Vascular Age</span><br /><span className="text-2xl font-outfit font-bold tabular-nums" style={{ color: METRIC_COLORS.cardiovascular }}>{vasAge} years</span></div>
            )}
            {pwv !== null && (
              <div><span className="text-xs text-slate-400">Pulse Wave Velocity</span><br /><span className="text-2xl font-outfit font-bold tabular-nums" style={{ color: METRIC_COLORS.cardiovascular }}>{pwv} m/s</span></div>
            )}
          </div>
        ) : (
          <UnavailableState title="Cardiovascular metrics unavailable" />
        )}
        {trendItems.length > 0 ? (
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider">7‑Day Vascular Age Trend</div>
            <div className="flex items-end gap-1 h-10 mt-1">{trendBars}</div>
          </div>
        ) : (
          <UnavailableState title="Vascular age trend unavailable" description="No cardiovascular-age data was available for this week." compact />
        )}
      </div>
    </Card>
  );
}
