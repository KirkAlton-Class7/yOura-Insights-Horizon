import { AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import DateNav from './DateNav';
import CompareContributorsModal from './CompareContributorsModal';
import ScoreSummaryGrid from './ScoreSummaryGrid';
import { useDateNavigation } from '../hooks/useDateNavigation';

export default function ComparePanel({ appData, availableDates, initialDate }) {
  const [contributorsCategory, setContributorsCategory] = useState(null);
  const [panelElement, setPanelElement] = useState(null);
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
    <section ref={setPanelElement} className="relative isolate flex h-full min-h-0 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 sm:p-7">
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
          calendarPortalElement={panelElement}
        />

        <ScoreSummaryGrid
          appData={appData}
          selectedDate={selectedDate}
          dateWindow={dateWindow}
          onSelectDate={setSelectedDate}
          onOpenReadiness={() => setContributorsCategory('readiness')}
          onOpenSleep={() => setContributorsCategory('sleep')}
          onOpenActivity={() => setContributorsCategory('activity')}
        />
      </div>
      <AnimatePresence>
        {contributorsCategory && (
          <CompareContributorsModal
            appData={appData}
            category={contributorsCategory}
            selectedDate={selectedDate}
            onClose={() => setContributorsCategory(null)}
            constrained
            portalElement={panelElement}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
