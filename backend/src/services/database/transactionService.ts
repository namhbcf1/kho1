// Secure transaction service to prevent race conditions and ensure data consistency
import { D1Database } from '@cloudflare/workers-types';

export interface TransactionResult {
  success: boolean;
  data?: any;
  error?: string;
  retryCount?: number;
}

export interface InventoryUpdateData {
  productId: string;
  quantity: number;
  operation: 'add' | 'subtract' | 'set';
  orderId?: string;
  userId?: string;
  reason?: string;
}

export interface OrderCreationData {
  orderNumber: string;
  customerId?: string;
  cashierId: string;
  items: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    total: number;
  }[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  notes?: string;
}

export class TransactionService {
  private db: D1Database;
  private maxRetries = 3;
  private retryDelay = 100; // milliseconds

  constructor(db: D1Database) {
    this.db = db;
  }

  // Retry mechanism for handling database locks
  private async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.maxRetries
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Check if it's a database lock error
        if (error instanceof Error && error.message.includes('database is locked')) {
          if (attempt < maxRetries) {
            // Wait with exponential backoff
            const delay = this.retryDelay * Math.pow(2, attempt - 1);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        
        // If it's not a lock error or we've exhausted retries, throw immediately
        throw error;
      }
    }
    
    throw lastError || new Error('Transaction failed after retries');
  }

  // Atomic inventory update with optimistic locking
  async updateInventoryAtomic(updateData: InventoryUpdateData): Promise<TransactionResult> {
    return this.withRetry(async () => {
      const { productId, quantity, operation, orderId, userId, reason } = updateData;
      
      // Start transaction
      const statements = [];
      
      // First, get current stock with row-level locking
      const currentProduct = await this.db
        .prepare('SELECT id, name, stock, version FROM products WHERE id = ?')
        .bind(productId)
        .first();
      
      if (!currentProduct) {
        return {
          success: false,
          error: 'Product not found'
        };
      }
      
      const currentStock = (currentProduct as any).stock || 0;
      const currentVersion = (currentProduct as any).version || 0;
      let newStock: number;
      
      switch (operation) {
        case 'add':
          newStock = currentStock + quantity;
          break;
        case 'subtract':
          newStock = Math.max(0, currentStock - quantity);
          if (currentStock < quantity) {
            return {
              success: false,
              error: `Insufficient stock. Available: ${currentStock}, Requested: ${quantity}`
            };
          }
          break;
        case 'set':
          newStock = quantity;
          break;
        default:
          return {
            success: false,
            error: 'Invalid operation'
          };
      }
      
      // Update product stock with optimistic locking
      statements.push(
        this.db.prepare(`
          UPDATE products 
          SET stock = ?, version = version + 1, updated_at = datetime('now')
          WHERE id = ? AND version = ?
        `).bind(newStock, productId, currentVersion)
      );
      
      // Create inventory transaction record
      statements.push(
        this.db.prepare(`
          INSERT INTO inventory_transactions (
            id, product_id, type, quantity, previous_stock, new_stock,
            reference_type, reference_id, reason, created_by, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `).bind(
          crypto.randomUUID(),
          productId,
          operation === 'add' ? 'in' : 'out',
          operation === 'add' ? quantity : -quantity,
          currentStock,
          newStock,
          orderId ? 'order' : 'adjustment',
          orderId || crypto.randomUUID(),
          reason || `Stock ${operation}`,
          userId || 'system'
        )
      );
      
      // Execute transaction
      const results = await this.db.batch(statements);
      
      // Check if optimistic lock failed
      const updateResult = results[0];
      if (updateResult.meta?.changes === 0) {
        // Version conflict - stock was modified by another transaction
        throw new Error('Stock was modified by another transaction, retrying...');
      }
      
      // Verify all statements succeeded
      const allSucceeded = results.every(result => result.success);
      
      if (!allSucceeded) {
        return {
          success: false,
          error: 'Transaction failed'
        };
      }
      
      return {
        success: true,
        data: {
          productId,
          previousStock: currentStock,
          newStock,
          operation,
          quantity
        }
      };
    });
  }

  // Atomic order creation with inventory reservation
  async createOrderAtomic(orderData: OrderCreationData): Promise<TransactionResult> {
    return this.withRetry(async () => {
      const orderId = crypto.randomUUID();
      const statements = [];
      
      // First, verify all products exist and have sufficient stock
      const stockChecks = [];
      for (const item of orderData.items) {
        const product = await this.db
          .prepare('SELECT id, name, stock, version FROM products WHERE id = ? AND active = 1')
          .bind(item.productId)
          .first();
        
        if (!product) {
          return {
            success: false,
            error: `Product not found: ${item.productId}`
          };
        }
        
        const currentStock = (product as any).stock || 0;
        if (currentStock < item.quantity) {
          return {
            success: false,
            error: `Insufficient stock for ${(product as any).name}. Available: ${currentStock}, Requested: ${item.quantity}`
          };
        }
        
        stockChecks.push({
          productId: item.productId,
          productName: (product as any).name,
          currentStock,
          requestedQuantity: item.quantity,
          version: (product as any).version || 0
        });
      }
      
      // Create order record
      statements.push(
        this.db.prepare(`
          INSERT INTO orders (
            id, order_number, customer_id, cashier_id, subtotal, discount, tax, total,
            payment_method, payment_status, status, notes, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'paid', 'completed', ?, datetime('now'))
        `).bind(
          orderId,
          orderData.orderNumber,
          orderData.customerId || null,
          orderData.cashierId,
          orderData.subtotal,
          orderData.discount,
          orderData.tax,
          orderData.total,
          orderData.paymentMethod,
          orderData.notes || null
        )
      );
      
      // Create order items and update stock atomically
      for (let i = 0; i < orderData.items.length; i++) {
        const item = orderData.items[i];
        const stockCheck = stockChecks[i];
        
        // Insert order item
        statements.push(
          this.db.prepare(`
            INSERT INTO order_items (
              id, order_id, product_id, name, price, quantity, total, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
          `).bind(
            crypto.randomUUID(),
            orderId,
            item.productId,
            item.name,
            item.price,
            item.quantity,
            item.total
          )
        );
        
        // Update product stock with optimistic locking
        statements.push(
          this.db.prepare(`
            UPDATE products 
            SET stock = stock - ?, version = version + 1, updated_at = datetime('now')
            WHERE id = ? AND version = ? AND stock >= ?
          `).bind(
            item.quantity,
            item.productId,
            stockCheck.version,
            item.quantity
          )
        );
        
        // Create inventory transaction
        statements.push(
          this.db.prepare(`
            INSERT INTO inventory_transactions (
              id, product_id, type, quantity, previous_stock, new_stock,
              reference_type, reference_id, reason, created_by, created_at
            ) VALUES (?, ?, 'out', ?, ?, ?, 'order', ?, 'Sale', ?, datetime('now'))
          `).bind(
            crypto.randomUUID(),
            item.productId,
            -item.quantity,
            stockCheck.currentStock,
            stockCheck.currentStock - item.quantity,
            orderId,
            orderData.cashierId
          )
        );
      }
      
      // Create payment record
      statements.push(
        this.db.prepare(`
          INSERT INTO payments (
            id, order_id, method, amount, status, created_at
          ) VALUES (?, ?, ?, ?, 'paid', datetime('now'))
        `).bind(
          crypto.randomUUID(),
          orderId,
          orderData.paymentMethod,
          orderData.total
        )
      );
      
      // Execute all statements in a single transaction
      const results = await this.db.batch(statements);
      
      // Check for optimistic lock failures
      let stockUpdateIndex = 2; // First stock update starts at index 2
      for (let i = 0; i < orderData.items.length; i++) {
        const stockUpdateResult = results[stockUpdateIndex];
        if (stockUpdateResult.meta?.changes === 0) {
          // Stock was modified by another transaction
          throw new Error('Stock was modified by another transaction, retrying...');
        }
        stockUpdateIndex += 3; // Skip to next stock update (item + stock + transaction)
      }
      
      // Verify all statements succeeded
      const allSucceeded = results.every(result => result.success);
      
      if (!allSucceeded) {
        return {
          success: false,
          error: 'Order creation failed'
        };
      }
      
      return {
        success: true,
        data: {
          orderId,
          orderNumber: orderData.orderNumber,
          total: orderData.total,
          itemCount: orderData.items.length
        }
      };
    });
  }

  // Reserve inventory for pending orders
  async reserveInventory(productId: string, quantity: number, orderId: string, expiresInMinutes: number = 30): Promise<TransactionResult> {
    return this.withRetry(async () => {
      const statements = [];
      
      // Check current stock
      const product = await this.db
        .prepare('SELECT id, stock, reserved_stock, version FROM products WHERE id = ?')
        .bind(productId)
        .first();
      
      if (!product) {
        return {
          success: false,
          error: 'Product not found'
        };
      }
      
      const currentStock = (product as any).stock || 0;
      const reservedStock = (product as any).reserved_stock || 0;
      const availableStock = currentStock - reservedStock;
      
      if (availableStock < quantity) {
        return {
          success: false,
          error: `Insufficient available stock. Available: ${availableStock}, Requested: ${quantity}`
        };
      }
      
      // Update reserved stock
      statements.push(
        this.db.prepare(`
          UPDATE products 
          SET reserved_stock = COALESCE(reserved_stock, 0) + ?, version = version + 1
          WHERE id = ? AND version = ?
        `).bind(quantity, productId, (product as any).version || 0)
      );
      
      // Create reservation record
      statements.push(
        this.db.prepare(`
          INSERT INTO inventory_reservations (
            id, product_id, order_id, quantity, expires_at, created_at
          ) VALUES (?, ?, ?, ?, datetime('now', '+${expiresInMinutes} minutes'), datetime('now'))
        `).bind(
          crypto.randomUUID(),
          productId,
          orderId,
          quantity
        )
      );
      
      const results = await this.db.batch(statements);
      
      // Check for optimistic lock failure
      if (results[0].meta?.changes === 0) {
        throw new Error('Stock was modified by another transaction, retrying...');
      }
      
      const allSucceeded = results.every(result => result.success);
      
      if (!allSucceeded) {
        return {
          success: false,
          error: 'Inventory reservation failed'
        };
      }
      
      return {
        success: true,
        data: {
          productId,
          quantity,
          orderId,
          expiresInMinutes
        }
      };
    });
  }

  // Release inventory reservation
  async releaseInventoryReservation(orderId: string): Promise<TransactionResult> {
    return this.withRetry(async () => {
      // Get all reservations for this order
      const reservations = await this.db
        .prepare('SELECT product_id, quantity FROM inventory_reservations WHERE order_id = ?')
        .bind(orderId)
        .all();
      
      if (!reservations.results || reservations.results.length === 0) {
        return {
          success: true,
          data: { message: 'No reservations found to release' }
        };
      }
      
      const statements = [];
      
      for (const reservation of reservations.results) {
        const productId = (reservation as any).product_id;
        const quantity = (reservation as any).quantity;
        
        // Reduce reserved stock
        statements.push(
          this.db.prepare(`
            UPDATE products 
            SET reserved_stock = COALESCE(reserved_stock, 0) - ?
            WHERE id = ?
          `).bind(quantity, productId)
        );
      }
      
      // Delete reservation records
      statements.push(
        this.db.prepare('DELETE FROM inventory_reservations WHERE order_id = ?')
          .bind(orderId)
      );
      
      const results = await this.db.batch(statements);
      const allSucceeded = results.every(result => result.success);
      
      if (!allSucceeded) {
        return {
          success: false,
          error: 'Failed to release inventory reservations'
        };
      }
      
      return {
        success: true,
        data: {
          orderId,
          releasedReservations: reservations.results.length
        }
      };
    });
  }

  // Clean up expired reservations
  async cleanupExpiredReservations(): Promise<TransactionResult> {
    return this.withRetry(async () => {
      // Get expired reservations
      const expiredReservations = await this.db
        .prepare('SELECT product_id, quantity FROM inventory_reservations WHERE expires_at < datetime("now")')
        .all();
      
      if (!expiredReservations.results || expiredReservations.results.length === 0) {
        return {
          success: true,
          data: { message: 'No expired reservations found' }
        };
      }
      
      const statements = [];
      
      for (const reservation of expiredReservations.results) {
        const productId = (reservation as any).product_id;
        const quantity = (reservation as any).quantity;
        
        // Reduce reserved stock
        statements.push(
          this.db.prepare(`
            UPDATE products 
            SET reserved_stock = COALESCE(reserved_stock, 0) - ?
            WHERE id = ?
          `).bind(quantity, productId)
        );
      }
      
      // Delete expired reservations
      statements.push(
        this.db.prepare('DELETE FROM inventory_reservations WHERE expires_at < datetime("now")')
      );
      
      const results = await this.db.batch(statements);
      const allSucceeded = results.every(result => result.success);
      
      if (!allSucceeded) {
        return {
          success: false,
          error: 'Failed to cleanup expired reservations'
        };
      }
      
      return {
        success: true,
        data: {
          cleanedReservations: expiredReservations.results.length
        }
      };
    });
  }
} 