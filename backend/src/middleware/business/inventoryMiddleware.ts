// Inventory checking middleware
import { Context, Next } from 'hono';

export const checkInventoryMiddleware = async (c: Context, next: Next) => {
  try {
    const method = c.req.method;
    const path = c.req.path;

    // Only check inventory for order creation endpoints
    if (method === 'POST' && (path.includes('/orders') || path.includes('/pos'))) {
      const body = await c.req.json();
      
      if (body.items && Array.isArray(body.items)) {
        const db = c.env.DB;
        const inventoryChecks = [];

        for (const item of body.items) {
          const product = await db.prepare(`
            SELECT id, name, stock, min_stock 
            FROM products 
            WHERE id = ? AND active = 1
          `).bind(item.productId).first();

          if (!product) {
            return c.json({
              success: false,
              error: {
                code: 'PRODUCT_NOT_FOUND',
                message: `Product with ID ${item.productId} not found`,
              },
            }, 404);
          }

          if (product.stock < item.quantity) {
            return c.json({
              success: false,
              error: {
                code: 'INSUFFICIENT_STOCK',
                message: `Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`,
                details: {
                  productId: item.productId,
                  productName: product.name,
                  availableStock: product.stock,
                  requestedQuantity: item.quantity,
                },
              },
            }, 400);
          }

          inventoryChecks.push({
            productId: item.productId,
            productName: product.name,
            requestedQuantity: item.quantity,
            availableStock: product.stock,
            newStock: product.stock - item.quantity,
            belowMinStock: (product.stock - item.quantity) < product.min_stock,
          });
        }

        // Store inventory check results for use in the handler
        c.set('inventoryChecks', inventoryChecks);
      }
    }

    await next();
  } catch (error) {
    console.error('Inventory middleware error:', error);
    return c.json({
      success: false,
      error: {
        code: 'INVENTORY_CHECK_ERROR',
        message: 'Failed to check inventory',
      },
    }, 500);
  }
};

export const updateInventoryAfterSale = async (c: Context, orderItems: any[]) => {
  try {
    const db = c.env.DB;
    
    for (const item of orderItems) {
      // Update product stock
      await db.prepare(`
        UPDATE products 
        SET stock = stock - ?, updated_at = datetime('now')
        WHERE id = ?
      `).bind(item.quantity, item.productId).run();

      // Create inventory transaction
      await db.prepare(`
        INSERT INTO inventory_transactions (
          id, product_id, type, quantity, unit_cost, reference_type, 
          reference_id, created_by, created_at
        )
        VALUES (?, ?, 'sale', ?, ?, 'order', ?, 'system', datetime('now'))
      `).bind(
        crypto.randomUUID(),
        item.productId,
        -item.quantity, // Negative for sale
        item.price,
        c.get('orderId')
      ).run();

      // Check if product is now below minimum stock
      const product = await db.prepare(`
        SELECT name, stock, min_stock FROM products WHERE id = ?
      `).bind(item.productId).first();

      if (product && product.stock < product.min_stock) {
        // Create low stock alert
        await createLowStockAlert(c, item.productId, product.name, product.stock, product.min_stock);
      }
    }
  } catch (error) {
    console.error('Update inventory error:', error);
    throw error;
  }
};

export const reserveInventory = async (c: Context, orderItems: any[], orderId: string) => {
  try {
    const db = c.env.DB;
    
    for (const item of orderItems) {
      await db.prepare(`
        UPDATE products 
        SET reserved_stock = COALESCE(reserved_stock, 0) + ?
        WHERE id = ?
      `).bind(item.quantity, item.productId).run();

      // Create reservation record
      await db.prepare(`
        INSERT INTO inventory_reservations (
          id, product_id, order_id, quantity, created_at, expires_at
        )
        VALUES (?, ?, ?, ?, datetime('now'), datetime('now', '+30 minutes'))
      `).bind(
        crypto.randomUUID(),
        item.productId,
        orderId,
        item.quantity
      ).run();
    }
  } catch (error) {
    console.error('Reserve inventory error:', error);
    throw error;
  }
};

export const releaseInventoryReservation = async (c: Context, orderId: string) => {
  try {
    const db = c.env.DB;
    
    // Get reservations for this order
    const reservations = await db.prepare(`
      SELECT product_id, quantity FROM inventory_reservations WHERE order_id = ?
    `).bind(orderId).all();

    for (const reservation of reservations.results || []) {
      // Release reserved stock
      await db.prepare(`
        UPDATE products 
        SET reserved_stock = COALESCE(reserved_stock, 0) - ?
        WHERE id = ?
      `).bind(reservation.quantity, reservation.product_id).run();
    }

    // Delete reservation records
    await db.prepare(`
      DELETE FROM inventory_reservations WHERE order_id = ?
    `).bind(orderId).run();
  } catch (error) {
    console.error('Release inventory reservation error:', error);
    throw error;
  }
};

const createLowStockAlert = async (c: Context, productId: string, productName: string, currentStock: number, minStock: number) => {
  try {
    const db = c.env.DB;
    
    // Check if alert already exists for this product
    const existingAlert = await db.prepare(`
      SELECT id FROM inventory_alerts 
      WHERE product_id = ? AND type = 'low_stock' AND resolved = 0
    `).bind(productId).first();

    if (!existingAlert) {
      await db.prepare(`
        INSERT INTO inventory_alerts (
          id, product_id, type, message, current_stock, min_stock, created_at
        )
        VALUES (?, ?, 'low_stock', ?, ?, ?, datetime('now'))
      `).bind(
        crypto.randomUUID(),
        productId,
        `Product "${productName}" is below minimum stock level`,
        currentStock,
        minStock
      ).run();
    }
  } catch (error) {
    console.error('Create low stock alert error:', error);
  }
};
