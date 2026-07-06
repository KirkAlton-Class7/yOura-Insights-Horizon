import { calendarDates } from './dateService.js';

const finiteNumber = value => {
  if (value === '' || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

export function getBiometricsHistory(spo2Data, anchorDate, length = 14) {
  const startDate = calendarDates.addDays(anchorDate, -(length - 1));
  return Object.freeze(Array.from({ length }, (_, index) => {
    const date = calendarDates.addDays(startDate, index);
    const record = spo2Data?.[date]?.[0] || null;
    return Object.freeze({
      date,
      bloodOxygen: finiteNumber(record?.spo2_percentage?.average),
      breathingDisturbance: finiteNumber(record?.breathing_disturbance_index),
    });
  }));
}
