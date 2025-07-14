// Production IndexedDB Service for Offline POS Transactions
// Handles offline storage and synchronization with server

interface DBSchema {
  offlineOrders: {
    key: string;
    value: OfflineOrder;
    indexes: {
      'by-timestamp': Date;
      'by-status': string;
      'by-cashier': string;
    };
  };
  offlineCustomers: {
    key: string;
    value: OfflineCustomer;
    indexes: {
      'by-phone': string;
      'by-email': string;
    };
  };
  offlineProducts: {
    key: string;
    value: OfflineProduct;
    indexes: {
      'by-barcode': string;
      'by-category': string;
    };
  };
  offlineInventory: {
    key: string;
    value: OfflineInventoryTransaction;
    indexes: {
      'by-timestamp': Date;
      'by-product': string;
    };
  };
  appSettings: {
    key: string;
    value: any;
  };
}

interface OfflineOrder {
  id: string;
  orderNumber: string;
  customerId?: string;
  cashierId: string;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    category: string;
  }>;
  subtotal: number;
  discount: number;
  vatAmount: number;
  exciseAmount: number;
  total: number;
  paymentMethod: string;
  paymentData: any;
  loyaltyPointsEarned: number;
  loyaltyPointsRedeemed: number;
  status: 'pending' | 'synced' | 'failed';
  createdAt: Date;
  syncedAt?: Date;
  lastSyncAttempt?: Date;
  syncRetryCount: number;
  syncError?: string;
}

interface OfflineCustomer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  loyaltyPoints: number;
  loyaltyTier: string;
  totalSpent: number;
  lastSyncedAt?: Date;
}

interface OfflineProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  minStock: number;
  barcode?: string;
  sku?: string;
  category: string;
  lastSyncedAt: Date;
}

interface OfflineInventoryTransaction {
  id: string;
  productId: string;
  type: 'sale' | 'adjustment' | 'restock';
  quantity: number;
  reason?: string;
  orderId?: string;
  timestamp: Date;
  synced: boolean;
}

class IndexedDBService {
  private db: IDBDatabase | null = null;
  private readonly dbName = 'KhoAugmentPOS';
  private readonly dbVersion = 2;
  private isInitialized = false;

  async init(): Promise<void> {
    if (this.isInitialized && this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.setupDatabase(db);
      };
    });
  }

  private setupDatabase(db: IDBDatabase): void {
    // Offline Orders Store
    if (!db.objectStoreNames.contains('offlineOrders')) {
      const ordersStore = db.createObjectStore('offlineOrders', { keyPath: 'id' });
      ordersStore.createIndex('by-timestamp', 'createdAt', { unique: false });
      ordersStore.createIndex('by-status', 'status', { unique: false });
      ordersStore.createIndex('by-cashier', 'cashierId', { unique: false });
    }

    // Offline Customers Store
    if (!db.objectStoreNames.contains('offlineCustomers')) {
      const customersStore = db.createObjectStore('offlineCustomers', { keyPath: 'id' });
      customersStore.createIndex('by-phone', 'phone', { unique: false });
      customersStore.createIndex('by-email', 'email', { unique: false });
    }

    // Offline Products Store
    if (!db.objectStoreNames.contains('offlineProducts')) {
      const productsStore = db.createObjectStore('offlineProducts', { keyPath: 'id' });
      productsStore.createIndex('by-barcode', 'barcode', { unique: false });
      productsStore.createIndex('by-category', 'category', { unique: false });
    }

    // Offline Inventory Transactions Store
    if (!db.objectStoreNames.contains('offlineInventory')) {
      const inventoryStore = db.createObjectStore('offlineInventory', { keyPath: 'id' });
      inventoryStore.createIndex('by-timestamp', 'timestamp', { unique: false });
      inventoryStore.createIndex('by-product', 'productId', { unique: false });
    }

    // App Settings Store
    if (!db.objectStoreNames.contains('appSettings')) {
      db.createObjectStore('appSettings', { keyPath: 'key' });
    }
  }

  private async getStore(storeName: keyof DBSchema, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    if (!this.db) {
      await this.init();
    }
    
    const transaction = this.db!.transaction([storeName], mode);
    return transaction.objectStore(storeName);
  }

  // Offline Orders Methods
  async addOfflineOrder(orderData: Omit<OfflineOrder, 'id' | 'orderNumber' | 'status' | 'createdAt' | 'syncRetryCount'>): Promise<OfflineOrder> {
    const order: OfflineOrder = {
      ...orderData,
      id: crypto.randomUUID(),
      orderNumber: this.generateOrderNumber(),
      status: 'pending',
      createdAt: new Date(),
      syncRetryCount: 0,
    };

    const store = await this.getStore('offlineOrders', 'readwrite');
    await this.promisifyRequest(store.add(order));

    // Update local inventory
    for (const item of order.items) {
      await this.updateLocalInventory(item.productId, -item.quantity, 'sale', order.id);
    }

    return order;
  }

  async getOfflineOrders(status?: 'pending' | 'synced' | 'failed'): Promise<OfflineOrder[]> {
    const store = await this.getStore('offlineOrders');
    
    if (status) {
      const index = store.index('by-status');
      const request = index.getAll(status);
      return this.promisifyRequest(request);
    } else {
      const request = store.getAll();
      return this.promisifyRequest(request);
    }
  }

  async updateOrderStatus(orderId: string, status: 'synced' | 'failed', syncError?: string): Promise<void> {
    const store = await this.getStore('offlineOrders', 'readwrite');
    const order = await this.promisifyRequest(store.get(orderId));
    
    if (order) {
      order.status = status;
      order.lastSyncAttempt = new Date();
      
      if (status === 'synced') {
        order.syncedAt = new Date();
      } else if (status === 'failed') {
        order.syncRetryCount += 1;
        order.syncError = syncError;
      }
      
      await this.promisifyRequest(store.put(order));
    }
  }

  async deleteOfflineOrder(orderId: string): Promise<void> {
    const store = await this.getStore('offlineOrders', 'readwrite');
    await this.promisifyRequest(store.delete(orderId));
  }

  // Offline Products Methods
  async syncProducts(products: OfflineProduct[]): Promise<void> {
    const store = await this.getStore('offlineProducts', 'readwrite');
    
    // Clear existing products
    await this.promisifyRequest(store.clear());
    
    // Add new products
    for (const product of products) {
      product.lastSyncedAt = new Date();
      await this.promisifyRequest(store.add(product));
    }
  }

  async getOfflineProducts(): Promise<OfflineProduct[]> {
    const store = await this.getStore('offlineProducts');
    const request = store.getAll();
    return this.promisifyRequest(request);
  }

  async getProductByBarcode(barcode: string): Promise<OfflineProduct | null> {
    const store = await this.getStore('offlineProducts');
    const index = store.index('by-barcode');
    const request = index.get(barcode);
    const result = await this.promisifyRequest(request);
    return result || null;
  }

  async updateProductStock(productId: string, newStock: number): Promise<void> {
    const store = await this.getStore('offlineProducts', 'readwrite');
    const product = await this.promisifyRequest(store.get(productId));
    
    if (product) {
      product.stock = newStock;
      await this.promisifyRequest(store.put(product));
    }
  }

  // Offline Customers Methods
  async syncCustomers(customers: OfflineCustomer[]): Promise<void> {
    const store = await this.getStore('offlineCustomers', 'readwrite');
    
    for (const customer of customers) {
      customer.lastSyncedAt = new Date();
      await this.promisifyRequest(store.put(customer));
    }
  }

  async getOfflineCustomers(): Promise<OfflineCustomer[]> {
    const store = await this.getStore('offlineCustomers');
    const request = store.getAll();
    return this.promisifyRequest(request);
  }

  async getCustomerByPhone(phone: string): Promise<OfflineCustomer | null> {
    const store = await this.getStore('offlineCustomers');
    const index = store.index('by-phone');
    const request = index.get(phone);
    const result = await this.promisifyRequest(request);
    return result || null;
  }

  async updateCustomerLoyalty(customerId: string, points: number, tier: string, totalSpent: number): Promise<void> {
    const store = await this.getStore('offlineCustomers', 'readwrite');
    const customer = await this.promisifyRequest(store.get(customerId));
    
    if (customer) {
      customer.loyaltyPoints = points;
      customer.loyaltyTier = tier;
      customer.totalSpent = totalSpent;
      await this.promisifyRequest(store.put(customer));
    }
  }

  // Inventory Tracking Methods
  async updateLocalInventory(productId: string, quantity: number, type: 'sale' | 'adjustment' | 'restock', orderId?: string): Promise<void> {
    // Record inventory transaction
    const transaction: OfflineInventoryTransaction = {
      id: crypto.randomUUID(),
      productId,
      type,
      quantity,
      orderId,
      timestamp: new Date(),
      synced: false,
    };

    const inventoryStore = await this.getStore('offlineInventory', 'readwrite');
    await this.promisifyRequest(inventoryStore.add(transaction));

    // Update product stock
    const productsStore = await this.getStore('offlineProducts', 'readwrite');
    const product = await this.promisifyRequest(productsStore.get(productId));
    
    if (product) {
      product.stock = Math.max(0, product.stock + quantity);
      await this.promisifyRequest(productsStore.put(product));
    }
  }

  async getInventoryTransactions(productId?: string): Promise<OfflineInventoryTransaction[]> {
    const store = await this.getStore('offlineInventory');
    
    if (productId) {
      const index = store.index('by-product');
      const request = index.getAll(productId);
      return this.promisifyRequest(request);
    } else {
      const request = store.getAll();
      return this.promisifyRequest(request);
    }
  }

  // Settings Methods
  async setSetting(key: string, value: any): Promise<void> {
    const store = await this.getStore('appSettings', 'readwrite');
    await this.promisifyRequest(store.put({ key, value }));
  }

  async getSetting(key: string): Promise<any> {
    const store = await this.getStore('appSettings');
    const result = await this.promisifyRequest(store.get(key));
    return result?.value;
  }

  // Sync Status Methods
  async getUnsyncedOrdersCount(): Promise<number> {
    const store = await this.getStore('offlineOrders');
    const index = store.index('by-status');
    const request = index.count('pending');
    return this.promisifyRequest(request);
  }

  async getLastSyncTime(): Promise<Date | null> {
    const timestamp = await this.getSetting('lastSyncTime');
    return timestamp ? new Date(timestamp) : null;
  }

  async setLastSyncTime(timestamp: Date): Promise<void> {
    await this.setSetting('lastSyncTime', timestamp.toISOString());
  }

  // Utility Methods
  private generateOrderNumber(): string {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const sequence = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    return `OF${year}${month}${day}${sequence}`;
  }

  private promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Cleanup Methods
  async clearOldSyncedOrders(olderThanDays: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const store = await this.getStore('offlineOrders', 'readwrite');
    const index = store.index('by-status');
    const request = index.openCursor('synced');

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        const order = cursor.value as OfflineOrder;
        if (order.syncedAt && order.syncedAt < cutoffDate) {
          cursor.delete();
        }
        cursor.continue();
      }
    };
  }

  async exportData(): Promise<string> {
    const data = {
      orders: await this.getOfflineOrders(),
      customers: await this.getOfflineCustomers(),
      products: await this.getOfflineProducts(),
      inventory: await this.getInventoryTransactions(),
      exportedAt: new Date().toISOString(),
    };

    return JSON.stringify(data, null, 2);
  }

  async getStorageUsage(): Promise<{ used: number; quota: number; percentage: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const percentage = quota > 0 ? (used / quota) * 100 : 0;
      
      return { used, quota, percentage };
    }
    
    return { used: 0, quota: 0, percentage: 0 };
  }
}

// Singleton instance
export const indexedDBService = new IndexedDBService();

// Initialize on import
indexedDBService.init().catch(console.error);

export default indexedDBService;
export type { OfflineOrder, OfflineCustomer, OfflineProduct, OfflineInventoryTransaction };
