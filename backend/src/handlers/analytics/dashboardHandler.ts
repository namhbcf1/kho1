// Dashboard metrics handler
import { Context } from 'hono';

export const dashboardHandler = {
  async getDashboardStats(c: Context) {
    try {
      const db = c.env.DB;
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Today's stats
      const todayStats = await db.prepare(`
        SELECT 
          COUNT(*) as orders,
          COALESCE(SUM(total), 0) as revenue,
          COUNT(DISTINCT customer_id) as customers
        FROM orders 
        WHERE DATE(created_at) = ? AND status = 'completed'
      `).bind(today).first();

      // Yesterday's stats for comparison
      const yesterdayStats = await db.prepare(`
        SELECT 
          COUNT(*) as orders,
          COALESCE(SUM(total), 0) as revenue,
          COUNT(DISTINCT customer_id) as customers
        FROM orders 
        WHERE DATE(created_at) = ? AND status = 'completed'
      `).bind(yesterday).first();

      // Top products
      const topProducts = await db.prepare(`
        SELECT 
          p.id,
          p.name,
          SUM(oi.quantity) as sold,
          SUM(oi.total) as revenue
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
        WHERE DATE(o.created_at) = ? AND o.status = 'completed'
        GROUP BY p.id, p.name
        ORDER BY sold DESC
        LIMIT 5
      `).bind(today).all();

      // Top customers
      const topCustomers = await db.prepare(`
        SELECT 
          c.id,
          c.name,
          COUNT(o.id) as orders,
          SUM(o.total) as spent
        FROM customers c
        JOIN orders o ON c.id = o.customer_id
        WHERE DATE(o.created_at) = ? AND o.status = 'completed'
        GROUP BY c.id, c.name
        ORDER BY spent DESC
        LIMIT 5
      `).bind(today).all();

      const calculateGrowth = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
      };

      const stats = {
        today: {
          revenue: todayStats.revenue || 0,
          orders: todayStats.orders || 0,
          customers: todayStats.customers || 0,
          averageOrder: todayStats.orders > 0 ? (todayStats.revenue / todayStats.orders) : 0,
        },
        growth: {
          revenue: calculateGrowth(todayStats.revenue || 0, yesterdayStats.revenue || 0),
          orders: calculateGrowth(todayStats.orders || 0, yesterdayStats.orders || 0),
          customers: calculateGrowth(todayStats.customers || 0, yesterdayStats.customers || 0),
        },
        topProducts: topProducts.results || [],
        topCustomers: topCustomers.results || [],
      };

      return c.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Dashboard stats error:', error);
      return c.json({
        success: false,
        error: {
          code: 'DASHBOARD_ERROR',
          message: 'Failed to fetch dashboard statistics',
        },
      }, 500);
    }
  },

  async getRealTimeStats(c: Context) {
    try {
      const db = c.env.DB;
      const now = new Date();
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const realtimeStats = await db.prepare(`
        SELECT 
          COUNT(*) as recent_orders,
          COALESCE(SUM(total), 0) as recent_revenue,
          COUNT(DISTINCT customer_id) as recent_customers
        FROM orders 
        WHERE created_at >= ? AND status = 'completed'
      `).bind(hourAgo.toISOString()).first();

      // Active sessions (mock data for demo)
      const activeSessions = Math.floor(Math.random() * 10) + 1;

      return c.json({
        success: true,
        data: {
          activeSessions,
          recentOrders: realtimeStats.recent_orders || 0,
          recentRevenue: realtimeStats.recent_revenue || 0,
          recentCustomers: realtimeStats.recent_customers || 0,
          timestamp: now.toISOString(),
        },
      });
    } catch (error) {
      console.error('Real-time stats error:', error);
      return c.json({
        success: false,
        error: {
          code: 'REALTIME_ERROR',
          message: 'Failed to fetch real-time statistics',
        },
      }, 500);
    }
  },
};
