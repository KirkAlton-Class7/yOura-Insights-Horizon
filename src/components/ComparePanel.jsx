import DateNav from './DateNav';
import ScoreSummaryGrid from './ScoreSummaryGrid';
import { useDateNavigation } from '../hooks/useDateNavigation';

export default function ComparePanel({ appData, availableDates, initialDate }) {
  const {
    selectedDate,
    setSelectedDate,
    weekDates,
    dateWindow,
    changeWeek,
    canPrevious,
    canNext,
  } = useDateNavigation(availableDates, initialDate);

  return (
    <section className="relative isolate space-y-5 p-5 sm:p-7">
      <div className="flex items-center">
        <span className="font-outfit text-sm font-semibold tabular-nums text-slate-200">
          {selectedDate}
        </span>
      </div>

      <DateNav
        dates={weekDates}
        availableDates={availableDates}
        selectedDate={selectedDate}
        onSelect={setSelectedDate}
        onPrevious={() => changeWeek(-1)}
        onNext={() => changeWeek(1)}
        canPrevious={canPrevious}
        canNext={canNext}
        calendarScope="panel"
      />

      <ScoreSummaryGrid
        appData={appData}
        selectedDate={selectedDate}
        dateWindow={dateWindow}
        onSelectDate={setSelectedDate}
      />
    </section>
  );
}
