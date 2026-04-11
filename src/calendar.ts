import { getDaysInMonth, getDay, format } from 'date-fns';

import { DEFAULT_HOURS, MONTH_NAMES_SHORT } from './template-map.js';
import type { DayEntry, MonthModel } from './types.js';

const DAY_NAMES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

/**
 * Build a complete month model with working/non-working day classification.
 * Pure function — no I/O, fully deterministic from inputs.
 *
 * @param year - Full year (e.g., 2026)
 * @param month - 1-indexed month (1=January, 12=December)
 * @param holidays - Set of date strings ('YYYY-MM-DD') that are public holidays
 * @param leaveDates - Map of date string → leave type ('annual' | 'medical')
 * @returns Complete month model with per-day breakdown and aggregates
 */
export const buildMonthModel = (
  year: number,
  month: number,
  holidays: Map<string, string>,
  leaveDates: Map<string, 'annual' | 'medical'>
): MonthModel => {
  const totalDays = getDaysInMonth(new Date(year, month - 1));
  const days: DayEntry[] = [];

  for (let date = 1; date <= totalDays; date++) {
    const dateObj = new Date(year, month - 1, date);
    const dateStr = format(dateObj, 'yyyy-MM-dd');
    const dayOfWeek = getDay(dateObj);
    const dayName = DAY_NAMES[dayOfWeek] ?? 'sun';
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = holidays.has(dateStr);
    const holidayName = holidays.get(dateStr);
    const leaveType = leaveDates.get(dateStr);
    const isLeave = leaveType !== undefined;
    const isWorking = !isWeekend && !isHoliday && !isLeave;
    const hours = isWorking ? DEFAULT_HOURS : 0;

    days.push({
      date,
      dayName,
      isWeekend,
      isHoliday,
      ...(holidayName && { holidayName }),
      isLeave,
      ...(leaveType && { leaveType }),
      isWorking,
      hours,
    });
  }

  const totalWorkingDays = days.filter((d) => d.isWorking).length;
  const totalHours = totalWorkingDays * DEFAULT_HOURS;

  return {
    year,
    month,
    monthName: MONTH_NAMES_SHORT[month - 1] ?? 'Jan',
    totalDays,
    days,
    totalWorkingDays,
    totalHours,
  };
};
