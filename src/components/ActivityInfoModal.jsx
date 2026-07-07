import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ExternalLink, X } from 'lucide-react';

const CONTENT = Object.freeze({
  movement: Object.freeze({
    eyebrow: 'Activity Insight',
    title: 'Daily Movement',
    paragraphs: Object.freeze([
      'When five-minute activity classifications are present, this chart groups active movement into four fixed six-hour periods so you can see when movement accumulated during the day.',
      'If the export contains only daily activity totals, the chart shows one daily total instead of estimating when that movement occurred.',
    ]),
  }),
  benefits: Object.freeze({
    eyebrow: 'Activity Insight',
    title: 'Long-term Benefits',
    paragraphs: Object.freeze([
      'Benefit time is estimated only from observed heart-rate samples. Metabolic benefit uses 90–107 bpm, while cardiovascular and metabolic benefit uses readings of 108 bpm or higher, based on the supplied heart-rate zones.',
      'The estimate is intended for trend context, not as a medical measurement. Sparse heart-rate exports may understate time in each zone.',
    ]),
  }),
  zones: Object.freeze({
    eyebrow: 'Activity Insight',
    title: 'Heart Rate Zones',
    paragraphs: Object.freeze([
      'Weekly zone minutes summarize observed heart-rate samples across Zones 0–5 using the supplied age-based ranges.',
      'Sparse heart-rate exports can understate time in a zone, so use these values as trend context rather than a complete workout record.',
    ]),
  }),
});

const LINKS = Object.freeze({
  movement: Object.freeze([
    ['Daily movement', 'https://www.google.com/search?q=daily+movement+health+benefits'],
  ]),
  benefits: Object.freeze([
    ['Metabolic health', 'https://www.google.com/search?q=exercise+metabolic+health+benefits'],
    ['Cardiovascular health', 'https://www.google.com/search?q=exercise+cardiovascular+health+benefits'],
  ]),
  zones: Object.freeze([
    ['Heart rate zones', 'https://www.google.com/search?q=heart+rate+zones'],
  ]),
});

function ActivityInfoContent({ topic, onClose, onBack = onClose }) {
  const content = CONTENT[topic] || CONTENT.movement;
  const links = LINKS[topic] || LINKS.movement;
  useEffect(() => {
    const closeOnEscape = event => {
      if (event.key === 'Escape') {
        event.stopImmediatePropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  return (
    <motion.div className="fixed inset-0 z-[240] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose} data-activity-info-dialog="true">
      <motion.div role="dialog" aria-modal="true" aria-label={content.title} className="w-full max-w-xl rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl sm:p-8" initial={{ opacity: 0, scale: 0.97, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 10 }} onMouseDown={event => event.stopPropagation()}>
        <header className="flex items-start justify-between gap-4">
          <button type="button" onClick={onBack} className="rounded-xl p-2 text-slate-300 hover:bg-white/10 hover:text-white" aria-label="Back to Activity details"><ChevronLeft className="h-6 w-6" /></button>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">{content.eyebrow}</p>
            <h2 className="mt-2 font-outfit text-2xl font-semibold text-slate-100">{content.title}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white" aria-label={`Close ${content.title}`}><X className="h-5 w-5" /></button>
        </header>
        <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/40 p-5">
          <div className="space-y-4 text-sm leading-relaxed text-slate-300">
            {content.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {links.map(([label, href]) => (
              <a key={label} href={href} target="_blank" rel="noreferrer noopener" className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-semibold text-cyan-300 transition-colors hover:border-cyan-300/40">
                {label}<ExternalLink className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ActivityInfoModal(props) {
  if (typeof document === 'undefined') return null;
  return createPortal(<ActivityInfoContent {...props} />, document.body);
}
