import { CircleSlash2 } from 'lucide-react';

export default function UnavailableState({
  title = 'Data unavailable',
  description = 'No data was available for this date.',
  compact = false,
  className = '',
}) {
  return (
    <div className={`flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] text-left ${
      compact ? 'p-3' : 'p-4'
    } ${className}`}>
      <CircleSlash2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-500" />
      <div>
        <div className="text-sm font-medium text-slate-300">{title}</div>
        <div className="mt-0.5 text-xs text-slate-500">{description}</div>
      </div>
    </div>
  );
}
