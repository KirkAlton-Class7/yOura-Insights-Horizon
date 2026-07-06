import { useCallback, useMemo } from 'react';
import { Info } from 'lucide-react';
import Card from './Card';
import SubScoreBar from './SubScoreBar';
import SleepStageTimeline from './SleepStageTimeline';
import { useToast } from '../context/toast';
import { getScoreColor } from '../utils/colors';
import { buildSleepCardSnapshot } from '../utils/cardSnapshots';
import UnavailableState from './UnavailableState';
import { calendarDates } from '../utils/dateService';
import { calculateSleepRegularity } from '../utils/sleepRegularity';
import { SLEEP_STAGE_COLORS } from '../utils/sleepStageColors';
import {
  SLEEP_DEBT_CATEGORIES,
  calculateSleepDebt,
  formatSleepDebt,
  getSleepDebtMarkerPosition,
} from '../utils/sleepDebt';

function SleepDebtSection({ sleepDebt, onOpen }) {
  if (!sleepDebt) {
    return (
      <UnavailableState
        title="Sleep debt unavailable"
        description="At least five nights of sleep data within the previous 14 days are required."
        compact
      />
    );
  }

  const categories = Object.values(SLEEP_DEBT_CATEGORIES);
  const markerPosition = getSleepDebtMarkerPosition(sleepDebt.debtSeconds);

  return (
    <section className="mt-4 border-t border-white/10 pt-4" aria-label="Estimated sleep debt">
      <button
        type="button"
        onClick={onOpen}
        className="relative z-20 block w-full rounded-2xl border border-white/10 bg-slate-950/35 p-4 text-left transition-colors hover:bg-slate-900/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 sm:p-5"
      >
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">Sleep Debt</div>
        <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-outfit text-4xl font-light tabular-nums text-slate-100">
            {formatSleepDebt(sleepDebt.debtSeconds)}
          </span>
          <span
            className="font-outfit text-lg font-semibold uppercase tracking-[0.14em]"
            style={{ color: sleepDebt.category.color }}
          >
            {sleepDebt.category.label}
          </span>
        </div>

        <div className="relative mt-6" aria-hidden="true">
          <div className="grid grid-cols-4 gap-2">
            {categories.map(category => (
              <div
                key={category.label}
                className="h-1.5 rounded-full"
                style={{
                  backgroundColor: category.label === sleepDebt.category.label
                    ? category.color
                    : 'rgba(148, 163, 184, 0.25)',
                }}
              />
            ))}
          </div>
          <div
            className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-slate-100 bg-slate-900 shadow-md"
            style={{ left: `${markerPosition}%` }}
          />
        </div>
        <div className="mt-3 flex justify-between text-xs text-slate-400">
          <span>None</span>
          <span>High</span>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-slate-300">{sleepDebt.category.description}</p>
        <p className="mt-3 text-[11px] text-slate-500">
          Estimated from exported sleep history · Sleep need {formatSleepDebt(sleepDebt.sleepNeedSeconds)} · {sleepDebt.recentNights} nights
        </p>
      </button>
    </section>
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

  const keys = ['deep_sleep', 'rem_sleep', 'total_sleep', 'efficiency', 'restfulness', 'latency', 'timing'];

  // Sleep stage donut and hypnogram generation (similar to static version)
  const sleepModel = sleepmodelData?.find(r => r.type === 'long_sleep') || sleepmodelData?.[0] || null;
  const sleepDate = selectedDate || data?.day || sleepModel?.day || sleeptimeData?.day;
  const sleepHistory = useMemo(
    () => allSleepmodelData || (sleepDate ? { [sleepDate]: sleepmodelData || [] } : {}),
    [allSleepmodelData, sleepDate, sleepmodelData],
  );
  const sleepDebt = useMemo(
    () => calculateSleepDebt(sleepHistory, sleepDate),
    [sleepHistory, sleepDate],
  );
  const sleepRegularity = useMemo(
    () => calculateSleepRegularity(sleepHistory, sleepDate),
    [sleepHistory, sleepDate],
  );

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
        <text x="70" y="64" text-anchor="middle" fill="white" font-size="18" font-weight="800" font-family="Outfit, ui-sans-serif, system-ui, sans-serif" style="font-variant-numeric:tabular-nums">${fmtDuration(total)}</text>
        <text x="70" y="80" text-anchor="middle" fill="rgba(255,255,255,0.45)" font-size="10" font-family="DM Sans, ui-sans-serif, system-ui, sans-serif">asleep</text>
      </svg>
    `;

    const stageRows = [
      { label: 'Awake', dur: awake, color: AWAKE_C, pct: tot4 ? awake / tot4 : 0 },
      { label: 'REM', dur: rem, color: REM_C, pct: total ? rem / total : 0 },
      { label: 'Light', dur: light, color: LIGHT_C, pct: total ? light / total : 0 },
      { label: 'Deep', dur: deep, color: DEEP_C, pct: total ? deep / total : 0 },
    ];

    const legend = stageRows.map(row => (
      <div key={row.label} className="flex items-center gap-3">
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: row.color }} />
        <span className="text-xs text-slate-400 w-12">{row.label}</span>
        <span className="ml-auto text-xs font-outfit font-semibold tabular-nums text-white">{fmtDuration(row.dur)}</span>
        <span className="text-xs text-slate-500 w-10 text-right">{Math.round(row.pct * 100)}%</span>
      </div>
    ));

    // Sleep-stage timeline uses the same vertical stage mapping as the drilldown.
    let hypnoHtml = null;
    const phaseStr = sleepModel.sleep_phase_5_min || sleepModel.sleep_phase_30_sec || '';
    if (phaseStr && phaseStr.length > 4) {
      const phases = phaseStr.split('').map(Number).filter(n => n >= 1 && n <= 4);
      hypnoHtml = (
        <div className="mt-4">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Sleep Stages</div>
          <div className="overflow-hidden rounded-xl border border-white/5 bg-slate-950/25 px-1 sm:px-3">
            <SleepStageTimeline
              phases={phases}
              startTimestamp={sleepModel.bedtime_start}
              endTimestamp={sleepModel.bedtime_end}
            />
          </div>
        </div>
      );
    }

    // Extra metrics
    const avgHR = sleepModel.average_heart_rate ? Number(sleepModel.average_heart_rate).toFixed(0) : '--';
    const avgHRV = sleepModel.average_hrv ? Number(sleepModel.average_hrv).toFixed(0) : '--';
    const avgBr = sleepModel.average_breath ? Number(sleepModel.average_breath).toFixed(1) : '--';
    const loHR = sleepModel.lowest_heart_rate || '--';
    const restingHR = sleepModel.resting_heart_rate || sleepModel.lowest_heart_rate || '--';
    const eff = sleepModel.efficiency ? Number(sleepModel.efficiency) + '%' : '--';
    const timeInBed = Number(sleepModel.time_in_bed || 0);

    const metricItems = [
      ['Total Sleep', fmtDuration(total), 'metric:totalSleep'],
      ['Time in Bed', fmtDuration(timeInBed), 'metric:timeInBed'],
      ['Resting HR', `${restingHR} bpm`, 'metric:restingHeartRate'],
      ['Avg HR', `${avgHR} bpm`, 'top'],
      ['Lowest HR', `${loHR} bpm`, 'metric:restingHeartRate'],
      ['Avg HRV', `${avgHRV} ms`, 'metric:averageHrv'],
      ['Breathing', `${avgBr} br/min`, 'metric:respiratoryRate'],
      ['Efficiency', eff, 'metric:sleepEfficiency'],
      ['Restless', sleepModel.restless_periods || '--', 'top'],
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
            <div className="flex-1 space-y-1">{legend}</div>
          </div>
          {hypnoHtml}
        </button>
        <div className="mt-5 text-xs text-slate-500 uppercase tracking-wider">Key Metrics</div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-4 mt-3 text-xs sm:grid-cols-3">
          {metricItems.map(([label, value, target]) => (
            <button
              key={label}
              type="button"
              onClick={event => openTarget(event, target)}
              className="relative z-20 rounded-xl p-2 text-left transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              <span className="text-slate-500">{label}</span><br />
              <span className="font-outfit font-semibold tabular-nums text-white">{value}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }, [sleepModel, openTarget]);

  // Optimal bedtime window
  const bedtimeWindow = useMemo(() => {
    const day = data?.day || sleeptimeData?.day;
    if (!day || !sleeptimeData?.optimal_bedtime) return null;
    const window = calendarDates.formatOptimalBedtime(day, sleeptimeData.optimal_bedtime);
    if (!window) return null;
    return (
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="text-xs text-slate-500 uppercase tracking-wider">Optimal Bedtime Window</div>
        <div className="flex gap-4 mt-1">
          <span className="text-sm text-purple-300">{window}</span>
        </div>
      </div>
    );
  }, [sleeptimeData, data]);

  const hasAnySleepData = Boolean(data || sleepModel || sleepDebt || sleeptimeData?.optimal_bedtime);

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
              {keys.map((key) => (
                <SubScoreBar
                  key={key}
                  label={key.replace(/_/g, ' ')}
                  value={contributors?.[key]}
                  onOpen={event => openTarget(event, `metric:${key === 'deep_sleep' ? 'deepSleepContributor' : key === 'rem_sleep' ? 'remSleepContributor' : key === 'total_sleep' ? 'totalSleepContributor' : key === 'efficiency' ? 'efficiencyContributor' : key === 'restfulness' ? 'restfulnessContributor' : key === 'latency' ? 'latencyContributor' : 'timingContributor'}`)}
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
        {sleepRegularity ? (
          <section className="mt-4 border-t border-white/10 pt-4" aria-label="Sleep regularity">
            <button
              type="button"
              onClick={event => openTarget(event, 'regularity')}
              className="relative z-20 block w-full rounded-2xl border border-white/10 bg-slate-950/35 p-4 text-left transition-colors hover:bg-slate-900/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 sm:p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">Sleep Regularity</div>
                  <div className="mt-2 font-outfit text-3xl font-light" style={{ color: sleepRegularity.color }}>
                    {sleepRegularity.status}
                  </div>
                </div>
                <Info className="h-5 w-5 text-slate-400" aria-hidden="true" />
              </div>
            </button>
          </section>
        ) : (
          <UnavailableState title="Sleep regularity unavailable" description="At least five nights with bed and wake times are required." compact />
        )}
        <SleepDebtSection sleepDebt={sleepDebt} onOpen={event => openTarget(event, 'debt')} />
        {bedtimeWindow || (
          <UnavailableState title="Optimal bedtime unavailable" description="No optimal-bedtime data was available for this date." compact />
        )}
      </div>
    </Card>
  );
}
