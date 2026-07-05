import { motion, AnimatePresence } from 'framer-motion';
import { CircleAlert, CheckCircle, TriangleAlert } from 'lucide-react';
import { useEffect } from 'react';

export default function Toast({ title, message, type = 'success', isVisible, onClose }) {
  const isError = type === 'error';
  const isWarning = type === 'warning';
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, isWarning ? 6000 : 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, isWarning, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-[9999]"
        >
          <div className={`flex max-w-[min(42rem,calc(100vw-2rem))] items-start gap-3 rounded-xl border bg-slate-800/95 px-6 py-3 shadow-2xl backdrop-blur-md ${
            isError ? 'border-rose-400/40' : isWarning ? 'border-amber-400/40' : 'border-cyan-400/30'
          }`}>
            {isError
              ? <CircleAlert className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-400" />
              : isWarning
                ? <TriangleAlert className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" />
                : <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400" />}
            <div>
              {title && <div className="text-sm font-semibold text-slate-100">{title}</div>}
              <div className="text-sm text-slate-200">{message}</div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
