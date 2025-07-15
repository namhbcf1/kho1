import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { enhancedAuth, requirePermission } from '../../middleware/enhancedAuth';
import { createErrorResponse, createSuccessResponse } from '../../services/database/d1Service';
import { TransactionService } from '../../services/database/transactionService';
const orderRoutes = new Hono();
// Order creation schema with strict validation
const createOrderSchema = z.object({
    customerId: z.string().optional(),
    items: z.array(z.object({
        productId: z.string().uuid(),
        name: z.string().min(1),
        price: z.number().positive(),
        quantity: z.number().int().positive(),
        total: z.number().positive()
    })).min(1),
    subtotal: z.number().positive(),
    discount: z.number().min(0).default(0),
    tax: z.number().min(0).default(0),
    total: z.number().positive(),
    paymentMethod: z.enum(['cash', 'card', 'vnpay', 'momo', 'zalopay']),
    cashReceived: z.number().positive().optional(),
    notes: z.string().optional()
});
// Order update schema
const updateOrderSchema = z.object({
    status: z.enum(['pending', 'processing', 'completed', 'cancelled', 'refunded']).optional(),
    paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded', 'partial_refund']).optional(),
    notes: z.string().optional()
});
// Reserve inventory schema
const reserveInventorySchema = z.object({
    items: z.array(z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive()
    })).min(1),
    orderId: z.string().uuid(),
    expiresInMinutes: z.number().int().positive().default(30)
});
// Create order with atomic transaction and inventory management
orderRoutes.post('/', enhancedAuth(), requirePermission('order:create'), zValidator('json', createOrderSchema), async (c) => {
    try {
        const orderData = c.req.valid('json');
        const user = c.get('user');
        if (!user) {
            return c.json(createErrorResponse('User not authenticated', 'AUTH_ERROR'), 401);
        }
        const transactionService = new TransactionService(c.env.DB);
        // Generate order number
        const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-6)}`;
        // Validate total calculations
        const calculatedSubtotal = orderData.items.reduce((sum, item) => sum + item.total, 0);
        const calculatedTotal = calculatedSubtotal - orderData.discount + orderData.tax;
        if (Math.abs(calculatedTotal - orderData.total) > 0.01) {
            return c.json(createErrorResponse('Order total calculation mismatch', 'CALCULATION_ERROR'), 400);
        }
        // Create order data for transaction service
        const transactionOrderData = {
            orderNumber,
            customerId: orderData.customerId,
            cashierId: user.id,
            items: orderData.items,
            subtotal: orderData.subtotal,
            discount: orderData.discount,
            tax: orderData.tax,
            total: orderData.total,
            paymentMethod: orderData.paymentMethod,
            notes: orderData.notes
        };
        // Create order atomically with inventory updates
        const result = await transactionService.createOrderAtomic(transactionOrderData);
        if (!result.success) {
            return c.json(createErrorResponse(result.error || 'Order creation failed', 'ORDER_CREATION_ERROR'), 400);
        }
        // Get the created order details
        const createdOrder = await c.env.DB
            .prepare(`
          SELECT o.*, 
                 u.name as cashier_name,
                 c.name as customer_name
          FROM orders o
          LEFT JOIN users u ON o.cashier_id = u.id
          LEFT JOIN customers c ON o.customer_id = c.id
          WHERE o.id = ?
        `)
            .bind(result.data.orderId)
            .first();
        if (!createdOrder) {
            return c.json(createErrorResponse('Order created but not found', 'ORDER_NOT_FOUND'), 500);
        }
        // Get order items
        const orderItems = await c.env.DB
            .prepare('SELECT * FROM order_items WHERE order_id = ?')
            .bind(result.data.orderId)
            .all();
        const orderResponse = {
            ...createdOrder,
            items: orderItems.results
        };
        return c.json(createSuccessResponse(orderResponse, 'Order created successfully'));
    }
    catch (error) {
        console.error('Order creation error:', error);
        return c.json(createErrorResponse(error instanceof Error ? error.message : 'Internal server error', 'INTERNAL_ERROR'), 500);
    }
});
// Reserve inventory for pending order
orderRoutes.post('/reserve-inventory', enhancedAuth(), requirePermission('order:create'), zValidator('json', reserveInventorySchema), async (c) => {
    try {
        const { items, orderId, expiresInMinutes } = c.req.valid('json');
        const transactionService = new TransactionService(c.env.DB);
        const results = [];
        for (const item of items) {
            const result = await transactionService.reserveInventory(item.productId, item.quantity, orderId, expiresInMinutes);
            if (!result.success) {
                // If any reservation fails, release all previous reservations
                await transactionService.releaseInventoryReservation(orderId);
                return c.json(createErrorResponse(result.error || 'Inventory reservation failed', 'RESERVATION_ERROR'), 400);
            }
            results.push(result.data);
        }
        return c.json(createSuccessResponse(results, 'Inventory reserved successfully'));
    }
    catch (error) {
        console.error('Inventory reservation error:', error);
        return c.json(createErrorResponse(error instanceof Error ? error.message : 'Internal server error', 'INTERNAL_ERROR'), 500);
    }
});
// Release inventory reservation
orderRoutes.post('/release-inventory/:orderId', enhancedAuth(), requirePermission('order:update'), async (c) => {
    try {
        const orderId = c.req.param('orderId');
        const transactionService = new TransactionService(c.env.DB);
        const result = await transactionService.releaseInventoryReservation(orderId);
        if (!result.success) {
            return c.json(createErrorResponse(result.error || 'Failed to release inventory reservation', 'RELEASE_ERROR'), 400);
        }
        return c.json(createSuccessResponse(result.data, 'Inventory reservation released successfully'));
    }
    catch (error) {
        console.error('Inventory release error:', error);
        return c.json(createErrorResponse(error instanceof Error ? error.message : 'Internal server error', 'INTERNAL_ERROR'), 500);
    }
});
// Get all orders with pagination and filtering
orderRoutes.get('/', enhancedAuth(), requirePermission('order:read'), async (c) => {
    try {
        const page = parseInt(c.req.query('page') || '1');
        const limit = parseInt(c.req.query('limit') || '20');
        const status = c.req.query('status');
        const paymentStatus = c.req.query('paymentStatus');
        const customerId = c.req.query('customerId');
        const startDate = c.req.query('startDate');
        const endDate = c.req.query('endDate');
        const offset = (page - 1) * limit;
        let whereClause = 'WHERE 1=1';
        const params = [];
        if (status) {
            whereClause += ' AND o.status = ?';
            params.push(status);
        }
        if (paymentStatus) {
            whereClause += ' AND o.payment_status = ?';
            params.push(paymentStatus);
        }
        if (customerId) {
            whereClause += ' AND o.customer_id = ?';
            params.push(customerId);
        }
        if (startDate) {
            whereClause += ' AND o.created_at >= ?';
            params.push(startDate);
        }
        if (endDate) {
            whereClause += ' AND o.created_at <= ?';
            params.push(endDate);
        }
        // Get total count
        const countResult = await c.env.DB
            .prepare(`SELECT COUNT(*) as total FROM orders o ${whereClause}`)
            .bind(...params)
            .first();
        const total = countResult?.total || 0;
        // Get orders
        const ordersResult = await c.env.DB
            .prepare(`
          SELECT o.*, 
                 u.name as cashier_name,
                 c.name as customer_name
          FROM orders o
          LEFT JOIN users u ON o.cashier_id = u.id
          LEFT JOIN customers c ON o.customer_id = c.id
          ${whereClause}
          ORDER BY o.created_at DESC
          LIMIT ? OFFSET ?
        `)
            .bind(...params, limit, offset)
            .all();
        const orders = ordersResult.results || [];
        // Get items for each order
        const ordersWithItems = await Promise.all(orders.map(async (order) => {
            const itemsResult = await c.env.DB
                .prepare('SELECT * FROM order_items WHERE order_id = ?')
                .bind(order.id)
                .all();
            return {
                ...order,
                items: itemsResult.results
            };
        }));
        return c.json(createSuccessResponse({
            orders: ordersWithItems,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        }, 'Orders retrieved successfully'));
    }
    catch (error) {
        console.error('Get orders error:', error);
        return c.json(createErrorResponse(error instanceof Error ? error.message : 'Internal server error', 'INTERNAL_ERROR'), 500);
    }
});
// Get order by ID
orderRoutes.get('/:id', enhancedAuth(), requirePermission('order:read'), async (c) => {
    try {
        const orderId = c.req.param('id');
        const order = await c.env.DB
            .prepare(`
          SELECT o.*, 
                 u.name as cashier_name,
                 c.name as customer_name
          FROM orders o
          LEFT JOIN users u ON o.cashier_id = u.id
          LEFT JOIN customers c ON o.customer_id = c.id
          WHERE o.id = ?
        `)
            .bind(orderId)
            .first();
        if (!order) {
            return c.json(createErrorResponse('Order not found', 'ORDER_NOT_FOUND'), 404);
        }
        // Get order items
        const itemsResult = await c.env.DB
            .prepare('SELECT * FROM order_items WHERE order_id = ?')
            .bind(orderId)
            .all();
        const orderWithItems = {
            ...order,
            items: itemsResult.results
        };
        return c.json(createSuccessResponse(orderWithItems, 'Order retrieved successfully'));
    }
    catch (error) {
        console.error('Get order error:', error);
        return c.json(createErrorResponse(error instanceof Error ? error.message : 'Internal server error', 'INTERNAL_ERROR'), 500);
    }
});
// Update order status
orderRoutes.put('/:id', enhancedAuth(), requirePermission('order:update'), zValidator('json', updateOrderSchema), async (c) => {
    try {
        const orderId = c.req.param('id');
        const updateData = c.req.valid('json');
        const updates = [];
        const params = [];
        if (updateData.status) {
            updates.push('status = ?');
            params.push(updateData.status);
        }
        if (updateData.paymentStatus) {
            updates.push('payment_status = ?');
            params.push(updateData.paymentStatus);
        }
        if (updateData.notes !== undefined) {
            updates.push('notes = ?');
            params.push(updateData.notes);
        }
        if (updates.length === 0) {
            return c.json(createErrorResponse('No fields to update', 'VALIDATION_ERROR'), 400);
        }
        updates.push('updated_at = datetime("now")');
        params.push(orderId);
        const result = await c.env.DB
            .prepare(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`)
            .bind(...params)
            .run();
        if (result.meta?.changes === 0) {
            return c.json(createErrorResponse('Order not found', 'ORDER_NOT_FOUND'), 404);
        }
        // Get updated order
        const updatedOrder = await c.env.DB
            .prepare(`
          SELECT o.*, 
                 u.name as cashier_name,
                 c.name as customer_name
          FROM orders o
          LEFT JOIN users u ON o.cashier_id = u.id
          LEFT JOIN customers c ON o.customer_id = c.id
          WHERE o.id = ?
        `)
            .bind(orderId)
            .first();
        return c.json(createSuccessResponse(updatedOrder, 'Order updated successfully'));
    }
    catch (error) {
        console.error('Update order error:', error);
        return c.json(createErrorResponse(error instanceof Error ? error.message : 'Internal server error', 'INTERNAL_ERROR'), 500);
    }
});
// Cancel order and release inventory
orderRoutes.post('/:id/cancel', enhancedAuth(), requirePermission('order:update'), async (c) => {
    try {
        const orderId = c.req.param('id');
        const transactionService = new TransactionService(c.env.DB);
        // Get order details
        const order = await c.env.DB
            .prepare('SELECT * FROM orders WHERE id = ? AND status != "cancelled"')
            .bind(orderId)
            .first();
        if (!order) {
            return c.json(createErrorResponse('Order not found or already cancelled', 'ORDER_NOT_FOUND'), 404);
        }
        // If order is completed, we need to reverse the inventory changes
        if (order.status === 'completed') {
            const orderItems = await c.env.DB
                .prepare('SELECT * FROM order_items WHERE order_id = ?')
                .bind(orderId)
                .all();
            // Reverse inventory changes
            for (const item of orderItems.results || []) {
                const itemData = item;
                await transactionService.updateInventoryAtomic({
                    productId: itemData.product_id,
                    quantity: itemData.quantity,
                    operation: 'add',
                    orderId: orderId,
                    reason: 'Order cancellation'
                });
            }
        }
        // Release any reservations
        await transactionService.releaseInventoryReservation(orderId);
        // Update order status
        const result = await c.env.DB
            .prepare('UPDATE orders SET status = "cancelled", updated_at = datetime("now") WHERE id = ?')
            .bind(orderId)
            .run();
        if (result.meta?.changes === 0) {
            return c.json(createErrorResponse('Failed to cancel order', 'UPDATE_ERROR'), 500);
        }
        return c.json(createSuccessResponse({ orderId }, 'Order cancelled successfully'));
    }
    catch (error) {
        console.error('Cancel order error:', error);
        return c.json(createErrorResponse(error instanceof Error ? error.message : 'Internal server error', 'INTERNAL_ERROR'), 500);
    }
});
// Cleanup expired reservations (admin only)
orderRoutes.post('/cleanup-reservations', enhancedAuth(), requirePermission('system:admin'), async (c) => {
    try {
        const transactionService = new TransactionService(c.env.DB);
        const result = await transactionService.cleanupExpiredReservations();
        if (!result.success) {
            return c.json(createErrorResponse(result.error || 'Failed to cleanup expired reservations', 'CLEANUP_ERROR'), 500);
        }
        return c.json(createSuccessResponse(result.data, 'Expired reservations cleaned up successfully'));
    }
    catch (error) {
        console.error('Cleanup reservations error:', error);
        return c.json(createErrorResponse(error instanceof Error ? error.message : 'Internal server error', 'INTERNAL_ERROR'), 500);
    }
});
export { orderRoutes };
