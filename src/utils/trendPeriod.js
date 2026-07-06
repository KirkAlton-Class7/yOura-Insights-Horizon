import { calendarDates } from './dateService.js';

export const TREND_PERIOD_LABELS = Object.freeze({
  day: 'Day',
  dayToDay: 'Day to day',
  week: 'Week',
  weekToWeek: 'Week to week',
  month: 'Month',
  monthToMonth: 'Month to month',
});

export const formatTrendDateRange = (startDate, endDate = startDate) => {
  if (!startDate || !endDate) return '';
  const start = calendarDates.getDatePresentation(startDate);
  const end = calendarDates.getDatePresentation(endDate);
  if (startDate === endDate) return `${start.monthShort} ${start.dayOfMonth}, ${start.year}`;
  if (start.year === end.year && start.month === end.month) {
    return `${start.monthShort} ${start.dayOfMonth}–${end.dayOfMonth}, ${start.year}`;
  }
  if (start.year === end.year) {
    return `${start.monthShort} ${start.dayOfMonth} – ${end.monthShort} ${end.dayOfMonth}, ${start.year}`;
  }
  return `${start.monthShort} ${start.dayOfMonth}, ${start.year} – ${end.monthShort} ${end.dayOfMonth}, ${end.year}`;
};

export const formatTrendPeriod = (kind, startDate, endDate = startDate) => {
  const label = TREND_PERIOD_LABELS[kind] || kind;
  const range = formatTrendDateRange(startDate, endDate);
  return range ? `${label} · ${range}` : label;
};
