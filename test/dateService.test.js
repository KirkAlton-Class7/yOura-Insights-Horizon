import test from 'node:test';
import assert from 'node:assert/strict';
import { createDateService, createFixedClock } from '../src/utils/dateService.js';
import { groupDatesIntoWeeks } from '../src/utils/dateNavigation.js';

test('date presentation remains identical across time zones', () => {
  const chicago = createDateService({ timeZone: 'America/Chicago' });
  const tokyo = createDateService({ timeZone: 'Asia/Tokyo' });
  assert.deepEqual(chicago.getDatePresentation('2026-06-30'), tokyo.getDatePresentation('2026-06-30'));
  assert.equal(chicago.getDatePresentation('2026-06-30').dayOfMonth, 30);
});

test('leap-year February includes February 29 and transitions into March', () => {
  const dates = createDateService({ timeZone: 'UTC' });
  const cells = dates.getMonthCells('2024-02');
  assert.equal(cells.includes('2024-02-29'), true);
  assert.equal(dates.getMonthCells('2023-02').includes('2023-02-29'), false);
  assert.deepEqual(dates.getWeekDates('2024-02-29'), [
    '2024-02-25', '2024-02-26', '2024-02-27', '2024-02-28',
    '2024-02-29', '2024-03-01', '2024-03-02',
  ]);
});

test('month and year transitions use calendar arithmetic', () => {
  const dates = createDateService({ timeZone: 'UTC' });
  assert.equal(dates.addMonths('2023-12', 1), '2024-01');
  assert.equal(dates.addMonths('2024-03', -1), '2024-02');
  assert.equal(dates.addYears('2024-02', 1), '2025-02');
  assert.equal(dates.getMonthCells('2024-04').filter(date => date.startsWith('2024-04')).length, 30);
  assert.equal(dates.getMonthCells('2024-05').filter(date => date.startsWith('2024-05')).length, 31);
});

test('weeks stay Sunday through Saturday across year boundaries', () => {
  assert.deepEqual(groupDatesIntoWeeks(['2024-12-31', '2025-01-01']), [[
    '2024-12-29', '2024-12-30', '2024-12-31', '2025-01-01',
    '2025-01-02', '2025-01-03', '2025-01-04',
  ]]);
});

test('injected clocks resolve today deterministically in each zone', () => {
  const clock = createFixedClock('2024-03-10T05:30:00Z');
  const chicago = createDateService({ clock, timeZone: 'America/Chicago' });
  const tokyo = createDateService({ clock, timeZone: 'Asia/Tokyo' });
  assert.equal(chicago.today(), '2024-03-09');
  assert.equal(tokyo.today(), '2024-03-10');
});

test('date-only weeks are unaffected by daylight-saving transitions', () => {
  const dates = createDateService({ timeZone: 'America/Chicago' });
  assert.deepEqual(dates.getWeekDates('2024-03-10'), [
    '2024-03-10', '2024-03-11', '2024-03-12', '2024-03-13',
    '2024-03-14', '2024-03-15', '2024-03-16',
  ]);
  assert.deepEqual(dates.getWeekDates('2024-11-03'), [
    '2024-11-03', '2024-11-04', '2024-11-05', '2024-11-06',
    '2024-11-07', '2024-11-08', '2024-11-09',
  ]);
});

test('time axes include correctly positioned even-hour ticks', () => {
  const dates = createDateService({ timeZone: 'America/Chicago' });
  const ticks = dates.getTimeAxisTicks(
    '2026-07-03T06:38:00-05:00',
    '2026-07-03T11:36:00-05:00',
  );
  assert.deepEqual(ticks.map(tick => tick.label), ['6:38 am', '8 am', '10 am', '11:36 am']);
  assert.equal(ticks[0].position, 0);
  assert.equal(ticks[3].position, 1);
  assert.equal(ticks[1].position > 0 && ticks[1].position < ticks[2].position, true);
});
