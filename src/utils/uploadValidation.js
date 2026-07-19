import { SUPPORTED_DATA_KEYS } from './datasets.js';
import { calendarDates } from './dateService.js';

const RESILIENCE_LEVELS = new Set(['limited', 'adequate', 'solid', 'strong', 'exceptional']);
const STRESS_SUMMARIES = new Set(['restorative', 'restored', 'normal', 'balanced', 'stressful']);

const isFiniteNumber = value => (
  value !== '' && value !== null && value !== undefined && Number.isFinite(Number(value))
);

const isMissing = value => value === '' || value === null || value === undefined;

const isOptionalNumberInRange = (value, minimum, maximum) => (
  isMissing(value) || isNumberInRange(value, minimum, maximum)
);

const isNumberInRange = (value, minimum, maximum) => (
  isFiniteNumber(value) && Number(value) >= minimum && Number(value) <= maximum
);

const isPlainObject = value => (
  value !== null && typeof value === 'object' && !Array.isArray(value)
);

const isDate = value => typeof value === 'string'
  && /^\d{4}-\d{2}-\d{2}$/.test(value)
  && calendarDates.isValidDate(value);

const isTimestamp = value => (
  typeof value === 'string' && value.length > 0 && calendarDates.isValidTimestamp(value)
);

const hasValidContributors = value => (
  isMissing(value)
  || (isPlainObject(value)
    && Object.values(value).every(score => isOptionalNumberInRange(score, 0, 100)))
);

const recordsFor = groupedData => Object.values(groupedData || {}).flat();

const DATASET_RULES = {
  activity: [
    ['score', row => isOptionalNumberInRange(row.score, 0, 100)],
    ['steps', row => isOptionalNumberInRange(row.steps, 0, 200000)],
    ['active calories', row => isOptionalNumberInRange(row.active_calories, 0, 20000)],
    ['contributors', row => hasValidContributors(row.contributors)],
  ],
  readiness: [
    ['score', row => isOptionalNumberInRange(row.score, 0, 100)],
    ['temperature deviation', row => isOptionalNumberInRange(row.temperature_deviation, -10, 10)],
    ['contributors', row => hasValidContributors(row.contributors)],
  ],
  sleep: [
    ['score', row => isOptionalNumberInRange(row.score, 0, 100)],
    ['contributors', row => hasValidContributors(row.contributors)],
  ],
  spo2: [
    ['SpO2 percentage', row => (
      isMissing(row.spo2_percentage)
      || (isPlainObject(row.spo2_percentage)
        && isOptionalNumberInRange(row.spo2_percentage.average, 50, 100))
    )],
    ['breathing disturbance index', row => isOptionalNumberInRange(row.breathing_disturbance_index, 0, 100)],
  ],
  heartrate: [
    ['heart rate', row => isOptionalNumberInRange(row.bpm, 20, 250)],
  ],
  temperature: [
    ['skin temperature', row => isOptionalNumberInRange(row.skin_temp, 20, 45)],
  ],
  sleeptime: [
    ['optimal bedtime', row => (
      isMissing(row.optimal_bedtime)
      || (isPlainObject(row.optimal_bedtime)
        && isOptionalNumberInRange(row.optimal_bedtime.start_offset, -172800, 172800)
        && isOptionalNumberInRange(row.optimal_bedtime.end_offset, -172800, 172800))
    )],
  ],
  stress: [
    ['high-stress duration', row => isOptionalNumberInRange(row.stress_high, 0, 86400)],
    ['high-recovery duration', row => isOptionalNumberInRange(row.recovery_high, 0, 86400)],
    ['day summary', row => isMissing(row.day_summary) || STRESS_SUMMARIES.has(String(row.day_summary).toLowerCase())],
  ],
  resilience: [
    ['resilience level', row => isMissing(row.level) || RESILIENCE_LEVELS.has(String(row.level).toLowerCase())],
    ['contributors', row => hasValidContributors(row.contributors)],
  ],
  daytimestress: [
    ['stress value', row => isOptionalNumberInRange(row.stress_value, 0, 100)],
    ['recovery value', row => isOptionalNumberInRange(row.recovery_value, 0, 100)],
  ],
  cardiovascularage: [
    ['vascular age', row => isOptionalNumberInRange(row.vascular_age, 18, 100)],
    ['pulse wave velocity', row => isOptionalNumberInRange(row.pulse_wave_velocity, 2, 20)],
  ],
  sleepmodel: [
    ['deep-sleep duration', row => isOptionalNumberInRange(row.deep_sleep_duration, 0, 86400)],
    ['REM-sleep duration', row => isOptionalNumberInRange(row.rem_sleep_duration, 0, 86400)],
    ['light-sleep duration', row => isOptionalNumberInRange(row.light_sleep_duration, 0, 86400)],
    ['time in bed', row => isOptionalNumberInRange(row.time_in_bed, 0, 86400)],
    ['average heart rate', row => isOptionalNumberInRange(row.average_heart_rate, 20, 250)],
    ['average HRV', row => isOptionalNumberInRange(row.average_hrv, 0, 500)],
    ['bedtime start', row => isMissing(row.bedtime_start) || isTimestamp(row.bedtime_start)],
    ['bedtime end', row => isMissing(row.bedtime_end) || isTimestamp(row.bedtime_end)],
  ],
};

export function getDashboardValidationErrors(data) {
  const errors = [];

  for (const dataKey of SUPPORTED_DATA_KEYS) {
    const groupedData = data?.[dataKey];
    const records = recordsFor(groupedData);

    if (!groupedData || records.length === 0) continue;

    const invalidDate = Object.entries(groupedData).some(([date, datedRecords]) => (
      !isDate(date)
      || !Array.isArray(datedRecords)
      || datedRecords.length === 0
      || datedRecords.some(row => !isDate(row.day || String(row.timestamp || '').slice(0, 10)))
    ));
    if (invalidDate) errors.push(`${dataKey} contains an invalid or missing date.`);

    for (const [label, isValid] of DATASET_RULES[dataKey] || []) {
      if (records.some(row => !isValid(row))) {
        errors.push(`${dataKey} contains an invalid ${label}.`);
      }
    }
  }

  return errors;
}

export function validateDashboardData(data) {
  const errors = getDashboardValidationErrors(data);
  if (errors.length > 0) {
    throw new Error(`Dashboard data validation failed: ${errors.join(' ')}`);
  }
  return true;
}
