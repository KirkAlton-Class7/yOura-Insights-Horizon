import { calendarDates } from './dateService.js';
import { calculateSleepDebt, getDailySleepSeconds } from './sleepDebt.js';

export function getSleepDebtHistory(groupedSleepModel, selectedDate, length = 7) {
  return Object.freeze(Array.from({ length }, (_, index) => {
    const date = calendarDates.addDays(selectedDate, index - (length - 1));
    const debt = calculateSleepDebt(groupedSleepModel, date);
    const totalSleepSeconds = getDailySleepSeconds(groupedSleepModel?.[date]);
    return Object.freeze({
      date,
      debtSeconds: debt?.debtSeconds ?? null,
      sleepNeedSeconds: debt?.sleepNeedSeconds ?? null,
      totalSleepSeconds: totalSleepSeconds > 0 ? totalSleepSeconds : null,
      category: debt?.category ?? null,
      sleepNeedMet: Boolean(totalSleepSeconds > 0 && debt && totalSleepSeconds >= debt.sleepNeedSeconds),
    });
  }));
}
