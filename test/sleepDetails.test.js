import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatSleepDuration,
  getAverageOxygenSaturation,
  getNighttimeBreathingMarkerPosition,
  getNighttimeBreathingStatus,
  getSleepStageSummary,
  getSleepTimelineTicks,
} from '../src/utils/sleepDetails.js';

test('sleep detail durations and percentages derive from exported stages', () => {
  const summary = getSleepStageSummary({
    deep_sleep_duration: 3600,
    rem_sleep_duration: 5400,
    light_sleep_duration: 10800,
    awake_time: 1200,
    time_in_bed: 21000,
    efficiency: 94,
    lowest_heart_rate: 52,
    sleep_phase_5_min: '123442',
  });
  assert.equal(summary.totalSleep, 19800);
  assert.equal(summary.timeInBed, 21000);
  assert.equal(summary.restingHeartRate, 52);
  assert.equal(summary.phases.length, 6);
  assert.equal(formatSleepDuration(summary.totalSleep), '5h 30m');
  assert.equal(Math.round(summary.stages.find(stage => stage.key === 'deep').percentage), 18);
});

test('oxygen saturation supports parsed objects and exported JSON strings', () => {
  assert.equal(getAverageOxygenSaturation({ spo2_percentage: { average: 97.4 } }), 97.4);
  assert.equal(getAverageOxygenSaturation({ spo2_percentage: '{"average":96.8}' }), 96.8);
  assert.equal(getAverageOxygenSaturation({ spo2_percentage: 'invalid' }), null);
});

test('nighttime breathing uses three stable index bands', () => {
  assert.equal(getNighttimeBreathingStatus({ breathing_disturbance_index: 0.8 }).level, 'few');
  assert.equal(getNighttimeBreathingStatus({ breathing_disturbance_index: 7 }).level, 'occasional');
  assert.equal(getNighttimeBreathingStatus({ breathing_disturbance_index: 18 }).level, 'frequent');
});

test('nighttime breathing marker aligns status thresholds with gradient thirds', () => {
  assert.equal(getNighttimeBreathingMarkerPosition(0), 0);
  assert.equal(Math.round(getNighttimeBreathingMarkerPosition(5)), 33);
  assert.equal(Math.round(getNighttimeBreathingMarkerPosition(10)), 50);
  assert.equal(Math.round(getNighttimeBreathingMarkerPosition(15)), 67);
  assert.equal(getNighttimeBreathingMarkerPosition(25), 100);
});

test('sleep timeline removes ticks that would overlap bedtime or wake-time labels', () => {
  const ticks = getSleepTimelineTicks(
    '2026-07-02T21:42:00-05:00',
    '2026-07-03T04:40:00-05:00',
  );
  assert.deepEqual(ticks.map(tick => tick.label), ['9:42 pm', '12 am', '2 am', '4:40 am']);
});
