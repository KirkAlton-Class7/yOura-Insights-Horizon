import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  Menu,
  X,
  Gauge,
  BatteryCharging,
  Moon,
  Footprints,
  Shield,
  HeartPulse,
  Fingerprint,
} from 'lucide-react';

const navItems = [
  { id: 'scores', label: 'Scores', icon: Gauge },
  { id: 'readiness', label: 'Readiness', icon: BatteryCharging },
  { id: 'sleep', label: 'Sleep', icon: Moon },
  { id: 'activity', label: 'Activity', icon: Footprints },
  { id: 'stress-resilience', label: 'Stress & Resilience', icon: Shield },
  { id: 'cardio', label: 'Cardiovascular', icon: HeartPulse },
  { id: 'biometrics', label: 'Biometrics', icon: Fingerprint },
];

// Extracted sub‑components
function DesktopSidebar({ activeSection, onScrollTo }) {
  return (
    <aside className="fixed top-0 left-0 h-full w-20 bg-gradient-to-b from-slate-900/95 to-slate-950/95 border-r border-white/10 shadow-xl z-30 overflow-y-auto hidden xl:block">
      <div className="flex flex-col h-full">
        <div className="p-3.5 border-b border-white/10 flex justify-center">
          <div className="relative">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-r from-cyan-500/20 to-purple-600/20 rounded-full blur-2xl"></div>
            <svg width="22" height="22" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="36" stroke="rgba(6,182,212,0.25)" stroke-width="9"/>
              <circle cx="40" cy="40" r="36" stroke="#06b6d4" stroke-width="9"
                      stroke-dasharray="226" stroke-dashoffset="56" stroke-linecap="round"
                      transform="rotate(-90 40 40)"/>
            </svg>
          </div>
        </div>
        <nav className="flex-1 px-3 py-6">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <motion.li key={item.id}>
                  <button
                    onClick={() => onScrollTo(item.id)}
                    title={item.label}
                    className={`w-full flex items-center justify-center rounded-xl transition-all duration-300 group py-3 ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500/20 to-purple-600/20 border border-cyan-500/30'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                      <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                    </motion.div>
                  </button>
                </motion.li>
              );
            })}
          </ul>
        </nav>
        <div className="p-4 border-t border-white/10">
          <p className="text-[10px] text-slate-500 text-center">Oura v1.0</p>
        </div>
      </div>
    </aside>
  );
}

function MobileMenuButton({ onOpen }) {
  return (
    <button
      onClick={onOpen}
      className="fixed top-4 left-4 z-50 xl:hidden bg-slate-800/80 backdrop-blur-xl p-2.5 rounded-xl border border-white/10 shadow-lg"
    >
      <Menu className="w-5 h-5" />
    </button>
  );
}

function MobileOverlay({ isOpen, activeSection, onClose, onScrollTo }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-sm flex items-center justify-center"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2.5 rounded-xl bg-slate-800/80 border border-white/10"
          >
            <X className="w-6 h-6" />
          </button>
          <nav className="grid grid-cols-3 gap-6 max-w-sm w-full px-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onScrollTo(item.id)}
                  className={`flex flex-col items-center gap-1 p-4 rounded-xl transition-all ${
                    isActive
                      ? 'bg-cyan-500/20 border border-cyan-500/30'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-8 h-8 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span className={`text-xs ${isActive ? 'text-cyan-400' : 'text-slate-400'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Main Sidebar component
export default function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(navItems[0]?.id || 'scores');

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  // Intersection Observer for active section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) {
          setActiveSection(visible.target.id);
        }
      },
      {
        root: null,
        rootMargin: '-20% 0px -60% 0px',
        threshold: [0.1, 0.25, 0.5],
      }
    );

    navItems.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (!element) return;
    setActiveSection(id);
    setIsMobileMenuOpen(false);
    const offset = 80;
    const targetTop = element.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top: targetTop, behavior: 'smooth' });
  };

  return (
    <>
      <DesktopSidebar activeSection={activeSection} onScrollTo={scrollToSection} />
      <MobileMenuButton onOpen={() => setIsMobileMenuOpen(true)} />
      <MobileOverlay
        isOpen={isMobileMenuOpen}
        activeSection={activeSection}
        onClose={() => setIsMobileMenuOpen(false)}
        onScrollTo={scrollToSection}
      />
    </>
  );
}