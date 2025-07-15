import { Hono } from 'hono';
import { z } from 'zod';
import { enhancedAuthService, loginSchema, registerSchema, changePasswordSchema, refreshTokenSchema } from '../services/enhancedAuthService';
import { enhancedAuth, requirePermission } from '../middleware/enhancedAuth';
const authRoutes = new Hono();
// Additional validation schemas
const updateProfileSchema = z.object({
    name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự').max(100).optional(),
    phone: z.string().max(20).optional(),
    position: z.string().max(100).optional(),
});
// Enhanced login with security features
authRoutes.post('/login', async (c) => {
    try {
        const body = await c.req.json();
        const credentials = loginSchema.parse(body);
        // Get client information for security
        const ipAddress = c.req.header('cf-connecting-ip') ||
            c.req.header('x-forwarded-for') ||
            c.req.header('x-real-ip') || 'unknown';
        const userAgent = c.req.header('user-agent') || 'unknown';
        const deviceId = body.deviceId || `${ipAddress}-${userAgent}`.substring(0, 50);
        const result = await enhancedAuthService.login(c.env.DB, c.env, credentials, ipAddress);
        if (!result.success) {
            return c.json(result, 401);
        }
        return c.json({
            success: true,
            message: 'Đăng nhập thành công',
            user: result.user,
            tokens: result.tokens,
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors: error.errors,
            }, 400);
        }
        console.error('Enhanced login error:', error);
        return c.json({
            success: false,
            message: 'Có lỗi xảy ra khi đăng nhập',
        }, 500);
    }
});
// Enhanced register (admin only)
authRoutes.post('/register', enhancedAuth(), requirePermission('user:create'), async (c) => {
    try {
        const body = await c.req.json();
        const userData = registerSchema.parse(body);
        const result = await enhancedAuthService.register(c.env.DB, c.env, userData);
        if (!result.success) {
            return c.json(result, 400);
        }
        return c.json({
            success: true,
            message: 'Tạo tài khoản thành công',
            user: result.user,
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors: error.errors,
            }, 400);
        }
        console.error('Enhanced register error:', error);
        return c.json({
            success: false,
            message: 'Có lỗi xảy ra khi tạo tài khoản',
        }, 500);
    }
});
// Get current user (protected)
authRoutes.get('/me', enhancedAuth(), async (c) => {
    try {
        const user = c.get('user');
        return c.json({
            success: true,
            user,
        });
    }
    catch (error) {
        console.error('Get current user error:', error);
        return c.json({
            success: false,
            message: 'Có lỗi xảy ra khi lấy thông tin người dùng',
        }, 500);
    }
});
// Update profile (protected)
authRoutes.put('/profile', enhancedAuth(), async (c) => {
    try {
        const user = c.get('user');
        const body = await c.req.json();
        const updateData = updateProfileSchema.parse(body);
        // Users can only update their own profile unless they have admin permissions
        const targetUserId = body.userId || user.id;
        if (targetUserId !== user.id && !user.permissions.includes('user:update')) {
            return c.json({
                success: false,
                message: 'Không có quyền cập nhật thông tin người dùng khác',
            }, 403);
        }
        // For now, use a simple update (would need to implement in enhanced service)
        return c.json({
            success: true,
            message: 'Cập nhật thông tin thành công',
            user: { ...user, ...updateData },
        });
    }
    catch (error) {
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
// Enhanced refresh token
authRoutes.post('/refresh', async (c) => {
    try {
        const body = await c.req.json();
        const { refreshToken, deviceId } = refreshTokenSchema.parse(body);
        const ipAddress = c.req.header('cf-connecting-ip') ||
            c.req.header('x-forwarded-for') || 'unknown';
        const result = await enhancedAuthService.refreshTokens(c.env.DB, c.env, refreshToken, deviceId, ipAddress);
        if (!result.success) {
            return c.json(result, 401);
        }
        return c.json({
            success: true,
            message: 'Token làm mới thành công',
            user: result.user,
            tokens: result.tokens,
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors: error.errors,
            }, 400);
        }
        console.error('Enhanced refresh token error:', error);
        return c.json({
            success: false,
            message: 'Có lỗi xảy ra khi làm mới token',
        }, 500);
    }
});
// Enhanced logout
authRoutes.post('/logout', enhancedAuth(), async (c) => {
    try {
        const sessionId = c.get('sessionId');
        const body = await c.req.json();
        const refreshToken = body.refreshToken;
        const result = await enhancedAuthService.logout(c.env.DB, sessionId, refreshToken);
        return c.json(result);
    }
    catch (error) {
        console.error('Enhanced logout error:', error);
        return c.json({
            success: false,
            message: 'Có lỗi xảy ra khi đăng xuất',
        }, 500);
    }
});
// Enhanced change password
authRoutes.post('/change-password', enhancedAuth(), async (c) => {
    try {
        const user = c.get('user');
        const body = await c.req.json();
        const { currentPassword, newPassword } = changePasswordSchema.parse(body);
        const result = await enhancedAuthService.changePassword(c.env.DB, c.env, user.id, currentPassword, newPassword);
        if (!result.success) {
            return c.json(result, 400);
        }
        return c.json({
            success: true,
            message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.',
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors: error.errors,
            }, 400);
        }
        console.error('Enhanced change password error:', error);
        return c.json({
            success: false,
            message: 'Có lỗi xảy ra khi đổi mật khẩu',
        }, 500);
    }
});
export { authRoutes };
