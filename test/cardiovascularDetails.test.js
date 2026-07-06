import test from 'node:test';
import assert from 'node:assert/strict';
import { getCardiovascularHistory } from '../src/utils/cardiovascularDetails.js';

test('cardiovascular history returns a trailing fourteen-day window and preserves missing days', () => {
  const history = getCardiovascularHistory({
    '2026-06-20': [{ vascular_age: '39', pulse_wave_velocity: '6.12' }],
    '2026-07-03': [{ vascular_age: '40', pulse_wave_velocity: '6.30' }],
  }, '2026-07-03');
  assert.equal(history.length, 14);
  assert.equal(history[0].date, '2026-06-20');
  assert.equal(history.at(-1).date, '2026-07-03');
  assert.equal(history[0].vascularAge, 39);
  assert.equal(history[1].pulseWaveVelocity, null);
  assert.equal(history.at(-1).pulseWaveVelocity, 6.3);
});
