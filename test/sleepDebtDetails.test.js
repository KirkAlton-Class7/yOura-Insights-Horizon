import test from 'node:test';
import assert from 'node:assert/strict';
import { calendarDates } from '../src/utils/dateService.js';
import { getSleepDebtHistory, getSleepDebtTrendSeries } from '../src/utils/sleepDebtDetails.js';

const groupedSleepModel = {};
Array.from({ length: 30 }, (_, index) => calendarDates.addDays('2026-01-01', index)).forEach((date, index) => {
  groupedSleepModel[date] = [{
    type: 'long_sleep',
    total_sleep_duration: (index % 4 === 0 ? 6.5 : 7.75) * 3600,
  }];
});

test('sleep debt detail history returns seven chronological daily records', () => {
  const history = getSleepDebtHistory(groupedSleepModel, '2026-01-30');
  assert.equal(history.length, 7);
  assert.equal(history[0].date, '2026-01-24');
  assert.equal(history[6].date, '2026-01-30');
  assert.equal(history[6].totalSleepSeconds, 7.75 * 3600);
  assert.ok(history.some(day => day.debtSeconds !== null));
});

test('sleep debt detail history preserves missing dates', () => {
  const history = getSleepDebtHistory(groupedSleepModel, '2026-02-02');
  assert.equal(history[6].totalSleepSeconds, null);
  assert.equal(history[6].sleepNeedMet, false);
});

test('sleep debt trends aggregate across day, week, and month ranges', () => {
  const day = getSleepDebtTrendSeries(groupedSleepModel, 'day', '2026-01-30', 14);
  const week = getSleepDebtTrendSeries(groupedSleepModel, 'week', '2026-01-30', 3);
  const month = getSleepDebtTrendSeries(groupedSleepModel, 'month', '2026-01-30', 3);
  assert.equal(day.points.length, 14);
  assert.equal(day.windowStart, '2026-01-17');
  assert.equal(week.points.length, 3);
  assert.equal(calendarDates.getDatePresentation(week.points[0].startDate).weekdayShort, 'Sun');
  assert.equal(month.points.length, 3);
  assert.equal(month.points.at(-1).key, '2026-01');
  assert.ok(week.points.some(point => point.totalSleepSeconds !== null));
});
