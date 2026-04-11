import 'dotenv/config';
import { format } from 'date-fns';

import { loadConfig } from './config/config.js';
import { setLogLevel, createLogger } from './core/logger.js';
import { startScheduler } from './core/scheduler.js';
import { executeWorkflow, recoverMissedExecutions } from './workflow.js';

const config = loadConfig();
setLogLevel(config.logLevel);

const log = createLogger('main');

const main = async (): Promise<void> => {
  log.info('╔══════════════════════════════════════════╗');
  log.info('║  Apar Timesheet Automation — Starting    ║');
  log.info('╚══════════════════════════════════════════╝');
  log.info(`Timezone: ${config.timezone}`);
  log.info(`Schedule: ${config.cronSchedule}`);

  const isRunNow = process.argv.includes('--run-now');

  if (isRunNow) {
    // Manual trigger mode — run for current month and exit
    const targetMonth =
      process.argv[process.argv.indexOf('--run-now') + 1] || format(new Date(), 'yyyy-MM');
    log.info(`Manual trigger: generating for ${targetMonth}`);
    await executeWorkflow(targetMonth, config);
    log.info('Manual run complete — exiting');
    process.exit(0);
  }

  // Recovery check — process any missed months
  await recoverMissedExecutions(config);

  // Start scheduler for future months
  startScheduler(config, (targetMonth) => executeWorkflow(targetMonth, config));

  log.info('Service is running. Press Ctrl+C to stop.');
};

main().catch((err) => {
  log.error('Fatal error:', err);
  process.exit(1);
});
