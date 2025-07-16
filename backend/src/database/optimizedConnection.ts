/**
 * Optimized D1 Database Connection with Concurrent Write Handling
 * Fixes: D1 SQLite concurrent write limitations
 */

export interface DatabaseConnection {
  prepare(query: string): PreparedStatement;
  batch(statements: PreparedStatement[]): Promise<D1Result[]>;
  exec(query: string): Promise<D1ExecResult>;
}

export interface PreparedStatement {
  bind(...values: any[]): PreparedStatement;
  first<T = any>(): Promise<T | null>;
  all<T = any>(): Promise<D1Result<T>>;
  run(): Promise<D1Result>;
}

export interface D1Result<T = any> {
  results: T[];
  success: boolean;
  meta: {
    duration: number;
    rows_read: number;
    rows_written: number;
  };
}

export interface D1ExecResult {
  count: number;
  duration: number;
}

/**
 * Write Queue Manager - Handles concurrent writes to prevent conflicts
 */
class WriteQueueManager {
  private writeQueue: Array<{
    operation: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];
  
  private isProcessing = false;
  private readonly maxRetries = 3;
  private readonly retryDelay = 100; // ms

  async addToQueue<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.writeQueue.push({ operation, resolve, reject });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessing || this.writeQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.writeQueue.length > 0) {
      const { operation, resolve, reject } = this.writeQueue.shift()!;
      
      try {
        const result = await this.executeWithRetry(operation);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }

    this.isProcessing = false;
  }

  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        // Only retry on write conflicts
        if (error.message?.includes('database is locked') || 
            error.message?.includes('SQLITE_BUSY')) {
          await this.delay(this.retryDelay * attempt);
          continue;
        }
        
        throw error;
      }
    }

    throw lastError!;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Optimized Database Service
 */
export class OptimizedDatabaseService {
  private writeQueue = new WriteQueueManager();
  
  constructor(private db: DatabaseConnection) {}

  /**
   * Execute read operations directly (no queueing needed)
   */
  async read<T>(query: string, params: any[] = []): Promise<T[]> {
    try {
      const stmt = this.db.prepare(query);
      const result = await stmt.bind(...params).all<T>();
      return result.results || [];
    } catch (error) {
      console.error('Database read error:', error);
      throw new Error('Database read failed');
    }
  }

  /**
   * Execute write operations through queue to prevent conflicts
   */
  async write(query: string, params: any[] = []): Promise<any> {
    return this.writeQueue.addToQueue(async () => {
      const stmt = this.db.prepare(query);
      return await stmt.bind(...params).run();
    });
  }

  /**
   * Execute multiple writes as a transaction
   */
  async transaction(operations: Array<{ query: string; params: any[] }>): Promise<void> {
    return this.writeQueue.addToQueue(async () => {
      const statements = operations.map(op => 
        this.db.prepare(op.query).bind(...op.params)
      );
      
      const results = await this.db.batch(statements);
      
      // Check if all operations succeeded
      const failed = results.find(result => !result.success);
      if (failed) {
        throw new Error('Transaction failed');
      }
    });
  }

  /**
   * Optimized inventory update with conflict resolution
   */
  async updateInventoryWithLock(productId: number, quantityChange: number): Promise<boolean> {
    return this.writeQueue.addToQueue(async () => {
      // Use optimistic locking with version field
      const currentProduct = await this.db.prepare(
        'SELECT stock_quantity, version FROM products WHERE id = ?'
      ).bind(productId).first<{ stock_quantity: number; version: number }>();

      if (!currentProduct) {
        throw new Error('Product not found');
      }

      const newQuantity = currentProduct.stock_quantity + quantityChange;
      
      if (newQuantity < 0) {
        throw new Error('Insufficient inventory');
      }

      // Update with version check
      const result = await this.db.prepare(`
        UPDATE products 
        SET stock_quantity = ?, version = version + 1, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND version = ?
      `).bind(newQuantity, productId, currentProduct.version).run();

      if (result.meta.rows_written === 0) {
        throw new Error('Inventory update conflict - please retry');
      }

      return true;
    });
  }
}

/**
 * Connection Pool for better resource management
 */
export class DatabasePool {
  private static instance: OptimizedDatabaseService;

  static getInstance(env: { DB: DatabaseConnection }): OptimizedDatabaseService {
    if (!this.instance) {
      this.instance = new OptimizedDatabaseService(env.DB);
    }
    return this.instance;
  }
}

// Export for use in handlers
export function createDatabaseService(env: { DB: DatabaseConnection }): OptimizedDatabaseService {
  return DatabasePool.getInstance(env);
}