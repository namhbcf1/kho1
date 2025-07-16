// Production logging handler for Cloudflare Workers
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

// Log entry schema
const logEntrySchema = z.object({
  level: z.enum(['error', 'warn', 'info', 'debug']),
  message: z.string(),
  timestamp: z.string(),
  context: z.record(z.any()).optional(),
  error: z.object({
    name: z.string(),
    message: z.string(),
    stack: z.string().optional(),
  }).optional(),
  requestId: z.string().optional(),
  userAgent: z.string().optional(),
  url: z.string().optional(),
});

// Frontend error schema
const frontendErrorSchema = z.object({
  type: z.string(),
  message: z.string(),
  timestamp: z.string(),
  details: z.record(z.any()).optional(),
  originalError: z.object({
    name: z.string(),
    message: z.string(),
    stack: z.string().optional(),
  }),
  userAgent: z.string(),
  url: z.string(),
});

// Performance metric schema
const performanceMetricSchema = z.object({
  type: z.string(),
  url: z.string(),
  duration: z.number(),
  timestamp: z.string(),
});

export const logsHandler = new Hono()
  // Frontend error logging
  .post('/frontend-error', zValidator('json', frontendErrorSchema), async (c) => {
    try {
      const errorData = c.req.valid('json');
      const { KV } = c.env;

      // Store error in KV for monitoring
      const errorKey = `frontend_error:${Date.now()}:${crypto.randomUUID()}`;
      await KV.put(errorKey, JSON.stringify({
        ...errorData,
        ip: c.req.header('CF-Connecting-IP'),
        country: c.req.header('CF-IPCountry'),
        timestamp: new Date().toISOString(),
      }), { expirationTtl: 86400 * 7 }); // Keep for 7 days

      // Log to console for Cloudflare Workers logs
      console.error('Frontend Error:', JSON.stringify({
        level: 'error',
        source: 'frontend',
        type: errorData.type,
        message: errorData.message,
        url: errorData.url,
        userAgent: errorData.userAgent,
        timestamp: new Date().toISOString(),
      }));

      return c.json({ success: true });
    } catch (error) {
      console.error('Failed to log frontend error:', error);
      return c.json({ success: false }, 500);
    }
  })

  // Performance metrics logging
  .post('/performance', zValidator('json', performanceMetricSchema), async (c) => {
    try {
      const metricData = c.req.valid('json');
      const { KV } = c.env;

      // Store performance metric
      const metricKey = `performance:${Date.now()}:${crypto.randomUUID()}`;
      await KV.put(metricKey, JSON.stringify({
        ...metricData,
        ip: c.req.header('CF-Connecting-IP'),
        timestamp: new Date().toISOString(),
      }), { expirationTtl: 86400 * 3 }); // Keep for 3 days

      // Log slow requests
      if (metricData.duration > 5000) {
        console.warn('Slow Request:', JSON.stringify({
          level: 'warn',
          type: 'slow_request',
          url: metricData.url,
          duration: metricData.duration,
          timestamp: new Date().toISOString(),
        }));
      }

      return c.json({ success: true });
    } catch (error) {
      console.error('Failed to log performance metric:', error);
      return c.json({ success: false }, 500);
    }
  })

  // Security event logging
  .post('/security', zValidator('json', z.object({
    type: z.string(),
    message: z.string(),
    timestamp: z.string(),
    userAgent: z.string(),
  })), async (c) => {
    try {
      const securityData = c.req.valid('json');
      const { KV } = c.env;

      // Store security event
      const securityKey = `security:${Date.now()}:${crypto.randomUUID()}`;
      await KV.put(securityKey, JSON.stringify({
        ...securityData,
        ip: c.req.header('CF-Connecting-IP'),
        country: c.req.header('CF-IPCountry'),
        timestamp: new Date().toISOString(),
      }), { expirationTtl: 86400 * 30 }); // Keep for 30 days

      // Log security events
      console.warn('Security Event:', JSON.stringify({
        level: 'warn',
        source: 'security',
        type: securityData.type,
        message: securityData.message,
        ip: c.req.header('CF-Connecting-IP'),
        userAgent: securityData.userAgent,
        timestamp: new Date().toISOString(),
      }));

      return c.json({ success: true });
    } catch (error) {
      console.error('Failed to log security event:', error);
      return c.json({ success: false }, 500);
    }
  })

  // Rate limit logging
  .post('/rate-limit', zValidator('json', z.object({
    message: z.string(),
    timestamp: z.string(),
    ip: z.string(),
  })), async (c) => {
    try {
      const rateLimitData = c.req.valid('json');

      // Log rate limit events
      console.warn('Rate Limit:', JSON.stringify({
        level: 'warn',
        type: 'rate_limit',
        message: rateLimitData.message,
        ip: c.req.header('CF-Connecting-IP'),
        timestamp: new Date().toISOString(),
      }));

      return c.json({ success: true });
    } catch (error) {
      console.error('Failed to log rate limit event:', error);
      return c.json({ success: false }, 500);
    }
  })

  // Server error logging
  .post('/server-error', zValidator('json', z.object({
    message: z.string(),
    error: z.string(),
    stack: z.string().optional(),
    timestamp: z.string(),
  })), async (c) => {
    try {
      const serverErrorData = c.req.valid('json');

      // Log server errors
      console.error('Server Error:', JSON.stringify({
        level: 'error',
        type: 'server_error',
        message: serverErrorData.message,
        error: serverErrorData.error,
        stack: serverErrorData.stack,
        timestamp: new Date().toISOString(),
      }));

      return c.json({ success: true });
    } catch (error) {
      console.error('Failed to log server error:', error);
      return c.json({ success: false }, 500);
    }
  })

  // API error logging
  .post('/api-error', zValidator('json', z.object({
    message: z.string(),
    error: z.string(),
    timestamp: z.string(),
  })), async (c) => {
    try {
      const apiErrorData = c.req.valid('json');

      // Log API errors
      console.error('API Error:', JSON.stringify({
        level: 'error',
        type: 'api_error',
        message: apiErrorData.message,
        error: apiErrorData.error,
        timestamp: new Date().toISOString(),
      }));

      return c.json({ success: true });
    } catch (error) {
      console.error('Failed to log API error:', error);
      return c.json({ success: false }, 500);
    }
  })

  // Network error logging
  .post('/network-error', zValidator('json', z.object({
    message: z.string(),
    error: z.string(),
    timestamp: z.string(),
  })), async (c) => {
    try {
      const networkErrorData = c.req.valid('json');

      // Log network errors
      console.error('Network Error:', JSON.stringify({
        level: 'error',
        type: 'network_error',
        message: networkErrorData.message,
        error: networkErrorData.error,
        timestamp: new Date().toISOString(),
      }));

      return c.json({ success: true });
    } catch (error) {
      console.error('Failed to log network error:', error);
      return c.json({ success: false }, 500);
    }
  })

  // Request error logging
  .post('/request-error', zValidator('json', z.object({
    message: z.string(),
    error: z.string(),
    timestamp: z.string(),
  })), async (c) => {
    try {
      const requestErrorData = c.req.valid('json');

      // Log request errors
      console.error('Request Error:', JSON.stringify({
        level: 'error',
        type: 'request_error',
        message: requestErrorData.message,
        error: requestErrorData.error,
        timestamp: new Date().toISOString(),
      }));

      return c.json({ success: true });
    } catch (error) {
      console.error('Failed to log request error:', error);
      return c.json({ success: false }, 500);
    }
  });
