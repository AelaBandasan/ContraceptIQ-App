/**
 * Logging Utility
 *
 * Provides consistent logging across the app.
 * Can be configured to send logs to a remote service.
 */

// ============================================================================
// TYPES
// ============================================================================

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  data?: Record<string, any>;
  error?: Error;
}

// ============================================================================
// LOGGER CLASS
// ============================================================================

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 100;
  private isDevelopment = __DEV__;
  private remoteLogService?: (entry: LogEntry) => Promise<void>;

  /**
   * Configure the logger
   */
  configure(options: {
    isDevelopment?: boolean;
    maxLogs?: number;
    remoteLogService?: (entry: LogEntry) => Promise<void>;
  }) {
    if (options.isDevelopment !== undefined) {
      this.isDevelopment = options.isDevelopment;
    }
    if (options.maxLogs) {
      this.maxLogs = options.maxLogs;
    }
    if (options.remoteLogService) {
      this.remoteLogService = options.remoteLogService;
    }
  }

  /**
   * Log a debug message
   */
  debug(module: string, message: string, data?: Record<string, any>) {
    this.log(LogLevel.DEBUG, module, message, data);
  }

  /**
   * Log an info message
   */
  info(module: string, message: string, data?: Record<string, any>) {
    this.log(LogLevel.INFO, module, message, data);
  }

  /**
   * Log a warning
   */
  warn(module: string, message: string, data?: Record<string, any>) {
    this.log(LogLevel.WARN, module, message, data);
  }

  /**
   * Log an error
   */
  error(module: string, message: string, error?: Error, data?: Record<string, any>) {
    this.log(LogLevel.ERROR, module, message, data, error);
  }

  /**
   * Internal log method
   */
  private log(
    level: LogLevel,
    module: string,
    message: string,
    data?: Record<string, any>,
    error?: Error
  ) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      module,
      message,
      data,
      error,
    };

    // Store locally
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Log to console in development
    if (this.isDevelopment) {
      const prefix = `[${entry.timestamp}] ${level} - ${module}`;
      switch (level) {
        case LogLevel.DEBUG:
          console.log(prefix, message, data);
          break;
        case LogLevel.INFO:
          console.log(prefix, message, data);
          break;
        case LogLevel.WARN:
          console.warn(prefix, message, data);
          break;
        case LogLevel.ERROR:
          console.error(prefix, message, error, data);
          break;
      }
    }

    // Send to remote service
    if (this.remoteLogService && level === LogLevel.ERROR) {
      this.remoteLogService(entry).catch((err) => {
        if (this.isDevelopment) {
          console.warn('Failed to send log to remote service:', err);
        }
      });
    }
  }

  /**
   * Get all stored logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }

  /**
   * Get logs by module
   */
  getLogsByModule(module: string): LogEntry[] {
    return this.logs.filter((log) => log.module === module);
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Export logs as CSV
   */
  exportLogsAsCSV(): string {
    const headers = ['Timestamp', 'Level', 'Module', 'Message', 'Data'];
    const rows = this.logs.map((log) => [
      log.timestamp,
      log.level,
      log.module,
      log.message,
      log.data ? JSON.stringify(log.data) : '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    return csvContent;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let loggerInstance: Logger | null = null;

/**
 * Get the logger instance
 */
export const getLogger = (): Logger => {
  if (!loggerInstance) {
    loggerInstance = new Logger();
  }
  return loggerInstance;
};

/**
 * Create a logger for a specific module
 *
 * Usage:
 *   const log = createModuleLogger('MyComponent');
 *   log.info('User clicked button');
 *   log.error('API failed', error);
 */
export const createModuleLogger = (module: string) => {
  const logger = getLogger();

  return {
    debug: (message: string, data?: Record<string, any>) =>
      logger.debug(module, message, data),
    info: (message: string, data?: Record<string, any>) =>
      logger.info(module, message, data),
    warn: (message: string, data?: Record<string, any>) =>
      logger.warn(module, message, data),
    error: (message: string, error?: Error, data?: Record<string, any>) =>
      logger.error(module, message, error, data),
  };
};

export default getLogger();
