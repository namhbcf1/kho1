import { Context } from 'hono';
import { Env } from '../../index';
import { createSuccessResponse, createErrorResponse } from '../../services/database/d1Service';
import { formatVND, calculateVAT, calculateLoyaltyPoints } from '../../utils/vietnamese';

export class POSHandler {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  async quickSale(c: Context<{ Bindings: Env }>) {
    try {
      const saleData = await c.req.json();
      const { 
        items, 
        payment_method = 'cash',
        customer_phone,
        discount = 0,
        received_amount,
        notes 
      } = saleData;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return c.json(createErrorResponse('Sale must contain at least one item', 'VALIDATION_ERROR'), 400);
      }

      let customer_id = null;
      
      // Find customer by phone if provided
      if (customer_phone) {
        const customer = await this.db.prepare(`
          SELECT id FROM customers WHERE phone = ? AND active = 1
        `).bind(customer_phone).first();
        
        customer_id = customer?.id || null;
      }

      const orderId = crypto.randomUUID();
      const currentTime = new Date().toISOString();

      // Calculate totals and validate stock
      let subtotal = 0;
      const orderItems = [];

      for (const item of items) {
        let product;
        
        // Find product by ID or barcode
        if (item.product_id) {
          product = await this.db.prepare(`
            SELECT id, name, price, stock, barcode FROM products 
            WHERE id = ? AND active = 1
          `).bind(item.product_id).first();
        } else if (item.barcode) {
          product = await this.db.prepare(`
            SELECT id, name, price, stock, barcode FROM products 
            WHERE barcode = ? AND active = 1
          `).bind(item.barcode).first();
        }

        if (!product) {
          return c.json(createErrorResponse(`Product not found: ${item.product_id || item.barcode}`, 'PRODUCT_NOT_FOUND'), 400);
        }

        if (product.stock < item.quantity) {
          return c.json(createErrorResponse(`Insufficient stock for ${product.name}. Available: ${product.stock}`, 'INSUFFICIENT_STOCK'), 400);
        }

        const itemTotal = item.quantity * product.price;
        subtotal += itemTotal;

        orderItems.push({
          id: crypto.randomUUID(),
          order_id: orderId,
          product_id: product.id,
          product_name: product.name,
          quantity: item.quantity,
          price: product.price,
          total: itemTotal
        });
      }

      const tax = calculateVAT(subtotal);
      const total = Math.max(0, subtotal + tax - discount);

      // Validate payment amount for cash sales
      if (payment_method === 'cash' && received_amount !== undefined) {
        if (received_amount < total) {
          return c.json(createErrorResponse('Received amount is less than total', 'INSUFFICIENT_PAYMENT'), 400);
        }
      }

      // Create the order
      await this.db.prepare(`
        INSERT INTO orders (
          id, customer_id, subtotal, tax, discount, total, 
          payment_method, status, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?, ?)
      `).bind(
        orderId, customer_id, subtotal, tax, discount, total,
        payment_method, notes || null, currentTime, currentTime
      ).run();

      // Create order items and update stock
      for (const item of orderItems) {
        await this.db.prepare(`
          INSERT INTO order_items (
            id, order_id, product_id, product_name, quantity, price, total
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          item.id, item.order_id, item.product_id, item.product_name,
          item.quantity, item.price, item.total
        ).run();

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
          const pointsEarned = calculateLoyaltyPoints(subtotal, customer.loyalty_tier as string);
          const newPoints = (customer.loyalty_points as number) + pointsEarned;
          const newTotalSpent = (customer.total_spent as number) + total;

          await this.db.prepare(`
            UPDATE customers 
            SET loyalty_points = ?, total_spent = ?, last_visit = ?, updated_at = ?
            WHERE id = ?
          `).bind(newPoints, newTotalSpent, currentTime, currentTime, customer_id).run();

          // Log loyalty points transaction
          if (pointsEarned > 0) {
            await this.db.prepare(`
              INSERT INTO loyalty_transactions (
                id, customer_id, points, type, reason, created_at
              ) VALUES (?, ?, ?, 'add', ?, ?)
            `).bind(
              crypto.randomUUID(), customer_id, pointsEarned,
              `Quick Sale ${orderId}`, currentTime
            ).run();
          }
        }
      }

      // Calculate change for cash payments
      const change = (payment_method === 'cash' && received_amount) 
        ? received_amount - total 
        : 0;

      // Get complete sale data
      const saleResult = {
        order_id: orderId,
        subtotal,
        tax,
        discount,
        total,
        payment_method,
        received_amount: received_amount || total,
        change,
        items: orderItems,
        customer_id,
        formatted_subtotal: formatVND(subtotal),
        formatted_tax: formatVND(tax),
        formatted_discount: formatVND(discount),
        formatted_total: formatVND(total),
        formatted_received: formatVND(received_amount || total),
        formatted_change: formatVND(change),
        created_at: currentTime
      };

      return c.json(createSuccessResponse(saleResult, 'Quick sale completed successfully'), 201);

    } catch (error) {
      console.error('Error processing quick sale:', error);
      return c.json(createErrorResponse(error, 'QUICK_SALE_ERROR'), 500);
    }
  }

  async searchProducts(c: Context<{ Bindings: Env }>) {
    try {
      const query = c.req.query('q') || '';
      const limit = Math.min(parseInt(c.req.query('limit') || '20'), 50);

      if (query.length < 2) {
        return c.json(createSuccessResponse([], 'Search query too short'));
      }

      const products = await this.db.prepare(`
        SELECT 
          id, name, barcode, price, stock, category, image_url
        FROM products 
        WHERE active = 1 
        AND (
          name LIKE ? OR 
          barcode LIKE ? OR
          category LIKE ?
        )
        ORDER BY 
          CASE 
            WHEN name LIKE ? THEN 1
            WHEN barcode = ? THEN 2
            WHEN barcode LIKE ? THEN 3
            ELSE 4
          END,
          name ASC
        LIMIT ?
      `).bind(
        `%${query}%`, `%${query}%`, `%${query}%`,
        `${query}%`, query, `${query}%`,
        limit
      ).all();

      const formattedProducts = products.results?.map(product => ({
        ...product,
        formatted_price: formatVND(product.price as number),
        in_stock: (product.stock as number) > 0
      })) || [];

      return c.json(createSuccessResponse(formattedProducts, 'Products found successfully'));

    } catch (error) {
      console.error('Error searching products:', error);
      return c.json(createErrorResponse(error, 'PRODUCT_SEARCH_ERROR'), 500);
    }
  }

  async getProductByBarcode(c: Context<{ Bindings: Env }>) {
    try {
      const barcode = c.req.param('barcode');

      const product = await this.db.prepare(`
        SELECT 
          id, name, barcode, price, stock, category, image_url, description
        FROM products 
        WHERE barcode = ? AND active = 1
      `).bind(barcode).first();

      if (!product) {
        return c.json(createErrorResponse('Product not found', 'PRODUCT_NOT_FOUND'), 404);
      }

      const formattedProduct = {
        ...product,
        formatted_price: formatVND(product.price as number),
        in_stock: (product.stock as number) > 0
      };

      return c.json(createSuccessResponse(formattedProduct, 'Product found successfully'));

    } catch (error) {
      console.error('Error fetching product by barcode:', error);
      return c.json(createErrorResponse(error, 'BARCODE_FETCH_ERROR'), 500);
    }
  }

  async getCustomerByPhone(c: Context<{ Bindings: Env }>) {
    try {
      const phone = c.req.param('phone');

      const customer = await this.db.prepare(`
        SELECT 
          id, name, phone, email, loyalty_tier, loyalty_points, total_spent
        FROM customers 
        WHERE phone = ? AND active = 1
      `).bind(phone).first();

      if (!customer) {
        return c.json(createErrorResponse('Customer not found', 'CUSTOMER_NOT_FOUND'), 404);
      }

      const formattedCustomer = {
        ...customer,
        formatted_total_spent: formatVND(customer.total_spent as number)
      };

      return c.json(createSuccessResponse(formattedCustomer, 'Customer found successfully'));

    } catch (error) {
      console.error('Error fetching customer by phone:', error);
      return c.json(createErrorResponse(error, 'CUSTOMER_PHONE_FETCH_ERROR'), 500);
    }
  }

  async getDailySalesStats(c: Context<{ Bindings: Env }>) {
    try {
      const date = c.req.query('date') || new Date().toISOString().split('T')[0];

      const stats = await this.db.prepare(`
        SELECT 
          COUNT(*) as total_sales,
          COALESCE(SUM(total), 0) as total_revenue,
          COALESCE(AVG(total), 0) as average_sale,
          COUNT(CASE WHEN payment_method = 'cash' THEN 1 END) as cash_sales,
          COUNT(CASE WHEN payment_method != 'cash' THEN 1 END) as card_sales,
          COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN total ELSE 0 END), 0) as cash_revenue,
          COALESCE(SUM(CASE WHEN payment_method != 'cash' THEN total ELSE 0 END), 0) as card_revenue
        FROM orders 
        WHERE DATE(created_at) = DATE(?) AND status = 'completed'
      `).bind(date).first();

      const hourlyStats = await this.db.prepare(`
        SELECT 
          strftime('%H', created_at) as hour,
          COUNT(*) as sales_count,
          COALESCE(SUM(total), 0) as hourly_revenue
        FROM orders 
        WHERE DATE(created_at) = DATE(?) AND status = 'completed'
        GROUP BY strftime('%H', created_at)
        ORDER BY hour
      `).bind(date).all();

      return c.json(createSuccessResponse({
        date,
        daily_stats: {
          ...stats,
          formatted_total_revenue: formatVND(stats?.total_revenue || 0),
          formatted_average_sale: formatVND(stats?.average_sale || 0),
          formatted_cash_revenue: formatVND(stats?.cash_revenue || 0),
          formatted_card_revenue: formatVND(stats?.card_revenue || 0)
        },
        hourly_breakdown: hourlyStats.results?.map(hour => ({
          ...hour,
          formatted_revenue: formatVND(hour.hourly_revenue as number)
        })) || []
      }, 'Daily sales statistics retrieved successfully'));

    } catch (error) {
      console.error('Error fetching daily sales stats:', error);
      return c.json(createErrorResponse(error, 'DAILY_STATS_ERROR'), 500);
    }
  }

  async getCashDrawerStatus(c: Context<{ Bindings: Env }>) {
    try {
      const today = new Date().toISOString().split('T')[0];

      const cashStats = await this.db.prepare(`
        SELECT 
          COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN total ELSE 0 END), 0) as cash_sales,
          COUNT(CASE WHEN payment_method = 'cash' THEN 1 END) as cash_transactions
        FROM orders 
        WHERE DATE(created_at) = DATE(?) AND status = 'completed'
      `).bind(today).first();

      // This would typically include opening balance, but for now we'll just show sales
      const drawerStatus = {
        opening_balance: 500000, // Default opening balance - should be configurable
        cash_sales: cashStats?.cash_sales || 0,
        cash_transactions: cashStats?.cash_transactions || 0,
        expected_total: 500000 + (cashStats?.cash_sales || 0),
        formatted_opening_balance: formatVND(500000),
        formatted_cash_sales: formatVND(cashStats?.cash_sales || 0),
        formatted_expected_total: formatVND(500000 + (cashStats?.cash_sales || 0))
      };

      return c.json(createSuccessResponse(drawerStatus, 'Cash drawer status retrieved successfully'));

    } catch (error) {
      console.error('Error fetching cash drawer status:', error);
      return c.json(createErrorResponse(error, 'CASH_DRAWER_ERROR'), 500);
    }
  }

  async getRecentTransactions(c: Context<{ Bindings: Env }>) {
    try {
      const limit = parseInt(c.req.query('limit') || '10');

      const transactions = await this.db.prepare(`
        SELECT 
          o.id,
          o.total,
          o.payment_method,
          o.created_at,
          c.name as customer_name,
          COUNT(oi.id) as item_count
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.status = 'completed'
        GROUP BY o.id, o.total, o.payment_method, o.created_at, c.name
        ORDER BY o.created_at DESC
        LIMIT ?
      `).bind(limit).all();

      const formattedTransactions = transactions.results?.map(transaction => ({
        ...transaction,
        formatted_total: formatVND(transaction.total as number)
      })) || [];

      return c.json(createSuccessResponse(formattedTransactions, 'Recent transactions retrieved successfully'));

    } catch (error) {
      console.error('Error fetching recent transactions:', error);
      return c.json(createErrorResponse(error, 'RECENT_TRANSACTIONS_ERROR'), 500);
    }
  }

  async printReceipt(c: Context<{ Bindings: Env }>) {
    try {
      const orderId = c.req.param('id');

      const order = await this.db.prepare(`
        SELECT 
          o.*,
          c.name as customer_name,
          c.phone as customer_phone
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        WHERE o.id = ?
      `).bind(orderId).first();

      if (!order) {
        return c.json(createErrorResponse('Order not found', 'ORDER_NOT_FOUND'), 404);
      }

      const items = await this.db.prepare(`
        SELECT * FROM order_items WHERE order_id = ?
      `).bind(orderId).all();

      const receipt = {
        order_id: orderId,
        created_at: order.created_at,
        customer: order.customer_name ? {
          name: order.customer_name,
          phone: order.customer_phone
        } : null,
        items: items.results?.map(item => ({
          ...item,
          formatted_price: formatVND(item.price as number),
          formatted_total: formatVND(item.total as number)
        })) || [],
        subtotal: order.subtotal,
        tax: order.tax,
        discount: order.discount,
        total: order.total,
        payment_method: order.payment_method,
        formatted_subtotal: formatVND(order.subtotal as number),
        formatted_tax: formatVND(order.tax as number),
        formatted_discount: formatVND(order.discount as number),
        formatted_total: formatVND(order.total as number),
        store_info: {
          name: 'KhoAugment POS',
          address: 'Địa chỉ cửa hàng',
          phone: '1900-xxxx',
          tax_code: '0123456789'
        }
      };

      return c.json(createSuccessResponse(receipt, 'Receipt data generated successfully'));

    } catch (error) {
      console.error('Error generating receipt:', error);
      return c.json(createErrorResponse(error, 'RECEIPT_ERROR'), 500);
    }
  }
}