// Notification state management with Zustand
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  timestamp: number;
  read: boolean;
  persistent?: boolean;
  actions?: {
    label: string;
    handler: () => void;
  }[];
}

export interface NotificationState {
  // State
  notifications: Notification[];
  unreadCount: number;
  isOpen: boolean;
  
  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => string;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  clearRead: () => void;
  togglePanel: () => void;
  setOpen: (open: boolean) => void;
  
  // Convenience methods
  success: (title: string, message?: string, options?: Partial<Notification>) => string;
  error: (title: string, message?: string, options?: Partial<Notification>) => string;
  warning: (title: string, message?: string, options?: Partial<Notification>) => string;
  info: (title: string, message?: string, options?: Partial<Notification>) => string;
}

export const useNotificationStore = create<NotificationState>()(
  devtools(
    (set, get) => ({
      // Initial state
      notifications: [],
      unreadCount: 0,
      isOpen: false,

      // Actions
      addNotification: (notification) => {
        const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newNotification: Notification = {
          id,
          timestamp: Date.now(),
          read: false,
          duration: 5000,
          ...notification,
        };

        set((state) => ({
          notifications: [newNotification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        }));

        // Auto-remove notification after duration (if not persistent)
        if (!newNotification.persistent && newNotification.duration) {
          setTimeout(() => {
            const currentNotifications = get().notifications;
            if (currentNotifications.find(n => n.id === id)) {
              get().removeNotification(id);
            }
          }, newNotification.duration);
        }

        return id;
      },

      removeNotification: (id) => {
        set((state) => {
          const notification = state.notifications.find(n => n.id === id);
          const wasUnread = notification && !notification.read;
          
          return {
            notifications: state.notifications.filter(n => n.id !== id),
            unreadCount: wasUnread ? state.unreadCount - 1 : state.unreadCount,
          };
        });
      },

      markAsRead: (id) => {
        set((state) => {
          const notification = state.notifications.find(n => n.id === id);
          if (notification && !notification.read) {
            return {
              notifications: state.notifications.map(n =>
                n.id === id ? { ...n, read: true } : n
              ),
              unreadCount: state.unreadCount - 1,
            };
          }
          return state;
        });
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map(n => ({ ...n, read: true })),
          unreadCount: 0,
        }));
      },

      clearAll: () => {
        set({
          notifications: [],
          unreadCount: 0,
        });
      },

      clearRead: () => {
        set((state) => ({
          notifications: state.notifications.filter(n => !n.read),
        }));
      },

      togglePanel: () => {
        set((state) => ({
          isOpen: !state.isOpen,
        }));
      },

      setOpen: (open) => {
        set({ isOpen: open });
      },

      // Convenience methods
      success: (title, message, options = {}) => {
        return get().addNotification({
          type: 'success',
          title,
          message,
          ...options,
        });
      },

      error: (title, message, options = {}) => {
        return get().addNotification({
          type: 'error',
          title,
          message,
          persistent: true, // Errors should be persistent by default
          ...options,
        });
      },

      warning: (title, message, options = {}) => {
        return get().addNotification({
          type: 'warning',
          title,
          message,
          duration: 8000, // Warnings should stay longer
          ...options,
        });
      },

      info: (title, message, options = {}) => {
        return get().addNotification({
          type: 'info',
          title,
          message,
          ...options,
        });
      },
    }),
    {
      name: 'notification-store',
    }
  )
);

// Selectors
export const useNotifications = () => useNotificationStore((state) => ({
  notifications: state.notifications,
  unreadCount: state.unreadCount,
  isOpen: state.isOpen,
}));

export const useNotificationActions = () => useNotificationStore((state) => ({
  addNotification: state.addNotification,
  removeNotification: state.removeNotification,
  markAsRead: state.markAsRead,
  markAllAsRead: state.markAllAsRead,
  clearAll: state.clearAll,
  clearRead: state.clearRead,
  togglePanel: state.togglePanel,
  setOpen: state.setOpen,
  success: state.success,
  error: state.error,
  warning: state.warning,
  info: state.info,
}));

// Hook for easy notification usage
export const useNotify = () => {
  const { success, error, warning, info } = useNotificationActions();
  
  return {
    success,
    error,
    warning,
    info,
  };
};