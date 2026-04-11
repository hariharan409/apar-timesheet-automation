import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { AppConfig } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..', '..');

const REQUIRED_VARS = [
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'EMAIL_FROM',
  'EMAIL_TO',
  'CALENDARIFIC_API_KEY',
] as const;

/**
 * Load and validate all configuration from environment variables.
 * Fails fast with a clear error if any required variable is missing.
 */
export const loadConfig = (): Readonly<AppConfig> => {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return Object.freeze({
    smtp: Object.freeze({
      host: process.env.SMTP_HOST!,
      port: Number(process.env.SMTP_PORT!),
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    }),
    email: Object.freeze({
      from: process.env.EMAIL_FROM!,
      to: process.env.EMAIL_TO!,
    }),
    calendarificApiKey: process.env.CALENDARIFIC_API_KEY!,
    timezone: process.env.TZ || 'Asia/Singapore',
    cronSchedule: process.env.CRON_SCHEDULE || '0 9 1 * *',
    logLevel: process.env.LOG_LEVEL || 'info',
    paths: Object.freeze({
      root: PROJECT_ROOT,
      data: resolve(PROJECT_ROOT, 'data'),
      templates: resolve(PROJECT_ROOT, 'templates'),
      output: resolve(PROJECT_ROOT, 'output'),
      holidaysCache: resolve(PROJECT_ROOT, 'data', 'holidays-cache'),
      timesheetData: resolve(PROJECT_ROOT, 'data', 'timesheet-data.json'),
      executionState: resolve(PROJECT_ROOT, 'data', 'execution-state.json'),
      template: resolve(PROJECT_ROOT, 'templates', 'timesheet-template.xlsx'),
    }),
  });
};
