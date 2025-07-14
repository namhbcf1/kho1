// Store subscription manager for memory leak prevention and cleanup
import React, { useEffect, useRef, useCallback, useState } from 'react';
import { StoreApi, UseBoundStore } from 'zustand';

interface SubscriptionConfig {
  selector?: (state: any) => any;
  equalityFn?: (a: any, b: any) => boolean;
  fireImmediately?: boolean;
  once?: boolean;
}

interface ManagedSubscription {
  id: string;
  unsubscribe: () => void;
  selector: any;
  callback: any;
  config: SubscriptionConfig;
  createdAt: Date;
  lastCalled?: Date;
}

class StoreSubscriptionManager {
  private subscriptions = new Map<string, ManagedSubscription>();
  private componentSubscriptions = new Map<string, Set<string>>();
  private cleanupCallbacks = new Set<() => void>();

  // Generate unique subscription ID
  private generateId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Register a component for tracking
  registerComponent(componentId: string): () => void {
    if (!this.componentSubscriptions.has(componentId)) {
      this.componentSubscriptions.set(componentId, new Set());
    }

    return () => {
      this.cleanupComponent(componentId);
    };
  }

  // Subscribe to store with automatic cleanup
  subscribe<T>(
    store: UseBoundStore<StoreApi<T>>,
    selector: (state: T) => any,
    callback: (state: any) => void,
    config: SubscriptionConfig = {},
    componentId?: string
  ): () => void {
    const subscriptionId = this.generateId();
    
    // Create the actual subscription
    const unsubscribe = store.subscribe(
      selector,
      (state) => {
        const subscription = this.subscriptions.get(subscriptionId);
        if (subscription) {
          subscription.lastCalled = new Date();
          
          // If it's a one-time subscription, clean up after execution
          if (config.once) {
            this.unsubscribe(subscriptionId);
          }
        }
        callback(state);
      },
      {
        equalityFn: config.equalityFn,
        fireImmediately: config.fireImmediately,
      }
    );

    // Store subscription metadata
    const managedSubscription: ManagedSubscription = {
      id: subscriptionId,
      unsubscribe,
      selector,
      callback,
      config,
      createdAt: new Date(),
    };

    this.subscriptions.set(subscriptionId, managedSubscription);

    // Track by component if provided
    if (componentId) {
      if (!this.componentSubscriptions.has(componentId)) {
        this.componentSubscriptions.set(componentId, new Set());
      }
      this.componentSubscriptions.get(componentId)!.add(subscriptionId);
    }

    // Return cleanup function
    return () => {
      this.unsubscribe(subscriptionId);
    };
  }

  // Unsubscribe from a specific subscription
  private unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(subscriptionId);

      // Remove from component tracking
      for (const [componentId, subscriptionIds] of this.componentSubscriptions.entries()) {
        if (subscriptionIds.has(subscriptionId)) {
          subscriptionIds.delete(subscriptionId);
          if (subscriptionIds.size === 0) {
            this.componentSubscriptions.delete(componentId);
          }
          break;
        }
      }
    }
  }

  // Clean up all subscriptions for a component
  private cleanupComponent(componentId: string): void {
    const subscriptionIds = this.componentSubscriptions.get(componentId);
    if (subscriptionIds) {
      for (const subscriptionId of subscriptionIds) {
        this.unsubscribe(subscriptionId);
      }
      this.componentSubscriptions.delete(componentId);
    }
  }

  // Clean up stale subscriptions (not called recently)
  cleanupStale(maxAge: number = 5 * 60 * 1000): number {
    const now = new Date();
    const staleSubscriptions: string[] = [];

    for (const [id, subscription] of this.subscriptions.entries()) {
      const age = now.getTime() - subscription.createdAt.getTime();
      const lastCalledAge = subscription.lastCalled 
        ? now.getTime() - subscription.lastCalled.getTime()
        : age;

      if (age > maxAge && lastCalledAge > maxAge) {
        staleSubscriptions.push(id);
      }
    }

    staleSubscriptions.forEach(id => this.unsubscribe(id));
    return staleSubscriptions.length;
  }

  // Get subscription statistics
  getStats() {
    const now = new Date();
    const stats = {
      totalSubscriptions: this.subscriptions.size,
      componentCount: this.componentSubscriptions.size,
      subscriptionsByAge: {
        recent: 0,    // < 1 minute
        moderate: 0,  // 1-5 minutes
        old: 0,       // > 5 minutes
      },
      subscriptionsByActivity: {
        active: 0,    // Called in last minute
        idle: 0,      // Not called in last minute
        stale: 0,     // Not called in last 5 minutes
      },
    };

    for (const subscription of this.subscriptions.values()) {
      const age = now.getTime() - subscription.createdAt.getTime();
      const lastCalledAge = subscription.lastCalled 
        ? now.getTime() - subscription.lastCalled.getTime()
        : age;

      // Age categories
      if (age < 60000) stats.subscriptionsByAge.recent++;
      else if (age < 300000) stats.subscriptionsByAge.moderate++;
      else stats.subscriptionsByAge.old++;

      // Activity categories
      if (lastCalledAge < 60000) stats.subscriptionsByActivity.active++;
      else if (lastCalledAge < 300000) stats.subscriptionsByActivity.idle++;
      else stats.subscriptionsByActivity.stale++;
    }

    return stats;
  }

  // Clean up all subscriptions
  cleanup(): void {
    for (const subscription of this.subscriptions.values()) {
      subscription.unsubscribe();
    }
    this.subscriptions.clear();
    this.componentSubscriptions.clear();
    
    // Run registered cleanup callbacks
    for (const cleanup of this.cleanupCallbacks) {
      try {
        cleanup();
      } catch (error) {
        console.error('Cleanup callback error:', error);
      }
    }
    this.cleanupCallbacks.clear();
  }

  // Register a cleanup callback
  addCleanupCallback(callback: () => void): () => void {
    this.cleanupCallbacks.add(callback);
    return () => {
      this.cleanupCallbacks.delete(callback);
    };
  }
}

// Global subscription manager instance
export const subscriptionManager = new StoreSubscriptionManager();

// React hook for automatic subscription management
export function useStoreSubscription<T>(
  store: UseBoundStore<StoreApi<T>>,
  selector: (state: T) => any,
  callback: (state: any) => void,
  config: SubscriptionConfig = {}
): void {
  const componentIdRef = useRef<string>();
  const callbackRef = useRef(callback);
  const selectorRef = useRef(selector);

  // Update refs
  useEffect(() => {
    callbackRef.current = callback;
    selectorRef.current = selector;
  }, [callback, selector]);

  // Generate component ID on mount
  useEffect(() => {
    componentIdRef.current = `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const cleanup = subscriptionManager.registerComponent(componentIdRef.current);
    
    return cleanup;
  }, []);

  // Create subscription
  useEffect(() => {
    if (!componentIdRef.current) return;

    const unsubscribe = subscriptionManager.subscribe(
      store,
      selectorRef.current,
      callbackRef.current,
      config,
      componentIdRef.current
    );

    return unsubscribe;
  }, [store, config.fireImmediately, config.once, config.equalityFn]);
}

// Hook for subscription with automatic cleanup and dependency tracking
export function useStoreSelector<T, R>(
  store: UseBoundStore<StoreApi<T>>,
  selector: (state: T) => R,
  dependencies: any[] = []
): R {
  const [state, setState] = useState<R>(() => selector(store.getState()));
  const componentIdRef = useRef<string>();

  // Memoize selector to prevent unnecessary subscriptions
  const memoizedSelector = useCallback(selector, dependencies);

  useEffect(() => {
    componentIdRef.current = `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const cleanup = subscriptionManager.registerComponent(componentIdRef.current);
    
    return cleanup;
  }, []);

  useStoreSubscription(
    store,
    memoizedSelector,
    setState,
    { fireImmediately: true }
  );

  return state;
}

// Hook for conditional subscription (only subscribe when condition is met)
export function useConditionalStoreSubscription<T>(
  store: UseBoundStore<StoreApi<T>>,
  selector: (state: T) => any,
  callback: (state: any) => void,
  condition: boolean,
  config: SubscriptionConfig = {}
): void {
  const callbackRef = useRef(callback);
  const selectorRef = useRef(selector);
  const componentIdRef = useRef<string>();

  useEffect(() => {
    callbackRef.current = callback;
    selectorRef.current = selector;
  }, [callback, selector]);

  useEffect(() => {
    componentIdRef.current = `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const cleanup = subscriptionManager.registerComponent(componentIdRef.current);
    
    return cleanup;
  }, []);

  useEffect(() => {
    if (!condition || !componentIdRef.current) return;

    const unsubscribe = subscriptionManager.subscribe(
      store,
      selectorRef.current,
      callbackRef.current,
      config,
      componentIdRef.current
    );

    return unsubscribe;
  }, [condition, store, config.fireImmediately, config.once, config.equalityFn]);
}

// Hook for batch subscription updates
export function useBatchedStoreSubscription<T>(
  store: UseBoundStore<StoreApi<T>>,
  subscriptions: Array<{
    selector: (state: T) => any;
    callback: (state: any) => void;
    config?: SubscriptionConfig;
  }>
): void {
  const componentIdRef = useRef<string>();

  useEffect(() => {
    componentIdRef.current = `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const cleanup = subscriptionManager.registerComponent(componentIdRef.current);
    
    return cleanup;
  }, []);

  useEffect(() => {
    if (!componentIdRef.current) return;

    const unsubscribers = subscriptions.map(({ selector, callback, config = {} }) =>
      subscriptionManager.subscribe(
        store,
        selector,
        callback,
        config,
        componentIdRef.current
      )
    );

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [store, subscriptions]);
}

// Hook for subscription with debouncing
export function useDebouncedStoreSubscription<T>(
  store: UseBoundStore<StoreApi<T>>,
  selector: (state: T) => any,
  callback: (state: any) => void,
  delay: number = 300,
  config: SubscriptionConfig = {}
): void {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback((state: any) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callbackRef.current(state);
    }, delay);
  }, [delay]);

  useStoreSubscription(store, selector, debouncedCallback, config);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
}

// Setup automatic cleanup
if (typeof window !== 'undefined') {
  // Clean up stale subscriptions every 5 minutes
  const cleanupInterval = setInterval(() => {
    const cleaned = subscriptionManager.cleanupStale();
    if (cleaned > 0) {
      console.log(`Cleaned up ${cleaned} stale store subscriptions`);
    }
  }, 5 * 60 * 1000);

  // Clean up on page unload
  const handleUnload = () => {
    subscriptionManager.cleanup();
  };

  window.addEventListener('beforeunload', handleUnload);
  window.addEventListener('pagehide', handleUnload);

  // Add cleanup callback for interval
  subscriptionManager.addCleanupCallback(() => {
    clearInterval(cleanupInterval);
    window.removeEventListener('beforeunload', handleUnload);
    window.removeEventListener('pagehide', handleUnload);
  });
}

export default subscriptionManager;