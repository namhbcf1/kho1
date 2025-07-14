// Real-time data synchronization hook with WebSocket and polling fallback
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { useCleanupManager, useAbortController, useSafeAsync } from './useCleanup';

export interface RealTimeConfig {
  endpoint: string;
  pollInterval?: number;
  retryAttempts?: number;
  retryDelay?: number;
  enableWebSocket?: boolean;
  onData?: (data: any) => void;
  onError?: (error: Error) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export interface RealTimeState<T> {
  data: T | null;
  connected: boolean;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  reconnectAttempts: number;
}

export function useRealTimeData<T>(config: RealTimeConfig): RealTimeState<T> & {
  reconnect: () => void;
  disconnect: () => void;
  forceRefresh: () => void;
} {
  const { isOnline } = useNetworkStatus();
  const cleanupManager = useCleanupManager();
  const abortController = useAbortController();
  const { safeSetState, isMounted } = useSafeAsync();
  
  const [state, setState] = useState<RealTimeState<T>>({
    data: null,
    connected: false,
    loading: false,
    error: null,
    lastUpdated: null,
    reconnectAttempts: 0,
  });

  const safeSetState_state = safeSetState(setState);
  const wsRef = useRef<WebSocket | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    endpoint,
    pollInterval = 30000, // 30 seconds default
    retryAttempts = 5,
    retryDelay = 2000,
    enableWebSocket = true,
    onData,
    onError,
    onConnect,
    onDisconnect,
  } = config;

  // Enhanced cleanup function with abort controller
  const cleanup = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'Cleanup');
      wsRef.current = null;
    }
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    abortController.abort('Component cleanup');
  }, [abortController]);

  // Enhanced fetch data with abort controller and safe state updates
  const fetchData = useCallback(async () => {
    if (!isOnline || !isMounted()) return;

    const controller = abortController.createController();

    try {
      safeSetState_state(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!controller.signal.aborted && isMounted()) {
        safeSetState_state(prev => ({
          ...prev,
          data: data.data || data,
          loading: false,
          error: null,
          lastUpdated: new Date(),
          reconnectAttempts: 0,
        }));

        if (onData) {
          onData(data.data || data);
        }
      }
    } catch (error) {
      if (!controller.signal.aborted && isMounted()) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        safeSetState_state(prev => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));

        if (onError) {
          onError(error instanceof Error ? error : new Error(errorMessage));
        }
      }
    }
  }, [endpoint, isOnline, onData, onError, abortController, isMounted, safeSetState_state]);

  // Setup WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (!enableWebSocket || !isOnline || wsRef.current) return;

    try {
      const wsUrl = endpoint.replace(/^http/, 'ws') + '/ws';
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (mountedRef.current) {
          setState(prev => ({
            ...prev,
            connected: true,
            error: null,
            reconnectAttempts: 0,
          }));
          
          if (onConnect) {
            onConnect();
          }
        }
      };

      ws.onmessage = (event) => {
        if (mountedRef.current) {
          try {
            const data = JSON.parse(event.data);
            setState(prev => ({
              ...prev,
              data: data.data || data,
              lastUpdated: new Date(),
              error: null,
            }));

            if (onData) {
              onData(data.data || data);
            }
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        if (mountedRef.current) {
          setState(prev => ({
            ...prev,
            error: 'WebSocket connection error',
          }));
        }
      };

      ws.onclose = (event) => {
        if (mountedRef.current) {
          setState(prev => ({
            ...prev,
            connected: false,
          }));

          if (onDisconnect) {
            onDisconnect();
          }

          // Auto-reconnect if not a normal closure
          if (event.code !== 1000 && state.reconnectAttempts < retryAttempts) {
            retryTimeoutRef.current = setTimeout(() => {
              if (mountedRef.current) {
                setState(prev => ({
                  ...prev,
                  reconnectAttempts: prev.reconnectAttempts + 1,
                }));
                connectWebSocket();
              }
            }, retryDelay * Math.pow(2, state.reconnectAttempts));
          }
        }
        
        wsRef.current = null;
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      // Fallback to polling
      setupPolling();
    }
  }, [
    enableWebSocket,
    isOnline,
    endpoint,
    onConnect,
    onData,
    onDisconnect,
    retryAttempts,
    retryDelay,
    state.reconnectAttempts,
  ]);

  // Setup HTTP polling
  const setupPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    // Initial fetch
    fetchData();

    // Setup interval
    pollIntervalRef.current = setInterval(() => {
      fetchData();
    }, pollInterval);
  }, [fetchData, pollInterval]);

  // Manual reconnect
  const reconnect = useCallback(() => {
    cleanup();
    setState(prev => ({
      ...prev,
      reconnectAttempts: 0,
      error: null,
    }));

    if (enableWebSocket) {
      connectWebSocket();
    } else {
      setupPolling();
    }
  }, [cleanup, enableWebSocket, connectWebSocket, setupPolling]);

  // Manual disconnect
  const disconnect = useCallback(() => {
    cleanup();
    setState(prev => ({
      ...prev,
      connected: false,
      reconnectAttempts: 0,
    }));
  }, [cleanup]);

  // Force refresh
  const forceRefresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Register cleanup functions
  useEffect(() => {
    cleanupManager.addCleanup(cleanup);
    return () => {
      cleanupManager.removeCleanup(cleanup);
    };
  }, [cleanupManager, cleanup]);

  // Initialize connection
  useEffect(() => {
    if (!isOnline) {
      disconnect();
      return;
    }

    if (enableWebSocket) {
      connectWebSocket();
    } else {
      setupPolling();
    }

    return cleanup;
  }, [isOnline, enableWebSocket, connectWebSocket, setupPolling, cleanup]);

  return {
    ...state,
    reconnect,
    disconnect,
    forceRefresh,
  };
}

// Hook specifically for dashboard data
export function useDashboardRealTime() {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
  
  return useRealTimeData({
    endpoint: `${baseUrl}/analytics/dashboard`,
    pollInterval: 30000, // 30 seconds
    enableWebSocket: true,
    retryAttempts: 3,
    retryDelay: 2000,
  });
}

// Hook for real-time KPI updates
export function useKPIRealTime() {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
  
  return useRealTimeData({
    endpoint: `${baseUrl}/analytics/kpis`,
    pollInterval: 15000, // 15 seconds - more frequent for KPIs
    enableWebSocket: true,
    retryAttempts: 5,
    retryDelay: 1000,
  });
}

export default useRealTimeData;