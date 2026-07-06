import { calendarDates } from './dateService.js';
import { calculateSleepDebt, getDailySleepSeconds, getSleepDebtCategory } from './sleepDebt.js';
import { getTrendPeriods } from './trendRanges.js';

const mean = values => values.length
  ? values.reduce((sum, value) => sum + value, 0) / values.length
  : null;

const dailyPoint = (groupedSleepModel, date) => {
  const debt = calculateSleepDebt(groupedSleepModel, date);
  const totalSleepSeconds = getDailySleepSeconds(groupedSleepModel?.[date]);
  return {
    key: date,
    date,
    startDate: date,
    endDate: date,
    debtSeconds: debt?.debtSeconds ?? null,
    sleepNeedSeconds: debt?.sleepNeedSeconds ?? null,
    totalSleepSeconds: totalSleepSeconds > 0 ? totalSleepSeconds : null,
    category: debt?.category ?? null,
    sleepNeedMet: Boolean(totalSleepSeconds > 0 && debt && totalSleepSeconds >= debt.sleepNeedSeconds),
  };
};

const pointsBetween = (groupedSleepModel, startDate, endDate) => {
  const points = [];
  for (let date = startDate; date <= endDate; date = calendarDates.addDays(date, 1)) {
    points.push(dailyPoint(groupedSleepModel, date));
  }
  return points;
};

const aggregatePeriod = (groupedSleepModel, period) => {
  const days = pointsBetween(groupedSleepModel, period.startDate, period.endDate);
  const debtSeconds = mean(days.map(day => day.debtSeconds).filter(value => value !== null));
  const sleepNeedSeconds = mean(days.map(day => day.sleepNeedSeconds).filter(value => value !== null));
  const totalSleepSeconds = mean(days.map(day => day.totalSleepSeconds).filter(value => value !== null));
  return Object.freeze({
    key: period.key,
    date: period.key,
    label: period.label,
    startDate: period.startDate,
    endDate: period.endDate,
    debtSeconds,
    sleepNeedSeconds,
    totalSleepSeconds,
    category: debtSeconds === null ? null : getSleepDebtCategory(debtSeconds),
    sleepNeedMet: Boolean(totalSleepSeconds !== null && sleepNeedSeconds !== null && totalSleepSeconds >= sleepNeedSeconds),
  });
};

export function getSleepDebtHistory(groupedSleepModel, selectedDate, length = 7) {
  return Object.freeze(Array.from({ length }, (_, index) => {
    const date = calendarDates.addDays(selectedDate, index - (length - 1));
    return Object.freeze(dailyPoint(groupedSleepModel, date));
  }));
}

export function getSleepDebtTrendSeries(groupedSleepModel, mode, anchorDate, range) {
  let points;
  if (mode === 'day') {
    points = getSleepDebtHistory(groupedSleepModel, anchorDate, range);
  } else {
    points = getTrendPeriods(mode, anchorDate, range)
      .map(period => aggregatePeriod(groupedSleepModel, period));
  }
  return Object.freeze({
    points: Object.freeze(points),
    windowStart: points[0]?.startDate,
    windowEnd: points.at(-1)?.endDate,
  });
}
