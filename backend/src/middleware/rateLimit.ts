import { Context, Next } from 'hono';
import type { Env } from '../index';

export const rateLimitMiddleware = async (c: Context<{ Bindings: Env }>, next: Next) => {
  try {
    const clientIP = c.req.header('CF-Connecting-IP') || 
                     c.req.header('X-Forwarded-For') || 
                     'unknown';
    
    const requestLimit = parseInt(c.env.RATE_LIMIT_REQUESTS) || 100;
    const windowSeconds = parseInt(c.env.RATE_LIMIT_WINDOW) || 60;
    
    const key = `rate_limit:${clientIP}`;
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - windowSeconds;
    
    // Get current request count from KV
    const currentData = await c.env.CACHE.get(key);
    let requests: number[] = currentData ? JSON.parse(currentData) : [];
    
    // Remove old requests outside the window
    requests = requests.filter(timestamp => timestamp > windowStart);
    
    // Check if limit exceeded
    if (requests.length >= requestLimit) {
      return c.json({
        success: false,
        message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
        retryAfter: windowSeconds,
      }, 429);
    }
    
    // Add current request
    requests.push(now);
    
    // Store updated requests with TTL
    await c.env.CACHE.put(key, JSON.stringify(requests), {
      expirationTtl: windowSeconds + 10, // Add buffer
    });
    
    // Add rate limit headers
    c.header('X-RateLimit-Limit', requestLimit.toString());
    c.header('X-RateLimit-Remaining', (requestLimit - requests.length).toString());
    c.header('X-RateLimit-Reset', (now + windowSeconds).toString());
    
    await next();
  } catch (error) {
    console.error('Rate limit middleware error:', error);
    // Continue on error to avoid blocking requests
    await next();
  }
};
