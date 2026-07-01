export const REQUIRED_DATA_KEYS = [
  'activity',
  'readiness',
  'sleep',
  'spo2',
  'heartrate',
  'temperature',
  'sleeptime',
  'stress',
  'resilience',
  'daytimestress',
  'cardiovascularage',
  'sleepmodel',
];

const RESILIENCE_LEVELS = new Set(['limited', 'adequate', 'solid', 'strong', 'exceptional']);
const STRESS_SUMMARIES = new Set(['restorative', 'normal', 'balanced', 'stressful']);

const isFiniteNumber = value => (
  value !== '' && value !== null && value !== undefined && Number.isFinite(Number(value))
);

const isNumberInRange = (value, minimum, maximum) => (
  isFiniteNumber(value) && Number(value) >= minimum && Number(value) <= maximum
);

const isPlainObject = value => (
  value !== null && typeof value === 'object' && !Array.isArray(value)
);

const isDate = value => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

const isTimestamp = value => (
  typeof value === 'string' && value.length > 0 && !Number.isNaN(Date.parse(value))
);

const hasValidContributors = value => (
  isPlainObject(value)
  && Object.keys(value).length > 0
  && Object.values(value).every(score => isNumberInRange(score, 0, 100))
);

const recordsFor = groupedData => Object.values(groupedData || {}).flat();

const DATASET_RULES = {
  activity: [
    ['score', row => isNumberInRange(row.score, 0, 100)],
    ['steps', row => isNumberInRange(row.steps, 0, 200000)],
    ['active calories', row => isNumberInRange(row.active_calories, 0, 20000)],
    ['contributors', row => hasValidContributors(row.contributors)],
  ],
  readiness: [
    ['score', row => isNumberInRange(row.score, 0, 100)],
    ['temperature deviation', row => isNumberInRange(row.temperature_deviation, -10, 10)],
    ['contributors', row => hasValidContributors(row.contributors)],
  ],
  sleep: [
    ['score', row => isNumberInRange(row.score, 0, 100)],
    ['contributors', row => hasValidContributors(row.contributors)],
  ],
  spo2: [
    ['SpO2 percentage', row => (
      isPlainObject(row.spo2_percentage)
      && isNumberInRange(row.spo2_percentage.average, 50, 100)
    )],
    ['breathing disturbance index', row => isNumberInRange(row.breathing_disturbance_index, 0, 100)],
  ],
  heartrate: [
    ['heart rate', row => isNumberInRange(row.bpm, 20, 250)],
  ],
  temperature: [
    ['skin temperature', row => isNumberInRange(row.skin_temp, 20, 45)],
  ],
  sleeptime: [
    ['optimal bedtime', row => (
      isPlainObject(row.optimal_bedtime)
      && isFiniteNumber(row.optimal_bedtime.start_offset)
      && isFiniteNumber(row.optimal_bedtime.end_offset)
    )],
  ],
  stress: [
    ['high-stress duration', row => isNumberInRange(row.stress_high, 0, 86400)],
    ['high-recovery duration', row => isNumberInRange(row.recovery_high, 0, 86400)],
    ['day summary', row => STRESS_SUMMARIES.has(String(row.day_summary).toLowerCase())],
  ],
  resilience: [
    ['resilience level', row => RESILIENCE_LEVELS.has(String(row.level).toLowerCase())],
    ['contributors', row => hasValidContributors(row.contributors)],
  ],
  daytimestress: [
    ['stress value', row => isNumberInRange(row.stress_value, 0, 100)],
    ['recovery value', row => isNumberInRange(row.recovery_value, 0, 100)],
  ],
  cardiovascularage: [
    ['vascular age', row => isNumberInRange(row.vascular_age, 18, 100)],
    ['pulse wave velocity', row => isNumberInRange(row.pulse_wave_velocity, 2, 20)],
  ],
  sleepmodel: [
    ['deep-sleep duration', row => isNumberInRange(row.deep_sleep_duration, 0, 86400)],
    ['REM-sleep duration', row => isNumberInRange(row.rem_sleep_duration, 0, 86400)],
    ['light-sleep duration', row => isNumberInRange(row.light_sleep_duration, 0, 86400)],
    ['time in bed', row => isNumberInRange(row.time_in_bed, 0, 86400)],
    ['average heart rate', row => isNumberInRange(row.average_heart_rate, 20, 250)],
    ['average HRV', row => isNumberInRange(row.average_hrv, 0, 500)],
    ['bedtime start', row => isTimestamp(row.bedtime_start)],
    ['bedtime end', row => isTimestamp(row.bedtime_end)],
  ],
};

export function getDashboardValidationErrors(data) {
  const errors = [];

  for (const dataKey of REQUIRED_DATA_KEYS) {
    const groupedData = data?.[dataKey];
    const records = recordsFor(groupedData);

    if (!groupedData || records.length === 0) {
      errors.push(`${dataKey} contains no records.`);
      continue;
    }

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
