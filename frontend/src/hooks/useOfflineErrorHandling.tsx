// Comprehensive offline/online error handling hook
import { useState, useEffect, useCallback, useRef } from 'react';
import { notification } from 'antd';
import { useNetworkStatus } from './useNetworkStatus';
import { useDashboardCleanup } from './useCleanup';

export interface OfflineError {
  id: string;
  message: string;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
  operation: () => Promise<any>;
  onSuccess?: (result: any) => void;
  onFailure?: (error: Error) => void;
}

export interface OfflineErrorState {
  errors: OfflineError[];
  isRetrying: boolean;
  retryQueue: string[];
}

export function useOfflineErrorHandling() {
  const { isOnline, networkType, effectiveType } = useNetworkStatus();
  const { safeSetState, addCleanup } = useDashboardCleanup();
  
  const [state, setState] = useState<OfflineErrorState>({
    errors: [],
    isRetrying: false,
    retryQueue: [],
  });

  const safeSetErrorState = safeSetState(setState);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const notificationShownRef = useRef<{ [key: string]: boolean }>({});

  // Handle network state changes
  useEffect(() => {
    if (isOnline) {
      handleOnlineStateChange();
    } else {
      handleOfflineStateChange();
    }
  }, [isOnline]);

  // Clean up timeouts
  useEffect(() => {
    addCleanup(() => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    });
  }, [addCleanup]);

  const handleOfflineStateChange = useCallback(() => {
    const offlineKey = 'offline-notification';
    
    if (!notificationShownRef.current[offlineKey]) {
      notification.warning({
        key: offlineKey,
        message: 'Mất kết nối mạng',
        description: 'Ứng dụng đang hoạt động ở chế độ offline. Một số tính năng có thể bị hạn chế.',
        duration: 0, // Persistent notification
        placement: 'topRight',
      });
      notificationShownRef.current[offlineKey] = true;
    }
  }, []);

  const handleOnlineStateChange = useCallback(() => {
    const offlineKey = 'offline-notification';
    const onlineKey = 'online-notification';
    
    // Close offline notification
    notification.close(offlineKey);
    notificationShownRef.current[offlineKey] = false;
    
    // Show online notification briefly
    if (!notificationShownRef.current[onlineKey]) {
      notification.success({
        key: onlineKey,
        message: 'Đã kết nối lại',
        description: getConnectionQualityMessage(),
        duration: 3,
        placement: 'topRight',
      });
      notificationShownRef.current[onlineKey] = true;
      
      // Reset the flag after a delay
      setTimeout(() => {
        notificationShownRef.current[onlineKey] = false;
      }, 5000);
    }

    // Retry failed operations
    retryFailedOperations();
  }, [networkType, effectiveType]);

  const getConnectionQualityMessage = useCallback(() => {
    if (networkType === 'wifi') {
      return 'Kết nối WiFi ổn định';
    } else if (networkType === 'cellular') {
      switch (effectiveType) {
        case '4g':
          return 'Kết nối di động 4G tốt';
        case '3g':
          return 'Kết nối di động 3G trung bình';
        case '2g':
          return 'Kết nối di động 2G chậm';
        default:
          return 'Kết nối di động';
      }
    }
    return 'Đã khôi phục kết nối mạng';
  }, [networkType, effectiveType]);

  const addOfflineError = useCallback((
    message: string,
    operation: () => Promise<any>,
    options: {
      maxRetries?: number;
      onSuccess?: (result: any) => void;
      onFailure?: (error: Error) => void;
    } = {}
  ) => {
    const { maxRetries = 3, onSuccess, onFailure } = options;
    
    const errorId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newError: OfflineError = {
      id: errorId,
      message,
      timestamp: new Date(),
      retryCount: 0,
      maxRetries,
      operation,
      onSuccess,
      onFailure,
    };

    safeSetErrorState(prev => ({
      ...prev,
      errors: [...prev.errors, newError],
    }));

    // Show notification for the error
    notification.error({
      key: errorId,
      message: 'Lỗi khi offline',
      description: message,
      duration: 5,
      placement: 'topRight',
      btn: isOnline && (
        <button
          onClick={() => retryOperation(errorId)}
          style={{
            background: '#1890ff',
            color: 'white',
            border: 'none',
            padding: '4px 8px',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Thử lại
        </button>
      ),
    });

    return errorId;
  }, [isOnline, safeSetErrorState]);

  const removeError = useCallback((errorId: string) => {
    safeSetErrorState(prev => ({
      ...prev,
      errors: prev.errors.filter(error => error.id !== errorId),
      retryQueue: prev.retryQueue.filter(id => id !== errorId),
    }));
    
    notification.close(errorId);
  }, [safeSetErrorState]);

  const retryOperation = useCallback(async (errorId: string) => {
    const error = state.errors.find(e => e.id === errorId);
    if (!error || !isOnline) return;

    safeSetErrorState(prev => ({
      ...prev,
      isRetrying: true,
      retryQueue: [...prev.retryQueue, errorId],
    }));

    try {
      const result = await error.operation();
      
      // Success - remove error and call success callback
      removeError(errorId);
      
      if (error.onSuccess) {
        error.onSuccess(result);
      }

      notification.success({
        message: 'Thành công',
        description: 'Thao tác đã được thực hiện thành công',
        duration: 3,
        placement: 'topRight',
      });

    } catch (retryError) {
      // Update retry count
      safeSetErrorState(prev => ({
        ...prev,
        errors: prev.errors.map(e => 
          e.id === errorId 
            ? { ...e, retryCount: e.retryCount + 1 }
            : e
        ),
        retryQueue: prev.retryQueue.filter(id => id !== errorId),
      }));

      const updatedError = state.errors.find(e => e.id === errorId);
      
      if (updatedError && updatedError.retryCount >= updatedError.maxRetries) {
        // Max retries reached - remove error and call failure callback
        removeError(errorId);
        
        if (error.onFailure) {
          error.onFailure(retryError instanceof Error ? retryError : new Error(String(retryError)));
        }

        notification.error({
          message: 'Thử lại thất bại',
          description: `Đã thử ${updatedError.maxRetries} lần nhưng không thành công`,
          duration: 5,
          placement: 'topRight',
        });
      } else {
        // Schedule next retry
        const delay = Math.min(1000 * Math.pow(2, updatedError?.retryCount || 0), 30000);
        
        retryTimeoutRef.current = setTimeout(() => {
          retryOperation(errorId);
        }, delay);
      }
    } finally {
      safeSetErrorState(prev => ({
        ...prev,
        isRetrying: false,
      }));
    }
  }, [state.errors, isOnline, safeSetErrorState, removeError]);

  const retryFailedOperations = useCallback(async () => {
    if (!isOnline || state.errors.length === 0) return;

    safeSetErrorState(prev => ({ ...prev, isRetrying: true }));

    // Retry operations with exponential backoff
    for (const error of state.errors) {
      if (error.retryCount < error.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between retries
        retryOperation(error.id);
      }
    }
  }, [isOnline, state.errors, safeSetErrorState, retryOperation]);

  const clearAllErrors = useCallback(() => {
    state.errors.forEach(error => {
      notification.close(error.id);
    });

    safeSetErrorState({
      errors: [],
      isRetrying: false,
      retryQueue: [],
    });

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, [state.errors, safeSetErrorState]);

  const handleApiError = useCallback((
    error: Error,
    operation: () => Promise<any>,
    context: string = 'API call'
  ) => {
    if (!isOnline) {
      return addOfflineError(
        `${context} thất bại khi offline: ${error.message}`,
        operation,
        {
          maxRetries: 5,
          onSuccess: () => {
            console.log(`${context} succeeded after reconnection`);
          },
          onFailure: (finalError) => {
            console.error(`${context} failed permanently:`, finalError);
          },
        }
      );
    } else {
      // Online error - show immediate notification
      notification.error({
        message: `Lỗi ${context}`,
        description: error.message,
        duration: 5,
        placement: 'topRight',
      });
      return null;
    }
  }, [isOnline, addOfflineError]);

  const getConnectionStatus = useCallback(() => {
    if (!isOnline) {
      return {
        status: 'offline',
        message: 'Không có kết nối mạng',
        color: '#ff4d4f',
      };
    }

    if (networkType === 'wifi') {
      return {
        status: 'online-wifi',
        message: 'Kết nối WiFi',
        color: '#52c41a',
      };
    }

    if (networkType === 'cellular') {
      const quality = effectiveType === '4g' ? 'tốt' : 
                     effectiveType === '3g' ? 'trung bình' : 'chậm';
      return {
        status: 'online-cellular',
        message: `Kết nối di động ${effectiveType?.toUpperCase() || ''} (${quality})`,
        color: effectiveType === '4g' ? '#52c41a' : 
               effectiveType === '3g' ? '#faad14' : '#ff7a45',
      };
    }

    return {
      status: 'online-unknown',
      message: 'Kết nối mạng',
      color: '#52c41a',
    };
  }, [isOnline, networkType, effectiveType]);

  return {
    ...state,
    addOfflineError,
    removeError,
    retryOperation,
    retryFailedOperations,
    clearAllErrors,
    handleApiError,
    getConnectionStatus,
    isOnline,
    networkType,
    effectiveType,
  };
}

export default useOfflineErrorHandling;