export const DATASET_DEFINITIONS = Object.freeze([
  { fileKey: 'dailyreadiness', dataKey: 'readiness', label: 'Daily Readiness', primary: true },
  { fileKey: 'dailysleep', dataKey: 'sleep', label: 'Daily Sleep', primary: true },
  { fileKey: 'dailyactivity', dataKey: 'activity', label: 'Daily Activity', primary: true },
  { fileKey: 'dailyspo2', dataKey: 'spo2', label: 'Daily SpO₂', primary: false },
  { fileKey: 'heartrate', dataKey: 'heartrate', label: 'Heart Rate', primary: false },
  { fileKey: 'temperature', dataKey: 'temperature', label: 'Temperature', primary: false },
  { fileKey: 'sleeptime', dataKey: 'sleeptime', label: 'Sleep Time', primary: false },
  { fileKey: 'dailystress', dataKey: 'stress', label: 'Daily Stress', primary: false },
  { fileKey: 'dailyresilience', dataKey: 'resilience', label: 'Daily Resilience', primary: false },
  { fileKey: 'daytimestress', dataKey: 'daytimestress', label: 'Daytime Stress', primary: false },
  { fileKey: 'dailycardiovascularage', dataKey: 'cardiovascularage', label: 'Daily Cardiovascular Age', primary: false },
  { fileKey: 'sleepmodel', dataKey: 'sleepmodel', label: 'Sleep Model', primary: false },
]);

export const FILE_MAP = Object.freeze(Object.fromEntries(
  DATASET_DEFINITIONS.map(({ fileKey, dataKey }) => [fileKey, dataKey]),
));

export const SUPPORTED_DATA_KEYS = Object.freeze(
  DATASET_DEFINITIONS.map(({ dataKey }) => dataKey),
);

export const PRIMARY_FILE_KEYS = Object.freeze(
  DATASET_DEFINITIONS.filter(({ primary }) => primary).map(({ fileKey }) => fileKey),
);

export const PRIMARY_DATA_KEYS = Object.freeze(
  DATASET_DEFINITIONS.filter(({ primary }) => primary).map(({ dataKey }) => dataKey),
);

export const hasDatedRecords = groupedData => (
  groupedData && Object.keys(groupedData).length > 0
);

export const getUnavailableDatasets = data => DATASET_DEFINITIONS.filter(
  ({ dataKey }) => !hasDatedRecords(data?.[dataKey]),
);
