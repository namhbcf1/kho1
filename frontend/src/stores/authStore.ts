// Authentication state management with Zustand
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { authService } from '../services/auth/authService';
import { permissionService } from '../services/auth/permissionService';
import type { User } from '../services/api/types';

export interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    position?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (data: {
    token: string;
    password: string;
    confirmPassword: string;
  }) => Promise<void>;
  initialize: () => Promise<void>;
  clearError: () => void;
  
  // Permission helpers
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  canAccessResource: (resource: string, action: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: false,
        error: null,

        // Actions
        login: async (email: string, password: string, remember = false) => {
          set({ isLoading: true, error: null });
          
          try {
            const user = await authService.login({ email, password, remember });
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } catch (error) {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Đăng nhập thất bại',
            });
            throw error;
          }
        },

        register: async (data) => {
          set({ isLoading: true, error: null });
          
          try {
            const user = await authService.register(data);
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } catch (error) {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Đăng ký thất bại',
            });
            throw error;
          }
        },

        logout: async () => {
          set({ isLoading: true });
          
          try {
            await authService.logout();
          } catch (error) {
            console.error('Logout error:', error);
          } finally {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            });
          }
        },

        refreshToken: async () => {
          try {
            const token = await authService.refreshToken();
            if (!token) {
              // Token refresh failed, logout user
              set({
                user: null,
                isAuthenticated: false,
                error: 'Phiên đăng nhập đã hết hạn',
              });
            }
          } catch (error) {
            console.error('Token refresh error:', error);
            set({
              user: null,
              isAuthenticated: false,
              error: 'Phiên đăng nhập đã hết hạn',
            });
          }
        },

        updateProfile: async (data) => {
          set({ isLoading: true, error: null });
          
          try {
            const updatedUser = await authService.updateProfile(data);
            set({
              user: updatedUser,
              isLoading: false,
              error: null,
            });
          } catch (error) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'Cập nhật thông tin thất bại',
            });
            throw error;
          }
        },

        changePassword: async (data) => {
          set({ isLoading: true, error: null });
          
          try {
            await authService.changePassword(data);
            set({
              isLoading: false,
              error: null,
            });
          } catch (error) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'Đổi mật khẩu thất bại',
            });
            throw error;
          }
        },

        forgotPassword: async (email) => {
          set({ isLoading: true, error: null });
          
          try {
            await authService.forgotPassword({ email });
            set({
              isLoading: false,
              error: null,
            });
          } catch (error) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'Gửi email khôi phục thất bại',
            });
            throw error;
          }
        },

        resetPassword: async (data) => {
          set({ isLoading: true, error: null });
          
          try {
            await authService.resetPassword(data);
            set({
              isLoading: false,
              error: null,
            });
          } catch (error) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'Đặt lại mật khẩu thất bại',
            });
            throw error;
          }
        },

        initialize: async () => {
          set({ isLoading: true });
          
          try {
            const user = await authService.initialize();
            set({
              user,
              isAuthenticated: !!user,
              isLoading: false,
              isInitialized: true,
              error: null,
            });
          } catch (error) {
            console.error('Auth initialization error:', error);
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              isInitialized: true,
              error: null,
            });
          }
        },

        clearError: () => {
          set({ error: null });
        },

        // Permission helpers
        hasPermission: (permission: string) => {
          const { user } = get();
          return permissionService.hasPermission(permission, user || undefined);
        },

        hasRole: (role: string) => {
          const { user } = get();
          return permissionService.hasRole(role, user || undefined);
        },

        hasAnyPermission: (permissions: string[]) => {
          const { user } = get();
          return permissionService.hasAnyPermission(permissions, user || undefined);
        },

        hasAllPermissions: (permissions: string[]) => {
          const { user } = get();
          return permissionService.hasAllPermissions(permissions, user || undefined);
        },

        canAccessResource: (resource: string, action: string) => {
          const { user } = get();
          return permissionService.canAccessResource(resource, action, user || undefined);
        },
      }),
      {
        name: 'auth-store',
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    {
      name: 'auth-store',
    }
  )
);

// Selectors
export const useAuth = () => useAuthStore((state) => ({
  user: state.user,
  isAuthenticated: state.isAuthenticated,
  isLoading: state.isLoading,
  isInitialized: state.isInitialized,
  error: state.error,
}));

export const useAuthActions = () => useAuthStore((state) => ({
  login: state.login,
  register: state.register,
  logout: state.logout,
  refreshToken: state.refreshToken,
  updateProfile: state.updateProfile,
  changePassword: state.changePassword,
  forgotPassword: state.forgotPassword,
  resetPassword: state.resetPassword,
  initialize: state.initialize,
  clearError: state.clearError,
}));

export const usePermissions = () => useAuthStore((state) => ({
  hasPermission: state.hasPermission,
  hasRole: state.hasRole,
  hasAnyPermission: state.hasAnyPermission,
  hasAllPermissions: state.hasAllPermissions,
  canAccessResource: state.canAccessResource,
}));
