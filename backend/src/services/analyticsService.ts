export interface AnalyticsResponse {
  success: boolean;
  message?: string;
  data?: any;
}

class AnalyticsService {
  async getDashboardData(db: D1Database): Promise<AnalyticsResponse> {
    try {
      // Today's sales
      const todaySales = await db
        .prepare(`
          SELECT 
            COUNT(*) as orders_count,
            COALESCE(SUM(total), 0) as total_revenue
          FROM orders 
          WHERE DATE(created_at) = DATE('now') 
          AND status = 'completed'
        `)
        .first();

      // This month's sales
      const monthSales = await db
        .prepare(`
          SELECT 
            COUNT(*) as orders_count,
            COALESCE(SUM(total), 0) as total_revenue
          FROM orders 
          WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
          AND status = 'completed'
        `)
        .first();

      // Top products
      const topProducts = await db
        .prepare(`
          SELECT 
            oi.name,
            SUM(oi.quantity) as total_sold,
            SUM(oi.total) as total_revenue
          FROM order_items oi
          JOIN orders o ON oi.order_id = o.id
          WHERE o.status = 'completed'
          AND DATE(o.created_at) >= DATE('now', '-30 days')
          GROUP BY oi.product_id, oi.name
          ORDER BY total_sold DESC
          LIMIT 5
        `)
        .all();

      // Low stock products
      const lowStockProducts = await db
        .prepare(`
          SELECT name, stock, min_stock
          FROM products 
          WHERE active = 1 
          AND stock <= COALESCE(min_stock, 0)
          ORDER BY stock ASC
          LIMIT 10
        `)
        .all();

      return {
        success: true,
        data: {
          todaySales: todaySales,
          monthSales: monthSales,
          topProducts: topProducts.results,
          lowStockProducts: lowStockProducts.results,
        },
      };
    } catch (error) {
      console.error('Get dashboard data error:', error);
      return {
        success: false,
        message: 'Có lỗi xảy ra khi tải dữ liệu dashboard',
      };
    }
  }

  async getSalesAnalytics(db: D1Database, params: {
    startDate?: string;
    endDate?: string;
    groupBy: string;
  }): Promise<AnalyticsResponse> {
    try {
      let dateFormat = '%Y-%m-%d';
      if (params.groupBy === 'month') {
        dateFormat = '%Y-%m';
      } else if (params.groupBy === 'year') {
        dateFormat = '%Y';
      }

      let whereConditions = ["status = 'completed'"];
      let bindParams: any[] = [];

      if (params.startDate) {
        whereConditions.push('DATE(created_at) >= ?');
        bindParams.push(params.startDate);
      }

      if (params.endDate) {
        whereConditions.push('DATE(created_at) <= ?');
        bindParams.push(params.endDate);
      }

      const whereClause = whereConditions.join(' AND ');

      const salesData = await db
        .prepare(`
          SELECT 
            strftime('${dateFormat}', created_at) as period,
            COUNT(*) as orders_count,
            SUM(total) as total_revenue,
            AVG(total) as avg_order_value
          FROM orders
          WHERE ${whereClause}
          GROUP BY strftime('${dateFormat}', created_at)
          ORDER BY period
        `)
        .bind(...bindParams)
        .all();

      return {
        success: true,
        data: salesData.results,
      };
    } catch (error) {
      console.error('Get sales analytics error:', error);
      return {
        success: false,
        message: 'Có lỗi xảy ra khi tải báo cáo bán hàng',
      };
    }
  }

  async getRevenueAnalytics(db: D1Database, params: {
    startDate?: string;
    endDate?: string;
  }): Promise<AnalyticsResponse> {
    try {
      let whereConditions = ["status = 'completed'"];
      let bindParams: any[] = [];

      if (params.startDate) {
        whereConditions.push('DATE(created_at) >= ?');
        bindParams.push(params.startDate);
      }

      if (params.endDate) {
        whereConditions.push('DATE(created_at) <= ?');
        bindParams.push(params.endDate);
      }

      const whereClause = whereConditions.join(' AND ');

      // Revenue by payment method
      const revenueByPayment = await db
        .prepare(`
          SELECT 
            payment_method,
            COUNT(*) as orders_count,
            SUM(total) as total_revenue
          FROM orders
          WHERE ${whereClause}
          GROUP BY payment_method
          ORDER BY total_revenue DESC
        `)
        .bind(...bindParams)
        .all();

      // Daily revenue trend
      const dailyRevenue = await db
        .prepare(`
          SELECT 
            DATE(created_at) as date,
            SUM(total) as revenue,
            COUNT(*) as orders
          FROM orders
          WHERE ${whereClause}
          GROUP BY DATE(created_at)
          ORDER BY date DESC
          LIMIT 30
        `)
        .bind(...bindParams)
        .all();

      return {
        success: true,
        data: {
          revenueByPayment: revenueByPayment.results,
          dailyRevenue: dailyRevenue.results,
        },
      };
    } catch (error) {
      console.error('Get revenue analytics error:', error);
      return {
        success: false,
        message: 'Có lỗi xảy ra khi tải báo cáo doanh thu',
      };
    }
  }
}

export const analyticsService = new AnalyticsService();
