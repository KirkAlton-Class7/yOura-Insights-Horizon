import { getScoreColor, getScoreStatus } from '../utils/colors';

export default function ScoreRing({ score, size = 140, scoreFontSize, statusFontSize = 11 }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 13;
  const circ = 2 * Math.PI * r;
  const hasScore = score !== null && score !== undefined && score !== '' && Number.isFinite(Number(score));
  const fill = hasScore ? Math.min(100, Math.max(0, Number(score))) / 100 : 0;
  const offset = circ * (1 - fill);
  const display = hasScore ? score : '--';
  const color = getScoreColor(hasScore ? score : null);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10"/>
      <circle
        cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={circ.toFixed(2)}
        strokeDashoffset={offset.toFixed(2)}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(.23,1,.32,1)' }}
      />
      <text x={cx} y={cy - 6} textAnchor="middle" fill="white"
        fontSize={scoreFontSize || (display === '--' ? 22 : 30)} fontWeight="800" fontFamily="Outfit, ui-sans-serif, system-ui, sans-serif"
        style={{ fontVariantNumeric: 'tabular-nums' }} dominantBaseline="auto">
        {display}
      </text>
      <text x={cx} y={cy + 16} textAnchor="middle" fill="rgba(255,255,255,0.45)"
        fontSize={statusFontSize} fontFamily="DM Sans, ui-sans-serif, system-ui, sans-serif" dominantBaseline="auto">
        {getScoreStatus(hasScore ? score : null)}
      </text>
    </svg>
  );
}
