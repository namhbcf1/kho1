/**
 * Production-ready logging service
 * Provides structured logging with different severity levels
 * and specialized security audit logging
 */

// Log levels
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  SECURITY = 'security',
  CRITICAL = 'critical',
}

// Log entry interface
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: any;
  userId?: string | number;
  sessionId?: string;
  requestId?: string;
  source?: string;
  tags?: string[];
}

// Log destination interface
interface LogDestination {
  log(entry: LogEntry): void;
}

// Console log destination
class ConsoleDestination implements LogDestination {
  log(entry: LogEntry): void {
    const { level, message, timestamp, ...rest } = entry;
    const data = Object.keys(rest).length ? rest : undefined;
    
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(`[${timestamp}] [DEBUG] ${message}`, data);
        break;
      case LogLevel.INFO:
        console.info(`[${timestamp}] [INFO] ${message}`, data);
        break;
      case LogLevel.WARN:
        console.warn(`[${timestamp}] [WARN] ${message}`, data);
        break;
      case LogLevel.ERROR:
        console.error(`[${timestamp}] [ERROR] ${message}`, data);
        break;
      case LogLevel.CRITICAL:
        console.error(`[${timestamp}] [CRITICAL] ${message}`, data);
        break;
      case LogLevel.SECURITY:
        console.warn(`[${timestamp}] [SECURITY] ${message}`, data);
        break;
      default:
        console.log(`[${timestamp}] [LOG] ${message}`, data);
    }
  }
}

// API log destination - sends logs to server
class ApiDestination implements LogDestination {
  private readonly apiEndpoint: string;
  private readonly batchSize: number;
  private readonly batchInterval: number;
  private queue: LogEntry[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(apiEndpoint: string, batchSize = 10, batchInterval = 5000) {
    this.apiEndpoint = apiEndpoint;
    this.batchSize = batchSize;
    this.batchInterval = batchInterval;
  }

  log(entry: LogEntry): void {
    // Only send ERROR, CRITICAL and SECURITY logs to server
    if (
      entry.level === LogLevel.ERROR || 
      entry.level === LogLevel.CRITICAL || 
      entry.level === LogLevel.SECURITY
    ) {
      this.queue.push(entry);
      
      if (this.queue.length >= this.batchSize) {
        this.flush();
      } else if (!this.timer) {
        this.timer = setTimeout(() => this.flush(), this.batchInterval);
      }
    }
  }

  private async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.queue.length === 0) return;

    const logs = [...this.queue];
    this.queue = [];

    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Version': process.env.VITE_APP_VERSION || '1.0.0',
        },
        body: JSON.stringify({ logs }),
        credentials: 'include', // Include cookies for auth
      });

      if (!response.ok) {
        console.error('Failed to send logs to server:', response.statusText);
      }
    } catch (error) {
      console.error('Error sending logs to server:', error);
      
      // Re-queue critical logs for retry
      const criticalLogs = logs.filter(
        log => log.level === LogLevel.CRITICAL || log.level === LogLevel.SECURITY
      );
      
      if (criticalLogs.length > 0) {
        this.queue = [...criticalLogs, ...this.queue];
      }
    }
  }
}

// Logger class
class Logger {
  private static instance: Logger;
  private destinations: LogDestination[] = [];
  private readonly sessionId: string;
  private userId: string | null = null;

  private constructor() {
    // Add console destination by default
    this.destinations.push(new ConsoleDestination());
    
    // Generate session ID
    this.sessionId = this.generateSessionId();
    
    // Add API destination if in production
    const isProd = process.env.NODE_ENV === 'production';
    if (isProd) {
      const apiUrl = process.env.VITE_API_URL || '/api';
      this.destinations.push(
        new ApiDestination(`${apiUrl}/logs`)
      );
    }
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  // Set user ID for all subsequent logs
  public setUserId(userId: string | null): void {
    this.userId = userId;
  }

  // Generate a unique session ID
  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  // Create log entry with common fields
  private createLogEntry(
    level: LogLevel,
    message: string,
    data?: any
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId || undefined,
      data,
      source: 'frontend',
    };
  }

  // Log methods for different levels
  public debug(message: string, data?: any): void {
    const entry = this.createLogEntry(LogLevel.DEBUG, message, data);
    this.destinations.forEach(dest => dest.log(entry));
  }

  public info(message: string, data?: any): void {
    const entry = this.createLogEntry(LogLevel.INFO, message, data);
    this.destinations.forEach(dest => dest.log(entry));
  }

  public warn(message: string, data?: any): void {
    const entry = this.createLogEntry(LogLevel.WARN, message, data);
    this.destinations.forEach(dest => dest.log(entry));
  }

  public error(message: string, data?: any): void {
    const entry = this.createLogEntry(LogLevel.ERROR, message, data);
    this.destinations.forEach(dest => dest.log(entry));
  }

  public critical(message: string, data?: any): void {
    const entry = this.createLogEntry(LogLevel.CRITICAL, message, data);
    this.destinations.forEach(dest => dest.log(entry));
  }

  // Special method for security audit logs
  public security(message: string, data?: any): void {
    const entry = this.createLogEntry(LogLevel.SECURITY, message, {
      ...data,
      tags: ['security-audit'],
    });
    this.destinations.forEach(dest => dest.log(entry));
  }

  // Create a scoped logger
  public createScopedLogger(scope: string) {
    return {
      debug: (message: string, data?: any) => 
        this.debug(`[${scope}] ${message}`, data),
      info: (message: string, data?: any) => 
        this.info(`[${scope}] ${message}`, data),
      warn: (message: string, data?: any) => 
        this.warn(`[${scope}] ${message}`, data),
      error: (message: string, data?: any) => 
        this.error(`[${scope}] ${message}`, data),
      critical: (message: string, data?: any) => 
        this.critical(`[${scope}] ${message}`, data),
      security: (message: string, data?: any) => 
        this.security(`[${scope}] ${message}`, data),
    };
  }
}

// Export singleton instance
export const logger = Logger.getInstance(); 