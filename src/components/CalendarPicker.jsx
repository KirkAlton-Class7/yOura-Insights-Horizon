import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { calendarDates } from '../utils/dateService';

const dayNames = calendarDates.weekdayNames('short');

function CalendarDate({
  date,
  monthKey,
  availableDateSet,
  selectedDate,
  todayDate,
  onSelect,
  compact = false,
  hideOutside = false,
}) {
  const presentation = calendarDates.getDatePresentation(date);
  const isOutside = !calendarDates.isDateInMonth(date, monthKey);
  if (hideOutside && isOutside) return <span aria-hidden="true" />;

  const isAvailable = availableDateSet.has(date);
  const isSelected = isAvailable && date === selectedDate;
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
            : 'cursor-not-allowed bg-slate-800/20 text-slate-500 opacity-65'
      } ${isToday && isAvailable && !isSelected ? 'ring-1 ring-inset ring-cyan-400/80 text-cyan-300' : ''}`}
      aria-label={`${date}${isAvailable ? '' : ', no data'}`}
      aria-disabled={!isAvailable}
      aria-current={isSelected ? 'date' : undefined}
    >
      {presentation.dayOfMonth}
    </button>
  );
}

function CalendarLayer({ scope, children }) {
  if (scope !== 'panel' && typeof document !== 'undefined') {
    return createPortal(children, document.body);
  }
  return children;
}

export default function CalendarPicker({
  availableDates,
  selectedDate,
  onSelect,
  calendarScope = 'viewport',
  buttonClassName,
  buttonLabel = 'Open calendar',
}) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarView, setCalendarView] = useState('month');
  const [visibleMonth, setVisibleMonth] = useState(() => calendarDates.toYearMonth(selectedDate));
  const availableDateSet = useMemo(() => new Set(availableDates || []), [availableDates]);
  const todayDate = useMemo(() => calendarDates.today(), []);

  useEffect(() => {
    if (!isCalendarOpen) return undefined;
    const closeOnEscape = event => {
      if (event.key === 'Escape') {
        event.stopImmediatePropagation();
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isCalendarOpen]);

  const visibleMonthPresentation = calendarDates.getYearMonthPresentation(visibleMonth);
  const visibleYear = visibleMonthPresentation.year;
  const monthCells = useMemo(
    () => calendarDates.getMonthCells(visibleMonth),
    [visibleMonth],
  );

  const openCalendar = () => {
    setVisibleMonth(calendarDates.toYearMonth(selectedDate));
    setCalendarView('month');
    setIsCalendarOpen(true);
  };

  const selectCalendarDate = date => {
    onSelect(date);
    setIsCalendarOpen(false);
  };

  const showToday = () => {
    setVisibleMonth(calendarDates.toYearMonth(todayDate));
    setCalendarView('month');
    if (availableDateSet.has(todayDate)) selectCalendarDate(todayDate);
  };

  const shiftCalendar = offset => {
    setVisibleMonth(current => (
      calendarView === 'month'
        ? calendarDates.addMonths(current, offset)
        : calendarDates.addYears(current, offset)
    ));
  };

  const layerClass = calendarScope === 'panel'
    ? 'absolute z-50 items-center rounded-3xl bg-slate-950/75 p-4 backdrop-blur-sm'
    : `${calendarScope === 'nested' ? 'z-[240]' : 'z-[100]'} fixed items-start overflow-y-auto bg-slate-950/75 p-4 backdrop-blur-sm`;

  return (
    <>
      <motion.button
        type="button"
        onClick={openCalendar}
        className={buttonClassName}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.96 }}
        aria-label={buttonLabel}
        title={buttonLabel}
      >
        <Calendar className="mx-auto h-5 w-5" />
      </motion.button>

      <CalendarLayer scope={calendarScope}>
        <AnimatePresence>
          {isCalendarOpen && (
            <motion.div
              className={`${layerClass} inset-0 flex justify-center`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              data-calendar-dialog="true"
            >
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-label="Choose an available date"
                className={`${calendarScope === 'panel' ? 'h-[calc(100%-2rem)] max-h-[calc(100%-2rem)] rounded-3xl bg-slate-900/95' : 'my-auto max-h-[calc(100vh-2rem)] rounded-3xl bg-slate-900/95'} w-full overflow-y-auto border border-white/10 shadow-2xl shadow-black/50 ${
                  calendarScope === 'panel'
                    ? calendarView === 'month' ? 'max-w-2xl' : 'max-w-5xl'
                    : calendarView === 'month' ? 'max-w-3xl' : 'max-w-6xl'
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
                        ? calendarDates.formatMonthYear(visibleMonth)
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
                            monthKey={visibleMonth}
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
                      {calendarDates.getYearMonths(visibleYear).map(monthKey => (
                        <section key={monthKey} className="rounded-2xl border border-white/10 bg-slate-950/25 p-3">
                          <h3 className="mb-3 text-center font-outfit font-semibold text-slate-200">
                            {calendarDates.getYearMonthPresentation(monthKey).monthName}
                          </h3>
                          <div className="grid grid-cols-7 gap-1 text-center">
                            {dayNames.map(day => (
                              <span key={day} className="pb-1 text-[9px] font-medium uppercase text-slate-500">
                                {day.slice(0, 1)}
                              </span>
                            ))}
                            {calendarDates.getMonthCells(monthKey).map(date => (
                              <CalendarDate
                                key={date}
                                date={date}
                                monthKey={monthKey}
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
      </CalendarLayer>
    </>
  );
}
