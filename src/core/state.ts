import { existsSync } from 'node:fs';
import { readFile, writeFile, rename } from 'node:fs/promises';

import type { ExecutionState } from '../config/types.js';

import { createLogger } from './logger.js';

const log = createLogger('state');

const DEFAULT_STATE: ExecutionState = {
  lastProcessedMonth: null,
  lastExecutionTimestamp: null,
};

/**
 * Read the current execution state.
 * Returns default state if the file doesn't exist yet.
 */
export const getState = async (statePath: string): Promise<ExecutionState> => {
  if (!existsSync(statePath)) {
    log.info('No execution state found — first run');
    return { ...DEFAULT_STATE };
  }

  const raw = await readFile(statePath, 'utf-8');
  return JSON.parse(raw) as ExecutionState;
};

/**
 * Update the execution state with the processed month.
 * Uses atomic write (write to temp → rename) to prevent corruption.
 */
export const updateState = async (statePath: string, month: string): Promise<void> => {
  const state: ExecutionState = {
    lastProcessedMonth: month,
    lastExecutionTimestamp: new Date().toISOString(),
  };

  const tempPath = `${statePath}.tmp`;
  await writeFile(tempPath, JSON.stringify(state, null, 2), 'utf-8');
  await rename(tempPath, statePath);

  log.info(`State updated: lastProcessedMonth = ${month}`);
};
