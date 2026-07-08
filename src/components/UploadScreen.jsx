import { useCallback, useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { AnimatePresence, motion } from 'framer-motion';
import { ExternalLink, FileLock, Info, Upload } from 'lucide-react';
import { parseCSV, parseCSVLine, dateKey } from '../utils/csvParser';
import { validateDashboardData } from '../utils/uploadValidation';
import {
  DATASET_DEFINITIONS,
  FILE_MAP,
  PRIMARY_FILE_KEYS,
  getUnavailableDatasets,
} from '../utils/datasets';
import { useToast } from '../context/toast';

export default function UploadScreen({ onDataLoaded }) {
  const { showToast } = useToast();
  const [loadedFiles, setLoadedFiles] = useState({});
  const [parsedData, setParsedData] = useState({});
  const [exportHelpOpen, setExportHelpOpen] = useState(false);
  const exportHelpTriggerRef = useRef(null);
  const exportHelpPopoverRef = useRef(null);

  const onDrop = useCallback(async (acceptedFiles) => {
    const newLoaded = { ...loadedFiles };
    const nextData = { ...parsedData };

    for (const file of acceptedFiles) {
      const baseName = file.name.replace(/\.csv$/i, '').replace(/[^a-z0-9]/gi, '').toLowerCase();
      const key = Object.keys(FILE_MAP).find(k => baseName.includes(k));
      if (!key) continue;

      try {
        const text = await file.text();
        const rows = parseCSV(text);
        const dataKey = FILE_MAP[key];

        if (rows.length === 0) {
          const headers = parseCSVLine(text.trim().split(/\r?\n/)[0] || '')
            .map(header => header.replace(/^\uFEFF/, '').trim().toLowerCase());
          const hasDateHeader = headers.includes('day') || headers.includes('timestamp');
          if (!hasDateHeader) throw new Error(`${file.name} does not contain a recognized CSV header.`);

          nextData[dataKey] = {};
          newLoaded[key] = 'empty';
          continue;
        }

        const grouped = {};
        for (const row of rows) {
          const d = dateKey(row.day || row.timestamp || '');
          if (!d) continue;
          if (!grouped[d]) grouped[d] = [];
          grouped[d].push(row);
        }

        if (Object.keys(grouped).length === 0) {
          throw new Error(`${file.name} contains no valid dated records.`);
        }

        nextData[dataKey] = grouped;
        newLoaded[key] = 'loaded';
      } catch (error) {
        console.error(`Failed to process ${file.name}:`, error);
        delete newLoaded[key];
        delete nextData[FILE_MAP[key]];
        showToast({
          title: 'Unable to Read File',
          message: `${file.name} could not be processed. Please verify the CSV and upload it again.`,
          type: 'error',
        });
      }
    }

    setLoadedFiles(newLoaded);
    setParsedData(nextData);
  }, [loadedFiles, parsedData, showToast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: true,
  });

  const fileList = DATASET_DEFINITIONS.map(definition => ({
    ...definition,
    label: `${definition.fileKey}.csv`,
    status: loadedFiles[definition.fileKey] || 'missing',
  }));
  const isReady = PRIMARY_FILE_KEYS.some(key => loadedFiles[key] === 'loaded');

  const closeExportHelp = useCallback(() => {
    setExportHelpOpen(false);
    requestAnimationFrame(() => exportHelpTriggerRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!exportHelpOpen) return undefined;

    requestAnimationFrame(() => exportHelpPopoverRef.current?.focus());

    const handlePointerDown = event => {
      if (
        exportHelpPopoverRef.current?.contains(event.target)
        || exportHelpTriggerRef.current?.contains(event.target)
      ) {
        return;
      }
      setExportHelpOpen(false);
    };

    const handleKeyDown = event => {
      if (event.key === 'Escape') closeExportHelp();
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeExportHelp, exportHelpOpen]);

  const handleGenerate = async () => {
    if (!isReady) {
      showToast({
        title: 'Primary Data Required',
        message: 'Please upload at least one nonempty primary file: dailyreadiness.csv, dailysleep.csv, or dailyactivity.csv.',
        type: 'error',
      });
      return;
    }

    try {
      validateDashboardData(parsedData);

      await onDataLoaded(parsedData);
      const unavailable = getUnavailableDatasets(parsedData);
      if (unavailable.length > 0) {
        showToast({
          title: 'Partial Dashboard Generated',
          message: `No data available for: ${unavailable.map(({ label }) => label).join(', ')}.`,
          type: 'warning',
        });
      }
    } catch (error) {
      console.error('Dashboard generation failed:', error);
      showToast({
        title: 'Unable to Generate Dashboard',
        message: "The dashboard couldn't be generated. Please verify that the uploaded CSV files are valid, then try again.",
        type: 'error',
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="upload-logo animate-float">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="36" stroke="rgba(6,182,212,0.2)" stroke-width="8"/>
            <circle cx="40" cy="40" r="36" stroke="url(#ring-grad)" stroke-width="8"
                    stroke-dasharray="226" stroke-dashoffset="56" stroke-linecap="round"
                    transform="rotate(-90 40 40)"/>
            <defs>
              <linearGradient id="ring-grad" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#06b6d4"/>
                <stop offset="100%" stop-color="#8b5cf6"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h1 className="text-4xl font-outfit font-extrabold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent bg-[length:200%] animate-gradient-shift">
          yOura Insights Horizon
        </h1>
        <p className="text-slate-400 mt-2 max-w-md mx-auto">
          Upload your exported Oura Ring CSV files to view your personal health dashboard
        </p>
      </motion.div>

      <div
        {...getRootProps()}
        className={`w-full max-w-2xl glass p-10 text-center cursor-pointer transition-all duration-300 ${
          isDragActive ? 'border-cyan-400 bg-cyan-400/5 shadow-lg shadow-cyan-400/10' : ''
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
        <p className="text-lg font-medium text-slate-200">
          {isDragActive ? 'Drop your CSV files here' : 'Drag & drop your CSV files here'}
        </p>
        <p className="text-sm text-slate-400 mt-1">or click to browse</p>

        <div className="relative mt-6 border-t border-white/10 pt-5" onClick={event => event.stopPropagation()}>
          <button
            ref={exportHelpTriggerRef}
            type="button"
            onClick={() => setExportHelpOpen(open => !open)}
            aria-expanded={exportHelpOpen}
            aria-controls="oura-export-help-popover"
            className="group inline-flex items-center justify-center gap-2 text-sm font-medium text-slate-400 transition-colors hover:text-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            <Info className="h-4 w-4 text-cyan-400" strokeWidth={2.4} />
            <span>Don&apos;t have your files yet?</span>
          </button>

          <AnimatePresence>
            {exportHelpOpen && (
              <motion.div
                ref={exportHelpPopoverRef}
                id="oura-export-help-popover"
                role="dialog"
                aria-label="Get your data from Oura"
                tabIndex={-1}
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className="absolute left-1/2 top-full z-30 mt-3 w-[min(18rem,calc(100vw-4rem))] -translate-x-1/2 rounded-2xl border border-white/10 bg-slate-900/95 p-5 text-left shadow-2xl shadow-black/40 backdrop-blur-xl focus-visible:outline-none"
              >
                <h2 className="font-outfit text-base font-semibold text-slate-100">Get your data from Oura</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Click the button below to request your data export from Oura.
                </p>
                <button
                  type="button"
                  onClick={() => window.open('https://membership.ouraring.com/data-export', '_blank', 'noopener,noreferrer')}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-purple-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-400/20 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                >
                  Request Data Export
                  <ExternalLink className="h-4 w-4" />
                </button>
                <p className="mt-3 text-xs text-slate-500">Opens the Oura website in a new tab.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-4 rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm font-medium text-amber-200">
          At least one exported file is required to generate the dashboard
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-6 text-left">
          {fileList.map(({ fileKey, label, primary, status }) => (
            <div
              key={fileKey}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                status === 'loaded'
                  ? 'bg-cyan-400/10 text-cyan-400'
                  : status === 'empty'
                    ? 'bg-amber-400/10 text-amber-300'
                    : 'bg-white/5 text-slate-400'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${
                status === 'loaded' ? 'bg-cyan-400' : status === 'empty' ? 'bg-amber-400' : 'bg-slate-600'
              }`} />
              <span className="min-w-0 flex-1 truncate">{label}</span>
              <span className="text-[10px] uppercase tracking-wide opacity-70">
                {status === 'loaded' ? 'Ready' : status === 'empty' ? 'No data' : primary ? 'Primary' : 'Optional'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleGenerate}
        className={`mt-8 px-8 py-3 rounded-full font-outfit font-semibold transition-all ${
          isReady
            ? 'bg-gradient-to-r from-cyan-400 to-purple-400 text-white shadow-lg shadow-cyan-400/30 hover:shadow-cyan-400/50 hover:-translate-y-1'
            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
        }`}
      >
        Generate Dashboard
      </button>
      <p className="mt-4 inline-flex items-center justify-center gap-2 text-xs text-slate-500">
        <FileLock className="h-4 w-4 text-cyan-400" strokeWidth={2.4} />
        <span>Your data never leaves your device. All processing is done locally.</span>
      </p>
    </div>
  );
}
