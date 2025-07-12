export interface OrderResponse {
  success: boolean;
  message?: string;
  data?: any;
}

class OrderService {
  async getOrders(db: D1Database, params: {
    page: number;
    limit: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<OrderResponse> {
    try {
      const offset = (params.page - 1) * params.limit;
      let whereConditions = ['1=1'];
      let bindParams: any[] = [];

      if (params.status) {
        whereConditions.push('o.status = ?');
        bindParams.push(params.status);
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

      const countResult = await db
        .prepare(`
          SELECT COUNT(*) as total
          FROM orders o
          WHERE ${whereClause}
        `)
        .bind(...bindParams)
        .first();

      const total = countResult?.total as number || 0;
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
    } catch (error) {
      console.error('Get orders error:', error);
      return {
        success: false,
        message: 'Có lỗi xảy ra khi tải đơn hàng',
      };
    }
  }

  async getOrderById(db: D1Database, orderId: string): Promise<OrderResponse> {
    try {
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

      const payments = await db
        .prepare('SELECT * FROM payments WHERE order_id = ?')
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
    } catch (error) {
      console.error('Get order by ID error:', error);
      return {
        success: false,
        message: 'Có lỗi xảy ra khi tải đơn hàng',
      };
    }
  }

  async updateOrderStatus(db: D1Database, orderId: string, status: string): Promise<OrderResponse> {
    try {
      await db
        .prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .bind(status, orderId)
        .run();

      return {
        success: true,
        message: 'Cập nhật trạng thái thành công',
      };
    } catch (error) {
      console.error('Update order status error:', error);
      return {
        success: false,
        message: 'Có lỗi xảy ra khi cập nhật trạng thái',
      };
    }
  }
}

export const orderService = new OrderService();
