import { verify } from 'hono/jwt';
export const authMiddleware = async (c, next) => {
    try {
        const authHeader = c.req.header('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return c.json({
                success: false,
                message: 'Token không hợp lệ',
            }, 401);
        }
        const token = authHeader.substring(7);
        try {
            const payload = await verify(token, c.env.JWT_SECRET);
            // Verify user still exists and is active
            const user = await c.env.DB
                .prepare('SELECT id, email, role, active FROM users WHERE id = ? AND active = 1')
                .bind(payload.sub)
                .first();
            if (!user) {
                return c.json({
                    success: false,
                    message: 'Người dùng không tồn tại hoặc đã bị vô hiệu hóa',
                }, 401);
            }
            // Add user to context
            c.set('user', {
                id: user.id,
                email: user.email,
                role: user.role,
            });
            await next();
        }
        catch (jwtError) {
            return c.json({
                success: false,
                message: 'Token không hợp lệ hoặc đã hết hạn',
            }, 401);
        }
    }
    catch (error) {
        console.error('Auth middleware error:', error);
        return c.json({
            success: false,
            message: 'Lỗi xác thực',
        }, 500);
    }
};
export const requireRole = (allowedRoles) => {
    return async (c, next) => {
        const user = c.get('user');
        if (!user || !allowedRoles.includes(user.role)) {
            return c.json({
                success: false,
                message: 'Không có quyền truy cập',
            }, 403);
        }
        await next();
    };
};
