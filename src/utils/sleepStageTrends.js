import { calendarDates } from './dateService.js';
import { getLongSleepRecord } from './readinessDetails.js';
import { getSleepStageSummary } from './sleepDetails.js';

const emptyStages = () => ({ awake: 0, rem: 0, light: 0, deep: 0, observed: 0 });

const dailyStages = (appData, date) => {
  const summary = getSleepStageSummary(getLongSleepRecord(appData.sleepmodel?.[date]));
  if (!summary || summary.totalSleep <= 0) return null;
  return Object.freeze(Object.fromEntries(summary.stages.map(stage => [stage.key, stage.seconds / 3600])));
};

const averageStages = (appData, startDate, endDate) => {
  const accumulator = emptyStages();
  Object.keys(appData.sleepmodel || {})
    .filter(date => date >= startDate && date <= endDate)
    .forEach(date => {
      const stages = dailyStages(appData, date);
      if (!stages) return;
      accumulator.observed += 1;
      ['awake', 'rem', 'light', 'deep'].forEach(key => { accumulator[key] += stages[key]; });
    });
  if (!accumulator.observed) return null;
  return Object.freeze(Object.fromEntries(
    ['awake', 'rem', 'light', 'deep'].map(key => [key, accumulator[key] / accumulator.observed]),
  ));
};

const point = (key, label, startDate, endDate, stages) => Object.freeze({
  key, label, startDate, endDate, stages,
  totalSleep: stages ? stages.rem + stages.light + stages.deep : null,
  totalDuration: stages ? stages.awake + stages.rem + stages.light + stages.deep : null,
});

export function getSleepStageTrendSeries(appData, mode, anchorDate, requestedRange) {
  const range = requestedRange ?? (mode === 'day' ? 7 : mode === 'week' ? 4 : 3);
  let points;
  if (mode === 'day') {
    const start = calendarDates.addDays(anchorDate, -(range - 1));
    points = Array.from({ length: range }, (_, index) => {
      const date = calendarDates.addDays(start, index);
      return point(date, calendarDates.getDatePresentation(date).weekdayShort, date, date, dailyStages(appData, date));
    });
  } else if (mode === 'week') {
    const currentStart = calendarDates.getWeekDates(anchorDate)[0];
    points = Array.from({ length: range }, (_, index) => {
      const startDate = calendarDates.addDays(currentStart, (index - (range - 1)) * 7);
      const endDate = calendarDates.addDays(startDate, 6);
      const date = calendarDates.getDatePresentation(startDate);
      return point(startDate, `${date.monthShort} ${date.dayOfMonth}`, startDate, endDate, averageStages(appData, startDate, endDate));
    });
  } else if (mode === 'month') {
    const currentMonth = calendarDates.toYearMonth(anchorDate);
    points = Array.from({ length: range }, (_, index) => {
      const monthKey = calendarDates.addMonths(currentMonth, index - (range - 1));
      const { startDate, endDate } = calendarDates.getMonthRange(monthKey);
      const month = calendarDates.getYearMonthPresentation(monthKey);
      return point(monthKey, month.monthName.slice(0, 3), startDate, endDate, averageStages(appData, startDate, endDate));
    });
  } else {
    throw new Error(`Unknown sleep-stage mode: ${mode}`);
  }
  return Object.freeze({
    points: Object.freeze(points),
    windowStart: points[0].startDate,
    windowEnd: points[points.length - 1].endDate,
  });
}

export function shiftSleepStageAnchor(anchorDate, mode, direction, range) {
  if (mode === 'day') return calendarDates.addDays(anchorDate, direction * range);
  if (mode === 'week') return calendarDates.addDays(anchorDate, direction * range * 7);
  if (mode === 'month') return calendarDates.addDateMonths(anchorDate, direction * range);
  throw new Error(`Unknown sleep-stage mode: ${mode}`);
}
