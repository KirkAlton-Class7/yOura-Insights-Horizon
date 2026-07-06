import { SEMANTIC_COLORS } from './colors.js';
import { calendarDates } from './dateService.js';

const HOUR_SECONDS = 60 * 60;
const MINIMUM_RECENT_NIGHTS = 5;
const DEBT_WINDOW_DAYS = 14;
const BASELINE_WINDOW_DAYS = 90;
const DEBT_DISPLAY_INCREMENT_SECONDS = 5 * 60;

export const SLEEP_DEBT_CATEGORIES = Object.freeze({
  none: Object.freeze({
    label: 'None',
    color: SEMANTIC_COLORS.optimal,
    description: 'You’ve met your sleep need consistently, which has kept you free of sleep debt. Nice work—your body and mind will thank you for it.',
  }),
  low: Object.freeze({
    label: 'Low',
    color: SEMANTIC_COLORS.good,
    description: 'You’re mostly meeting your sleep need, though there have been a few days when your total sleep has been a bit low. While low sleep debt might not have a big impact right away, staying consistent can help your body recharge more fully.',
  }),
  moderate: Object.freeze({
    label: 'Moderate',
    color: SEMANTIC_COLORS.fair,
    description: 'You’ve built up a moderate amount of sleep debt recently, likely from getting a bit less sleep than usual. Returning to a more consistent sleep pattern—whatever that looks like for you—can help you feel more recharged.',
  }),
  high: Object.freeze({
    label: 'High',
    color: SEMANTIC_COLORS.bad,
    description: 'Your sleep debt is high right now, which can make it harder to feel your best. If you’re able to, try to make more room for sleep in the days ahead—giving your body time to recover can really make a difference.',
  }),
});

const hasFiniteDuration = value => (
  value !== ''
  && value !== null
  && value !== undefined
  && Number.isFinite(Number(value))
  && Number(value) >= 0
);

const hasValidSessionDuration = record => (
  hasFiniteDuration(record?.total_sleep_duration)
  || (
    hasFiniteDuration(record?.deep_sleep_duration)
    && hasFiniteDuration(record?.rem_sleep_duration)
    && hasFiniteDuration(record?.light_sleep_duration)
  )
);

const sessionSleepSeconds = record => (
  hasFiniteDuration(record?.total_sleep_duration)
    ? Number(record.total_sleep_duration)
    : Number(record?.deep_sleep_duration || 0)
      + Number(record?.rem_sleep_duration || 0)
      + Number(record?.light_sleep_duration || 0)
);

export const getDailySleepSeconds = records => (records || [])
  .filter(hasValidSessionDuration)
  .reduce((total, record) => total + sessionSleepSeconds(record), 0);

const dailySleepTotals = groupedSleepModel => Object.entries(groupedSleepModel || {})
  .map(([date, records]) => ({
    date,
    totalSleepSeconds: getDailySleepSeconds(records),
  }))
  .filter(({ date, totalSleepSeconds }) => (
    calendarDates.isValidDate(date)
    && totalSleepSeconds >= 2 * HOUR_SECONDS
    && totalSleepSeconds <= 14 * HOUR_SECONDS
  ))
  .sort((a, b) => a.date.localeCompare(b.date));

const percentile = (values, position) => {
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * position;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
};

export const getSleepDebtCategory = debtSeconds => {
  const seconds = Math.max(0, Number(debtSeconds || 0));
  if (seconds < 60) return SLEEP_DEBT_CATEGORIES.none;
  if (seconds < 2 * HOUR_SECONDS) return SLEEP_DEBT_CATEGORIES.low;
  if (seconds <= 5 * HOUR_SECONDS) return SLEEP_DEBT_CATEGORIES.moderate;
  return SLEEP_DEBT_CATEGORIES.high;
};

export const formatSleepDebt = seconds => {
  const roundedMinutes = Math.max(0, Math.round(Number(seconds || 0) / 60));
  if (roundedMinutes === 0) return '0m';
  const hours = Math.floor(roundedMinutes / 60);
  const minutes = roundedMinutes % 60;
  if (hours && minutes) return `${hours}h ${minutes}m`;
  if (hours) return `${hours}h`;
  return `${minutes}m`;
};

export const getSleepDebtMarkerPosition = debtSeconds => {
  const hours = Math.max(0, Number(debtSeconds || 0)) / HOUR_SECONDS;
  if (hours === 0) return 2;
  if (hours < 2) return 2 + (hours / 2) * 23;
  if (hours <= 5) return 27 + ((hours - 2) / 3) * 46;
  return 75 + Math.min((hours - 5) / 3, 1) * 23;
};

export function calculateSleepDebt(groupedSleepModel, selectedDate) {
  if (!selectedDate || !calendarDates.isValidDate(selectedDate)) return null;

  const totals = dailySleepTotals(groupedSleepModel);
  const baselineStart = calendarDates.addDays(selectedDate, -(BASELINE_WINDOW_DAYS - 1));
  const debtStart = calendarDates.addDays(selectedDate, -(DEBT_WINDOW_DAYS - 1));
  const baseline = totals.filter(({ date }) => date >= baselineStart && date <= selectedDate);
  const recent = baseline.filter(({ date }) => date >= debtStart);

  if (recent.length < MINIMUM_RECENT_NIGHTS || baseline.length < MINIMUM_RECENT_NIGHTS) return null;

  // The export omits Oura's proprietary Sleep Need value. A 60th-percentile
  // baseline resists unusually short nights while remaining personal to the user.
  const sleepNeedSeconds = percentile(baseline.map(({ totalSleepSeconds }) => totalSleepSeconds), 0.6);
  const weightedDebt = recent.reduce((total, night, index) => {
    // Recent nights count progressively more, from 25% for the oldest to 100%
    // for the selected date. Surplus sleep pays down earlier weighted deficits.
    const recencyWeight = recent.length === 1 ? 1 : 0.25 + (index / (recent.length - 1)) * 0.75;
    return total + (sleepNeedSeconds - night.totalSleepSeconds) * recencyWeight;
  }, 0);
  const debtSeconds = Math.max(
    0,
    Math.round(weightedDebt / DEBT_DISPLAY_INCREMENT_SECONDS) * DEBT_DISPLAY_INCREMENT_SECONDS,
  );
  const category = getSleepDebtCategory(debtSeconds);

  return Object.freeze({
    debtSeconds,
    category,
    sleepNeedSeconds: Math.round(sleepNeedSeconds / 60) * 60,
    recentNights: recent.length,
  });
}
