import { calendarDates } from './dateService.js';
import { calculateSleepRegularity, getLocalClockMinutes } from './sleepRegularity.js';
import { getScoreColor, getScoreStatus } from './colors.js';
import { getTrendPeriods } from './trendRanges.js';

const getLongSleep = records => records?.find(record => record.type === 'long_sleep') || records?.[0] || null;

const mean = values => values.length
  ? values.reduce((sum, value) => sum + value, 0) / values.length
  : null;

const circularMean = values => {
  if (!values.length) return null;
  const radians = values.map(value => (value / 1440) * Math.PI * 2);
  const sine = mean(radians.map(Math.sin));
  const cosine = mean(radians.map(Math.cos));
  return ((Math.atan2(sine, cosine) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2) * 1440;
};

const dailyPoint = (groupedSleepModel, date) => {
  const record = getLongSleep(groupedSleepModel?.[date]);
  const regularity = calculateSleepRegularity(groupedSleepModel, date);
  return {
    key: date,
    date,
    startDate: date,
    endDate: date,
    score: regularity?.score ?? null,
    status: regularity?.status ?? null,
    color: regularity?.color ?? null,
    bedtimeMinutes: getLocalClockMinutes(record?.bedtime_start),
    wakeMinutes: getLocalClockMinutes(record?.bedtime_end),
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
  const score = mean(days.map(day => day.score).filter(value => value !== null));
  const roundedScore = score === null ? null : Math.round(score);
  return Object.freeze({
    key: period.key,
    date: period.key,
    label: period.label,
    startDate: period.startDate,
    endDate: period.endDate,
    score: roundedScore,
    status: roundedScore === null ? null : getScoreStatus(roundedScore),
    color: roundedScore === null ? null : getScoreColor(roundedScore),
    bedtimeMinutes: circularMean(days.map(day => day.bedtimeMinutes).filter(value => value !== null)),
    wakeMinutes: circularMean(days.map(day => day.wakeMinutes).filter(value => value !== null)),
  });
};

export function getSleepRegularityHistory(groupedSleepModel, selectedDate, length = 7) {
  return Object.freeze(Array.from({ length }, (_, index) => {
    const date = calendarDates.addDays(selectedDate, index - (length - 1));
    return Object.freeze(dailyPoint(groupedSleepModel, date));
  }));
}

export function getSleepRegularityTrendSeries(groupedSleepModel, mode, anchorDate, range) {
  let points;
  if (mode === 'day') {
    points = getSleepRegularityHistory(groupedSleepModel, anchorDate, range);
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

export const formatClockMinutes = value => {
  if (value === null || value === undefined) return '--';
  const minutes = ((Math.round(value) % 1440) + 1440) % 1440;
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
};
