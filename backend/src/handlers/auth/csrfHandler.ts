// CSRF token handler for frontend protection
import { Hono } from 'hono';
import { createHash, randomBytes } from 'crypto';
import { apiRateLimit } from '../../middleware/security/enhancedRateLimit';

export const csrfHandler = new Hono()
  .get('/csrf-token', 
    apiRateLimit,
    async (c) => {
    try {
      // Generate CSRF token
      const tokenData = randomBytes(32).toString('hex');
      const timestamp = Date.now();
      const expiresAt = timestamp + 3600000; // 1 hour
      
      // Create token hash for storage
      const tokenHash = createHash('sha256').update(tokenData).digest('hex');
      
      // Store in KV with expiration
      const csrfData = {
        hash: tokenHash,
        expiresAt,
        created: timestamp,
      };
      
      await c.env.CACHE.put(
        `csrf:${tokenHash}`,
        JSON.stringify(csrfData),
        { expirationTtl: 3600 } // 1 hour
      );
      
      return c.json({
        success: true,
        data: {
          token: tokenData,
          expiresAt,
        },
      });
    } catch (error) {
      console.error('CSRF token generation error:', error);
      return c.json({ 
        success: false,
        error: 'Failed to generate CSRF token' 
      }, 500);
    }
  })

  .post('/csrf-verify',
    apiRateLimit,
    async (c) => {
    try {
      const { token } = await c.req.json();
      
      if (!token) {
        return c.json({ 
          success: false,
          error: 'CSRF token required' 
        }, 400);
      }
      
      // Create hash of provided token
      const tokenHash = createHash('sha256').update(token).digest('hex');
      
      // Check if token exists and is valid
      const csrfData = await c.env.CACHE.get(`csrf:${tokenHash}`);
      
      if (!csrfData) {
        return c.json({ 
          success: false,
          error: 'Invalid or expired CSRF token' 
        }, 400);
      }
      
      const data = JSON.parse(csrfData);
      
      if (data.expiresAt < Date.now()) {
        // Clean up expired token
        await c.env.CACHE.delete(`csrf:${tokenHash}`);
        return c.json({ 
          success: false,
          error: 'CSRF token expired' 
        }, 400);
      }
      
      return c.json({
        success: true,
        message: 'CSRF token valid',
      });
    } catch (error) {
      console.error('CSRF token verification error:', error);
      return c.json({ 
        success: false,
        error: 'CSRF token verification failed' 
      }, 500);
    }
  });

// Middleware to verify CSRF token
export const csrfMiddleware = async (c: any, next: any) => {
  // Only check CSRF for state-changing requests
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(c.req.method)) {
    const csrfToken = c.req.header('X-CSRF-Token');
    
    if (!csrfToken) {
      return c.json({ 
        success: false,
        error: 'CSRF token required' 
      }, 400);
    }
    
    try {
      const tokenHash = createHash('sha256').update(csrfToken).digest('hex');
      const csrfData = await c.env.CACHE.get(`csrf:${tokenHash}`);
      
      if (!csrfData) {
        return c.json({ 
          success: false,
          error: 'Invalid CSRF token' 
        }, 400);
      }
      
      const data = JSON.parse(csrfData);
      
      if (data.expiresAt < Date.now()) {
        await c.env.CACHE.delete(`csrf:${tokenHash}`);
        return c.json({ 
          success: false,
          error: 'CSRF token expired' 
        }, 400);
      }
    } catch (error) {
      console.error('CSRF middleware error:', error);
      return c.json({ 
        success: false,
        error: 'CSRF validation failed' 
      }, 400);
    }
  }
  
  await next();
};