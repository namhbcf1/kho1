import { Context } from 'hono';
import { Env } from '../../index';
import { createSuccessResponse, createErrorResponse } from '../../services/database/d1Service';
import { 
  calculateLoyaltyTier, 
  calculateLoyaltyPoints, 
  vietnameseLoyaltyTiers 
} from '../../utils/vietnamese';

export class CustomerHandler {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  async getCustomers(c: Context<{ Bindings: Env }>) {
    try {
      const page = parseInt(c.req.query('page') || '1');
      const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
      const search = c.req.query('search');
      const tier = c.req.query('tier');

      const offset = (page - 1) * limit;
      
      let whereClause = 'WHERE active = 1';
      const params: any[] = [];

      if (search) {
        whereClause += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      if (tier) {
        whereClause += ' AND loyalty_tier = ?';
        params.push(tier);
      }

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM customers ${whereClause}`;
      const countResult = await this.db.prepare(countQuery).bind(...params).first();
      const total = countResult?.total || 0;

      // Get customers
      const customersQuery = `
        SELECT 
          id,
          name,
          phone,
          email,
          address,
          loyalty_tier,
          loyalty_points,
          total_spent,
          join_date,
          last_visit,
          created_at,
          updated_at
        FROM customers 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;

      const customersResult = await this.db.prepare(customersQuery)
        .bind(...params, limit, offset)
        .all();

      const customers = customersResult.results?.map(customer => ({
        ...customer,
        // Calculate current tier based on spending
        calculated_tier: calculateLoyaltyTier(customer.total_spent as number),
        tier_info: vietnameseLoyaltyTiers.find(t => t.id === customer.loyalty_tier)
      })) || [];

      return c.json(createSuccessResponse({
        customers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }, 'Customers retrieved successfully'));

    } catch (error) {
      console.error('Error fetching customers:', error);
      return c.json(createErrorResponse(error, 'CUSTOMERS_FETCH_ERROR'), 500);
    }
  }

  async getCustomerById(c: Context<{ Bindings: Env }>) {
    try {
      const id = c.req.param('id');
      
      const customer = await this.db.prepare(`
        SELECT 
          id,
          name,
          phone,
          email,
          address,
          loyalty_tier,
          loyalty_points,
          total_spent,
          join_date,
          last_visit,
          created_at,
          updated_at
        FROM customers 
        WHERE id = ? AND active = 1
      `).bind(id).first();

      if (!customer) {
        return c.json(createErrorResponse('Customer not found', 'CUSTOMER_NOT_FOUND'), 404);
      }

      // Get customer's order history
      const orders = await this.db.prepare(`
        SELECT 
          id,
          total,
          status,
          created_at
        FROM orders 
        WHERE customer_id = ?
        ORDER BY created_at DESC
        LIMIT 10
      `).bind(id).all();

      const customerData = {
        ...customer,
        calculated_tier: calculateLoyaltyTier(customer.total_spent as number),
        tier_info: vietnameseLoyaltyTiers.find(t => t.id === customer.loyalty_tier),
        recent_orders: orders.results || []
      };

      return c.json(createSuccessResponse(customerData, 'Customer retrieved successfully'));

    } catch (error) {
      console.error('Error fetching customer:', error);
      return c.json(createErrorResponse(error, 'CUSTOMER_FETCH_ERROR'), 500);
    }
  }

  async createCustomer(c: Context<{ Bindings: Env }>) {
    try {
      const { name, phone, email, address } = await c.req.json();

      if (!name || !phone) {
        return c.json(createErrorResponse('Name and phone are required', 'VALIDATION_ERROR'), 400);
      }

      // Check if customer already exists
      const existingCustomer = await this.db.prepare(`
        SELECT id FROM customers WHERE phone = ? AND active = 1
      `).bind(phone).first();

      if (existingCustomer) {
        return c.json(createErrorResponse('Customer with this phone already exists', 'CUSTOMER_EXISTS'), 400);
      }

      const customerId = crypto.randomUUID();
      const currentTime = new Date().toISOString();

      await this.db.prepare(`
        INSERT INTO customers (
          id, name, phone, email, address, loyalty_tier, 
          loyalty_points, total_spent, join_date, last_visit,
          active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 'bronze', 0, 0, ?, ?, 1, ?, ?)
      `).bind(
        customerId, name, phone, email || null, address || null,
        currentTime, currentTime, currentTime, currentTime
      ).run();

      const newCustomer = await this.db.prepare(`
        SELECT * FROM customers WHERE id = ?
      `).bind(customerId).first();

      return c.json(createSuccessResponse(newCustomer, 'Customer created successfully'), 201);

    } catch (error) {
      console.error('Error creating customer:', error);
      return c.json(createErrorResponse(error, 'CUSTOMER_CREATE_ERROR'), 500);
    }
  }

  async updateCustomer(c: Context<{ Bindings: Env }>) {
    try {
      const id = c.req.param('id');
      const updates = await c.req.json();

      // Validate customer exists
      const existingCustomer = await this.db.prepare(`
        SELECT * FROM customers WHERE id = ? AND active = 1
      `).bind(id).first();

      if (!existingCustomer) {
        return c.json(createErrorResponse('Customer not found', 'CUSTOMER_NOT_FOUND'), 404);
      }

      const allowedFields = ['name', 'phone', 'email', 'address'];
      const setClause: string[] = [];
      const params: any[] = [];

      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          setClause.push(`${field} = ?`);
          params.push(updates[field]);
        }
      }

      if (setClause.length === 0) {
        return c.json(createErrorResponse('No valid fields to update', 'VALIDATION_ERROR'), 400);
      }

      setClause.push('updated_at = ?');
      params.push(new Date().toISOString());
      params.push(id);

      await this.db.prepare(`
        UPDATE customers 
        SET ${setClause.join(', ')}
        WHERE id = ?
      `).bind(...params).run();

      const updatedCustomer = await this.db.prepare(`
        SELECT * FROM customers WHERE id = ?
      `).bind(id).first();

      return c.json(createSuccessResponse(updatedCustomer, 'Customer updated successfully'));

    } catch (error) {
      console.error('Error updating customer:', error);
      return c.json(createErrorResponse(error, 'CUSTOMER_UPDATE_ERROR'), 500);
    }
  }

  async deleteCustomer(c: Context<{ Bindings: Env }>) {
    try {
      const id = c.req.param('id');

      const customer = await this.db.prepare(`
        SELECT id FROM customers WHERE id = ? AND active = 1
      `).bind(id).first();

      if (!customer) {
        return c.json(createErrorResponse('Customer not found', 'CUSTOMER_NOT_FOUND'), 404);
      }

      // Soft delete
      await this.db.prepare(`
        UPDATE customers 
        SET active = 0, updated_at = ?
        WHERE id = ?
      `).bind(new Date().toISOString(), id).run();

      return c.json(createSuccessResponse(null, 'Customer deleted successfully'));

    } catch (error) {
      console.error('Error deleting customer:', error);
      return c.json(createErrorResponse(error, 'CUSTOMER_DELETE_ERROR'), 500);
    }
  }

  async addLoyaltyPoints(c: Context<{ Bindings: Env }>) {
    try {
      const customerId = c.req.param('id');
      const { points, reason } = await c.req.json();

      if (!points || points <= 0) {
        return c.json(createErrorResponse('Points must be positive', 'VALIDATION_ERROR'), 400);
      }

      const customer = await this.db.prepare(`
        SELECT * FROM customers WHERE id = ? AND active = 1
      `).bind(customerId).first();

      if (!customer) {
        return c.json(createErrorResponse('Customer not found', 'CUSTOMER_NOT_FOUND'), 404);
      }

      const newPoints = (customer.loyalty_points as number) + points;
      const newTier = calculateLoyaltyTier(customer.total_spent as number);

      await this.db.prepare(`
        UPDATE customers 
        SET loyalty_points = ?, loyalty_tier = ?, updated_at = ?
        WHERE id = ?
      `).bind(newPoints, newTier, new Date().toISOString(), customerId).run();

      // Log the points transaction
      await this.db.prepare(`
        INSERT INTO loyalty_transactions (
          id, customer_id, points, type, reason, created_at
        ) VALUES (?, ?, ?, 'add', ?, ?)
      `).bind(
        crypto.randomUUID(),
        customerId,
        points,
        reason || 'Manual addition',
        new Date().toISOString()
      ).run();

      const updatedCustomer = await this.db.prepare(`
        SELECT * FROM customers WHERE id = ?
      `).bind(customerId).first();

      return c.json(createSuccessResponse(updatedCustomer, 'Loyalty points added successfully'));

    } catch (error) {
      console.error('Error adding loyalty points:', error);
      return c.json(createErrorResponse(error, 'LOYALTY_POINTS_ERROR'), 500);
    }
  }

  async redeemLoyaltyPoints(c: Context<{ Bindings: Env }>) {
    try {
      const customerId = c.req.param('id');
      const { points, reason } = await c.req.json();

      if (!points || points <= 0) {
        return c.json(createErrorResponse('Points must be positive', 'VALIDATION_ERROR'), 400);
      }

      const customer = await this.db.prepare(`
        SELECT * FROM customers WHERE id = ? AND active = 1
      `).bind(customerId).first();

      if (!customer) {
        return c.json(createErrorResponse('Customer not found', 'CUSTOMER_NOT_FOUND'), 404);
      }

      if ((customer.loyalty_points as number) < points) {
        return c.json(createErrorResponse('Insufficient loyalty points', 'INSUFFICIENT_POINTS'), 400);
      }

      const newPoints = (customer.loyalty_points as number) - points;

      await this.db.prepare(`
        UPDATE customers 
        SET loyalty_points = ?, updated_at = ?
        WHERE id = ?
      `).bind(newPoints, new Date().toISOString(), customerId).run();

      // Log the points transaction
      await this.db.prepare(`
        INSERT INTO loyalty_transactions (
          id, customer_id, points, type, reason, created_at
        ) VALUES (?, ?, ?, 'redeem', ?, ?)
      `).bind(
        crypto.randomUUID(),
        customerId,
        points,
        reason || 'Points redemption',
        new Date().toISOString()
      ).run();

      const updatedCustomer = await this.db.prepare(`
        SELECT * FROM customers WHERE id = ?
      `).bind(customerId).first();

      return c.json(createSuccessResponse(updatedCustomer, 'Loyalty points redeemed successfully'));

    } catch (error) {
      console.error('Error redeeming loyalty points:', error);
      return c.json(createErrorResponse(error, 'LOYALTY_REDEEM_ERROR'), 500);
    }
  }

  async getLoyaltyTiers(c: Context<{ Bindings: Env }>) {
    try {
      return c.json(createSuccessResponse(vietnameseLoyaltyTiers, 'Loyalty tiers retrieved successfully'));
    } catch (error) {
      console.error('Error fetching loyalty tiers:', error);
      return c.json(createErrorResponse(error, 'LOYALTY_TIERS_ERROR'), 500);
    }
  }

  async getCustomersByTier(c: Context<{ Bindings: Env }>) {
    try {
      const tier = c.req.param('tier');

      if (!vietnameseLoyaltyTiers.find(t => t.id === tier)) {
        return c.json(createErrorResponse('Invalid loyalty tier', 'VALIDATION_ERROR'), 400);
      }

      const customers = await this.db.prepare(`
        SELECT 
          id, name, phone, email, loyalty_tier, loyalty_points, total_spent
        FROM customers 
        WHERE loyalty_tier = ? AND active = 1
        ORDER BY total_spent DESC
      `).bind(tier).all();

      return c.json(createSuccessResponse(customers.results || [], 'Customers by tier retrieved successfully'));

    } catch (error) {
      console.error('Error fetching customers by tier:', error);
      return c.json(createErrorResponse(error, 'CUSTOMERS_BY_TIER_ERROR'), 500);
    }
  }
}