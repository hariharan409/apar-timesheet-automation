import { describe, it, expect } from 'vitest';

import type { TimesheetData } from '../src/config/types.js';
import { calculateLeaveBalances } from '../src/timesheet/timesheet.js';

const baseData: TimesheetData = {
  employee: { name: 'Test User', client: 'Test Client' },
  'annual-leave-allocation': 6,
  'medical-leave-allocation': 6,
  'work-mode': 'wfh',
  months: {
    '2026-01': { 'annual-leave-dates': ['2026-01-05'], 'medical-leave-dates': [], 'comp-off': 0 },
    '2026-02': {
      'annual-leave-dates': ['2026-02-10', '2026-02-11'],
      'medical-leave-dates': ['2026-02-20'],
      'comp-off': 0,
    },
    '2026-03': { 'annual-leave-dates': [], 'medical-leave-dates': [], 'comp-off': 0 },
  },
};

describe('calculateLeaveBalances', () => {
  it('should calculate cumulative leave balances for January', () => {
    const balances = calculateLeaveBalances(baseData, '2026-01');

    expect(balances.annualLeaveUsed).toBe(1);
    expect(balances.medicalLeaveUsed).toBe(0);
    expect(balances.annualLeavePending).toBe(5);
    expect(balances.medicalLeavePending).toBe(6);
  });

  it('should accumulate leaves up to February', () => {
    const balances = calculateLeaveBalances(baseData, '2026-02');

    expect(balances.annualLeaveUsed).toBe(3); // 1 + 2
    expect(balances.medicalLeaveUsed).toBe(1);
    expect(balances.annualLeavePending).toBe(3);
    expect(balances.medicalLeavePending).toBe(5);
  });

  it('should accumulate leaves up to March (no new leaves)', () => {
    const balances = calculateLeaveBalances(baseData, '2026-03');

    expect(balances.annualLeaveUsed).toBe(3);
    expect(balances.medicalLeaveUsed).toBe(1);
    expect(balances.annualLeavePending).toBe(3);
    expect(balances.medicalLeavePending).toBe(5);
  });

  it('should return full allocation when no months exist', () => {
    const emptyData: TimesheetData = {
      ...baseData,
      months: {},
    };
    const balances = calculateLeaveBalances(emptyData, '2026-04');

    expect(balances.annualLeavePending).toBe(6);
    expect(balances.medicalLeavePending).toBe(6);
  });
});
