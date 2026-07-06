import { calendarDates } from './dateService.js';

export const TREND_RANGE_CONFIG = Object.freeze({
  day: Object.freeze({ minimum: 3, maximum: 30, defaultValue: 7, unit: 'days' }),
  week: Object.freeze({ minimum: 3, maximum: 15, defaultValue: 4, unit: 'weeks' }),
  month: Object.freeze({ minimum: 3, maximum: 24, defaultValue: 3, unit: 'months' }),
});

export const getTrendPeriods = (mode, anchorDate, count) => {
  if (mode === 'week') {
    const currentStart = calendarDates.getWeekDates(anchorDate)[0];
    return Object.freeze(Array.from({ length: count }, (_, index) => {
      const startDate = calendarDates.addDays(currentStart, (index - (count - 1)) * 7);
      const endDate = calendarDates.addDays(startDate, 6);
      const date = calendarDates.getDatePresentation(startDate);
      return Object.freeze({ key: startDate, label: `${date.monthShort} ${date.dayOfMonth}`, startDate, endDate });
    }));
  }
  if (mode === 'month') {
    const currentMonth = calendarDates.toYearMonth(anchorDate);
    return Object.freeze(Array.from({ length: count }, (_, index) => {
      const key = calendarDates.addMonths(currentMonth, index - (count - 1));
      const { startDate, endDate } = calendarDates.getMonthRange(key);
      const month = calendarDates.getYearMonthPresentation(key);
      return Object.freeze({ key, label: month.monthName.slice(0, 3), startDate, endDate });
    }));
  }
  throw new Error(`Unsupported trend period: ${mode}`);
};

export const recordsInPeriod = (groupedRecords, startDate, endDate) => Object.keys(groupedRecords || {})
  .filter(date => date >= startDate && date <= endDate)
  .flatMap(date => groupedRecords[date] || []);
