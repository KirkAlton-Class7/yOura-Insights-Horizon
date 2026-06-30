import { motion } from 'framer-motion';

export default function DateNav({ dates, selectedDate, onSelect }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 pt-2 scrollbar-hide">
      {dates.map((d) => {
        const dt = new Date(d + 'T12:00:00');
        const dow = dt.toLocaleDateString('en-US', { weekday: 'short' });
        const day = dt.getDate();
        const isActive = d === selectedDate;

        return (
          <motion.button
            key={d}
            onClick={() => onSelect(d)}
            className={`flex-shrink-0 flex flex-col items-center gap-1 px-4 py-2 rounded-xl border transition-all ${
              isActive
                ? 'border-cyan-400 bg-cyan-400/20 text-cyan-300 backdrop-blur-sm'
                : 'border-white/10 bg-slate-800/60 backdrop-blur-sm text-slate-300 hover:border-white/30 hover:text-slate-200'
            }`}
            whileHover={{ y: -1 }}   // reduced from -2 to -1
            whileTap={{ scale: 0.96 }}
          >
            <span className="text-xs font-medium uppercase tracking-wider">{dow}</span>
            <span className="text-lg font-outfit font-bold">{day}</span>
          </motion.button>
        );
      })}
    </div>
  );
}