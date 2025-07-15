// JWT logout handler with session cleanup
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { apiRateLimit } from '../../middleware/security/enhancedRateLimit';

const logoutSchema = z.object({
  refreshToken: z.string().optional(),
});

export const logoutHandler = new Hono()
  .post('/', 
    apiRateLimit,
    zValidator('json', logoutSchema),
    async (c) => {
    try {
      const { refreshToken } = c.req.valid('json');
      const { DB } = c.env;
      
      // Get user from JWT token
      const authHeader = c.req.header('Authorization');
      let userId: string | null = null;
      
      if (authHeader?.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7);
          const decoded = jwt.verify(token, c.env.JWT_SECRET) as any;
          userId = decoded.userId;
        } catch (error) {
          // Invalid token, but continue with logout
          console.warn('Invalid token during logout:', error);
        }
      }

      // Clean up sessions
      if (refreshToken) {
        // Remove specific session
        await DB.prepare(`
          DELETE FROM user_sessions 
          WHERE refresh_token = ?
        `).bind(refreshToken).run();
      }

      if (userId) {
        // Optionally remove all sessions for user (uncomment for logout all devices)
        // await DB.prepare(`
        //   DELETE FROM user_sessions 
        //   WHERE user_id = ?
        // `).bind(userId).run();
      }

      // Clear any cached data
      if (userId) {
        // Clear user cache
        const cacheKey = `user:${userId}`;
        await c.env.CACHE.delete(cacheKey);
      }

      return c.json({
        success: true,
        message: 'Đăng xuất thành công',
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Always return success for logout to prevent issues
      return c.json({
        success: true,
        message: 'Đăng xuất thành công',
      });
    }
  });