import { useState, useCallback, useEffect, useMemo } from 'react';
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
import { getScoreColor } from '../utils/colors';

const groupDatesIntoWeeks = (dates) => {
  const weekStarts = new Set();

  Array.from(new Set(dates)).sort().forEach((date) => {
    const [year, month, day] = date.split('-').map(Number);
    const value = Date.UTC(year, month - 1, day);
    weekStarts.add(value - new Date(value).getUTCDay() * 86400000);
  });

  return Array.from(weekStarts)
    .sort((a, b) => a - b)
    .map(weekStart => Array.from({ length: 7 }, (_, offset) => (
      new Date(weekStart + offset * 86400000).toISOString().slice(0, 10)
    )));
};

const getWeekday = (date) => {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
};

const selectDateInWeek = (currentDate, dates) => {
  if (!dates.length) return '';
  const targetWeekday = getWeekday(currentDate);
  const matchingDate = dates.find(date => getWeekday(date) === targetWeekday);
  if (matchingDate) return matchingDate;

  return dates.reduce((closest, date) => (
    Math.abs(getWeekday(date) - targetWeekday) < Math.abs(getWeekday(closest) - targetWeekday)
      ? date
      : closest
  ), dates[0]);
};

const findWeekIndex = (weeks, date) => {
  const index = weeks.findIndex(week => week.includes(date));
  return index < 0 ? 0 : index;
};

export default function OuraDashboard() {
  const { showToast } = useToast();
  const [appData, setAppData] = useState({});
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [isDashboardVisible, setIsDashboardVisible] = useState(false);
  const dateWeeks = useMemo(() => groupDatesIntoWeeks(availableDates), [availableDates]);
  const weekIndex = useMemo(() => findWeekIndex(dateWeeks, selectedDate), [dateWeeks, selectedDate]);
  const weekDates = useMemo(() => dateWeeks[weekIndex] || [], [dateWeeks, weekIndex]);
  const availableDateSet = useMemo(() => new Set(availableDates), [availableDates]);
  const dateWindow = useMemo(
    () => weekDates.filter(date => availableDateSet.has(date)),
    [weekDates, availableDateSet],
  );

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
    setAvailableDates(sorted);
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

  const changeWeek = (direction) => {
    const nextIndex = Math.min(Math.max(weekIndex + direction, 0), dateWeeks.length - 1);
    if (nextIndex === weekIndex) return;

    const nextWeek = dateWeeks[nextIndex].filter(date => availableDateSet.has(date));
    setSelectedDate(selectDateInWeek(selectedDate, nextWeek));
  };

  const getTrendBars = (category) => {
    return dateWindow.map((d) => {
      const rec = appData[category]?.[d]?.[0];
      const hasScore = rec?.score !== null && rec?.score !== undefined && rec?.score !== '' && Number.isFinite(Number(rec.score));
      const score = hasScore ? Number(rec.score) : null;
      const height = hasScore ? Math.max(8, Math.round(score * 0.32)) : 4;
      const color = hasScore ? getScoreColor(score) : 'rgba(255,255,255,0.1)';
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

  const getWeeklyScores = (category) => dateWindow.map((date) => ({
    date,
    score: appData[category]?.[date]?.[0]?.score ?? null,
  }));

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
            <DateNav
              dates={weekDates}
              availableDates={availableDates}
              selectedDate={selectedDate}
              onSelect={setSelectedDate}
              onPrevious={() => changeWeek(-1)}
              onNext={() => changeWeek(1)}
              canPrevious={weekIndex > 0}
              canNext={weekIndex < dateWeeks.length - 1}
            />
          </section>

          <QuoteCard />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ScoreCard
              label="Readiness"
              data={readinessData}
              trendBars={getTrendBars('readiness')}
              weeklyScores={getWeeklyScores('readiness')}
            />
            <ScoreCard
              label="Sleep"
              data={sleepData}
              trendBars={getTrendBars('sleep')}
              weeklyScores={getWeeklyScores('sleep')}
            />
            <ScoreCard
              label="Activity"
              data={activityData}
              trendBars={getTrendBars('activity')}
              weeklyScores={getWeeklyScores('activity')}
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
              <CardioCard
                data={cardioData}
                dateWindow={dateWindow}
                allData={appData.cardiovascularage}
                selectedDate={selectedDate}
              />
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
