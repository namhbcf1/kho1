import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

export interface Env {
  DB: D1Database;
  STORAGE: R2Bucket;
  CACHE: KVNamespace;
  ANALYTICS: AnalyticsEngineDataset;
  JWT_SECRET: string;
  CORS_ORIGIN: string;
  ENVIRONMENT: string;
  RATE_LIMIT_REQUESTS: string;
  RATE_LIMIT_WINDOW: string;
}

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.use('*', logger());

// Health check
app.get('/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT || 'development'
  });
});

// API Routes
app.get('/api/v1/products', async (c) => {
  try {
    const results = await c.env.DB.prepare('SELECT * FROM products LIMIT 50').all();
    return c.json({ 
      success: true, 
      data: results.results || [],
      count: results.results?.length || 0
    });
  } catch (error: any) {
    return c.json({ 
      success: false, 
      message: 'Failed to fetch products',
      error: error?.message || 'Unknown error'
    }, 500);
  }
});

app.post('/api/v1/products', async (c) => {
  try {
    const body = await c.req.json();
    const { name, price, barcode, category_id } = body;
    
    const result = await c.env.DB.prepare(
      'INSERT INTO products (name, price, barcode, category_id, created_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(name, price, barcode, category_id, new Date().toISOString()).run();
    
    return c.json({ 
      success: true, 
      data: { id: result.meta?.last_row_id, ...body }
    });
  } catch (error: any) {
    return c.json({ 
      success: false, 
      message: 'Failed to create product',
      error: error?.message || 'Unknown error'
    }, 500);
  }
});

app.get('/api/v1/customers', async (c) => {
  try {
    const results = await c.env.DB.prepare('SELECT * FROM customers LIMIT 50').all();
    return c.json({ 
      success: true, 
      data: results.results || [],
      count: results.results?.length || 0
    });
  } catch (error: any) {
    return c.json({ 
      success: false, 
      message: 'Failed to fetch customers',
      error: error?.message || 'Unknown error'
    }, 500);
  }
});

app.get('/api/v1/analytics/dashboard', async (c) => {
  try {
    return c.json({
      success: true,
      data: {
        totalSales: 150,
        totalRevenue: 45000000,
        totalCustomers: 89,
        totalOrders: 234,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    return c.json({ 
      success: false, 
      message: 'Failed to fetch analytics',
      error: error?.message || 'Unknown error'
    }, 500);
  }
});

// VNPay webhook simulation
app.post('/api/v1/payments/vnpay/webhook', async (c) => {
  try {
    const body = await c.req.json();
    console.log('VNPay webhook received:', body);
    
    return c.json({ 
      success: true, 
      message: 'Webhook processed successfully'
    });
  } catch (error: any) {
    return c.json({ 
      success: false, 
      message: 'Failed to process webhook'
    }, 500);
  }
});

// Catch-all for unmatched routes
app.all('*', (c) => {
  return c.json({ 
    success: false, 
    message: 'Route not found',
    path: c.req.path,
    method: c.req.method
  }, 404);
});

export default app;
