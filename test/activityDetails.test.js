import test from 'node:test';
import assert from 'node:assert/strict';
import { getActivityIntensityDurations, getDailyActivityBenefits, getDailyHeartRateZoneMinutes, getDailyMovementBuckets, getGoalProgress, getWeeklyActivityBenefits } from '../src/utils/activityDetails.js';

test('daily movement uses 24 fixed hourly buckets when class data exists', () => {
  const record = {
    class_5_min: `${'3'.repeat(72)}${'2'.repeat(72)}${'4'.repeat(72)}${'1'.repeat(72)}`,
  };
  const buckets = getDailyMovementBuckets(record);
  assert.equal(buckets.length, 24);
  assert.deepEqual(buckets.slice(0, 7).map(bucket => bucket.activeMinutes), [60, 60, 60, 60, 60, 60, 0]);
  assert.equal(buckets[12].intensity, 2);
});

test('daily movement falls back to one honest daily total without intraday classes', () => {
  const buckets = getDailyMovementBuckets({ high_activity_time: 600, medium_activity_time: 1200, low_activity_time: 1800 });
  assert.deepEqual(buckets.map(bucket => bucket.activeMinutes), [60]);
  assert.equal(buckets[0].hasIntradayData, false);
});

test('goal progress compares active calories with the exported target', () => {
  assert.equal(getGoalProgress({ active_calories: 450, target_calories: 600 }), 75);
  assert.equal(getGoalProgress({ active_calories: 450 }), null);
});

test('activity intensity preserves exported vigorous, moderate, light, and sedentary durations', () => {
  const durations = getActivityIntensityDurations({
    high_activity_time: 900,
    medium_activity_time: 1800,
    low_activity_time: 3600,
    sedentary_time: 7200,
  });
  assert.deepEqual(durations.map(item => [item.key, item.seconds]), [
    ['vigorous', 900],
    ['moderate', 1800],
    ['light', 3600],
    ['sedentary', 7200],
  ]);
});

test('weekly benefits use the supplied metabolic and cardiovascular zone boundaries', () => {
  const appData = {
    activity: { '2026-07-01': [{ high_activity_time: 600, medium_activity_time: 1200, low_activity_time: 1800 }] },
    heartrate: {
      '2026-07-01': [
        { bpm: 100, timestamp: '2026-07-01T10:00:00-05:00' },
        { bpm: 115, timestamp: '2026-07-01T10:05:00-05:00' },
        { bpm: 80, timestamp: '2026-07-01T10:10:00-05:00' },
      ],
    },
  };
  const weekly = getWeeklyActivityBenefits(appData, '2026-07-01');
  const wednesday = weekly.days.find(day => day.date === '2026-07-01');
  assert.equal(weekly.hasHeartRateData, true);
  assert.equal(wednesday.metabolicMinutes, 5);
  assert.equal(wednesday.cardiovascularMinutes, 5);
  assert.equal(wednesday.activityMinutes, 60);
  assert.deepEqual(weekly.zoneMinutes, [5, 5, 5, 0, 0, 0]);
});

test('daily zone minutes preserve all six supplied heart-rate bands', () => {
  const records = [82, 96, 112, 130, 148, 166].map((bpm, index) => ({
    bpm,
    timestamp: `2026-07-01T10:${String(index * 5).padStart(2, '0')}:00-05:00`,
  }));
  assert.deepEqual(getDailyHeartRateZoneMinutes(records), [5, 5, 5, 5, 5, 5]);
  assert.deepEqual(getDailyActivityBenefits(records), {
    metabolicMinutes: 5,
    cardiovascularMinutes: 20,
    zoneMinutes: [5, 5, 5, 5, 5, 5],
  });
});
