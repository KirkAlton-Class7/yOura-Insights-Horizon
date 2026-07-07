import { SLEEP_STAGE_COLORS } from '../utils/sleepStageColors';
import { formatSleepDuration } from '../utils/sleepDetails';

export default function SleepStageBars({ stages, className = '' }) {
  if (!stages?.length) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      {stages.map(stage => (
        <div key={stage.key} className="grid grid-cols-[5rem_1fr_auto] items-center gap-3 text-sm">
          <span className="flex items-center gap-2 text-slate-300">
            <span
              className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
              style={{ backgroundColor: SLEEP_STAGE_COLORS[stage.key] }}
              aria-hidden="true"
            />
            {stage.label}
          </span>
          <div className="h-2 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(100, Math.max(0, stage.percentage))}%`,
                backgroundColor: SLEEP_STAGE_COLORS[stage.key],
              }}
            />
          </div>
          <span className="min-w-[7rem] text-right tabular-nums text-slate-300">
            {formatSleepDuration(stage.seconds)} · {Math.round(stage.percentage)}%
          </span>
        </div>
      ))}
    </div>
  );
}
