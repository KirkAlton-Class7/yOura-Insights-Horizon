import { motion } from 'framer-motion';
import { Camera } from 'lucide-react';
import ScoreRing from './ScoreRing';
import { writeClipboardText } from '../utils/clipboard';
import { useToast } from '../context/toast';

export default function ScoreCard({ label, data, trendBars, weeklyScores }) {
  const { showToast } = useToast();
  const score = data?.score ?? null;
  const hasScore = score !== null && score !== undefined && score !== '' && Number.isFinite(Number(score));
  const snapshotTitle = `${label} weekly scores`;
  const snapshotText = [
    snapshotTitle,
    '='.repeat(snapshotTitle.length),
    ...weeklyScores.map(({ date, score: weeklyScore }) => `${date}: ${weeklyScore ?? '--'}`),
  ].join('\n');

  const handleCopyScores = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      await writeClipboardText(snapshotText);
      showToast(`${label} weekly scores copied to clipboard.`);
    } catch (error) {
      console.error(`Failed to copy ${label} weekly scores:`, error);
      showToast(`Failed to copy ${label} weekly scores.`);
    }
  };

  return (
    <motion.div
      className="group glass p-6 flex flex-col items-center gap-4 relative overflow-hidden"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500/0 via-cyan-500/50 to-purple-600/0 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="w-full flex justify-between items-center">
        <span className="text-xs font-outfit font-semibold uppercase tracking-wider text-slate-300">
          {label}
        </span>
        <button
          type="button"
          onClick={handleCopyScores}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-slate-950/80 text-slate-400 opacity-0 shadow-lg backdrop-blur-sm transition-all hover:border-cyan-300/50 hover:text-cyan-200 group-hover:opacity-100 focus-visible:opacity-100"
          title={`Copy ${label} weekly scores`}
          aria-label={`Copy ${label} weekly scores`}
        >
          <Camera className="h-3.5 w-3.5" />
        </button>
      </div>
      <ScoreRing score={score} size={130} />
      {!hasScore && (
        <p className="-mt-2 text-center text-xs text-slate-500">No {label.toLowerCase()} score available for this date</p>
      )}
      <div className="flex items-end gap-1 w-full h-8">
        {trendBars}
      </div>
    </motion.div>
  );
}
