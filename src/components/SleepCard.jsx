import { useMemo } from 'react';
import Card from './Card';
import SubScoreBar from './SubScoreBar';
import { useToast } from '../context/toast';
import { getScoreColor } from '../utils/colors';
import { buildSleepCardSnapshot } from '../utils/cardSnapshots';

export default function SleepCard({ data, sleepmodelData, sleeptimeData }) {
  const { showToast } = useToast();
  const { score, contributors } = data || {};

  const keys = ['deep_sleep', 'rem_sleep', 'total_sleep', 'efficiency', 'restfulness', 'latency', 'timing'];

  // Sleep stage donut and hypnogram generation (similar to static version)
  const sleepModel = sleepmodelData?.find(r => r.type === 'long_sleep') || sleepmodelData?.[0] || null;

  const stagesHtml = useMemo(() => {
    if (!sleepModel) return null;
    const deep = Number(sleepModel.deep_sleep_duration || 0);
    const rem = Number(sleepModel.rem_sleep_duration || 0);
    const light = Number(sleepModel.light_sleep_duration || 0);
    const awake = Number(sleepModel.awake_time || 0);
    const total = deep + rem + light;

    const fmtDuration = (secs) => {
      if (!secs) return '0m';
      const h = Math.floor(secs / 3600);
      const m = Math.floor((secs % 3600) / 60);
      if (h > 0 && m > 0) return `${h}h ${m}m`;
      if (h > 0) return `${h}h`;
      return `${m}m`;
    };

    const tot4 = deep + rem + light + awake || 1;
    const deepP = deep / tot4;
    const remP = rem / tot4;
    const lightP = light / tot4;
    const awakeP = awake / tot4;
    const gap = 0.008;

    // Donut SVG using arcs
    const donutArc = (cx, cy, r, startPct, pct, color) => {
      if (pct <= 0) return '';
      const tau = 2 * Math.PI;
      const s = startPct * tau - Math.PI / 2;
      const e = (startPct + pct) * tau - Math.PI / 2;
      const x1 = cx + r * Math.cos(s);
      const y1 = cy + r * Math.sin(s);
      const x2 = cx + r * Math.cos(e);
      const y2 = cy + r * Math.sin(e);
      const large = pct > 0.5 ? 1 : 0;
      return `<path d="M${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${large},1 ${x2.toFixed(2)},${y2.toFixed(2)}" fill="none" stroke="${color}" stroke-width="18" stroke-linecap="round"/>`;
    };

    let cursor = 0;
    const DEEP_C = '#3b82f6';
    const REM_C = '#8b5cf6';
    const LIGHT_C = '#06b6d4';
    const AWAKE_C = 'rgba(255,255,255,0.15)';

    const donutSVG = `
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r="52" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="18"/>
        ${donutArc(70,70,52, cursor, Math.max(0, deepP - gap), DEEP_C)}
        ${(cursor += deepP, donutArc(70,70,52, cursor, Math.max(0, remP - gap), REM_C))}
        ${(cursor += remP, donutArc(70,70,52, cursor, Math.max(0, lightP - gap), LIGHT_C))}
        ${(cursor += lightP, donutArc(70,70,52, cursor, Math.max(0, awakeP - gap), AWAKE_C))}
        <text x="70" y="64" text-anchor="middle" fill="white" font-size="18" font-weight="800" font-family="Outfit, ui-sans-serif, system-ui, sans-serif" style="font-variant-numeric:tabular-nums">${fmtDuration(total)}</text>
        <text x="70" y="80" text-anchor="middle" fill="rgba(255,255,255,0.45)" font-size="10" font-family="DM Sans, ui-sans-serif, system-ui, sans-serif">asleep</text>
      </svg>
    `;

    const stageRows = [
      { label: 'Deep', dur: deep, color: DEEP_C, pct: total ? deep / total : 0 },
      { label: 'REM', dur: rem, color: REM_C, pct: total ? rem / total : 0 },
      { label: 'Light', dur: light, color: LIGHT_C, pct: total ? light / total : 0 },
      { label: 'Awake', dur: awake, color: AWAKE_C, pct: tot4 ? awake / tot4 : 0 },
    ];

    const legend = stageRows.map(row => (
      <div key={row.label} className="flex items-center gap-3">
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: row.color }} />
        <span className="text-xs text-slate-400 w-12">{row.label}</span>
        <span className="ml-auto text-xs font-outfit font-semibold tabular-nums text-white">{fmtDuration(row.dur)}</span>
        <span className="text-xs text-slate-500 w-10 text-right">{Math.round(row.pct * 100)}%</span>
      </div>
    ));

    // Hypnogram (simplified – just show colour blocks)
    let hypnoHtml = null;
    const phaseStr = sleepModel.sleep_phase_5_min || sleepModel.sleep_phase_30_sec || '';
    if (phaseStr && phaseStr.length > 4) {
      const phases = phaseStr.split('').map(Number).filter(n => n >= 1 && n <= 4);
      const stageColors = { 1: AWAKE_C, 2: LIGHT_C, 3: REM_C, 4: DEEP_C };
      const blocks = phases.map((p, i) => (
        <div key={i} className="flex-1 h-8" style={{ background: stageColors[p] || 'transparent' }} />
      ));
      hypnoHtml = (
        <div className="mt-4">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Sleep Stages</div>
          <div className="flex h-8 rounded overflow-hidden border border-white/5">
            {blocks}
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>{new Date(sleepModel.bedtime_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <span>{new Date(sleepModel.bedtime_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      );
    }

    // Extra metrics
    const avgHR = sleepModel.average_heart_rate ? Number(sleepModel.average_heart_rate).toFixed(0) : '--';
    const avgHRV = sleepModel.average_hrv ? Number(sleepModel.average_hrv).toFixed(0) : '--';
    const avgBr = sleepModel.average_breath ? Number(sleepModel.average_breath).toFixed(1) : '--';
    const loHR = sleepModel.lowest_heart_rate || '--';
    const eff = sleepModel.efficiency ? Number(sleepModel.efficiency) + '%' : '--';

    return (
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div dangerouslySetInnerHTML={{ __html: donutSVG }} />
          <div className="flex-1 space-y-1">{legend}</div>
        </div>
        {hypnoHtml}
        <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
          <div><span className="text-slate-500">Avg HR</span><br /><span className="font-outfit font-semibold tabular-nums text-white">{avgHR} bpm</span></div>
          <div><span className="text-slate-500">Lowest HR</span><br /><span className="font-outfit font-semibold tabular-nums text-white">{loHR} bpm</span></div>
          <div><span className="text-slate-500">Avg HRV</span><br /><span className="font-outfit font-semibold tabular-nums text-white">{avgHRV} ms</span></div>
          <div><span className="text-slate-500">Breathing</span><br /><span className="font-outfit font-semibold tabular-nums text-white">{avgBr} br/min</span></div>
          <div><span className="text-slate-500">Efficiency</span><br /><span className="font-outfit font-semibold tabular-nums text-white">{eff}</span></div>
          <div><span className="text-slate-500">Restless</span><br /><span className="font-outfit font-semibold tabular-nums text-white">{sleepModel.restless_periods || '--'}</span></div>
        </div>
      </div>
    );
  }, [sleepModel]);

  // Optimal bedtime window
  const bedtimeWindow = useMemo(() => {
    if (!data?.day || !sleeptimeData?.optimal_bedtime) return null;
    const ob = sleeptimeData.optimal_bedtime;
    const tz = ob.day_tz || 0;
    const midnightMs = new Date(data.day + 'T00:00:00Z').getTime() - tz * 1000;
    const startMs = midnightMs + (ob.start_offset || 0) * 1000;
    const endMs = midnightMs + (ob.end_offset || 0) * 1000;
    const fmt = (ms) => new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return (
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="text-xs text-slate-500 uppercase tracking-wider">Optimal Bedtime Window</div>
        <div className="flex gap-4 mt-1">
          <span className="text-sm text-purple-300">{fmt(startMs)} – {fmt(endMs)}</span>
        </div>
      </div>
    );
  }, [sleeptimeData, data]);

  if (!data) return null;

  return (
    <Card
      title="Sleep"
      subtitle="Sleep score and contributors"
      snapshotText={buildSleepCardSnapshot(data, sleepmodelData, sleeptimeData)}
      snapshotLabel="Sleep snapshot"
      onCopyFailure={() => showToast('Failed to copy Sleep snapshot.')}
      onCopySuccess={() => showToast('Sleep snapshot copied to clipboard.')}
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
        {stagesHtml}
        {bedtimeWindow}
      </div>
    </Card>
  );
}
