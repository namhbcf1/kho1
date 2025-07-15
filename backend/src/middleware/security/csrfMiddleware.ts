import { Context } from 'hono';
import { createMiddleware } from 'hono/factory';
import { sign, verify } from 'hono/jwt';

// Define the environment interface for this middleware
interface CSRFEnv {
  DB: D1Database;
  KV: KVNamespace;
  JWT_SECRET: string;
  [key: string]: any;
}

interface CSRFToken {
  token: string;
  expires: number;
  userAgent: string;
  ip: string;
}

// CSRF protection middleware
export const csrfProtection = () => {
  return createMiddleware<{ Bindings: CSRFEnv }>(async (c, next) => {
    const method = c.req.method;
    const path = c.req.path;

    // Skip CSRF protection for GET, HEAD, OPTIONS requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      await next();
      return;
    }

    // Skip CSRF protection for auth endpoints (they have their own protection)
    if (path.startsWith('/auth/login') || path.startsWith('/auth/register')) {
      await next();
      return;
    }

    // Skip CSRF protection for webhook endpoints
    if (path.includes('/webhook/') || path.includes('/callback/')) {
      await next();
      return;
    }

    try {
      // Get CSRF token from header
      const csrfToken = c.req.header('X-CSRF-Token') || c.req.header('x-csrf-token');
      
      if (!csrfToken) {
        return c.json({
          success: false,
          message: 'CSRF token is required for this request',
          error: 'CSRF_TOKEN_MISSING'
        }, 403);
      }

      // Verify CSRF token
      const isValid = await verifyCSRFToken(c, csrfToken);
      
      if (!isValid) {
        return c.json({
          success: false,
          message: 'Invalid or expired CSRF token',
          error: 'CSRF_TOKEN_INVALID'
        }, 403);
      }

      await next();
    } catch (error) {
      console.error('CSRF protection error:', error);
      return c.json({
        success: false,
        message: 'CSRF protection error',
        error: 'CSRF_ERROR'
      }, 500);
    }
  });
};

// Generate CSRF token
export const generateCSRFToken = async (c: Context<{ Bindings: CSRFEnv }>): Promise<string> => {
  const userAgent = c.req.header('user-agent') || 'unknown';
  const ip = c.req.header('cf-connecting-ip') || 
             c.req.header('x-forwarded-for') || 
             c.req.header('x-real-ip') || 'unknown';

  const tokenData: CSRFToken = {
    token: crypto.randomUUID(),
    expires: Date.now() + (60 * 60 * 1000), // 1 hour expiry
    userAgent,
    ip
  };

  // Sign the token data
  const signedToken = await sign(tokenData, c.env.JWT_SECRET);

  // Store token in KV for verification
  await c.env.KV.put(
    `csrf:${tokenData.token}`,
    JSON.stringify(tokenData),
    { expirationTtl: 3600 } // 1 hour
  );

  return signedToken;
};

// Verify CSRF token
export const verifyCSRFToken = async (c: Context<{ Bindings: CSRFEnv }>, token: string): Promise<boolean> => {
  try {
    // Verify JWT signature
    const payload = await verify(token, c.env.JWT_SECRET) as CSRFToken;
    
    if (!payload || !payload.token) {
      return false;
    }

    // Check expiry
    if (Date.now() > payload.expires) {
      return false;
    }

    // Verify token exists in KV
    const storedToken = await c.env.KV.get(`csrf:${payload.token}`);
    if (!storedToken) {
      return false;
    }

    const storedData = JSON.parse(storedToken) as CSRFToken;

    // Verify user agent and IP for additional security
    const currentUserAgent = c.req.header('user-agent') || 'unknown';
    const currentIp = c.req.header('cf-connecting-ip') || 
                     c.req.header('x-forwarded-for') || 
                     c.req.header('x-real-ip') || 'unknown';

    if (storedData.userAgent !== currentUserAgent || storedData.ip !== currentIp) {
      // Log potential CSRF attack
      console.warn('CSRF token validation failed - user agent or IP mismatch', {
        storedUserAgent: storedData.userAgent,
        currentUserAgent,
        storedIp: storedData.ip,
        currentIp,
        path: c.req.path,
        method: c.req.method
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error('CSRF token verification error:', error);
    return false;
  }
};

// CSRF token endpoint
export const csrfTokenHandler = async (c: Context<{ Bindings: CSRFEnv }>) => {
  try {
    const token = await generateCSRFToken(c);
    
    return c.json({
      success: true,
      token,
      message: 'CSRF token generated successfully'
    });
  } catch (error) {
    console.error('CSRF token generation error:', error);
    return c.json({
      success: false,
      message: 'Failed to generate CSRF token',
      error: 'CSRF_GENERATION_ERROR'
    }, 500);
  }
};

// Cleanup expired CSRF tokens (should be called periodically)
export const cleanupExpiredCSRFTokens = async (kv: KVNamespace) => {
  try {
    // This is a simple cleanup - in production, you might want to use a more sophisticated approach
    const list = await kv.list({ prefix: 'csrf:' });
    
    for (const key of list.keys) {
      const data = await kv.get(key.name);
      if (data) {
        const tokenData = JSON.parse(data) as CSRFToken;
        if (Date.now() > tokenData.expires) {
          await kv.delete(key.name);
        }
      }
    }
  } catch (error) {
    console.error('CSRF token cleanup error:', error);
  }
}; 