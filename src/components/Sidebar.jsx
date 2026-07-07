import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  Menu,
  X,
  House,
  Gauge,
  BatteryCharging,
  Moon,
  SportShoe,
  Shield,
  HeartPulse,
  Fingerprint,
} from 'lucide-react';

const navItems = [
  { id: 'home', label: 'Home', icon: House },
  { id: 'scores', label: 'Scores', icon: Gauge },
  { id: 'readiness', label: 'Readiness', icon: BatteryCharging },
  { id: 'sleep', label: 'Sleep', icon: Moon },
  { id: 'activity', label: 'Activity', icon: SportShoe },
  { id: 'stress-resilience', label: 'Stress & Resilience', icon: Shield },
  { id: 'cardio', label: 'Cardiovascular', icon: HeartPulse },
  { id: 'biometrics', label: 'Biometrics', icon: Fingerprint },
];

const GitHubMark = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.58 2 12.228c0 4.514 2.865 8.34 6.839 9.692.5.094.683-.222.683-.493 0-.244-.009-.889-.014-1.745-2.782.618-3.369-1.37-3.369-1.37-.455-1.183-1.11-1.498-1.11-1.498-.908-.635.069-.622.069-.622 1.004.072 1.532 1.055 1.532 1.055.892 1.562 2.341 1.111 2.91.85.091-.661.349-1.112.635-1.368-2.221-.259-4.555-1.136-4.555-5.054 0-1.117.39-2.03 1.029-2.746-.103-.259-.446-1.301.098-2.71 0 0 .84-.275 2.75 1.049A9.397 9.397 0 0 1 12 6.623c.85.004 1.705.118 2.504.345 1.909-1.324 2.747-1.049 2.747-1.049.546 1.409.203 2.451.1 2.71.64.716 1.028 1.629 1.028 2.746 0 3.928-2.338 4.792-4.566 5.046.359.316.678.94.678 1.894 0 1.368-.012 2.472-.012 2.808 0 .274.18.592.688.492C21.138 20.565 24 16.74 24 12.228 24 6.58 19.523 2 14 2h-2Z" />
  </svg>
);

// --- Desktop Sidebar (icons only) ---
const DesktopSidebar = ({ activeSection, navigateToItem }) => (
  <aside className="fixed top-0 left-0 h-full w-20 bg-gradient-to-b from-slate-900/95 to-slate-950/95 border-r border-white/10 shadow-xl z-30 overflow-y-auto hidden xl:block">
    <div className="flex flex-col h-full">
      <div className="p-3.5 border-b border-white/10 flex justify-center">
        <svg width="22" height="22" viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="36" stroke="rgba(6,182,212,0.25)" stroke-width="9"/>
          <circle cx="40" cy="40" r="36" stroke="#06b6d4" stroke-width="9"
                  stroke-dasharray="226" stroke-dashoffset="56" stroke-linecap="round"
                  transform="rotate(-90 40 40)"/>
        </svg>
      </div>
      <nav className="flex-1 px-3 py-6">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <button
                  onClick={() => navigateToItem(item.id)}
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
        <a
          href="https://github.com/KirkAlton-Class7"
          target="_blank"
          rel="noreferrer"
          className="flex justify-center rounded-xl p-2 text-slate-500 transition-colors hover:bg-white/5 hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          aria-label="Open KirkAlton-Class7 on GitHub"
          title="GitHub"
        >
          <GitHubMark className="h-5 w-5" />
        </a>
      </div>
    </div>
  </aside>
);

// --- Mobile Menu Button ---
const MobileMenuButton = ({ setIsMobileMenuOpen }) => (
  <button
    onClick={() => setIsMobileMenuOpen(true)}
    className="fixed left-2.5 top-2.5 z-50 rounded-xl border border-white/10 bg-slate-800/80 p-2.5 shadow-lg backdrop-blur-xl xl:hidden"
    aria-label="Open navigation menu"
  >
    <Menu className="w-5 h-5" />
  </button>
);

// --- Mobile Overlay Menu (icons only) ---
const MobileOverlay = ({ isMobileMenuOpen, setIsMobileMenuOpen, activeSection, navigateToItem }) => (
  <AnimatePresence>
    {isMobileMenuOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-sm flex items-center justify-center"
      >
        <button
          onClick={() => setIsMobileMenuOpen(false)}
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
                onClick={() => navigateToItem(item.id)}
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

// --- Main Sidebar Component ---
export default function Sidebar({ onHome }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('scores');

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  // Intersection Observer for active section highlighting
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

    navItems.filter(item => item.id !== 'home').forEach((item) => {
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

  const navigateToItem = (id) => {
    if (id === 'home') {
      setIsMobileMenuOpen(false);
      onHome();
      return;
    }
    scrollToSection(id);
  };

  return (
    <>
      <DesktopSidebar activeSection={activeSection} navigateToItem={navigateToItem} />
      <MobileMenuButton setIsMobileMenuOpen={setIsMobileMenuOpen} />
      <MobileOverlay
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        activeSection={activeSection}
        navigateToItem={navigateToItem}
      />
    </>
  );
}
