// Notification hook
import { notification } from 'antd';
import { useCallback } from 'react';

type NotificationType = 'success' | 'info' | 'warning' | 'error';

interface NotificationOptions {
  message: string;
  description?: string;
  duration?: number;
  placement?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
}

export const useNotification = () => {
  const showNotification = useCallback((type: NotificationType, options: NotificationOptions) => {
    notification[type]({
      message: options.message,
      description: options.description,
      duration: options.duration || 4.5,
      placement: options.placement || 'topRight',
    });
  }, []);

  const success = useCallback((options: NotificationOptions) => {
    showNotification('success', options);
  }, [showNotification]);

  const error = useCallback((options: NotificationOptions) => {
    showNotification('error', options);
  }, [showNotification]);

  const warning = useCallback((options: NotificationOptions) => {
    showNotification('warning', options);
  }, [showNotification]);

  const info = useCallback((options: NotificationOptions) => {
    showNotification('info', options);
  }, [showNotification]);

  return {
    success,
    error,
    warning,
    info,
    showNotification,
  };
};
