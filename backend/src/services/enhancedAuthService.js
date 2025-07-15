import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { generateAuthTokens, invalidateSession, invalidateAllUserSessions, checkBruteForce, recordFailedAttempt, clearFailedAttempts, cleanupExpiredSessions } from '../middleware/enhancedAuth';
import { validatePasswordStrength, validateEmail } from '../middleware/security';
// Enhanced validation schemas
export const loginSchema = z.object({
    email: z.string().email('Email không hợp lệ').max(254),
    password: z.string().min(1, 'Mật khẩu không được để trống'),
    deviceId: z.string().optional(),
    rememberMe: z.boolean().optional().default(false)
});
export const registerSchema = z.object({
    email: z.string().email('Email không hợp lệ').max(254),
    password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự'),
    name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự').max(100),
    role: z.enum(['admin', 'manager', 'cashier', 'staff']).default('staff'),
    phone: z.string().optional(),
    position: z.string().optional()
});
export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Mật khẩu hiện tại không được để trống'),
    newPassword: z.string().min(8, 'Mật khẩu mới phải có ít nhất 8 ký tự'),
    confirmPassword: z.string().min(1, 'Xác nhận mật khẩu không được để trống')
}).refine(data => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword']
});
export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token không được để trống'),
    deviceId: z.string().optional()
});
export const forgotPasswordSchema = z.object({
    email: z.string().email('Email không hợp lệ')
});
export const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Token không được để trống'),
    newPassword: z.string().min(8, 'Mật khẩu mới phải có ít nhất 8 ký tự'),
    confirmPassword: z.string().min(1, 'Xác nhận mật khẩu không được để trống')
}).refine(data => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword']
});
class EnhancedAuthService {
    saltRounds = 12;
    constructor() {
        // Note: Cleanup will be handled manually in handlers to avoid global scope issues
    }
    // Enhanced login with brute force protection
    async login(db, env, credentials, ipAddress) {
        try {
            const { email, password, deviceId, rememberMe } = loginSchema.parse(credentials);
            // Check email format
            if (!validateEmail(email)) {
                return {
                    success: false,
                    message: 'Email không hợp lệ'
                };
            }
            // Check brute force protection
            const bruteForceCheck = checkBruteForce(email);
            if (bruteForceCheck.isBlocked) {
                return {
                    success: false,
                    message: `Tài khoản tạm thời bị khóa do quá nhiều lần đăng nhập thất bại. Thử lại sau ${Math.ceil((bruteForceCheck.remainingTime || 0) / 60)} phút.`,
                };
            }
            // Get user with password
            const userRecord = await db
                .prepare(`
          SELECT id, email, password, name, role, phone, position, avatar, active, 
                 email_verified, failed_login_attempts, locked_until, 
                 password_changed_at, two_factor_enabled, two_factor_secret,
                 created_at, updated_at
          FROM users 
          WHERE email = ? AND active = 1
        `)
                .bind(email.toLowerCase())
                .first();
            if (!userRecord) {
                recordFailedAttempt(email);
                return {
                    success: false,
                    message: 'Email hoặc mật khẩu không đúng'
                };
            }
            // Check if account is locked
            if (userRecord.locked_until && new Date(userRecord.locked_until) > new Date()) {
                return {
                    success: false,
                    message: 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.'
                };
            }
            // Verify password
            const isValidPassword = await bcrypt.compare(password, userRecord.password);
            if (!isValidPassword) {
                recordFailedAttempt(email);
                // Update failed login attempts in database
                await db
                    .prepare('UPDATE users SET failed_login_attempts = failed_login_attempts + 1 WHERE id = ?')
                    .bind(userRecord.id)
                    .run();
                return {
                    success: false,
                    message: 'Email hoặc mật khẩu không đúng'
                };
            }
            // Check if email is verified
            if (!userRecord.email_verified) {
                return {
                    success: false,
                    message: 'Email chưa được xác thực. Vui lòng kiểm tra email của bạn.'
                };
            }
            // Clear failed attempts on successful login
            clearFailedAttempts(email);
            // Reset failed login attempts in database
            await db
                .prepare('UPDATE users SET failed_login_attempts = 0 WHERE id = ?')
                .bind(userRecord.id)
                .run();
            // Remove password from user object
            const { password: _, ...user } = userRecord;
            // Generate tokens
            const tokens = await generateAuthTokens(user, env, deviceId, ipAddress);
            // Update last login
            await db
                .prepare('UPDATE users SET last_login = datetime("now") WHERE id = ?')
                .bind(user.id)
                .run();
            return {
                success: true,
                message: 'Đăng nhập thành công',
                user: user,
                tokens
            };
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return {
                    success: false,
                    message: 'Dữ liệu đầu vào không hợp lệ',
                    errors: error.errors
                };
            }
            console.error('Enhanced login error:', error);
            return {
                success: false,
                message: 'Có lỗi xảy ra khi đăng nhập'
            };
        }
    }
    // Enhanced registration with stronger validation
    async register(db, env, userData) {
        try {
            const validatedData = registerSchema.parse(userData);
            // Validate email format
            if (!validateEmail(validatedData.email)) {
                return {
                    success: false,
                    message: 'Email không hợp lệ'
                };
            }
            // Validate password strength
            const passwordValidation = validatePasswordStrength(validatedData.password);
            if (!passwordValidation.isValid) {
                return {
                    success: false,
                    message: 'Mật khẩu không đủ mạnh',
                    errors: passwordValidation.errors
                };
            }
            // Check if user already exists
            const existingUser = await db
                .prepare('SELECT id FROM users WHERE email = ?')
                .bind(validatedData.email.toLowerCase())
                .first();
            if (existingUser) {
                return {
                    success: false,
                    message: 'Email đã được sử dụng'
                };
            }
            // Hash password
            const hashedPassword = await bcrypt.hash(validatedData.password, this.saltRounds);
            const userId = crypto.randomUUID();
            const now = new Date().toISOString();
            // Create user
            await db
                .prepare(`
          INSERT INTO users (
            id, email, password, name, role, phone, position, 
            active, email_verified, failed_login_attempts, 
            two_factor_enabled, password_changed_at, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, 0, 0, ?, ?, ?)
        `)
                .bind(userId, validatedData.email.toLowerCase(), hashedPassword, validatedData.name, validatedData.role, validatedData.phone || null, validatedData.position || null, now, now, now)
                .run();
            // Get created user
            const newUser = await this.getUserById(db, userId);
            if (!newUser.success || !newUser.user) {
                throw new Error('Failed to create user');
            }
            // For admin registration, auto-verify email
            if (validatedData.role === 'admin') {
                await db
                    .prepare('UPDATE users SET email_verified = 1 WHERE id = ?')
                    .bind(userId)
                    .run();
                newUser.user.email_verified = true;
            }
            return {
                success: true,
                message: 'Tạo tài khoản thành công',
                user: newUser.user
            };
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return {
                    success: false,
                    message: 'Dữ liệu đầu vào không hợp lệ',
                    errors: error.errors
                };
            }
            console.error('Enhanced register error:', error);
            return {
                success: false,
                message: 'Có lỗi xảy ra khi tạo tài khoản'
            };
        }
    }
    // Enhanced password change with validation
    async changePassword(db, env, userId, currentPassword, newPassword) {
        try {
            // Validate password strength
            const passwordValidation = validatePasswordStrength(newPassword);
            if (!passwordValidation.isValid) {
                return {
                    success: false,
                    message: 'Mật khẩu mới không đủ mạnh',
                    errors: passwordValidation.errors
                };
            }
            // Get current user with password
            const user = await db
                .prepare('SELECT id, password, password_changed_at FROM users WHERE id = ? AND active = 1')
                .bind(userId)
                .first();
            if (!user) {
                return {
                    success: false,
                    message: 'Người dùng không tồn tại'
                };
            }
            // Verify current password
            const isValidPassword = await bcrypt.compare(currentPassword, user.password);
            if (!isValidPassword) {
                return {
                    success: false,
                    message: 'Mật khẩu hiện tại không đúng'
                };
            }
            // Check if new password is same as current
            const isSamePassword = await bcrypt.compare(newPassword, user.password);
            if (isSamePassword) {
                return {
                    success: false,
                    message: 'Mật khẩu mới phải khác mật khẩu hiện tại'
                };
            }
            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, this.saltRounds);
            const now = new Date().toISOString();
            // Update password and invalidate all sessions
            await db
                .prepare(`
          UPDATE users 
          SET password = ?, password_changed_at = ?, updated_at = ?
          WHERE id = ?
        `)
                .bind(hashedPassword, now, now, userId)
                .run();
            // Invalidate all user sessions
            await invalidateAllUserSessions(db, userId);
            return {
                success: true,
                message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.'
            };
        }
        catch (error) {
            console.error('Change password error:', error);
            return {
                success: false,
                message: 'Có lỗi xảy ra khi đổi mật khẩu'
            };
        }
    }
    // Enhanced refresh token handling
    async refreshTokens(db, env, refreshToken, deviceId, ipAddress) {
        try {
            // Verify refresh token exists in database
            const tokenRecord = await db
                .prepare(`
          SELECT rt.user_id, rt.session_id, rt.device_id, u.email, u.role, u.active
          FROM refresh_tokens rt
          JOIN users u ON rt.user_id = u.id
          WHERE rt.token = ? AND rt.expires_at > datetime('now') AND u.active = 1
        `)
                .bind(refreshToken)
                .first();
            if (!tokenRecord) {
                return {
                    success: false,
                    message: 'Refresh token không hợp lệ hoặc đã hết hạn'
                };
            }
            // Verify device ID matches if provided
            if (deviceId && tokenRecord.device_id && tokenRecord.device_id !== deviceId) {
                return {
                    success: false,
                    message: 'Device ID không khớp'
                };
            }
            // Get full user information
            const userResult = await this.getUserById(db, tokenRecord.user_id);
            if (!userResult.success || !userResult.user) {
                return {
                    success: false,
                    message: 'Người dùng không tồn tại'
                };
            }
            // Invalidate old session
            await invalidateSession(db, tokenRecord.session_id);
            // Generate new tokens
            const tokens = await generateAuthTokens(userResult.user, env, deviceId || tokenRecord.device_id, ipAddress);
            return {
                success: true,
                message: 'Token làm mới thành công',
                user: userResult.user,
                tokens
            };
        }
        catch (error) {
            console.error('Refresh token error:', error);
            return {
                success: false,
                message: 'Có lỗi xảy ra khi làm mới token'
            };
        }
    }
    // Enhanced logout
    async logout(db, sessionId, refreshToken) {
        try {
            if (refreshToken) {
                // Remove specific refresh token
                await db
                    .prepare('DELETE FROM refresh_tokens WHERE token = ?')
                    .bind(refreshToken)
                    .run();
            }
            // Invalidate session
            await invalidateSession(db, sessionId);
            return {
                success: true,
                message: 'Đăng xuất thành công'
            };
        }
        catch (error) {
            console.error('Logout error:', error);
            return {
                success: false,
                message: 'Có lỗi xảy ra khi đăng xuất'
            };
        }
    }
    // Get user by ID
    async getUserById(db, userId) {
        try {
            const user = await db
                .prepare(`
          SELECT id, email, name, role, phone, position, avatar, active, 
                 email_verified, last_login, failed_login_attempts, 
                 locked_until, two_factor_enabled, created_at, updated_at
          FROM users 
          WHERE id = ? AND active = 1
        `)
                .bind(userId)
                .first();
            if (!user) {
                return {
                    success: false,
                    message: 'Người dùng không tồn tại'
                };
            }
            return {
                success: true,
                user: user
            };
        }
        catch (error) {
            console.error('Get user by ID error:', error);
            return {
                success: false,
                message: 'Có lỗi xảy ra khi lấy thông tin người dùng'
            };
        }
    }
    // Initialize database tables
    async initializeDatabase(db) {
        try {
            // Enhanced users table
            await db
                .prepare(`
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'cashier', 'staff')),
            phone TEXT,
            position TEXT,
            avatar TEXT,
            active INTEGER NOT NULL DEFAULT 1,
            email_verified INTEGER NOT NULL DEFAULT 0,
            last_login DATETIME,
            failed_login_attempts INTEGER NOT NULL DEFAULT 0,
            locked_until DATETIME,
            password_changed_at DATETIME,
            two_factor_enabled INTEGER NOT NULL DEFAULT 0,
            two_factor_secret TEXT,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL
          )
        `)
                .run();
            // Enhanced refresh tokens table
            await db
                .prepare(`
          CREATE TABLE IF NOT EXISTS refresh_tokens (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
            token TEXT NOT NULL UNIQUE,
            user_id TEXT NOT NULL,
            session_id TEXT NOT NULL,
            device_id TEXT,
            ip_address TEXT,
            expires_at DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          )
        `)
                .run();
            // Password reset tokens table
            await db
                .prepare(`
          CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
            token TEXT NOT NULL UNIQUE,
            user_id TEXT NOT NULL,
            expires_at DATETIME NOT NULL,
            used INTEGER NOT NULL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          )
        `)
                .run();
            // Create indexes
            await db.prepare('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)').run();
            await db.prepare('CREATE INDEX IF NOT EXISTS idx_users_active ON users(active)').run();
            await db.prepare('CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id)').run();
            await db.prepare('CREATE INDEX IF NOT EXISTS idx_refresh_tokens_session_id ON refresh_tokens(session_id)').run();
            await db.prepare('CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at)').run();
            await db.prepare('CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token)').run();
            await db.prepare('CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id)').run();
        }
        catch (error) {
            console.error('Database initialization error:', error);
            throw error;
        }
    }
    // Cleanup expired sessions and tokens
    async cleanupExpired(db) {
        await cleanupExpiredSessions(db);
        // Clean up expired password reset tokens
        await db
            .prepare('DELETE FROM password_reset_tokens WHERE expires_at <= datetime("now")')
            .run();
    }
}
export const enhancedAuthService = new EnhancedAuthService();
