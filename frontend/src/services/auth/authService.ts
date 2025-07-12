// JWT Authentication service
import { apiClient } from '../api/client';
import { API_ENDPOINTS } from '../api/endpoints';
import { localStorage } from '../storage/localStorage';
import { STORAGE_KEYS } from '../../constants/storage';
import type { ApiResponse, LoginResponse, RefreshTokenResponse, User } from '../api/types';

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
  private refreshTimer: NodeJS.Timeout | null = null;

  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<User> {
    try {
      const response = await apiClient.post<LoginResponse>(
        API_ENDPOINTS.AUTH.LOGIN,
        credentials
      );

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Login failed');
      }

      const { user, token, refreshToken, expiresIn } = response.data;

      // Store tokens
      localStorage.setAuthToken(token);
      if (refreshToken) {
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken, { encrypt: true });
      }

      // Store user data
      localStorage.setItem(STORAGE_KEYS.USER_DATA, user);

      // Set current user
      this.currentUser = user;

      // Setup token refresh
      this.setupTokenRefresh(expiresIn);

      return user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<User> {
    try {
      const response = await apiClient.post<LoginResponse>(
        API_ENDPOINTS.AUTH.REGISTER,
        data
      );

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Registration failed');
      }

      const { user, token, refreshToken, expiresIn } = response.data;

      // Store tokens and user data
      localStorage.setAuthToken(token);
      if (refreshToken) {
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken, { encrypt: true });
      }
      localStorage.setItem(STORAGE_KEYS.USER_DATA, user);

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
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
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
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiClient.post<RefreshTokenResponse>(
        API_ENDPOINTS.AUTH.REFRESH,
        { refreshToken }
      );

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Token refresh failed');
      }

      const { token, expiresIn } = response.data;

      // Update stored token
      localStorage.setAuthToken(token);

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

    // Try to get from storage
    const storedUser = localStorage.getItem<User>(STORAGE_KEYS.USER_DATA);
    if (storedUser) {
      this.currentUser = storedUser;
      return storedUser;
    }

    // Try to fetch from API
    try {
      const response = await apiClient.get<ApiResponse<User>>(
        API_ENDPOINTS.AUTH.ME
      );

      if (response.success && response.data) {
        this.currentUser = response.data;
        localStorage.setItem(STORAGE_KEYS.USER_DATA, response.data);
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
      const response = await apiClient.put<ApiResponse<User>>(
        API_ENDPOINTS.AUTH.PROFILE,
        data
      );

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Profile update failed');
      }

      // Update stored user data
      this.currentUser = response.data;
      localStorage.setItem(STORAGE_KEYS.USER_DATA, response.data);

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
        API_ENDPOINTS.AUTH.CHANGE_PASSWORD,
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
        API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
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
        API_ENDPOINTS.AUTH.RESET_PASSWORD,
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
    const token = localStorage.getAuthToken();
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

  /**
   * Initialize auth service
   */
  async initialize(): Promise<User | null> {
    const token = localStorage.getAuthToken();
    if (!token) {
      return null;
    }

    try {
      const user = await this.getCurrentUser();
      if (user) {
        // Setup token refresh for existing session
        this.setupTokenRefresh(3600); // Default 1 hour
      }
      return user;
    } catch (error) {
      console.error('Auth initialization error:', error);
      this.clearAuthData();
      return null;
    }
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
    // Clear tokens
    localStorage.removeAuthToken();
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);

    // Clear current user
    this.currentUser = null;

    // Clear refresh timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    // Redirect to login if not already there
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }
}

// Create and export singleton instance
export const authService = new AuthService();

// Export class for custom instances
export { AuthService };
