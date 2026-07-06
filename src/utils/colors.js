export const SEMANTIC_COLORS = Object.freeze({
  bad: '#f43f5e',
  fair: '#f59e0b',
  solid: '#eab308',
  good: '#06b6d4',
  optimal: '#10b981',
  neutral: '#94a3b8',
});

export const METRIC_COLORS = Object.freeze({
  cardiovascular: '#e2e8f0',
  heartRate: '#e2e8f0',
  skinTemperature: '#e2e8f0',
});

export const SCORE_THRESHOLDS = Object.freeze([
  { minimum: 85, level: 'optimal' },
  { minimum: 70, level: 'good' },
  { minimum: 60, level: 'fair' },
  { minimum: Number.NEGATIVE_INFINITY, level: 'bad' },
]);

const STATUS_LEVELS = Object.freeze({
  bad: 'bad',
  poor: 'bad',
  'pay attention': 'bad',
  stressful: 'bad',
  limited: 'bad',
  fair: 'fair',
  balanced: 'fair',
  adequate: 'fair',
  solid: 'solid',
  good: 'good',
  normal: 'good',
  strong: 'good',
  optimal: 'optimal',
  restorative: 'optimal',
  restored: 'optimal',
  exceptional: 'optimal',
});

const toNumericScore = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const score = Number(value);
  return Number.isFinite(score) ? score : null;
};

export const getScoreLevel = (value) => {
  const score = toNumericScore(value);
  if (score === null) return null;
  return SCORE_THRESHOLDS.find(({ minimum }) => score >= minimum)?.level || null;
};

export const getScoreColor = (value) => {
  const level = getScoreLevel(value);
  return level ? SEMANTIC_COLORS[level] : SEMANTIC_COLORS.neutral;
};

export const getScoreStatus = (value) => {
  const level = getScoreLevel(value);
  if (!level) return 'No Data';
  return level === 'bad' ? 'Poor' : level.charAt(0).toUpperCase() + level.slice(1);
};

export const getStatusLevel = (status) => {
  if (status === null || status === undefined) return null;
  return STATUS_LEVELS[String(status).trim().toLowerCase()] || null;
};

export const getStatusColor = (status) => {
  const level = getStatusLevel(status);
  return level ? SEMANTIC_COLORS[level] : SEMANTIC_COLORS.neutral;
};

export const getBloodOxygenColor = (value) => {
  if (value === null || value === undefined || value === '') return SEMANTIC_COLORS.neutral;
  const bloodOxygen = Number(value);
  if (!Number.isFinite(bloodOxygen)) return SEMANTIC_COLORS.neutral;
  return bloodOxygen >= 95 ? SEMANTIC_COLORS.optimal : SEMANTIC_COLORS.bad;
};
