import axios, { AxiosError } from 'axios';
import { API_BASE_URL } from '../../constants/api';
import type { AuthResponse, LoginCredentials, RefreshTokenResponse, User } from '../../types';

export interface AuthResult {
  success: boolean;
  user?: User;
  tokens?: {
    accessToken: string;
    refreshToken: string;
  };
  message?: string;
}

export interface TokenVerificationResult {
  success: boolean;
  user?: User;
  message?: string;
}

class AuthService {
  private apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  constructor() {
    // Add request interceptor to include auth token
    this.apiClient.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor to handle token refresh
    this.apiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const refreshToken = this.getRefreshToken();
            if (refreshToken) {
              await this.refreshToken(refreshToken);
              const newToken = this.getAccessToken();
              if (newToken) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return this.apiClient(originalRequest);
              }
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            this.clearTokens();
            window.location.href = '/auth/login';
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Secure token management using sessionStorage
  private getAccessToken(): string | null {
    return sessionStorage.getItem('access_token');
  }

  private getRefreshToken(): string | null {
    return sessionStorage.getItem('refresh_token');
  }

  private setTokens(accessToken: string, refreshToken: string): void {
    sessionStorage.setItem('access_token', accessToken);
    sessionStorage.setItem('refresh_token', refreshToken);
  }

  private clearTokens(): void {
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
  }

  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      const response = await this.apiClient.post<AuthResponse>('/auth/login', {
        email: credentials.email,
        password: credentials.password,
        deviceId: credentials.deviceId,
        remember: credentials.remember
      });

      if (response.data.success && response.data.user && response.data.tokens) {
        this.setTokens(response.data.tokens.accessToken, response.data.tokens.refreshToken);
        
        return {
          success: true,
          user: response.data.user,
          tokens: response.data.tokens,
          message: response.data.message
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Đăng nhập thất bại'
        };
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        return {
          success: false,
          message: error.response?.data?.message || 'Lỗi kết nối đến server'
        };
      }
      
      return {
        success: false,
        message: 'Đã có lỗi xảy ra khi đăng nhập'
      };
    }
  }

  async logout(): Promise<void> {
    try {
      const refreshToken = this.getRefreshToken();
      if (refreshToken) {
        await this.apiClient.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      this.clearTokens();
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthResult> {
    try {
      const response = await this.apiClient.post<RefreshTokenResponse>('/auth/refresh', {
        refreshToken
      });

      if (response.data.success && response.data.tokens) {
        this.setTokens(response.data.tokens.accessToken, response.data.tokens.refreshToken);
        
        return {
          success: true,
          tokens: response.data.tokens,
          user: response.data.user,
          message: response.data.message
        };
      } else {
        this.clearTokens();
        return {
          success: false,
          message: response.data.message || 'Refresh token thất bại'
        };
      }
    } catch (error) {
      this.clearTokens();
      
      if (error instanceof AxiosError) {
        return {
          success: false,
          message: error.response?.data?.message || 'Phiên đăng nhập đã hết hạn'
        };
      }
      
      return {
        success: false,
        message: 'Lỗi làm mới phiên đăng nhập'
      };
    }
  }

  async verifyToken(token: string): Promise<TokenVerificationResult> {
    try {
      const response = await this.apiClient.get<{ success: boolean; user?: User; message?: string }>('/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success && response.data.user) {
        return {
          success: true,
          user: response.data.user
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Token không hợp lệ'
        };
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        return {
          success: false,
          message: error.response?.data?.message || 'Token đã hết hạn'
        };
      }
      
      return {
        success: false,
        message: 'Lỗi xác thực token'
      };
    }
  }

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<AuthResult> {
    try {
      const response = await this.apiClient.post('/auth/change-password', data);
      
      return {
        success: response.data.success,
        message: response.data.message || 'Đổi mật khẩu thành công'
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        return {
          success: false,
          message: error.response?.data?.message || 'Lỗi đổi mật khẩu'
        };
      }
      
      return {
        success: false,
        message: 'Đã có lỗi xảy ra khi đổi mật khẩu'
      };
    }
  }

  async updateProfile(data: Partial<User>): Promise<AuthResult> {
    try {
      const response = await this.apiClient.put('/auth/profile', data);
      
      return {
        success: response.data.success,
        user: response.data.user,
        message: response.data.message || 'Cập nhật thông tin thành công'
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        return {
          success: false,
          message: error.response?.data?.message || 'Lỗi cập nhật thông tin'
        };
      }
      
      return {
        success: false,
        message: 'Đã có lỗi xảy ra khi cập nhật thông tin'
      };
    }
  }

  // Security helpers
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  getCurrentUser(): User | null {
    // User data should be retrieved from the auth store, not from tokens
    return null;
  }

  // CSRF token management
  async getCSRFToken(): Promise<string | null> {
    try {
      const response = await this.apiClient.get('/api/csrf-token');
      return response.data.token;
    } catch (error) {
      console.error('Error getting CSRF token:', error);
      return null;
    }
  }
}

export const authService = new AuthService();
