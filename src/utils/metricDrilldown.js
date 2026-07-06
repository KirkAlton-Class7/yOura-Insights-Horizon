import { calendarDates } from './dateService.js';
import { getLongSleepRecord } from './readinessDetails.js';
import { getActivityTimeSeconds, getGoalProgress } from './activityDetails.js';
import { TREND_RANGE_CONFIG } from './trendRanges.js';

export const READINESS_DRILLDOWN_METRICS = Object.freeze({
  restingHeartRate: Object.freeze({
    key: 'restingHeartRate',
    title: 'Resting Heart Rate',
    unit: 'bpm',
    precision: 0,
    axisStep: 5,
    source: 'sleepmodel',
    value: record => record?.resting_heart_rate ?? record?.lowest_heart_rate,
  }),
  averageHrv: Object.freeze({
    key: 'averageHrv',
    title: 'Heart Rate Variability',
    unit: 'ms',
    precision: 0,
    axisStep: 10,
    source: 'sleepmodel',
    value: record => record?.average_hrv,
  }),
  bodyTemperature: Object.freeze({
    key: 'bodyTemperature',
    title: 'Body Temperature Deviation',
    unit: '°C',
    precision: 2,
    axisStep: 0.1,
    source: 'readiness',
    value: record => record?.temperature_deviation,
  }),
  respiratoryRate: Object.freeze({
    key: 'respiratoryRate',
    title: 'Respiratory Rate',
    unit: '/ min',
    precision: 1,
    axisStep: 0.5,
    source: 'sleepmodel',
    value: record => record?.average_breath,
  }),
  totalSleep: Object.freeze({
    key: 'totalSleep',
    title: 'Total Sleep',
    unit: 'h',
    precision: 1,
    axisStep: 1,
    durationHours: true,
    source: 'sleepmodel',
    value: record => {
      const exported = Number(record?.total_sleep_duration);
      const seconds = Number.isFinite(exported)
        ? exported
        : Number(record?.deep_sleep_duration || 0)
          + Number(record?.rem_sleep_duration || 0)
          + Number(record?.light_sleep_duration || 0);
      return seconds > 0 ? seconds / 3600 : null;
    },
  }),
  timeInBed: Object.freeze({
    key: 'timeInBed',
    title: 'Time in Bed',
    unit: 'h',
    precision: 1,
    axisStep: 1,
    durationHours: true,
    source: 'sleepmodel',
    value: record => Number(record?.time_in_bed) > 0 ? Number(record.time_in_bed) / 3600 : null,
  }),
  sleepEfficiency: Object.freeze({
    key: 'sleepEfficiency',
    title: 'Sleep Efficiency',
    unit: '%',
    precision: 0,
    axisStep: 5,
    source: 'sleepmodel',
    value: record => record?.efficiency,
  }),
  deepSleepContributor: Object.freeze({
    key: 'deepSleepContributor', title: 'Deep Sleep Contributor', unit: '', precision: 0, axisStep: 10, source: 'sleep', value: record => record?.contributors?.deep_sleep,
  }),
  remSleepContributor: Object.freeze({
    key: 'remSleepContributor', title: 'REM Sleep Contributor', unit: '', precision: 0, axisStep: 10, source: 'sleep', value: record => record?.contributors?.rem_sleep,
  }),
  totalSleepContributor: Object.freeze({
    key: 'totalSleepContributor', title: 'Total Sleep Contributor', unit: '', precision: 0, axisStep: 10, source: 'sleep', value: record => record?.contributors?.total_sleep,
  }),
  efficiencyContributor: Object.freeze({
    key: 'efficiencyContributor', title: 'Efficiency Contributor', unit: '', precision: 0, axisStep: 10, source: 'sleep', value: record => record?.contributors?.efficiency,
  }),
  restfulnessContributor: Object.freeze({
    key: 'restfulnessContributor', title: 'Restfulness Contributor', unit: '', precision: 0, axisStep: 10, source: 'sleep', value: record => record?.contributors?.restfulness,
  }),
  latencyContributor: Object.freeze({
    key: 'latencyContributor', title: 'Latency Contributor', unit: '', precision: 0, axisStep: 10, source: 'sleep', value: record => record?.contributors?.latency,
  }),
  timingContributor: Object.freeze({
    key: 'timingContributor', title: 'Timing Contributor', unit: '', precision: 0, axisStep: 10, source: 'sleep', value: record => record?.contributors?.timing,
  }),
  meetDailyTargetsContributor: Object.freeze({
    key: 'meetDailyTargetsContributor', title: 'Meet Daily Targets Contributor', unit: '', precision: 0, axisStep: 10, source: 'activity', value: record => record?.contributors?.meet_daily_targets,
  }),
  moveEveryHourContributor: Object.freeze({
    key: 'moveEveryHourContributor', title: 'Move Every Hour Contributor', unit: '', precision: 0, axisStep: 10, source: 'activity', value: record => record?.contributors?.move_every_hour,
  }),
  recoveryTimeContributor: Object.freeze({
    key: 'recoveryTimeContributor', title: 'Recovery Time Contributor', unit: '', precision: 0, axisStep: 10, source: 'activity', value: record => record?.contributors?.recovery_time,
  }),
  stayActiveContributor: Object.freeze({
    key: 'stayActiveContributor', title: 'Stay Active Contributor', unit: '', precision: 0, axisStep: 10, source: 'activity', value: record => record?.contributors?.stay_active,
  }),
  trainingFrequencyContributor: Object.freeze({
    key: 'trainingFrequencyContributor', title: 'Training Frequency Contributor', unit: '', precision: 0, axisStep: 10, source: 'activity', value: record => record?.contributors?.training_frequency,
  }),
  trainingVolumeContributor: Object.freeze({
    key: 'trainingVolumeContributor', title: 'Training Volume Contributor', unit: '', precision: 0, axisStep: 10, source: 'activity', value: record => record?.contributors?.training_volume,
  }),
  activityGoalProgress: Object.freeze({
    key: 'activityGoalProgress', title: 'Goal Progress', unit: '%', precision: 0, axisStep: 10, source: 'activity', value: getGoalProgress,
  }),
  activityTotalBurn: Object.freeze({
    key: 'activityTotalBurn', title: 'Total Burn', unit: 'kcal', precision: 0, axisStep: 250, source: 'activity', value: record => record?.total_calories,
  }),
  activityTime: Object.freeze({
    key: 'activityTime', title: 'Activity Time', unit: 'h', precision: 1, axisStep: 1, durationHours: true, source: 'activity', value: record => {
      const seconds = getActivityTimeSeconds(record);
      return seconds > 0 ? seconds / 3600 : null;
    },
  }),
  activitySteps: Object.freeze({
    key: 'activitySteps', title: 'Steps', unit: '', precision: 0, axisStep: 2000, source: 'activity', value: record => record?.steps,
  }),
});

export const METRIC_DRILLDOWN_RANGES = TREND_RANGE_CONFIG;

const finiteNumber = value => {
  if (value === '' || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const dailyMetricValue = (appData, metric, date) => {
  const record = metric.source === 'sleepmodel'
    ? getLongSleepRecord(appData.sleepmodel?.[date])
    : appData[metric.source]?.[date]?.[0] || null;
  return finiteNumber(metric.value(record));
};

const mean = values => (
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null
);

const valuesBetween = (appData, metric, startDate, endDate) => {
  const source = appData[metric.source];
  return Object.keys(source || {})
    .filter(date => date >= startDate && date <= endDate)
    .map(date => dailyMetricValue(appData, metric, date))
    .filter(value => value !== null);
};

const dayLabel = date => {
  const presentation = calendarDates.getDatePresentation(date);
  return `${presentation.month}/${presentation.dayOfMonth}`;
};

const weekLabel = date => {
  const presentation = calendarDates.getDatePresentation(date);
  return `${presentation.monthShort} ${presentation.dayOfMonth}`;
};

const monthLabel = monthKey => {
  const presentation = calendarDates.getYearMonthPresentation(monthKey);
  return `${presentation.monthName.slice(0, 3)} '${String(presentation.year).slice(-2)}`;
};

export function getMetricDrilldownSeries(appData, metricKey, mode, anchorDate, requestedRange) {
  const metric = READINESS_DRILLDOWN_METRICS[metricKey];
  if (!metric) throw new Error(`Unknown metric: ${metricKey}`);
  const rangeConfig = METRIC_DRILLDOWN_RANGES[mode];
  if (!rangeConfig) throw new Error(`Unknown drilldown mode: ${mode}`);
  const range = requestedRange ?? rangeConfig.defaultValue;
  if (!Number.isInteger(range) || range < rangeConfig.minimum || range > rangeConfig.maximum) {
    throw new RangeError(`${mode} range must be a whole number from ${rangeConfig.minimum} to ${rangeConfig.maximum}`);
  }

  let points;
  if (mode === 'day') {
    const startDate = calendarDates.addDays(anchorDate, -(range - 1));
    points = Array.from({ length: range }, (_, index) => {
      const date = calendarDates.addDays(startDate, index);
      return Object.freeze({
        key: date,
        label: dayLabel(date),
        startDate: date,
        endDate: date,
        value: dailyMetricValue(appData, metric, date),
      });
    });
  } else if (mode === 'week') {
    const currentWeekStart = calendarDates.getWeekDates(anchorDate)[0];
    points = Array.from({ length: range }, (_, index) => {
      const startDate = calendarDates.addDays(currentWeekStart, (index - (range - 1)) * 7);
      const endDate = calendarDates.addDays(startDate, 6);
      return Object.freeze({
        key: startDate,
        label: weekLabel(startDate),
        startDate,
        endDate,
        value: mean(valuesBetween(appData, metric, startDate, endDate)),
      });
    });
  } else if (mode === 'month') {
    const currentMonth = calendarDates.toYearMonth(anchorDate);
    points = Array.from({ length: range }, (_, index) => {
      const monthKey = calendarDates.addMonths(currentMonth, index - (range - 1));
      const { startDate, endDate } = calendarDates.getMonthRange(monthKey);
      return Object.freeze({
        key: monthKey,
        label: monthLabel(monthKey),
        startDate,
        endDate,
        value: mean(valuesBetween(appData, metric, startDate, endDate)),
      });
    });
  }

  const observed = points.map(point => point.value).filter(value => value !== null);
  return Object.freeze({
    baseline: mean(observed),
    metric,
    points: Object.freeze(points),
    windowStart: points[0].startDate,
    windowEnd: points[points.length - 1].endDate,
  });
}

export function shiftMetricDrilldownAnchor(anchorDate, mode, direction) {
  if (mode === 'day') return calendarDates.addDays(anchorDate, direction * 7);
  if (mode === 'week') return calendarDates.addDays(anchorDate, direction * 49);
  if (mode === 'month') return calendarDates.addDateMonths(anchorDate, direction * 7);
  throw new Error(`Unknown drilldown mode: ${mode}`);
}

export function getMetricAvailableDates(appData, metricKey) {
  const metric = READINESS_DRILLDOWN_METRICS[metricKey];
  if (!metric) return Object.freeze([]);
  const source = appData[metric.source];
  return Object.freeze(Object.keys(source || {})
    .filter(date => dailyMetricValue(appData, metric, date) !== null)
    .sort());
}

export function getMetricAvailableDateRange(appData, metricKey) {
  const dates = getMetricAvailableDates(appData, metricKey);
  return dates.length ? Object.freeze({ earliest: dates[0], latest: dates[dates.length - 1] }) : null;
}
