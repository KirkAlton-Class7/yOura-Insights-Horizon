import { useCallback, useMemo } from 'react';
import Card from './Card';
import SubScoreBar from './SubScoreBar';
import { useToast } from '../context/toast';
import { getScoreColor } from '../utils/colors';
import { buildSleepCardSnapshot } from '../utils/cardSnapshots';
import UnavailableState from './UnavailableState';
import { SLEEP_STAGE_COLORS } from '../utils/sleepStageColors';
import SleepStageBars from './SleepStageBars';

const SLEEP_CONTRIBUTOR_KEYS = Object.freeze(['deep_sleep', 'rem_sleep', 'total_sleep', 'efficiency', 'restfulness', 'latency', 'timing']);
const SLEEP_CONTRIBUTOR_TARGETS = Object.freeze({
  deep_sleep: 'metric:deepSleepContributor',
  rem_sleep: 'metric:remSleepContributor',
  total_sleep: 'metric:totalSleepContributor',
  efficiency: 'metric:efficiencyContributor',
  restfulness: 'metric:restfulnessContributor',
  latency: 'metric:latencyContributor',
  timing: 'metric:timingContributor',
});

const formatSeconds = (secs) => {
  if (!secs) return '0m';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

const displayNumber = value => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number).toLocaleString() : '--';
};

function MetricWidget({ label, value, unit, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="relative z-20 rounded-xl bg-white/5 p-4 text-left transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
      aria-label={`Open ${label} trends`}
    >
      <p className="text-xs uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-2 font-outfit text-xl font-semibold tabular-nums text-slate-100">
        {value}
        {value !== '--' && unit ? <span className="ml-1 text-sm text-slate-400">{unit}</span> : null}
      </p>
    </button>
  );
}

export default function SleepCard({
  data,
  sleepmodelData,
  sleeptimeData,
  allSleepmodelData,
  selectedDate,
  onOpenDetails,
}) {
  const { showToast } = useToast();
  const { score, contributors } = data || {};
  const openTarget = useCallback((event, target = 'top') => {
    event.stopPropagation();
    onOpenDetails?.(target);
  }, [onOpenDetails]);

  // Sleep stage donut generation (similar to static version)
  const sleepModel = sleepmodelData?.find(r => r.type === 'long_sleep') || sleepmodelData?.[0] || null;
  const sleepDate = selectedDate || data?.day || sleepModel?.day || sleeptimeData?.day;
  const sleepHistory = useMemo(
    () => allSleepmodelData || (sleepDate ? { [sleepDate]: sleepmodelData || [] } : {}),
    [allSleepmodelData, sleepDate, sleepmodelData],
  );

  const stagesHtml = useMemo(() => {
    if (!sleepModel) return null;
    const deep = Number(sleepModel.deep_sleep_duration || 0);
    const rem = Number(sleepModel.rem_sleep_duration || 0);
    const light = Number(sleepModel.light_sleep_duration || 0);
    const awake = Number(sleepModel.awake_time || 0);
    const total = deep + rem + light;

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
    const DEEP_C = SLEEP_STAGE_COLORS.deep;
    const REM_C = SLEEP_STAGE_COLORS.rem;
    const LIGHT_C = SLEEP_STAGE_COLORS.light;
    const AWAKE_C = SLEEP_STAGE_COLORS.awake;

    const donutSVG = `
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r="52" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="18"/>
        ${donutArc(70,70,52, cursor, Math.max(0, awakeP - gap), AWAKE_C)}
        ${(cursor += awakeP, donutArc(70,70,52, cursor, Math.max(0, remP - gap), REM_C))}
        ${(cursor += remP, donutArc(70,70,52, cursor, Math.max(0, lightP - gap), LIGHT_C))}
        ${(cursor += lightP, donutArc(70,70,52, cursor, Math.max(0, deepP - gap), DEEP_C))}
        <text x="70" y="64" text-anchor="middle" fill="white" font-size="18" font-weight="800" font-family="Outfit, ui-sans-serif, system-ui, sans-serif" style="font-variant-numeric:tabular-nums">${formatSeconds(total)}</text>
        <text x="70" y="80" text-anchor="middle" fill="rgba(255,255,255,0.45)" font-size="10" font-family="DM Sans, ui-sans-serif, system-ui, sans-serif">asleep</text>
      </svg>
    `;

    const stageRows = [
      { key: 'awake', label: 'Awake', seconds: awake, percentage: tot4 ? (awake / tot4) * 100 : 0 },
      { key: 'rem', label: 'REM', seconds: rem, percentage: total ? (rem / total) * 100 : 0 },
      { key: 'light', label: 'Light', seconds: light, percentage: total ? (light / total) * 100 : 0 },
      { key: 'deep', label: 'Deep', seconds: deep, percentage: total ? (deep / total) * 100 : 0 },
    ];

    return (
      <div className="mt-4 pt-4 border-t border-white/10">
        <button
          type="button"
          onClick={event => openTarget(event, 'stages')}
          className="relative z-20 block w-full rounded-xl p-2 text-left transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
        >
          <div className="mb-3 text-xs text-slate-500 uppercase tracking-wider">Sleep Stages</div>
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div dangerouslySetInnerHTML={{ __html: donutSVG }} />
            <div className="w-full flex-1">
              <SleepStageBars stages={stageRows} />
            </div>
          </div>
        </button>
      </div>
    );
  }, [sleepModel, openTarget]);

  const keyMetrics = sleepModel ? {
    totalSleep: formatSeconds(Number(sleepModel.total_sleep_duration || 0) || (
      Number(sleepModel.deep_sleep_duration || 0)
      + Number(sleepModel.rem_sleep_duration || 0)
      + Number(sleepModel.light_sleep_duration || 0)
    )),
    timeInBed: formatSeconds(Number(sleepModel.time_in_bed || 0)),
    restingHeartRate: displayNumber(sleepModel.resting_heart_rate ?? sleepModel.lowest_heart_rate),
    averageHrv: displayNumber(sleepModel.average_hrv),
  } : null;

  const hasAnySleepData = Boolean(data || sleepModel || sleeptimeData?.optimal_bedtime);

  return (
    <Card
      title="Sleep"
      subtitle="Sleep score and contributors"
      snapshotText={hasAnySleepData ? buildSleepCardSnapshot(data, sleepmodelData, sleeptimeData, {
        allSleepmodelData: sleepHistory,
        date: sleepDate,
      }) : undefined}
      snapshotLabel="Sleep snapshot"
      onCopyFailure={() => showToast('Failed to copy Sleep snapshot.')}
      onCopySuccess={() => showToast('Sleep snapshot copied to clipboard.')}
      onOpen={() => onOpenDetails?.('top')}
      openLabel="Open Sleep details"
    >
      <div className="space-y-4">
        {data ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Score</span>
              <span className="text-2xl font-outfit font-bold tabular-nums" style={{ color: getScoreColor(score) }}>{score ?? '--'}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SLEEP_CONTRIBUTOR_KEYS.map((key) => (
                <SubScoreBar
                  key={key}
                  label={key.replace(/_/g, ' ')}
                  value={contributors?.[key]}
                  onOpen={event => openTarget(event, SLEEP_CONTRIBUTOR_TARGETS[key])}
                />
              ))}
            </div>
          </>
        ) : (
          <UnavailableState title="Sleep summary unavailable" description="No daily sleep score or contributors were available for this date." />
        )}
        {stagesHtml || (
          <UnavailableState title="Sleep stages and HR unavailable" description="No sleep-model data was available for this date." compact />
        )}
        {keyMetrics && (
          <div className="border-t border-white/10 pt-4">
            <p className="mb-3 text-xs uppercase tracking-wider text-slate-500">Key Metrics</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <MetricWidget label="Total Sleep" value={keyMetrics.totalSleep} onOpen={event => openTarget(event, 'metric:totalSleep')} />
              <MetricWidget label="Time in Bed" value={keyMetrics.timeInBed} onOpen={event => openTarget(event, 'metric:timeInBed')} />
              <MetricWidget label="Resting HR" value={keyMetrics.restingHeartRate} unit="bpm" onOpen={event => openTarget(event, 'metric:restingHeartRate')} />
              <MetricWidget label="Avg HRV" value={keyMetrics.averageHrv} unit="ms" onOpen={event => openTarget(event, 'metric:averageHrv')} />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
