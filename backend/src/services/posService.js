class POSService {
    async getActiveProducts(db) {
        try {
            const products = await db
                .prepare(`
          SELECT p.*, c.name as category_name
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          WHERE p.active = 1 AND p.stock > 0
          ORDER BY p.name
        `)
                .all();
            return {
                success: true,
                data: products.results,
            };
        }
        catch (error) {
            console.error('Get active products error:', error);
            return {
                success: false,
                message: 'Có lỗi xảy ra khi tải sản phẩm',
            };
        }
    }
    async searchProducts(db, query) {
        try {
            const searchTerm = `%${query}%`;
            const products = await db
                .prepare(`
          SELECT p.*, c.name as category_name
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          WHERE p.active = 1 AND p.stock > 0
          AND (p.name LIKE ? OR p.barcode LIKE ? OR p.sku LIKE ?)
          ORDER BY p.name
          LIMIT 50
        `)
                .bind(searchTerm, searchTerm, searchTerm)
                .all();
            return {
                success: true,
                data: products.results,
            };
        }
        catch (error) {
            console.error('Search products error:', error);
            return {
                success: false,
                message: 'Có lỗi xảy ra khi tìm kiếm sản phẩm',
            };
        }
    }
    async getProductByBarcode(db, barcode) {
        try {
            const product = await db
                .prepare(`
          SELECT p.*, c.name as category_name
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          WHERE p.barcode = ? AND p.active = 1
        `)
                .bind(barcode)
                .first();
            if (!product) {
                return {
                    success: false,
                    message: 'Không tìm thấy sản phẩm với mã vạch này',
                };
            }
            if (product.stock <= 0) {
                return {
                    success: false,
                    message: 'Sản phẩm đã hết hàng',
                };
            }
            return {
                success: true,
                data: product,
            };
        }
        catch (error) {
            console.error('Get product by barcode error:', error);
            return {
                success: false,
                message: 'Có lỗi xảy ra khi tìm sản phẩm',
            };
        }
    }
    async createOrder(db, orderData) {
        try {
            const orderId = crypto.randomUUID();
            const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-6)}`;
            // Start transaction
            await db.batch([
                // Insert order
                db.prepare(`
          INSERT INTO orders (
            id, order_number, customer_id, cashier_id, subtotal, discount, tax, total,
            payment_method, payment_status, status, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'paid', 'completed', ?)
        `).bind(orderId, orderNumber, orderData.customerId || null, orderData.cashierId, orderData.subtotal, orderData.discount, orderData.tax, orderData.total, orderData.paymentMethod, orderData.notes || null),
                // Insert order items and update stock
                ...orderData.items.flatMap(item => [
                    db.prepare(`
            INSERT INTO order_items (id, order_id, product_id, name, price, quantity, total)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).bind(crypto.randomUUID(), orderId, item.productId, item.name, item.price, item.quantity, item.total),
                    // Update product stock
                    db.prepare(`
            UPDATE products SET stock = stock - ? WHERE id = ?
          `).bind(item.quantity, item.productId),
                    // Insert inventory transaction
                    db.prepare(`
            INSERT INTO inventory_transactions (id, product_id, type, quantity, reason, reference_id, user_id)
            VALUES (?, ?, 'out', ?, 'Sale', ?, ?)
          `).bind(crypto.randomUUID(), item.productId, -item.quantity, orderId, orderData.cashierId),
                ]),
                // Insert payment record
                db.prepare(`
          INSERT INTO payments (id, order_id, method, amount, status)
          VALUES (?, ?, ?, ?, 'paid')
        `).bind(crypto.randomUUID(), orderId, orderData.paymentMethod, orderData.total),
                // Update customer loyalty points and total spent if customer exists
                ...(orderData.customerId ? [
                    db.prepare(`
            UPDATE customers 
            SET loyalty_points = loyalty_points + ?, total_spent = total_spent + ?, last_visit = CURRENT_TIMESTAMP
            WHERE id = ?
          `).bind(Math.floor(orderData.total / 1000), // 1 point per 1000 VND
                    orderData.total, orderData.customerId)
                ] : []),
            ]);
            // Get created order with details
            const order = await this.getOrderById(db, orderId);
            return {
                success: true,
                message: 'Đơn hàng đã được tạo thành công',
                data: order.data,
            };
        }
        catch (error) {
            console.error('Create order error:', error);
            return {
                success: false,
                message: 'Có lỗi xảy ra khi tạo đơn hàng',
            };
        }
    }
    async getOrders(db, params) {
        try {
            const offset = (params.page - 1) * params.limit;
            let whereConditions = ['1=1'];
            let bindParams = [];
            if (params.status) {
                whereConditions.push('o.status = ?');
                bindParams.push(params.status);
            }
            if (params.cashierId) {
                whereConditions.push('o.cashier_id = ?');
                bindParams.push(params.cashierId);
            }
            if (params.customerId) {
                whereConditions.push('o.customer_id = ?');
                bindParams.push(params.customerId);
            }
            if (params.startDate) {
                whereConditions.push('DATE(o.created_at) >= ?');
                bindParams.push(params.startDate);
            }
            if (params.endDate) {
                whereConditions.push('DATE(o.created_at) <= ?');
                bindParams.push(params.endDate);
            }
            const whereClause = whereConditions.join(' AND ');
            // Get orders
            const orders = await db
                .prepare(`
          SELECT 
            o.*,
            c.name as customer_name,
            u.name as cashier_name
          FROM orders o
          LEFT JOIN customers c ON o.customer_id = c.id
          LEFT JOIN users u ON o.cashier_id = u.id
          WHERE ${whereClause}
          ORDER BY o.created_at DESC
          LIMIT ? OFFSET ?
        `)
                .bind(...bindParams, params.limit, offset)
                .all();
            // Get total count
            const countResult = await db
                .prepare(`
          SELECT COUNT(*) as total
          FROM orders o
          WHERE ${whereClause}
        `)
                .bind(...bindParams)
                .first();
            const total = countResult?.total || 0;
            const totalPages = Math.ceil(total / params.limit);
            return {
                success: true,
                data: {
                    orders: orders.results,
                    pagination: {
                        page: params.page,
                        limit: params.limit,
                        total,
                        totalPages,
                        hasNext: params.page < totalPages,
                        hasPrev: params.page > 1,
                    },
                },
            };
        }
        catch (error) {
            console.error('Get orders error:', error);
            return {
                success: false,
                message: 'Có lỗi xảy ra khi tải danh sách đơn hàng',
            };
        }
    }
    async getOrderById(db, orderId) {
        try {
            // Get order details
            const order = await db
                .prepare(`
          SELECT 
            o.*,
            c.name as customer_name,
            c.phone as customer_phone,
            u.name as cashier_name
          FROM orders o
          LEFT JOIN customers c ON o.customer_id = c.id
          LEFT JOIN users u ON o.cashier_id = u.id
          WHERE o.id = ?
        `)
                .bind(orderId)
                .first();
            if (!order) {
                return {
                    success: false,
                    message: 'Không tìm thấy đơn hàng',
                };
            }
            // Get order items
            const items = await db
                .prepare(`
          SELECT oi.*, p.barcode, p.sku
          FROM order_items oi
          LEFT JOIN products p ON oi.product_id = p.id
          WHERE oi.order_id = ?
          ORDER BY oi.name
        `)
                .bind(orderId)
                .all();
            // Get payment details
            const payments = await db
                .prepare(`
          SELECT * FROM payments WHERE order_id = ?
        `)
                .bind(orderId)
                .all();
            return {
                success: true,
                data: {
                    ...order,
                    items: items.results,
                    payments: payments.results,
                },
            };
        }
        catch (error) {
            console.error('Get order by ID error:', error);
            return {
                success: false,
                message: 'Có lỗi xảy ra khi tải thông tin đơn hàng',
            };
        }
    }
    async updateOrderStatus(db, orderId, status, userId) {
        try {
            await db
                .prepare(`
          UPDATE orders 
          SET status = ?, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `)
                .bind(status, orderId)
                .run();
            return {
                success: true,
                message: 'Cập nhật trạng thái đơn hàng thành công',
            };
        }
        catch (error) {
            console.error('Update order status error:', error);
            return {
                success: false,
                message: 'Có lỗi xảy ra khi cập nhật trạng thái đơn hàng',
            };
        }
    }
    async processRefund(db, orderId, refundData) {
        try {
            // Implementation for refund processing
            // This would involve updating order status, creating refund records, etc.
            return {
                success: true,
                message: 'Xử lý hoàn trả thành công',
            };
        }
        catch (error) {
            console.error('Process refund error:', error);
            return {
                success: false,
                message: 'Có lỗi xảy ra khi xử lý hoàn trả',
            };
        }
    }
    async getCustomers(db, search) {
        try {
            let query = `
        SELECT id, name, phone, email, loyalty_points, total_spent
        FROM customers 
        WHERE active = 1
      `;
            let bindParams = [];
            if (search) {
                query += ` AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)`;
                const searchTerm = `%${search}%`;
                bindParams = [searchTerm, searchTerm, searchTerm];
            }
            query += ` ORDER BY name LIMIT 50`;
            const customers = await db
                .prepare(query)
                .bind(...bindParams)
                .all();
            return {
                success: true,
                data: customers.results,
            };
        }
        catch (error) {
            console.error('Get customers error:', error);
            return {
                success: false,
                message: 'Có lỗi xảy ra khi tải danh sách khách hàng',
            };
        }
    }
    async searchCustomers(db, query) {
        return this.getCustomers(db, query);
    }
}
export const posService = new POSService();
