import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { authService } from '../services/authService';

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

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  isInitialized: boolean;
  lastActivity: number;
}

interface AuthActions {
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setInitialized: (initialized: boolean) => void;
  updateLastActivity: () => void;
  clearAuth: () => void;
  // Enhanced actions
  initialize: () => Promise<void>;
  login: (credentials: { email: string; password: string; remember?: boolean }) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // State
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
        isInitialized: false,
        lastActivity: Date.now(),

        // Actions
        setUser: (user: User | null) => {
          set({
            user,
            isAuthenticated: !!user,
            loading: false,
            error: null,
          });
        },

        setLoading: (loading: boolean) => {
          set({ loading });
        },

        setError: (error: string | null) => {
          set({ error, loading: false });
        },

        setInitialized: (initialized: boolean) => {
          set({ isInitialized: initialized });
        },

        updateLastActivity: () => {
          set({ lastActivity: Date.now() });
        },

        clearAuth: () => {
          set({
            user: null,
            isAuthenticated: false,
            loading: false,
            error: null,
          });
        },

        // Enhanced actions
        initialize: async () => {
          const state = get();
          if (state.isInitialized) return;

          try {
            set({ loading: true, error: null });
            const user = await authService.initialize();
            set({ 
              user, 
              isAuthenticated: !!user, 
              loading: false, 
              isInitialized: true,
              lastActivity: Date.now()
            });
          } catch (error) {
            console.error('Auth initialization error:', error);
            set({ 
              user: null, 
              isAuthenticated: false, 
              loading: false, 
              error: error instanceof Error ? error.message : 'Initialization failed',
              isInitialized: true
            });
          }
        },

        login: async (credentials) => {
          try {
            set({ loading: true, error: null });
            const user = await authService.login(credentials);
            set({ 
              user, 
              isAuthenticated: true, 
              loading: false,
              lastActivity: Date.now()
            });
            return true;
          } catch (error) {
            console.error('Login error:', error);
            set({ 
              user: null, 
              isAuthenticated: false, 
              loading: false,
              error: error instanceof Error ? error.message : 'Login failed'
            });
            return false;
          }
        },

        logout: async () => {
          try {
            set({ loading: true });
            await authService.logout();
          } catch (error) {
            console.error('Logout error:', error);
          } finally {
            set({
              user: null,
              isAuthenticated: false,
              loading: false,
              error: null,
            });
          }
        },

        checkAuthStatus: async () => {
          try {
            const user = await authService.getCurrentUser();
            set({ 
              user, 
              isAuthenticated: !!user,
              lastActivity: Date.now()
            });
          } catch (error) {
            console.error('Auth check error:', error);
            set({ 
              user: null, 
              isAuthenticated: false,
              error: error instanceof Error ? error.message : 'Auth check failed'
            });
          }
        },
      }),
      {
        name: 'kho-auth-storage',
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          lastActivity: state.lastActivity,
        }),
        version: 1,
        migrate: (persistedState: any, version: number) => {
          if (version === 0) {
            // Migration from v0 to v1
            return {
              ...persistedState,
              error: null,
              isInitialized: false,
              lastActivity: Date.now(),
            };
          }
          return persistedState;
        },
      }
    )
  )
);

// Auto-logout after 8 hours of inactivity
const INACTIVITY_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours

// Set up activity monitoring
if (typeof window !== 'undefined') {
  const checkInactivity = () => {
    const state = useAuthStore.getState();
    if (state.isAuthenticated && state.lastActivity) {
      const timeSinceActivity = Date.now() - state.lastActivity;
      if (timeSinceActivity > INACTIVITY_TIMEOUT) {
        state.logout();
      }
    }
  };

  // Check every 5 minutes
  setInterval(checkInactivity, 5 * 60 * 1000);

  // Update activity on user interaction
  const updateActivity = () => {
    const state = useAuthStore.getState();
    if (state.isAuthenticated) {
      state.updateLastActivity();
    }
  };

  ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
    document.addEventListener(event, updateActivity, { passive: true });
  });
}
