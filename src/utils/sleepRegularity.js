import { calendarDates } from './dateService.js';
import { getScoreColor, getScoreStatus } from './colors.js';

const MINIMUM_NIGHTS = 5;
const WINDOW_DAYS = 14;
const MINUTES_PER_DAY = 24 * 60;

export const getLocalClockMinutes = value => {
  const match = String(value || '').match(/T(\d{2}):(\d{2})/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
};

const circularMean = values => {
  const angles = values.map(value => (value / MINUTES_PER_DAY) * Math.PI * 2);
  const sin = angles.reduce((sum, angle) => sum + Math.sin(angle), 0) / angles.length;
  const cos = angles.reduce((sum, angle) => sum + Math.cos(angle), 0) / angles.length;
  const angle = (Math.atan2(sin, cos) + Math.PI * 2) % (Math.PI * 2);
  return (angle / (Math.PI * 2)) * MINUTES_PER_DAY;
};

const circularDistance = (left, right) => {
  const distance = Math.abs(left - right);
  return Math.min(distance, MINUTES_PER_DAY - distance);
};

const meanDeviation = values => {
  const mean = circularMean(values);
  return values.reduce((sum, value) => sum + circularDistance(value, mean), 0) / values.length;
};

export function calculateSleepRegularity(groupedSleepModel, selectedDate) {
  if (!selectedDate || !calendarDates.isValidDate(selectedDate)) return null;
  const startDate = calendarDates.addDays(selectedDate, -(WINDOW_DAYS - 1));
  const nights = Object.entries(groupedSleepModel || {})
    .filter(([date]) => date >= startDate && date <= selectedDate)
    .map(([, records]) => records?.find(record => record.type === 'long_sleep') || records?.[0])
    .map(record => ({
      bedtime: getLocalClockMinutes(record?.bedtime_start),
      wakeTime: getLocalClockMinutes(record?.bedtime_end),
    }))
    .filter(night => night.bedtime !== null && night.wakeTime !== null);
  if (nights.length < MINIMUM_NIGHTS) return null;

  const bedtimeDeviation = meanDeviation(nights.map(night => night.bedtime));
  const wakeDeviation = meanDeviation(nights.map(night => night.wakeTime));
  const averageDeviationMinutes = (bedtimeDeviation + wakeDeviation) / 2;
  const score = Math.max(0, Math.min(100, Math.round(100 - averageDeviationMinutes * 0.5)));
  return Object.freeze({
    score,
    status: getScoreStatus(score),
    color: getScoreColor(score),
    nights: nights.length,
    averageDeviationMinutes: Math.round(averageDeviationMinutes),
  });
}
