import { Context, Next } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import { createMiddleware } from 'hono/factory';
import type { Env } from '../index';

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// CSRF token store
const csrfTokenStore = new Map<string, { token: string; timestamp: number }>();

// Security headers middleware
export const securityHeaders = () => {
  return createMiddleware<{ Bindings: Env }>(async (c, next) => {
    // Content Security Policy
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://api.cloudflare.com wss:",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'"
    ].join('; ');

    // Set security headers
    c.header('Content-Security-Policy', csp);
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('X-Frame-Options', 'DENY');
    c.header('X-XSS-Protection', '1; mode=block');
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    c.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // HSTS for production
    if (c.env.ENVIRONMENT === 'production') {
      c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }

    // Remove server identification
    c.header('Server', '');
    
    await next();
  });
};

// Rate limiting middleware
export const rateLimiter = (options: {
  windowMs?: number;
  maxRequests?: number;
  keyGenerator?: (c: Context) => string;
}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    maxRequests = 100,
    keyGenerator = (c) => c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown'
  } = options;

  return createMiddleware<{ Bindings: Env }>(async (c, next) => {
    const key = keyGenerator(c);
    const now = Date.now();
    const resetTime = now + windowMs;

    // Clean up expired entries
    for (const [k, v] of rateLimitStore.entries()) {
      if (now > v.resetTime) {
        rateLimitStore.delete(k);
      }
    }

    const current = rateLimitStore.get(key);
    
    if (!current) {
      rateLimitStore.set(key, { count: 1, resetTime });
    } else if (now > current.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime });
    } else {
      current.count++;
      
      if (current.count > maxRequests) {
        const retryAfter = Math.ceil((current.resetTime - now) / 1000);
        
        c.header('Retry-After', retryAfter.toString());
        c.header('X-RateLimit-Limit', maxRequests.toString());
        c.header('X-RateLimit-Remaining', '0');
        c.header('X-RateLimit-Reset', Math.ceil(current.resetTime / 1000).toString());
        
        return c.json({
          success: false,
          message: 'Too many requests. Please try again later.',
          error: 'RATE_LIMIT_EXCEEDED'
        }, 429);
      }
    }

    const remaining = Math.max(0, maxRequests - (current?.count || 1));
    c.header('X-RateLimit-Limit', maxRequests.toString());
    c.header('X-RateLimit-Remaining', remaining.toString());
    c.header('X-RateLimit-Reset', Math.ceil((current?.resetTime || resetTime) / 1000).toString());

    await next();
  });
};

// CSRF protection middleware
export const csrfProtection = () => {
  return createMiddleware<{ Bindings: Env }>(async (c, next) => {
    const method = c.req.method;
    
    // Skip CSRF for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      await next();
      return;
    }

    // Generate CSRF token for state-changing requests
    const sessionId = getCookie(c, 'session-id') || crypto.randomUUID();
    
    if (method === 'POST' && c.req.path.includes('/csrf-token')) {
      // Generate new CSRF token
      const csrfToken = crypto.randomUUID();
      const timestamp = Date.now();
      
      csrfTokenStore.set(sessionId, { token: csrfToken, timestamp });
      
      // Set session cookie if not exists
      setCookie(c, 'session-id', sessionId, {
        httpOnly: true,
        secure: c.env.ENVIRONMENT === 'production',
        sameSite: 'Strict',
        maxAge: 24 * 60 * 60, // 24 hours
        path: '/'
      });
      
      return c.json({
        success: true,
        csrfToken,
        sessionId
      });
    }

    // Validate CSRF token for protected requests
    const csrfToken = c.req.header('X-CSRF-Token') || 
                     c.req.header('X-Requested-With') === 'XMLHttpRequest' ? 
                     c.req.header('X-CSRF-Token') : null;

    if (!csrfToken) {
      return c.json({
        success: false,
        message: 'CSRF token missing',
        error: 'CSRF_TOKEN_MISSING'
      }, 403);
    }

    const storedToken = csrfTokenStore.get(sessionId);
    
    if (!storedToken || 
        storedToken.token !== csrfToken || 
        Date.now() - storedToken.timestamp > 24 * 60 * 60 * 1000) { // 24 hours
      return c.json({
        success: false,
        message: 'Invalid or expired CSRF token',
        error: 'CSRF_TOKEN_INVALID'
      }, 403);
    }

    await next();
  });
};

// Input sanitization middleware
export const sanitizeInput = () => {
  return createMiddleware<{ Bindings: Env }>(async (c, next) => {
    const contentType = c.req.header('content-type') || '';
    
    if (contentType.includes('application/json')) {
      try {
        const body = await c.req.json();
        
        // Recursively sanitize object
        const sanitized = sanitizeObject(body);
        
        // Replace request body with sanitized version
        c.req = new Request(c.req.url, {
          method: c.req.method,
          headers: c.req.headers,
          body: JSON.stringify(sanitized)
        });
      } catch (error) {
        // Invalid JSON - let it fail naturally in the handler
      }
    }

    await next();
  });
};

// Sanitize string values to prevent XSS
function sanitizeString(str: string): string {
  if (typeof str !== 'string') return str;
  
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/`/g, '&#96;')
    .replace(/=/g, '&#61;');
}

// Recursively sanitize object
function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const cleanKey = sanitizeString(key);
      sanitized[cleanKey] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
}

// Password strength validation
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Mật khẩu phải có ít nhất 8 ký tự');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Mật khẩu phải có ít nhất 1 chữ thường');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Mật khẩu phải có ít nhất 1 chữ hoa');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Mật khẩu phải có ít nhất 1 chữ số');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Mật khẩu phải có ít nhất 1 ký tự đặc biệt');
  }
  
  // Check for common passwords
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123',
    'password123', 'admin', 'letmein', 'welcome', 'monkey'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Mật khẩu quá đơn giản');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Email validation
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

// Secure random token generation
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// SQL injection prevention helper
export function escapeSqlString(str: string): string {
  if (typeof str !== 'string') return str;
  return str.replace(/'/g, "''");
}

// Clean up expired tokens periodically
setInterval(() => {
  const now = Date.now();
  
  // Clean up rate limit store
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
  
  // Clean up CSRF token store
  for (const [key, value] of csrfTokenStore.entries()) {
    if (now - value.timestamp > 24 * 60 * 60 * 1000) { // 24 hours
      csrfTokenStore.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes