import assert from 'node:assert/strict';
import test from 'node:test';
import { getAvailableDatesAcrossDatasets, getAvailableRecordDates } from '../src/utils/dataAvailability.js';

test('available dates exclude missing and empty daily records', () => {
  const dataset = {
    '2026-07-01': [{ score: 80 }],
    '2026-07-02': [],
    '2026-07-03': [null],
    '2026-07-04': [{}],
  };
  assert.deepEqual(getAvailableRecordDates(dataset), ['2026-07-01']);
});

test('available dates can use metric-specific validation', () => {
  const dataset = {
    '2026-07-01': [{ bpm: 72 }],
    '2026-07-02': [{ timestamp: '2026-07-02T08:00:00' }],
  };
  assert.deepEqual(
    getAvailableRecordDates(dataset, record => Number.isFinite(Number(record?.bpm))),
    ['2026-07-01'],
  );
});

test('combined availability preserves chronological unique dates', () => {
  assert.deepEqual(getAvailableDatesAcrossDatasets([
    { '2026-07-02': [{ score: 70 }] },
    { '2026-07-01': [{ value: 1 }], '2026-07-02': [{ value: 2 }] },
  ]), ['2026-07-01', '2026-07-02']);
});
