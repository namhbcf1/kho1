/**
 * Secure Authentication Service - Fixes JWT vulnerabilities
 * Implements production-grade security with proper token management
 */
import { sign, verify } from '@cloudflare/itty-jwt';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
// Validation schemas
const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    deviceInfo: z.string().optional(),
    rememberMe: z.boolean().default(false)
});
const RefreshTokenSchema = z.object({
    refreshToken: z.string(),
    csrfToken: z.string(),
    deviceInfo: z.string().optional()
});
export class SecureAuthService {
    db;
    kv;
    jwtSecret;
    ACCESS_TOKEN_EXPIRY = 24 * 60 * 60; // 24 hours
    REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days
    CSRF_TOKEN_EXPIRY = 60 * 60; // 1 hour
    MAX_LOGIN_ATTEMPTS = 5;
    LOCKOUT_DURATION = 15 * 60; // 15 minutes
    constructor(db, kv, jwtSecret) {
        this.db = db;
        this.kv = kv;
        this.jwtSecret = jwtSecret;
    }
    /**
     * Secure login with brute force protection
     */
    async login(credentials, ipAddress, userAgent) {
        try {
            const validated = LoginSchema.parse(credentials);
            // Check for brute force attacks
            const bruteForceCheck = await this.checkBruteForce(validated.email, ipAddress);
            if (bruteForceCheck.blocked) {
                await this.logSecurityEvent({
                    action: 'LOGIN_BLOCKED_BRUTE_FORCE',
                    ipAddress,
                    userAgent,
                    timestamp: new Date().toISOString(),
                    success: false,
                    details: { email: validated.email, attemptsCount: bruteForceCheck.attempts },
                    riskLevel: 'critical'
                });
                return {
                    error: 'Too many failed login attempts. Account temporarily locked.',
                    blocked: true
                };
            }
            // Fetch user securely
            const user = await this.db.prepare(`
        SELECT id, email, password_hash, role, is_active, 
               failed_login_attempts, locked_until
        FROM users 
        WHERE email = ? AND is_active = 1
      `).bind(validated.email).first();
            if (!user) {
                await this.recordFailedAttempt(validated.email, ipAddress);
                await this.logSecurityEvent({
                    action: 'LOGIN_FAILED_USER_NOT_FOUND',
                    ipAddress,
                    userAgent,
                    timestamp: new Date().toISOString(),
                    success: false,
                    details: { email: validated.email },
                    riskLevel: 'medium'
                });
                return { error: 'Invalid credentials' };
            }
            // Check if account is locked
            if (user.locked_until && new Date(user.locked_until) > new Date()) {
                await this.logSecurityEvent({
                    userId: user.id,
                    action: 'LOGIN_FAILED_ACCOUNT_LOCKED',
                    ipAddress,
                    userAgent,
                    timestamp: new Date().toISOString(),
                    success: false,
                    details: { lockedUntil: user.locked_until },
                    riskLevel: 'high'
                });
                return { error: 'Account is temporarily locked' };
            }
            // Verify password
            const passwordValid = await bcrypt.compare(validated.password, user.password_hash);
            if (!passwordValid) {
                await this.recordFailedAttempt(validated.email, ipAddress);
                await this.logSecurityEvent({
                    userId: user.id,
                    action: 'LOGIN_FAILED_INVALID_PASSWORD',
                    ipAddress,
                    userAgent,
                    timestamp: new Date().toISOString(),
                    success: false,
                    riskLevel: 'medium'
                });
                return { error: 'Invalid credentials' };
            }
            // Reset failed attempts on successful login
            await this.resetFailedAttempts(user.id);
            // Generate secure tokens
            const tokens = await this.generateSecureTokens(user, validated.deviceInfo || userAgent, ipAddress);
            // Create session
            const session = await this.createUserSession(user, tokens.refreshToken, validated.deviceInfo || userAgent, ipAddress);
            await this.logSecurityEvent({
                userId: user.id,
                action: 'LOGIN_SUCCESS',
                ipAddress,
                userAgent,
                timestamp: new Date().toISOString(),
                success: true,
                details: { sessionId: session.sessionId },
                riskLevel: 'low'
            });
            return { tokens, user: session };
        }
        catch (error) {
            console.error('Login error:', error);
            return { error: 'Login failed due to server error' };
        }
    }
    /**
     * Secure token refresh with rotation
     */
    async refreshTokens(params, ipAddress, userAgent) {
        try {
            const validated = RefreshTokenSchema.parse(params);
            // Verify refresh token
            const session = await this.db.prepare(`
        SELECT s.*, u.email, u.role, u.is_active
        FROM user_sessions s
        JOIN users u ON u.id = s.user_id
        WHERE s.refresh_token = ? AND s.is_active = 1 AND s.expires_at > CURRENT_TIMESTAMP
      `).bind(validated.refreshToken).first();
            if (!session) {
                await this.logSecurityEvent({
                    action: 'REFRESH_FAILED_INVALID_TOKEN',
                    ipAddress,
                    userAgent,
                    timestamp: new Date().toISOString(),
                    success: false,
                    riskLevel: 'high'
                });
                return { error: 'Invalid refresh token' };
            }
            // Verify CSRF token
            const csrfValid = await this.verifyCsrfToken(validated.csrfToken, session.user_id);
            if (!csrfValid) {
                await this.logSecurityEvent({
                    userId: session.user_id,
                    action: 'REFRESH_FAILED_INVALID_CSRF',
                    ipAddress,
                    userAgent,
                    timestamp: new Date().toISOString(),
                    success: false,
                    riskLevel: 'high'
                });
                return { error: 'CSRF token validation failed' };
            }
            // Check IP consistency (optional - can be relaxed for mobile users)
            if (session.ip_address !== ipAddress) {
                await this.logSecurityEvent({
                    userId: session.user_id,
                    action: 'REFRESH_IP_MISMATCH',
                    ipAddress,
                    userAgent,
                    timestamp: new Date().toISOString(),
                    success: false,
                    details: {
                        originalIp: session.ip_address,
                        currentIp: ipAddress
                    },
                    riskLevel: 'medium'
                });
                // Don't fail here - just log for monitoring
            }
            // Invalidate old tokens
            await this.invalidateSession(session.id);
            // Generate new tokens
            const user = {
                id: session.user_id,
                email: session.email,
                role: session.role
            };
            const tokens = await this.generateSecureTokens(user, validated.deviceInfo || userAgent, ipAddress);
            // Create new session
            await this.createUserSession(user, tokens.refreshToken, validated.deviceInfo || userAgent, ipAddress);
            await this.logSecurityEvent({
                userId: session.user_id,
                action: 'REFRESH_SUCCESS',
                ipAddress,
                userAgent,
                timestamp: new Date().toISOString(),
                success: true,
                riskLevel: 'low'
            });
            return { tokens };
        }
        catch (error) {
            console.error('Token refresh error:', error);
            return { error: 'Token refresh failed' };
        }
    }
    /**
     * Generate secure tokens with proper expiry
     */
    async generateSecureTokens(user, deviceInfo, ipAddress) {
        const now = Math.floor(Date.now() / 1000);
        const sessionId = this.generateSecureId();
        // Access token payload
        const accessPayload = {
            sub: user.id.toString(),
            email: user.email,
            role: user.role,
            sid: sessionId,
            iat: now,
            exp: now + this.ACCESS_TOKEN_EXPIRY,
            type: 'access'
        };
        // Refresh token payload
        const refreshPayload = {
            sub: user.id.toString(),
            sid: sessionId,
            iat: now,
            exp: now + this.REFRESH_TOKEN_EXPIRY,
            type: 'refresh'
        };
        const accessToken = await sign(accessPayload, this.jwtSecret);
        const refreshToken = await sign(refreshPayload, this.jwtSecret);
        const csrfToken = await this.generateCsrfToken(user.id);
        return {
            accessToken,
            refreshToken,
            csrfToken,
            expiresAt: (now + this.ACCESS_TOKEN_EXPIRY) * 1000,
            refreshExpiresAt: (now + this.REFRESH_TOKEN_EXPIRY) * 1000
        };
    }
    /**
     * Create user session in database
     */
    async createUserSession(user, refreshToken, deviceInfo, ipAddress) {
        const sessionId = this.generateSecureId();
        const now = new Date().toISOString();
        const expiresAt = new Date(Date.now() + this.REFRESH_TOKEN_EXPIRY * 1000).toISOString();
        await this.db.prepare(`
      INSERT INTO user_sessions (
        id, user_id, refresh_token, device_info, ip_address,
        created_at, last_activity, expires_at, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).bind(sessionId, user.id, refreshToken, deviceInfo, ipAddress, now, now, expiresAt).run();
        return {
            userId: user.id,
            email: user.email,
            role: user.role,
            sessionId,
            deviceInfo,
            ipAddress,
            lastActivity: now,
            isActive: true
        };
    }
    /**
     * Generate CSRF token
     */
    async generateCsrfToken(userId) {
        const token = this.generateSecureId();
        const expiresAt = Math.floor(Date.now() / 1000) + this.CSRF_TOKEN_EXPIRY;
        await this.kv.put(`csrf:${userId}:${token}`, expiresAt.toString(), { expirationTtl: this.CSRF_TOKEN_EXPIRY });
        return token;
    }
    /**
     * Verify CSRF token
     */
    async verifyCsrfToken(token, userId) {
        const stored = await this.kv.get(`csrf:${userId}:${token}`);
        if (!stored)
            return false;
        const expiresAt = parseInt(stored);
        return Date.now() / 1000 < expiresAt;
    }
    /**
     * Check for brute force attacks
     */
    async checkBruteForce(email, ipAddress) {
        const emailKey = `brute_force:email:${email}`;
        const ipKey = `brute_force:ip:${ipAddress}`;
        const [emailAttempts, ipAttempts] = await Promise.all([
            this.kv.get(emailKey),
            this.kv.get(ipKey)
        ]);
        const emailCount = emailAttempts ? parseInt(emailAttempts) : 0;
        const ipCount = ipAttempts ? parseInt(ipAttempts) : 0;
        const blocked = emailCount >= this.MAX_LOGIN_ATTEMPTS || ipCount >= this.MAX_LOGIN_ATTEMPTS * 2;
        return { blocked, attempts: Math.max(emailCount, ipCount) };
    }
    /**
     * Record failed login attempt
     */
    async recordFailedAttempt(email, ipAddress) {
        const emailKey = `brute_force:email:${email}`;
        const ipKey = `brute_force:ip:${ipAddress}`;
        const [emailAttempts, ipAttempts] = await Promise.all([
            this.kv.get(emailKey),
            this.kv.get(ipKey)
        ]);
        const newEmailCount = (emailAttempts ? parseInt(emailAttempts) : 0) + 1;
        const newIpCount = (ipAttempts ? parseInt(ipAttempts) : 0) + 1;
        await Promise.all([
            this.kv.put(emailKey, newEmailCount.toString(), { expirationTtl: this.LOCKOUT_DURATION }),
            this.kv.put(ipKey, newIpCount.toString(), { expirationTtl: this.LOCKOUT_DURATION })
        ]);
        // Update database failed attempts
        await this.db.prepare(`
      UPDATE users 
      SET failed_login_attempts = failed_login_attempts + 1,
          locked_until = CASE 
            WHEN failed_login_attempts + 1 >= ? 
            THEN datetime('now', '+15 minutes')
            ELSE locked_until
          END
      WHERE email = ?
    `).bind(this.MAX_LOGIN_ATTEMPTS, email).run();
    }
    /**
     * Reset failed login attempts
     */
    async resetFailedAttempts(userId) {
        await this.db.prepare(`
      UPDATE users 
      SET failed_login_attempts = 0, locked_until = NULL
      WHERE id = ?
    `).bind(userId).run();
    }
    /**
     * Log security events
     */
    async logSecurityEvent(event) {
        await this.db.prepare(`
      INSERT INTO security_audit_log (
        user_id, action, ip_address, user_agent, timestamp,
        success, details, risk_level
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(event.userId || null, event.action, event.ipAddress, event.userAgent, event.timestamp, event.success ? 1 : 0, JSON.stringify(event.details || {}), event.riskLevel).run();
    }
    /**
     * Invalidate session
     */
    async invalidateSession(sessionId) {
        await this.db.prepare(`
      UPDATE user_sessions 
      SET is_active = 0, invalidated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(sessionId).run();
    }
    /**
     * Generate cryptographically secure ID
     */
    generateSecureId() {
        const bytes = new Uint8Array(32);
        crypto.getRandomValues(bytes);
        return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    }
    /**
     * Verify JWT token
     */
    async verifyToken(token) {
        try {
            const payload = await verify(token, this.jwtSecret);
            // Additional security checks
            if (payload.type !== 'access') {
                return null;
            }
            // Check if session is still active
            const session = await this.db.prepare(`
        SELECT id FROM user_sessions 
        WHERE id = ? AND is_active = 1 AND expires_at > CURRENT_TIMESTAMP
      `).bind(payload.sid).first();
            if (!session) {
                return null;
            }
            return payload;
        }
        catch {
            return null;
        }
    }
    /**
     * Logout and cleanup session
     */
    async logout(sessionId, userId, ipAddress, userAgent) {
        await this.invalidateSession(sessionId);
        await this.logSecurityEvent({
            userId,
            action: 'LOGOUT',
            ipAddress,
            userAgent,
            timestamp: new Date().toISOString(),
            success: true,
            details: { sessionId },
            riskLevel: 'low'
        });
    }
}
