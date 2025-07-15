// JWT Authentication service with robust error handling
import { storageAdapter } from '../../utils/storage/storageAdapter';
import { secureStorageAdapter } from '../../utils/storage/secureStorageAdapter';
import { csrfProtection } from '../../utils/security/csrfProtection';

// Fallback constants if imports fail
const DEFAULT_STORAGE_KEYS = {
  AUTH_TOKEN: 'khoaugment_auth_token',
  REFRESH_TOKEN: 'khoaugment_refresh_token',
  USER_DATA: 'khoaugment_user_data',
} as const;

// API endpoints fallback
const DEFAULT_API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register', 
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/change-password',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
} as const;

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'cashier' | 'staff';
  permissions: string[];
  avatar?: string;
  phone?: string;
  position?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenResponse {
  token: string;
  expiresIn: number;
}

// Simple API client with error handling
const createApiClient = () => {
  const API_BASE_URL = 'https://kho1-api-production.bangachieu2.workers.dev';
  
  const request = async <T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> => {
    try {
      const token = secureStorageAdapter.getToken();
      let headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // Add CSRF protection for state-changing requests
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method?.toUpperCase() || 'GET')) {
        headers = await csrfProtection.addTokenToHeaders(headers);
      }

      const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
      
      const response = await fetch(fullUrl, {
        ...options,
        headers,
        credentials: 'include', // Include cookies for CSRF token
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Network error' }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${url}:`, error);
      throw error;
    }
  };

  return {
    get: <T>(url: string) => request<T>(url, { method: 'GET' }),
    post: <T>(url: string, data?: any) => request<T>(url, { 
      method: 'POST', 
      body: data ? JSON.stringify(data) : undefined 
    }),
    put: <T>(url: string, data?: any) => request<T>(url, { 
      method: 'PUT', 
      body: data ? JSON.stringify(data) : undefined 
    }),
    delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
  };
};

const apiClient = createApiClient();

export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  position?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
  confirmPassword: string;
}

class AuthService {
  private currentUser: User | null = null;
  private refreshTimer: number | null = null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;
  /**
   * Initialize auth service
   */
  async initialize(): Promise<User | null> {
    if (this.initialized) {
      return this.currentUser;
    }

    if (this.initPromise) {
      await this.initPromise;
      return this.currentUser;
    }

    this.initPromise = this._performInitialization();
    await this.initPromise;
    return this.currentUser;
  }

  private async _performInitialization(): Promise<void> {
    try {
      // Initialize CSRF protection
      await csrfProtection.initialize();
      
      const token = secureStorageAdapter.getToken();
      if (!token) {
        this.initialized = true;
        return;
      }

      // Try to get current user from storage first, then API
      const user = await this.getCurrentUser();
      if (user) {
        this.setupTokenRefresh(3600); // Default 1 hour for real tokens
      } else {
        this.clearAuthData();
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      // Don't clear auth data on initialization errors, user might be offline
      // this.clearAuthData();
    } finally {
      this.initialized = true;
    }
  }


  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<User> {
    const response = await apiClient.post<LoginResponse>(
      DEFAULT_API_ENDPOINTS.AUTH.LOGIN,
      credentials
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Đăng nhập thất bại');
    }

    const { user, token, refreshToken, expiresIn } = response.data;

    // Store tokens securely
    secureStorageAdapter.setToken(token, expiresIn);
    if (refreshToken) {
      secureStorageAdapter.setRefreshToken(refreshToken);
    }

    // Store user data
    storageAdapter.setItem(DEFAULT_STORAGE_KEYS.USER_DATA, JSON.stringify(user));

    // Set current user
    this.currentUser = user;

    // Setup token refresh
    this.setupTokenRefresh(expiresIn);

    return user;
  }

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<User> {
    try {
      const response = await apiClient.post<LoginResponse>(
        DEFAULT_API_ENDPOINTS.AUTH.REGISTER,
        data
      );

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Registration failed');
      }

      const { user, token, refreshToken, expiresIn } = response.data;

      // Store tokens and user data securely
      secureStorageAdapter.setToken(token, expiresIn);
      if (refreshToken) {
        secureStorageAdapter.setRefreshToken(refreshToken);
      }
      storageAdapter.setItem(DEFAULT_STORAGE_KEYS.USER_DATA, JSON.stringify(user));

      this.currentUser = user;
      this.setupTokenRefresh(expiresIn);

      return user;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      // Call logout endpoint
      await apiClient.post(DEFAULT_API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      console.error('Logout API error:', error);
      // Continue with local logout even if API fails
    } finally {
      // Clear local data
      this.clearAuthData();
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<string | null> {
    try {
      const refreshToken = secureStorageAdapter.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiClient.post<RefreshTokenResponse>(
        DEFAULT_API_ENDPOINTS.AUTH.REFRESH,
        { refreshToken }
      );

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Token refresh failed');
      }

      const { token, expiresIn } = response.data;

      // Update stored token securely
      secureStorageAdapter.setToken(token, expiresIn);

      // Setup next refresh
      this.setupTokenRefresh(expiresIn);

      return token;
    } catch (error) {
      console.error('Token refresh error:', error);
      // If refresh fails, logout user
      this.clearAuthData();
      return null;
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User | null> {
    if (this.currentUser) {
      return this.currentUser;
    }

    // Try to get from storage first
    try {
      const storedUserJson = storageAdapter.getItem(DEFAULT_STORAGE_KEYS.USER_DATA);
      if (storedUserJson) {
        const storedUser = JSON.parse(storedUserJson);
        this.currentUser = storedUser;
        return storedUser;
      }
    } catch (error) {
      console.error('Error parsing stored user:', error);
    }

    // Try to fetch from API
    try {
      const response = await apiClient.get<User>(
        DEFAULT_API_ENDPOINTS.AUTH.ME
      );

      if (response.success && response.data) {
        this.currentUser = response.data;
        storageAdapter.setItem(DEFAULT_STORAGE_KEYS.USER_DATA, JSON.stringify(response.data));
        return response.data;
      }
    } catch (error) {
      console.error('Get current user error:', error);
    }

    return null;
  }

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    try {
      const response = await apiClient.put<User>(
        DEFAULT_API_ENDPOINTS.AUTH.PROFILE,
        data
      );

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Profile update failed');
      }

      // Update stored user data
      this.currentUser = response.data;
      storageAdapter.setItem(DEFAULT_STORAGE_KEYS.USER_DATA, JSON.stringify(response.data));

      return response.data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  /**
   * Change password
   */
  async changePassword(data: ChangePasswordData): Promise<void> {
    try {
      const response = await apiClient.post<ApiResponse>(
        DEFAULT_API_ENDPOINTS.AUTH.CHANGE_PASSWORD,
        data
      );

      if (!response.success) {
        throw new Error(response.message || 'Password change failed');
      }
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  /**
   * Forgot password
   */
  async forgotPassword(data: ForgotPasswordData): Promise<void> {
    try {
      const response = await apiClient.post<ApiResponse>(
        DEFAULT_API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
        data
      );

      if (!response.success) {
        throw new Error(response.message || 'Forgot password request failed');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  }

  /**
   * Reset password
   */
  async resetPassword(data: ResetPasswordData): Promise<void> {
    try {
      const response = await apiClient.post<ApiResponse>(
        DEFAULT_API_ENDPOINTS.AUTH.RESET_PASSWORD,
        data
      );

      if (!response.success) {
        throw new Error(response.message || 'Password reset failed');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = secureStorageAdapter.getToken();
    return !!token;
  }

  /**
   * Check if user has permission
   */
  hasPermission(permission: string): boolean {
    if (!this.currentUser) {
      return false;
    }

    return this.currentUser.permissions.includes(permission) ||
           this.currentUser.permissions.includes('*');
  }

  /**
   * Check if user has role
   */
  hasRole(role: string): boolean {
    if (!this.currentUser) {
      return false;
    }

    return this.currentUser.role === role || this.currentUser.role === 'admin';
  }

  /**
   * Get user permissions
   */
  getPermissions(): string[] {
    return this.currentUser?.permissions || [];
  }

  /**
   * Get user role
   */
  getRole(): string | null {
    return this.currentUser?.role || null;
  }


  // Private methods
  private setupTokenRefresh(expiresIn: number): void {
    // Clear existing timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    // Set refresh timer for 5 minutes before expiration
    const refreshTime = Math.max((expiresIn - 300) * 1000, 60000); // At least 1 minute

    this.refreshTimer = setTimeout(() => {
      this.refreshToken();
    }, refreshTime);
  }

  private clearAuthData(): void {
    // Clear tokens securely
    secureStorageAdapter.clear();
    storageAdapter.removeItem(DEFAULT_STORAGE_KEYS.USER_DATA);

    // Clear CSRF token
    csrfProtection.clearToken();

    // Clear current user
    this.currentUser = null;

    // Clear refresh timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    // Don't automatically redirect - let the auth context handle it
  }
}

// Create and export singleton instance
export const authService = new AuthService();

// Export class for custom instances
export { AuthService };
