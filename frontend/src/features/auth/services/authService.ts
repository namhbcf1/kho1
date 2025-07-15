// Cloudflare Workers API calls for authentication
const API_BASE = '/api/auth';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
  phone?: string;
  position?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: User;
  token?: string;
  refreshToken?: string;
}

class AuthService {
  private initialized = false;
  private refreshTokenTimeout: NodeJS.Timeout | null = null;
  async login(credentials: LoginCredentials): Promise<User> {
    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
        credentials: 'include', // Include cookies for refresh token
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Đăng nhập thất bại');
      }

      const data: AuthResponse = await response.json();
      
      if (!data.success || !data.token || !data.user) {
        throw new Error(data.message || 'Dữ liệu đăng nhập không hợp lệ');
      }

      // Store tokens securely
      this.setTokens(data.token, data.refreshToken);
      
      if (credentials.remember) {
        localStorage.setItem('remember_login', 'true');
      }

      // Set up automatic token refresh
      this.setupTokenRefresh();

      return data.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error instanceof Error ? error : new Error('Có lỗi xảy ra khi đăng nhập');
    }
  }

  async logout(): Promise<void> {
    try {
      const token = this.getAuthToken();
      
      if (token) {
        await fetch(`${API_BASE}/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuth();
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const token = this.getAuthToken();
      
      if (!token) {
        return null;
      }

      const response = await fetch(`${API_BASE}/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Try to refresh token
          const refreshed = await this.refreshToken();
          if (refreshed) {
            return this.getCurrentUser(); // Retry with new token
          }
        }
        throw new Error('Failed to get user info');
      }

      const data: AuthResponse = await response.json();
      
      if (!data.success || !data.user) {
        throw new Error(data.message || 'Invalid user data');
      }

      return data.user;
    } catch (error) {
      console.error('Get current user error:', error);
      this.clearAuth();
      return null;
    }
  }

  async updateProfile(data: any): Promise<AuthResponse> {
    try {
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        return { success: false, message: 'Unauthorized' };
      }

      const response = await fetch(`${API_BASE}/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      return await response.json();
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        message: 'Có lỗi xảy ra khi cập nhật thông tin',
      };
    }
  }

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<AuthResponse> {
    try {
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        return { success: false, message: 'Unauthorized' };
      }

      const response = await fetch(`${API_BASE}/change-password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      return await response.json();
    } catch (error) {
      console.error('Change password error:', error);
      return {
        success: false,
        message: 'Có lỗi xảy ra khi đổi mật khẩu',
      };
    }
  }

  async initialize(): Promise<User | null> {
    if (this.initialized) {
      return this.getCurrentUser();
    }

    try {
      const token = this.getAuthToken();
      if (!token) {
        this.initialized = true;
        return null;
      }

      const user = await this.getCurrentUser();
      if (user) {
        this.setupTokenRefresh();
      }
      
      this.initialized = true;
      return user;
    } catch (error) {
      console.error('Auth initialization error:', error);
      this.clearAuth();
      this.initialized = true;
      return null;
    }
  }

  private async refreshToken(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return false;
      }

      const data: AuthResponse = await response.json();
      
      if (data.success && data.token) {
        this.setTokens(data.token, data.refreshToken);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }

  private setupTokenRefresh(): void {
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
    }

    // Refresh token every 50 minutes (before 1-hour expiry)
    this.refreshTokenTimeout = setTimeout(() => {
      this.refreshToken().then(success => {
        if (success) {
          this.setupTokenRefresh(); // Setup next refresh
        } else {
          this.clearAuth(); // Force logout if refresh fails
        }
      });
    }, 50 * 60 * 1000);
  }

  private setTokens(token: string, refreshToken?: string): void {
    localStorage.setItem('auth_token', token);
    if (refreshToken) {
      // Refresh token is stored in httpOnly cookie by backend
      // We don't store it in localStorage for security
    }
  }

  private clearAuth(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('remember_login');
    
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
      this.refreshTokenTimeout = null;
    }
  }

  getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  isAuthenticated(): boolean {
    const token = this.getAuthToken();
    return !!token;
  }

  isRememberLogin(): boolean {
    return localStorage.getItem('remember_login') === 'true';
  }

  // Enhanced error handling with retry logic
  private async makeAuthenticatedRequest<T>(
    url: string,
    options: RequestInit = {},
    retries = 1
  ): Promise<T> {
    const token = this.getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token');
    }

    const requestOptions: RequestInit = {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    };

    try {
      const response = await fetch(url, requestOptions);
      
      if (response.status === 401 && retries > 0) {
        // Try to refresh token and retry
        const refreshed = await this.refreshToken();
        if (refreshed) {
          return this.makeAuthenticatedRequest<T>(url, options, retries - 1);
        }
        throw new Error('Authentication failed');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error && error.message.includes('fetch')) {
        throw new Error('Không thể kết nối đến máy chủ');
      }
      throw error;
    }
  }
}

export const authService = new AuthService();
