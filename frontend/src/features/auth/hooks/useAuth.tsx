// Enhanced Auth Hook using Zustand store
import { useEffect, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { authService, User, LoginCredentials } from '../services/authService';
import { message } from 'antd';

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  isInitialized: boolean;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; message?: string }>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  // Additional methods
  refreshAuth: () => Promise<void>;
  isTokenExpired: () => boolean;
}

// Simplified hook that uses the store
export const useAuth = (): UseAuthReturn => {
  const store = useAuthStore();

  // Initialize auth on mount
  useEffect(() => {
    if (!store.isInitialized) {
      store.initialize();
    }
  }, [store.isInitialized, store.initialize]);

  // Set up periodic auth check
  useEffect(() => {
    if (!store.isAuthenticated) return;

    const interval = setInterval(() => {
      store.checkAuthStatus();
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [store.isAuthenticated, store.checkAuthStatus]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      const success = await store.login(credentials);
      if (success) {
        message.success('Đăng nhập thành công!');
        store.updateLastActivity();
        return { success: true };
      } else {
        const errorMessage = store.error || 'Đăng nhập thất bại';
        message.error(errorMessage);
        return { success: false, message: errorMessage };
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Đăng nhập thất bại';
      message.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  }, [store]);

  const logout = useCallback(async () => {
    try {
      await store.logout();
      message.success('Đăng xuất thành công!');
    } catch (error) {
      console.error('Logout error:', error);
      message.error('Đăng xuất thất bại');
    }
  }, [store]);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    try {
      if (!store.user) {
        throw new Error('No user to update');
      }

      const response = await authService.updateProfile(data);
      if (response.success && response.user) {
        store.setUser(response.user);
        message.success('Cập nhật thông tin thành công!');
        return { success: true };
      }
      
      throw new Error(response.message || 'Update failed');
    } catch (error) {
      console.error('Update profile error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Cập nhật thất bại';
      message.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  }, [store]);

  const checkAuth = useCallback(async () => {
    try {
      await store.checkAuthStatus();
    } catch (error) {
      console.error('Check auth error:', error);
    }
  }, [store]);

  const refreshAuth = useCallback(async () => {
    try {
      await store.initialize();
    } catch (error) {
      console.error('Auth refresh error:', error);
    }
  }, [store]);

  const isTokenExpired = useCallback(() => {
    const token = authService.getAuthToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp < now;
    } catch {
      return true;
    }
  }, []);

  const clearError = useCallback(() => {
    store.setError(null);
  }, [store]);

  return {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    loading: store.loading,
    error: store.error,
    isInitialized: store.isInitialized,
    login,
    logout,
    updateProfile,
    checkAuth,
    clearError,
    refreshAuth,
    isTokenExpired,
  };
};