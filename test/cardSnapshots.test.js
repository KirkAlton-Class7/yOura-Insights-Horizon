import assert from 'node:assert/strict';
import test from 'node:test';

import { buildActivityCardSnapshot, buildSleepCardSnapshot } from '../src/utils/cardSnapshots.js';

test('sleep snapshot contains only the summary, contributors, and stages shown on the main card', () => {
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
  assert.doesNotMatch(snapshot, /Key Metrics/);
  assert.doesNotMatch(snapshot, /Sleep Regularity/);
  assert.doesNotMatch(snapshot, /Sleep Debt/);
  assert.doesNotMatch(snapshot, /Optimal Bedtime/);
  assert.doesNotMatch(snapshot, /Heart Rate Variability/);
  assert.doesNotMatch(snapshot, /Breathing Rate/);
});

test('activity snapshot contains only the score shown on the main card', () => {
  const snapshot = buildActivityCardSnapshot({
    day: '2026-07-03',
    score: 76,
    contributors: { stay_active: 80 },
    steps: 10_000,
    active_calories: 500,
    high_activity_time: 1800,
  });

  assert.match(snapshot, /Activity Summary/);
  assert.match(snapshot, /Score: 76/);
  assert.doesNotMatch(snapshot, /Activity Contributors/);
  assert.doesNotMatch(snapshot, /Activity Metrics/);
  assert.doesNotMatch(snapshot, /Activity Breakdown/);
  assert.doesNotMatch(snapshot, /Steps/);
});
