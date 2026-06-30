import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const navigationClass = 'flex-shrink-0 w-12 rounded-xl border border-white/10 bg-slate-800/60 backdrop-blur-sm text-slate-300 transition-all hover:border-white/30 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-white/10 disabled:hover:text-slate-300';

export default function DateNav({ dates, selectedDate, onSelect, onPrevious, onNext, canPrevious, canNext }) {
  return (
    <div className="flex items-stretch gap-2 pb-2 pt-2">
      <motion.button
        type="button"
        onClick={onPrevious}
        disabled={!canPrevious}
        className={navigationClass}
        whileHover={canPrevious ? { y: -1 } : undefined}
        whileTap={canPrevious ? { scale: 0.96 } : undefined}
        aria-label="Previous week"
        title="Previous week"
      >
        <ChevronLeft className="mx-auto h-5 w-5" />
      </motion.button>

      <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto scrollbar-hide">
        {dates.map((d) => {
          const dt = new Date(d + 'T12:00:00');
          const dow = dt.toLocaleDateString('en-US', { weekday: 'short' });
          const day = dt.getDate();
          const isActive = d === selectedDate;

          return (
            <motion.button
              key={d}
              onClick={() => onSelect(d)}
              className={`flex flex-shrink-0 flex-col items-center gap-1 rounded-xl border px-4 py-2 transition-all ${
                isActive
                  ? 'border-cyan-400 bg-cyan-400/20 text-cyan-300 backdrop-blur-sm'
                  : 'border-white/10 bg-slate-800/60 backdrop-blur-sm text-slate-300 hover:border-white/30 hover:text-slate-200'
              }`}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.96 }}
            >
              <span className="text-xs font-medium uppercase tracking-wider">{dow}</span>
              <span className="text-lg font-outfit font-bold tabular-nums">{day}</span>
            </motion.button>
          );
        })}
      </div>

      <motion.button
        type="button"
        onClick={onNext}
        disabled={!canNext}
        className={navigationClass}
        whileHover={canNext ? { y: -1 } : undefined}
        whileTap={canNext ? { scale: 0.96 } : undefined}
        aria-label="Next week"
        title="Next week"
      >
        <ChevronRight className="mx-auto h-5 w-5" />
      </motion.button>
    </div>
  );
}
