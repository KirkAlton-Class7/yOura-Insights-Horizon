import { formatWearDuration, getWearCoverage } from './wearCoverage.js';
import { calendarDates } from './dateService.js';
import { calculateSleepDebt, formatSleepDebt } from './sleepDebt.js';

const READINESS_CONTRIBUTORS = [
  ['hrv_balance', 'HRV Balance'],
  ['resting_heart_rate', 'Resting Heart Rate'],
  ['recovery_index', 'Recovery Index'],
  ['body_temperature', 'Body Temperature'],
  ['previous_night', 'Previous Night'],
  ['previous_day_activity', 'Previous Day Activity'],
  ['sleep_balance', 'Sleep Balance'],
  ['activity_balance', 'Activity Balance'],
  ['sleep_regularity', 'Sleep Regularity'],
];

const SLEEP_CONTRIBUTORS = [
  ['deep_sleep', 'Deep Sleep'],
  ['rem_sleep', 'REM Sleep'],
  ['total_sleep', 'Total Sleep'],
  ['efficiency', 'Efficiency'],
  ['restfulness', 'Restfulness'],
  ['latency', 'Latency'],
  ['timing', 'Timing'],
];

const ACTIVITY_CONTRIBUTORS = [
  ['meet_daily_targets', 'Meet Daily Targets'],
  ['move_every_hour', 'Move Every Hour'],
  ['recovery_time', 'Recovery Time'],
  ['stay_active', 'Stay Active'],
  ['training_frequency', 'Training Frequency'],
  ['training_volume', 'Training Volume'],
];

const hasValue = value => value !== null && value !== undefined && value !== '';

const displayValue = (value, fallback = '--') => hasValue(value) ? value : fallback;

const capitalize = value => {
  if (!hasValue(value)) return 'N/A';
  const text = String(value);
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export function formatDuration(seconds) {
  const totalSeconds = Number(seconds || 0);
  if (!totalSeconds) return '0m';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

const formatPercent = value => `${Math.round(Number(value || 0) * 100)}%`;

const formatTime = value => calendarDates.formatTimestampTime(value);

const recordDate = (...records) => {
  const record = records.find(Boolean);
  return record?.day || String(record?.timestamp || '').slice(0, 10) || '';
};

const section = (title, lines) => {
  const visibleLines = lines.filter(Boolean);
  return visibleLines.length ? [title, ...visibleLines.map(line => `  ${line}`)].join('\n') : '';
};

const snapshot = (title, sections, headerLine = '') => {
  const body = sections.filter(Boolean).join('\n\n');
  return [
    `${title} Snapshot`,
    headerLine,
    '='.repeat(title.length + 9),
    '',
    body,
  ].filter((line, index) => line || index === 3).join('\n');
};

const contributorLines = (contributors, definitions) => definitions.map(([key, label]) => {
  const value = contributors?.[key];
  return `${label}: ${hasValue(value) ? `${value}/100` : '--'}`;
});

export function buildReadinessCardSnapshot(data, options = {}) {
  const date = options.date || recordDate(data);
  const headerLine = options.dashboard
    ? `Date: ${date}`
    : `${date}: ${displayValue(data?.score)}`;
  return snapshot('Readiness', [
    section('Readiness Summary', [`Score: ${displayValue(data?.score)}`]),
    section('Readiness Contributors', contributorLines(data?.contributors, READINESS_CONTRIBUTORS)),
    hasValue(data?.temperature_deviation)
      ? section('Temperature', [`Temperature Deviation: ${Number(data.temperature_deviation).toFixed(2)}°C`])
      : '',
  ], headerLine);
}

function getSleepModel(sleepmodelData) {
  return sleepmodelData?.find(record => record.type === 'long_sleep') || sleepmodelData?.[0] || null;
}

function getOptimalBedtime(data, sleeptimeData) {
  const day = data?.day || sleeptimeData?.day;
  if (!day || !sleeptimeData?.optimal_bedtime) return null;
  return calendarDates.formatOptimalBedtime(day, sleeptimeData.optimal_bedtime);
}

export function buildSleepCardSnapshot(data, sleepmodelData, sleeptimeData, options = {}) {
  const sleepModel = getSleepModel(sleepmodelData);
  const date = options.date || recordDate(data, sleepModel, sleeptimeData);
  const headerLine = options.dashboard
    ? `Date: ${date}`
    : `${date}: ${displayValue(data?.score)}`;
  const sections = data ? [
    section('Sleep Summary', [`Score: ${displayValue(data.score)}`]),
    section('Sleep Contributors', contributorLines(data.contributors, SLEEP_CONTRIBUTORS)),
  ] : [
    section('Sleep Summary', ['Status: No daily sleep score or contributors available']),
  ];

  if (sleepModel) {
    const deep = Number(sleepModel.deep_sleep_duration || 0);
    const rem = Number(sleepModel.rem_sleep_duration || 0);
    const light = Number(sleepModel.light_sleep_duration || 0);
    const awake = Number(sleepModel.awake_time || 0);
    const asleep = deep + rem + light;
    const total = asleep + awake || 1;

    sections.push(section('Sleep Stages', [
      `Total Asleep: ${formatDuration(asleep)}`,
      `Deep: ${formatDuration(deep)} (${formatPercent(asleep ? deep / asleep : 0)})`,
      `REM: ${formatDuration(rem)} (${formatPercent(asleep ? rem / asleep : 0)})`,
      `Light: ${formatDuration(light)} (${formatPercent(asleep ? light / asleep : 0)})`,
      `Awake: ${formatDuration(awake)} (${formatPercent(awake / total)})`,
      (sleepModel.sleep_phase_5_min || sleepModel.sleep_phase_30_sec || '').length > 4
        ? `Timeline: ${formatTime(sleepModel.bedtime_start)} – ${formatTime(sleepModel.bedtime_end)}`
        : '',
    ]));

    sections.push(section('Key Metrics', [
      `Total Sleep: ${formatDuration(asleep)}`,
      `Time in Bed: ${formatDuration(sleepModel.time_in_bed)}`,
      `Resting Heart Rate: ${displayValue(sleepModel.resting_heart_rate || sleepModel.lowest_heart_rate)} bpm`,
      `Lowest Heart Rate: ${displayValue(sleepModel.lowest_heart_rate)} bpm`,
      `Average Heart Rate: ${hasValue(sleepModel.average_heart_rate) ? Number(sleepModel.average_heart_rate).toFixed(0) : '--'} bpm`,
      `Heart Rate Variability (HRV): ${hasValue(sleepModel.average_hrv) ? Number(sleepModel.average_hrv).toFixed(0) : '--'} ms`,
      `Breathing Rate: ${hasValue(sleepModel.average_breath) ? Number(sleepModel.average_breath).toFixed(1) : '--'} br/min`,
      `Sleep Efficiency: ${hasValue(sleepModel.efficiency) ? `${Number(sleepModel.efficiency)}%` : '--'}`,
      `Restlessness: ${displayValue(sleepModel.restless_periods)}`,
    ]));
  } else {
    sections.push(section('Sleep Stages and HR', ['Status: No sleep-model data available']));
  }

  const sleepHistory = options.allSleepmodelData || (date ? { [date]: sleepmodelData || [] } : {});
  const sleepDebt = calculateSleepDebt(sleepHistory, date);
  sections.push(section('Sleep Debt', sleepDebt ? [
    `Estimated Debt: ${formatSleepDebt(sleepDebt.debtSeconds)}`,
    `Category: ${sleepDebt.category.label}`,
    `Estimated Sleep Need: ${formatSleepDebt(sleepDebt.sleepNeedSeconds)}`,
    `Recent Nights: ${sleepDebt.recentNights}`,
    sleepDebt.category.description,
  ] : [
    'Status: At least five nights of sleep data within the previous 14 days are required.',
  ]));

  const bedtimeWindow = getOptimalBedtime(data, sleeptimeData);
  sections.push(section('Optimal Bedtime', [
    bedtimeWindow ? `Window: ${bedtimeWindow}` : 'Status: No optimal-bedtime data available',
  ]));

  return snapshot('Sleep', sections, headerLine);
}

export function buildActivityCardSnapshot(data, options = {}) {
  const high = Number(data?.high_activity_time || 0);
  const medium = Number(data?.medium_activity_time || 0);
  const low = Number(data?.low_activity_time || 0);
  const sedentary = Number(data?.sedentary_time || 0);
  const total = high + medium + low + sedentary || 1;
  const equivalentDistance = hasValue(data?.equivalent_walking_distance)
    ? (Number(data.equivalent_walking_distance) / 1609.344).toFixed(2)
    : '--';

  const date = options.date || recordDate(data);
  const headerLine = options.dashboard
    ? `Date: ${date}`
    : `${date}: ${displayValue(data?.score)}`;

  return snapshot('Activity', [
    section('Activity Summary', [`Score: ${displayValue(data?.score)}`]),
    section('Activity Contributors', contributorLines(data?.contributors, ACTIVITY_CONTRIBUTORS)),
    section('Activity Metrics', [
      `Steps: ${hasValue(data?.steps) ? Number(data.steps).toLocaleString() : '--'}`,
      `Active Calories: ${displayValue(data?.active_calories)}`,
      `Total Calories: ${displayValue(data?.total_calories)}`,
      `Equivalent Walking Distance: ${equivalentDistance} mi`,
      `Inactivity Alerts: ${displayValue(data?.inactivity_alerts, 0)}`,
    ]),
    section('Activity Breakdown', [
      `Vigorous: ${formatDuration(high)} (${formatPercent(high / total)})`,
      `Moderate: ${formatDuration(medium)} (${formatPercent(medium / total)})`,
      `Light: ${formatDuration(low)} (${formatPercent(low / total)})`,
      `Sedentary: ${formatDuration(sedentary)} (${formatPercent(sedentary / total)})`,
    ]),
  ], headerLine);
}

export function buildWearCoverageCardSnapshot(data, selectedDate = '') {
  const result = getWearCoverage(data);
  const date = selectedDate || recordDate(data);
  if (!result.available) {
    return snapshot('Ring Wear Coverage', [
      section('Coverage Summary', ['Status: No Daily Activity non-wear data available']),
    ], date ? `Date: ${date}` : '');
  }

  return snapshot('Ring Wear Coverage', [
    section('Coverage Summary', [
      `Wear Coverage: ${result.isPartial ? 'Unavailable for an incomplete day' : `${result.coverage.toFixed(1)}%`}`,
      `Status: ${result.isPartial ? 'Incomplete day — rating unavailable' : result.band.label}`,
      `Non-Wear Time${!result.isPartial && result.nonWearSeconds > 0 ? ' Detected' : ''}: ${result.isPartial ? 'N/A' : formatWearDuration(result.nonWearSeconds)}`,
      result.isPartial ? `Unclassified Time: ${formatWearDuration(result.unclassifiedSeconds)}` : '',
      result.isPartial
        ? `Activity Record: ${formatWearDuration(result.recordedSeconds)} of 24h (${result.recordedPercentage.toFixed(1)}%)`
        : 'Data Window: Complete day',
      `Guidance: ${result.isPartial
        ? 'The exported activity record is incomplete, so wear coverage cannot be rated and daily insights may be incomplete.'
        : result.band.description}`,
    ]),
  ], date ? `Date: ${date}` : '');
}

export function buildStressResilienceCardSnapshot(stressData, resilienceData, daytimeStressData = [], options = {}) {
  const stressValues = daytimeStressData.map(record => Number(record.stress_value)).filter(value => Number.isFinite(value) && value > 0);
  const recoveryValues = daytimeStressData.map(record => Number(record.recovery_value)).filter(value => Number.isFinite(value) && value > 0);
  const averageStress = stressValues.length ? Math.round(stressValues.reduce((sum, value) => sum + value, 0) / stressValues.length) : null;
  const averageRecovery = recoveryValues.length ? Math.round(recoveryValues.reduce((sum, value) => sum + value, 0) / recoveryValues.length) : null;
  const stressHigh = Number(stressData?.stress_high || 0);
  const recoveryHigh = Number(stressData?.recovery_high || 0);
  const total = stressHigh + recoveryHigh || 1;
  const resilienceContributors = resilienceData?.contributors || {};

  const date = options.date || recordDate(stressData, resilienceData, daytimeStressData[0]);

  return snapshot('Stress & Resilience', [
    (stressHigh > 0 || recoveryHigh > 0) ? section('Daily Stress & Recovery', [
      `Stress: ${formatDuration(stressHigh)} (${formatPercent(stressHigh / total)})`,
      `Recovery: ${formatDuration(recoveryHigh)} (${formatPercent(recoveryHigh / total)})`,
    ]) : !stressData ? section('Daily Stress & Recovery', ['Status: No daily stress data available']) : '',
    (averageStress !== null || averageRecovery !== null) ? section('Daytime Averages', [
      averageStress !== null ? `Average Stress: ${averageStress}` : '',
      averageRecovery !== null ? `Average Recovery: ${averageRecovery}` : '',
    ]) : section('Daytime Averages', ['Status: No daytime stress readings available']),
    stressData?.day_summary ? section('Day Summary', [`Status: ${capitalize(stressData.day_summary)}`]) : '',
    resilienceData ? section('Resilience', [
      `Status: ${capitalize(resilienceData.level)}`,
      hasValue(resilienceContributors.daytime_recovery) ? `Daytime Recovery: ${Math.round(resilienceContributors.daytime_recovery)}/100` : '',
      hasValue(resilienceContributors.sleep_recovery) ? `Sleep Recovery: ${Math.round(resilienceContributors.sleep_recovery)}/100` : '',
      hasValue(resilienceContributors.stress) ? `Stress Capacity: ${Math.round(resilienceContributors.stress)}/100` : '',
    ]) : section('Resilience', ['Status: No resilience data available']),
  ], date ? `Date: ${date}` : '');
}

export function buildCardiovascularCardSnapshot(data, dateWindow = [], allData = {}, selectedDate) {
  const vascularAge = hasValue(data?.vascular_age) ? Number(data.vascular_age) : null;
  const pulseWaveVelocity = hasValue(data?.pulse_wave_velocity) ? Number(data.pulse_wave_velocity).toFixed(2) : null;

  const date = selectedDate || recordDate(data);

  return snapshot('Cardiovascular Health', [
    section('Cardiovascular Metrics', [
      vascularAge !== null ? `Vascular Age: ${vascularAge} years` : '',
      pulseWaveVelocity !== null ? `Pulse Wave Velocity: ${pulseWaveVelocity} m/s` : '',
      vascularAge === null && pulseWaveVelocity === null ? 'Status: No cardiovascular metrics available' : '',
    ]),
    dateWindow.length && dateWindow.some(date => hasValue(allData?.[date]?.[0]?.vascular_age))
      ? section('7-Day Vascular Age Trend', dateWindow.map(date => {
      const value = allData?.[date]?.[0]?.vascular_age;
      const active = date === selectedDate ? ' (selected)' : '';
      return `${date}${active}: ${hasValue(value) ? `${Number(value)} years` : 'No data'}`;
      }))
      : section('7-Day Vascular Age Trend', ['Status: No cardiovascular-age data available for this week']),
  ], date ? `Date: ${date}` : '');
}

export function buildBiometricsCardSnapshot(spo2Data, heartrateData = [], temperatureData = [], selectedDate = '') {
  const spo2 = spo2Data?.spo2_percentage?.average;
  const heartRates = heartrateData.map(record => Number(record.bpm)).filter(value => value > 0 && value < 250);
  const averageHeartRate = heartRates.length ? Math.round(heartRates.reduce((sum, value) => sum + value, 0) / heartRates.length) : null;
  const temperatures = temperatureData.map(record => Number(record.skin_temp)).filter(value => value > 0);
  const averageTemperature = temperatures.length
    ? (temperatures.reduce((sum, value) => sum + value, 0) / temperatures.length).toFixed(1)
    : null;

  const date = selectedDate || recordDate(spo2Data, heartrateData[0], temperatureData[0]);

  return snapshot('Biometrics', [
    hasValue(spo2) ? section('Blood Oxygen (SpO₂)', [
      `Average: ${Number(spo2).toFixed(1)}%`,
      hasValue(spo2Data?.breathing_disturbance_index)
        ? `Breathing Disturbance: ${spo2Data.breathing_disturbance_index}`
        : '',
    ]) : section('Blood Oxygen (SpO₂)', ['Status: No SpO₂ data available']),
    averageHeartRate !== null ? section('Heart Rate', [
      `Average: ${averageHeartRate} bpm`,
      `Minimum: ${Math.min(...heartRates)} bpm`,
      `Maximum: ${Math.max(...heartRates)} bpm`,
      `Readings: ${heartRates.length}`,
    ]) : section('Heart Rate', ['Status: No heart-rate readings available']),
    averageTemperature !== null ? section('Skin Temperature', [
      `Average: ${averageTemperature}°C`,
      `Minimum: ${Math.min(...temperatures).toFixed(1)}°C`,
      `Maximum: ${Math.max(...temperatures).toFixed(1)}°C`,
      `Readings: ${temperatures.length}`,
    ]) : section('Skin Temperature', ['Status: No temperature readings available']),
  ], date ? `Date: ${date}` : '');
}
