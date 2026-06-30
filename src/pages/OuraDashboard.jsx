import { useState, useCallback, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import UploadScreen from '../components/UploadScreen';
import DateNav from '../components/DateNav';
import QuoteCard from '../components/QuoteCard';
import ScoreCard from '../components/ScoreCard';
import ReadinessCard from '../components/ReadinessCard';
import SleepCard from '../components/SleepCard';
import ActivityCard from '../components/ActivityCard';
import StressResilienceCard from '../components/StressResilienceCard';
import CardioCard from '../components/CardioCard';
import BiometricsCard from '../components/BiometricsCard';
import BackgroundManager from '../components/BackgroundManager';
import { buildDashboardSnapshot } from '../utils/snapshot';
import { writeClipboardText } from '../utils/clipboard';
import { useToast } from '../context/ToastContext';

export default function OuraDashboard() {
  const { showToast } = useToast();
  const [appData, setAppData] = useState({});
  const [dateWindow, setDateWindow] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [isDashboardVisible, setIsDashboardVisible] = useState(false);

  // Background state
  const [backgroundMode, setBackgroundMode] = useState('particles');
  const [imageList, setImageList] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSidebarCollapsed] = useState(true); // always collapsed, no toggle

  // Load gallery manifest
  useEffect(() => {
    const loadManifest = async () => {
      try {
        const base = import.meta.env.BASE_URL || '/';
        const res = await fetch(`${base}data/images/image_gallery/gallery-manifest.json`);
        if (!res.ok) throw new Error('Manifest not found');
        const data = await res.json();
        setImageList(data);
      } catch (error) {
        console.warn('Failed to load gallery manifest:', error);
        setImageList([]);
      }
    };
    loadManifest();
  }, []);

  const toggleBackground = useCallback(() => {
    setBackgroundMode(prev => (prev === 'particles' ? 'image' : 'particles'));
  }, []);

  const nextImage = useCallback(() => {
    if (imageList.length === 0) return;
    setCurrentImageIndex(prev => (prev + 1) % imageList.length);
  }, [imageList.length]);

  const prevImage = useCallback(() => {
    if (imageList.length === 0) return;
    setCurrentImageIndex(prev => (prev - 1 + imageList.length) % imageList.length);
  }, [imageList.length]);

  const handleDataLoaded = useCallback((data) => {
    setAppData(data);
    const allDates = new Set();
    ['activity', 'readiness', 'sleep', 'spo2', 'stress', 'resilience', 'cardiovascularage'].forEach(k => {
      Object.keys(data[k] || {}).forEach(d => allDates.add(d));
    });
    const sorted = Array.from(allDates).sort();
    if (sorted.length === 0) {
      showToast('No valid date data found. Please check your CSV files.');
      return;
    }
    const mostRecent = sorted[sorted.length - 1];
    const idx = sorted.indexOf(mostRecent);
    const startIdx = Math.max(0, idx - 6);
    const window = sorted.slice(startIdx, idx + 1);
    setDateWindow(window);
    setSelectedDate(mostRecent);
    setIsDashboardVisible(true);
  }, [showToast]);

  const handleCopySnapshot = useCallback(async () => {
    const snapshot = buildDashboardSnapshot({
      selectedDate,
      dateWindow,
      appData,
    });
    try {
      await writeClipboardText(snapshot);
      showToast('Dashboard snapshot copied to clipboard.');
    } catch (error) {
      console.error('Failed to copy snapshot:', error);
      showToast('Failed to copy snapshot.');
    }
  }, [selectedDate, dateWindow, appData, showToast]);

  if (!isDashboardVisible) {
    return <UploadScreen onDataLoaded={handleDataLoaded} />;
  }

  const getTrendBars = (category) => {
    return dateWindow.map((d) => {
      const rec = appData[category]?.[d]?.[0];
      const score = rec?.score ? Number(rec.score) : 0;
      const height = score ? Math.max(8, Math.round(score * 0.32)) : 4;
      const color = score ? getScoreColor(score) : 'rgba(255,255,255,0.1)';
      const isActive = d === selectedDate;
      return (
        <div
          key={d}
          className={`flex-1 flex flex-col items-end justify-end cursor-pointer ${isActive ? 'active' : ''}`}
          onClick={() => setSelectedDate(d)}
        >
          <div
            className="w-full rounded-t-sm transition-opacity"
            style={{ height: `${height}px`, backgroundColor: color, opacity: isActive ? 1 : 0.35 }}
          />
          <div className="text-[8px] text-slate-500 mt-0.5">{new Date(d).getDate()}</div>
        </div>
      );
    });
  };

  const getScoreColor = (s) => {
    if (s >= 85) return '#10b981';
    if (s >= 70) return '#06b6d4';
    if (s >= 60) return '#f59e0b';
    return '#f43f5e';
  };

  const readinessData = appData.readiness?.[selectedDate]?.[0];
  const sleepData = appData.sleep?.[selectedDate]?.[0];
  const activityData = appData.activity?.[selectedDate]?.[0];
  const sleepmodelData = appData.sleepmodel?.[selectedDate] || [];
  const sleeptimeData = appData.sleeptime?.[selectedDate]?.[0];
  const stressData = appData.stress?.[selectedDate]?.[0];
  const resilienceData = appData.resilience?.[selectedDate]?.[0];
  const daytimeStressData = appData.daytimestress?.[selectedDate] || [];
  const cardioData = appData.cardiovascularage?.[selectedDate]?.[0];
  const spo2Data = appData.spo2?.[selectedDate]?.[0];
  const heartrateData = appData.heartrate?.[selectedDate] || [];
  const temperatureData = appData.temperature?.[selectedDate] || [];

  return (
    <div className="relative min-h-screen">
      <BackgroundManager
        mode={backgroundMode}
        imageList={imageList}
        currentIndex={currentImageIndex}
        isSidebarCollapsed={isSidebarCollapsed}
      />

      <Sidebar />

      <div>
        <Header
          dateString={selectedDate}
          onCopySnapshot={handleCopySnapshot}
          backgroundMode={backgroundMode}
          onToggleBackground={toggleBackground}
          onPrevImage={prevImage}
          onNextImage={nextImage}
        />

        <main className="relative z-10 max-w-6xl mx-auto px-4 py-6 space-y-8 pb-16">
          <section id="scores" className="scroll-mt-20">
            <DateNav dates={dateWindow} selectedDate={selectedDate} onSelect={setSelectedDate} />
          </section>

          <QuoteCard />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ScoreCard
              label="Readiness"
              data={readinessData}
              color="#06b6d4"
              trendBars={getTrendBars('readiness')}
            />
            <ScoreCard
              label="Sleep"
              data={sleepData}
              color="#8b5cf6"
              trendBars={getTrendBars('sleep')}
            />
            <ScoreCard
              label="Activity"
              data={activityData}
              color="#f59e0b"
              trendBars={getTrendBars('activity')}
            />
          </div>

          <div className="space-y-6">
            <section id="readiness" className="scroll-mt-20">
              <ReadinessCard data={readinessData} />
            </section>
            <section id="sleep" className="scroll-mt-20">
              <SleepCard data={sleepData} sleepmodelData={sleepmodelData} sleeptimeData={sleeptimeData} />
            </section>
            <section id="activity" className="scroll-mt-20">
              <ActivityCard data={activityData} />
            </section>
            <section id="stress-resilience" className="scroll-mt-20">
              <StressResilienceCard
                stressData={stressData}
                resilienceData={resilienceData}
                daytimeStressData={daytimeStressData}
              />
            </section>
            <section id="cardio" className="scroll-mt-20">
              <CardioCard data={cardioData} dateWindow={dateWindow} allData={appData.cardiovascularage} />
            </section>
            <section id="biometrics" className="scroll-mt-20">
              <BiometricsCard
                spo2Data={spo2Data}
                heartrateData={heartrateData}
                temperatureData={temperatureData}
              />
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}