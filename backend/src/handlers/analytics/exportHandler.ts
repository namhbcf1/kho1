// Data export handler
import { Context } from 'hono';

export const exportHandler = {
  async exportData(c: Context) {
    try {
      const { type, format = 'json', startDate, endDate } = c.req.query();
      const db = c.env.DB;

      let data: any[] = [];
      let filename = '';

      // Get data based on type
      switch (type) {
        case 'orders':
          data = await this.getOrdersData(db, startDate, endDate);
          filename = `orders-${new Date().toISOString().split('T')[0]}`;
          break;
        case 'products':
          data = await this.getProductsData(db);
          filename = `products-${new Date().toISOString().split('T')[0]}`;
          break;
        case 'customers':
          data = await this.getCustomersData(db);
          filename = `customers-${new Date().toISOString().split('T')[0]}`;
          break;
        case 'revenue':
          data = await this.getRevenueData(db, startDate, endDate);
          filename = `revenue-${new Date().toISOString().split('T')[0]}`;
          break;
        default:
          return c.json({
            success: false,
            error: {
              code: 'INVALID_TYPE',
              message: 'Invalid export type',
            },
          }, 400);
      }

      // Format data based on requested format
      let content: string;
      let contentType: string;

      switch (format) {
        case 'csv':
          content = this.convertToCSV(data);
          contentType = 'text/csv';
          filename += '.csv';
          break;
        case 'excel':
          // For simplicity, return CSV with Excel content type
          content = this.convertToCSV(data);
          contentType = 'application/vnd.ms-excel';
          filename += '.csv';
          break;
        case 'json':
        default:
          content = JSON.stringify(data, null, 2);
          contentType = 'application/json';
          filename += '.json';
          break;
      }

      return new Response(content, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    } catch (error) {
      console.error('Export error:', error);
      return c.json({
        success: false,
        error: {
          code: 'EXPORT_ERROR',
          message: 'Failed to export data',
        },
      }, 500);
    }
  },

  async getOrdersData(db: any, startDate?: string, endDate?: string) {
    let dateFilter = '';
    if (startDate && endDate) {
      dateFilter = `WHERE DATE(created_at) BETWEEN '${startDate}' AND '${endDate}'`;
    }

    const result = await db.prepare(`
      SELECT 
        o.order_number,
        o.customer_id,
        c.name as customer_name,
        o.total,
        o.payment_method,
        o.status,
        o.created_at
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      ${dateFilter}
      ORDER BY o.created_at DESC
    `).all();

    return result.results || [];
  },

  async getProductsData(db: any) {
    const result = await db.prepare(`
      SELECT 
        id,
        name,
        price,
        cost,
        stock,
        min_stock,
        barcode,
        active,
        created_at
      FROM products
      ORDER BY name
    `).all();

    return result.results || [];
  },

  async getCustomersData(db: any) {
    const result = await db.prepare(`
      SELECT 
        id,
        name,
        email,
        phone,
        loyalty_points,
        total_spent,
        total_orders,
        created_at
      FROM customers
      ORDER BY name
    `).all();

    return result.results || [];
  },

  async getRevenueData(db: any, startDate?: string, endDate?: string) {
    let dateFilter = '';
    if (startDate && endDate) {
      dateFilter = `WHERE DATE(created_at) BETWEEN '${startDate}' AND '${endDate}'`;
    }

    const result = await db.prepare(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders,
        SUM(total) as revenue,
        COUNT(DISTINCT customer_id) as customers
      FROM orders
      ${dateFilter} AND status = 'completed'
      GROUP BY DATE(created_at)
      ORDER BY date
    `).all();

    return result.results || [];
  },

  convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    );

    return [csvHeaders, ...csvRows].join('\n');
  },
};
