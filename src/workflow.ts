import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

import { format, addMonths, parse, isBefore, isEqual } from 'date-fns';

import { buildMonthModel } from './calendar.js';
import { sendTimesheet } from './email.js';
import { getHolidays, filterHolidaysForMonth } from './holidays.js';
import { createLogger } from './logger.js';
import { getState, updateState } from './state.js';
import { generateTimesheet, calculateLeaveBalances } from './timesheet.js';
import type { AppConfig, TimesheetData } from './types.js';

const log = createLogger('workflow');

/**
 * Execute the timesheet workflow for a specific month.
 * Idempotent: skips if the month has already been processed.
 *
 * @param targetMonth - 'YYYY-MM' format (e.g., '2026-04')
 * @param config - Application configuration
 * @returns true if executed, false if skipped
 */
export const executeWorkflow = async (
  targetMonth: string,
  config: Readonly<AppConfig>
): Promise<boolean> => {
  log.info(`=== Workflow start: ${targetMonth} ===`);

  // Step 1: Check execution state
  const state = await getState(config.paths.executionState);
  if (state.lastProcessedMonth !== null && state.lastProcessedMonth >= targetMonth) {
    log.info(`Month ${targetMonth} already processed — skipping`);
    return false;
  }

  // Step 2: Load timesheet data
  if (!existsSync(config.paths.timesheetData)) {
    throw new Error(`Timesheet data file not found: ${config.paths.timesheetData}`);
  }
  const timesheetData = JSON.parse(
    await readFile(config.paths.timesheetData, 'utf-8')
  ) as TimesheetData;
  log.info('Timesheet data loaded');

  // Step 3: Parse target month
  const [yearStr, monthStr] = targetMonth.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);

  // Step 4: Fetch holidays
  const allHolidays = await getHolidays(year, config);
  const monthHolidays = filterHolidaysForMonth(allHolidays, year, month);
  log.info(`Holidays for ${targetMonth}: ${monthHolidays.size} found`);

  // Step 5: Build leave dates map
  const monthData = timesheetData.months[targetMonth];
  const leaveDates = new Map<string, 'annual' | 'medical'>();
  if (monthData) {
    for (const dateStr of monthData['annual-leave-dates']) {
      leaveDates.set(dateStr, 'annual');
    }
    for (const dateStr of monthData['medical-leave-dates']) {
      leaveDates.set(dateStr, 'medical');
    }
  }

  // Step 6: Build calendar model
  const monthModel = buildMonthModel(year, month, monthHolidays, leaveDates);
  log.info(
    `Calendar: ${monthModel.totalDays} days, ${monthModel.totalWorkingDays} working, ${leaveDates.size} leave`
  );

  // Step 7: Calculate leave balances
  const leaveBalances = calculateLeaveBalances(timesheetData, targetMonth);
  log.info(
    `Leave balances: AL pending=${leaveBalances.annualLeavePending}, ML pending=${leaveBalances.medicalLeavePending}`
  );

  // Step 8: Generate timesheet
  const outputPath = await generateTimesheet(monthModel, leaveBalances, timesheetData, config);

  // Step 9: Send email
  try {
    await sendTimesheet(outputPath, year, month, timesheetData.employee.name, config);
  } catch (err) {
    log.error('Email sending failed — timesheet was generated but not sent:', err);
    log.warn(`You can manually send: ${outputPath}`);
    // Don't throw — timesheet was generated successfully. State will still update.
  }

  // Step 10: Update execution state
  await updateState(config.paths.executionState, targetMonth);

  log.info(`=== Workflow complete: ${targetMonth} ===`);
  return true;
};

/**
 * Check for missed executions and run workflow for each missed month.
 * Called on service startup for recovery.
 */
export const recoverMissedExecutions = async (config: Readonly<AppConfig>): Promise<void> => {
  const state = await getState(config.paths.executionState);
  const now = new Date();
  const currentMonth = format(now, 'yyyy-MM');

  if (!state.lastProcessedMonth) {
    log.info('No previous execution — running for current month');
    await executeWorkflow(currentMonth, config);
    return;
  }

  if (state.lastProcessedMonth >= currentMonth) {
    log.info('No missed executions detected');
    return;
  }

  // Generate for each missed month (lastProcessed+1 through current)
  let cursor = parse(state.lastProcessedMonth, 'yyyy-MM', new Date());
  const currentDate = parse(currentMonth, 'yyyy-MM', new Date());

  cursor = addMonths(cursor, 1);
  while (isBefore(cursor, currentDate) || isEqual(cursor, currentDate)) {
    const monthKey = format(cursor, 'yyyy-MM');
    log.warn(`Recovery: processing missed month ${monthKey}`);
    await executeWorkflow(monthKey, config);
    cursor = addMonths(cursor, 1);
  }
};
