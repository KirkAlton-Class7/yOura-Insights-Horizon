import { calendarDates } from './dateService.js';

const finiteNumber = value => {
  if (value === '' || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

export function getCardiovascularHistory(groupedData, anchorDate, length = 14) {
  const startDate = calendarDates.addDays(anchorDate, -(length - 1));
  return Object.freeze(Array.from({ length }, (_, index) => {
    const date = calendarDates.addDays(startDate, index);
    const record = groupedData?.[date]?.[0] || null;
    return Object.freeze({
      date,
      vascularAge: finiteNumber(record?.vascular_age),
      pulseWaveVelocity: finiteNumber(record?.pulse_wave_velocity),
    });
  }));
}
