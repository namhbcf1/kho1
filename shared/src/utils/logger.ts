// Production logging utility
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  error?: Error;
  requestId?: string;
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;

  private constructor() {
    this.logLevel = this.getLogLevel();
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private getLogLevel(): LogLevel {
    const level = typeof window !== 'undefined' 
      ? import.meta.env.VITE_LOG_LEVEL 
      : process.env.LOG_LEVEL;
    
    switch (level?.toLowerCase()) {
      case 'error': return LogLevel.ERROR;
      case 'warn': return LogLevel.WARN;
      case 'info': return LogLevel.INFO;
      case 'debug': return LogLevel.DEBUG;
      default: return LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private formatLogEntry(entry: LogEntry): string {
    const { level, message, timestamp, context, error, requestId } = entry;
    const levelName = LogLevel[level];
    
    let logMessage = `[${timestamp}] ${levelName}: ${message}`;
    
    if (requestId) {
      logMessage += ` [RequestID: ${requestId}]`;
    }
    
    if (context && Object.keys(context).length > 0) {
      logMessage += ` Context: ${JSON.stringify(context)}`;
    }
    
    if (error) {
      logMessage += ` Error: ${error.message}`;
      if (error.stack) {
        logMessage += ` Stack: ${error.stack}`;
      }
    }
    
    return logMessage;
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error, requestId?: string): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
      requestId,
    };

    const formattedMessage = this.formatLogEntry(entry);

    // In production, send to external logging service
    if (typeof window === 'undefined') {
      // Backend logging
      switch (level) {
        case LogLevel.ERROR:
          console.error(formattedMessage);
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage);
          break;
        default:
          console.info(formattedMessage);
      }
    } else {
      // Frontend logging - send to backend
      this.sendToBackend(entry);
    }
  }

  private async sendToBackend(entry: LogEntry): Promise<void> {
    try {
      // Only send ERROR and WARN logs to backend to reduce noise
      if (entry.level <= LogLevel.WARN) {
        await fetch('/api/logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(entry),
        });
      }
    } catch (error) {
      // Fallback to console if backend logging fails
      console.error('Failed to send log to backend:', error);
      console.error('Original log:', this.formatLogEntry(entry));
    }
  }

  public error(message: string, context?: Record<string, any>, error?: Error, requestId?: string): void {
    this.log(LogLevel.ERROR, message, context, error, requestId);
  }

  public warn(message: string, context?: Record<string, any>, requestId?: string): void {
    this.log(LogLevel.WARN, message, context, undefined, requestId);
  }

  public info(message: string, context?: Record<string, any>, requestId?: string): void {
    this.log(LogLevel.INFO, message, context, undefined, requestId);
  }

  public debug(message: string, context?: Record<string, any>, requestId?: string): void {
    this.log(LogLevel.DEBUG, message, context, undefined, requestId);
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Convenience functions
export const logError = (message: string, context?: Record<string, any>, error?: Error, requestId?: string) => {
  logger.error(message, context, error, requestId);
};

export const logWarn = (message: string, context?: Record<string, any>, requestId?: string) => {
  logger.warn(message, context, requestId);
};

export const logInfo = (message: string, context?: Record<string, any>, requestId?: string) => {
  logger.info(message, context, requestId);
};

export const logDebug = (message: string, context?: Record<string, any>, requestId?: string) => {
  logger.debug(message, context, requestId);
};
