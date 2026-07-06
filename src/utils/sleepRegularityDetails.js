import { calendarDates } from './dateService.js';
import { calculateSleepRegularity, getLocalClockMinutes } from './sleepRegularity.js';

const getLongSleep = records => records?.find(record => record.type === 'long_sleep') || records?.[0] || null;

export function getSleepRegularityHistory(groupedSleepModel, selectedDate, length = 7) {
  return Object.freeze(Array.from({ length }, (_, index) => {
    const date = calendarDates.addDays(selectedDate, index - (length - 1));
    const record = getLongSleep(groupedSleepModel?.[date]);
    const bedtimeMinutes = getLocalClockMinutes(record?.bedtime_start);
    const wakeMinutes = getLocalClockMinutes(record?.bedtime_end);
    const regularity = calculateSleepRegularity(groupedSleepModel, date);
    return Object.freeze({
      date,
      score: regularity?.score ?? null,
      status: regularity?.status ?? null,
      color: regularity?.color ?? null,
      bedtimeMinutes,
      wakeMinutes,
    });
  }));
}

export const formatClockMinutes = value => {
  if (value === null || value === undefined) return '--';
  const minutes = ((Math.round(value) % 1440) + 1440) % 1440;
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
};
