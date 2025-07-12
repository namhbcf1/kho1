// Report generation handler
import { Context } from 'hono';

export const reportsHandler = {
  async getRevenueReport(c: Context) {
    try {
      const db = c.env.DB;
      const { period = 'week', startDate, endDate, groupBy = 'day' } = c.req.query();

      let dateFilter = '';
      let groupByClause = '';

      // Set date filter based on period
      if (startDate && endDate) {
        dateFilter = `WHERE DATE(created_at) BETWEEN '${startDate}' AND '${endDate}'`;
      } else {
        const now = new Date();
        let fromDate: Date;

        switch (period) {
          case 'today':
            fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'week':
            fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case 'quarter':
            fromDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
            break;
          default:
            fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }

        dateFilter = `WHERE created_at >= '${fromDate.toISOString()}'`;
      }

      // Set group by clause
      switch (groupBy) {
        case 'hour':
          groupByClause = "strftime('%Y-%m-%d %H:00:00', created_at)";
          break;
        case 'day':
          groupByClause = "DATE(created_at)";
          break;
        case 'week':
          groupByClause = "strftime('%Y-W%W', created_at)";
          break;
        case 'month':
          groupByClause = "strftime('%Y-%m', created_at)";
          break;
        default:
          groupByClause = "DATE(created_at)";
      }

      const revenueData = await db.prepare(`
        SELECT 
          ${groupByClause} as date,
          COUNT(*) as orders,
          COALESCE(SUM(total), 0) as revenue,
          COUNT(DISTINCT customer_id) as customers
        FROM orders 
        ${dateFilter} AND status = 'completed'
        GROUP BY ${groupByClause}
        ORDER BY date
      `).all();

      return c.json({
        success: true,
        data: revenueData.results || [],
      });
    } catch (error) {
      console.error('Revenue report error:', error);
      return c.json({
        success: false,
        error: {
          code: 'REPORT_ERROR',
          message: 'Failed to generate revenue report',
        },
      }, 500);
    }
  },

  async getProductReport(c: Context) {
    try {
      const db = c.env.DB;
      const { period = 'week', startDate, endDate } = c.req.query();

      let dateFilter = '';
      if (startDate && endDate) {
        dateFilter = `AND DATE(o.created_at) BETWEEN '${startDate}' AND '${endDate}'`;
      } else {
        const now = new Date();
        const fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = `AND o.created_at >= '${fromDate.toISOString()}'`;
      }

      const productData = await db.prepare(`
        SELECT 
          p.id,
          p.name,
          p.price,
          SUM(oi.quantity) as sold,
          SUM(oi.total) as revenue,
          COUNT(DISTINCT o.id) as orders
        FROM products p
        LEFT JOIN order_items oi ON p.id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.id
        WHERE 1=1 ${dateFilter} AND (o.status = 'completed' OR o.status IS NULL)
        GROUP BY p.id, p.name, p.price
        ORDER BY sold DESC
      `).all();

      return c.json({
        success: true,
        data: productData.results || [],
      });
    } catch (error) {
      console.error('Product report error:', error);
      return c.json({
        success: false,
        error: {
          code: 'REPORT_ERROR',
          message: 'Failed to generate product report',
        },
      }, 500);
    }
  },

  async getCustomerReport(c: Context) {
    try {
      const db = c.env.DB;
      const { period = 'week', startDate, endDate } = c.req.query();

      let dateFilter = '';
      if (startDate && endDate) {
        dateFilter = `AND DATE(o.created_at) BETWEEN '${startDate}' AND '${endDate}'`;
      } else {
        const now = new Date();
        const fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = `AND o.created_at >= '${fromDate.toISOString()}'`;
      }

      const customerData = await db.prepare(`
        SELECT 
          c.id,
          c.name,
          c.email,
          c.phone,
          c.loyalty_points,
          COUNT(o.id) as orders,
          COALESCE(SUM(o.total), 0) as spent,
          AVG(o.total) as average_order
        FROM customers c
        LEFT JOIN orders o ON c.id = o.customer_id
        WHERE 1=1 ${dateFilter} AND (o.status = 'completed' OR o.status IS NULL)
        GROUP BY c.id, c.name, c.email, c.phone, c.loyalty_points
        ORDER BY spent DESC
      `).all();

      return c.json({
        success: true,
        data: customerData.results || [],
      });
    } catch (error) {
      console.error('Customer report error:', error);
      return c.json({
        success: false,
        error: {
          code: 'REPORT_ERROR',
          message: 'Failed to generate customer report',
        },
      }, 500);
    }
  },
};
