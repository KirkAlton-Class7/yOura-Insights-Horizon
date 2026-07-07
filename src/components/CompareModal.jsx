import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import ComparePanel from './ComparePanel';

export default function CompareModal({ appData, availableDates, initialDate, onClose }) {
  useEffect(() => {
    const closeOnEscape = (event) => {
      if (
        event.key === 'Escape'
        && !document.querySelector('[data-calendar-dialog="true"]')
        && !document.querySelector('[data-compare-contributors-dialog="true"]')
        && !document.querySelector('[data-metric-drilldown="true"]')
      ) onClose();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  const initialIndex = Math.max(0, availableDates.indexOf(initialDate));
  const secondDate = availableDates[Math.max(0, initialIndex - 1)] || initialDate;

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-sm sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Compare dashboard dates"
        className="flex h-[94vh] w-full max-w-7xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-950/95 shadow-2xl shadow-black/60"
        initial={{ opacity: 0, scale: 0.98, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 12 }}
        transition={{ duration: 0.18 }}
        onMouseDown={event => event.stopPropagation()}
      >
        <header className="z-30 flex flex-shrink-0 items-center justify-between border-b border-white/10 bg-slate-950 px-5 py-4 backdrop-blur-xl sm:px-7">
          <div>
            <h2 className="font-outfit text-xl font-semibold text-slate-100">Compare</h2>
            <p className="text-xs text-slate-500">Readiness, Sleep, and Activity</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-100"
            aria-label="Close compare mode"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-hidden">
          <ComparePanel
            appData={appData}
            availableDates={availableDates}
            initialDate={initialDate}
          />
        </div>

        <div className="mx-5 flex-shrink-0 border-t border-white/15 sm:mx-7" />

        <div className="min-h-0 flex-1 overflow-hidden">
          <ComparePanel
            appData={appData}
            availableDates={availableDates}
            initialDate={secondDate}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
