const LOG_LEVELS: Record<string, number> = { error: 0, warn: 1, info: 2, debug: 3 };

let globalLevel = 'info';

/**
 * Set the global log level.
 */
export const setLogLevel = (level: string): void => {
  if (level in LOG_LEVELS) {
    globalLevel = level;
  }
};

export interface Logger {
  error: (msg: string, ...args: unknown[]) => void;
  warn: (msg: string, ...args: unknown[]) => void;
  info: (msg: string, ...args: unknown[]) => void;
  debug: (msg: string, ...args: unknown[]) => void;
}

/**
 * Create a scoped logger instance for a module.
 * Format: [YYYY-MM-DD HH:mm:ss] [LEVEL] [module] message
 */
export const createLogger = (moduleName: string): Logger => {
  const timestamp = (): string => {
    return new Date().toISOString().replace('T', ' ').slice(0, 19);
  };

  const shouldLog = (level: string): boolean =>
    (LOG_LEVELS[level] ?? 0) <= (LOG_LEVELS[globalLevel] ?? 0);

  const format = (level: string, msg: string, ...args: unknown[]): unknown[] => {
    const prefix = `[${timestamp()}] [${level.toUpperCase()}] [${moduleName}]`;
    return [prefix, msg, ...args];
  };

  return {
    error: (msg, ...args) => {
      if (shouldLog('error')) console.error(...format('error', msg, ...args));
    },
    warn: (msg, ...args) => {
      if (shouldLog('warn')) console.warn(...format('warn', msg, ...args));
    },
    info: (msg, ...args) => {
      if (shouldLog('info')) console.log(...format('info', msg, ...args));
    },
    debug: (msg, ...args) => {
      if (shouldLog('debug')) console.log(...format('debug', msg, ...args));
    },
  };
};
