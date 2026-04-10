// ── Types ─────────────────────────────────────────────

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
}

export interface EmailConfig {
  from: string;
  to: string;
}

export interface PathsConfig {
  root: string;
  data: string;
  templates: string;
  output: string;
  holidaysCache: string;
  timesheetData: string;
  executionState: string;
  template: string;
}

export interface AppConfig {
  smtp: Readonly<SmtpConfig>;
  email: Readonly<EmailConfig>;
  calendarificApiKey: string;
  timezone: string;
  cronSchedule: string;
  logLevel: string;
  paths: Readonly<PathsConfig>;
}

export interface DayEntry {
  date: number;
  dayName: string;
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName?: string;
  isLeave: boolean;
  leaveType?: 'annual' | 'medical';
  isWorking: boolean;
  hours: number;
}

export interface MonthModel {
  year: number;
  month: number;
  monthName: string;
  totalDays: number;
  days: DayEntry[];
  totalWorkingDays: number;
  totalHours: number;
}

export interface MonthLeaveData {
  'annual-leave-dates': string[];
  'medical-leave-dates': string[];
  'comp-off': number;
}

export interface EmployeeInfo {
  name: string;
  client: string;
}

export interface TimesheetData {
  employee: EmployeeInfo;
  'annual-leave-allocation': number;
  'medical-leave-allocation': number;
  'work-mode': 'wfh' | 'wfo';
  months: Record<string, MonthLeaveData>;
}

export interface ExecutionState {
  lastProcessedMonth: string | null;
  lastExecutionTimestamp: string | null;
}

export interface LeaveBalances {
  annualLeaveUsed: number;
  medicalLeaveUsed: number;
  annualLeavePending: number;
  medicalLeavePending: number;
}

export interface HolidayEntry {
  name: string;
  date: string;
}
