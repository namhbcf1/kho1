import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt';
import { z } from 'zod';
import { authService } from '../services/authService';
import type { Env } from '../index';

const authRoutes = new Hono<{ Bindings: Env }>();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  remember: z.boolean().optional(),
});

const registerSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  role: z.enum(['admin', 'manager', 'cashier', 'staff']).optional(),
});

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự').optional(),
  phone: z.string().optional(),
  position: z.string().optional(),
});

// Login
authRoutes.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, remember } = loginSchema.parse(body);

    const result = await authService.login(c.env.DB, email, password);
    
    if (!result.success) {
      return c.json(result, 401);
    }

    // Generate JWT token
    const payload = {
      sub: result.user.id,
      email: result.user.email,
      role: result.user.role,
      exp: Math.floor(Date.now() / 1000) + (remember ? 30 * 24 * 60 * 60 : 24 * 60 * 60), // 30 days or 1 day
    };

    const token = await sign(payload, c.env.JWT_SECRET);

    return c.json({
      success: true,
      message: 'Đăng nhập thành công',
      user: result.user,
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: error.errors,
      }, 400);
    }

    console.error('Login error:', error);
    return c.json({
      success: false,
      message: 'Có lỗi xảy ra khi đăng nhập',
    }, 500);
  }
});

// Register (admin only)
authRoutes.post('/register', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name, role = 'staff' } = registerSchema.parse(body);

    const result = await authService.register(c.env.DB, {
      email,
      password,
      name,
      role,
    });

    if (!result.success) {
      return c.json(result, 400);
    }

    return c.json({
      success: true,
      message: 'Tạo tài khoản thành công',
      user: result.user,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: error.errors,
      }, 400);
    }

    console.error('Register error:', error);
    return c.json({
      success: false,
      message: 'Có lỗi xảy ra khi tạo tài khoản',
    }, 500);
  }
});

// Get current user
authRoutes.get('/me', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({
        success: false,
        message: 'Token không hợp lệ',
      }, 401);
    }

    const token = authHeader.substring(7);
    const payload = await verify(token, c.env.JWT_SECRET);
    
    const user = await authService.getUserById(c.env.DB, payload.sub as string);
    
    if (!user.success) {
      return c.json(user, 404);
    }

    return c.json({
      success: true,
      user: user.user,
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return c.json({
      success: false,
      message: 'Token không hợp lệ',
    }, 401);
  }
});

// Update profile
authRoutes.put('/profile', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const updateData = updateProfileSchema.parse(body);

    const result = await authService.updateProfile(c.env.DB, user.id, updateData);
    
    if (!result.success) {
      return c.json(result, 400);
    }

    return c.json({
      success: true,
      message: 'Cập nhật thông tin thành công',
      user: result.user,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: error.errors,
      }, 400);
    }

    console.error('Update profile error:', error);
    return c.json({
      success: false,
      message: 'Có lỗi xảy ra khi cập nhật thông tin',
    }, 500);
  }
});

// Logout
authRoutes.post('/logout', async (c) => {
  // In a stateless JWT system, logout is handled client-side
  // But we can add token blacklisting here if needed
  return c.json({
    success: true,
    message: 'Đăng xuất thành công',
  });
});

export { authRoutes };
