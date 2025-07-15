// JWT login endpoint handler
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});
export const loginHandler = new Hono()
    .post('/', zValidator('json', loginSchema), async (c) => {
    try {
        const { email, password } = c.req.valid('json');
        const { DB } = c.env;
        // Find user by email
        const user = await DB.prepare('SELECT * FROM users WHERE email = ?')
            .bind(email)
            .first();
        if (!user) {
            return c.json({ error: 'Invalid credentials' }, 401);
        }
        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return c.json({ error: 'Invalid credentials' }, 401);
        }
        // Check if user is active
        if (!user.active) {
            return c.json({ error: 'Account is deactivated' }, 401);
        }
        // Generate JWT token
        const token = jwt.sign({
            userId: user.id,
            email: user.email,
            role: user.role
        }, c.env.JWT_SECRET, { expiresIn: '24h' });
        // Update last login
        await DB.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?')
            .bind(user.id)
            .run();
        return c.json({
            token,
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
        console.error('Login error:', error);
        return c.json({ error: 'Internal server error' }, 500);
    }
});
