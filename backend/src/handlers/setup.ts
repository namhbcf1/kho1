import { Hono } from 'hono';
import bcrypt from 'bcryptjs';
import type { Env } from '../index';
import { createSuccessResponse, createErrorResponse } from '../services/database/d1Service';

const setupRoutes = new Hono<{ Bindings: Env }>();

// Create basic tables if they don't exist
setupRoutes.post('/create-tables', async (c) => {
  try {
    // Basic users table
    await c.env.DB.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'cashier', 'staff')),
        phone TEXT,
        position TEXT,
        active INTEGER DEFAULT 1,
        last_login DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Basic categories table
    await c.env.DB.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        parent_id TEXT,
        active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES categories(id)
      )
    `);

    // Basic products table
    await c.env.DB.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL DEFAULT 0,
        cost REAL DEFAULT 0,
        stock_quantity INTEGER DEFAULT 0,
        min_stock_level INTEGER DEFAULT 0,
        barcode TEXT UNIQUE,
        sku TEXT UNIQUE,
        category_id TEXT,
        image_url TEXT,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id)
      )
    `);

    // Basic customers table
    await c.env.DB.exec(`
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        phone TEXT,
        address TEXT,
        loyalty_points INTEGER DEFAULT 0,
        total_spent REAL DEFAULT 0,
        active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Basic orders table
    await c.env.DB.exec(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        order_number TEXT UNIQUE NOT NULL,
        customer_id TEXT,
        cashier_id TEXT NOT NULL,
        subtotal REAL NOT NULL DEFAULT 0,
        tax REAL DEFAULT 0,
        total REAL NOT NULL DEFAULT 0,
        payment_method TEXT DEFAULT 'cash',
        payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (cashier_id) REFERENCES users(id)
      )
    `);

    // Basic order_items table
    await c.env.DB.exec(`
      CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        total REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);

    // Basic payments table
    await c.env.DB.exec(`
      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        method TEXT NOT NULL DEFAULT 'cash',
        amount REAL NOT NULL,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
        transaction_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id)
      )
    `);

    // Basic refresh_tokens table for authentication
    await c.env.DB.exec(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id TEXT PRIMARY KEY,
        token TEXT NOT NULL,
        user_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        device_id TEXT,
        ip_address TEXT,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Basic inventory table
    await c.env.DB.exec(`
      CREATE TABLE IF NOT EXISTS inventory (
        id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
        product_id TEXT NOT NULL,
        quantity_available INTEGER DEFAULT 0,
        quantity_reserved INTEGER DEFAULT 0,
        quantity_incoming INTEGER DEFAULT 0,
        quantity_damaged INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);

    return c.json(createSuccessResponse(
      { message: 'Database tables created successfully' }, 
      'Tables created'
    ));

  } catch (error) {
    console.error('Error creating tables:', error);
    return c.json(createErrorResponse(
      'Failed to create database tables: ' + (error instanceof Error ? error.message : 'Unknown error'),
      'SETUP_ERROR'
    ), 500);
  }
});

// Create admin user
setupRoutes.post('/create-admin', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name, role = 'admin' } = body;

    if (!email || !password || !name) {
      return c.json(createErrorResponse(
        'Email, password, and name are required',
        'VALIDATION_ERROR'
      ), 400);
    }

    // Check if admin already exists
    const existingUser = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ? OR role = ?'
    ).bind(email, 'admin').first();

    if (existingUser) {
      return c.json(createErrorResponse(
        'Admin user already exists',
        'USER_EXISTS'
      ), 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = `admin-${Date.now()}`;

    // Create admin user
    await c.env.DB.prepare(`
      INSERT INTO users (id, email, password, name, role, active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(userId, email, hashedPassword, name, role, 1).run();

    // Create some demo categories
    const categories = [
      { id: 'cat-001', name: 'Đồ uống', description: 'Các loại đồ uống' },
      { id: 'cat-002', name: 'Thực phẩm', description: 'Các loại thực phẩm' },
      { id: 'cat-003', name: 'Gia dụng', description: 'Đồ gia dụng' }
    ];

    for (const cat of categories) {
      await c.env.DB.prepare(`
        INSERT OR IGNORE INTO categories (id, name, description, active, created_at, updated_at)
        VALUES (?, ?, ?, 1, datetime('now'), datetime('now'))
      `).bind(cat.id, cat.name, cat.description).run();
    }

    // Create some demo products
    const products = [
      {
        id: 'prod-001',
        name: 'Coca Cola 330ml',
        description: 'Nước ngọt Coca Cola lon 330ml',
        price: 15000,
        cost: 12000,
        stock_quantity: 100,
        barcode: '8934673123456',
        sku: 'COCA-330',
        category_id: 'cat-001'
      },
      {
        id: 'prod-002',
        name: 'Bánh mì sandwich',
        description: 'Bánh mì sandwich thịt nguội',
        price: 35000,
        cost: 25000,
        stock_quantity: 30,
        barcode: '8934673123457',
        sku: 'SANDWICH-001',
        category_id: 'cat-002'
      }
    ];

    for (const product of products) {
      await c.env.DB.prepare(`
        INSERT OR IGNORE INTO products (id, name, description, price, cost, stock_quantity, barcode, sku, category_id, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'), datetime('now'))
      `).bind(
        product.id, product.name, product.description, product.price, 
        product.cost, product.stock_quantity, product.barcode, product.sku, product.category_id
      ).run();

      // Create inventory record
      await c.env.DB.prepare(`
        INSERT OR IGNORE INTO inventory (product_id, quantity_available, created_at, updated_at)
        VALUES (?, ?, datetime('now'), datetime('now'))
      `).bind(product.id, product.stock_quantity).run();
    }

    return c.json(createSuccessResponse(
      { 
        id: userId,
        email: email,
        name: name,
        role: role,
        message: 'Admin user and demo data created successfully'
      }, 
      'Admin created'
    ));

  } catch (error) {
    console.error('Error creating admin:', error);
    return c.json(createErrorResponse(
      'Failed to create admin user: ' + (error instanceof Error ? error.message : 'Unknown error'),
      'ADMIN_CREATION_ERROR'
    ), 500);
  }
});

// Check database status
setupRoutes.get('/status', async (c) => {
  try {
    // Check if tables exist
    const tables = await c.env.DB.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `).all();

    // Check if admin exists
    const adminCount = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM users WHERE role = ?'
    ).bind('admin').first();

    // Check product count
    const productCount = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM products'
    ).first();

    return c.json(createSuccessResponse({
      tables: tables.results?.map((t: any) => t.name) || [],
      tableCount: tables.results?.length || 0,
      adminExists: (adminCount as any)?.count > 0,
      productCount: (productCount as any)?.count || 0,
      databaseReady: tables.results?.length > 0 && (adminCount as any)?.count > 0
    }, 'Database status retrieved'));

  } catch (error) {
    console.error('Error checking status:', error);
    return c.json(createErrorResponse(
      'Failed to check database status: ' + (error instanceof Error ? error.message : 'Unknown error'),
      'STATUS_ERROR'
    ), 500);
  }
});

export { setupRoutes };