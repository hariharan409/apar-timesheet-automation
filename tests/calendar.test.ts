import { describe, it, expect } from 'vitest';

import { buildMonthModel } from '../src/calendar.js';

describe('buildMonthModel', () => {
  it('should generate correct days for March 2026 (31 days)', () => {
    const holidays = new Map<string, string>();
    const leaves = new Map<string, 'annual' | 'medical'>();

    const model = buildMonthModel(2026, 3, holidays, leaves);

    expect(model.totalDays).toBe(31);
    expect(model.monthName).toBe('Mar');
    expect(model.year).toBe(2026);
    expect(model.month).toBe(3);
    expect(model.days).toHaveLength(31);
  });

  it('should calculate 22 working days for March 2026', () => {
    const holidays = new Map<string, string>();
    const leaves = new Map<string, 'annual' | 'medical'>();

    const model = buildMonthModel(2026, 3, holidays, leaves);

    expect(model.totalWorkingDays).toBe(22);
    expect(model.totalHours).toBe(22 * 8);
  });

  it('should mark weekends correctly', () => {
    const holidays = new Map<string, string>();
    const leaves = new Map<string, 'annual' | 'medical'>();

    const model = buildMonthModel(2026, 3, holidays, leaves);

    // March 1, 2026 is a Sunday
    expect(model.days[0].dayName).toBe('sun');
    expect(model.days[0].isWeekend).toBe(true);
    expect(model.days[0].hours).toBe(0);

    // March 2, 2026 is a Monday
    expect(model.days[1].dayName).toBe('mon');
    expect(model.days[1].isWeekend).toBe(false);
    expect(model.days[1].hours).toBe(8);
  });

  it('should mark holidays as non-working', () => {
    const holidays = new Map([['2026-03-02', 'Test Holiday']]);
    const leaves = new Map<string, 'annual' | 'medical'>();

    const model = buildMonthModel(2026, 3, holidays, leaves);

    // March 2 is Monday but marked as holiday
    expect(model.days[1].isHoliday).toBe(true);
    expect(model.days[1].holidayName).toBe('Test Holiday');
    expect(model.days[1].isWorking).toBe(false);
    expect(model.days[1].hours).toBe(0);
    expect(model.totalWorkingDays).toBe(21); // 22 - 1 holiday
  });

  it('should mark leave days as non-working', () => {
    const holidays = new Map<string, string>();
    const leaves = new Map<string, 'annual' | 'medical'>([
      ['2026-03-03', 'annual'],
      ['2026-03-04', 'medical'],
    ]);

    const model = buildMonthModel(2026, 3, holidays, leaves);

    expect(model.days[2].isLeave).toBe(true);
    expect(model.days[2].leaveType).toBe('annual');
    expect(model.days[2].hours).toBe(0);

    expect(model.days[3].isLeave).toBe(true);
    expect(model.days[3].leaveType).toBe('medical');
    expect(model.days[3].hours).toBe(0);

    expect(model.totalWorkingDays).toBe(20); // 22 - 2 leaves
  });

  it('should handle February in a non-leap year (2026)', () => {
    const holidays = new Map<string, string>();
    const leaves = new Map<string, 'annual' | 'medical'>();

    const model = buildMonthModel(2026, 2, holidays, leaves);

    expect(model.totalDays).toBe(28);
    expect(model.monthName).toBe('Feb');
  });

  it('should handle February in a leap year (2028)', () => {
    const holidays = new Map<string, string>();
    const leaves = new Map<string, 'annual' | 'medical'>();

    const model = buildMonthModel(2028, 2, holidays, leaves);

    expect(model.totalDays).toBe(29);
  });

  it('should handle months with 30 days (April)', () => {
    const holidays = new Map<string, string>();
    const leaves = new Map<string, 'annual' | 'medical'>();

    const model = buildMonthModel(2026, 4, holidays, leaves);

    expect(model.totalDays).toBe(30);
    expect(model.monthName).toBe('Apr');
  });
});
