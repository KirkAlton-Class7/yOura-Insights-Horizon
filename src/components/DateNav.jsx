import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

const DAY_MS = 86400000;
const controlClass = 'flex-shrink-0 w-12 rounded-xl border border-white/10 bg-slate-800/60 backdrop-blur-sm text-slate-300 transition-all hover:border-white/30 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-white/10 disabled:hover:text-slate-300';
const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const toDateKey = (year, month, day) => (
  `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
);

const getMonthValue = (date) => {
  const [year, month] = date.split('-').map(Number);
  return new Date(year, month - 1, 1);
};

const getMonthCells = (year, month) => {
  const firstDay = Date.UTC(year, month, 1);
  const gridStart = firstDay - new Date(firstDay).getUTCDay() * DAY_MS;
  return Array.from({ length: 42 }, (_, index) => (
    new Date(gridStart + index * DAY_MS).toISOString().slice(0, 10)
  ));
};

function CalendarDate({
  date,
  month,
  availableDateSet,
  selectedDate,
  todayDate,
  onSelect,
  compact = false,
  hideOutside = false,
}) {
  const [, monthNumber, dayNumber] = date.split('-').map(Number);
  const isOutside = monthNumber - 1 !== month;
  if (hideOutside && isOutside) return <span aria-hidden="true" />;

  const isAvailable = availableDateSet.has(date);
  const isSelected = date === selectedDate;
  const isToday = date === todayDate;

  return (
    <button
      type="button"
      disabled={!isAvailable}
      onClick={() => onSelect(date)}
      className={`relative flex aspect-square items-center justify-center rounded-lg tabular-nums transition-colors ${
        compact ? 'text-[11px]' : 'text-sm sm:text-base'
      } ${
        isSelected
          ? 'bg-cyan-400 font-semibold text-slate-950 shadow-sm shadow-cyan-400/30'
          : isAvailable
            ? `${isOutside ? 'text-slate-400' : 'text-slate-200'} hover:bg-white/10`
            : 'cursor-not-allowed text-slate-600 opacity-40'
      } ${isToday && !isSelected ? 'ring-1 ring-inset ring-cyan-400/80 text-cyan-300' : ''}`}
      aria-label={date}
      aria-current={isSelected ? 'date' : undefined}
    >
      {dayNumber}
    </button>
  );
}

export default function DateNav({
  dates,
  availableDates,
  selectedDate,
  onSelect,
  onPrevious,
  onNext,
  canPrevious,
  canNext,
}) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarView, setCalendarView] = useState('month');
  const [visibleMonth, setVisibleMonth] = useState(() => getMonthValue(selectedDate));
  const availableDateSet = useMemo(() => new Set(availableDates), [availableDates]);
  const todayDate = useMemo(() => {
    const today = new Date();
    return toDateKey(today.getFullYear(), today.getMonth(), today.getDate());
  }, []);

  useEffect(() => {
    if (!isCalendarOpen) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsCalendarOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isCalendarOpen]);

  const visibleYear = visibleMonth.getFullYear();
  const visibleMonthIndex = visibleMonth.getMonth();
  const monthCells = useMemo(
    () => getMonthCells(visibleYear, visibleMonthIndex),
    [visibleYear, visibleMonthIndex],
  );

  const openCalendar = () => {
    setVisibleMonth(getMonthValue(selectedDate));
    setCalendarView('month');
    setIsCalendarOpen(true);
  };

  const selectCalendarDate = (date) => {
    onSelect(date);
    setIsCalendarOpen(false);
  };

  const showToday = () => {
    setVisibleMonth(getMonthValue(todayDate));
    setCalendarView('month');
    if (availableDateSet.has(todayDate)) selectCalendarDate(todayDate);
  };

  const shiftCalendar = (offset) => {
    setVisibleMonth(current => (
      calendarView === 'month'
        ? new Date(current.getFullYear(), current.getMonth() + offset, 1)
        : new Date(current.getFullYear() + offset, current.getMonth(), 1)
    ));
  };

  return (
    <>
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
            {dates.map((date) => {
              const value = new Date(`${date}T12:00:00`);
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
                  aria-label={`${value.toLocaleDateString('en-US', { weekday: 'long' })}, ${date}${isAvailable ? '' : ', no data'}`}
                >
                  <span className="text-xs font-medium uppercase tracking-wider">
                    {value.toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                  <span className="text-lg font-outfit font-bold tabular-nums">{value.getDate()}</span>
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

          <motion.button
            type="button"
            onClick={openCalendar}
            className={controlClass}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.96 }}
            aria-label="Open calendar"
            title="Open calendar"
          >
            <Calendar className="mx-auto h-5 w-5" />
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {isCalendarOpen && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={() => setIsCalendarOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Choose an available date"
              className={`max-h-[90vh] w-full overflow-y-auto rounded-3xl border border-white/10 bg-slate-900/95 shadow-2xl shadow-black/50 ${
                calendarView === 'month' ? 'max-w-3xl' : 'max-w-6xl'
              }`}
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 12 }}
              transition={{ duration: 0.18 }}
              onMouseDown={event => event.stopPropagation()}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-slate-900/95 px-5 py-4 backdrop-blur-xl sm:px-7">
                <div className="flex rounded-xl border border-white/10 bg-slate-950/40 p-1">
                  {['month', 'year'].map(view => (
                    <button
                      key={view}
                      type="button"
                      onClick={() => setCalendarView(view)}
                      className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors ${
                        calendarView === view
                          ? 'bg-slate-700 text-slate-100'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {view}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setIsCalendarOpen(false)}
                  className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-100"
                  aria-label="Close calendar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-5 sm:p-7">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="font-outfit text-3xl font-semibold text-slate-100 sm:text-4xl">
                    {calendarView === 'month'
                      ? visibleMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                      : visibleYear}
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => shiftCalendar(-1)}
                      className="rounded-full bg-slate-800 p-2.5 text-slate-300 transition-colors hover:bg-slate-700 hover:text-slate-100"
                      aria-label={calendarView === 'month' ? 'Previous month' : 'Previous year'}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={showToday}
                      className="rounded-full bg-slate-800 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-700"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => shiftCalendar(1)}
                      className="rounded-full bg-slate-800 p-2.5 text-slate-300 transition-colors hover:bg-slate-700 hover:text-slate-100"
                      aria-label={calendarView === 'month' ? 'Next month' : 'Next year'}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {calendarView === 'month' ? (
                  <div>
                    <div className="grid grid-cols-7 border-b border-white/10 pb-3 text-center">
                      {dayNames.map(day => (
                        <span key={day} className="text-xs font-medium uppercase tracking-wider text-slate-400 sm:text-sm">
                          {day}
                        </span>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1 pt-3 sm:gap-2">
                      {monthCells.map(date => (
                        <CalendarDate
                          key={date}
                          date={date}
                          month={visibleMonthIndex}
                          availableDateSet={availableDateSet}
                          selectedDate={selectedDate}
                          todayDate={todayDate}
                          onSelect={selectCalendarDate}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 12 }, (_, month) => (
                      <section key={month} className="rounded-2xl border border-white/10 bg-slate-950/25 p-3">
                        <h3 className="mb-3 text-center font-outfit font-semibold text-slate-200">
                          {new Date(visibleYear, month, 1).toLocaleDateString('en-US', { month: 'long' })}
                        </h3>
                        <div className="grid grid-cols-7 gap-1 text-center">
                          {dayNames.map(day => (
                            <span key={day} className="pb-1 text-[9px] font-medium uppercase text-slate-500">
                              {day.slice(0, 1)}
                            </span>
                          ))}
                          {getMonthCells(visibleYear, month).map(date => (
                            <CalendarDate
                              key={date}
                              date={date}
                              month={month}
                              availableDateSet={availableDateSet}
                              selectedDate={selectedDate}
                              todayDate={todayDate}
                              onSelect={selectCalendarDate}
                              compact
                              hideOutside
                            />
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
