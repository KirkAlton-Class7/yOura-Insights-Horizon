import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSleepDebt,
  formatSleepDebt,
  getSleepDebtCategory,
} from '../src/utils/sleepDebt.js';

const sleepRecord = minutes => ({
  type: 'long_sleep',
  deep_sleep_duration: minutes * 60,
  rem_sleep_duration: 0,
  light_sleep_duration: 0,
});

test('calibrated July 3 history estimates 3h 40m of moderate sleep debt', () => {
  const history = {
    '2026-06-28': [sleepRecord(514)],
    '2026-06-29': [sleepRecord(468)],
    '2026-06-30': [sleepRecord(531)],
    '2026-07-01': [sleepRecord(412)],
    '2026-07-02': [sleepRecord(480)],
    '2026-07-03': [sleepRecord(276)],
  };

  const debt = calculateSleepDebt(history, '2026-07-03');
  assert.equal(formatSleepDebt(debt.debtSeconds), '3h 40m');
  assert.equal(formatSleepDebt(debt.sleepNeedSeconds), '8h');
  assert.equal(debt.category.label, 'Moderate');
});

test('sleep debt requires five nights in the previous 14 days', () => {
  const history = {
    '2026-06-30': [sleepRecord(480)],
    '2026-07-01': [sleepRecord(480)],
    '2026-07-02': [sleepRecord(480)],
    '2026-07-03': [sleepRecord(480)],
  };
  assert.equal(calculateSleepDebt(history, '2026-07-03'), null);
});

test('sleep debt category boundaries match the four defined bands', () => {
  assert.equal(getSleepDebtCategory(0).label, 'None');
  assert.equal(getSleepDebtCategory((2 * 60 * 60) - 60).label, 'Low');
  assert.equal(getSleepDebtCategory(2 * 60 * 60).label, 'Moderate');
  assert.equal(getSleepDebtCategory(5 * 60 * 60).label, 'Moderate');
  assert.equal(getSleepDebtCategory((5 * 60 * 60) + 60).label, 'High');
});

test('all sleep sessions for a day contribute to total sleep', () => {
  const history = {
    '2026-06-29': [sleepRecord(420), sleepRecord(60)],
    '2026-06-30': [sleepRecord(480)],
    '2026-07-01': [sleepRecord(480)],
    '2026-07-02': [sleepRecord(480)],
    '2026-07-03': [sleepRecord(480)],
  };
  assert.equal(calculateSleepDebt(history, '2026-07-03').debtSeconds, 0);
});
