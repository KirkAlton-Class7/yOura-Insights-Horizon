import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ExternalLink, X } from 'lucide-react';

const CONTENT = Object.freeze({
  oxygen: Object.freeze({
    eyebrow: 'Sleep Insight',
    title: 'Average Oxygen Saturation',
    paragraphs: Object.freeze([
      'This represents your average blood-oxygen level during last night’s sleep.',
      'Congestion, allergies, room conditions, sleep position, and overall health can all influence an overnight reading.',
      'Values from 95–100% are generally considered typical for many adults, but the long-term pattern is more useful than one isolated night. This information is not a diagnosis.',
    ]),
    links: Object.freeze([
      ['Sleep ergonomics', 'https://www.google.com/search?q=sleep+ergonomics'],
      ['Sleeping environment', 'https://www.google.com/search?q=healthy+sleeping+environment'],
    ]),
  }),
  breathing: Object.freeze({
    eyebrow: 'Sleep Insight',
    title: 'Nighttime Breathing',
    paragraphs: Object.freeze([
      'Nighttime breathing reflects how steady your breathing appeared across the night based on the disturbance index included in the export.',
      'Congestion, allergies, alcohol, sleep position, and the room environment can influence breathing consistency. Focus on a repeated pattern rather than one night.',
    ]),
    links: Object.freeze([
      ['Steady sleep breathing', 'https://www.google.com/search?q=support+steady+breathing+during+sleep'],
      ['Sleeping environment', 'https://www.google.com/search?q=healthy+sleeping+environment'],
    ]),
  }),
  debt: Object.freeze({
    eyebrow: 'Sleep Guidance',
    title: 'About Sleep Debt',
    paragraphs: Object.freeze([
      'Sleep debt estimates how much recent sleep has fallen short of your personal sleep need. It is most useful as a trend rather than a precise clinical measurement.',
      'This dashboard estimates debt from the sleep history available in your export. Additional guidance and source links can be added here later.',
    ]),
    links: Object.freeze([
      ['Understanding sleep debt', 'https://www.google.com/search?q=understanding+sleep+debt'],
    ]),
  }),
  need: Object.freeze({
    eyebrow: 'Sleep Guidance',
    title: 'About Sleep Need',
    paragraphs: Object.freeze([
      'Sleep need is the estimated amount of sleep your body requires to recover. It can change with activity, recent sleep, illness, stress, and individual physiology.',
      'Because the export does not include Oura’s proprietary sleep-need value, this dashboard estimates it from your recent sleep history.',
    ]),
    links: Object.freeze([
      ['Understanding sleep need', 'https://www.google.com/search?q=understanding+personal+sleep+need'],
    ]),
  }),
  regularity: Object.freeze({
    eyebrow: 'Sleep Guidance',
    title: 'About Sleep Regularity',
    paragraphs: Object.freeze([
      'Sleep regularity reflects how consistent your bedtime and wake time have been across recent nights.',
      'A steadier schedule can support sleep quality and recovery. Occasional variation is normal, so focus on the longer pattern instead of one night.',
    ]),
    links: Object.freeze([
      ['Sleep schedule consistency', 'https://www.google.com/search?q=sleep+schedule+consistency'],
    ]),
  }),
});

function SleepInfoContent({ topic, onClose }) {
  const content = CONTENT[topic] || CONTENT.debt;
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
    <motion.div
      className="fixed inset-0 z-[240] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      data-sleep-info-dialog="true"
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={content.title}
        className="w-full max-w-xl rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl sm:p-8"
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 10 }}
        onMouseDown={event => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4">
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-300 hover:bg-white/10 hover:text-white" aria-label="Back to Sleep details"><ChevronLeft className="h-6 w-6" /></button>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">{content.eyebrow}</p>
            <h2 className="mt-2 font-outfit text-2xl font-semibold text-slate-100">{content.title}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white" aria-label={`Close ${content.title}`}>
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/40 p-5">
          <div className="space-y-4 text-sm leading-relaxed text-slate-300">
            {content.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {content.links.map(([label, href]) => (
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

export default function SleepInfoModal(props) {
  if (typeof document === 'undefined') return null;
  return createPortal(<SleepInfoContent {...props} />, document.body);
}
