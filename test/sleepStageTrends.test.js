import test from 'node:test';
import assert from 'node:assert/strict';
import { calendarDates } from '../src/utils/dateService.js';
import { getSleepStageTrendSeries, shiftSleepStageAnchor } from '../src/utils/sleepStageTrends.js';

const appData = { sleepmodel: {} };
Array.from({ length: 220 }, (_, index) => calendarDates.addDays('2026-01-01', index)).forEach((date, index) => {
  appData.sleepmodel[date] = [{
    type: 'long_sleep',
    awake_time: 1200,
    deep_sleep_duration: 3600 + (index % 3) * 60,
    rem_sleep_duration: 4500,
    light_sleep_duration: 9000,
  }];
});

test('sleep-stage day mode returns fourteen daily stacked values', () => {
  const series = getSleepStageTrendSeries(appData, 'day', '2026-07-03');
  assert.equal(series.points.length, 14);
  assert.equal(series.windowStart, '2026-06-20');
  assert.ok(series.points.every(point => point.totalSleep > 0));
  assert.equal(shiftSleepStageAnchor('2026-07-03', 'day', -1, 14), '2026-06-19');
});

test('sleep-stage week and month modes use six- and three-period defaults', () => {
  const weeks = getSleepStageTrendSeries(appData, 'week', '2026-07-03');
  const months = getSleepStageTrendSeries(appData, 'month', '2026-07-03');
  assert.equal(weeks.points.length, 6);
  assert.equal(months.points.length, 3);
  assert.equal(calendarDates.getDatePresentation(weeks.points[0].startDate).weekdayShort, 'Sun');
  assert.equal(shiftSleepStageAnchor('2026-07-03', 'month', -1, 3), '2026-04-03');
});
