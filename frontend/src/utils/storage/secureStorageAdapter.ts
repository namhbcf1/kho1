// Secure storage adapter for sensitive data like JWT tokens
export interface SecureStorageInterface {
  getToken(): string | null;
  setToken(token: string, expiresIn?: number): void;
  removeToken(): void;
  getRefreshToken(): string | null;
  setRefreshToken(token: string): void;
  removeRefreshToken(): void;
  clear(): void;
}

class CookieSecureStorage implements SecureStorageInterface {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';

  private setCookie(name: string, value: string, options: {
    expires?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    path?: string;
  } = {}): void {
    const defaults = {
      httpOnly: true,
      secure: window.location.protocol === 'https:',
      sameSite: 'strict' as const,
      path: '/',
    };
    
    const finalOptions = { ...defaults, ...options };
    
    let cookieString = `${name}=${encodeURIComponent(value)}`;
    
    if (finalOptions.expires) {
      const expiresDate = new Date(Date.now() + finalOptions.expires * 1000);
      cookieString += `; expires=${expiresDate.toUTCString()}`;
    }
    
    if (finalOptions.httpOnly) {
      cookieString += '; HttpOnly';
    }
    
    if (finalOptions.secure) {
      cookieString += '; Secure';
    }
    
    cookieString += `; SameSite=${finalOptions.sameSite}`;
    cookieString += `; Path=${finalOptions.path}`;
    
    // Note: HttpOnly cookies cannot be set from JavaScript
    // This would need to be handled by the backend
    console.warn('HttpOnly cookies must be set by backend for security');
  }

  private getCookie(name: string): string | null {
    // Note: HttpOnly cookies cannot be read from JavaScript
    // This is intentional for security
    return null;
  }

  private deleteCookie(name: string): void {
    // Note: HttpOnly cookies cannot be deleted from JavaScript
    // This would need to be handled by the backend
    console.warn('HttpOnly cookies must be deleted by backend');
  }

  getToken(): string | null {
    return this.getCookie(this.TOKEN_KEY);
  }

  setToken(token: string, expiresIn = 3600): void {
    this.setCookie(this.TOKEN_KEY, token, { expires: expiresIn });
  }

  removeToken(): void {
    this.deleteCookie(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return this.getCookie(this.REFRESH_TOKEN_KEY);
  }

  setRefreshToken(token: string): void {
    // Refresh tokens typically have longer expiration
    this.setCookie(this.REFRESH_TOKEN_KEY, token, { expires: 7 * 24 * 3600 }); // 7 days
  }

  removeRefreshToken(): void {
    this.deleteCookie(this.REFRESH_TOKEN_KEY);
  }

  clear(): void {
    this.removeToken();
    this.removeRefreshToken();
  }
}

// Fallback to sessionStorage for tokens (less secure but functional)
class SessionStorageSecure implements SecureStorageInterface {
  private readonly TOKEN_KEY = 'khoaugment_secure_token';
  private readonly REFRESH_TOKEN_KEY = 'khoaugment_secure_refresh_token';

  getToken(): string | null {
    try {
      return sessionStorage.getItem(this.TOKEN_KEY);
    } catch {
      return null;
    }
  }

  setToken(token: string, expiresIn?: number): void {
    try {
      sessionStorage.setItem(this.TOKEN_KEY, token);
      if (expiresIn) {
        const expiresAt = Date.now() + expiresIn * 1000;
        sessionStorage.setItem(`${this.TOKEN_KEY}_expires`, expiresAt.toString());
      }
    } catch (error) {
      console.error('Failed to store token in sessionStorage:', error);
    }
  }

  removeToken(): void {
    try {
      sessionStorage.removeItem(this.TOKEN_KEY);
      sessionStorage.removeItem(`${this.TOKEN_KEY}_expires`);
    } catch (error) {
      console.error('Failed to remove token from sessionStorage:', error);
    }
  }

  getRefreshToken(): string | null {
    try {
      return sessionStorage.getItem(this.REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  setRefreshToken(token: string): void {
    try {
      sessionStorage.setItem(this.REFRESH_TOKEN_KEY, token);
    } catch (error) {
      console.error('Failed to store refresh token in sessionStorage:', error);
    }
  }

  removeRefreshToken(): void {
    try {
      sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to remove refresh token from sessionStorage:', error);
    }
  }

  clear(): void {
    this.removeToken();
    this.removeRefreshToken();
  }
}

// In-memory storage for maximum security (lost on page refresh)
class MemorySecureStorage implements SecureStorageInterface {
  private token: string | null = null;
  private refreshToken: string | null = null;

  getToken(): string | null {
    return this.token;
  }

  setToken(token: string, expiresIn?: number): void {
    this.token = token;
    if (expiresIn) {
      setTimeout(() => {
        this.token = null;
      }, expiresIn * 1000);
    }
  }

  removeToken(): void {
    this.token = null;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  setRefreshToken(token: string): void {
    this.refreshToken = token;
  }

  removeRefreshToken(): void {
    this.refreshToken = null;
  }

  clear(): void {
    this.token = null;
    this.refreshToken = null;
  }
}

function createSecureStorageAdapter(): SecureStorageInterface {
  // For production, we recommend using HttpOnly cookies (handled by backend)
  // For now, use sessionStorage as it's more secure than localStorage
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const testKey = '__secure_storage_test__';
      sessionStorage.setItem(testKey, 'test');
      sessionStorage.removeItem(testKey);
      return new SessionStorageSecure();
    } catch {
      console.warn('SessionStorage not available, using memory storage');
      return new MemorySecureStorage();
    }
  }

  return new MemorySecureStorage();
}

export const secureStorageAdapter = createSecureStorageAdapter();
export { CookieSecureStorage, SessionStorageSecure, MemorySecureStorage };