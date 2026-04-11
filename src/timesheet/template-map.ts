/**
 * Template cell position constants.
 * Single source of truth for all Excel cell mappings.
 * If the template layout changes, update ONLY this file.
 *
 * Based on analysis of: "11. Apar Technologies - NOV 2025.xlsx"
 * Row/col numbers are 1-indexed (ExcelJS convention).
 */

export const ROWS = {
  COMPANY_NAME: 2,
  CLIENT_LOCATION: 4,
  TIMESHEET_LABEL: 4,
  EMPLOYEE_NAME: 6,
  MONTH: 8,
  YEAR: 8,
  DATE_NUMBERS: 10,
  DAY_NAMES: 11,
  WFO_HOURS: 12,
  WFH_HOURS: 13,
  TOTAL_WORKING_DAYS: 15,
  LEAVE_HEADER: 16,
  LEAVE_ELIGIBILITY: 17,
  CALENDAR_NOTE: 18,
  AL_AVAILED: 19,
  ML_AVAILED: 20,
  LEAVE_PENDING: 21,
  COMP_OFF: 22,
  TOTAL_PENDING: 23,
  SIGNATURE_NAME: 31,
  SIGNATURE_LABELS: 32,
} as const;

export const COLS = {
  /** Label column (B) */
  LABEL: 2,
  /** Data starts at column C (date 1) */
  DATA_START: 3,
  /** Data ends at column AG (date 31) */
  DATA_END: 33,
  /** Employee name value (D) */
  EMPLOYEE_NAME: 4,
  /** Client location value (D) */
  CLIENT_LOCATION: 4,
  /** Month name value (D) */
  MONTH_NAME: 4,
  /** Year value (H) */
  YEAR: 8,
  /** Total working days value (E) */
  TOTAL_DAYS: 5,
  /** AL column in leave section (C) */
  AL: 3,
  /** ML column in leave section (D) */
  ML: 4,
  /** Signature date column (H) */
  SIGNATURE_DATE: 8,
  /** Notes label column (Q) */
  NOTES: 17,
} as const;

/** Default working hours per day */
export const DEFAULT_HOURS = 8;

/** Short month names (lowercase) for label replacement */
export const MONTH_NAMES_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

/** Full month names for email subject */
export const MONTH_NAMES_FULL = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;
