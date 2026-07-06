import { Temporal } from '@js-temporal/polyfill';

const WEEKDAYS_SHORT = Object.freeze(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
const WEEKDAYS_LONG = Object.freeze(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);
const MONTHS_LONG = Object.freeze([
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]);
const MONTHS_SHORT = Object.freeze([
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]);

const systemClock = Object.freeze({
  instant: () => Temporal.Now.instant(),
});

const systemTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

const formatClockTime = ({ hour, minute }) => {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${String(displayHour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`;
};

const formatAxisClockTime = ({ hour, minute }) => {
  const period = hour >= 12 ? 'pm' : 'am';
  const displayHour = hour % 12 || 12;
  return `${displayHour}${minute ? `:${String(minute).padStart(2, '0')}` : ''} ${period}`;
};

const offsetTimeZone = (seconds) => {
  const totalMinutes = Math.trunc(Number(seconds || 0) / 60);
  const sign = totalMinutes < 0 ? '-' : '+';
  const absoluteMinutes = Math.abs(totalMinutes);
  const hours = Math.floor(absoluteMinutes / 60);
  const minutes = absoluteMinutes % 60;
  return `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

export const createFixedClock = instant => Object.freeze({
  instant: () => Temporal.Instant.from(instant),
});

export function createDateService({ clock = systemClock, timeZone = systemTimeZone() } = {}) {
  const parseDate = dateKey => Temporal.PlainDate.from(dateKey, { overflow: 'reject' });
  const parseMonth = monthKey => Temporal.PlainYearMonth.from(monthKey, { overflow: 'reject' });
  const weekdayIndex = date => date.dayOfWeek % 7;
  const dateKey = date => date.toString();

  const getDatePresentation = value => {
    const date = parseDate(value);
    const index = weekdayIndex(date);
    return Object.freeze({
      dateKey: dateKey(date),
      dayOfMonth: date.day,
      month: date.month,
      monthShort: MONTHS_SHORT[date.month - 1],
      monthLong: MONTHS_LONG[date.month - 1],
      year: date.year,
      weekdayIndex: index,
      weekdayShort: WEEKDAYS_SHORT[index],
      weekdayLong: WEEKDAYS_LONG[index],
    });
  };

  const getYearMonthPresentation = value => {
    const month = parseMonth(value);
    return Object.freeze({
      monthKey: month.toString(),
      month: month.month,
      monthIndex: month.month - 1,
      monthName: MONTHS_LONG[month.month - 1],
      year: month.year,
    });
  };

  const startOfWeek = value => {
    const date = parseDate(value);
    return date.subtract({ days: weekdayIndex(date) });
  };

  const getWeekDates = value => {
    const start = startOfWeek(value);
    return Object.freeze(Array.from({ length: 7 }, (_, offset) => dateKey(start.add({ days: offset }))));
  };

  const getMonthCells = value => {
    const month = parseMonth(value);
    const first = month.toPlainDate({ day: 1 });
    const gridStart = first.subtract({ days: weekdayIndex(first) });
    return Object.freeze(Array.from({ length: 42 }, (_, offset) => dateKey(gridStart.add({ days: offset }))));
  };

  const getYearMonths = year => {
    const january = Temporal.PlainYearMonth.from({ year: Number(year), month: 1 });
    return Object.freeze(Array.from({ length: 12 }, (_, offset) => january.add({ months: offset }).toString()));
  };

  const formatTimestampTime = value => {
    try {
      return formatClockTime(Temporal.Instant.from(value).toZonedDateTimeISO(timeZone));
    } catch {
      return '--';
    }
  };

  const getTimeAxisTicks = (startValue, endValue, intervalHours = 2) => {
    try {
      const startInstant = Temporal.Instant.from(startValue);
      const endInstant = Temporal.Instant.from(endValue);
      const durationMilliseconds = endInstant.epochMilliseconds - startInstant.epochMilliseconds;
      if (durationMilliseconds <= 0) return Object.freeze([]);

      const start = startInstant.toZonedDateTimeISO(timeZone);
      const end = endInstant.toZonedDateTimeISO(timeZone);
      const ticks = [{ position: 0, label: formatAxisClockTime(start) }];
      let next = start.round({ smallestUnit: 'hour', roundingMode: 'ceil' });
      if (Temporal.ZonedDateTime.compare(next, start) <= 0) next = next.add({ hours: 1 });
      const remainder = next.hour % intervalHours;
      if (remainder) next = next.add({ hours: intervalHours - remainder });

      while (Temporal.ZonedDateTime.compare(next, end) < 0) {
        ticks.push({
          position: (next.toInstant().epochMilliseconds - startInstant.epochMilliseconds) / durationMilliseconds,
          label: formatAxisClockTime(next),
        });
        next = next.add({ hours: intervalHours });
      }
      ticks.push({ position: 1, label: formatAxisClockTime(end) });
      return Object.freeze(ticks.map(tick => Object.freeze(tick)));
    } catch {
      return Object.freeze([]);
    }
  };

  const formatOptimalBedtime = (day, optimalBedtime) => {
    if (!day || !optimalBedtime) return null;
    try {
      const zone = offsetTimeZone(optimalBedtime.day_tz);
      const midnight = parseDate(day).toZonedDateTime({
        timeZone: zone,
        plainTime: Temporal.PlainTime.from('00:00'),
      });
      const start = midnight.add({ seconds: Number(optimalBedtime.start_offset || 0) });
      const end = midnight.add({ seconds: Number(optimalBedtime.end_offset || 0) });
      return `${formatClockTime(start)} – ${formatClockTime(end)}`;
    } catch {
      return null;
    }
  };

  return Object.freeze({
    addDays: (value, days) => parseDate(value).add({ days }).toString(),
    addDateMonths: (value, months) => parseDate(value).add({ months }).toString(),
    addMonths: (value, months) => parseMonth(value).add({ months }).toString(),
    addYears: (value, years) => parseMonth(value).add({ years }).toString(),
    formatCurrentDateTime: () => {
      const current = clock.instant().toZonedDateTimeISO(timeZone);
      return `${current.month}/${current.day}/${current.year}, ${formatClockTime(current)}`;
    },
    formatMonthYear: value => {
      const month = getYearMonthPresentation(value);
      return `${month.monthName} ${month.year}`;
    },
    formatOptimalBedtime,
    formatTimestampTime,
    getDatePresentation,
    getMonthCells,
    getMonthRange: value => {
      const month = parseMonth(value);
      return Object.freeze({
        startDate: month.toPlainDate({ day: 1 }).toString(),
        endDate: month.toPlainDate({ day: month.daysInMonth }).toString(),
      });
    },
    getTimeAxisTicks,
    getWeekDates,
    getWeekday: value => weekdayIndex(parseDate(value)),
    getYearMonthPresentation,
    getYearMonths,
    isDateInMonth: (date, month) => parseDate(date).toPlainYearMonth().equals(parseMonth(month)),
    isValidDate: value => {
      try {
        parseDate(value);
        return true;
      } catch {
        return false;
      }
    },
    isValidTimestamp: value => {
      try {
        Temporal.Instant.from(value);
        return true;
      } catch {
        return false;
      }
    },
    timeZone,
    toYearMonth: value => parseDate(value).toPlainYearMonth().toString(),
    today: () => clock.instant().toZonedDateTimeISO(timeZone).toPlainDate().toString(),
    weekdayNames: style => style === 'long' ? WEEKDAYS_LONG : WEEKDAYS_SHORT,
  });
}

export const calendarDates = createDateService();
