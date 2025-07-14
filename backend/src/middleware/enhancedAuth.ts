import { Context, Next } from 'hono';
import { sign, verify } from 'hono/jwt';
import { createMiddleware } from 'hono/factory';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import type { Env } from '../index';

// Enhanced authentication interfaces
export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'manager' | 'cashier' | 'staff';
  permissions: string[];
  sessionId: string;
  lastActivity: number;
  deviceId?: string;
  ipAddress?: string;
}

export interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  permissions: string[];
  sessionId: string;
  deviceId?: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

export interface RefreshTokenPayload {
  sub: string;
  sessionId: string;
  tokenId: string;
  iat: number;
  exp: number;
}

// Session store for tracking active sessions
const activeSessions = new Map<string, {
  userId: string;
  sessionId: string;
  deviceId?: string;
  ipAddress?: string;
  lastActivity: number;
  isValid: boolean;
}>();

// Failed login attempts tracking
const failedAttempts = new Map<string, {
  count: number;
  lastAttempt: number;
  blockedUntil?: number;
}>();

// Role-based permissions
const ROLE_PERMISSIONS = {
  admin: [
    'user:create', 'user:read', 'user:update', 'user:delete',
    'product:create', 'product:read', 'product:update', 'product:delete',
    'order:create', 'order:read', 'order:update', 'order:delete',
    'payment:create', 'payment:read', 'payment:update', 'payment:delete',
    'analytics:read', 'settings:read', 'settings:update',
    'backup:create', 'backup:restore', 'system:admin'
  ],
  manager: [
    'user:read', 'user:update',
    'product:create', 'product:read', 'product:update',
    'order:create', 'order:read', 'order:update',
    'payment:read', 'analytics:read',
    'settings:read'
  ],
  cashier: [
    'product:read',
    'order:create', 'order:read', 'order:update',
    'payment:create', 'payment:read',
    'customer:create', 'customer:read', 'customer:update'
  ],
  staff: [
    'product:read',
    'order:read',
    'customer:read'
  ]
};

// Enhanced authentication middleware
export const enhancedAuth = () => {
  return createMiddleware<{ Bindings: Env }>(async (c, next) => {
    try {
      const authHeader = c.req.header('Authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({
          success: false,
          message: 'Token xác thực không hợp lệ',
          error: 'MISSING_TOKEN'
        }, 401);
      }

      const token = authHeader.substring(7);
      
      try {
        const payload = await verify(token, c.env.JWT_SECRET) as JWTPayload;
        
        // Validate token claims
        if (!payload.sub || !payload.sessionId) {
          throw new Error('Invalid token claims');
        }

        // Check if session is still valid
        const session = activeSessions.get(payload.sessionId);
        if (!session || !session.isValid || session.userId !== payload.sub) {
          throw new Error('Session expired or invalid');
        }

        // Check session timeout (24 hours of inactivity)
        const now = Date.now();
        if (now - session.lastActivity > 24 * 60 * 60 * 1000) {
          activeSessions.delete(payload.sessionId);
          throw new Error('Session expired due to inactivity');
        }

        // Verify user still exists and is active
        const user = await c.env.DB
          .prepare('SELECT id, email, role, active, last_login FROM users WHERE id = ? AND active = 1')
          .bind(payload.sub)
          .first();

        if (!user) {
          // Invalidate session
          activeSessions.delete(payload.sessionId);
          throw new Error('User not found or deactivated');
        }

        // Update session activity
        session.lastActivity = now;
        session.ipAddress = c.req.header('cf-connecting-ip') || 
                           c.req.header('x-forwarded-for') || 
                           c.req.header('x-real-ip') || 'unknown';

        // Create auth user object
        const authUser: AuthUser = {
          id: user.id as string,
          email: user.email as string,
          role: user.role as any,
          permissions: ROLE_PERMISSIONS[user.role as keyof typeof ROLE_PERMISSIONS] || [],
          sessionId: payload.sessionId,
          lastActivity: now,
          deviceId: payload.deviceId,
          ipAddress: session.ipAddress
        };

        // Add user to context
        c.set('user', authUser);
        c.set('sessionId', payload.sessionId);

        await next();
      } catch (jwtError) {
        console.error('JWT verification error:', jwtError);
        return c.json({
          success: false,
          message: 'Token không hợp lệ hoặc đã hết hạn',
          error: 'INVALID_TOKEN'
        }, 401);
      }
    } catch (error) {
      console.error('Enhanced auth middleware error:', error);
      return c.json({
        success: false,
        message: 'Lỗi xác thực người dùng',
        error: 'AUTH_ERROR'
      }, 500);
    }
  });
};

// Permission-based authorization middleware
export const requirePermission = (permission: string) => {
  return createMiddleware<{ Bindings: Env }>(async (c, next) => {
    const user = c.get('user') as AuthUser;
    
    if (!user) {
      return c.json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng',
        error: 'USER_NOT_FOUND'
      }, 401);
    }

    if (!user.permissions.includes(permission)) {
      return c.json({
        success: false,
        message: 'Không có quyền thực hiện hành động này',
        error: 'INSUFFICIENT_PERMISSIONS',
        requiredPermission: permission,
        userPermissions: user.permissions
      }, 403);
    }

    await next();
  });
};

// Role-based authorization middleware  
export const requireRole = (allowedRoles: string[]) => {
  return createMiddleware<{ Bindings: Env }>(async (c, next) => {
    const user = c.get('user') as AuthUser;
    
    if (!user || !allowedRoles.includes(user.role)) {
      return c.json({
        success: false,
        message: 'Không có quyền truy cập',
        error: 'INSUFFICIENT_ROLE',
        requiredRoles: allowedRoles,
        userRole: user?.role
      }, 403);
    }

    await next();
  });
};

// Brute force protection
export function checkBruteForce(identifier: string): {
  isBlocked: boolean;
  remainingTime?: number;
} {
  const attempt = failedAttempts.get(identifier);
  const now = Date.now();

  if (!attempt) {
    return { isBlocked: false };
  }

  // If blocked, check if block period has expired
  if (attempt.blockedUntil && now < attempt.blockedUntil) {
    return {
      isBlocked: true,
      remainingTime: Math.ceil((attempt.blockedUntil - now) / 1000)
    };
  }

  // If block period expired, reset
  if (attempt.blockedUntil && now >= attempt.blockedUntil) {
    failedAttempts.delete(identifier);
    return { isBlocked: false };
  }

  return { isBlocked: false };
}

export function recordFailedAttempt(identifier: string): void {
  const now = Date.now();
  const attempt = failedAttempts.get(identifier) || { count: 0, lastAttempt: now };

  // Reset count if last attempt was more than 15 minutes ago
  if (now - attempt.lastAttempt > 15 * 60 * 1000) {
    attempt.count = 0;
  }

  attempt.count++;
  attempt.lastAttempt = now;

  // Block after 5 failed attempts
  if (attempt.count >= 5) {
    // Progressive blocking: 5 min, 15 min, 1 hour, 24 hours
    const blockDurations = [5, 15, 60, 24 * 60];
    const blockIndex = Math.min(Math.floor(attempt.count / 5) - 1, blockDurations.length - 1);
    const blockDuration = blockDurations[blockIndex] * 60 * 1000; // Convert to milliseconds
    
    attempt.blockedUntil = now + blockDuration;
  }

  failedAttempts.set(identifier, attempt);
}

export function clearFailedAttempts(identifier: string): void {
  failedAttempts.delete(identifier);
}

// Enhanced token generation
export async function generateAuthTokens(
  user: any,
  env: Env,
  deviceId?: string,
  ipAddress?: string
): Promise<{
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  expiresIn: number;
}> {
  const sessionId = crypto.randomUUID();
  const tokenId = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  // Create access token payload
  const accessPayload: Omit<JWTPayload, 'iat' | 'exp'> = {
    sub: user.id,
    email: user.email,
    role: user.role,
    permissions: ROLE_PERMISSIONS[user.role as keyof typeof ROLE_PERMISSIONS] || [],
    sessionId,
    deviceId,
    iss: env.BASE_URL || 'kho1-api',
    aud: env.BASE_URL || 'kho1-app'
  };

  // Create refresh token payload
  const refreshPayload: Omit<RefreshTokenPayload, 'iat' | 'exp'> = {
    sub: user.id,
    sessionId,
    tokenId
  };

  // Generate tokens
  const accessToken = await sign({
    ...accessPayload,
    iat: now,
    exp: now + (15 * 60) // 15 minutes
  }, env.JWT_SECRET);

  const refreshToken = await sign({
    ...refreshPayload,
    iat: now,
    exp: now + (7 * 24 * 60 * 60) // 7 days
  }, env.REFRESH_SECRET || env.JWT_SECRET + '_refresh');

  // Store session
  activeSessions.set(sessionId, {
    userId: user.id,
    sessionId,
    deviceId,
    ipAddress,
    lastActivity: Date.now(),
    isValid: true
  });

  // Store refresh token in database
  const expiresAt = new Date((now + 7 * 24 * 60 * 60) * 1000).toISOString();
  
  await env.DB
    .prepare(`
      INSERT INTO refresh_tokens (id, token, user_id, session_id, device_id, ip_address, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `)
    .bind(tokenId, refreshToken, user.id, sessionId, deviceId || null, ipAddress || null, expiresAt)
    .run();

  return {
    accessToken,
    refreshToken,
    sessionId,
    expiresIn: 15 * 60 // 15 minutes
  };
}

// Session invalidation
export async function invalidateSession(
  db: D1Database,
  sessionId: string
): Promise<void> {
  // Remove from active sessions
  activeSessions.delete(sessionId);

  // Remove refresh tokens from database
  await db
    .prepare('DELETE FROM refresh_tokens WHERE session_id = ?')
    .bind(sessionId)
    .run();
}

// Invalidate all user sessions
export async function invalidateAllUserSessions(
  db: D1Database,
  userId: string
): Promise<void> {
  // Remove all user sessions from active sessions
  for (const [sessionId, session] of activeSessions.entries()) {
    if (session.userId === userId) {
      activeSessions.delete(sessionId);
    }
  }

  // Remove all user refresh tokens from database
  await db
    .prepare('DELETE FROM refresh_tokens WHERE user_id = ?')
    .bind(userId)
    .run();
}

// Clean up expired sessions
export async function cleanupExpiredSessions(db: D1Database): Promise<void> {
  const now = Date.now();

  // Clean up in-memory sessions
  for (const [sessionId, session] of activeSessions.entries()) {
    if (now - session.lastActivity > 24 * 60 * 60 * 1000) { // 24 hours
      activeSessions.delete(sessionId);
    }
  }

  // Clean up database refresh tokens
  await db
    .prepare('DELETE FROM refresh_tokens WHERE expires_at <= datetime("now")')
    .run();

  // Clean up failed attempts older than 24 hours
  for (const [identifier, attempt] of failedAttempts.entries()) {
    if (now - attempt.lastAttempt > 24 * 60 * 60 * 1000) {
      failedAttempts.delete(identifier);
    }
  }
}

// Periodic cleanup
setInterval(async () => {
  // This would need to be called with the database instance
  console.log('Cleaning up expired sessions...');
}, 60 * 60 * 1000); // Every hour