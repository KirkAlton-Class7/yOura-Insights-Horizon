import { getScoreColor } from '../utils/colors';

export default function SubScoreBar({ label, value }) {
  const v = value !== null && value !== undefined ? Number(value) : null;
  const hasValue = v !== null && Number.isFinite(v);
  const display = hasValue ? v : '--';
  const width = hasValue ? Math.min(Math.max(v, 0), 100) : 0;
  const color = getScoreColor(hasValue ? v : null);

  return (
    <div>
      <div className="flex justify-between text-xs">
        <span className="text-slate-400 capitalize">{label}</span>
        <span className="font-outfit font-semibold tabular-nums" style={{ color }}>{display}</span>
      </div>
      <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden mt-1">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${width}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
