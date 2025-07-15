// User registration handler
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
const registerSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(['admin', 'manager', 'cashier', 'staff']).optional().default('staff'),
});
export const registerHandler = new Hono()
    .post('/', zValidator('json', registerSchema), async (c) => {
    try {
        const { name, email, password, role } = c.req.valid('json');
        const { DB } = c.env;
        // Check if user already exists
        const existingUser = await DB.prepare('SELECT id FROM users WHERE email = ?')
            .bind(email)
            .first();
        if (existingUser) {
            return c.json({ error: 'User already exists' }, 400);
        }
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);
        // Create user
        const userId = crypto.randomUUID();
        await DB.prepare(`
        INSERT INTO users (id, name, email, password, role, active, created_at)
        VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
      `).bind(userId, name, email, hashedPassword, role).run();
        return c.json({
            message: 'User created successfully',
            user: {
                id: userId,
                name,
                email,
                role,
            },
        }, 201);
    }
    catch (error) {
        console.error('Registration error:', error);
        return c.json({ error: 'Internal server error' }, 500);
    }
});
