// Token management service
import { STORAGE_KEYS } from '../../constants/storage';
import { logger } from '../../utils/logger';

export interface TokenPayload {
  sub: string; // User ID
  email: string;
  name: string;
  role: string;
  permissions: string[];
  iat: number; // Issued at
  exp: number; // Expires at
  iss: string; // Issuer
}

export interface TokenInfo {
  payload: TokenPayload;
  isValid: boolean;
  isExpired: boolean;
  expiresIn: number; // Seconds until expiration
  expiresAt: Date;
}

class TokenService {
  /**
   * Decode JWT token
   */
  decodeToken(token: string): TokenPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }

      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded) as TokenPayload;
    } catch (error) {
      logger.error('Token decode error', { error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  }

  /**
   * Get token information
   */
  getTokenInfo(token?: string): TokenInfo | null {
    const authToken = token || this.getStoredToken();
    if (!authToken) {
      return null;
    }

    const payload = this.decodeToken(authToken);
    if (!payload) {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    const isExpired = payload.exp <= now;
    const expiresIn = Math.max(payload.exp - now, 0);
    const expiresAt = new Date(payload.exp * 1000);

    return {
      payload,
      isValid: !isExpired,
      isExpired,
      expiresIn,
      expiresAt,
    };
  }

  /**
   * Check if token is valid
   */
  isTokenValid(token?: string): boolean {
    const tokenInfo = this.getTokenInfo(token);
    return tokenInfo?.isValid || false;
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token?: string): boolean {
    const tokenInfo = this.getTokenInfo(token);
    return tokenInfo?.isExpired || true;
  }

  /**
   * Get time until token expires
   */
  getTimeUntilExpiration(token?: string): number {
    const tokenInfo = this.getTokenInfo(token);
    return tokenInfo?.expiresIn || 0;
  }

  /**
   * Get token expiration date
   */
  getExpirationDate(token?: string): Date | null {
    const tokenInfo = this.getTokenInfo(token);
    return tokenInfo?.expiresAt || null;
  }

  /**
   * Get user ID from token
   */
  getUserId(token?: string): string | null {
    const tokenInfo = this.getTokenInfo(token);
    return tokenInfo?.payload.sub || null;
  }

  /**
   * Get user email from token
   */
  getUserEmail(token?: string): string | null {
    const tokenInfo = this.getTokenInfo(token);
    return tokenInfo?.payload.email || null;
  }

  /**
   * Get user role from token
   */
  getUserRole(token?: string): string | null {
    const tokenInfo = this.getTokenInfo(token);
    return tokenInfo?.payload.role || null;
  }

  /**
   * Get user permissions from token
   */
  getUserPermissions(token?: string): string[] {
    const tokenInfo = this.getTokenInfo(token);
    return tokenInfo?.payload.permissions || [];
  }

  /**
   * Check if user has permission
   */
  hasPermission(permission: string, token?: string): boolean {
    const permissions = this.getUserPermissions(token);
    return permissions.includes(permission) || permissions.includes('*');
  }

  /**
   * Check if user has role
   */
  hasRole(role: string, token?: string): boolean {
    const userRole = this.getUserRole(token);
    return userRole === role || userRole === 'admin';
  }

  /**
   * Get stored token
   */
  getStoredToken(): string | null {
    return sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  /**
   * Get stored refresh token
   */
  getStoredRefreshToken(): string | null {
    return sessionStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  /**
   * Store token
   */
  storeToken(token: string): void {
    sessionStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    // Log token storage (security audit)
    logger.security('token.store', { 
      tokenType: 'access',
      userId: this.getUserId(token) || undefined
    });
  }

  /**
   * Store refresh token
   */
  storeRefreshToken(refreshToken: string): void {
    sessionStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    // Log refresh token storage (security audit)
    logger.security('token.store', { tokenType: 'refresh' });
  }

  /**
   * Clear stored tokens
   */
  clearTokens(): void {
    sessionStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    // Log token clearing (security audit)
    logger.security('token.clear');
  }

  /**
   * Check if token needs refresh
   */
  needsRefresh(token?: string, bufferMinutes = 5): boolean {
    const tokenInfo = this.getTokenInfo(token);
    if (!tokenInfo) {
      return true;
    }

    const bufferSeconds = bufferMinutes * 60;
    return tokenInfo.expiresIn <= bufferSeconds;
  }

  /**
   * Get token age in seconds
   */
  getTokenAge(token?: string): number {
    const tokenInfo = this.getTokenInfo(token);
    if (!tokenInfo) {
      return 0;
    }

    const now = Math.floor(Date.now() / 1000);
    return now - tokenInfo.payload.iat;
  }

  /**
   * Validate token format
   */
  isValidTokenFormat(token: string): boolean {
    if (!token || typeof token !== 'string') {
      return false;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }

    // Check if each part is valid base64
    try {
      parts.forEach(part => {
        atob(part.replace(/-/g, '+').replace(/_/g, '/'));
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get token header
   */
  getTokenHeader(token?: string): any {
    const authToken = token || this.getStoredToken();
    if (!authToken) {
      return null;
    }

    try {
      const parts = authToken.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const header = parts[0];
      const decoded = atob(header.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    } catch (error) {
      logger.error('Token header decode error', { error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  }

  /**
   * Get token algorithm
   */
  getTokenAlgorithm(token?: string): string | null {
    const header = this.getTokenHeader(token);
    return header?.alg || null;
  }

  /**
   * Get token type
   */
  getTokenType(token?: string): string | null {
    const header = this.getTokenHeader(token);
    return header?.typ || null;
  }

  /**
   * Create Authorization header value
   */
  createAuthHeader(token?: string): string | null {
    const authToken = token || this.getStoredToken();
    if (!authToken) {
      return null;
    }

    return `Bearer ${authToken}`;
  }

  /**
   * Extract token from Authorization header
   */
  extractTokenFromHeader(authHeader: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    return authHeader.substring(7);
  }

  /**
   * Compare two tokens for equality
   */
  areTokensEqual(token1: string, token2: string): boolean {
    return token1 === token2;
  }

  /**
   * Get token summary
   */
  getTokenSummary(token?: string): {
    isValid: boolean;
    userId: string | null;
    email: string | null;
    role: string | null;
    expiresAt: Date | null;
    expiresIn: number;
    algorithm: string | null;
  } {
    const tokenInfo = this.getTokenInfo(token);
    
    return {
      isValid: tokenInfo?.isValid || false,
      userId: tokenInfo?.payload.sub || null,
      email: tokenInfo?.payload.email || null,
      role: tokenInfo?.payload.role || null,
      expiresAt: tokenInfo?.expiresAt || null,
      expiresIn: tokenInfo?.expiresIn || 0,
      algorithm: this.getTokenAlgorithm(token),
    };
  }
}

// Export singleton instance
export const tokenService = new TokenService();
