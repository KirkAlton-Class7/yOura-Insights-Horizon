import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Upload } from 'lucide-react';
import { parseCSV, dateKey } from '../utils/csvParser';
import { validateDashboardData } from '../utils/uploadValidation';
import { useToast } from '../context/toast';

const FILE_MAP = {
  'dailyactivity': 'activity',
  'dailyreadiness': 'readiness',
  'dailysleep': 'sleep',
  'dailyspo2': 'spo2',
  'heartrate': 'heartrate',
  'temperature': 'temperature',
  'sleeptime': 'sleeptime',
  'dailystress': 'stress',
  'dailyresilience': 'resilience',
  'daytimestress': 'daytimestress',
  'dailycardiovascularage': 'cardiovascularage',
  'sleepmodel': 'sleepmodel'
};

export default function UploadScreen({ onDataLoaded }) {
  const { showToast } = useToast();
  const [loadedFiles, setLoadedFiles] = useState({});
  const [parsedData, setParsedData] = useState({});

  const onDrop = useCallback(async (acceptedFiles) => {
    const newLoaded = { ...loadedFiles };
    const nextData = { ...parsedData };

    for (const file of acceptedFiles) {
      const baseName = file.name.replace('.csv', '').replace(/\s/g, '').toLowerCase();
      const key = Object.keys(FILE_MAP).find(k => baseName.includes(k));
      if (!key) continue;

      try {
        const text = await file.text();
        const rows = parseCSV(text);
        const dataKey = FILE_MAP[key];

        const grouped = {};
        for (const row of rows) {
          const d = dateKey(row.day || row.timestamp || '');
          if (!d) continue;
          if (!grouped[d]) grouped[d] = [];
          grouped[d].push(row);
        }

        if (rows.length === 0 || Object.keys(grouped).length === 0) {
          throw new Error(`${file.name} contains no valid dated records.`);
        }

        nextData[dataKey] = grouped;
        newLoaded[key] = true;
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

  const fileList = Object.keys(FILE_MAP).map(key => ({
    key,
    label: `${key}.csv`,
    loaded: loadedFiles[key] || false,
  }));
  const requiredFiles = Object.keys(FILE_MAP);
  const isReady = requiredFiles.every(key => loadedFiles[key]);

  const handleGenerate = async () => {
    if (!isReady) {
      showToast({
        title: 'Missing Required Files',
        message: 'Please upload all 12 required CSV files before attempting to generate the dashboard.',
        type: 'error',
      });
      return;
    }

    try {
      const hasCompleteData = Object.values(FILE_MAP).every(
        dataKey => parsedData[dataKey] && Object.keys(parsedData[dataKey]).length > 0,
      );
      if (!hasCompleteData) throw new Error('One or more required datasets are empty.');
      validateDashboardData(parsedData);

      await onDataLoaded(parsedData);
    } catch (error) {
      console.error('Dashboard generation failed:', error);
      showToast({
        title: 'Unable to Generate Dashboard',
        message: "The dashboard couldn't be generated. Please verify that all required CSV files are valid and complete, then try again.",
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
          yOura Insights
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
        <div className="mt-4 rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm font-medium text-amber-200">
          All 12 exported files are required to generate the dashboard
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-6 text-left">
          {fileList.map(({ key, label, loaded }) => (
            <div
              key={key}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                loaded ? 'bg-cyan-400/10 text-cyan-400' : 'bg-white/5 text-slate-400'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${loaded ? 'bg-cyan-400' : 'bg-slate-600'}`} />
              {label}
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
      <p className="text-xs text-slate-500 mt-4">Your data never leaves your browser. All processing is done locally.</p>
    </div>
  );
}
