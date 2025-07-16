/**
 * Optimized Inventory Service
 * Fixes: Real-time inventory tracking bottlenecks and concurrent update issues
 */
import { z } from 'zod';
const StockAdjustmentSchema = z.object({
    productId: z.number().positive(),
    newQuantity: z.number().min(0),
    reason: z.string().min(1),
    userId: z.number().positive()
});
const ReservationSchema = z.object({
    productId: z.number().positive(),
    quantity: z.number().positive(),
    orderId: z.string(),
    expirationMinutes: z.number().default(15)
});
/**
 * Inventory Event Manager - Handles real-time updates
 */
class InventoryEventManager {
    subscribers = new Map();
    eventQueue = [];
    isProcessing = false;
    subscribe(productId, callback) {
        if (!this.subscribers.has(productId)) {
            this.subscribers.set(productId, new Set());
        }
        this.subscribers.get(productId).add(callback);
        return () => {
            this.subscribers.get(productId)?.delete(callback);
            if (this.subscribers.get(productId)?.size === 0) {
                this.subscribers.delete(productId);
            }
        };
    }
    async publishEvent(event) {
        this.eventQueue.push(event);
        if (!this.isProcessing) {
            this.processEventQueue();
        }
    }
    async processEventQueue() {
        this.isProcessing = true;
        while (this.eventQueue.length > 0) {
            const event = this.eventQueue.shift();
            const subscribers = this.subscribers.get(event.productId.toString());
            if (subscribers) {
                for (const callback of subscribers) {
                    try {
                        await callback(event);
                    }
                    catch (error) {
                        console.error('Event subscriber error:', error);
                    }
                }
            }
        }
        this.isProcessing = false;
    }
}
/**
 * Stock Reservation Manager
 */
class StockReservationManager {
    db;
    kv;
    constructor(db, kv) {
        this.db = db;
        this.kv = kv;
    }
    async createReservation(params) {
        const validated = ReservationSchema.parse(params);
        const reservationId = this.generateReservationId();
        const expiresAt = new Date(Date.now() + validated.expirationMinutes * 60000).toISOString();
        try {
            // Check if enough stock is available
            const product = await this.db.prepare(`
        SELECT stock_quantity, reserved_quantity 
        FROM products 
        WHERE id = ?
      `).bind(validated.productId).first();
            if (!product) {
                return null;
            }
            const availableStock = product.stock_quantity - product.reserved_quantity;
            if (availableStock < validated.quantity) {
                return null;
            }
            // Create reservation record
            await this.db.prepare(`
        INSERT INTO stock_reservations (
          id, product_id, quantity, order_id, expires_at, status, created_at
        ) VALUES (?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP)
      `).bind(reservationId, validated.productId, validated.quantity, validated.orderId, expiresAt).run();
            // Update reserved quantity
            await this.db.prepare(`
        UPDATE products 
        SET reserved_quantity = reserved_quantity + ?
        WHERE id = ?
      `).bind(validated.quantity, validated.productId).run();
            // Set expiration in KV store for cleanup
            await this.kv.put(`reservation:${reservationId}`, JSON.stringify({ productId: validated.productId, quantity: validated.quantity }), { expirationTtl: validated.expirationMinutes * 60 });
            return {
                id: reservationId,
                productId: validated.productId,
                quantity: validated.quantity,
                orderId: validated.orderId,
                expiresAt,
                status: 'active'
            };
        }
        catch (error) {
            console.error('Reservation creation error:', error);
            return null;
        }
    }
    async confirmReservation(reservationId) {
        try {
            const result = await this.db.prepare(`
        UPDATE stock_reservations 
        SET status = 'confirmed', confirmed_at = CURRENT_TIMESTAMP
        WHERE id = ? AND status = 'active'
      `).bind(reservationId).run();
            return result.meta.rows_written > 0;
        }
        catch (error) {
            console.error('Reservation confirmation error:', error);
            return false;
        }
    }
    async releaseReservation(reservationId) {
        try {
            // Get reservation details
            const reservation = await this.db.prepare(`
        SELECT product_id, quantity 
        FROM stock_reservations 
        WHERE id = ? AND status = 'active'
      `).bind(reservationId).first();
            if (!reservation) {
                return false;
            }
            // Update reservation status
            await this.db.prepare(`
        UPDATE stock_reservations 
        SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(reservationId).run();
            // Release reserved quantity
            await this.db.prepare(`
        UPDATE products 
        SET reserved_quantity = reserved_quantity - ?
        WHERE id = ?
      `).bind(reservation.quantity, reservation.product_id).run();
            // Remove from KV store
            await this.kv.delete(`reservation:${reservationId}`);
            return true;
        }
        catch (error) {
            console.error('Reservation release error:', error);
            return false;
        }
    }
    async cleanupExpiredReservations() {
        try {
            // Get expired reservations
            const expiredReservations = await this.db.prepare(`
        SELECT id, product_id, quantity
        FROM stock_reservations 
        WHERE status = 'active' AND expires_at < CURRENT_TIMESTAMP
      `).all();
            for (const reservation of expiredReservations.results) {
                await this.releaseReservation(reservation.id);
            }
        }
        catch (error) {
            console.error('Reservation cleanup error:', error);
        }
    }
    generateReservationId() {
        return `RSV_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }
}
/**
 * Main Optimized Inventory Service
 */
export class OptimizedInventoryService {
    db;
    kv;
    eventManager = new InventoryEventManager();
    reservationManager;
    updateQueue = new Map();
    constructor(db, kv) {
        this.db = db;
        this.kv = kv;
        this.reservationManager = new StockReservationManager(db, kv);
        // Setup periodic cleanup
        setInterval(() => {
            this.reservationManager.cleanupExpiredReservations();
        }, 5 * 60 * 1000); // Every 5 minutes
    }
    /**
     * Get current inventory for a product
     */
    async getInventory(productId) {
        try {
            const product = await this.db.prepare(`
        SELECT id, stock_quantity, reserved_quantity, reorder_level, 
               max_stock, updated_at, version
        FROM products 
        WHERE id = ?
      `).bind(productId).first();
            if (!product) {
                return null;
            }
            return {
                productId: product.id,
                stockQuantity: product.stock_quantity,
                reservedQuantity: product.reserved_quantity,
                availableQuantity: product.stock_quantity - product.reserved_quantity,
                reorderLevel: product.reorder_level || 0,
                maxStock: product.max_stock || 1000,
                lastUpdated: product.updated_at,
                version: product.version || 0
            };
        }
        catch (error) {
            console.error('Get inventory error:', error);
            return null;
        }
    }
    /**
     * Update stock with optimistic locking
     */
    async updateStock(productId, quantityChange, type, userId, orderId, reason) {
        // Serialize updates for the same product
        const existingUpdate = this.updateQueue.get(productId);
        if (existingUpdate) {
            await existingUpdate;
        }
        const updatePromise = this.performStockUpdate(productId, quantityChange, type, userId, orderId, reason);
        this.updateQueue.set(productId, updatePromise);
        try {
            const result = await updatePromise;
            return result;
        }
        finally {
            this.updateQueue.delete(productId);
        }
    }
    async performStockUpdate(productId, quantityChange, type, userId, orderId, reason) {
        const maxRetries = 3;
        let retries = 0;
        while (retries < maxRetries) {
            try {
                // Get current stock with version for optimistic locking
                const currentProduct = await this.db.prepare(`
          SELECT stock_quantity, reserved_quantity, version 
          FROM products 
          WHERE id = ?
        `).bind(productId).first();
                if (!currentProduct) {
                    return { success: false, error: 'Product not found' };
                }
                const previousStock = currentProduct.stock_quantity;
                const newQuantity = previousStock + quantityChange;
                // Validate stock levels
                if (newQuantity < 0) {
                    return { success: false, error: 'Insufficient stock' };
                }
                if (type === 'sale') {
                    const availableStock = previousStock - currentProduct.reserved_quantity;
                    if (Math.abs(quantityChange) > availableStock) {
                        return { success: false, error: 'Insufficient available stock' };
                    }
                }
                // Update stock with version check
                const updateResult = await this.db.prepare(`
          UPDATE products 
          SET stock_quantity = ?, 
              version = version + 1,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND version = ?
        `).bind(newQuantity, productId, currentProduct.version).run();
                if (updateResult.meta.rows_written === 0) {
                    // Version conflict - retry
                    retries++;
                    await this.delay(100 * retries); // Exponential backoff
                    continue;
                }
                // Record inventory movement
                await this.recordInventoryMovement({
                    productId,
                    type,
                    quantity: quantityChange,
                    previousStock,
                    newStock: newQuantity,
                    reason: reason || `${type} operation`,
                    userId,
                    orderId
                });
                // Publish real-time event
                await this.eventManager.publishEvent({
                    type: 'inventory_updated',
                    productId,
                    data: {
                        newQuantity,
                        quantityChange,
                        availableQuantity: newQuantity - currentProduct.reserved_quantity,
                        operationType: type
                    },
                    timestamp: new Date().toISOString()
                });
                // Check reorder level
                await this.checkReorderLevel(productId, newQuantity);
                return { success: true, newQuantity };
            }
            catch (error) {
                console.error('Stock update error:', error);
                if (retries === maxRetries - 1) {
                    return { success: false, error: 'Stock update failed after retries' };
                }
                retries++;
                await this.delay(100 * retries);
            }
        }
        return { success: false, error: 'Stock update failed' };
    }
    /**
     * Bulk stock update for multiple products
     */
    async bulkUpdateStock(updates, userId, orderId) {
        const results = [];
        const errors = [];
        // Sort by product ID to prevent deadlocks
        const sortedUpdates = updates.sort((a, b) => a.productId - b.productId);
        for (const update of sortedUpdates) {
            const result = await this.updateStock(update.productId, update.quantityChange, update.type, userId, orderId);
            results.push({
                productId: update.productId,
                ...result
            });
            if (!result.success) {
                errors.push(`Product ${update.productId}: ${result.error}`);
            }
        }
        return {
            success: errors.length === 0,
            results,
            errors
        };
    }
    /**
     * Reserve stock for order
     */
    async reserveStock(productId, quantity, orderId, expirationMinutes = 15) {
        return this.reservationManager.createReservation({
            productId,
            quantity,
            orderId,
            expirationMinutes
        });
    }
    /**
     * Confirm stock reservation
     */
    async confirmReservation(reservationId) {
        return this.reservationManager.confirmReservation(reservationId);
    }
    /**
     * Release stock reservation
     */
    async releaseReservation(reservationId) {
        return this.reservationManager.releaseReservation(reservationId);
    }
    /**
     * Get low stock alerts
     */
    async getLowStockAlerts() {
        const lowStockItems = await this.db.prepare(`
      SELECT p.id, p.name, p.stock_quantity, p.reserved_quantity, p.reorder_level
      FROM products p
      WHERE p.stock_quantity <= p.reorder_level 
        AND p.is_active = 1
      ORDER BY (p.stock_quantity - p.reorder_level) ASC
    `).all();
        return lowStockItems.results.map((item) => ({
            productId: item.id,
            productName: item.name,
            currentStock: item.stock_quantity,
            reorderLevel: item.reorder_level,
            availableStock: item.stock_quantity - item.reserved_quantity
        }));
    }
    /**
     * Subscribe to inventory changes
     */
    subscribeToInventoryChanges(productId, callback) {
        return this.eventManager.subscribe(productId.toString(), callback);
    }
    /**
     * Record inventory movement
     */
    async recordInventoryMovement(movement) {
        const movementId = `MOV_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        await this.db.prepare(`
      INSERT INTO inventory_movements (
        id, product_id, type, quantity, previous_stock, new_stock,
        reason, timestamp, user_id, order_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)
    `).bind(movementId, movement.productId, movement.type, movement.quantity, movement.previousStock, movement.newStock, movement.reason, movement.userId, movement.orderId || null).run();
    }
    /**
     * Check reorder level and create alerts
     */
    async checkReorderLevel(productId, currentStock) {
        const product = await this.db.prepare(`
      SELECT reorder_level, name FROM products WHERE id = ?
    `).bind(productId).first();
        if (product && currentStock <= product.reorder_level) {
            // Create reorder alert
            await this.kv.put(`reorder_alert:${productId}`, JSON.stringify({
                productId,
                productName: product.name,
                currentStock,
                reorderLevel: product.reorder_level,
                alertTime: new Date().toISOString()
            }), { expirationTtl: 24 * 60 * 60 } // 24 hours
            );
            // Publish alert event
            await this.eventManager.publishEvent({
                type: 'reorder_alert',
                productId,
                data: {
                    currentStock,
                    reorderLevel: product.reorder_level,
                    productName: product.name
                },
                timestamp: new Date().toISOString()
            });
        }
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
