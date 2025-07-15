// Authentication state management with Zustand
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { authService } from '../services/auth/authService';
import { permissionService } from '../services/auth/permissionService';
import type { User } from '../services/auth/authService';

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
            // Try with authService first, if fails use demo accounts
            let user;
            try {
              user = await authService.login({ email, password, remember });
            } catch (authError) {
              // Fallback to demo accounts
              const demoUsers = [
                {
                  email: 'admin@khoaugment.com',
                  password: '123456',
                  user: {
                    id: 'admin-001',
                    email: 'admin@khoaugment.com',
                    name: 'System Administrator',
                    role: 'admin',
                    permissions: ['*'],
                    phone: '+84901234567',
                    position: 'Administrator'
                  }
                },
                {
                  email: 'manager@khoaugment.com',
                  password: '123456',
                  user: {
                    id: 'manager-001',
                    email: 'manager@khoaugment.com',
                    name: 'Store Manager',
                    role: 'manager',
                    permissions: ['pos', 'inventory', 'customers', 'reports'],
                    phone: '+84901234568',
                    position: 'Manager'
                  }
                },
                {
                  email: 'cashier@khoaugment.com',
                  password: '123456',
                  user: {
                    id: 'cashier-001',
                    email: 'cashier@khoaugment.com',
                    name: 'Thu ngân viên',
                    role: 'cashier',
                    permissions: ['pos', 'customers'],
                    phone: '+84901234569',
                    position: 'Cashier'
                  }
                }
              ];
              
              const demoUser = demoUsers.find(u => u.email === email && u.password === password);
              if (demoUser) {
                // Simulate login delay
                await new Promise(resolve => setTimeout(resolve, 1000));
                user = demoUser.user;
                
                // Store in localStorage for persistence
                localStorage.setItem('auth_user', JSON.stringify(user));
                localStorage.setItem('auth_token', 'demo_token_' + Date.now());
              } else {
                throw new Error('Thông tin đăng nhập không chính xác');
              }
            }
            
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
            // Clear localStorage
            localStorage.removeItem('auth_user');
            localStorage.removeItem('auth_token');
            
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
            // Try authService first, fallback to localStorage
            let user = null;
            try {
              user = await authService.initialize();
            } catch (error) {
              // Fallback to localStorage
              const storedUser = localStorage.getItem('auth_user');
              const storedToken = localStorage.getItem('auth_token');
              
              if (storedUser && storedToken) {
                try {
                  user = JSON.parse(storedUser);
                  console.log('Loaded user from localStorage:', user);
                  
                  // Validate token is not expired
                  const tokenData = storedToken.split('_');
                  if (tokenData.length > 2) {
                    const tokenTime = parseInt(tokenData[2]);
                    const currentTime = Date.now();
                    const tokenAge = currentTime - tokenTime;
                    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
                    
                    if (tokenAge > maxAge) {
                      // Token expired, clear storage
                      localStorage.removeItem('auth_user');
                      localStorage.removeItem('auth_token');
                      user = null;
                      console.log('Token expired, cleared storage');
                    }
                  }
                } catch (parseError) {
                  console.error('Error parsing stored user:', parseError);
                  localStorage.removeItem('auth_user');
                  localStorage.removeItem('auth_token');
                  user = null;
                }
              }
            }
            
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
