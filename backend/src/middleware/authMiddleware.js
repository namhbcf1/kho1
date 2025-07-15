import { authService } from '../services/authService';
// Extract token from Authorization header
function extractToken(authorization) {
    if (!authorization)
        return null;
    const parts = authorization.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return null;
    }
    return parts[1];
}
// Authentication middleware
export const authenticate = () => {
    return async (c, next) => {
        const db = c.env?.DB;
        if (!db) {
            return c.json({ error: 'Database not available' }, 500);
        }
        // Initialize auth service with environment variables
        const jwtSecret = c.env?.JWT_SECRET || 'your-jwt-secret';
        const refreshSecret = c.env?.REFRESH_SECRET;
        const saltRounds = parseInt(c.env?.BCRYPT_ROUNDS || '12');
        authService.init(jwtSecret, refreshSecret, saltRounds);
        const authorization = c.req.header('Authorization');
        const token = extractToken(authorization);
        if (!token) {
            return c.json({
                error: 'Token không được cung cấp',
                code: 'MISSING_TOKEN'
            }, 401);
        }
        try {
            const result = await authService.verifyAccessToken(db, token);
            if (!result.success || !result.user) {
                return c.json({
                    error: result.message || 'Token không hợp lệ',
                    code: 'INVALID_TOKEN'
                }, 401);
            }
            // Add user to context
            c.user = {
                id: result.user.id,
                email: result.user.email,
                name: result.user.name,
                role: result.user.role,
            };
            await next();
        }
        catch (error) {
            console.error('Authentication error:', error);
            return c.json({
                error: 'Lỗi xác thực',
                code: 'AUTH_ERROR'
            }, 401);
        }
    };
};
// Role-based authorization middleware
export const authorize = (allowedRoles) => {
    return async (c, next) => {
        if (!c.user) {
            return c.json({
                error: 'Người dùng chưa được xác thực',
                code: 'NOT_AUTHENTICATED'
            }, 401);
        }
        if (!allowedRoles.includes(c.user.role)) {
            return c.json({
                error: 'Không có quyền truy cập',
                code: 'INSUFFICIENT_PERMISSIONS',
                required_roles: allowedRoles,
                user_role: c.user.role
            }, 403);
        }
        await next();
    };
};
// Optional authentication (for routes that work with or without auth)
export const optionalAuth = () => {
    return async (c, next) => {
        const db = c.env?.DB;
        if (!db) {
            await next();
            return;
        }
        // Initialize auth service with environment variables
        const jwtSecret = c.env?.JWT_SECRET || 'your-jwt-secret';
        const refreshSecret = c.env?.REFRESH_SECRET;
        const saltRounds = parseInt(c.env?.BCRYPT_ROUNDS || '12');
        authService.init(jwtSecret, refreshSecret, saltRounds);
        const authorization = c.req.header('Authorization');
        const token = extractToken(authorization);
        if (token) {
            try {
                const result = await authService.verifyAccessToken(db, token);
                if (result.success && result.user) {
                    c.user = {
                        id: result.user.id,
                        email: result.user.email,
                        name: result.user.name,
                        role: result.user.role,
                    };
                }
            }
            catch (error) {
                // Ignore authentication errors for optional auth
                console.log('Optional auth failed:', error);
            }
        }
        await next();
    };
};
// Admin only middleware
export const adminOnly = () => authorize(['admin']);
// Manager and Admin middleware
export const managerOrAdmin = () => authorize(['admin', 'manager']);
// Staff level access (cashier, staff, manager, admin)
export const staffAccess = () => authorize(['admin', 'manager', 'cashier', 'staff']);
// Cashier level access (cashier, manager, admin)
export const cashierAccess = () => authorize(['admin', 'manager', 'cashier']);
