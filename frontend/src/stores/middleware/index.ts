// Enhanced Zustand middleware for persistence, sync, and error handling
import { StateCreator, StoreMutatorIdentifier } from 'zustand';
import { PersistOptions, createJSONStorage } from 'zustand/middleware';
import { StoreError, SyncMessage, OptimisticUpdate, StoreConfig } from '../types';

// Enhanced persist middleware with better error handling
export interface EnhancedPersistOptions<T> extends Omit<PersistOptions<T, T>, 'storage'> {
  storage?: any;
  encrypt?: boolean;
  compress?: boolean;
  errorHandler?: (error: Error) => void;
}

export const enhancedPersist = <T>(
  config: StateCreator<T>,
  options: EnhancedPersistOptions<T>
): StateCreator<T> => {
  const storage = createJSONStorage(() => {
    const baseStorage = options.storage || localStorage;
    
    return {
      getItem: async (key: string) => {
        try {
          const item = await baseStorage.getItem(key);
          if (!item) return null;
          
          // Decompress if needed
          const decompressed = options.compress ? await decompressData(item) : item;
          
          // Decrypt if needed
          const decrypted = options.encrypt ? await decryptData(decompressed) : decompressed;
          
          return JSON.parse(decrypted);
        } catch (error) {
          console.error(`Failed to get item ${key}:`, error);
          options.errorHandler?.(error as Error);
          return null;
        }
      },
      
      setItem: async (key: string, value: any) => {
        try {
          let data = JSON.stringify(value);
          
          // Encrypt if needed
          if (options.encrypt) {
            data = await encryptData(data);
          }
          
          // Compress if needed
          if (options.compress) {
            data = await compressData(data);
          }
          
          await baseStorage.setItem(key, data);
        } catch (error) {
          console.error(`Failed to set item ${key}:`, error);
          options.errorHandler?.(error as Error);
        }
      },
      
      removeItem: async (key: string) => {
        try {
          await baseStorage.removeItem(key);
        } catch (error) {
          console.error(`Failed to remove item ${key}:`, error);
          options.errorHandler?.(error as Error);
        }
      },
    };
  });

  return (set, get, api) => {
    const persistedConfig = {
      ...options,
      storage,
    };
    
    return config(set, get, api);
  };
};

// Cross-tab synchronization middleware
export interface SyncOptions {
  channel: string;
  enabled: boolean;
  debounceMs: number;
  syncKeys?: string[];
  onSyncReceived?: (message: SyncMessage) => void;
  onSyncError?: (error: Error) => void;
}

export const syncMiddleware = <T>(
  config: StateCreator<T>,
  options: SyncOptions
): StateCreator<T> => {
  if (!options.enabled) {
    return config;
  }

  return (set, get, api) => {
    const channel = new BroadcastChannel(options.channel);
    const sourceId = generateId();
    
    // Listen for sync messages
    channel.addEventListener('message', (event) => {
      try {
        const message: SyncMessage = event.data;
        
        // Ignore messages from same source
        if (message.source === sourceId) return;
        
        // Handle different message types
        switch (message.type) {
          case 'STATE_UPDATE':
            handleStateUpdate(message, set, get, options);
            break;
          case 'STATE_RESET':
            handleStateReset(message, set, get, options);
            break;
          case 'OPTIMISTIC_UPDATE':
            handleOptimisticUpdate(message, set, get, options);
            break;
          case 'ROLLBACK':
            handleRollback(message, set, get, options);
            break;
        }
        
        options.onSyncReceived?.(message);
      } catch (error) {
        console.error('Sync message handling error:', error);
        options.onSyncError?.(error as Error);
      }
    });

    // Enhanced set function with sync
    const syncedSet = (partial: any, replace?: boolean) => {
      set(partial, replace);
      
      // Broadcast state update
      if (shouldSync(partial, options)) {
        const message: SyncMessage = {
          type: 'STATE_UPDATE',
          storeName: options.channel,
          data: partial,
          timestamp: new Date(),
          source: sourceId,
        };
        
        debounce(() => {
          channel.postMessage(message);
        }, options.debounceMs)();
      }
    };

    // Cleanup on store destruction
    const originalDestroy = api.destroy;
    api.destroy = () => {
      channel.close();
      originalDestroy?.();
    };

    return config(syncedSet, get, api);
  };
};

// Error handling middleware
export interface ErrorHandlingOptions {
  enabled: boolean;
  maxRetries: number;
  retryDelay: number;
  onError?: (error: StoreError) => void;
  onRecovery?: () => void;
}

export const errorHandlingMiddleware = <T>(
  config: StateCreator<T>,
  options: ErrorHandlingOptions
): StateCreator<T> => {
  if (!options.enabled) {
    return config;
  }

  return (set, get, api) => {
    const errorHandlingSet = (partial: any, replace?: boolean) => {
      try {
        set(partial, replace);
      } catch (error) {
        const storeError: StoreError = {
          code: 'SET_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
          context: 'State update',
          retryable: true,
        };
        
        console.error('Store set error:', storeError);
        options.onError?.(storeError);
        
        // Add error to state
        set({ error: storeError.message } as any, false);
      }
    };

    return config(errorHandlingSet, get, api);
  };
};

// Optimistic updates middleware
export interface OptimisticUpdatesOptions {
  enabled: boolean;
  timeout: number;
  onRollback?: (update: OptimisticUpdate<any>) => void;
}

export const optimisticUpdatesMiddleware = <T>(
  config: StateCreator<T>,
  options: OptimisticUpdatesOptions
): StateCreator<T> => {
  if (!options.enabled) {
    return config;
  }

  const pendingUpdates = new Map<string, OptimisticUpdate<T>>();

  return (set, get, api) => {
    const optimisticSet = (partial: any, replace?: boolean) => {
      set(partial, replace);
    };

    // Add optimistic update methods to api
    (api as any).optimisticUpdate = <K extends keyof T>(
      key: K,
      newValue: T[K],
      asyncOperation: () => Promise<void>
    ) => {
      const updateId = generateId();
      const previousValue = get()[key];
      
      const update: OptimisticUpdate<T> = {
        id: updateId,
        key,
        previousValue,
        newValue,
        timestamp: new Date(),
        rollback: () => {
          set({ [key]: previousValue } as any, false);
          pendingUpdates.delete(updateId);
          options.onRollback?.(update);
        },
      };
      
      pendingUpdates.set(updateId, update);
      
      // Apply optimistic update
      set({ [key]: newValue } as any, false);
      
      // Execute async operation
      asyncOperation()
        .then(() => {
          // Success - remove from pending
          pendingUpdates.delete(updateId);
        })
        .catch((error) => {
          // Failure - rollback
          console.error('Optimistic update failed:', error);
          update.rollback();
        });
      
      // Auto-rollback after timeout
      setTimeout(() => {
        if (pendingUpdates.has(updateId)) {
          console.warn('Optimistic update timed out, rolling back');
          update.rollback();
        }
      }, options.timeout);
    };

    (api as any).rollbackOptimisticUpdate = (updateId: string) => {
      const update = pendingUpdates.get(updateId);
      if (update) {
        update.rollback();
      }
    };

    (api as any).getPendingUpdates = () => Array.from(pendingUpdates.values());

    return config(optimisticSet, get, api);
  };
};

// Memory cleanup middleware
export const cleanupMiddleware = <T>(
  config: StateCreator<T>
): StateCreator<T> => {
  return (set, get, api) => {
    const subscriptions = new Set<() => void>();
    const intervals = new Set<NodeJS.Timeout>();
    const timeouts = new Set<NodeJS.Timeout>();
    
    // Track subscriptions for cleanup
    const originalSubscribe = api.subscribe;
    api.subscribe = (selector: any, callback: any, options?: any) => {
      const unsubscribe = originalSubscribe(selector, callback, options);
      subscriptions.add(unsubscribe);
      
      return () => {
        subscriptions.delete(unsubscribe);
        unsubscribe();
      };
    };

    // Add cleanup utilities to api
    (api as any).addInterval = (interval: NodeJS.Timeout) => {
      intervals.add(interval);
    };

    (api as any).addTimeout = (timeout: NodeJS.Timeout) => {
      timeouts.add(timeout);
    };

    (api as any).cleanup = () => {
      // Clear all subscriptions
      subscriptions.forEach(unsubscribe => unsubscribe());
      subscriptions.clear();
      
      // Clear all intervals
      intervals.forEach(interval => clearInterval(interval));
      intervals.clear();
      
      // Clear all timeouts
      timeouts.forEach(timeout => clearTimeout(timeout));
      timeouts.clear();
    };

    // Auto-cleanup on destroy
    const originalDestroy = api.destroy;
    api.destroy = () => {
      (api as any).cleanup();
      originalDestroy?.();
    };

    return config(set, get, api);
  };
};

// Utility functions
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function shouldSync(partial: any, options: SyncOptions): boolean {
  if (!options.syncKeys) return true;
  
  const keys = Object.keys(partial);
  return keys.some(key => options.syncKeys!.includes(key));
}

function handleStateUpdate(message: SyncMessage, set: any, get: any, options: SyncOptions) {
  if (options.syncKeys) {
    const filteredData = Object.keys(message.data)
      .filter(key => options.syncKeys!.includes(key))
      .reduce((obj, key) => {
        obj[key] = message.data[key];
        return obj;
      }, {} as any);
    
    if (Object.keys(filteredData).length > 0) {
      set(filteredData, false);
    }
  } else {
    set(message.data, false);
  }
}

function handleStateReset(message: SyncMessage, set: any, get: any, options: SyncOptions) {
  set(message.data, true);
}

function handleOptimisticUpdate(message: SyncMessage, set: any, get: any, options: SyncOptions) {
  // Handle optimistic updates from other tabs
  set({ [message.data.key]: message.data.newValue }, false);
}

function handleRollback(message: SyncMessage, set: any, get: any, options: SyncOptions) {
  // Handle rollbacks from other tabs
  set({ [message.data.key]: message.data.previousValue }, false);
}

function debounce(func: Function, wait: number) {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Placeholder encryption/decryption functions
async function encryptData(data: string): Promise<string> {
  // Implement actual encryption if needed
  return btoa(data);
}

async function decryptData(data: string): Promise<string> {
  // Implement actual decryption if needed
  return atob(data);
}

async function compressData(data: string): Promise<string> {
  // Implement compression if needed (e.g., using CompressionStream)
  return data;
}

async function decompressData(data: string): Promise<string> {
  // Implement decompression if needed
  return data;
}

export default {
  enhancedPersist,
  syncMiddleware,
  errorHandlingMiddleware,
  optimisticUpdatesMiddleware,
  cleanupMiddleware,
};