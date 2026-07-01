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

const formatTime = value => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const section = (title, lines) => {
  const visibleLines = lines.filter(Boolean);
  return visibleLines.length ? [title, ...visibleLines.map(line => `  ${line}`)].join('\n') : '';
};

const snapshot = (title, sections) => {
  const body = sections.filter(Boolean).join('\n\n');
  return `${title} Snapshot\n${'='.repeat(title.length + 9)}\n\n${body}`;
};

const contributorLines = (contributors, definitions) => definitions.map(([key, label]) => {
  const value = contributors?.[key];
  return `${label}: ${hasValue(value) ? `${value}/100` : '--'}`;
});

export function buildReadinessCardSnapshot(data) {
  return snapshot('Readiness', [
    section('Readiness Summary', [`Score: ${displayValue(data?.score)}`]),
    section('Readiness Contributors', contributorLines(data?.contributors, READINESS_CONTRIBUTORS)),
    hasValue(data?.temperature_deviation)
      ? section('Temperature', [`Temperature Deviation: ${Number(data.temperature_deviation).toFixed(2)}°C`])
      : '',
  ]);
}

function getSleepModel(sleepmodelData) {
  return sleepmodelData?.find(record => record.type === 'long_sleep') || sleepmodelData?.[0] || null;
}

function getOptimalBedtime(data, sleeptimeData) {
  if (!data?.day || !sleeptimeData?.optimal_bedtime) return null;
  const bedtime = sleeptimeData.optimal_bedtime;
  const timezoneOffset = Number(bedtime.day_tz || 0);
  const midnight = new Date(`${data.day}T00:00:00Z`).getTime() - timezoneOffset * 1000;
  const start = midnight + Number(bedtime.start_offset || 0) * 1000;
  const end = midnight + Number(bedtime.end_offset || 0) * 1000;
  return `${formatTime(start)} – ${formatTime(end)}`;
}

export function buildSleepCardSnapshot(data, sleepmodelData, sleeptimeData) {
  const sleepModel = getSleepModel(sleepmodelData);
  const sections = [
    section('Sleep Summary', [`Score: ${displayValue(data?.score)}`]),
    section('Sleep Contributors', contributorLines(data?.contributors, SLEEP_CONTRIBUTORS)),
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

    sections.push(section('Sleep HR', [
      `Lowest Heart Rate: ${displayValue(sleepModel.lowest_heart_rate)} bpm`,
      `Average Heart Rate: ${hasValue(sleepModel.average_heart_rate) ? Number(sleepModel.average_heart_rate).toFixed(0) : '--'} bpm`,
      `Heart Rate Variability (HRV): ${hasValue(sleepModel.average_hrv) ? Number(sleepModel.average_hrv).toFixed(0) : '--'} ms`,
      `Breathing Rate: ${hasValue(sleepModel.average_breath) ? Number(sleepModel.average_breath).toFixed(1) : '--'} br/min`,
      `Sleep Efficiency: ${hasValue(sleepModel.efficiency) ? `${Number(sleepModel.efficiency)}%` : '--'}`,
      `Restlessness: ${displayValue(sleepModel.restless_periods)}`,
    ]));
  }

  const bedtimeWindow = getOptimalBedtime(data, sleeptimeData);
  if (bedtimeWindow) sections.push(section('Optimal Bedtime', [`Window: ${bedtimeWindow}`]));

  return snapshot('Sleep', sections);
}

export function buildActivityCardSnapshot(data) {
  const high = Number(data?.high_activity_time || 0);
  const medium = Number(data?.medium_activity_time || 0);
  const low = Number(data?.low_activity_time || 0);
  const sedentary = Number(data?.sedentary_time || 0);
  const total = high + medium + low + sedentary || 1;
  const equivalentDistance = hasValue(data?.equivalent_walking_distance)
    ? (Number(data.equivalent_walking_distance) / 1609.344).toFixed(2)
    : '--';

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
  ]);
}

export function buildStressResilienceCardSnapshot(stressData, resilienceData, daytimeStressData = []) {
  const stressValues = daytimeStressData.map(record => Number(record.stress_value)).filter(value => Number.isFinite(value) && value > 0);
  const recoveryValues = daytimeStressData.map(record => Number(record.recovery_value)).filter(value => Number.isFinite(value) && value > 0);
  const averageStress = stressValues.length ? Math.round(stressValues.reduce((sum, value) => sum + value, 0) / stressValues.length) : null;
  const averageRecovery = recoveryValues.length ? Math.round(recoveryValues.reduce((sum, value) => sum + value, 0) / recoveryValues.length) : null;
  const stressHigh = Number(stressData?.stress_high || 0);
  const recoveryHigh = Number(stressData?.recovery_high || 0);
  const total = stressHigh + recoveryHigh || 1;
  const resilienceContributors = resilienceData?.contributors || {};

  return snapshot('Stress & Resilience', [
    (stressHigh > 0 || recoveryHigh > 0) ? section('Daily Stress & Recovery', [
      `Stress: ${formatDuration(stressHigh)} (${formatPercent(stressHigh / total)})`,
      `Recovery: ${formatDuration(recoveryHigh)} (${formatPercent(recoveryHigh / total)})`,
    ]) : '',
    (averageStress !== null || averageRecovery !== null) ? section('Daytime Averages', [
      averageStress !== null ? `Average Stress: ${averageStress}` : '',
      averageRecovery !== null ? `Average Recovery: ${averageRecovery}` : '',
    ]) : '',
    stressData?.day_summary ? section('Day Summary', [`Status: ${capitalize(stressData.day_summary)}`]) : '',
    resilienceData ? section('Resilience', [
      `Status: ${capitalize(resilienceData.level)}`,
      hasValue(resilienceContributors.daytime_recovery) ? `Daytime Recovery: ${Math.round(resilienceContributors.daytime_recovery)}/100` : '',
      hasValue(resilienceContributors.sleep_recovery) ? `Sleep Recovery: ${Math.round(resilienceContributors.sleep_recovery)}/100` : '',
      hasValue(resilienceContributors.stress) ? `Stress Capacity: ${Math.round(resilienceContributors.stress)}/100` : '',
    ]) : '',
  ]);
}

export function buildCardiovascularCardSnapshot(data, dateWindow = [], allData = {}, selectedDate) {
  const vascularAge = hasValue(data?.vascular_age) ? Number(data.vascular_age) : null;
  const pulseWaveVelocity = hasValue(data?.pulse_wave_velocity) ? Number(data.pulse_wave_velocity).toFixed(2) : null;

  return snapshot('Cardiovascular Health', [
    section('Cardiovascular Metrics', [
      vascularAge !== null ? `Vascular Age: ${vascularAge} years` : '',
      pulseWaveVelocity !== null ? `Pulse Wave Velocity: ${pulseWaveVelocity} m/s` : '',
    ]),
    dateWindow.length ? section('7-Day Vascular Age Trend', dateWindow.map(date => {
      const value = allData?.[date]?.[0]?.vascular_age;
      const active = date === selectedDate ? ' (selected)' : '';
      return `${date}${active}: ${hasValue(value) ? `${Number(value)} years` : 'No data'}`;
    })) : '',
  ]);
}

export function buildBiometricsCardSnapshot(spo2Data, heartrateData = [], temperatureData = []) {
  const spo2 = spo2Data?.spo2_percentage?.average;
  const heartRates = heartrateData.map(record => Number(record.bpm)).filter(value => value > 0 && value < 250);
  const averageHeartRate = heartRates.length ? Math.round(heartRates.reduce((sum, value) => sum + value, 0) / heartRates.length) : null;
  const temperatures = temperatureData.map(record => Number(record.skin_temp)).filter(value => value > 0);
  const averageTemperature = temperatures.length
    ? (temperatures.reduce((sum, value) => sum + value, 0) / temperatures.length).toFixed(1)
    : null;

  return snapshot('Biometrics', [
    hasValue(spo2) ? section('Blood Oxygen (SpO₂)', [
      `Average: ${Number(spo2).toFixed(1)}%`,
      hasValue(spo2Data?.breathing_disturbance_index)
        ? `Breathing Disturbance: ${spo2Data.breathing_disturbance_index}`
        : '',
    ]) : '',
    averageHeartRate !== null ? section('Heart Rate', [
      `Average: ${averageHeartRate} bpm`,
      `Minimum: ${Math.min(...heartRates)} bpm`,
      `Maximum: ${Math.max(...heartRates)} bpm`,
      `Readings: ${heartRates.length}`,
    ]) : '',
    averageTemperature !== null ? section('Skin Temperature', [
      `Average: ${averageTemperature}°C`,
      `Minimum: ${Math.min(...temperatures).toFixed(1)}°C`,
      `Maximum: ${Math.max(...temperatures).toFixed(1)}°C`,
      `Readings: ${temperatures.length}`,
    ]) : '',
  ]);
}
