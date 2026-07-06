import test from 'node:test';
import assert from 'node:assert/strict';
import { calendarDates } from '../src/utils/dateService.js';
import { getTrendPeriods, TREND_RANGE_CONFIG } from '../src/utils/trendRanges.js';

test('shared trend ranges use 7 day, 4 week, and 3 month defaults with a 15-week maximum', () => {
  assert.equal(TREND_RANGE_CONFIG.day.defaultValue, 7);
  assert.equal(TREND_RANGE_CONFIG.week.defaultValue, 4);
  assert.equal(TREND_RANGE_CONFIG.month.defaultValue, 3);
  assert.equal(TREND_RANGE_CONFIG.week.maximum, 15);
});

test('week ranges are Sunday-through-Saturday and month ranges preserve calendar boundaries', () => {
  const weeks = getTrendPeriods('week', '2026-07-03', 4);
  const months = getTrendPeriods('month', '2026-07-03', 3);
  assert.equal(weeks.length, 4);
  assert.ok(weeks.every(period => calendarDates.getDatePresentation(period.startDate).weekdayShort === 'Sun'));
  assert.ok(weeks.every(period => calendarDates.getDatePresentation(period.endDate).weekdayShort === 'Sat'));
  assert.deepEqual(months.map(period => period.key), ['2026-05', '2026-06', '2026-07']);
  assert.equal(months[1].endDate, '2026-06-30');
});
