import { useAuthStore } from '../stores/authStore';
import { authService } from '../services/authService';
import { message } from 'antd';

export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    loading,
    setUser,
    setLoading,
    clearAuth,
  } = useAuthStore();

  const login = async (credentials: { email: string; password: string; remember?: boolean }) => {
    try {
      setLoading(true);
      const response = await authService.login(credentials);
      
      if (response.success) {
        setUser(response.user);
        message.success('Đăng nhập thành công!');
        return { success: true };
      } else {
        message.error(response.message || 'Đăng nhập thất bại');
        return { success: false, message: response.message };
      }
    } catch (error) {
      const errorMessage = 'Có lỗi xảy ra khi đăng nhập';
      message.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await authService.logout();
      clearAuth();
      message.success('Đăng xuất thành công!');
    } catch (error) {
      console.error('Logout error:', error);
      // Clear auth anyway
      clearAuth();
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: any) => {
    try {
      setLoading(true);
      const response = await authService.updateProfile(data);
      
      if (response.success) {
        setUser(response.user);
        message.success('Cập nhật thông tin thành công!');
        return { success: true };
      } else {
        message.error(response.message || 'Cập nhật thất bại');
        return { success: false, message: response.message };
      }
    } catch (error) {
      const errorMessage = 'Có lỗi xảy ra khi cập nhật thông tin';
      message.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const checkAuth = async () => {
    try {
      setLoading(true);
      const response = await authService.getCurrentUser();
      
      if (response.success && response.user) {
        setUser(response.user);
      } else {
        clearAuth();
      }
    } catch (error) {
      console.error('Check auth error:', error);
      clearAuth();
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    updateProfile,
    checkAuth,
  };
};
