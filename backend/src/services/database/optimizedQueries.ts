// Optimized database queries for dashboard performance
import { D1Service } from './d1Service';

export class OptimizedDashboardQueries {
  private d1Service: D1Service;

  constructor(database: D1Database) {
    this.d1Service = new D1Service(database, {
      maxRetries: 2,
      baseDelay: 50,
      maxDelay: 500,
      jitter: true
    });
  }

  // Optimized dashboard KPIs query - single query with subqueries
  async getDashboardKPIs() {
    const sql = `
      WITH today_stats AS (
        SELECT 
          COALESCE(SUM(CASE WHEN DATE(created_at) = DATE('now') THEN total_amount ELSE 0 END), 0) as today_revenue,
          COALESCE(COUNT(CASE WHEN DATE(created_at) = DATE('now') AND order_status = 'completed' THEN 1 END), 0) as today_orders,
          COALESCE(COUNT(DISTINCT CASE WHEN DATE(created_at) = DATE('now') THEN customer_id END), 0) as today_customers,
          COALESCE(AVG(CASE WHEN DATE(created_at) = DATE('now') AND order_status = 'completed' THEN total_amount END), 0) as today_avg_order
        FROM orders
        WHERE created_at >= DATE('now', '-30 days')
      ),
      yesterday_stats AS (
        SELECT 
          COALESCE(SUM(CASE WHEN DATE(created_at) = DATE('now', '-1 day') THEN total_amount ELSE 0 END), 0) as yesterday_revenue,
          COALESCE(COUNT(CASE WHEN DATE(created_at) = DATE('now', '-1 day') AND order_status = 'completed' THEN 1 END), 0) as yesterday_orders,
          COALESCE(COUNT(DISTINCT CASE WHEN DATE(created_at) = DATE('now', '-1 day') THEN customer_id END), 0) as yesterday_customers,
          COALESCE(AVG(CASE WHEN DATE(created_at) = DATE('now', '-1 day') AND order_status = 'completed' THEN total_amount END), 0) as yesterday_avg_order
        FROM orders
        WHERE created_at >= DATE('now', '-30 days')
      ),
      month_stats AS (
        SELECT 
          COALESCE(SUM(CASE WHEN strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now') THEN total_amount ELSE 0 END), 0) as month_revenue,
          COALESCE(COUNT(CASE WHEN strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now') AND order_status = 'completed' THEN 1 END), 0) as month_orders,
          COALESCE(COUNT(DISTINCT CASE WHEN strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now') THEN customer_id END), 0) as month_customers
        FROM orders
        WHERE created_at >= DATE('now', '-60 days')
      )
      SELECT 
        t.today_revenue,
        t.today_orders,
        t.today_customers,
        t.today_avg_order as averageOrderValue,
        m.month_revenue,
        m.month_orders,
        m.month_customers,
        -- Calculate growth percentages
        CASE 
          WHEN y.yesterday_revenue > 0 THEN 
            ROUND(((t.today_revenue - y.yesterday_revenue) * 100.0 / y.yesterday_revenue), 2)
          ELSE 0 
        END as revenue_growth,
        CASE 
          WHEN y.yesterday_orders > 0 THEN 
            ROUND(((t.today_orders - y.yesterday_orders) * 100.0 / y.yesterday_orders), 2)
          ELSE 0 
        END as orders_growth,
        CASE 
          WHEN y.yesterday_customers > 0 THEN 
            ROUND(((t.today_customers - y.yesterday_customers) * 100.0 / y.yesterday_customers), 2)
          ELSE 0 
        END as customers_growth,
        CASE 
          WHEN y.yesterday_avg_order > 0 THEN 
            ROUND(((t.today_avg_order - y.yesterday_avg_order) * 100.0 / y.yesterday_avg_order), 2)
          ELSE 0 
        END as avg_order_growth
      FROM today_stats t
      CROSS JOIN yesterday_stats y
      CROSS JOIN month_stats m
    `;

    try {
      const result = await this.d1Service.executeQuery(sql, [], 'getDashboardKPIs');
      
      if (result.results.length === 0) {
        return this.getEmptyKPIs();
      }

      const data = result.results[0] as any;
      
      return {
        todayRevenue: data.today_revenue || 0,
        todayOrders: data.today_orders || 0,
        todayCustomers: data.today_customers || 0,
        averageOrderValue: data.averageOrderValue || 0,
        monthRevenue: data.month_revenue || 0,
        monthOrders: data.month_orders || 0,
        monthCustomers: data.month_customers || 0,
        growth: {
          revenue: data.revenue_growth || 0,
          orders: data.orders_growth || 0,
          customers: data.customers_growth || 0,
          averageOrder: data.avg_order_growth || 0,
        }
      };
    } catch (error) {
      console.error('Error fetching dashboard KPIs:', error);
      return this.getEmptyKPIs();
    }
  }

  // Optimized top products query with pre-calculated revenue and profit
  async getTopProducts(limit: number = 5) {
    const sql = `
      WITH product_sales AS (
        SELECT 
          oi.product_id,
          oi.product_name,
          p.sku,
          c.name as category_name,
          SUM(oi.quantity) as total_sold,
          SUM(oi.total_amount) as total_revenue,
          COUNT(DISTINCT o.id) as order_count,
          AVG(oi.unit_price) as avg_price,
          COALESCE(p.cost_price, 0) as cost_price
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        LEFT JOIN products p ON oi.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE o.order_status = 'completed'
          AND o.created_at >= DATE('now', '-30 days')
        GROUP BY oi.product_id, oi.product_name, p.sku, c.name, p.cost_price
      )
      SELECT 
        product_id as id,
        product_name as name,
        sku,
        category_name as categoryName,
        total_sold as sold,
        total_revenue as revenue,
        order_count,
        avg_price,
        cost_price,
        CASE 
          WHEN cost_price > 0 AND avg_price > 0 THEN 
            ROUND(((avg_price - cost_price) * 100.0 / avg_price), 2)
          ELSE 0 
        END as margin
      FROM product_sales
      WHERE total_sold > 0
      ORDER BY total_revenue DESC, total_sold DESC
      LIMIT ?
    `;

    try {
      const result = await this.d1Service.executeQuery(sql, [limit], 'getTopProducts');
      return result.results || [];
    } catch (error) {
      console.error('Error fetching top products:', error);
      return [];
    }
  }

  // Optimized low stock query with inventory join
  async getLowStockProducts(limit: number = 5) {
    const sql = `
      SELECT 
        p.id,
        p.name,
        p.sku,
        p.min_stock_level as minStock,
        COALESCE(i.quantity_available, 0) as currentStock,
        p.min_stock_level + 10 as reorderLevel,
        p.price,
        c.name as category_name
      FROM products p
      LEFT JOIN inventory i ON p.id = i.product_id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'active'
        AND p.min_stock_level > 0
        AND COALESCE(i.quantity_available, 0) <= p.min_stock_level
      ORDER BY 
        (COALESCE(i.quantity_available, 0) * 1.0 / NULLIF(p.min_stock_level, 0)) ASC,
        p.min_stock_level DESC
      LIMIT ?
    `;

    try {
      const result = await this.d1Service.executeQuery(sql, [limit], 'getLowStockProducts');
      return result.results || [];
    } catch (error) {
      console.error('Error fetching low stock products:', error);
      return [];
    }
  }

  // Optimized revenue chart data with date grouping
  async getRevenueChart(days: number = 7) {
    const sql = `
      WITH date_series AS (
        SELECT DATE('now', '-' || (value - 1) || ' days') as date
        FROM (
          SELECT 0 as value UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 
          UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7
          UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11
          UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15
          UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19
          UNION SELECT 20 UNION SELECT 21 UNION SELECT 22 UNION SELECT 23
          UNION SELECT 24 UNION SELECT 25 UNION SELECT 26 UNION SELECT 27
          UNION SELECT 28 UNION SELECT 29 UNION SELECT 30
        )
        WHERE value < ?
      ),
      daily_sales AS (
        SELECT 
          DATE(created_at) as sale_date,
          SUM(total_amount) as revenue,
          COUNT(*) as orders
        FROM orders
        WHERE order_status = 'completed'
          AND created_at >= DATE('now', '-' || ? || ' days')
        GROUP BY DATE(created_at)
      )
      SELECT 
        ds.date,
        strftime('%d/%m', ds.date) as formatted_date,
        COALESCE(s.revenue, 0) as revenue,
        COALESCE(s.orders, 0) as orders
      FROM date_series ds
      LEFT JOIN daily_sales s ON ds.date = s.sale_date
      ORDER BY ds.date ASC
    `;

    try {
      const result = await this.d1Service.executeQuery(sql, [days, days], 'getRevenueChart');
      
      return result.results.map((row: any) => ({
        date: row.formatted_date,
        revenue: row.revenue || 0,
        orders: row.orders || 0
      }));
    } catch (error) {
      console.error('Error fetching revenue chart:', error);
      return [];
    }
  }

  // Optimized sales distribution for pie chart
  async getSalesChart() {
    const sql = `
      SELECT 
        CASE 
          WHEN total_amount < 100000 THEN 'Dưới 100K'
          WHEN total_amount < 500000 THEN '100K - 500K'
          WHEN total_amount < 1000000 THEN '500K - 1M'
          ELSE 'Trên 1M'
        END as range,
        COUNT(*) as count,
        SUM(total_amount) as revenue
      FROM orders
      WHERE order_status = 'completed'
        AND created_at >= DATE('now', '-30 days')
      GROUP BY 
        CASE 
          WHEN total_amount < 100000 THEN 'Dưới 100K'
          WHEN total_amount < 500000 THEN '100K - 500K'
          WHEN total_amount < 1000000 THEN '500K - 1M'
          ELSE 'Trên 1M'
        END
      ORDER BY revenue DESC
    `;

    try {
      const result = await this.d1Service.executeQuery(sql, [], 'getSalesChart');
      return result.results || [];
    } catch (error) {
      console.error('Error fetching sales chart:', error);
      return [];
    }
  }

  // Batch query for all dashboard data - single database round trip
  async getAllDashboardData() {
    try {
      const [kpis, topProducts, lowStock, revenueChart, salesChart] = await Promise.all([
        this.getDashboardKPIs(),
        this.getTopProducts(5),
        this.getLowStockProducts(5),
        this.getRevenueChart(7),
        this.getSalesChart()
      ]);

      return {
        kpis,
        topProducts,
        lowStock,
        revenueChart,
        salesChart
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }

  private getEmptyKPIs() {
    return {
      todayRevenue: 0,
      todayOrders: 0,
      todayCustomers: 0,
      averageOrderValue: 0,
      monthRevenue: 0,
      monthOrders: 0,
      monthCustomers: 0,
      growth: {
        revenue: 0,
        orders: 0,
        customers: 0,
        averageOrder: 0,
      }
    };
  }
}

export default OptimizedDashboardQueries;