import test from 'node:test';
import assert from 'node:assert/strict';
import { getWearCoverage, getWearCoverageHistory } from '../src/utils/wearCoverage.js';

test('wear coverage derives completeness from exported non-wear seconds', () => {
  const result = getWearCoverage({ non_wear_time: 3600 });
  assert.equal(result.available, true);
  assert.equal(result.coverage, 95.83333333333334);
  assert.equal(result.completenessPercentage, 95.83333333333334);
  assert.equal(result.band.label, 'Excellent');
  assert.equal(result.completenessBand.label, 'Excellent');
});

test('wear coverage history keeps fourteen fixed dates and plots incomplete days by activity record completeness', () => {
  const history = getWearCoverageHistory({
    '2026-06-20': [{ non_wear_time: 7200 }],
    '2026-07-02': [{ non_wear_time: 0, class_5_min: '1'.repeat(151) }],
    '2026-07-03': [{ non_wear_time: 0 }],
  }, '2026-07-03');
  assert.equal(history.length, 14);
  assert.equal(history[0].date, '2026-06-20');
  assert.equal(history.at(-1).date, '2026-07-03');
  assert.equal(history[0].coverage, 91.66666666666666);
  assert.equal(history[0].completeness, 91.66666666666666);
  assert.equal(history.at(-2).coverage, null);
  assert.equal(history.at(-2).completeness, 52.43055555555556);
  assert.equal(history.at(-2).result.isPartial, true);
  assert.equal(history.at(-2).result.completenessBand.label, 'Fair');
  assert.equal(history.at(-2).label, 'activity record available');
  assert.equal(history.at(-1).coverage, 100);
  assert.equal(history.at(-1).completeness, 100);
});
