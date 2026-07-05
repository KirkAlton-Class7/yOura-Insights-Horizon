const DAY_SECONDS = 24 * 60 * 60;
const FIVE_MINUTE_SECONDS = 5 * 60;
const COMPLETE_DAY_INTERVALS = 288;

export const WEAR_COVERAGE_BANDS = Object.freeze([
  {
    minimum: 90,
    range: '90–100%',
    label: 'Excellent',
    level: 'optimal',
    description: 'Nearly complete data; ideal for accurate insights.',
  },
  {
    minimum: 75,
    range: '75–89%',
    label: 'Good',
    level: 'good',
    description: 'Enough data for reliable daily trends in most cases.',
  },
  {
    minimum: 50,
    range: '50–74%',
    label: 'Fair',
    level: 'fair',
    description: 'Some useful data, but important metrics may be incomplete.',
  },
  {
    minimum: 0,
    range: '0–49%',
    label: 'Poor',
    level: 'bad',
    description: 'Significant gaps; daily scores and trends may be less reliable.',
  },
]);

export const formatWearDuration = seconds => {
  const totalMinutes = Math.max(0, Math.round(Number(seconds || 0) / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
};

export function getWearCoverage(activityData) {
  const rawNonWear = activityData?.non_wear_time;
  const nonWearSeconds = Number(rawNonWear);
  if (rawNonWear === null || rawNonWear === undefined || rawNonWear === '' || !Number.isFinite(nonWearSeconds) || nonWearSeconds < 0) {
    return { available: false };
  }

  const intervals = String(activityData?.class_5_min || '').replace(/[^0-9]/g, '').length;
  const isPartial = intervals > 0 && intervals < COMPLETE_DAY_INTERVALS;
  const recordedSeconds = isPartial ? intervals * FIVE_MINUTE_SECONDS : DAY_SECONDS;
  const unclassifiedSeconds = isPartial ? DAY_SECONDS - recordedSeconds : 0;
  const recordedPercentage = Math.max(0, Math.min(100, (recordedSeconds / DAY_SECONDS) * 100));
  const boundedNonWear = Math.min(nonWearSeconds, DAY_SECONDS);
  const coverage = isPartial
    ? null
    : Math.max(0, Math.min(100, ((DAY_SECONDS - boundedNonWear) / DAY_SECONDS) * 100));
  const band = isPartial
    ? null
    : WEAR_COVERAGE_BANDS.find(({ minimum }) => coverage >= minimum) || WEAR_COVERAGE_BANDS.at(-1);

  return {
    available: true,
    band,
    coverage,
    isPartial,
    nonWearSeconds,
    recordedPercentage,
    recordedSeconds,
    unclassifiedSeconds,
  };
}
