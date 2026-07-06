import test from 'node:test';
import assert from 'node:assert/strict';
import { calendarDates } from '../src/utils/dateService.js';
import { formatClockMinutes, getSleepRegularityHistory, getSleepRegularityTrendSeries } from '../src/utils/sleepRegularityDetails.js';

const sleepmodel = {};
Array.from({ length: 14 }, (_, index) => calendarDates.addDays('2026-06-01', index)).forEach((date, index) => {
  sleepmodel[date] = [{
    type: 'long_sleep',
    bedtime_start: `${date}T22:${String(25 + (index % 3) * 5).padStart(2, '0')}:00-05:00`,
    bedtime_end: `${calendarDates.addDays(date, 1)}T06:${String((index % 3) * 5).padStart(2, '0')}:00-05:00`,
  }];
});

test('sleep regularity history combines score and bedtime intervals', () => {
  const history = getSleepRegularityHistory(sleepmodel, '2026-06-14');
  assert.equal(history.length, 7);
  assert.equal(history[0].date, '2026-06-08');
  assert.ok(history[6].score >= 85);
  assert.equal(history[6].bedtimeMinutes, 22 * 60 + 30);
  assert.equal(history[6].wakeMinutes, 6 * 60 + 5);
});

test('clock minute formatting stays local and wraps midnight', () => {
  assert.equal(formatClockMinutes(22 * 60 + 30), '10:30 PM');
  assert.equal(formatClockMinutes(24 * 60 + 15), '12:15 AM');
});

test('sleep regularity trends support day, week, and month ranges', () => {
  const day = getSleepRegularityTrendSeries(sleepmodel, 'day', '2026-06-14', 14);
  const week = getSleepRegularityTrendSeries(sleepmodel, 'week', '2026-06-14', 3);
  const month = getSleepRegularityTrendSeries(sleepmodel, 'month', '2026-06-14', 3);
  assert.equal(day.points.length, 14);
  assert.equal(day.windowStart, '2026-06-01');
  assert.equal(week.points.length, 3);
  assert.equal(calendarDates.getDatePresentation(week.points[0].startDate).weekdayShort, 'Sun');
  assert.equal(month.points.length, 3);
  assert.equal(month.points.at(-1).key, '2026-06');
});
