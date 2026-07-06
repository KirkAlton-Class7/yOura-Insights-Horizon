import { calendarDates } from '../utils/dateService';
import { SLEEP_STAGE_COLORS } from '../utils/sleepStageColors';

const STAGE_POSITIONS = Object.freeze({
  1: 28,
  3: 68,
  2: 108,
  4: 148,
});

const STAGE_COLORS = Object.freeze({
  1: SLEEP_STAGE_COLORS.awake,
  3: SLEEP_STAGE_COLORS.rem,
  2: SLEEP_STAGE_COLORS.light,
  4: SLEEP_STAGE_COLORS.deep,
});

export default function SleepStageTimeline({ phases, startTimestamp, endTimestamp }) {
  const width = 900;
  const height = 235;
  const padding = { left: 30, right: 30, top: 18, bottom: 48 };
  const plotWidth = width - padding.left - padding.right;
  const blockWidth = phases.length ? plotWidth / phases.length : 0;
  const timeTicks = calendarDates.getTimeAxisTicks(startTimestamp, endTimestamp);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Sleep stages over the night">
      {Object.values(STAGE_POSITIONS).map(y => (
        <line key={y} x1={padding.left} y1={y + 38} x2={width - padding.right} y2={y + 38} stroke="rgba(148,163,184,0.10)" />
      ))}
      {phases.map((phase, index) => (
        <rect
          key={`${index}-${phase}`}
          x={padding.left + index * blockWidth}
          y={STAGE_POSITIONS[phase]}
          width={Math.max(1, blockWidth + 0.5)}
          height="38"
          fill={STAGE_COLORS[phase]}
          opacity="0.92"
        />
      ))}
      {timeTicks.map(tick => {
        const x = padding.left + tick.position * plotWidth;
        return (
          <text
            key={`${tick.position}-${tick.label}`}
            x={x}
            y={height - 13}
            textAnchor={tick.position === 0 ? 'start' : tick.position === 1 ? 'end' : 'middle'}
            fill="rgba(148,163,184,0.82)"
            fontSize="16"
          >
            {tick.label}
          </text>
        );
      })}
    </svg>
  );
}
