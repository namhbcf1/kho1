// Enhanced WebSocket Hook with Automatic Reconnection and Exponential Backoff
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { useDashboardCleanup } from './useCleanup';
import { RealTimeMessage, RealTimeChannels, RealTimeError } from '../types/realtime';

interface WebSocketOptions {
  url: string;
  protocols?: string | string[];
  maxReconnectAttempts?: number;
  reconnectInterval?: number;
  maxReconnectInterval?: number;
  reconnectDecay?: number;
  heartbeatInterval?: number;
  enableLogging?: boolean;
  autoReconnect?: boolean;
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (error: Event) => void;
  onMessage?: (message: RealTimeMessage) => void;
  onReconnect?: (attempt: number) => void;
  onMaxReconnectAttemptsReached?: () => void;
}

interface WebSocketState {
  websocket: WebSocket | null;
  connected: boolean;
  connecting: boolean;
  reconnectAttempts: number;
  lastReconnectTime: number;
  error: RealTimeError | null;
  latency: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  subscriptions: Set<RealTimeChannels>;
  messageQueue: RealTimeMessage[];
  lastHeartbeat: number;
}

export function useEnhancedWebSocket(options: WebSocketOptions) {
  const { isOnline } = useNetworkStatus();
  const { isMounted, safeAsyncOperation } = useDashboardCleanup();
  
  const {
    url,
    protocols,
    maxReconnectAttempts = 5,
    reconnectInterval = 1000,
    maxReconnectInterval = 30000,
    reconnectDecay = 1.5,
    heartbeatInterval = 30000,
    enableLogging = false,
    autoReconnect = true,
    onOpen,
    onClose,
    onError,
    onMessage,
    onReconnect,
    onMaxReconnectAttemptsReached
  } = options;

  const [state, setState] = useState<WebSocketState>({
    websocket: null,
    connected: false,
    connecting: false,
    reconnectAttempts: 0,
    lastReconnectTime: 0,
    error: null,
    latency: 0,
    quality: 'excellent',
    subscriptions: new Set(),
    messageQueue: [],
    lastHeartbeat: 0
  });

  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pingTimestampRef = useRef<number>(0);
  const messageQueueRef = useRef<RealTimeMessage[]>([]);

  const log = useCallback((message: string, data?: any) => {
    if (enableLogging) {
      console.log(`[WebSocket] ${message}`, data);
    }
  }, [enableLogging]);

  // Calculate current reconnect interval with exponential backoff
  const getCurrentReconnectInterval = useCallback(() => {
    const interval = Math.min(
      reconnectInterval * Math.pow(reconnectDecay, state.reconnectAttempts),
      maxReconnectInterval
    );
    return interval + Math.random() * 1000; // Add jitter
  }, [reconnectInterval, reconnectDecay, maxReconnectInterval, state.reconnectAttempts]);

  // Send message with queuing support
  const sendMessage = useCallback((message: RealTimeMessage) => {
    if (state.websocket && state.connected) {
      try {
        state.websocket.send(JSON.stringify(message));
        log('Message sent', message);
      } catch (error) {
        log('Failed to send message', { error, message });
        // Queue message for retry
        messageQueueRef.current.push(message);
      }
    } else {
      // Queue message for when connection is restored
      messageQueueRef.current.push(message);
      log('Message queued', message);
    }
  }, [state.websocket, state.connected, log]);

  // Process queued messages
  const processMessageQueue = useCallback(() => {
    if (messageQueueRef.current.length > 0 && state.websocket && state.connected) {
      const messages = [...messageQueueRef.current];
      messageQueueRef.current = [];
      
      messages.forEach(message => {
        try {
          state.websocket!.send(JSON.stringify(message));
          log('Queued message sent', message);
        } catch (error) {
          log('Failed to send queued message', { error, message });
          // Re-queue failed message
          messageQueueRef.current.push(message);
        }
      });
    }
  }, [state.websocket, state.connected, log]);

  // Send heartbeat ping
  const sendHeartbeat = useCallback(() => {
    if (state.websocket && state.connected) {
      pingTimestampRef.current = Date.now();
      sendMessage({
        type: 'ping',
        timestamp: new Date().toISOString()
      });
    }
  }, [state.websocket, state.connected, sendMessage]);

  // Handle heartbeat response
  const handleHeartbeat = useCallback((message: RealTimeMessage) => {
    if (message.type === 'pong' && pingTimestampRef.current > 0) {
      const latency = Date.now() - pingTimestampRef.current;
      let quality: WebSocketState['quality'] = 'excellent';
      
      if (latency > 1000) quality = 'poor';
      else if (latency > 500) quality = 'fair';
      else if (latency > 200) quality = 'good';

      setState(prev => ({
        ...prev,
        latency,
        quality,
        lastHeartbeat: Date.now()
      }));

      log('Heartbeat received', { latency, quality });
    }
  }, [log]);

  // Subscribe to channel
  const subscribe = useCallback((channel: RealTimeChannels) => {
    setState(prev => ({
      ...prev,
      subscriptions: new Set([...prev.subscriptions, channel])
    }));

    sendMessage({
      type: 'subscribe',
      channel,
      timestamp: new Date().toISOString()
    });

    log('Subscribed to channel', channel);
  }, [sendMessage, log]);

  // Unsubscribe from channel
  const unsubscribe = useCallback((channel: RealTimeChannels) => {
    setState(prev => {
      const newSubscriptions = new Set(prev.subscriptions);
      newSubscriptions.delete(channel);
      return {
        ...prev,
        subscriptions: newSubscriptions
      };
    });

    sendMessage({
      type: 'unsubscribe',
      channel,
      timestamp: new Date().toISOString()
    });

    log('Unsubscribed from channel', channel);
  }, [sendMessage, log]);

  // Clear timers
  const clearTimers = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
  }, []);

  // Connect WebSocket
  const connect = useCallback(() => {
    if (!isOnline || state.connecting || state.connected) {
      return;
    }

    setState(prev => ({
      ...prev,
      connecting: true,
      error: null
    }));

    log('Connecting to WebSocket', url);

    try {
      const ws = new WebSocket(url, protocols);
      
      ws.onopen = (event) => {
        log('WebSocket connected');
        
        setState(prev => ({
          ...prev,
          websocket: ws,
          connected: true,
          connecting: false,
          reconnectAttempts: 0,
          lastReconnectTime: Date.now(),
          error: null
        }));

        // Start heartbeat
        heartbeatTimerRef.current = setInterval(sendHeartbeat, heartbeatInterval);
        
        // Process queued messages
        processMessageQueue();
        
        // Re-subscribe to channels
        state.subscriptions.forEach(channel => {
          sendMessage({
            type: 'subscribe',
            channel,
            timestamp: new Date().toISOString()
          });
        });

        onOpen?.(event);
      };

      ws.onmessage = (event) => {
        try {
          const message: RealTimeMessage = JSON.parse(event.data);
          log('Message received', message);
          
          // Handle heartbeat
          if (message.type === 'pong') {
            handleHeartbeat(message);
          } else {
            onMessage?.(message);
          }
        } catch (error) {
          log('Failed to parse message', { error, data: event.data });
        }
      };

      ws.onclose = (event) => {
        log('WebSocket closed', { code: event.code, reason: event.reason });
        
        clearTimers();
        
        setState(prev => ({
          ...prev,
          websocket: null,
          connected: false,
          connecting: false
        }));

        onClose?.(event);

        // Auto-reconnect if enabled and not a normal closure
        if (autoReconnect && event.code !== 1000 && isOnline && isMounted()) {
          if (state.reconnectAttempts < maxReconnectAttempts) {
            const delay = getCurrentReconnectInterval();
            
            setState(prev => ({
              ...prev,
              reconnectAttempts: prev.reconnectAttempts + 1
            }));

            log('Scheduling reconnect', { attempt: state.reconnectAttempts + 1, delay });
            
            reconnectTimerRef.current = setTimeout(() => {
              if (isMounted()) {
                onReconnect?.(state.reconnectAttempts + 1);
                connect();
              }
            }, delay);
          } else {
            log('Max reconnect attempts reached');
            onMaxReconnectAttemptsReached?.();
          }
        }
      };

      ws.onerror = (error) => {
        log('WebSocket error', error);
        
        setState(prev => ({
          ...prev,
          error: {
            code: 'WEBSOCKET_ERROR',
            message: 'WebSocket connection error',
            timestamp: new Date().toISOString(),
            recoverable: true
          }
        }));

        onError?.(error);
      };

    } catch (error) {
      log('Failed to create WebSocket', error);
      
      setState(prev => ({
        ...prev,
        connecting: false,
        error: {
          code: 'CONNECTION_FAILED',
          message: 'Failed to create WebSocket connection',
          timestamp: new Date().toISOString(),
          recoverable: true
        }
      }));
    }
  }, [
    isOnline,
    state.connecting,
    state.connected,
    state.reconnectAttempts,
    state.subscriptions,
    url,
    protocols,
    maxReconnectAttempts,
    heartbeatInterval,
    autoReconnect,
    getCurrentReconnectInterval,
    sendHeartbeat,
    processMessageQueue,
    sendMessage,
    handleHeartbeat,
    onOpen,
    onClose,
    onError,
    onMessage,
    onReconnect,
    onMaxReconnectAttemptsReached,
    isMounted,
    log
  ]);

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    log('Disconnecting WebSocket');
    
    clearTimers();
    
    if (state.websocket) {
      state.websocket.close(1000, 'Manual disconnect');
    }
    
    setState(prev => ({
      ...prev,
      websocket: null,
      connected: false,
      connecting: false,
      reconnectAttempts: 0,
      subscriptions: new Set(),
      error: null
    }));

    // Clear message queue
    messageQueueRef.current = [];
  }, [state.websocket, clearTimers, log]);

  // Reconnect manually
  const reconnect = useCallback(() => {
    setState(prev => ({
      ...prev,
      reconnectAttempts: 0,
      error: null
    }));
    
    disconnect();
    
    setTimeout(() => {
      connect();
    }, 1000);
  }, [disconnect, connect]);

  // Effect for network status changes
  useEffect(() => {
    if (isOnline && !state.connected && !state.connecting && autoReconnect) {
      log('Network back online, reconnecting');
      connect();
    } else if (!isOnline && state.connected) {
      log('Network offline, disconnecting');
      disconnect();
    }
  }, [isOnline, state.connected, state.connecting, autoReconnect, connect, disconnect, log]);

  // Effect for initial connection
  useEffect(() => {
    if (isOnline && autoReconnect) {
      connect();
    }
    
    return () => {
      clearTimers();
      if (state.websocket) {
        state.websocket.close(1000, 'Component unmount');
      }
    };
  }, []);

  return {
    // Connection state
    connected: state.connected,
    connecting: state.connecting,
    reconnectAttempts: state.reconnectAttempts,
    error: state.error,
    
    // Quality metrics
    latency: state.latency,
    quality: state.quality,
    lastHeartbeat: state.lastHeartbeat,
    
    // Subscriptions
    subscriptions: Array.from(state.subscriptions),
    
    // Actions
    connect,
    disconnect,
    reconnect,
    sendMessage,
    subscribe,
    unsubscribe,
    
    // Message queue
    queuedMessages: messageQueueRef.current.length
  };
}

export default useEnhancedWebSocket;