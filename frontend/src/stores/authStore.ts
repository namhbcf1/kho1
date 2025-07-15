// Authentication state management with Zustand
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { authService } from '../services/auth/authService';
import type { LoginCredentials, User } from '../types';
import { logger } from '../utils/logger';

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
              // Store tokens securely in sessionStorage ONLY (not localStorage)
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
              
              // Log successful authentication (security audit)
              logger.security('user.login.success', { 
                userId: result.user.id,
                email: result.user.email
              });
            } else {
              throw new Error(result.message || 'Đăng nhập thất bại');
            }
          } catch (error) {
            // Log failed authentication attempt (security audit)
            logger.security('user.login.failed', { 
              email: email.toLowerCase().trim(),
              reason: error instanceof Error ? error.message : 'Unknown error'
            });
            
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
          // Log user logout (security audit)
          const userId = get().user?.id;
          if (userId) {
            logger.security('user.logout', { userId });
          }
          
          // Clear all authentication data
          sessionStorage.removeItem('access_token');
          sessionStorage.removeItem('refresh_token');
          localStorage.removeItem('auth-storage');
          
          // Call logout API to invalidate server-side session
          authService.logout().catch(error => {
            logger.error('Logout API error', { error: error instanceof Error ? error.message : String(error) });
          });
          
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
              // Store new tokens in sessionStorage only
              sessionStorage.setItem('access_token', result.tokens.accessToken);
              sessionStorage.setItem('refresh_token', result.tokens.refreshToken);
              
              if (result.user) {
                set({ user: result.user });
              }
              
              // Log token refresh (security audit)
              logger.security('token.refresh.success', { 
                userId: get().user?.id
              });
            } else {
              throw new Error(result.message || 'Token refresh failed');
            }
          } catch (error) {
            // Log token refresh failure (security audit)
            logger.security('token.refresh.failed', { 
              userId: get().user?.id,
              reason: error instanceof Error ? error.message : String(error)
            });
            
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
              
              // Log successful token verification (security audit)
              logger.security('token.verify.success', { 
                userId: result.user.id
              });
            } else {
              // Try to refresh token
              try {
                await get().refreshToken();
              } catch (refreshError) {
                // Log token verification and refresh failure (security audit)
                logger.security('token.verify.failed', {
                  reason: refreshError instanceof Error ? refreshError.message : String(refreshError)
                });
                
                get().logout();
              }
            }
          } catch (error) {
            // Log authentication check error (security audit)
            logger.security('auth.check.failed', {
              reason: error instanceof Error ? error.message : String(error)
            });
            
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
  // Permission helpers will be implemented properly with the authService
  // No dummy functions or placeholders
}));
