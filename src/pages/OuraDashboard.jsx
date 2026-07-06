import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import UploadScreen from '../components/UploadScreen';
import DateNav from '../components/DateNav';
import QuoteCard from '../components/QuoteCard';
import ScoreSummaryGrid from '../components/ScoreSummaryGrid';
import WearCoverageCard from '../components/WearCoverageCard';
import WearCoverageDetailModal from '../components/WearCoverageDetailModal';
import CompareModal from '../components/CompareModal';
import ReadinessDetailModal from '../components/ReadinessDetailModal';
import SleepDetailModal from '../components/SleepDetailModal';
import ReadinessCard from '../components/ReadinessCard';
import SleepCard from '../components/SleepCard';
import ActivityCard from '../components/ActivityCard';
import ActivityDetailModal from '../components/ActivityDetailModal';
import StressResilienceCard from '../components/StressResilienceCard';
import CardioCard from '../components/CardioCard';
import CardioDetailModal from '../components/CardioDetailModal';
import BiometricsCard from '../components/BiometricsCard';
import BiometricsDetailModal from '../components/BiometricsDetailModal';
import BackgroundManager from '../components/BackgroundManager';
import { buildDashboardSnapshot } from '../utils/snapshot';
import { writeClipboardText } from '../utils/clipboard';
import { useToast } from '../context/toast';
import { useDateNavigation } from '../hooks/useDateNavigation';
import { PRIMARY_DATA_KEYS, hasDatedRecords } from '../utils/datasets';

export default function OuraDashboard() {
  const { showToast } = useToast();
  const [appData, setAppData] = useState({});
  const [availableDates, setAvailableDates] = useState([]);
  const [isDashboardVisible, setIsDashboardVisible] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [readinessDetailTarget, setReadinessDetailTarget] = useState(null);
  const [sleepDetailTarget, setSleepDetailTarget] = useState(null);
  const [activityDetailTarget, setActivityDetailTarget] = useState(null);
  const [isCardioDetailOpen, setIsCardioDetailOpen] = useState(false);
  const [isBiometricsDetailOpen, setIsBiometricsDetailOpen] = useState(false);
  const [isWearCoverageOpen, setIsWearCoverageOpen] = useState(false);
  const [areWidgetsHidden, setAreWidgetsHidden] = useState(false);
  const {
    selectedDate,
    setSelectedDate,
    weekDates,
    dateWindow,
    changeWeek,
    canPrevious,
    canNext,
  } = useDateNavigation(availableDates);

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
        const res = await fetch(`${base}data/images/image_gallery/travel_destinations/gallery-manifest.json`);
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

  const toggleWidgets = useCallback(() => {
    setAreWidgetsHidden(hidden => !hidden);
  }, []);

  const handleDataLoaded = useCallback((data) => {
    const hasPrimaryData = PRIMARY_DATA_KEYS.some(key => hasDatedRecords(data[key]));
    if (!hasPrimaryData) {
      throw new Error('At least one primary dataset is required.');
    }

    const allDates = new Set();
    Object.values(data).forEach(groupedData => {
      Object.keys(groupedData || {}).forEach(date => allDates.add(date));
    });
    const sorted = Array.from(allDates).sort();
    if (sorted.length === 0) {
      throw new Error('No valid dates were found in the uploaded data.');
    }
    const mostRecent = sorted[sorted.length - 1];
    setAppData(data);
    setAvailableDates(sorted);
    setSelectedDate(mostRecent);
    setIsDashboardVisible(true);
  }, [setSelectedDate]);

  const handleHome = useCallback(() => {
    setIsCompareOpen(false);
    setReadinessDetailTarget(null);
    setSleepDetailTarget(null);
    setActivityDetailTarget(null);
    setIsCardioDetailOpen(false);
    setIsBiometricsDetailOpen(false);
    setIsWearCoverageOpen(false);
    setAreWidgetsHidden(false);
    setAppData({});
    setAvailableDates([]);
    setSelectedDate('');
    setIsDashboardVisible(false);
    window.scrollTo({ top: 0 });
  }, [setSelectedDate]);

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

      <div className={`transition-opacity duration-500 ${areWidgetsHidden ? 'pointer-events-none opacity-0' : 'opacity-100'}`}>
        <Sidebar onHome={handleHome} />
      </div>

      <div>
        <Header
          dateString={selectedDate}
          onCopySnapshot={handleCopySnapshot}
          onCompare={() => setIsCompareOpen(true)}
          backgroundMode={backgroundMode}
          onToggleBackground={toggleBackground}
          onPrevImage={prevImage}
          onNextImage={nextImage}
          areWidgetsHidden={areWidgetsHidden}
          onToggleWidgets={toggleWidgets}
        />

        <main className={`relative z-10 max-w-6xl mx-auto px-4 py-6 space-y-8 pb-16 transition-opacity duration-500 ${
          areWidgetsHidden ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}>
          <section id="scores" className="scroll-mt-20">
            <DateNav
              dates={weekDates}
              availableDates={availableDates}
              selectedDate={selectedDate}
              onSelect={setSelectedDate}
              onPrevious={() => changeWeek(-1)}
              onNext={() => changeWeek(1)}
              canPrevious={canPrevious}
              canNext={canNext}
            />
          </section>

          <QuoteCard />

          <ScoreSummaryGrid
            appData={appData}
            selectedDate={selectedDate}
            dateWindow={dateWindow}
            onSelectDate={setSelectedDate}
            onOpenReadiness={() => setReadinessDetailTarget('top')}
            onOpenSleep={() => setSleepDetailTarget('top')}
            onOpenActivity={() => setActivityDetailTarget('top')}
          />

          <section id="wear-coverage" className="scroll-mt-20">
            <WearCoverageCard data={activityData} selectedDate={selectedDate} onOpenDetails={() => setIsWearCoverageOpen(true)} />
          </section>

          <div className="space-y-6">
            <section id="readiness" className="scroll-mt-20">
              <ReadinessCard data={readinessData} sleepmodelData={sleepmodelData} onOpenDetails={setReadinessDetailTarget} />
            </section>
            <section id="sleep" className="scroll-mt-20">
              <SleepCard
                data={sleepData}
                sleepmodelData={sleepmodelData}
                sleeptimeData={sleeptimeData}
                allSleepmodelData={appData.sleepmodel}
                selectedDate={selectedDate}
                onOpenDetails={setSleepDetailTarget}
              />
            </section>
            <section id="activity" className="scroll-mt-20">
              <ActivityCard data={activityData} onOpenDetails={setActivityDetailTarget} />
            </section>
            <section id="stress-resilience" className="scroll-mt-20">
              <StressResilienceCard
                stressData={stressData}
                resilienceData={resilienceData}
                daytimeStressData={daytimeStressData}
              />
            </section>
            <section id="cardio" className="scroll-mt-20">
              <CardioCard
                data={cardioData}
                dateWindow={dateWindow}
                allData={appData.cardiovascularage}
                selectedDate={selectedDate}
                onOpenDetails={() => setIsCardioDetailOpen(true)}
              />
            </section>
            <section id="biometrics" className="scroll-mt-20">
              <BiometricsCard
                spo2Data={spo2Data}
                heartrateData={heartrateData}
                temperatureData={temperatureData}
                onOpenDetails={() => setIsBiometricsDetailOpen(true)}
              />
            </section>
          </div>
        </main>

        <AnimatePresence>
          {isCompareOpen && (
            <CompareModal
              appData={appData}
              availableDates={availableDates}
              initialDate={selectedDate}
              onClose={() => setIsCompareOpen(false)}
            />
          )}
          {readinessDetailTarget && (
            <ReadinessDetailModal
              appData={appData}
              selectedDate={selectedDate}
              initialTarget={readinessDetailTarget}
              onClose={() => setReadinessDetailTarget(null)}
            />
          )}
          {sleepDetailTarget && (
            <SleepDetailModal
              appData={appData}
              selectedDate={selectedDate}
              initialTarget={sleepDetailTarget}
              onClose={() => setSleepDetailTarget(null)}
            />
          )}
          {activityDetailTarget && (
            <ActivityDetailModal
              appData={appData}
              selectedDate={selectedDate}
              initialTarget={activityDetailTarget}
              onClose={() => setActivityDetailTarget(null)}
            />
          )}
          {isCardioDetailOpen && (
            <CardioDetailModal
              appData={appData}
              selectedDate={selectedDate}
              onClose={() => setIsCardioDetailOpen(false)}
            />
          )}
          {isBiometricsDetailOpen && (
            <BiometricsDetailModal
              appData={appData}
              selectedDate={selectedDate}
              onClose={() => setIsBiometricsDetailOpen(false)}
            />
          )}
          {isWearCoverageOpen && (
            <WearCoverageDetailModal
              appData={appData}
              selectedDate={selectedDate}
              onClose={() => setIsWearCoverageOpen(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
