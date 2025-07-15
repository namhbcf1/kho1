// Token refresh handler
import { Hono } from 'hono';
import jwt from 'jsonwebtoken';
export const refreshHandler = new Hono()
    .post('/', async (c) => {
    try {
        const authHeader = c.req.header('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return c.json({ error: 'No token provided' }, 401);
        }
        const token = authHeader.substring(7);
        const { DB } = c.env;
        // Verify current token (even if expired)
        let decoded;
        try {
            decoded = jwt.verify(token, c.env.JWT_SECRET);
        }
        catch (error) {
            if (error.name === 'TokenExpiredError') {
                decoded = jwt.decode(token);
            }
            else {
                return c.json({ error: 'Invalid token' }, 401);
            }
        }
        // Get user from database
        const user = await DB.prepare('SELECT * FROM users WHERE id = ?')
            .bind(decoded.userId)
            .first();
        if (!user || !user.active) {
            return c.json({ error: 'User not found or inactive' }, 401);
        }
        // Generate new token
        const newToken = jwt.sign({
            userId: user.id,
            email: user.email,
            role: user.role
        }, c.env.JWT_SECRET, { expiresIn: '24h' });
        return c.json({
            token: newToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                permissions: user.permissions ? JSON.parse(user.permissions) : [],
            },
        });
    }
    catch (error) {
        console.error('Token refresh error:', error);
        return c.json({ error: 'Internal server error' }, 500);
    }
});
