// Role-based access control middleware
import { Context, Next } from 'hono';

export const roleMiddleware = (allowedRoles: string[]) => {
  return async (c: Context, next: Next) => {
    try {
      const user = c.get('user');
      
      if (!user) {
        return c.json({ 
          success: false, 
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } 
        }, 401);
      }

      const userRole = user.role;
      
      if (!allowedRoles.includes(userRole)) {
        return c.json({ 
          success: false, 
          error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } 
        }, 403);
      }

      await next();
    } catch (error) {
      return c.json({ 
        success: false, 
        error: { code: 'SERVER_ERROR', message: 'Role verification failed' } 
      }, 500);
    }
  };
};
