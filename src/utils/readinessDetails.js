import { calendarDates } from './dateService.js';

const finiteNumber = value => {
  if (value === '' || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

export const getLongSleepRecord = records => (
  records?.find(record => record.type === 'long_sleep') || records?.[0] || null
);

export function getReadinessDetailPeriod(appData, periodStart, selectedDate) {
  return Array.from({ length: 14 }, (_, index) => {
    const date = calendarDates.addDays(periodStart, index);
    const readiness = appData?.readiness?.[date]?.[0] || null;
    const sleepModel = getLongSleepRecord(appData?.sleepmodel?.[date]);
    return Object.freeze({
      date,
      isSelected: date === selectedDate,
      readinessScore: finiteNumber(readiness?.score),
      restingHeartRate: finiteNumber(sleepModel?.resting_heart_rate ?? sleepModel?.lowest_heart_rate),
    });
  });
}

export const getReadinessPeriodStart = date => calendarDates.getWeekDates(date)[0];

export function parseMetricSeries(value) {
  let series = value;
  if (typeof value === 'string') {
    try {
      series = JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (!series || !Array.isArray(series.items)) return null;

  const points = series.items.map((item, index) => ({
    index,
    value: finiteNumber(item),
  }));
  const observed = points.filter(point => point.value !== null);
  if (observed.length < 2) return null;

  return Object.freeze({
    intervalSeconds: finiteNumber(series.interval),
    points: Object.freeze(points),
    timestamp: series.timestamp || '',
    values: Object.freeze(observed.map(point => point.value)),
  });
}
