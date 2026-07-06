import test from 'node:test';
import assert from 'node:assert/strict';
import { calendarDates } from '../src/utils/dateService.js';
import { calculateSleepRegularity } from '../src/utils/sleepRegularity.js';

const history = (bedtimes, wakeTimes) => Object.fromEntries(bedtimes.map((bedtime, index) => {
  const date = calendarDates.addDays('2026-06-01', index);
  const next = calendarDates.addDays(date, 1);
  return [date, [{
    type: 'long_sleep',
    bedtime_start: `${date}T${bedtime}:00-05:00`,
    bedtime_end: `${next}T${wakeTimes[index]}:00-05:00`,
  }]];
}));

test('consistent local bed and wake times produce optimal regularity', () => {
  const result = calculateSleepRegularity(
    history(['22:30', '22:32', '22:28', '22:35', '22:25'], ['06:00', '06:02', '05:58', '06:05', '05:55']),
    '2026-06-05',
  );
  assert.equal(result.status, 'Optimal');
  assert.ok(result.score >= 85);
});

test('large sleep timing variation maps through semantic score bands', () => {
  const result = calculateSleepRegularity(
    history(['20:00', '23:30', '02:00', '21:00', '01:30'], ['04:00', '08:30', '11:00', '05:00', '10:30']),
    '2026-06-05',
  );
  assert.equal(result.status, 'Bad');
  assert.ok(result.score < 60);
});

test('regularity requires five valid nights', () => {
  const result = calculateSleepRegularity(
    history(['22:30', '22:30', '22:30', '22:30'], ['06:00', '06:00', '06:00', '06:00']),
    '2026-06-04',
  );
  assert.equal(result, null);
});
