export class ErrorLogger {
    env;
    requestId;
    context;
    constructor(env, requestId) {
        this.env = env;
        this.requestId = requestId || crypto.randomUUID();
        this.context = {};
    }
    // Set context from Hono context
    setContext(c) {
        this.context = {
            requestId: this.requestId,
            userId: c.get('user')?.id,
            userAgent: c.req.header('user-agent'),
            ip: c.req.header('cf-connecting-ip') ||
                c.req.header('x-forwarded-for') ||
                c.req.header('x-real-ip'),
            method: c.req.method,
            path: c.req.path,
            headers: this.sanitizeHeaders(c.req.header())
        };
    }
    // Sanitize headers to remove sensitive information
    sanitizeHeaders(headers) {
        const sanitized = {};
        const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
        Object.entries(headers).forEach(([key, value]) => {
            if (value && !sensitiveHeaders.includes(key.toLowerCase())) {
                sanitized[key] = value;
            }
            else if (value) {
                sanitized[key] = '[REDACTED]';
            }
        });
        return sanitized;
    }
    // Log general errors
    async logError(message, error, level = 'error', metadata, tags) {
        const logEntry = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            level,
            message,
            error: error ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
                code: error.code
            } : undefined,
            context: this.context,
            metadata,
            tags,
            environment: this.env.ENVIRONMENT || 'development'
        };
        // Log to console (structured logging)
        console.error(JSON.stringify(logEntry, null, 2));
        // Store in KV for analysis
        try {
            await this.env.KV?.put(`error:${logEntry.timestamp}:${logEntry.id}`, JSON.stringify(logEntry), { expirationTtl: 30 * 24 * 60 * 60 } // 30 days
            );
        }
        catch (kvError) {
            console.error('Failed to store error log in KV:', kvError);
        }
        // Store in database for persistent logging
        try {
            await this.env.DB?.prepare(`
        INSERT INTO error_logs (
          id, timestamp, level, message, error_details, context, metadata, tags, environment
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(logEntry.id, logEntry.timestamp, logEntry.level, logEntry.message, JSON.stringify(logEntry.error || {}), JSON.stringify(logEntry.context), JSON.stringify(logEntry.metadata || {}), JSON.stringify(logEntry.tags || []), logEntry.environment).run();
        }
        catch (dbError) {
            console.error('Failed to store error log in database:', dbError);
        }
        // Alert for critical errors
        if (level === 'critical') {
            await this.sendCriticalAlert(logEntry);
        }
    }
    // Log security events
    async logSecurityEvent(type, message, severity, metadata) {
        const logEntry = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            type,
            severity,
            message,
            context: {
                requestId: this.requestId,
                userId: this.context.userId,
                userAgent: this.context.userAgent,
                ip: this.context.ip,
                method: this.context.method,
                path: this.context.path,
                ...metadata
            },
            metadata,
            environment: this.env.ENVIRONMENT || 'development'
        };
        // Log to console
        console.warn(JSON.stringify(logEntry, null, 2));
        // Store in KV for immediate analysis
        try {
            await this.env.KV?.put(`security:${logEntry.timestamp}:${logEntry.id}`, JSON.stringify(logEntry), { expirationTtl: 90 * 24 * 60 * 60 } // 90 days for security logs
            );
        }
        catch (kvError) {
            console.error('Failed to store security log in KV:', kvError);
        }
        // Store in database
        try {
            await this.env.DB?.prepare(`
        INSERT INTO security_logs (
          id, timestamp, type, severity, message, context, metadata, environment
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(logEntry.id, logEntry.timestamp, logEntry.type, logEntry.severity, logEntry.message, JSON.stringify(logEntry.context), JSON.stringify(logEntry.metadata || {}), logEntry.environment).run();
        }
        catch (dbError) {
            console.error('Failed to store security log in database:', dbError);
        }
        // Alert for high/critical security events
        if (severity === 'high' || severity === 'critical') {
            await this.sendSecurityAlert(logEntry);
        }
    }
    // Log performance metrics
    async logPerformance(type, operation, duration, success, metadata) {
        const logEntry = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            type,
            operation,
            duration,
            success,
            context: {
                requestId: this.requestId,
                userId: this.context.userId,
                method: this.context.method,
                path: this.context.path
            },
            metadata,
            environment: this.env.ENVIRONMENT || 'development'
        };
        // Log to console (only slow operations or failures)
        if (duration > 1000 || !success) {
            console.info(JSON.stringify(logEntry, null, 2));
        }
        // Store in KV for analysis
        try {
            await this.env.KV?.put(`performance:${logEntry.timestamp}:${logEntry.id}`, JSON.stringify(logEntry), { expirationTtl: 7 * 24 * 60 * 60 } // 7 days for performance logs
            );
        }
        catch (kvError) {
            console.error('Failed to store performance log in KV:', kvError);
        }
        // Store in database for trending analysis
        try {
            await this.env.DB?.prepare(`
        INSERT INTO performance_logs (
          id, timestamp, type, operation, duration, success, context, metadata, environment
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(logEntry.id, logEntry.timestamp, logEntry.type, logEntry.operation, logEntry.duration, success ? 1 : 0, JSON.stringify(logEntry.context), JSON.stringify(logEntry.metadata || {}), logEntry.environment).run();
        }
        catch (dbError) {
            console.error('Failed to store performance log in database:', dbError);
        }
    }
    // Log business events
    async logBusinessEvent(type, action, success, context, metadata) {
        const logEntry = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            type,
            action,
            success,
            context: {
                requestId: this.requestId,
                userId: this.context.userId,
                ...context
            },
            metadata,
            environment: this.env.ENVIRONMENT || 'development'
        };
        // Log to console
        console.info(JSON.stringify(logEntry, null, 2));
        // Store in KV for business analysis
        try {
            await this.env.KV?.put(`business:${logEntry.timestamp}:${logEntry.id}`, JSON.stringify(logEntry), { expirationTtl: 365 * 24 * 60 * 60 } // 1 year for business logs
            );
        }
        catch (kvError) {
            console.error('Failed to store business log in KV:', kvError);
        }
        // Store in database for business intelligence
        try {
            await this.env.DB?.prepare(`
        INSERT INTO business_logs (
          id, timestamp, type, action, success, context, metadata, environment
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(logEntry.id, logEntry.timestamp, logEntry.type, logEntry.action, success ? 1 : 0, JSON.stringify(logEntry.context), JSON.stringify(logEntry.metadata || {}), logEntry.environment).run();
        }
        catch (dbError) {
            console.error('Failed to store business log in database:', dbError);
        }
    }
    // Send critical alerts (implement with your preferred alerting system)
    async sendCriticalAlert(logEntry) {
        // In production, integrate with services like:
        // - Slack webhook
        // - Discord webhook
        // - Email service
        // - SMS service
        // - PagerDuty
        console.error('🚨 CRITICAL ERROR ALERT:', {
            message: logEntry.message,
            timestamp: logEntry.timestamp,
            requestId: logEntry.context.requestId,
            path: logEntry.context.path,
            error: logEntry.error
        });
    }
    // Send security alerts
    async sendSecurityAlert(logEntry) {
        console.warn('🔒 SECURITY ALERT:', {
            type: logEntry.type,
            severity: logEntry.severity,
            message: logEntry.message,
            timestamp: logEntry.timestamp,
            ip: logEntry.context.ip,
            path: logEntry.context.path
        });
    }
    // Helper method to measure execution time
    static async measureExecutionTime(operation, logger, type, operationName, metadata) {
        const startTime = Date.now();
        let success = false;
        let result;
        try {
            result = await operation();
            success = true;
            return result;
        }
        catch (error) {
            success = false;
            throw error;
        }
        finally {
            const duration = Date.now() - startTime;
            await logger.logPerformance(type, operationName, duration, success, metadata);
        }
    }
    // Helper method to log with context
    static async withContext(c, operation) {
        const logger = new ErrorLogger(c.env, c.get('requestId') || crypto.randomUUID());
        logger.setContext(c);
        try {
            return await operation(logger);
        }
        catch (error) {
            await logger.logError('Operation failed', error instanceof Error ? error : new Error(String(error)), 'error', { operation: 'withContext' });
            throw error;
        }
    }
}
// Convenience functions for common logging scenarios
export const logError = (env, message, error, metadata) => {
    const logger = new ErrorLogger(env);
    return logger.logError(message, error, 'error', metadata);
};
export const logSecurityEvent = (env, type, message, severity, metadata) => {
    const logger = new ErrorLogger(env);
    return logger.logSecurityEvent(type, message, severity, metadata);
};
export const logBusinessEvent = (env, type, action, success, context, metadata) => {
    const logger = new ErrorLogger(env);
    return logger.logBusinessEvent(type, action, success, context, metadata);
};
// Export the main class
export default ErrorLogger;
