import { motion } from 'framer-motion';
import { Camera, Image, ImageOff, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Header({ 
  dateString, 
  onCopySnapshot, 
  backgroundMode, 
  onToggleBackground,
  onPrevImage,
  onNextImage,
}) {
  const isImageMode = backgroundMode === 'image';

  return (
    <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 100 }}
      className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/95 shadow-md overflow-x-hidden"
    >
      <div className="relative">
        <motion.div
          className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 26, ease: 'linear' }}
        />

        <div className="flex items-center justify-between px-4 py-3 lg:px-6 lg:py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <svg width="22" height="22" viewBox="0 0 80 80" fill="none">
                <circle cx="40" cy="40" r="36" stroke="rgba(6,182,212,0.25)" stroke-width="9"/>
                <circle cx="40" cy="40" r="36" stroke="#06b6d4" stroke-width="9"
                        stroke-dasharray="226" stroke-dashoffset="56" stroke-linecap="round"
                        transform="rotate(-90 40 40)"/>
              </svg>
              <span className="font-outfit font-bold text-sm uppercase tracking-wider">
                Oura <span className="text-cyan-400">Insights</span>
              </span>
            </div>
            {dateString && (
              <span className="hidden md:inline text-sm text-slate-400 ml-2">
                {dateString}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Image Navigation Arrows */}
            <div className="flex items-center gap-1">
              <button
                onClick={onPrevImage}
                disabled={!isImageMode}
                className={`p-1.5 rounded-full transition-all ${
                  isImageMode
                    ? 'hover:bg-white/10 text-slate-300'
                    : 'text-slate-600 cursor-not-allowed opacity-50'
                }`}
                title="Previous image"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={onNextImage}
                disabled={!isImageMode}
                className={`p-1.5 rounded-full transition-all ${
                  isImageMode
                    ? 'hover:bg-white/10 text-slate-300'
                    : 'text-slate-600 cursor-not-allowed opacity-50'
                }`}
                title="Next image"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Toggle Background Button */}
            <button
              onClick={onToggleBackground}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/20 bg-white/5 text-slate-300 hover:border-white/40 hover:text-cyan-300 transition-all text-xs font-outfit font-medium tabular-nums"
              title={backgroundMode === 'particles' ? 'Show background image' : 'Show particles'}
            >
              {backgroundMode === 'particles' ? (
                <Image className="w-4 h-4" />
              ) : (
                <ImageOff className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">
                {backgroundMode === 'particles' ? 'Image' : 'Particles'}
              </span>
            </button>

            {/* Copy Snapshot Button */}
            <button
              onClick={onCopySnapshot}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/20 bg-white/5 text-slate-300 hover:border-white/40 hover:text-cyan-300 transition-all text-xs font-outfit font-medium tabular-nums"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Copy Snapshot</span>
            </button>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
