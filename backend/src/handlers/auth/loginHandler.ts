// JWT login endpoint handler
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { bruteForceProtection, trackFailedLogin } from '../../middleware/security/enhancedRateLimit';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const loginHandler = new Hono()
  .post('/', 
    bruteForceProtection,
    zValidator('json', loginSchema),
    async (c) => {
    try {
      const { email, password } = c.req.valid('json');
      const { DB } = c.env;

      // Find user by email
      const user = await DB.prepare('SELECT * FROM users WHERE email = ?')
        .bind(email)
        .first();

      if (!user) {
        return c.json({ 
          success: false,
          error: 'Thông tin đăng nhập không chính xác',
          message: 'Email hoặc mật khẩu không đúng'
        }, 401);
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return c.json({ 
          success: false,
          error: 'Thông tin đăng nhập không chính xác',
          message: 'Email hoặc mật khẩu không đúng'
        }, 401);
      }

      // Check if user is active
      if (!user.active) {
        return c.json({ 
          success: false,
          error: 'Tài khoản đã bị vô hiệu hóa',
          message: 'Vui lòng liên hệ quản trị viên'
        }, 401);
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          role: user.role 
        },
        c.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Update last login
      await DB.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?')
        .bind(user.id)
        .run();

      // Generate refresh token
      const refreshToken = jwt.sign(
        { userId: user.id, type: 'refresh' },
        c.env.JWT_REFRESH_SECRET || c.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Store refresh token in database
      await DB.prepare(`
        INSERT OR REPLACE INTO user_sessions (user_id, refresh_token, expires_at, created_at)
        VALUES (?, ?, datetime('now', '+7 days'), datetime('now'))
      `).bind(user.id, refreshToken).run();

      return c.json({
        success: true,
        data: {
          token,
          refreshToken,
          expiresIn: 86400, // 24 hours
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            permissions: user.permissions ? JSON.parse(user.permissions) : [],
            phone: user.phone,
            position: user.position,
          },
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      return c.json({ 
        success: false,
        error: 'Lỗi hệ thống',
        message: 'Đã xảy ra lỗi trong quá trình đăng nhập'
      }, 500);
    }
  }, trackFailedLogin);
