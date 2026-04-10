import cron from 'node-cron';
import { format } from 'date-fns';
import { createLogger } from './logger.js';
import type { AppConfig } from './types.js';

const log = createLogger('scheduler');

/**
 * Start the cron scheduler for monthly timesheet generation.
 *
 * @param config - Application configuration
 * @param workflowFn - The workflow function to execute on trigger
 */
export function startScheduler(
  config: Readonly<AppConfig>,
  workflowFn: (targetMonth: string) => Promise<boolean>,
): void {
  const schedule = config.cronSchedule;

  if (!cron.validate(schedule)) {
    throw new Error(`Invalid cron schedule: ${schedule}`);
  }

  cron.schedule(
    schedule,
    async () => {
      const targetMonth = format(new Date(), 'yyyy-MM');
      log.info(`Cron triggered — executing workflow for ${targetMonth}`);
      try {
        await workflowFn(targetMonth);
      } catch (err) {
        log.error('Scheduled workflow failed:', err);
      }
    },
    { timezone: config.timezone },
  );

  log.info(`Scheduler started: "${schedule}" (timezone: ${config.timezone})`);
  log.info('Next execution: 1st of next month at configured time');
}
