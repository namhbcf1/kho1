// Authentication state management with Zustand
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { authService } from '../services/auth/authService';
import type { LoginCredentials, User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  updateUser: (userData: Partial<User>) => void;
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
            const credentials: LoginCredentials = {
              email: email.toLowerCase().trim(),
              password,
              remember,
              deviceId: navigator.userAgent ? btoa(navigator.userAgent).slice(0, 32) : 'unknown'
            };

            const result = await authService.login(credentials);
            
            if (result.success && result.user && result.tokens) {
              // Store tokens securely in sessionStorage (not localStorage)
              sessionStorage.setItem('access_token', result.tokens.accessToken);
              sessionStorage.setItem('refresh_token', result.tokens.refreshToken);
              
              // Only store user data in persistent storage, not tokens
              set({
                user: result.user,
                isAuthenticated: true,
                isLoading: false,
                error: null,
                isInitialized: true
              });
            } else {
              throw new Error(result.message || 'Đăng nhập thất bại');
            }
          } catch (error) {
            console.error('Login error:', error);
            set({
              error: error instanceof Error ? error.message : 'Đăng nhập thất bại',
              isLoading: false,
              isAuthenticated: false,
              user: null
            });
            throw error;
          }
        },

        logout: () => {
          // Clear all authentication data
          sessionStorage.removeItem('access_token');
          sessionStorage.removeItem('refresh_token');
          localStorage.removeItem('auth-storage');
          
          // Call logout API to invalidate server-side session
          authService.logout().catch(console.error);
          
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            isInitialized: true
          });
        },

        refreshToken: async () => {
          try {
            const refreshToken = sessionStorage.getItem('refresh_token');
            if (!refreshToken) {
              throw new Error('No refresh token available');
            }

            const result = await authService.refreshToken(refreshToken);
            
            if (result.success && result.tokens) {
              sessionStorage.setItem('access_token', result.tokens.accessToken);
              sessionStorage.setItem('refresh_token', result.tokens.refreshToken);
              
              if (result.user) {
                set({ user: result.user });
              }
            } else {
              throw new Error(result.message || 'Token refresh failed');
            }
          } catch (error) {
            console.error('Token refresh error:', error);
            get().logout();
            throw error;
          }
        },

        checkAuth: async () => {
          set({ isLoading: true });
          
          try {
            const accessToken = sessionStorage.getItem('access_token');
            
            if (!accessToken) {
              set({ isLoading: false, isInitialized: true });
              return;
            }

            const result = await authService.verifyToken(accessToken);
            
            if (result.success && result.user) {
              set({
                user: result.user,
                isAuthenticated: true,
                isLoading: false,
                isInitialized: true
              });
            } else {
              // Try to refresh token
              try {
                await get().refreshToken();
              } catch (refreshError) {
                get().logout();
              }
            }
          } catch (error) {
            console.error('Auth check error:', error);
            get().logout();
          } finally {
            set({ isLoading: false, isInitialized: true });
          }
        },

        clearError: () => set({ error: null }),

        updateUser: (userData: Partial<User>) => {
          set((state) => ({
            user: state.user ? { ...state.user, ...userData } : null
          }));
        }
      }),
      {
        name: 'auth-storage',
        // Only persist user data, not tokens or sensitive information
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          isInitialized: state.isInitialized
        }),
        onRehydrateStorage: () => (state) => {
          // Always verify authentication on rehydration
          if (state?.isAuthenticated) {
            state.checkAuth();
          }
        }
      }
    ),
    {
      name: 'auth-store'
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
  logout: state.logout,
  refreshToken: state.refreshToken,
  checkAuth: state.checkAuth,
  clearError: state.clearError,
  updateUser: state.updateUser,
}));

export const usePermissions = () => useAuthStore((state) => ({
  // Permission helpers will be re-added here once the authService is updated
  // to return permission data directly.
  // For now, we'll return dummy functions or remove if not needed immediately.
  // Example:
  // hasPermission: (permission: string) => {
  //   const { user } = get();
  //   return permissionService.hasPermission(permission, user || undefined);
  // },
  // hasRole: (role: string) => {
  //   const { user } = get();
  //   return permissionService.hasRole(role, user || undefined);
  // },
  // hasAnyPermission: (permissions: string[]) => {
  //   const { user } = get();
  //   return permissionService.hasAnyPermission(permissions, user || undefined);
  // },
  // hasAllPermissions: (permissions: string[]) => {
  //   const { user } = get();
  //   return permissionService.hasAllPermissions(permissions, user || undefined);
  // },
  // canAccessResource: (resource: string, action: string) => {
  //   const { user } = get();
  //   return permissionService.canAccessResource(resource, action, user || undefined);
  // },
}));
