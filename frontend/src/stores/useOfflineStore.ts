import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OfflineOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'product' | 'customer' | 'order' | 'cart';
  data: any;
  timestamp: string;
  synced: boolean;
}

interface OfflineStore {
  isOnline: boolean;
  pendingOperations: OfflineOperation[];
  syncInProgress: boolean;
  lastSyncTime: string | null;
  
  // Network status
  setOnlineStatus: (isOnline: boolean) => void;
  
  // Offline operations
  addOperation: (operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'synced'>) => void;
  removeOperation: (id: string) => void;
  markOperationSynced: (id: string) => void;
  clearSyncedOperations: () => void;
  
  // Sync management
  setSyncInProgress: (inProgress: boolean) => void;
  setLastSyncTime: (time: string) => void;
  
  // Getters
  getPendingOperations: () => OfflineOperation[];
  getOperationsByEntity: (entity: string) => OfflineOperation[];
  getUnsyncedCount: () => number;
}

export const useOfflineStore = create<OfflineStore>()(
  persist(
    (set, get) => ({
      isOnline: navigator.onLine,
      pendingOperations: [],
      syncInProgress: false,
      lastSyncTime: null,

      setOnlineStatus: (isOnline) => {
        set({ isOnline });
        
        // Auto-sync when coming back online
        if (isOnline && !get().syncInProgress && get().pendingOperations.length > 0) {
          get().startAutoSync();
        }
      },

      addOperation: (operation) => {
        const newOperation: OfflineOperation = {
          ...operation,
          id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          synced: false
        };

        set((state) => ({
          pendingOperations: [...state.pendingOperations, newOperation]
        }));

        // Try to sync immediately if online
        if (get().isOnline && !get().syncInProgress) {
          get().startAutoSync();
        }
      },

      removeOperation: (id) => {
        set((state) => ({
          pendingOperations: state.pendingOperations.filter(op => op.id !== id)
        }));
      },

      markOperationSynced: (id) => {
        set((state) => ({
          pendingOperations: state.pendingOperations.map(op =>
            op.id === id ? { ...op, synced: true } : op
          )
        }));
      },

      clearSyncedOperations: () => {
        set((state) => ({
          pendingOperations: state.pendingOperations.filter(op => !op.synced)
        }));
      },

      setSyncInProgress: (inProgress) => {
        set({ syncInProgress: inProgress });
      },

      setLastSyncTime: (time) => {
        set({ lastSyncTime: time });
      },

      getPendingOperations: () => {
        return get().pendingOperations.filter(op => !op.synced);
      },

      getOperationsByEntity: (entity) => {
        return get().pendingOperations.filter(op => op.entity === entity && !op.synced);
      },

      getUnsyncedCount: () => {
        return get().pendingOperations.filter(op => !op.synced).length;
      },

      // Auto-sync functionality
      startAutoSync: async () => {
        const state = get();
        if (!state.isOnline || state.syncInProgress) return;

        const pendingOps = state.getPendingOperations();
        if (pendingOps.length === 0) return;

        state.setSyncInProgress(true);

        try {
          // Group operations by entity for batch processing
          const groupedOps = pendingOps.reduce((groups, op) => {
            if (!groups[op.entity]) groups[op.entity] = [];
            groups[op.entity].push(op);
            return groups;
          }, {} as Record<string, OfflineOperation[]>);

          // Process each entity group
          for (const [entity, ops] of Object.entries(groupedOps)) {
            await state.syncEntityOperations(entity, ops);
          }

          state.setLastSyncTime(new Date().toISOString());
          state.clearSyncedOperations();
          
          console.log('Auto-sync completed successfully');
        } catch (error) {
          console.error('Auto-sync failed:', error);
        } finally {
          state.setSyncInProgress(false);
        }
      },

      syncEntityOperations: async (entity: string, operations: OfflineOperation[]) => {
        // This would integrate with your actual API
        // For now, we'll simulate the sync process
        
        for (const operation of operations) {
          try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // In real implementation, you would:
            // 1. Send the operation to your API
            // 2. Handle conflicts and errors
            // 3. Update local data if needed
            
            switch (operation.type) {
              case 'CREATE':
                console.log(`Syncing CREATE ${entity}:`, operation.data);
                break;
              case 'UPDATE':
                console.log(`Syncing UPDATE ${entity}:`, operation.data);
                break;
              case 'DELETE':
                console.log(`Syncing DELETE ${entity}:`, operation.data);
                break;
            }

            // Mark as synced
            get().markOperationSynced(operation.id);
          } catch (error) {
            console.error(`Failed to sync ${operation.type} operation for ${entity}:`, error);
            // Operation remains unsynced and will be retried
          }
        }
      }
    }),
    {
      name: 'offline-store',
      partialize: (state) => ({
        pendingOperations: state.pendingOperations,
        lastSyncTime: state.lastSyncTime
      })
    }
  )
);

// Hook to automatically handle online/offline status
export function useOfflineSync() {
  const { setOnlineStatus, isOnline, getUnsyncedCount, syncInProgress } = useOfflineStore();

  // Set up online/offline listeners
  React.useEffect(() => {
    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set initial status
    setOnlineStatus(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnlineStatus]);

  return {
    isOnline,
    unsyncedCount: getUnsyncedCount(),
    syncInProgress
  };
}