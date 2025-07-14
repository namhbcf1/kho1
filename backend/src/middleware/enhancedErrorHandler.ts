import { Context } from 'hono';
import { z } from 'zod';
import type { Env } from '../index';

// Error types for better categorization
export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  BUSINESS_LOGIC_ERROR = 'BUSINESS_LOGIC_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SECURITY_ERROR = 'SECURITY_ERROR'
}

// Custom error class with Vietnamese messages
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: any;
  public readonly correlationId?: string;

  constructor(
    message: string,
    type: ErrorType = ErrorType.INTERNAL_ERROR,
    statusCode: number = 500,
    isOperational: boolean = true,
    details?: any,
    correlationId?: string
  ) {
    super(message);
    
    this.type = type;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    this.correlationId = correlationId;
    
    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

// Pre-defined error classes for common scenarios
export class ValidationError extends AppError {
  constructor(message: string, details?: any, correlationId?: string) {
    super(message, ErrorType.VALIDATION_ERROR, 400, true, details, correlationId);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Xác thực thất bại', details?: any, correlationId?: string) {
    super(message, ErrorType.AUTHENTICATION_ERROR, 401, true, details, correlationId);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Không có quyền truy cập', details?: any, correlationId?: string) {
    super(message, ErrorType.AUTHORIZATION_ERROR, 403, true, details, correlationId);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Không tìm thấy tài nguyên', details?: any, correlationId?: string) {
    super(message, ErrorType.NOT_FOUND_ERROR, 404, true, details, correlationId);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Quá nhiều yêu cầu', details?: any, correlationId?: string) {
    super(message, ErrorType.RATE_LIMIT_ERROR, 429, true, details, correlationId);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Lỗi cơ sở dữ liệu', details?: any, correlationId?: string) {
    super(message, ErrorType.DATABASE_ERROR, 500, true, details, correlationId);
  }
}

export class SecurityError extends AppError {
  constructor(message: string = 'Vi phạm bảo mật', details?: any, correlationId?: string) {
    super(message, ErrorType.SECURITY_ERROR, 403, true, details, correlationId);
  }
}

// Error response interface
interface ErrorResponse {
  success: false;
  error: {
    type: ErrorType;
    message: string;
    correlationId?: string;
    details?: any;
    timestamp: string;
    path: string;
    method: string;
  };
}

// Safe error response creation (no sensitive info exposure)
export function createErrorResponse(
  error: Error | AppError | string,
  c: Context<{ Bindings: Env }>,
  correlationId?: string
): ErrorResponse {
  const timestamp = new Date().toISOString();
  const path = c.req.path;
  const method = c.req.method;
  const isDevelopment = c.env?.ENVIRONMENT === 'development';

  // Generate correlation ID if not provided
  const finalCorrelationId = correlationId || crypto.randomUUID();

  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        type: error.type,
        message: error.message,
        correlationId: finalCorrelationId,
        details: isDevelopment ? error.details : undefined,
        timestamp,
        path,
        method
      }
    };
  }

  if (error instanceof z.ZodError) {
    return {
      success: false,
      error: {
        type: ErrorType.VALIDATION_ERROR,
        message: 'Dữ liệu đầu vào không hợp lệ',
        correlationId: finalCorrelationId,
        details: isDevelopment ? error.errors : undefined,
        timestamp,
        path,
        method
      }
    };
  }

  if (error instanceof Error) {
    return {
      success: false,
      error: {
        type: ErrorType.INTERNAL_ERROR,
        message: isDevelopment ? error.message : 'Đã xảy ra lỗi hệ thống',
        correlationId: finalCorrelationId,
        details: isDevelopment ? { stack: error.stack } : undefined,
        timestamp,
        path,
        method
      }
    };
  }

  return {
    success: false,
    error: {
      type: ErrorType.INTERNAL_ERROR,
      message: typeof error === 'string' ? error : 'Đã xảy ra lỗi không xác định',
      correlationId: finalCorrelationId,
      timestamp,
      path,
      method
    }
  };
}

// Enhanced error handler middleware
export function errorHandler() {
  return async (err: Error, c: Context<{ Bindings: Env }>) => {
    const correlationId = c.get('correlationId') || crypto.randomUUID();
    
    // Log error with correlation ID for tracking
    console.error('Error occurred:', {
      correlationId,
      error: err.message,
      stack: err.stack,
      path: c.req.path,
      method: c.req.method,
      userAgent: c.req.header('user-agent'),
      ip: c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for'),
      timestamp: new Date().toISOString()
    });

    // Create safe error response
    const errorResponse = createErrorResponse(err, c, correlationId);
    
    // Determine appropriate status code
    let statusCode = 500;
    
    if (err instanceof AppError) {
      statusCode = err.statusCode;
    } else if (err instanceof z.ZodError) {
      statusCode = 400;
    } else if (err.message.includes('Not Found')) {
      statusCode = 404;
    } else if (err.message.includes('Unauthorized')) {
      statusCode = 401;
    } else if (err.message.includes('Forbidden')) {
      statusCode = 403;
    }

    // Add security headers for error responses
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('X-Frame-Options', 'DENY');
    
    return c.json(errorResponse, statusCode);
  };
}

// Async error wrapper for route handlers
export function asyncHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return (...args: T): Promise<R> => {
    return Promise.resolve(fn(...args)).catch((error) => {
      // Re-throw as AppError if not already
      if (!(error instanceof AppError)) {
        throw new AppError(
          error.message || 'Unexpected error occurred',
          ErrorType.INTERNAL_ERROR,
          500,
          false
        );
      }
      throw error;
    });
  };
}

// Vietnamese error messages mapping
export const ERROR_MESSAGES_VI = {
  [ErrorType.VALIDATION_ERROR]: 'Dữ liệu đầu vào không hợp lệ',
  [ErrorType.AUTHENTICATION_ERROR]: 'Xác thực thất bại',
  [ErrorType.AUTHORIZATION_ERROR]: 'Không có quyền truy cập',
  [ErrorType.NOT_FOUND_ERROR]: 'Không tìm thấy tài nguyên',
  [ErrorType.RATE_LIMIT_ERROR]: 'Quá nhiều yêu cầu, vui lòng thử lại sau',
  [ErrorType.DATABASE_ERROR]: 'Lỗi cơ sở dữ liệu',
  [ErrorType.EXTERNAL_SERVICE_ERROR]: 'Lỗi dịch vụ bên ngoài',
  [ErrorType.BUSINESS_LOGIC_ERROR]: 'Lỗi logic nghiệp vụ',
  [ErrorType.INTERNAL_ERROR]: 'Lỗi hệ thống nội bộ',
  [ErrorType.SECURITY_ERROR]: 'Vi phạm bảo mật'
};

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Get error severity based on type
export function getErrorSeverity(errorType: ErrorType): ErrorSeverity {
  switch (errorType) {
    case ErrorType.SECURITY_ERROR:
    case ErrorType.AUTHENTICATION_ERROR:
      return ErrorSeverity.CRITICAL;
    
    case ErrorType.DATABASE_ERROR:
    case ErrorType.INTERNAL_ERROR:
      return ErrorSeverity.HIGH;
    
    case ErrorType.AUTHORIZATION_ERROR:
    case ErrorType.EXTERNAL_SERVICE_ERROR:
    case ErrorType.BUSINESS_LOGIC_ERROR:
      return ErrorSeverity.MEDIUM;
    
    case ErrorType.VALIDATION_ERROR:
    case ErrorType.NOT_FOUND_ERROR:
    case ErrorType.RATE_LIMIT_ERROR:
      return ErrorSeverity.LOW;
    
    default:
      return ErrorSeverity.MEDIUM;
  }
}

// Correlation ID middleware
export function correlationIdMiddleware() {
  return async (c: Context, next: any) => {
    const correlationId = c.req.header('x-correlation-id') || crypto.randomUUID();
    c.set('correlationId', correlationId);
    c.header('x-correlation-id', correlationId);
    await next();
  };
}

// Request logging middleware with security considerations
export function secureRequestLogger() {
  return async (c: Context<{ Bindings: Env }>, next: any) => {
    const start = Date.now();
    const correlationId = c.get('correlationId');
    
    // Log request (sanitized)
    const requestLog = {
      correlationId,
      method: c.req.method,
      path: c.req.path,
      userAgent: c.req.header('user-agent')?.substring(0, 200), // Limit length
      ip: c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for'),
      timestamp: new Date().toISOString()
    };

    console.log('Request:', JSON.stringify(requestLog));

    await next();

    // Log response
    const duration = Date.now() - start;
    const responseLog = {
      correlationId,
      status: c.res.status,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    };

    console.log('Response:', JSON.stringify(responseLog));
  };
}

// Database error handler
export function handleDatabaseError(error: any, operation: string): AppError {
  const correlationId = crypto.randomUUID();
  
  console.error('Database Error:', {
    correlationId,
    operation,
    error: error.message,
    timestamp: new Date().toISOString()
  });

  // Check for specific database errors
  if (error.message?.includes('UNIQUE constraint failed')) {
    return new ValidationError('Dữ liệu đã tồn tại', { operation }, correlationId);
  }

  if (error.message?.includes('FOREIGN KEY constraint failed')) {
    return new ValidationError('Dữ liệu tham chiếu không hợp lệ', { operation }, correlationId);
  }

  if (error.message?.includes('no such table')) {
    return new DatabaseError('Bảng dữ liệu không tồn tại', { operation }, correlationId);
  }

  return new DatabaseError('Lỗi thao tác cơ sở dữ liệu', { operation }, correlationId);
}

export default {
  errorHandler,
  asyncHandler,
  createErrorResponse,
  correlationIdMiddleware,
  secureRequestLogger,
  handleDatabaseError,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  DatabaseError,
  SecurityError
};