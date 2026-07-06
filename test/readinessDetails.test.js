import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getReadinessDetailPeriod,
  getReadinessPeriodStart,
  parseMetricSeries,
} from '../src/utils/readinessDetails.js';

test('readiness detail period renders two fixed Sunday-through-Saturday weeks', () => {
  const appData = {
    readiness: { '2026-07-03': [{ score: '82' }] },
    sleepmodel: { '2026-07-03': [{ type: 'long_sleep', lowest_heart_rate: '59' }] },
  };
  const periodStart = getReadinessPeriodStart('2026-07-03');
  const window = getReadinessDetailPeriod(appData, periodStart, '2026-07-03');
  assert.equal(window.length, 14);
  assert.equal(periodStart, '2026-06-28');
  assert.equal(window[0].date, '2026-06-28');
  assert.deepEqual(window[5], {
    date: '2026-07-03',
    isSelected: true,
    readinessScore: 82,
    restingHeartRate: 59,
  });
  assert.equal(window[13].date, '2026-07-11');
});

test('metric series retains positions while excluding missing values from summary data', () => {
  const series = parseMetricSeries({
    interval: 300,
    items: [null, 61, '59', null, 62],
    timestamp: '2026-07-03T06:38:31-05:00',
  });
  assert.deepEqual(series.values, [61, 59, 62]);
  assert.equal(series.points.length, 5);
  assert.equal(series.points[0].value, null);
  assert.equal(series.intervalSeconds, 300);
});

test('invalid metric series are treated as unavailable', () => {
  assert.equal(parseMetricSeries('not-json'), null);
  assert.equal(parseMetricSeries({ items: [null, 50] }), null);
});
