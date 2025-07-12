// Cloudflare Workers API calls for authentication
const API_BASE = '/api/auth';

export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: any;
  token?: string;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();
      
      if (data.success && data.token) {
        // Store token in localStorage or secure storage
        localStorage.setItem('auth_token', data.token);
        if (credentials.remember) {
          localStorage.setItem('remember_login', 'true');
        }
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Có lỗi xảy ra khi đăng nhập',
      };
    }
  }

  async logout(): Promise<void> {
    try {
      const token = localStorage.getItem('auth_token');
      
      if (token) {
        await fetch(`${API_BASE}/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('remember_login');
    }
  }

  async getCurrentUser(): Promise<AuthResponse> {
    try {
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        return { success: false, message: 'No token found' };
      }

      const response = await fetch(`${API_BASE}/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!data.success) {
        // Token might be expired, clear it
        localStorage.removeItem('auth_token');
        localStorage.removeItem('remember_login');
      }

      return data;
    } catch (error) {
      console.error('Get current user error:', error);
      return {
        success: false,
        message: 'Có lỗi xảy ra khi lấy thông tin người dùng',
      };
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

  getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  isRememberLogin(): boolean {
    return localStorage.getItem('remember_login') === 'true';
  }
}

export const authService = new AuthService();
