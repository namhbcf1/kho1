// Comprehensive Error Tracking and Monitoring Middleware
import { logger } from '../../services/monitoring/errorLogger.js';

export const errorHandler = async (c, next) => {
  try {
    await next();
  } catch (error) {
    // Extract request context
    const requestId = c.get('requestId') || generateRequestId();
    const userId = c.get('user')?.id;
    const method = c.req.method;
    const url = c.req.url;
    const userAgent = c.req.header('User-Agent');
    const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
    
    // Determine error type and severity
    let statusCode = 500;
    let errorType = 'internal_error';
    let severity = 'error';
    
    if (error.status) {
      statusCode = error.status;
    }
    
    if (statusCode >= 400 && statusCode < 500) {
      errorType = 'client_error';
      severity = statusCode === 401 || statusCode === 403 ? 'warning' : 'info';
    } else if (statusCode >= 500) {
      errorType = 'server_error';
      severity = 'error';
    }
    
    // Enhanced error context
    const errorContext = {
      requestId,
      userId,
      method,
      url,
      userAgent,
      ip,
      statusCode,
      errorType,
      severity,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      environment: c.env.ENVIRONMENT || 'development'
    };
    
    // Log to structured logger
    logger.error('Request error occurred', errorContext);
    
    // Store in database for analysis (async, don't block response)
    if (c.env.DB && severity === 'error') {
      c.executionCtx.waitUntil(
        storeErrorInDatabase(c.env.DB, errorContext)
      );
    }
    
    // Send to external monitoring service (async)
    if (c.env.SENTRY_DSN && severity === 'error') {
      c.executionCtx.waitUntil(
        sendToSentry(c.env.SENTRY_DSN, errorContext)
      );
    }
    
    // Security audit for authentication/authorization errors
    if (statusCode === 401 || statusCode === 403) {
      logger.security('authentication.failed', {
        requestId,
        userId,
        ip,
        url,
        reason: error.message
      });
    }
    
    // Rate limiting monitoring
    if (statusCode === 429) {
      logger.security('rate_limit.exceeded', {
        requestId,
        ip,
        url,
        userAgent
      });
    }
    
    // Prepare client response (sanitized)
    const response = {
      error: true,
      message: getClientErrorMessage(statusCode, error.message),
      requestId,
      timestamp: new Date().toISOString()
    };
    
    // Add debug info in development
    if (c.env.ENVIRONMENT === 'development') {
      response.debug = {
        originalMessage: error.message,
        stack: error.stack
      };
    }
    
    return c.json(response, statusCode);
  }
};

// Generate unique request ID
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Store error in database for analysis
async function storeErrorInDatabase(db, errorContext) {
  try {
    await db.prepare(`
      INSERT INTO error_logs (
        id, request_id, user_id, method, url, status_code,
        error_type, severity, message, stack, ip, user_agent,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      errorContext.requestId,
      errorContext.userId,
      errorContext.method,
      errorContext.url,
      errorContext.statusCode,
      errorContext.errorType,
      errorContext.severity,
      errorContext.message,
      errorContext.stack,
      errorContext.ip,
      errorContext.userAgent,
      errorContext.timestamp
    ).run();
  } catch (dbError) {
    console.error('Failed to store error in database:', dbError);
  }
}

// Send error to Sentry for monitoring
async function sendToSentry(sentryDsn, errorContext) {
  try {
    const sentryPayload = {
      message: errorContext.message,
      level: errorContext.severity,
      tags: {
        environment: errorContext.environment,
        error_type: errorContext.errorType,
        method: errorContext.method
      },
      extra: {
        requestId: errorContext.requestId,
        userId: errorContext.userId,
        url: errorContext.url,
        ip: errorContext.ip,
        userAgent: errorContext.userAgent
      },
      exception: {
        values: [{
          type: errorContext.errorType,
          value: errorContext.message,
          stacktrace: {
            frames: parseStackTrace(errorContext.stack)
          }
        }]
      },
      timestamp: errorContext.timestamp
    };
    
    await fetch(sentryDsn, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(sentryPayload)
    });
  } catch (sentryError) {
    console.error('Failed to send error to Sentry:', sentryError);
  }
}

// Parse stack trace for Sentry format
function parseStackTrace(stack) {
  if (!stack) return [];
  
  return stack.split('\n')
    .filter(line => line.trim())
    .map(line => {
      const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
      if (match) {
        return {
          function: match[1],
          filename: match[2],
          lineno: parseInt(match[3]),
          colno: parseInt(match[4])
        };
      }
      return { function: line.trim() };
    });
}

// Get client-safe error message
function getClientErrorMessage(statusCode, originalMessage) {
  const messages = {
    400: 'Yêu cầu không hợp lệ',
    401: 'Bạn cần đăng nhập để thực hiện thao tác này',
    403: 'Bạn không có quyền thực hiện thao tác này',
    404: 'Không tìm thấy tài nguyên yêu cầu',
    409: 'Xung đột dữ liệu',
    422: 'Dữ liệu không hợp lệ',
    429: 'Quá nhiều yêu cầu, vui lòng thử lại sau',
    500: 'Lỗi hệ thống, vui lòng thử lại sau',
    502: 'Lỗi kết nối dịch vụ',
    503: 'Dịch vụ tạm thời không khả dụng'
  };
  
  return messages[statusCode] || 'Đã xảy ra lỗi không mong muốn';
}

// Request ID middleware
export const requestIdMiddleware = async (c, next) => {
  const requestId = c.req.header('X-Request-ID') || generateRequestId();
  c.set('requestId', requestId);
  c.header('X-Request-ID', requestId);
  await next();
};

// Performance monitoring middleware
export const performanceMiddleware = async (c, next) => {
  const startTime = Date.now();
  const requestId = c.get('requestId');
  
  await next();
  
  const duration = Date.now() - startTime;
  const method = c.req.method;
  const url = c.req.url;
  const status = c.res.status;
  
  // Log slow requests
  if (duration > 5000) { // 5 seconds
    logger.warn('slow_request', {
      requestId,
      method,
      url,
      status,
      duration,
      threshold: 5000
    });
  }
  
  // Add performance headers
  c.header('X-Response-Time', `${duration}ms`);
  
  // Store performance metrics (async)
  if (c.env.DB) {
    c.executionCtx.waitUntil(
      storePerformanceMetric(c.env.DB, {
        requestId,
        method,
        url,
        status,
        duration,
        timestamp: new Date().toISOString()
      })
    );
  }
};

// Store performance metrics
async function storePerformanceMetric(db, metric) {
  try {
    await db.prepare(`
      INSERT INTO performance_metrics (
        id, request_id, method, url, status, duration, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      metric.requestId,
      metric.method,
      metric.url,
      metric.status,
      metric.duration,
      metric.timestamp
    ).run();
  } catch (error) {
    console.error('Failed to store performance metric:', error);
  }
}