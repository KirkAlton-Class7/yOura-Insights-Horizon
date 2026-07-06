import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getMetricDrilldownSeries,
  shiftMetricDrilldownAnchor,
} from '../src/utils/metricDrilldown.js';
import { calendarDates } from '../src/utils/dateService.js';

const appData = { readiness: {}, sleep: {}, sleepmodel: {} };
Array.from({ length: 220 }, (_, index) => calendarDates.addDays('2026-01-01', index)).forEach((date, index) => {
  appData.readiness[date] = [{ temperature_deviation: (index % 5) / 10 }];
  appData.sleepmodel[date] = [{
    type: 'long_sleep',
    deep_sleep_duration: 4200,
    rem_sleep_duration: 4800,
    light_sleep_duration: 9600,
    time_in_bed: 19800,
    efficiency: 94,
    lowest_heart_rate: 50 + (index % 10),
    average_hrv: 40 + (index % 20),
    average_breath: 13 + (index % 4) / 10,
  }];
  appData.sleep[date] = [{ contributors: { deep_sleep: 70 + (index % 20) } }];
});

test('day mode defaults to 14 chronological daily points and accepts 3–30', () => {
  const series = getMetricDrilldownSeries(appData, 'restingHeartRate', 'day', '2026-07-03');
  assert.equal(series.points.length, 14);
  assert.equal(series.windowStart, '2026-06-20');
  assert.equal(series.windowEnd, '2026-07-03');
  assert.equal(getMetricDrilldownSeries(appData, 'restingHeartRate', 'day', '2026-07-03', 30).points.length, 30);
  assert.equal(shiftMetricDrilldownAnchor('2026-07-03', 'day', -1), '2026-06-19');
});

test('week mode defaults to 6 Sunday-through-Saturday averages and accepts 3–15', () => {
  const series = getMetricDrilldownSeries(appData, 'averageHrv', 'week', '2026-07-03');
  assert.equal(series.points.length, 6);
  assert.equal(calendarDates.getDatePresentation(series.points[0].startDate).weekdayShort, 'Sun');
  assert.equal(calendarDates.getDatePresentation(series.points[5].endDate).weekdayShort, 'Sat');
  assert.equal(getMetricDrilldownSeries(appData, 'averageHrv', 'week', '2026-07-03', 15).points.length, 15);
  assert.equal(shiftMetricDrilldownAnchor('2026-07-03', 'week', -1), '2026-05-22');
});

test('month mode defaults to 3 calendar-month averages and accepts 3–24', () => {
  const series = getMetricDrilldownSeries(appData, 'bodyTemperature', 'month', '2026-07-31');
  assert.equal(series.points.length, 3);
  assert.equal(series.points[0].key, '2026-05');
  assert.equal(series.points[2].key, '2026-07');
  assert.equal(getMetricDrilldownSeries(appData, 'bodyTemperature', 'month', '2026-07-31', 24).points.length, 24);
  assert.equal(shiftMetricDrilldownAnchor('2026-07-31', 'month', -1), '2026-04-30');
});

test('custom ranges reject non-integers and values outside mode limits', () => {
  assert.throws(
    () => getMetricDrilldownSeries(appData, 'restingHeartRate', 'day', '2026-07-03', 2),
    /whole number from 3 to 30/,
  );
  assert.throws(
    () => getMetricDrilldownSeries(appData, 'averageHrv', 'week', '2026-07-03', 15.5),
    /whole number from 3 to 15/,
  );
  assert.throws(
    () => getMetricDrilldownSeries(appData, 'bodyTemperature', 'month', '2026-07-03', 25),
    /whole number from 3 to 24/,
  );
});

test('sleep duration and contributor metrics reuse the shared trend series', () => {
  const duration = getMetricDrilldownSeries(appData, 'totalSleep', 'day', '2026-07-03');
  const contributor = getMetricDrilldownSeries(appData, 'deepSleepContributor', 'week', '2026-07-03');
  assert.ok(duration.points.every(point => point.value > 0));
  assert.ok(contributor.points.some(point => point.value !== null));
});
