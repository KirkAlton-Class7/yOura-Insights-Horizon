import { calendarDates } from './dateService.js';

const FIVE_MINUTES = 5;
const ONE_HOUR_INTERVALS = 12;

export const HEART_RATE_BENEFIT_ZONES = Object.freeze({
  metabolicMinimum: 90,
  metabolicMaximum: 107,
  cardiovascularMinimum: 108,
});

export const HEART_RATE_ZONES = Object.freeze([
  Object.freeze({ label: 'Zone 0', minimum: Number.NEGATIVE_INFINITY, maximum: 89 }),
  Object.freeze({ label: 'Zone 1', minimum: 90, maximum: 107 }),
  Object.freeze({ label: 'Zone 2', minimum: 108, maximum: 124 }),
  Object.freeze({ label: 'Zone 3', minimum: 125, maximum: 143 }),
  Object.freeze({ label: 'Zone 4', minimum: 144, maximum: 161 }),
  Object.freeze({ label: 'Zone 5', minimum: 162, maximum: Number.POSITIVE_INFINITY }),
]);

export const MOVEMENT_BUCKET_LABELS = Object.freeze(Array.from({ length: 24 }, (_, hour) => {
  const displayHour = hour % 12 || 12;
  return `${displayHour} ${hour < 12 ? 'AM' : 'PM'}`;
}));

const finiteNumber = value => {
  if (value === '' || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

export const getActivityTimeSeconds = record => (
  ['high_activity_time', 'medium_activity_time', 'low_activity_time']
    .reduce((total, key) => total + Math.max(0, finiteNumber(record?.[key]) || 0), 0)
);

export const ACTIVITY_INTENSITY_LEVELS = Object.freeze([
  Object.freeze({ key: 'sedentary', label: 'Sedentary', source: 'sedentary_time', color: '#64748b' }),
  Object.freeze({ key: 'light', label: 'Light', source: 'low_activity_time', color: '#06b6d4' }),
  Object.freeze({ key: 'moderate', label: 'Moderate', source: 'medium_activity_time', color: '#f59e0b' }),
  Object.freeze({ key: 'vigorous', label: 'Vigorous', source: 'high_activity_time', color: '#f43f5e' }),
]);

export const getActivityIntensityDurations = record => Object.freeze(
  ACTIVITY_INTENSITY_LEVELS.map(level => Object.freeze({
    ...level,
    seconds: Math.max(0, finiteNumber(record?.[level.source]) || 0),
  })),
);

export const getGoalProgress = record => {
  const activeCalories = finiteNumber(record?.active_calories);
  const targetCalories = finiteNumber(record?.target_calories);
  if (activeCalories === null || targetCalories === null || targetCalories <= 0) return null;
  return Math.max(0, Math.round((activeCalories / targetCalories) * 100));
};

export function getDailyMovementBuckets(record) {
  const classes = String(record?.class_5_min || '').match(/[0-5]/g) || [];
  if (classes.length) {
    return Object.freeze(MOVEMENT_BUCKET_LABELS.map((label, bucketIndex) => {
      const start = bucketIndex * ONE_HOUR_INTERVALS;
      const bucket = classes.slice(start, start + ONE_HOUR_INTERVALS).map(Number);
      const activeMinutes = bucket.filter(value => value >= 3).length * FIVE_MINUTES;
      const intensity = bucket.length
        ? bucket.reduce((total, value) => total + Math.max(0, value - 2), 0) / bucket.length
        : 0;
      return Object.freeze({ label, hour: bucketIndex, activeMinutes, intensity, hasIntradayData: bucket.length > 0 });
    }));
  }

  return Object.freeze([Object.freeze({
    label: 'Daily total',
    hour: null,
    activeMinutes: Math.round(getActivityTimeSeconds(record) / 60),
    intensity: null,
    hasIntradayData: false,
  })]);
}

const sampleMinutes = (records, index) => {
  const current = records[index]?.timestamp;
  const next = records[index + 1]?.timestamp;
  if (!current || !next) return FIVE_MINUTES;
  const difference = (Date.parse(next) - Date.parse(current)) / 60000;
  return Number.isFinite(difference) && difference > 0 ? Math.min(FIVE_MINUTES, difference) : FIVE_MINUTES;
};

const benefitMinutesForDay = records => {
  const sorted = [...(records || [])]
    .filter(record => finiteNumber(record?.bpm) !== null)
    .sort((left, right) => String(left.timestamp || '').localeCompare(String(right.timestamp || '')));
  return sorted.reduce((benefits, record, index) => {
    const bpm = Number(record.bpm);
    const minutes = sampleMinutes(sorted, index);
    const zoneIndex = HEART_RATE_ZONES.findIndex(zone => bpm >= zone.minimum && bpm <= zone.maximum);
    if (zoneIndex >= 0) benefits.zoneMinutes[zoneIndex] += minutes;
    if (bpm >= HEART_RATE_BENEFIT_ZONES.cardiovascularMinimum) benefits.cardiovascularMinutes += minutes;
    else if (bpm >= HEART_RATE_BENEFIT_ZONES.metabolicMinimum && bpm <= HEART_RATE_BENEFIT_ZONES.metabolicMaximum) benefits.metabolicMinutes += minutes;
    return benefits;
  }, { metabolicMinutes: 0, cardiovascularMinutes: 0, zoneMinutes: [0, 0, 0, 0, 0, 0] });
};

export const getDailyActivityBenefits = records => {
  const benefits = benefitMinutesForDay(records);
  return Object.freeze({
    metabolicMinutes: Math.round(benefits.metabolicMinutes),
    cardiovascularMinutes: Math.round(benefits.cardiovascularMinutes),
    zoneMinutes: Object.freeze(benefits.zoneMinutes.map(Math.round)),
  });
};

export const getDailyHeartRateZoneMinutes = records => getDailyActivityBenefits(records).zoneMinutes;

export function getWeeklyActivityBenefits(appData, anchorDate) {
  const dates = calendarDates.getWeekDates(anchorDate);
  const hasHeartRateData = dates.some(date => (appData.heartrate?.[date] || []).some(record => finiteNumber(record?.bpm) !== null));
  const days = dates.map(date => {
    const activity = appData.activity?.[date]?.[0] || null;
    const benefits = getDailyActivityBenefits(appData.heartrate?.[date]);
    return Object.freeze({
      date,
      label: calendarDates.getDatePresentation(date).weekdayShort,
      metabolicMinutes: benefits.metabolicMinutes,
      cardiovascularMinutes: benefits.cardiovascularMinutes,
      zoneMinutes: benefits.zoneMinutes,
      activityMinutes: Math.round(getActivityTimeSeconds(activity) / 60),
    });
  });
  const zoneMinutes = days.reduce(
    (totals, day) => totals.map((total, index) => total + day.zoneMinutes[index]),
    [0, 0, 0, 0, 0, 0],
  );
  return Object.freeze({ days: Object.freeze(days), hasHeartRateData, zoneMinutes: Object.freeze(zoneMinutes) });
}

export const formatActivityDuration = seconds => {
  const totalMinutes = Math.max(0, Math.round(Number(seconds || 0) / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours && minutes) return `${hours}h ${minutes}m`;
  if (hours) return `${hours}h`;
  return `${minutes}m`;
};
