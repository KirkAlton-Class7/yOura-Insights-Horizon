const recordsForDate = value => (Array.isArray(value) ? value : value ? [value] : []);

export const hasUsableRecord = record => (
  Boolean(record)
  && typeof record === 'object'
  && Object.keys(record).length > 0
);

export const getAvailableRecordDates = (dataset, isRecordAvailable = hasUsableRecord) => Object.freeze(
  Object.keys(dataset || {})
    .filter(date => recordsForDate(dataset[date]).some(isRecordAvailable))
    .sort(),
);

export const getAvailableDatesAcrossDatasets = (datasets) => Object.freeze(
  Array.from(new Set((datasets || []).flatMap(dataset => getAvailableRecordDates(dataset)))).sort(),
);
