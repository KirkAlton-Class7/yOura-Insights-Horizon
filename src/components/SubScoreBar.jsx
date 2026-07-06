import { getScoreColor } from '../utils/colors';
import { ChevronRight } from 'lucide-react';

export default function SubScoreBar({ label, value, onOpen }) {
  const v = value !== null && value !== undefined ? Number(value) : null;
  const hasValue = v !== null && Number.isFinite(v);
  const display = hasValue ? v : '--';
  const width = hasValue ? Math.min(Math.max(v, 0), 100) : 0;
  const color = getScoreColor(hasValue ? v : null);

  const content = (
    <>
      <div className="flex justify-between text-xs">
        <span className="text-slate-400 capitalize">{label}</span>
        <span className="flex items-center gap-1 font-outfit font-semibold tabular-nums" style={{ color }}>
          {display}
          {onOpen && <ChevronRight className="h-3.5 w-3.5 text-slate-500" />}
        </span>
      </div>
      <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden mt-1">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${width}%`, backgroundColor: color }}
        />
      </div>
    </>
  );

  if (!onOpen) return <div>{content}</div>;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="relative z-20 w-full rounded-xl p-2 text-left transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
      aria-label={`Open ${label} trends`}
    >
      {content}
    </button>
  );
}
