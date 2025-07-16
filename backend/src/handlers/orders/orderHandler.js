import { createSuccessResponse, createErrorResponse } from '../../services/database/d1Service';
import { calculateVAT, calculateLoyaltyPoints, formatVND } from '../../utils/vietnamese';
export class OrderHandler {
    db;
    constructor(db) {
        this.db = db;
    }
    async createOrder(c) {
        try {
            const orderData = await c.req.json();
            const { items, customer_id, payment_method, discount = 0, notes, loyalty_points_used = 0 } = orderData;
            if (!items || !Array.isArray(items) || items.length === 0) {
                return c.json(createErrorResponse('Order must contain at least one item', 'VALIDATION_ERROR'), 400);
            }
            const orderId = crypto.randomUUID();
            const currentTime = new Date().toISOString();
            // Calculate order totals
            let subtotal = 0;
            const orderItems = [];
            for (const item of items) {
                const product = await this.db.prepare(`
          SELECT id, name, price, stock FROM products 
          WHERE id = ? AND active = 1
        `).bind(item.product_id).first();
                if (!product) {
                    return c.json(createErrorResponse(`Product ${item.product_id} not found`, 'PRODUCT_NOT_FOUND'), 400);
                }
                if (product.stock < item.quantity) {
                    return c.json(createErrorResponse(`Insufficient stock for ${product.name}`, 'INSUFFICIENT_STOCK'), 400);
                }
                const itemTotal = item.quantity * product.price;
                subtotal += itemTotal;
                orderItems.push({
                    id: crypto.randomUUID(),
                    order_id: orderId,
                    product_id: item.product_id,
                    product_name: product.name,
                    quantity: item.quantity,
                    price: product.price,
                    total: itemTotal
                });
            }
            const tax = calculateVAT(subtotal);
            const loyaltyDiscount = loyalty_points_used * 1000; // 1 point = 1000 VND
            const total = subtotal + tax - discount - loyaltyDiscount;
            if (total < 0) {
                return c.json(createErrorResponse('Order total cannot be negative', 'INVALID_TOTAL'), 400);
            }
            // Create order
            await this.db.prepare(`
        INSERT INTO orders (
          id, customer_id, subtotal, tax, discount, loyalty_points_used,
          total, payment_method, status, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
      `).bind(orderId, customer_id || null, subtotal, tax, discount + loyaltyDiscount, loyalty_points_used, total, payment_method, notes || null, currentTime, currentTime).run();
            // Create order items and update stock
            for (const item of orderItems) {
                await this.db.prepare(`
          INSERT INTO order_items (
            id, order_id, product_id, product_name, quantity, price, total
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(item.id, item.order_id, item.product_id, item.product_name, item.quantity, item.price, item.total).run();
                // Update product stock
                await this.db.prepare(`
          UPDATE products 
          SET stock = stock - ?, updated_at = ?
          WHERE id = ?
        `).bind(item.quantity, currentTime, item.product_id).run();
            }
            // Update customer loyalty points if customer exists
            if (customer_id) {
                const customer = await this.db.prepare(`
          SELECT loyalty_points, loyalty_tier, total_spent FROM customers 
          WHERE id = ? AND active = 1
        `).bind(customer_id).first();
                if (customer) {
                    const pointsEarned = calculateLoyaltyPoints(subtotal, customer.loyalty_tier);
                    const newPoints = customer.loyalty_points - loyalty_points_used + pointsEarned;
                    const newTotalSpent = customer.total_spent + total;
                    await this.db.prepare(`
            UPDATE customers 
            SET loyalty_points = ?, total_spent = ?, last_visit = ?, updated_at = ?
            WHERE id = ?
          `).bind(newPoints, newTotalSpent, currentTime, currentTime, customer_id).run();
                    // Log loyalty points transactions
                    if (loyalty_points_used > 0) {
                        await this.db.prepare(`
              INSERT INTO loyalty_transactions (
                id, customer_id, points, type, reason, created_at
              ) VALUES (?, ?, ?, 'redeem', ?, ?)
            `).bind(crypto.randomUUID(), customer_id, loyalty_points_used, `Order ${orderId}`, currentTime).run();
                    }
                    if (pointsEarned > 0) {
                        await this.db.prepare(`
              INSERT INTO loyalty_transactions (
                id, customer_id, points, type, reason, created_at
              ) VALUES (?, ?, ?, 'add', ?, ?)
            `).bind(crypto.randomUUID(), customer_id, pointsEarned, `Order ${orderId}`, currentTime).run();
                    }
                }
            }
            // Get complete order data
            const completeOrder = await this.getOrderById(orderId);
            return c.json(createSuccessResponse(completeOrder, 'Order created successfully'), 201);
        }
        catch (error) {
            console.error('Error creating order:', error);
            return c.json(createErrorResponse(error, 'ORDER_CREATE_ERROR'), 500);
        }
    }
    async getOrders(c) {
        try {
            const page = parseInt(c.req.query('page') || '1');
            const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
            const status = c.req.query('status');
            const customer_id = c.req.query('customer_id');
            const date_from = c.req.query('date_from');
            const date_to = c.req.query('date_to');
            const offset = (page - 1) * limit;
            let whereClause = 'WHERE 1=1';
            const params = [];
            if (status) {
                whereClause += ' AND status = ?';
                params.push(status);
            }
            if (customer_id) {
                whereClause += ' AND customer_id = ?';
                params.push(customer_id);
            }
            if (date_from) {
                whereClause += ' AND DATE(created_at) >= DATE(?)';
                params.push(date_from);
            }
            if (date_to) {
                whereClause += ' AND DATE(created_at) <= DATE(?)';
                params.push(date_to);
            }
            // Get total count
            const countQuery = `SELECT COUNT(*) as total FROM orders ${whereClause}`;
            const countResult = await this.db.prepare(countQuery).bind(...params).first();
            const total = countResult?.total || 0;
            // Get orders
            const ordersQuery = `
        SELECT 
          o.*,
          c.name as customer_name,
          c.phone as customer_phone
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        ${whereClause}
        ORDER BY o.created_at DESC
        LIMIT ? OFFSET ?
      `;
            const ordersResult = await this.db.prepare(ordersQuery)
                .bind(...params, limit, offset)
                .all();
            const orders = ordersResult.results?.map(order => ({
                ...order,
                formatted_total: formatVND(order.total),
                formatted_subtotal: formatVND(order.subtotal),
                formatted_tax: formatVND(order.tax)
            })) || [];
            return c.json(createSuccessResponse({
                orders,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }, 'Orders retrieved successfully'));
        }
        catch (error) {
            console.error('Error fetching orders:', error);
            return c.json(createErrorResponse(error, 'ORDERS_FETCH_ERROR'), 500);
        }
    }
    async getOrderById(orderId) {
        const order = await this.db.prepare(`
      SELECT 
        o.*,
        c.name as customer_name,
        c.phone as customer_phone,
        c.email as customer_email
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ?
    `).bind(orderId).first();
        if (!order) {
            return null;
        }
        // Get order items
        const items = await this.db.prepare(`
      SELECT * FROM order_items WHERE order_id = ?
    `).bind(orderId).all();
        return {
            ...order,
            items: items.results || [],
            formatted_total: formatVND(order.total),
            formatted_subtotal: formatVND(order.subtotal),
            formatted_tax: formatVND(order.tax)
        };
    }
    async getOrder(c) {
        try {
            const id = c.req.param('id');
            const order = await this.getOrderById(id);
            if (!order) {
                return c.json(createErrorResponse('Order not found', 'ORDER_NOT_FOUND'), 404);
            }
            return c.json(createSuccessResponse(order, 'Order retrieved successfully'));
        }
        catch (error) {
            console.error('Error fetching order:', error);
            return c.json(createErrorResponse(error, 'ORDER_FETCH_ERROR'), 500);
        }
    }
    async updateOrderStatus(c) {
        try {
            const id = c.req.param('id');
            const { status, notes } = await c.req.json();
            const validStatuses = ['pending', 'processing', 'completed', 'cancelled', 'refunded'];
            if (!validStatuses.includes(status)) {
                return c.json(createErrorResponse('Invalid order status', 'VALIDATION_ERROR'), 400);
            }
            const order = await this.db.prepare(`
        SELECT * FROM orders WHERE id = ?
      `).bind(id).first();
            if (!order) {
                return c.json(createErrorResponse('Order not found', 'ORDER_NOT_FOUND'), 404);
            }
            // Handle stock restoration for cancelled orders
            if (status === 'cancelled' && order.status !== 'cancelled') {
                const orderItems = await this.db.prepare(`
          SELECT product_id, quantity FROM order_items WHERE order_id = ?
        `).bind(id).all();
                for (const item of orderItems.results || []) {
                    await this.db.prepare(`
            UPDATE products 
            SET stock = stock + ?, updated_at = ?
            WHERE id = ?
          `).bind(item.quantity, new Date().toISOString(), item.product_id).run();
                }
            }
            await this.db.prepare(`
        UPDATE orders 
        SET status = ?, notes = COALESCE(?, notes), updated_at = ?
        WHERE id = ?
      `).bind(status, notes, new Date().toISOString(), id).run();
            const updatedOrder = await this.getOrderById(id);
            return c.json(createSuccessResponse(updatedOrder, 'Order status updated successfully'));
        }
        catch (error) {
            console.error('Error updating order status:', error);
            return c.json(createErrorResponse(error, 'ORDER_UPDATE_ERROR'), 500);
        }
    }
    async deleteOrder(c) {
        try {
            const id = c.req.param('id');
            const order = await this.db.prepare(`
        SELECT status FROM orders WHERE id = ?
      `).bind(id).first();
            if (!order) {
                return c.json(createErrorResponse('Order not found', 'ORDER_NOT_FOUND'), 404);
            }
            if (order.status === 'completed') {
                return c.json(createErrorResponse('Cannot delete completed orders', 'INVALID_OPERATION'), 400);
            }
            // Restore stock if order is not cancelled
            if (order.status !== 'cancelled') {
                const orderItems = await this.db.prepare(`
          SELECT product_id, quantity FROM order_items WHERE order_id = ?
        `).bind(id).all();
                for (const item of orderItems.results || []) {
                    await this.db.prepare(`
            UPDATE products 
            SET stock = stock + ?, updated_at = ?
            WHERE id = ?
          `).bind(item.quantity, new Date().toISOString(), item.product_id).run();
                }
            }
            // Delete order items first
            await this.db.prepare(`DELETE FROM order_items WHERE order_id = ?`).bind(id).run();
            // Delete order
            await this.db.prepare(`DELETE FROM orders WHERE id = ?`).bind(id).run();
            return c.json(createSuccessResponse(null, 'Order deleted successfully'));
        }
        catch (error) {
            console.error('Error deleting order:', error);
            return c.json(createErrorResponse(error, 'ORDER_DELETE_ERROR'), 500);
        }
    }
    async getOrderStats(c) {
        try {
            const period = c.req.query('period') || 'today';
            let dateFilter = '';
            if (period === 'today') {
                dateFilter = "DATE(created_at) = DATE('now')";
            }
            else if (period === 'week') {
                dateFilter = "DATE(created_at) >= DATE('now', '-7 days')";
            }
            else if (period === 'month') {
                dateFilter = "DATE(created_at) >= DATE('now', '-30 days')";
            }
            else {
                dateFilter = "1=1";
            }
            const stats = await this.db.prepare(`
        SELECT 
          COUNT(*) as total_orders,
          COALESCE(SUM(total), 0) as total_revenue,
          COALESCE(AVG(total), 0) as average_order_value,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders
        FROM orders 
        WHERE ${dateFilter}
      `).first();
            return c.json(createSuccessResponse({
                ...stats,
                formatted_total_revenue: formatVND(stats?.total_revenue || 0),
                formatted_average_order_value: formatVND(stats?.average_order_value || 0)
            }, 'Order statistics retrieved successfully'));
        }
        catch (error) {
            console.error('Error fetching order stats:', error);
            return c.json(createErrorResponse(error, 'ORDER_STATS_ERROR'), 500);
        }
    }
    async getRecentOrders(c) {
        try {
            const limit = parseInt(c.req.query('limit') || '10');
            const orders = await this.db.prepare(`
        SELECT 
          o.id,
          o.total,
          o.status,
          o.created_at,
          c.name as customer_name
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        ORDER BY o.created_at DESC
        LIMIT ?
      `).bind(limit).all();
            const formattedOrders = orders.results?.map(order => ({
                ...order,
                formatted_total: formatVND(order.total)
            })) || [];
            return c.json(createSuccessResponse(formattedOrders, 'Recent orders retrieved successfully'));
        }
        catch (error) {
            console.error('Error fetching recent orders:', error);
            return c.json(createErrorResponse(error, 'RECENT_ORDERS_ERROR'), 500);
        }
    }
}
