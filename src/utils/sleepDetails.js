const finiteNumber = value => {
  if (value === '' || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

export const formatSleepDuration = seconds => {
  const totalMinutes = Math.max(0, Math.round(Number(seconds || 0) / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours && minutes) return `${hours}h ${minutes}m`;
  if (hours) return `${hours}h`;
  return `${minutes}m`;
};

export function getSleepStageSummary(record) {
  if (!record) return null;
  const deep = Math.max(0, finiteNumber(record.deep_sleep_duration) || 0);
  const rem = Math.max(0, finiteNumber(record.rem_sleep_duration) || 0);
  const light = Math.max(0, finiteNumber(record.light_sleep_duration) || 0);
  const awake = Math.max(0, finiteNumber(record.awake_time) || 0);
  const stageTotal = deep + rem + light;
  const exportedTotal = finiteNumber(record.total_sleep_duration);
  const totalSleep = exportedTotal !== null ? Math.max(0, exportedTotal) : stageTotal;
  const exportedTimeInBed = finiteNumber(record.time_in_bed);
  const timeInBed = exportedTimeInBed !== null ? Math.max(0, exportedTimeInBed) : totalSleep + awake;
  const phaseValue = record.sleep_phase_5_min || record.sleep_phase_30_sec || '';
  const phases = String(phaseValue)
    .split('')
    .map(Number)
    .filter(phase => phase >= 1 && phase <= 4);

  return Object.freeze({
    totalSleep,
    timeInBed,
    efficiency: finiteNumber(record.efficiency),
    restingHeartRate: finiteNumber(record.resting_heart_rate ?? record.lowest_heart_rate),
    lowestHeartRate: finiteNumber(record.lowest_heart_rate),
    averageHeartRate: finiteNumber(record.average_heart_rate),
    restlessPeriods: finiteNumber(record.restless_periods),
    phases: Object.freeze(phases),
    stages: Object.freeze([
      Object.freeze({ key: 'awake', label: 'Awake', seconds: awake, percentage: timeInBed ? (awake / timeInBed) * 100 : 0 }),
      Object.freeze({ key: 'rem', label: 'REM', seconds: rem, percentage: totalSleep ? (rem / totalSleep) * 100 : 0 }),
      Object.freeze({ key: 'light', label: 'Light', seconds: light, percentage: totalSleep ? (light / totalSleep) * 100 : 0 }),
      Object.freeze({ key: 'deep', label: 'Deep', seconds: deep, percentage: totalSleep ? (deep / totalSleep) * 100 : 0 }),
    ]),
  });
}

export function getAverageOxygenSaturation(spo2Record) {
  let percentage = spo2Record?.spo2_percentage;
  if (typeof percentage === 'string') {
    try {
      percentage = JSON.parse(percentage);
    } catch {
      return null;
    }
  }
  return finiteNumber(percentage?.average ?? percentage);
}

export function getNighttimeBreathingStatus(spo2Record) {
  const index = finiteNumber(spo2Record?.breathing_disturbance_index);
  if (index === null) return null;
  if (index < 5) {
    return Object.freeze({
      index,
      label: 'Mostly steady',
      description: 'Only limited breathing variations were reflected in the nightly export.',
      level: 'few',
    });
  }
  if (index < 15) {
    return Object.freeze({
      index,
      label: 'Some variations',
      description: 'The nightly export reflects occasional breathing variations worth following over time.',
      level: 'occasional',
    });
  }
  return Object.freeze({
    index,
    label: 'Frequent variations',
    description: 'The nightly export reflects frequent breathing variations. Consider the longer-term pattern and discuss persistent concerns with a clinician.',
    level: 'frequent',
  });
}
