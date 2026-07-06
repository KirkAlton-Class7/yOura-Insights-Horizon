import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import CalendarPicker from './CalendarPicker';
import { calendarDates } from '../utils/dateService';

const controlClass = 'flex-shrink-0 w-12 rounded-xl border border-white/10 bg-slate-800/60 backdrop-blur-sm text-slate-300 transition-all hover:border-white/30 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-white/10 disabled:hover:text-slate-300';

export default function DateNav({
  dates,
  availableDates,
  selectedDate,
  onSelect,
  onPrevious,
  onNext,
  canPrevious,
  canNext,
  calendarScope = 'viewport',
}) {
  const availableDateSet = useMemo(() => new Set(availableDates), [availableDates]);

  return (
    <div className="overflow-x-auto pb-2 pt-2 scrollbar-hide">
      <div className="flex min-w-[46rem] items-stretch gap-2">
        <motion.button
          type="button"
          onClick={onPrevious}
          disabled={!canPrevious}
          className={controlClass}
          whileHover={canPrevious ? { y: -1 } : undefined}
          whileTap={canPrevious ? { scale: 0.96 } : undefined}
          aria-label="Previous week"
          title="Previous week"
        >
          <ChevronLeft className="mx-auto h-5 w-5" />
        </motion.button>

        <div className="grid min-w-0 flex-1 grid-cols-7 gap-2">
          {dates.map(date => {
            const presentation = calendarDates.getDatePresentation(date);
            const isAvailable = availableDateSet.has(date);
            const isActive = isAvailable && date === selectedDate;

            return (
              <motion.button
                key={date}
                type="button"
                disabled={!isAvailable}
                onClick={() => onSelect(date)}
                className={`flex min-w-0 flex-col items-center gap-1 rounded-xl border px-2 py-2 transition-all ${
                  isActive
                    ? 'border-cyan-400 bg-cyan-400/20 text-cyan-300 backdrop-blur-sm'
                    : isAvailable
                      ? 'border-white/10 bg-slate-800/60 text-slate-300 backdrop-blur-sm hover:border-white/30 hover:text-slate-200'
                      : 'cursor-not-allowed border-white/5 bg-slate-800/30 text-slate-600 opacity-40'
                }`}
                whileHover={isAvailable ? { y: -1 } : undefined}
                whileTap={isAvailable ? { scale: 0.96 } : undefined}
                aria-label={`${presentation.weekdayLong}, ${date}${isAvailable ? '' : ', no data'}`}
              >
                <span className="text-xs font-medium uppercase tracking-wider">
                  {presentation.weekdayShort}
                </span>
                <span className="text-lg font-outfit font-bold tabular-nums">{presentation.dayOfMonth}</span>
              </motion.button>
            );
          })}
        </div>

        <motion.button
          type="button"
          onClick={onNext}
          disabled={!canNext}
          className={controlClass}
          whileHover={canNext ? { y: -1 } : undefined}
          whileTap={canNext ? { scale: 0.96 } : undefined}
          aria-label="Next week"
          title="Next week"
        >
          <ChevronRight className="mx-auto h-5 w-5" />
        </motion.button>

        <CalendarPicker
          availableDates={availableDates}
          selectedDate={selectedDate}
          onSelect={onSelect}
          calendarScope={calendarScope}
          buttonClassName={controlClass}
        />
      </div>
    </div>
  );
}
