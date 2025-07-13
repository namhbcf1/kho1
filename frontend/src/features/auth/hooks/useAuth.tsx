// Enhanced Auth Hook with robust error handling and proper initialization
import { useState, useEffect, useCallback } from 'react';
import { authService, User, LoginCredentials } from '../../../services/auth/authService';
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
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize auth on mount
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        setLoading(true);
        setError(null);

        // Wait for auth service to initialize
        const currentUser = await authService.initialize();
        
        if (isMounted) {
          setUser(currentUser);
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        if (isMounted) {
          const errorMessage = error instanceof Error ? error.message : 'Authentication initialization failed';
          setError(errorMessage);
          setUser(null);
          setIsInitialized(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      setError(null);
      
      const user = await authService.login(credentials);
      setUser(user);
      
      message.success('Đăng nhập thành công!');
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Đăng nhập thất bại';
      setError(errorMessage);
      message.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      await authService.logout();
      setUser(null);
      
      message.success('Đăng xuất thành công!');
    } catch (error) {
      console.error('Logout error:', error);
      // Clear auth anyway
      setUser(null);
      const errorMessage = error instanceof Error ? error.message : 'Đăng xuất thất bại';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    try {
      setLoading(true);
      setError(null);
      
      // Note: This would need to be implemented in authService
      // For now, just update local state
      if (user) {
        const updatedUser = { ...user, ...data };
        setUser(updatedUser);
        message.success('Cập nhật thông tin thành công!');
        return { success: true };
      }
      
      throw new Error('No user to update');
    } catch (error) {
      console.error('Update profile error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Cập nhật thất bại';
      setError(errorMessage);
      message.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user]);

  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Check auth error:', error);
      setUser(null);
      const errorMessage = error instanceof Error ? error.message : 'Xác thực thất bại';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const isAuthenticated = !!user && authService.isAuthenticated();

  return {
    user,
    isAuthenticated,
    loading,
    error,
    isInitialized,
    login,
    logout,
    updateProfile,
    checkAuth,
    clearError,
  };
};
