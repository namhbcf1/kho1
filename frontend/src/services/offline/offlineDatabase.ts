// IndexedDB service for offline functionality
import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Database schema definition
interface POSOfflineDB extends DBSchema {
  transactions: {
    key: string;
    value: {
      id: string;
      orderId: string;
      customerId?: string;
      items: Array<{
        productId: string;
        name: string;
        price: number;
        quantity: number;
        unit: string;
        vatRate: number;
      }>;
      subtotal: number;
      vatAmount: number;
      total: number;
      paymentMethod: 'cash' | 'vnpay' | 'momo' | 'zalopay' | 'card';
      paymentData?: any;
      customerInfo?: {
        name: string;
        phone: string;
        email?: string;
        address?: string;
      };
      status: 'pending' | 'synced' | 'failed';
      createdAt: string;
      syncedAt?: string;
      retryCount: number;
      errorMessage?: string;
    };
    indexes: { 
      'by-status': string; 
      'by-created': string;
      'by-customer': string;
    };
  };
  
  products: {
    key: string;
    value: {
      id: string;
      name: string;
      sku: string;
      barcode?: string;
      price: number;
      sellPrice: number;
      costPrice: number;
      stock: number;
      minStock: number;
      categoryId: string;
      categoryName: string;
      unit: string;
      vatRate: number;
      images: string[];
      isActive: boolean;
      lastSynced: string;
    };
    indexes: { 
      'by-category': string; 
      'by-barcode': string;
      'by-name': string;
    };
  };
  
  customers: {
    key: string;
    value: {
      id: string;
      name: string;
      phone: string;
      email?: string;
      loyaltyTier: string;
      loyaltyPoints: number;
      totalSpent: number;
      lastSynced: string;
    };
    indexes: { 
      'by-phone': string; 
      'by-loyalty': string;
    };
  };
  
  inventory: {
    key: string;
    value: {
      productId: string;
      type: 'sale' | 'adjustment' | 'sync';
      quantity: number;
      previousStock: number;
      newStock: number;
      reference?: string;
      createdAt: string;
      synced: boolean;
    };
    indexes: { 
      'by-product': string; 
      'by-synced': boolean;
      'by-created': string;
    };
  };
  
  syncQueue: {
    key: string;
    value: {
      id: string;
      type: 'transaction' | 'inventory' | 'customer' | 'product';
      action: 'create' | 'update' | 'delete';
      data: any;
      priority: 'high' | 'medium' | 'low';
      retryCount: number;
      lastAttempt?: string;
      createdAt: string;
    };
    indexes: { 
      'by-type': string; 
      'by-priority': string;
      'by-retry': number;
    };
  };
  
  settings: {
    key: string;
    value: {
      key: string;
      value: any;
      lastUpdated: string;
    };
  };
}

class OfflineDatabase {
  private db: IDBPDatabase<POSOfflineDB> | null = null;
  private readonly DB_NAME = 'POSOfflineDB';
  private readonly DB_VERSION = 1;

  async initialize(): Promise<void> {
    try {
      this.db = await openDB<POSOfflineDB>(this.DB_NAME, this.DB_VERSION, {
        upgrade(db) {
          // Transactions store
          if (!db.objectStoreNames.contains('transactions')) {
            const transactionStore = db.createObjectStore('transactions', { keyPath: 'id' });
            transactionStore.createIndex('by-status', 'status');
            transactionStore.createIndex('by-created', 'createdAt');
            transactionStore.createIndex('by-customer', 'customerId');
          }

          // Products store
          if (!db.objectStoreNames.contains('products')) {
            const productStore = db.createObjectStore('products', { keyPath: 'id' });
            productStore.createIndex('by-category', 'categoryId');
            productStore.createIndex('by-barcode', 'barcode');
            productStore.createIndex('by-name', 'name');
          }

          // Customers store
          if (!db.objectStoreNames.contains('customers')) {
            const customerStore = db.createObjectStore('customers', { keyPath: 'id' });
            customerStore.createIndex('by-phone', 'phone');
            customerStore.createIndex('by-loyalty', 'loyaltyTier');
          }

          // Inventory transactions store
          if (!db.objectStoreNames.contains('inventory')) {
            const inventoryStore = db.createObjectStore('inventory', { keyPath: 'id', autoIncrement: true });
            inventoryStore.createIndex('by-product', 'productId');
            inventoryStore.createIndex('by-synced', 'synced');
            inventoryStore.createIndex('by-created', 'createdAt');
          }

          // Sync queue store
          if (!db.objectStoreNames.contains('syncQueue')) {
            const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
            syncStore.createIndex('by-type', 'type');
            syncStore.createIndex('by-priority', 'priority');
            syncStore.createIndex('by-retry', 'retryCount');
          }

          // Settings store
          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings', { keyPath: 'key' });
          }
        },
      });
    } catch (error) {
      console.error('Failed to initialize offline database:', error);
      throw error;
    }
  }

  private ensureDB(): IDBPDatabase<POSOfflineDB> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  // Transaction methods
  async saveOfflineTransaction(transaction: POSOfflineDB['transactions']['value']): Promise<void> {
    const db = this.ensureDB();
    await db.add('transactions', transaction);
    
    // Add to sync queue
    await this.addToSyncQueue({
      id: `transaction_${transaction.id}`,
      type: 'transaction',
      action: 'create',
      data: transaction,
      priority: 'high',
      retryCount: 0,
      createdAt: new Date().toISOString()
    });
  }

  async getPendingTransactions(): Promise<POSOfflineDB['transactions']['value'][]> {
    const db = this.ensureDB();
    return await db.getAllFromIndex('transactions', 'by-status', 'pending');
  }

  async updateTransactionStatus(id: string, status: 'synced' | 'failed', errorMessage?: string): Promise<void> {
    const db = this.ensureDB();
    const transaction = await db.get('transactions', id);
    if (transaction) {
      transaction.status = status;
      transaction.syncedAt = new Date().toISOString();
      if (errorMessage) {
        transaction.errorMessage = errorMessage;
        transaction.retryCount += 1;
      }
      await db.put('transactions', transaction);
    }
  }

  // Product methods
  async saveProducts(products: POSOfflineDB['products']['value'][]): Promise<void> {
    const db = this.ensureDB();
    const tx = db.transaction('products', 'readwrite');
    
    for (const product of products) {
      product.lastSynced = new Date().toISOString();
      await tx.store.put(product);
    }
    
    await tx.done;
  }

  async getProducts(): Promise<POSOfflineDB['products']['value'][]> {
    const db = this.ensureDB();
    return await db.getAll('products');
  }

  async getProductByBarcode(barcode: string): Promise<POSOfflineDB['products']['value'] | undefined> {
    const db = this.ensureDB();
    return await db.getFromIndex('products', 'by-barcode', barcode);
  }

  async searchProducts(query: string): Promise<POSOfflineDB['products']['value'][]> {
    const db = this.ensureDB();
    const allProducts = await db.getAll('products');
    
    return allProducts.filter(product => 
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.sku.toLowerCase().includes(query.toLowerCase()) ||
      product.barcode?.includes(query)
    );
  }

  async updateProductStock(productId: string, newStock: number, type: 'sale' | 'adjustment' = 'sale'): Promise<void> {
    const db = this.ensureDB();
    const product = await db.get('products', productId);
    
    if (product) {
      const previousStock = product.stock;
      product.stock = newStock;
      await db.put('products', product);

      // Record inventory transaction
      await db.add('inventory', {
        productId,
        type,
        quantity: newStock - previousStock,
        previousStock,
        newStock,
        createdAt: new Date().toISOString(),
        synced: false
      });
    }
  }

  // Customer methods
  async saveCustomers(customers: POSOfflineDB['customers']['value'][]): Promise<void> {
    const db = this.ensureDB();
    const tx = db.transaction('customers', 'readwrite');
    
    for (const customer of customers) {
      customer.lastSynced = new Date().toISOString();
      await tx.store.put(customer);
    }
    
    await tx.done;
  }

  async getCustomerByPhone(phone: string): Promise<POSOfflineDB['customers']['value'] | undefined> {
    const db = this.ensureDB();
    return await db.getFromIndex('customers', 'by-phone', phone);
  }

  async searchCustomers(query: string): Promise<POSOfflineDB['customers']['value'][]> {
    const db = this.ensureDB();
    const allCustomers = await db.getAll('customers');
    
    return allCustomers.filter(customer => 
      customer.name.toLowerCase().includes(query.toLowerCase()) ||
      customer.phone.includes(query)
    );
  }

  // Sync queue methods
  async addToSyncQueue(item: POSOfflineDB['syncQueue']['value']): Promise<void> {
    const db = this.ensureDB();
    await db.add('syncQueue', item);
  }

  async getSyncQueue(limit = 50): Promise<POSOfflineDB['syncQueue']['value'][]> {
    const db = this.ensureDB();
    const allItems = await db.getAll('syncQueue');
    
    // Sort by priority and retry count
    return allItems
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.retryCount - b.retryCount;
      })
      .slice(0, limit);
  }

  async removeSyncQueueItem(id: string): Promise<void> {
    const db = this.ensureDB();
    await db.delete('syncQueue', id);
  }

  async updateSyncQueueItem(id: string, updates: Partial<POSOfflineDB['syncQueue']['value']>): Promise<void> {
    const db = this.ensureDB();
    const item = await db.get('syncQueue', id);
    if (item) {
      Object.assign(item, updates);
      await db.put('syncQueue', item);
    }
  }

  // Settings methods
  async getSetting(key: string): Promise<any> {
    const db = this.ensureDB();
    const setting = await db.get('settings', key);
    return setting?.value;
  }

  async setSetting(key: string, value: any): Promise<void> {
    const db = this.ensureDB();
    await db.put('settings', {
      key,
      value,
      lastUpdated: new Date().toISOString()
    });
  }

  // Cleanup methods
  async cleanupOldData(daysToKeep = 30): Promise<void> {
    const db = this.ensureDB();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffISO = cutoffDate.toISOString();

    // Clean up old synced transactions
    const transactions = await db.getAllFromIndex('transactions', 'by-status', 'synced');
    const oldTransactions = transactions.filter(t => t.syncedAt && t.syncedAt < cutoffISO);
    
    const tx = db.transaction('transactions', 'readwrite');
    for (const transaction of oldTransactions) {
      await tx.store.delete(transaction.id);
    }
    await tx.done;

    // Clean up old inventory records
    const allInventory = await db.getAll('inventory');
    const oldInventory = allInventory.filter(i => i.createdAt < cutoffISO && i.synced);
    
    const inventoryTx = db.transaction('inventory', 'readwrite');
    for (const inventory of oldInventory) {
      await inventoryTx.store.delete(inventory.id!);
    }
    await inventoryTx.done;
  }

  // Statistics methods
  async getOfflineStats(): Promise<{
    pendingTransactions: number;
    syncQueueSize: number;
    productsCount: number;
    customersCount: number;
    databaseSize: number;
  }> {
    const db = this.ensureDB();
    
    const [
      pendingTransactions,
      syncQueue,
      products,
      customers
    ] = await Promise.all([
      db.getAllFromIndex('transactions', 'by-status', 'pending'),
      db.getAll('syncQueue'),
      db.getAll('products'),
      db.getAll('customers')
    ]);

    // Estimate database size (rough calculation)
    const dataSize = JSON.stringify({ 
      pendingTransactions, 
      syncQueue, 
      products, 
      customers 
    }).length;

    return {
      pendingTransactions: pendingTransactions.length,
      syncQueueSize: syncQueue.length,
      productsCount: products.length,
      customersCount: customers.length,
      databaseSize: dataSize
    };
  }

  // Export/Import for backup
  async exportData(): Promise<{
    transactions: POSOfflineDB['transactions']['value'][];
    products: POSOfflineDB['products']['value'][];
    customers: POSOfflineDB['customers']['value'][];
    inventory: POSOfflineDB['inventory']['value'][];
    syncQueue: POSOfflineDB['syncQueue']['value'][];
    settings: POSOfflineDB['settings']['value'][];
    exportedAt: string;
  }> {
    const db = this.ensureDB();
    
    const [transactions, products, customers, inventory, syncQueue, settings] = await Promise.all([
      db.getAll('transactions'),
      db.getAll('products'),
      db.getAll('customers'),
      db.getAll('inventory'),
      db.getAll('syncQueue'),
      db.getAll('settings')
    ]);

    return {
      transactions,
      products,
      customers,
      inventory,
      syncQueue,
      settings,
      exportedAt: new Date().toISOString()
    };
  }

  async importData(data: Awaited<ReturnType<typeof this.exportData>>): Promise<void> {
    const db = this.ensureDB();
    
    // Clear existing data
    const stores = ['transactions', 'products', 'customers', 'inventory', 'syncQueue', 'settings'] as const;
    for (const storeName of stores) {
      await db.clear(storeName);
    }

    // Import new data
    const tx = db.transaction(stores, 'readwrite');
    
    for (const transaction of data.transactions) {
      await tx.objectStore('transactions').add(transaction);
    }
    
    for (const product of data.products) {
      await tx.objectStore('products').add(product);
    }
    
    for (const customer of data.customers) {
      await tx.objectStore('customers').add(customer);
    }
    
    for (const inventory of data.inventory) {
      await tx.objectStore('inventory').add(inventory);
    }
    
    for (const syncItem of data.syncQueue) {
      await tx.objectStore('syncQueue').add(syncItem);
    }
    
    for (const setting of data.settings) {
      await tx.objectStore('settings').add(setting);
    }
    
    await tx.done;
  }
}

export const offlineDatabase = new OfflineDatabase();