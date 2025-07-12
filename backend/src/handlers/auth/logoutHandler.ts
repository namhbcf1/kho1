// Session cleanup handler
import { Hono } from 'hono';

export const logoutHandler = new Hono()
  .post('/', async (c) => {
    try {
      // In a stateless JWT system, logout is typically handled client-side
      // by removing the token. However, we can add token to a blacklist
      // or update user's last_logout timestamp for audit purposes.
      
      const authHeader = c.req.header('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const { KV } = c.env;
        
        // Add token to blacklist in KV store with expiration
        await KV.put(`blacklist:${token}`, 'true', { expirationTtl: 86400 }); // 24 hours
      }

      return c.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });
