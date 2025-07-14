// Offline synchronization service for POS operations
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { apiClient } from '../api/client';

export interface QueueItem {
  id: string;
  type: 'order' | 'customer' | 'product' | 'inventory';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

interface OfflineDB extends DBSchema {
  'sync-queue': {
    key: string;
    value: QueueItem;
  };
  'offline-orders': {
    key: string;
    value: any;
  };
  'offline-customers': {
    key: string;
    value: any;
  };
}

class OfflineSyncService {
  private db: IDBPDatabase<OfflineDB> | null = null;
  private syncInterval: NodeJS.Timeout | null = null;
  private isOnline: boolean = navigator.onLine;

  async init() {
    try {
      this.db = await openDB<OfflineDB>('offline-sync-db', 1, {
        upgrade(db) {
          // Create sync queue store
          if (!db.objectStoreNames.contains('sync-queue')) {
            const queueStore = db.createObjectStore('sync-queue', { keyPath: 'id' });
            queueStore.createIndex('status', 'status');
            queueStore.createIndex('timestamp', 'timestamp');
          }

          // Create offline stores
          if (!db.objectStoreNames.contains('offline-orders')) {
            db.createObjectStore('offline-orders', { keyPath: 'id' });
          }

          if (!db.objectStoreNames.contains('offline-customers')) {
            db.createObjectStore('offline-customers', { keyPath: 'id' });
          }
        },
      });

      // Listen for online/offline events
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));

      // Start sync if online
      if (this.isOnline) {
        this.startSync();
      }

      console.log('Offline sync service initialized');
    } catch (error) {
      console.error('Failed to initialize offline sync service:', error);
    }
  }

  private handleOnline() {
    this.isOnline = true;
    console.log('Device came online - starting sync');
    this.startSync();
  }

  private handleOffline() {
    this.isOnline = false;
    console.log('Device went offline - stopping sync');
    this.stopSync();
  }

  private startSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // Sync immediately
    this.processQueue();

    // Then sync every 30 seconds
    this.syncInterval = setInterval(() => {
      this.processQueue();
    }, 30000);
  }

  private stopSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async addToQueue(item: Omit<QueueItem, 'id' | 'timestamp' | 'retryCount' | 'status'>): Promise<string> {
    if (!this.db) {
      throw new Error('Offline sync service not initialized');
    }

    const queueItem: QueueItem = {
      ...item,
      id: `${item.type}_${item.action}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending',
    };

    try {
      await this.db.add('sync-queue', queueItem);
      console.log('Added item to sync queue:', queueItem.id);
      
      // Try to sync immediately if online
      if (this.isOnline) {
        this.processQueue();
      }

      return queueItem.id;
    } catch (error) {
      console.error('Failed to add item to sync queue:', error);
      throw error;
    }
  }

  async getQueueItems(status?: QueueItem['status']): Promise<QueueItem[]> {
    if (!this.db) {
      return [];
    }

    try {
      if (status) {
        return await this.db.getAllFromIndex('sync-queue', 'status', status);
      } else {
        return await this.db.getAll('sync-queue');
      }
    } catch (error) {
      console.error('Failed to get queue items:', error);
      return [];
    }
  }

  async removeFromQueue(itemId: string): Promise<void> {
    if (!this.db) {
      return;
    }

    try {
      await this.db.delete('sync-queue', itemId);
      console.log('Removed item from sync queue:', itemId);
    } catch (error) {
      console.error('Failed to remove item from sync queue:', error);
    }
  }

  async updateQueueItem(itemId: string, updates: Partial<QueueItem>): Promise<void> {
    if (!this.db) {
      return;
    }

    try {
      const item = await this.db.get('sync-queue', itemId);
      if (item) {
        const updatedItem = { ...item, ...updates };
        await this.db.put('sync-queue', updatedItem);
      }
    } catch (error) {
      console.error('Failed to update queue item:', error);
    }
  }

  private async processQueue(): Promise<void> {
    if (!this.isOnline || !this.db) {
      return;
    }

    try {
      const pendingItems = await this.getQueueItems('pending');
      const failedItems = await this.getQueueItems('failed');
      
      // Process both pending and failed items (with retry logic)
      const itemsToProcess = [
        ...pendingItems,
        ...failedItems.filter(item => item.retryCount < 3)
      ];

      if (itemsToProcess.length === 0) {
        return;
      }

      console.log(`Processing ${itemsToProcess.length} sync queue items`);

      for (const item of itemsToProcess) {
        await this.processSyncItem(item);
      }
    } catch (error) {
      console.error('Error processing sync queue:', error);
    }
  }

  private async processSyncItem(item: QueueItem): Promise<void> {
    try {
      await this.updateQueueItem(item.id, { status: 'processing' });

      let success = false;
      let error: string | undefined;

      try {
        switch (item.type) {
          case 'order':
            success = await this.syncOrder(item);
            break;
          case 'customer':
            success = await this.syncCustomer(item);
            break;
          case 'product':
            success = await this.syncProduct(item);
            break;
          case 'inventory':
            success = await this.syncInventory(item);
            break;
          default:
            throw new Error(`Unknown sync item type: ${item.type}`);
        }
      } catch (err) {
        error = err instanceof Error ? err.message : 'Unknown error';
        success = false;
      }

      if (success) {
        await this.updateQueueItem(item.id, { status: 'completed' });
        // Remove completed items after 24 hours
        setTimeout(() => {
          this.removeFromQueue(item.id);
        }, 24 * 60 * 60 * 1000);
      } else {
        const retryCount = item.retryCount + 1;
        if (retryCount >= 3) {
          await this.updateQueueItem(item.id, {
            status: 'failed',
            retryCount,
            error: error || 'Max retries exceeded',
          });
        } else {
          await this.updateQueueItem(item.id, {
            status: 'failed',
            retryCount,
            error,
          });
        }
      }
    } catch (error) {
      console.error('Error processing sync item:', item.id, error);
    }
  }

  private async syncOrder(item: QueueItem): Promise<boolean> {
    try {
      switch (item.action) {
        case 'create':
          await apiClient.post('/api/pos/orders', item.data);
          break;
        case 'update':
          await apiClient.put(`/api/orders/${item.data.id}`, item.data);
          break;
        case 'delete':
          await apiClient.delete(`/api/orders/${item.data.id}`);
          break;
      }
      return true;
    } catch (error) {
      console.error('Order sync failed:', error);
      return false;
    }
  }

  private async syncCustomer(item: QueueItem): Promise<boolean> {
    try {
      switch (item.action) {
        case 'create':
          await apiClient.post('/api/customers', item.data);
          break;
        case 'update':
          await apiClient.put(`/api/customers/${item.data.id}`, item.data);
          break;
        case 'delete':
          await apiClient.delete(`/api/customers/${item.data.id}`);
          break;
      }
      return true;
    } catch (error) {
      console.error('Customer sync failed:', error);
      return false;
    }
  }

  private async syncProduct(item: QueueItem): Promise<boolean> {
    try {
      switch (item.action) {
        case 'create':
          await apiClient.post('/api/products', item.data);
          break;
        case 'update':
          await apiClient.put(`/api/products/${item.data.id}`, item.data);
          break;
        case 'delete':
          await apiClient.delete(`/api/products/${item.data.id}`);
          break;
      }
      return true;
    } catch (error) {
      console.error('Product sync failed:', error);
      return false;
    }
  }

  private async syncInventory(item: QueueItem): Promise<boolean> {
    try {
      switch (item.action) {
        case 'update':
          await apiClient.put(`/api/inventory/${item.data.productId}`, item.data);
          break;
      }
      return true;
    } catch (error) {
      console.error('Inventory sync failed:', error);
      return false;
    }
  }

  async clearQueue(): Promise<void> {
    if (!this.db) {
      return;
    }

    try {
      await this.db.clear('sync-queue');
      console.log('Sync queue cleared');
    } catch (error) {
      console.error('Failed to clear sync queue:', error);
    }
  }

  async getQueueStatus(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    if (!this.db) {
      return { pending: 0, processing: 0, completed: 0, failed: 0 };
    }

    try {
      const [pending, processing, completed, failed] = await Promise.all([
        this.getQueueItems('pending'),
        this.getQueueItems('processing'),
        this.getQueueItems('completed'),
        this.getQueueItems('failed'),
      ]);

      return {
        pending: pending.length,
        processing: processing.length,
        completed: completed.length,
        failed: failed.length,
      };
    } catch (error) {
      console.error('Failed to get queue status:', error);
      return { pending: 0, processing: 0, completed: 0, failed: 0 };
    }
  }

  destroy(): void {
    this.stopSync();
    
    window.removeEventListener('online', this.handleOnline.bind(this));
    window.removeEventListener('offline', this.handleOffline.bind(this));

    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Create singleton instance
export const offlineSyncService = new OfflineSyncService();

// Auto-initialize when imported
if (typeof window !== 'undefined') {
  offlineSyncService.init().catch(console.error);
}