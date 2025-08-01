import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
class AuthService {
    jwtSecret;
    refreshSecret;
    saltRounds;
    accessTokenExpiry;
    refreshTokenExpiry;
    constructor() {
        this.jwtSecret = 'your-jwt-secret'; // Will be set from environment
        this.refreshSecret = 'your-refresh-secret'; // Will be set from environment
        this.saltRounds = 12;
        this.accessTokenExpiry = '15m';
        this.refreshTokenExpiry = '7d';
    }
    // Initialize secrets from environment
    init(jwtSecret, refreshSecret, saltRounds) {
        this.jwtSecret = jwtSecret;
        this.refreshSecret = refreshSecret || jwtSecret + '_refresh';
        this.saltRounds = saltRounds || 12;
    }
    async login(db, credentials) {
        try {
            const { email, password } = credentials;
            const userRecord = await db
                .prepare('SELECT * FROM users WHERE email = ? AND active = 1')
                .bind(email)
                .first();
            if (!userRecord) {
                return {
                    success: false,
                    message: 'Email hoặc mật khẩu không đúng',
                };
            }
            const isValidPassword = await bcrypt.compare(password, userRecord.password);
            if (!isValidPassword) {
                return {
                    success: false,
                    message: 'Email hoặc mật khẩu không đúng',
                };
            }
            // Remove password from user object
            const { password: _, ...user } = userRecord;
            // Generate tokens
            const tokens = await this.generateTokens(db, user);
            // Update last login
            await this.updateLastLogin(db, user.id);
            return {
                success: true,
                user: user,
                tokens,
            };
        }
        catch (error) {
            console.error('Login service error:', error);
            return {
                success: false,
                message: 'Có lỗi xảy ra khi đăng nhập',
            };
        }
    }
    async register(db, userData) {
        try {
            // Check if user already exists
            const existingUser = await db
                .prepare('SELECT id FROM users WHERE email = ?')
                .bind(userData.email)
                .first();
            if (existingUser) {
                return {
                    success: false,
                    message: 'Email đã được sử dụng',
                };
            }
            // Hash password
            const hashedPassword = await bcrypt.hash(userData.password, this.saltRounds);
            const userId = crypto.randomUUID();
            const now = new Date().toISOString();
            // Create user
            await db
                .prepare(`
          INSERT INTO users (id, email, password, name, role, phone, position, active, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
        `)
                .bind(userId, userData.email, hashedPassword, userData.name, userData.role, userData.phone || null, userData.position || null, now, now)
                .run();
            // Get created user
            const user = await this.getUserById(db, userId);
            if (!user.success || !user.user) {
                throw new Error('Failed to create user');
            }
            // Generate tokens
            const tokens = await this.generateTokens(db, user.user);
            return {
                success: true,
                user: user.user,
                tokens,
            };
        }
        catch (error) {
            console.error('Register service error:', error);
            return {
                success: false,
                message: 'Có lỗi xảy ra khi tạo tài khoản',
            };
        }
    }
    async getUserById(db, userId) {
        try {
            const user = await db
                .prepare(`
          SELECT id, email, name, role, phone, position, avatar, active, created_at, updated_at 
          FROM users WHERE id = ? AND active = 1
        `)
                .bind(userId)
                .first();
            if (!user) {
                return {
                    success: false,
                    message: 'Người dùng không tồn tại',
                };
            }
            return {
                success: true,
                user: user,
            };
        }
        catch (error) {
            console.error('Get user by ID service error:', error);
            return {
                success: false,
                message: 'Có lỗi xảy ra khi lấy thông tin người dùng',
            };
        }
    }
    async updateProfile(db, userId, updateData) {
        try {
            const updates = [];
            const values = [];
            if (updateData.name) {
                updates.push('name = ?');
                values.push(updateData.name);
            }
            if (updateData.phone) {
                updates.push('phone = ?');
                values.push(updateData.phone);
            }
            if (updateData.position) {
                updates.push('position = ?');
                values.push(updateData.position);
            }
            if (updates.length === 0) {
                return {
                    success: false,
                    message: 'Không có dữ liệu để cập nhật',
                };
            }
            updates.push('updated_at = CURRENT_TIMESTAMP');
            values.push(userId);
            await db
                .prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`)
                .bind(...values)
                .run();
            // Get updated user
            const user = await this.getUserById(db, userId);
            return user;
        }
        catch (error) {
            console.error('Update profile service error:', error);
            return {
                success: false,
                message: 'Có lỗi xảy ra khi cập nhật thông tin',
            };
        }
    }
    async changePassword(db, userId, currentPassword, newPassword) {
        try {
            // Get current user
            const user = await db
                .prepare('SELECT password FROM users WHERE id = ? AND active = 1')
                .bind(userId)
                .first();
            if (!user) {
                return {
                    success: false,
                    message: 'Người dùng không tồn tại',
                };
            }
            // Verify current password
            const isValidPassword = await bcrypt.compare(currentPassword, user.password);
            if (!isValidPassword) {
                return {
                    success: false,
                    message: 'Mật khẩu hiện tại không đúng',
                };
            }
            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, this.saltRounds);
            // Revoke all refresh tokens for this user
            await this.revokeAllUserTokens(db, userId);
            // Update password
            await db
                .prepare('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
                .bind(hashedPassword, userId)
                .run();
            return {
                success: true,
                message: 'Đổi mật khẩu thành công',
            };
        }
        catch (error) {
            console.error('Change password service error:', error);
            return {
                success: false,
                message: 'Có lỗi xảy ra khi đổi mật khẩu',
            };
        }
    }
    // Token Refresh
    async refreshTokens(db, refreshToken) {
        try {
            // Verify refresh token
            const decoded = jwt.verify(refreshToken, this.refreshSecret);
            // Check if refresh token exists in database
            const tokenRecord = await db
                .prepare('SELECT user_id FROM refresh_tokens WHERE token = ? AND expires_at > datetime("now")')
                .bind(refreshToken)
                .first();
            if (!tokenRecord) {
                return {
                    success: false,
                    message: 'Token không hợp lệ',
                };
            }
            // Get user
            const userResult = await this.getUserById(db, decoded.userId);
            if (!userResult.success || !userResult.user) {
                return {
                    success: false,
                    message: 'Người dùng không tồn tại',
                };
            }
            // Generate new tokens
            const tokens = await this.generateTokens(db, userResult.user);
            // Revoke old refresh token
            await this.revokeRefreshToken(db, refreshToken);
            return {
                success: true,
                user: userResult.user,
                tokens,
            };
        }
        catch (error) {
            console.error('Refresh token error:', error);
            return {
                success: false,
                message: 'Token không hợp lệ',
            };
        }
    }
    // Verify Access Token
    async verifyAccessToken(db, token) {
        try {
            const decoded = jwt.verify(token, this.jwtSecret);
            const userResult = await this.getUserById(db, decoded.userId);
            if (!userResult.success || !userResult.user) {
                return {
                    success: false,
                    message: 'Token không hợp lệ',
                };
            }
            return {
                success: true,
                user: userResult.user,
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Token không hợp lệ',
            };
        }
    }
    // Logout (revoke refresh token)
    async logout(db, refreshToken) {
        try {
            await this.revokeRefreshToken(db, refreshToken);
            return {
                success: true,
                message: 'Đăng xuất thành công',
            };
        }
        catch (error) {
            console.error('Logout error:', error);
            return {
                success: false,
                message: 'Có lỗi xảy ra khi đăng xuất',
            };
        }
    }
    // Private Methods
    async generateTokens(db, user) {
        const payload = {
            userId: user.id,
            email: user.email,
            role: user.role
        };
        // Generate access token
        const accessToken = jwt.sign(payload, this.jwtSecret, {
            expiresIn: this.accessTokenExpiry
        });
        // Generate refresh token
        const refreshToken = jwt.sign(payload, this.refreshSecret, {
            expiresIn: this.refreshTokenExpiry
        });
        // Store refresh token in database
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now
        await db
            .prepare(`
        INSERT INTO refresh_tokens (token, user_id, expires_at, created_at)
        VALUES (?, ?, ?, datetime('now'))
      `)
            .bind(refreshToken, user.id, expiresAt.toISOString())
            .run();
        // Clean up expired tokens
        await this.cleanupExpiredTokens(db);
        return {
            accessToken,
            refreshToken,
            expiresIn: 15 * 60 // 15 minutes in seconds
        };
    }
    async updateLastLogin(db, userId) {
        const now = new Date().toISOString();
        await db
            .prepare('UPDATE users SET last_login = ? WHERE id = ?')
            .bind(now, userId)
            .run();
    }
    async revokeRefreshToken(db, token) {
        await db
            .prepare('DELETE FROM refresh_tokens WHERE token = ?')
            .bind(token)
            .run();
    }
    async revokeAllUserTokens(db, userId) {
        await db
            .prepare('DELETE FROM refresh_tokens WHERE user_id = ?')
            .bind(userId)
            .run();
    }
    async cleanupExpiredTokens(db) {
        await db
            .prepare('DELETE FROM refresh_tokens WHERE expires_at <= datetime("now")')
            .run();
    }
    // Initialize refresh tokens table
    async initializeDatabase(db) {
        await db
            .prepare(`
        CREATE TABLE IF NOT EXISTS refresh_tokens (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          token TEXT NOT NULL UNIQUE,
          user_id TEXT NOT NULL,
          expires_at DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `)
            .run();
        await db
            .prepare('CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id)')
            .run();
        await db
            .prepare('CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at)')
            .run();
    }
}
export const authService = new AuthService();
