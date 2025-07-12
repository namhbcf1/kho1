// UI state management with Zustand
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface Modal {
  id: string;
  type: string;
  title?: string;
  content?: any;
  props?: any;
  onClose?: () => void;
  onConfirm?: () => void;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface Drawer {
  id: string;
  type: string;
  title?: string;
  content?: any;
  props?: any;
  placement?: 'left' | 'right' | 'top' | 'bottom';
  width?: number | string;
  height?: number | string;
  onClose?: () => void;
}

export interface UIState {
  // Layout
  sidebarCollapsed: boolean;
  sidebarMobile: boolean;
  theme: 'light' | 'dark' | 'auto';
  language: 'vi' | 'en';
  
  // Loading states
  globalLoading: boolean;
  loadingStates: Record<string, boolean>;
  
  // Modals
  modals: Modal[];
  
  // Notifications
  notifications: Notification[];
  
  // Drawers
  drawers: Drawer[];
  
  // Page state
  pageTitle: string;
  breadcrumbs: Array<{ title: string; path?: string }>;
  
  // Search
  globalSearchVisible: boolean;
  globalSearchQuery: string;
  
  // Actions
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarMobile: (mobile: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  setLanguage: (language: 'vi' | 'en') => void;
  
  // Loading
  setGlobalLoading: (loading: boolean) => void;
  setLoading: (key: string, loading: boolean) => void;
  isLoading: (key: string) => boolean;
  
  // Modals
  openModal: (modal: Omit<Modal, 'id'>) => string;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  
  // Notifications
  showNotification: (notification: Omit<Notification, 'id'>) => string;
  hideNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // Drawers
  openDrawer: (drawer: Omit<Drawer, 'id'>) => string;
  closeDrawer: (id: string) => void;
  closeAllDrawers: () => void;
  
  // Page
  setPageTitle: (title: string) => void;
  setBreadcrumbs: (breadcrumbs: Array<{ title: string; path?: string }>) => void;
  
  // Search
  setGlobalSearchVisible: (visible: boolean) => void;
  setGlobalSearchQuery: (query: string) => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        sidebarCollapsed: false,
        sidebarMobile: false,
        theme: 'light',
        language: 'vi',
        
        globalLoading: false,
        loadingStates: {},
        
        modals: [],
        notifications: [],
        drawers: [],
        
        pageTitle: '',
        breadcrumbs: [],
        
        globalSearchVisible: false,
        globalSearchQuery: '',

        // Layout actions
        setSidebarCollapsed: (collapsed) => {
          set({ sidebarCollapsed: collapsed });
        },

        setSidebarMobile: (mobile) => {
          set({ sidebarMobile: mobile });
        },

        setTheme: (theme) => {
          set({ theme });
          
          // Apply theme to document
          const root = document.documentElement;
          if (theme === 'dark') {
            root.classList.add('dark');
          } else if (theme === 'light') {
            root.classList.remove('dark');
          } else {
            // Auto theme - check system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) {
              root.classList.add('dark');
            } else {
              root.classList.remove('dark');
            }
          }
        },

        setLanguage: (language) => {
          set({ language });
          
          // Update document language
          document.documentElement.lang = language;
        },

        // Loading actions
        setGlobalLoading: (loading) => {
          set({ globalLoading: loading });
        },

        setLoading: (key, loading) => {
          const { loadingStates } = get();
          set({
            loadingStates: {
              ...loadingStates,
              [key]: loading,
            },
          });
        },

        isLoading: (key) => {
          const { loadingStates } = get();
          return loadingStates[key] || false;
        },

        // Modal actions
        openModal: (modal) => {
          const id = `modal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const { modals } = get();
          
          set({
            modals: [...modals, { ...modal, id }],
          });
          
          return id;
        },

        closeModal: (id) => {
          const { modals } = get();
          const modal = modals.find(m => m.id === id);
          
          if (modal?.onClose) {
            modal.onClose();
          }
          
          set({
            modals: modals.filter(m => m.id !== id),
          });
        },

        closeAllModals: () => {
          const { modals } = get();
          
          modals.forEach(modal => {
            if (modal.onClose) {
              modal.onClose();
            }
          });
          
          set({ modals: [] });
        },

        // Notification actions
        showNotification: (notification) => {
          const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const { notifications } = get();
          
          const newNotification = {
            ...notification,
            id,
            duration: notification.duration || 5000,
          };
          
          set({
            notifications: [...notifications, newNotification],
          });
          
          // Auto-hide notification
          if (newNotification.duration > 0) {
            setTimeout(() => {
              get().hideNotification(id);
            }, newNotification.duration);
          }
          
          return id;
        },

        hideNotification: (id) => {
          const { notifications } = get();
          set({
            notifications: notifications.filter(n => n.id !== id),
          });
        },

        clearNotifications: () => {
          set({ notifications: [] });
        },

        // Drawer actions
        openDrawer: (drawer) => {
          const id = `drawer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const { drawers } = get();
          
          set({
            drawers: [...drawers, { ...drawer, id }],
          });
          
          return id;
        },

        closeDrawer: (id) => {
          const { drawers } = get();
          const drawer = drawers.find(d => d.id === id);
          
          if (drawer?.onClose) {
            drawer.onClose();
          }
          
          set({
            drawers: drawers.filter(d => d.id !== id),
          });
        },

        closeAllDrawers: () => {
          const { drawers } = get();
          
          drawers.forEach(drawer => {
            if (drawer.onClose) {
              drawer.onClose();
            }
          });
          
          set({ drawers: [] });
        },

        // Page actions
        setPageTitle: (title) => {
          set({ pageTitle: title });
          document.title = title ? `${title} - KhoAugment POS` : 'KhoAugment POS';
        },

        setBreadcrumbs: (breadcrumbs) => {
          set({ breadcrumbs });
        },

        // Search actions
        setGlobalSearchVisible: (visible) => {
          set({ globalSearchVisible: visible });
        },

        setGlobalSearchQuery: (query) => {
          set({ globalSearchQuery: query });
        },
      }),
      {
        name: 'ui-store',
        partialize: (state) => ({
          sidebarCollapsed: state.sidebarCollapsed,
          theme: state.theme,
          language: state.language,
        }),
      }
    ),
    {
      name: 'ui-store',
    }
  )
);

// Selectors
export const useLayout = () => useUIStore((state) => ({
  sidebarCollapsed: state.sidebarCollapsed,
  sidebarMobile: state.sidebarMobile,
  theme: state.theme,
  language: state.language,
  setSidebarCollapsed: state.setSidebarCollapsed,
  setSidebarMobile: state.setSidebarMobile,
  setTheme: state.setTheme,
  setLanguage: state.setLanguage,
}));

export const useLoading = () => useUIStore((state) => ({
  globalLoading: state.globalLoading,
  setGlobalLoading: state.setGlobalLoading,
  setLoading: state.setLoading,
  isLoading: state.isLoading,
}));

export const useModals = () => useUIStore((state) => ({
  modals: state.modals,
  openModal: state.openModal,
  closeModal: state.closeModal,
  closeAllModals: state.closeAllModals,
}));

export const useNotifications = () => useUIStore((state) => ({
  notifications: state.notifications,
  showNotification: state.showNotification,
  hideNotification: state.hideNotification,
  clearNotifications: state.clearNotifications,
}));

export const useDrawers = () => useUIStore((state) => ({
  drawers: state.drawers,
  openDrawer: state.openDrawer,
  closeDrawer: state.closeDrawer,
  closeAllDrawers: state.closeAllDrawers,
}));

export const usePage = () => useUIStore((state) => ({
  pageTitle: state.pageTitle,
  breadcrumbs: state.breadcrumbs,
  setPageTitle: state.setPageTitle,
  setBreadcrumbs: state.setBreadcrumbs,
}));

export const useGlobalSearch = () => useUIStore((state) => ({
  globalSearchVisible: state.globalSearchVisible,
  globalSearchQuery: state.globalSearchQuery,
  setGlobalSearchVisible: state.setGlobalSearchVisible,
  setGlobalSearchQuery: state.setGlobalSearchQuery,
}));
