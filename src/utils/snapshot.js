import {
  buildActivityCardSnapshot,
  buildBiometricsCardSnapshot,
  buildCardiovascularCardSnapshot,
  buildReadinessCardSnapshot,
  buildSleepCardSnapshot,
  buildStressResilienceCardSnapshot,
} from './cardSnapshots.js';

export function buildDashboardSnapshot({ selectedDate, dateWindow, appData }) {
  const sections = [];
  const readinessData = appData.readiness?.[selectedDate]?.[0];
  const sleepData = appData.sleep?.[selectedDate]?.[0];
  const activityData = appData.activity?.[selectedDate]?.[0];
  const stressData = appData.stress?.[selectedDate]?.[0];
  const resilienceData = appData.resilience?.[selectedDate]?.[0];
  const cardioData = appData.cardiovascularage?.[selectedDate]?.[0];
  const spo2Data = appData.spo2?.[selectedDate]?.[0];
  const sleepmodelData = appData.sleepmodel?.[selectedDate] || [];
  const sleeptimeData = appData.sleeptime?.[selectedDate]?.[0];
  const daytimeStressData = appData.daytimestress?.[selectedDate] || [];
  const heartrateData = appData.heartrate?.[selectedDate] || [];
  const temperatureData = appData.temperature?.[selectedDate] || [];

  if (readinessData) sections.push(buildReadinessCardSnapshot(readinessData));
  if (sleepData) sections.push(buildSleepCardSnapshot(sleepData, sleepmodelData, sleeptimeData));
  if (activityData) sections.push(buildActivityCardSnapshot(activityData));
  if (stressData || resilienceData || daytimeStressData.length) {
    sections.push(buildStressResilienceCardSnapshot(stressData, resilienceData, daytimeStressData));
  }
  if (cardioData) {
    sections.push(buildCardiovascularCardSnapshot(
      cardioData,
      dateWindow,
      appData.cardiovascularage,
      selectedDate,
    ));
  }
  if (spo2Data || heartrateData.length || temperatureData.length) {
    sections.push(buildBiometricsCardSnapshot(spo2Data, heartrateData, temperatureData));
  }

  if (dateWindow?.length) {
    sections.push([
      'Dashboard Date Window',
      '=====================',
      ...dateWindow.map(date => `  ${date}${date === selectedDate ? ' (selected)' : ''}`),
    ].join('\n'));
  }

  return [
    `Oura Insights Dashboard Snapshot\n================================\nDate: ${selectedDate}`,
    ...sections,
    `================================\nSnapshot generated: ${new Date().toLocaleString()}`,
  ].join('\n\n');
}
