// JWT token validation middleware
import { Context, Next } from 'hono';
import { verify } from 'hono/jwt';

export const jwtMiddleware = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ 
        success: false, 
        error: { code: 'UNAUTHORIZED', message: 'Missing or invalid authorization header' } 
      }, 401);
    }

    const token = authHeader.substring(7);
    const secret = c.env.JWT_SECRET;

    if (!secret) {
      return c.json({ 
        success: false, 
        error: { code: 'SERVER_ERROR', message: 'JWT secret not configured' } 
      }, 500);
    }

    const payload = await verify(token, secret);
    
    if (!payload) {
      return c.json({ 
        success: false, 
        error: { code: 'UNAUTHORIZED', message: 'Invalid token' } 
      }, 401);
    }

    // Add user info to context
    c.set('user', payload);
    
    await next();
  } catch (error) {
    return c.json({ 
      success: false, 
      error: { code: 'UNAUTHORIZED', message: 'Token verification failed' } 
    }, 401);
  }
};
