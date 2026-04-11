import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import { format } from 'date-fns';
import { Workbook } from 'exceljs';

import { createLogger } from './logger.js';
import { ROWS, COLS, MONTH_NAMES_SHORT } from './template-map.js';
import type { AppConfig, MonthModel, LeaveBalances, TimesheetData } from './types.js';

const log = createLogger('timesheet');

/**
 * Generate a timesheet Excel file from the template.
 * Fills in dates, hours, leave data, and signature area.
 * Never modifies the template — always writes to a new output file.
 *
 * @returns Path to the generated file
 */
export const generateTimesheet = async (
  monthModel: MonthModel,
  leaveBalances: LeaveBalances,
  timesheetData: TimesheetData,
  config: Readonly<AppConfig>
): Promise<string> => {
  const { year, month, monthName, days, totalWorkingDays } = monthModel;
  const employee = timesheetData.employee;
  const workMode: string = timesheetData['work-mode'];
  const monthKey = `${year}-${String(month).padStart(2, '0')}`;
  const monthData = timesheetData.months[monthKey];

  log.info(`Generating timesheet for ${monthName} ${year}`);

  // Load template
  const workbook = new Workbook();
  await workbook.xlsx.readFile(config.paths.template);
  const sheet = workbook.worksheets.at(0);
  if (!sheet) {
    throw new Error('Template has no worksheets');
  }

  // ── Month & Year ───────────────────────────────────
  setCellValue(sheet, ROWS.MONTH, COLS.MONTH_NAME, monthName);
  setCellValue(sheet, ROWS.YEAR, COLS.YEAR, year);

  // ── Date numbers (row 10) & Day names (row 11) ────
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  for (let col = COLS.DATA_START; col <= COLS.DATA_END; col++) {
    const dayIndex = col - COLS.DATA_START;
    const day = days.at(dayIndex);
    if (day) {
      setCellValue(sheet, ROWS.DATE_NUMBERS, col, day.date);
      setCellValue(sheet, ROWS.DAY_NAMES, col, day.dayName);

      const hoursRow = workMode === 'wfo' ? ROWS.WFO_HOURS : ROWS.WFH_HOURS;
      const otherRow = workMode === 'wfo' ? ROWS.WFH_HOURS : ROWS.WFO_HOURS;
      setCellValue(sheet, hoursRow, col, day.hours > 0 ? day.hours : null);
      setCellValue(sheet, otherRow, col, null);
    } else {
      // Clear columns beyond month length (e.g., 29–31 for February)
      setCellValue(sheet, ROWS.DATE_NUMBERS, col, null);
      setCellValue(sheet, ROWS.DAY_NAMES, col, null);
      setCellValue(sheet, ROWS.WFO_HOURS, col, null);
      setCellValue(sheet, ROWS.WFH_HOURS, col, null);
    }
  }

  // ── Total working days ─────────────────────────────
  setCellValue(sheet, ROWS.TOTAL_WORKING_DAYS, COLS.TOTAL_DAYS, totalWorkingDays);

  // ── Leave section ──────────────────────────────────
  const alAllocation = timesheetData['annual-leave-allocation'];
  const mlAllocation = timesheetData['medical-leave-allocation'];
  const alUsedThisMonth = monthData ? monthData['annual-leave-dates'].length : 0;
  const mlUsedThisMonth = monthData ? monthData['medical-leave-dates'].length : 0;
  const compOff = monthData ? monthData['comp-off'] : 0;

  // Row 17: Leave eligibility
  setCellValue(sheet, ROWS.LEAVE_ELIGIBILITY, COLS.AL, alAllocation);
  setCellValue(sheet, ROWS.LEAVE_ELIGIBILITY, COLS.ML, mlAllocation);

  // Row 19: AL availed this month
  setCellValue(sheet, ROWS.AL_AVAILED, COLS.AL, alUsedThisMonth || null);

  // Row 20: ML availed this month
  setCellValue(sheet, ROWS.ML_AVAILED, COLS.AL, mlUsedThisMonth || null);

  // Row 21: Leave pending at end of month
  setCellValue(sheet, ROWS.LEAVE_PENDING, COLS.AL, leaveBalances.annualLeavePending);
  setCellValue(sheet, ROWS.LEAVE_PENDING, COLS.ML, leaveBalances.medicalLeavePending);

  // Row 22: Comp off
  setCellValue(sheet, ROWS.COMP_OFF, COLS.AL, compOff || null);

  // Row 23: Total pending leave
  setCellValue(sheet, ROWS.TOTAL_PENDING, COLS.AL, leaveBalances.annualLeavePending);
  setCellValue(sheet, ROWS.TOTAL_PENDING, COLS.ML, leaveBalances.medicalLeavePending);

  // ── Update dynamic labels with month name ──────────
  updateMonthInLabel(sheet, ROWS.LEAVE_ELIGIBILITY, monthName, year);
  updateMonthInLabel(sheet, ROWS.AL_AVAILED, monthName);
  updateMonthInLabel(sheet, ROWS.ML_AVAILED, monthName);
  updateMonthInLabel(sheet, ROWS.LEAVE_PENDING, monthName);
  updateMonthInLabel(sheet, ROWS.COMP_OFF, monthName, year);

  // ── Signature area ─────────────────────────────────
  setCellValue(sheet, ROWS.SIGNATURE_NAME, 1, employee.name);
  setCellValue(sheet, ROWS.SIGNATURE_NAME, COLS.SIGNATURE_DATE, format(new Date(), 'd/M/yyyy'));

  // ── Save output ────────────────────────────────────
  if (!existsSync(config.paths.output)) {
    await mkdir(config.paths.output, { recursive: true });
  }

  const outputFileName = `timesheet-${monthKey}.xlsx`;
  const outputPath = resolve(config.paths.output, outputFileName);
  await workbook.xlsx.writeFile(outputPath);

  log.info(`Timesheet saved: ${outputPath}`);
  return outputPath;
};

/**
 * Calculate cumulative leave balances up to and including the target month.
 */
export const calculateLeaveBalances = (
  timesheetData: TimesheetData,
  targetMonth: string
): LeaveBalances => {
  const alAllocation = timesheetData['annual-leave-allocation'];
  const mlAllocation = timesheetData['medical-leave-allocation'];
  let annualLeaveUsed = 0;
  let medicalLeaveUsed = 0;

  // Sort month keys and accumulate up to targetMonth
  const sortedMonths = Object.keys(timesheetData.months).sort();
  for (const monthKey of sortedMonths) {
    if (monthKey > targetMonth) break;
    const monthData = timesheetData.months[monthKey];
    if (monthData) {
      annualLeaveUsed += monthData['annual-leave-dates'].length;
      medicalLeaveUsed += monthData['medical-leave-dates'].length;
    }
  }

  return {
    annualLeaveUsed,
    medicalLeaveUsed,
    annualLeavePending: alAllocation - annualLeaveUsed,
    medicalLeavePending: mlAllocation - medicalLeaveUsed,
  };
};

// ── Helpers ────────────────────────────────────────────

const setCellValue = (
  sheet: import('exceljs').Worksheet,
  row: number,
  col: number,
  value: string | number | null
): void => {
  const cell = sheet.getCell(row, col);
  cell.value = value as import('exceljs').CellValue;
};

/**
 * Replace month names in existing label text.
 * e.g., "Total Leave Eligibility in the Mar 2026" → "Total Leave Eligibility in the Apr 2026"
 */
const updateMonthInLabel = (
  sheet: import('exceljs').Worksheet,
  row: number,
  monthName: string,
  year?: number
): void => {
  const cell = sheet.getCell(row, COLS.LABEL);
  const currentValue = cell.value;
  if (typeof currentValue !== 'string') return;

  let updated = currentValue;
  for (const name of MONTH_NAMES_SHORT) {
    updated = updated.replace(new RegExp(name, 'gi'), monthName);
  }
  if (year) {
    updated = updated.replace(/\d{4}/, String(year));
  }
  cell.value = updated;
};
