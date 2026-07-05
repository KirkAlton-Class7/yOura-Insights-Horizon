import { calendarDates } from './dateService.js';

export const groupDatesIntoWeeks = dates => {
  const weekStarts = new Set(
    Array.from(new Set(dates)).map(date => calendarDates.getWeekDates(date)[0]),
  );
  return Array.from(weekStarts).sort().map(weekStart => calendarDates.getWeekDates(weekStart));
};

export const getWeekday = date => calendarDates.getWeekday(date);

export const selectDateInWeek = (currentDate, dates) => {
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

export const findWeekIndex = (weeks, date) => {
  const index = weeks.findIndex(week => week.includes(date));
  return index < 0 ? 0 : index;
};
