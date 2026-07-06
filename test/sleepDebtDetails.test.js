import test from 'node:test';
import assert from 'node:assert/strict';
import { calendarDates } from '../src/utils/dateService.js';
import { getSleepDebtHistory } from '../src/utils/sleepDebtDetails.js';

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
