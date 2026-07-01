import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Quote, RefreshCw, Bookmark, Copy, Check, BookmarkCheck, Star, X } from 'lucide-react';
import Card from './Card';
import { writeClipboardText } from '../utils/clipboard';
import { formatQuoteText, getQuoteAttribution, getQuoteKey, normalizeQuotes } from '../utils/quotes';

const FAVORITES_KEY = 'oura_quotes_favorites';

const loadStoredFavorites = () => {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return normalizeQuotes(stored ? JSON.parse(stored) : []);
  } catch (error) {
    console.warn('Failed to load saved quotes:', error);
    return [];
  }
};

export default function QuoteCard({ onCopyFailure, onCopySuccess }) {
  const [currentQuote, setCurrentQuote] = useState(null);
  const [favorites, setFavorites] = useState(loadStoredFavorites);
  const [showFavorites, setShowFavorites] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [quotesList, setQuotesList] = useState([]);

  // Load quotes from the public JSON file
  useEffect(() => {
    const loadQuotes = async () => {
      try {
        const base = import.meta.env.BASE_URL || '/';
        const response = await fetch(`${base}data/quotes/quotes.json`, { cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to fetch quotes');
        const data = normalizeQuotes(await response.json());
        if (data.length === 0) throw new Error('Quotes file contains no valid records');
        setQuotesList(data);
        if (data.length > 0) {
          const random = data[Math.floor(Math.random() * data.length)];
          setCurrentQuote(random);
        }
      } catch (error) {
        console.error('Failed to load quotes:', error);
        // Fallback to a single default quote so the card still renders
        setQuotesList([]);
        setCurrentQuote({
          text: 'Could not load quotes. Please check the file.',
          author: 'System',
        });
      }
    };
    loadQuotes();
  }, []);

  const saved = currentQuote
    ? favorites.some(quote => getQuoteKey(quote) === getQuoteKey(currentQuote))
    : false;

  const persistFavorites = (nextFavorites) => {
    setFavorites(nextFavorites);
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(nextFavorites));
    } catch (error) {
      console.warn('Failed to save favorite quotes:', error);
    }
  };

  const refreshQuote = () => {
    if (quotesList.length === 0) return;
    setIsRefreshing(true);
    let newQuote;
    let attempts = 0;
    do {
      newQuote = quotesList[Math.floor(Math.random() * quotesList.length)];
      attempts++;
    } while (quotesList.length > 1 && getQuoteKey(newQuote) === getQuoteKey(currentQuote) && attempts < 20);
    setCurrentQuote(newQuote);
    setTimeout(() => setIsRefreshing(false), 400);
  };

  const copyQuote = async () => {
    if (!currentQuote) return;
    const text = formatQuoteText(currentQuote);
    try {
      await writeClipboardText(text);
      setCopied(true);
      onCopySuccess?.('Quote copied to clipboard.');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy quote:', error);
      onCopyFailure?.(text, 'quote');
    }
  };

  const toggleSave = () => {
    if (!currentQuote) return;
    const newFavs = saved
      ? favorites.filter(quote => getQuoteKey(quote) !== getQuoteKey(currentQuote))
      : [...favorites, currentQuote];
    persistFavorites(newFavs);
  };

  const removeFavorite = (quote, e) => {
    e.stopPropagation();
    const newFavs = favorites.filter(favorite => getQuoteKey(favorite) !== getQuoteKey(quote));
    persistFavorites(newFavs);
  };

  const selectFavorite = (quote) => {
    setCurrentQuote(quote);
    setShowFavorites(false);
  };

  if (!currentQuote) return null;

  const { primary, secondary } = getQuoteAttribution(currentQuote);
  return (
    <>
      <Card
        title="Featured Quote"
        subtitle="Inspiration from the community"
      >
        <div className="relative">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-2xl"></div>
          
          <blockquote className="space-y-4 relative z-10">
            <div className="flex items-start gap-3">
              <motion.div
                animate={{ rotate: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
                className="flex-shrink-0"
              >
                <Quote className="w-8 h-8 text-purple-400 opacity-50" />
              </motion.div>
              
              <motion.p
                key={currentQuote.text}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-base lg:text-lg leading-relaxed text-slate-200 flex-1"
              >
                “{currentQuote.text}”
              </motion.p>
            </div>
            
            <footer className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
              <div>
                <p className="text-sm font-medium bg-gradient-to-r from-slate-200 to-slate-300 bg-clip-text text-transparent">
                  — {primary}
                </p>
                {secondary.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {secondary.map(line => (
                      <p key={line} className="text-xs text-slate-500">{line}</p>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <motion.button
                  onClick={copyQuote}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors relative group"
                  title="Copy quote"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-400 group-hover:text-slate-200" />
                  )}
                </motion.button>
                
                <motion.button
                  onClick={refreshQuote}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  title="Refresh quote"
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`w-4 h-4 text-slate-400 ${isRefreshing ? 'animate-spin' : 'hover:text-slate-200'}`} />
                </motion.button>
                
                <motion.button
                  onClick={toggleSave}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  title={saved ? 'Remove from saved' : 'Save quote'}
                >
                  {saved ? (
                    <BookmarkCheck className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Bookmark className="w-4 h-4 text-slate-400 hover:text-slate-200" />
                  )}
                </motion.button>

                <motion.button
                  onClick={() => setShowFavorites(true)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  title="View favorites"
                >
                  <Star className="w-4 h-4 text-slate-400 hover:text-yellow-400" />
                </motion.button>
              </div>
            </footer>
          </blockquote>
        </div>
      </Card>

      {/* Favorites Modal */}
      {showFavorites && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowFavorites(false)}>
          <div className="bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-slate-100">⭐ Favorite Quotes</h2>
              <button onClick={() => setShowFavorites(false)} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {favorites.length === 0 ? (
                <p className="text-center text-slate-400 py-8">No favorites yet. Click the bookmark button to save quotes!</p>
              ) : (
                favorites.map((fav) => {
                  const attribution = getQuoteAttribution(fav);
                  const preview = fav.text.length > 100 ? `${fav.text.substring(0, 100)}…` : fav.text;
                  return (
                    <div
                      key={getQuoteKey(fav)}
                      onClick={() => selectFavorite(fav)}
                      className="group p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer border border-white/10"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <p className="text-sm text-slate-200">“{preview}”</p>
                          <p className="text-xs text-slate-400 mt-1">— {attribution.primary}</p>
                          {attribution.secondary.map(line => (
                            <p key={line} className="text-xs text-slate-500">{line}</p>
                          ))}
                        </div>
                        <button onClick={(e) => removeFavorite(fav, e)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 transition-all" title="Remove">
                          <X className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
