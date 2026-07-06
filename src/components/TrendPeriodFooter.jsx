import { formatTrendPeriod } from '../utils/trendPeriod';

export default function TrendPeriodFooter({ kind, startDate, endDate, summary }) {
  return (
    <footer className="flex flex-col gap-2 border-t border-white/10 pt-4 text-sm font-semibold text-slate-300 sm:flex-row sm:items-center sm:justify-between">
      <span>{formatTrendPeriod(kind, startDate, endDate)}</span>
      {summary ? <span>{summary}</span> : null}
    </footer>
  );
}
