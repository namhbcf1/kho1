// Comprehensive cleanup hook for useEffect hooks
import { useCallback, useEffect, useRef } from 'react';

export interface CleanupFunction {
  (): void;
}

export interface CleanupManager {
  addCleanup: (cleanup: CleanupFunction) => void;
  removeCleanup: (cleanup: CleanupFunction) => void;
  cleanup: () => void;
  isActive: () => boolean;
}

// Hook for managing multiple cleanup functions
export function useCleanupManager(): CleanupManager {
  const cleanupFunctions = useRef<Set<CleanupFunction>>(new Set());
  const isActiveRef = useRef(true);

  const addCleanup = useCallback((cleanup: CleanupFunction) => {
    if (isActiveRef.current) {
      cleanupFunctions.current.add(cleanup);
    }
  }, []);

  const removeCleanup = useCallback((cleanup: CleanupFunction) => {
    cleanupFunctions.current.delete(cleanup);
  }, []);

  const cleanup = useCallback(() => {
    for (const cleanupFn of cleanupFunctions.current) {
      try {
        cleanupFn();
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    }
    cleanupFunctions.current.clear();
  }, []);

  const isActive = useCallback(() => isActiveRef.current, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  return {
    addCleanup,
    removeCleanup,
    cleanup,
    isActive,
  };
}

// Hook for safe async operations with cleanup
export function useSafeAsync() {
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fix TypeScript generic syntax
  const safeSetState = useCallback(function<T>(setter: (value: T) => void) {
    return function(value: T) {
      if (isMountedRef.current) {
        setter(value);
      }
    };
  }, []);

  const isMounted = useCallback(() => isMountedRef.current, []);

  return {
    safeSetState,
    isMounted,
  };
}

// Hook for managing intervals with automatic cleanup
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update callback ref when callback changes
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval
  useEffect(() => {
    function tick() {
      savedCallback.current();
    }

    if (delay !== null) {
      intervalRef.current = setInterval(tick, delay);
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [delay]);

  // Manual cleanup function
  const clearCurrentInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  return clearCurrentInterval;
}

// Hook for managing timeouts with automatic cleanup
export function useTimeout(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update callback ref when callback changes
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the timeout
  useEffect(() => {
    if (delay !== null) {
      timeoutRef.current = setTimeout(() => {
        savedCallback.current();
      }, delay);

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };
    }
  }, [delay]);

  // Manual cleanup function
  const clearCurrentTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return clearCurrentTimeout;
}

// Hook for managing event listeners with automatic cleanup
export function useEventListener<T extends keyof WindowEventMap>(
  event: T,
  handler: (event: WindowEventMap[T]) => void,
  element: Window | Document | Element = window,
  options?: boolean | AddEventListenerOptions
) {
  const savedHandler = useRef(handler);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!element || !element.addEventListener) return;

    const eventListener = (event: Event) => {
      savedHandler.current(event as WindowEventMap[T]);
    };

    element.addEventListener(event, eventListener, options);

    return () => {
      element.removeEventListener(event, eventListener, options);
    };
  }, [event, element, options]);
}

// Hook for managing AbortController with automatic cleanup
export function useAbortController() {
  const controllerRef = useRef<AbortController | null>(null);

  const createController = useCallback(() => {
    // Abort previous controller if it exists
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    
    controllerRef.current = new AbortController();
    return controllerRef.current;
  }, []);

  const abort = useCallback((reason?: string) => {
    if (controllerRef.current) {
      controllerRef.current.abort(reason);
      controllerRef.current = null;
    }
  }, []);

  const getSignal = useCallback(() => {
    return controllerRef.current?.signal;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abort('Component unmounted');
    };
  }, [abort]);

  return {
    createController,
    abort,
    getSignal,
    get signal() {
      return controllerRef.current?.signal;
    },
  };
}

// Hook for managing WebSocket connections with proper cleanup
export function useWebSocketCleanup(url: string | null, enabled: boolean = true) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const cleanup = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'Component cleanup');
      wsRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!url || !enabled || !isMountedRef.current) return;

    cleanup(); // Clean up existing connection

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected:', url);
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        wsRef.current = null;
        
        // Auto-reconnect if not a normal closure and component is still mounted
        if (event.code !== 1000 && isMountedRef.current && enabled) {
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              connect();
            }
          }, 5000);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Failed to create WebSocket:', error);
    }
  }, [url, enabled, cleanup]);

  useEffect(() => {
    if (enabled && url) {
      connect();
    } else {
      cleanup();
    }
  }, [url, enabled, connect, cleanup]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  return {
    websocket: wsRef.current,
    reconnect: connect,
    disconnect: cleanup,
  };
}

// Enhanced cleanup hook specifically for dashboard components
export function useDashboardCleanup() {
  const cleanupManager = useCleanupManager();
  const { safeSetState, isMounted } = useSafeAsync();
  const abortController = useAbortController();

  // Fix TypeScript generic syntax
  const safeAsyncOperation = useCallback(function<T>(
    operation: (signal: AbortSignal) => Promise<T>,
    onSuccess?: (result: T) => void,
    onError?: (error: Error) => void
  ) {
    if (!isMounted()) return;

    const controller = abortController.createController();
    
    return (async () => {
      try {
        const result = await operation(controller.signal);
        
        if (!controller.signal.aborted && isMounted()) {
          onSuccess?.(result);
        }
        return result;
      } catch (error) {
        if (!controller.signal.aborted && isMounted()) {
          onError?.(error instanceof Error ? error : new Error(String(error)));
        }
        throw error;
      }
    })();
  }, [isMounted, abortController]);

  return {
    ...cleanupManager,
    safeSetState,
    isMounted,
    safeAsyncOperation,
    abortSignal: abortController.signal,
  };
}

export default useCleanupManager;