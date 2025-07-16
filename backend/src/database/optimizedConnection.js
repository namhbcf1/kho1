/**
 * Optimized D1 Database Connection with Concurrent Write Handling
 * Fixes: D1 SQLite concurrent write limitations
 */
/**
 * Write Queue Manager - Handles concurrent writes to prevent conflicts
 */
class WriteQueueManager {
    writeQueue = [];
    isProcessing = false;
    maxRetries = 3;
    retryDelay = 100; // ms
    async addToQueue(operation) {
        return new Promise((resolve, reject) => {
            this.writeQueue.push({ operation, resolve, reject });
            this.processQueue();
        });
    }
    async processQueue() {
        if (this.isProcessing || this.writeQueue.length === 0) {
            return;
        }
        this.isProcessing = true;
        while (this.writeQueue.length > 0) {
            const { operation, resolve, reject } = this.writeQueue.shift();
            try {
                const result = await this.executeWithRetry(operation);
                resolve(result);
            }
            catch (error) {
                reject(error);
            }
        }
        this.isProcessing = false;
    }
    async executeWithRetry(operation) {
        let lastError;
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                return await operation();
            }
            catch (error) {
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
        throw lastError;
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
/**
 * Optimized Database Service
 */
export class OptimizedDatabaseService {
    db;
    writeQueue = new WriteQueueManager();
    constructor(db) {
        this.db = db;
    }
    /**
     * Execute read operations directly (no queueing needed)
     */
    async read(query, params = []) {
        try {
            const stmt = this.db.prepare(query);
            const result = await stmt.bind(...params).all();
            return result.results || [];
        }
        catch (error) {
            console.error('Database read error:', error);
            throw new Error('Database read failed');
        }
    }
    /**
     * Execute write operations through queue to prevent conflicts
     */
    async write(query, params = []) {
        return this.writeQueue.addToQueue(async () => {
            const stmt = this.db.prepare(query);
            return await stmt.bind(...params).run();
        });
    }
    /**
     * Execute multiple writes as a transaction
     */
    async transaction(operations) {
        return this.writeQueue.addToQueue(async () => {
            const statements = operations.map(op => this.db.prepare(op.query).bind(...op.params));
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
    async updateInventoryWithLock(productId, quantityChange) {
        return this.writeQueue.addToQueue(async () => {
            // Use optimistic locking with version field
            const currentProduct = await this.db.prepare('SELECT stock_quantity, version FROM products WHERE id = ?').bind(productId).first();
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
    static instance;
    static getInstance(env) {
        if (!this.instance) {
            this.instance = new OptimizedDatabaseService(env.DB);
        }
        return this.instance;
    }
}
// Export for use in handlers
export function createDatabaseService(env) {
    return DatabasePool.getInstance(env);
}
