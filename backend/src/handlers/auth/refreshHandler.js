// JWT refresh token handler
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { apiRateLimit } from '../../middleware/security/enhancedRateLimit';
const refreshSchema = z.object({
    refreshToken: z.string(),
});
export const refreshHandler = new Hono()
    .post('/', apiRateLimit, zValidator('json', refreshSchema), async (c) => {
    try {
        const { refreshToken } = c.req.valid('json');
        const { DB } = c.env;
        // Verify refresh token
        const decoded = jwt.verify(refreshToken, c.env.JWT_REFRESH_SECRET || c.env.JWT_SECRET);
        if (decoded.type !== 'refresh') {
            return c.json({
                success: false,
                error: 'Invalid refresh token type'
            }, 401);
        }
        // Check if refresh token exists in database
        const session = await DB.prepare(`
        SELECT s.*, u.* FROM user_sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.refresh_token = ? AND s.expires_at > datetime('now') AND u.active = 1
      `).bind(refreshToken).first();
        if (!session) {
            return c.json({
                success: false,
                error: 'Refresh token not found or expired'
            }, 401);
        }
        // Generate new access token
        const newToken = jwt.sign({
            userId: session.user_id,
            email: session.email,
            role: session.role
        }, c.env.JWT_SECRET, { expiresIn: '24h' });
        // Update last used timestamp
        await DB.prepare(`
        UPDATE user_sessions 
        SET last_used = datetime('now')
        WHERE refresh_token = ?
      `).bind(refreshToken).run();
        return c.json({
            success: true,
            data: {
                token: newToken,
                expiresIn: 86400, // 24 hours
            },
        });
    }
    catch (error) {
        console.error('Refresh token error:', error);
        return c.json({
            success: false,
            error: 'Invalid or expired refresh token'
        }, 401);
    }
});
