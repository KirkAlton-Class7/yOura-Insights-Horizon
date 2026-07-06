import assert from 'node:assert/strict';
import test from 'node:test';
import { formatTrendDateRange, formatTrendPeriod } from '../src/utils/trendPeriod.js';

test('trend date ranges stay concise within one month', () => {
  assert.equal(formatTrendDateRange('2026-07-01', '2026-07-14'), 'Jul 1–14, 2026');
});

test('trend date ranges preserve month and year boundaries', () => {
  assert.equal(formatTrendDateRange('2026-06-28', '2026-07-04'), 'Jun 28 – Jul 4, 2026');
  assert.equal(formatTrendDateRange('2025-12-28', '2026-01-03'), 'Dec 28, 2025 – Jan 3, 2026');
});

test('trend period labels identify aggregation cadence', () => {
  assert.equal(formatTrendPeriod('dayToDay', '2026-06-20', '2026-07-03'), 'Day to day · Jun 20 – Jul 3, 2026');
  assert.equal(formatTrendPeriod('week', '2026-06-28', '2026-07-04'), 'Week · Jun 28 – Jul 4, 2026');
  assert.equal(formatTrendPeriod('month', '2026-07-01', '2026-07-31'), 'Month · Jul 1–31, 2026');
});
