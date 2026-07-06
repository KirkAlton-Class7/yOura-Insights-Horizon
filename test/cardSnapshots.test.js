import assert from 'node:assert/strict';
import test from 'node:test';

import { buildActivityCardSnapshot, buildSleepCardSnapshot } from '../src/utils/cardSnapshots.js';

test('sleep snapshot contains the summary, contributors, stages, and key metrics shown on the main card', () => {
  const snapshot = buildSleepCardSnapshot(
    {
      day: '2026-07-03',
      score: 82,
      contributors: { deep_sleep: 79 },
    },
    [{
      day: '2026-07-03',
      type: 'long_sleep',
      deep_sleep_duration: 3600,
      rem_sleep_duration: 4200,
      light_sleep_duration: 9000,
      awake_time: 1200,
      time_in_bed: 18000,
      average_hrv: 50,
      average_breath: 14,
      bedtime_start: '2026-07-02T22:30:00-05:00',
      bedtime_end: '2026-07-03T03:30:00-05:00',
      sleep_phase_5_min: '12341234',
    }],
    { day: '2026-07-03', optimal_bedtime: { start_offset: 0, end_offset: 0 } },
  );

  assert.match(snapshot, /Sleep Summary/);
  assert.match(snapshot, /Sleep Contributors/);
  assert.match(snapshot, /Sleep Stages/);
  assert.match(snapshot, /Key Metrics/);
  assert.match(snapshot, /Total Sleep: 4h 40m/);
  assert.match(snapshot, /Time in Bed: 5h/);
  assert.match(snapshot, /Avg HRV: 50 ms/);
  assert.doesNotMatch(snapshot, /Sleep Regularity/);
  assert.doesNotMatch(snapshot, /Sleep Debt/);
  assert.doesNotMatch(snapshot, /Optimal Bedtime/);
  assert.doesNotMatch(snapshot, /Heart Rate Variability/);
  assert.doesNotMatch(snapshot, /Breathing Rate/);
});

test('activity snapshot contains the score, contributors, and key metrics shown on the main card', () => {
  const snapshot = buildActivityCardSnapshot({
    day: '2026-07-03',
    score: 76,
    contributors: { stay_active: 80 },
    steps: 10_000,
    active_calories: 500,
    target_calories: 625,
    high_activity_time: 1800,
    medium_activity_time: 600,
    low_activity_time: 1200,
    total_calories: 2300,
  });

  assert.match(snapshot, /Activity Summary/);
  assert.match(snapshot, /Score: 76/);
  assert.match(snapshot, /Activity Contributors/);
  assert.match(snapshot, /Stay Active: 80\/100/);
  assert.match(snapshot, /Key Metrics/);
  assert.match(snapshot, /Goal Progress: 80%/);
  assert.match(snapshot, /Total Burn: 2,300 kcal/);
  assert.match(snapshot, /Activity Time: 1h/);
  assert.match(snapshot, /Steps: 10,000/);
  assert.doesNotMatch(snapshot, /Activity Breakdown/);
});
