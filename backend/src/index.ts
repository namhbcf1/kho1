// Main API entry point with comprehensive D1 integration and error handling
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { ProductService } from './services/database/productService';
import { createErrorResponse, createSuccessResponse } from './services/database/d1Service';
import { OptimizedDashboardQueries } from './services/database/optimizedQueries';
import { securityHeaders, rateLimiter, csrfProtection } from './middleware/security';
import { enhancedAuth, requirePermission, requireRole } from './middleware/enhancedAuth';
import { enhancedAuthService } from './services/enhancedAuthService';
import { authRoutes } from './handlers/auth';

// Environment interface with all required bindings
export interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  STORAGE?: R2Bucket;
  ANALYTICS?: AnalyticsEngineDataset;
  
  // Environment variables
  JWT_SECRET: string;
  REFRESH_SECRET?: string;
  CORS_ORIGIN: string;
  ENVIRONMENT: string;
  API_VERSION: string;
  BASE_URL: string;
  RATE_LIMIT_REQUESTS: string;
  RATE_LIMIT_WINDOW: string;
  BCRYPT_ROUNDS?: string;
  SESSION_TIMEOUT?: string;
  ADMIN_EMAIL?: string;
}

// Create Hono app with proper typing
const app = new Hono<{ Bindings: Env }>();

// Security middleware
app.use('*', securityHeaders());
app.use('*', prettyJSON());
app.use('*', logger());

// Rate limiting for authentication endpoints
app.use('/api/*/auth/login', rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 login attempts per 15 minutes
}));

app.use('/api/*/auth/register', rateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3, // 3 registration attempts per hour
}));

// General rate limiting
app.use('/api/*', rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: parseInt(process.env.RATE_LIMIT_REQUESTS || '1000'),
}));

// CSRF protection for state-changing operations
app.use('/api/*/auth/csrf-token', csrfProtection());
app.use('/api/*', async (c, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(c.req.method)) {
    return csrfProtection()(c, next);
  }
  await next();
});

// CORS middleware with environment-specific origins
app.use('*', async (c, next) => {
  const corsOrigin = c.env.CORS_ORIGIN || '*';
  const origins = corsOrigin.split(',').map(origin => origin.trim());
  
  await cors({
    origin: origins,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-Requested-With',
      'Accept',
      'Cache-Control'
    ],
    exposeHeaders: ['X-Total-Count', 'X-Rate-Limit-Remaining'],
    credentials: true,
    maxAge: 86400, // 24 hours
  })(c, next);
});

// Global error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  
  const isDevelopment = c.env.ENVIRONMENT === 'development';
  
  return c.json(createErrorResponse(
    isDevelopment ? err.message : 'Internal server error',
    'INTERNAL_ERROR'
  ), 500);
});

// Health check endpoint
app.get('/health', async (c) => {
  try {
    const startTime = Date.now();
    
    // Test database connection
    const dbHealth = await testDatabaseConnection(c.env.DB);
    
    // Test cache connection if available
    let cacheHealth = { healthy: true, latency: 0 };
    if (c.env.CACHE) {
      try {
        const cacheStart = Date.now();
        await c.env.CACHE.put('health-check', 'ok', { expirationTtl: 60 });
        const cacheValue = await c.env.CACHE.get('health-check');
        cacheHealth = {
          healthy: cacheValue === 'ok',
          latency: Date.now() - cacheStart
        };
      } catch (error) {
        cacheHealth = { healthy: false, latency: Date.now() - startTime };
      }
    }
    
    const totalLatency = Date.now() - startTime;
    const isHealthy = dbHealth.healthy && cacheHealth.healthy;
    
    const healthData = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      environment: c.env.ENVIRONMENT || 'unknown',
      version: c.env.API_VERSION || '1.0.0',
      latency: {
        total: totalLatency,
        database: dbHealth.latency,
        cache: cacheHealth.latency
      },
      services: {
        database: dbHealth.healthy,
        cache: cacheHealth.healthy,
        storage: !!c.env.STORAGE,
        analytics: !!c.env.ANALYTICS
      }
    };
    
    return c.json(
      isHealthy 
        ? createSuccessResponse(healthData, 'Service is healthy')
        : createErrorResponse('Service is unhealthy', 'HEALTH_CHECK_FAILED'),
      isHealthy ? 200 : 503
    );
    
  } catch (error) {
    console.error('Health check error:', error);
    return c.json(createErrorResponse(
      'Health check failed',
      'HEALTH_CHECK_ERROR'
    ), 503);
  }
});

// Database connection test
async function testDatabaseConnection(db: D1Database) {
  const startTime = Date.now();
  
  try {
    await db.prepare('SELECT 1 as test').first();
    return {
      healthy: true,
      latency: Date.now() - startTime
    };
  } catch (error) {
    console.error('Database health check failed:', error);
    return {
      healthy: false,
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// API Routes with proper error handling

// Products API
app.get('/api/v1/products', async (c) => {
  try {
    const productService = new ProductService(c.env.DB);
    
    // Parse query parameters
    const searchParams = {
      page: parseInt(c.req.query('page') || '1'),
      limit: Math.min(parseInt(c.req.query('limit') || '50'), 100),
      query: c.req.query('query'),
      category: c.req.query('category'),
      status: c.req.query('status') as 'active' | 'inactive' | undefined,
    };
    
    const result = await productService.getProducts(searchParams);
    
    // Set total count header for client pagination
    if (result.pagination) {
      c.header('X-Total-Count', result.pagination.total.toString());
    }
    
    return c.json(result, result.success ? 200 : 400);
    
  } catch (error) {
    console.error('Error in GET /api/v1/products:', error);
    return c.json(createErrorResponse(error, 'PRODUCTS_FETCH_ERROR'), 500);
  }
});

app.get('/api/v1/products/:id', async (c) => {
  try {
    const productService = new ProductService(c.env.DB);
    const idParam = c.req.param('id');
    
    // Validate and sanitize ID parameter
    if (!/^\d+$/.test(idParam)) {
      return c.json(createErrorResponse('Invalid product ID format', 'VALIDATION_ERROR'), 400);
    }
    
    const id = parseInt(idParam);
    
    if (isNaN(id) || id <= 0) {
      return c.json(createErrorResponse('Invalid product ID', 'VALIDATION_ERROR'), 400);
    }
    
    const result = await productService.getProductById(id);
    return c.json(result, result.success ? 200 : 404);
    
  } catch (error) {
    console.error('Error in GET /api/v1/products/:id:', error);
    return c.json(createErrorResponse(error, 'PRODUCT_FETCH_ERROR'), 500);
  }
});

app.get('/api/v1/products/barcode/:barcode', async (c) => {
  try {
    const productService = new ProductService(c.env.DB);
    const barcode = c.req.param('barcode');
    
    const result = await productService.getProductByBarcode(barcode);
    return c.json(result, result.success ? 200 : 404);
    
  } catch (error) {
    console.error('Error in GET /api/v1/products/barcode/:barcode:', error);
    return c.json(createErrorResponse(error, 'PRODUCT_BARCODE_FETCH_ERROR'), 500);
  }
});

app.post('/api/v1/products', async (c) => {
  try {
    const productService = new ProductService(c.env.DB);
    
    let body;
    try {
      body = await c.req.json();
    } catch (error) {
      return c.json(createErrorResponse('Invalid JSON in request body', 'VALIDATION_ERROR'), 400);
    }
    
    const result = await productService.createProduct(body);
    return c.json(result, result.success ? 201 : 400);
    
  } catch (error) {
    console.error('Error in POST /api/v1/products:', error);
    return c.json(createErrorResponse(error, 'PRODUCT_CREATE_ERROR'), 500);
  }
});

app.put('/api/v1/products/:id', async (c) => {
  try {
    const productService = new ProductService(c.env.DB);
    const idParam = c.req.param('id');
    
    // Validate and sanitize ID parameter
    if (!/^\d+$/.test(idParam)) {
      return c.json(createErrorResponse('Invalid product ID format', 'VALIDATION_ERROR'), 400);
    }
    
    const id = parseInt(idParam);
    
    if (isNaN(id) || id <= 0) {
      return c.json(createErrorResponse('Invalid product ID', 'VALIDATION_ERROR'), 400);
    }
    
    let body;
    try {
      body = await c.req.json();
    } catch (error) {
      return c.json(createErrorResponse('Invalid JSON in request body', 'VALIDATION_ERROR'), 400);
    }
    
    const result = await productService.updateProduct(id, body);
    return c.json(result, result.success ? 200 : 400);
    
  } catch (error) {
    console.error('Error in PUT /api/v1/products/:id:', error);
    return c.json(createErrorResponse(error, 'PRODUCT_UPDATE_ERROR'), 500);
  }
});

app.delete('/api/v1/products/:id', async (c) => {
  try {
    const productService = new ProductService(c.env.DB);
    const idParam = c.req.param('id');
    
    // Validate and sanitize ID parameter
    if (!/^\d+$/.test(idParam)) {
      return c.json(createErrorResponse('Invalid product ID format', 'VALIDATION_ERROR'), 400);
    }
    
    const id = parseInt(idParam);
    
    if (isNaN(id) || id <= 0) {
      return c.json(createErrorResponse('Invalid product ID', 'VALIDATION_ERROR'), 400);
    }
    
    const result = await productService.deleteProduct(id);
    return c.json(result, result.success ? 200 : 400);
    
  } catch (error) {
    console.error('Error in DELETE /api/v1/products/:id:', error);
    return c.json(createErrorResponse(error, 'PRODUCT_DELETE_ERROR'), 500);
  }
});

app.get('/api/v1/products/stock/low', async (c) => {
  try {
    const productService = new ProductService(c.env.DB);
    const result = await productService.getLowStockProducts();
    return c.json(result, result.success ? 200 : 500);
    
  } catch (error) {
    console.error('Error in GET /api/v1/products/stock/low:', error);
    return c.json(createErrorResponse(error, 'LOW_STOCK_FETCH_ERROR'), 500);
  }
});

app.put('/api/v1/products/:id/stock', async (c) => {
  try {
    const productService = new ProductService(c.env.DB);
    const idParam = c.req.param('id');
    
    // Validate and sanitize ID parameter
    if (!/^\d+$/.test(idParam)) {
      return c.json(createErrorResponse('Invalid product ID format', 'VALIDATION_ERROR'), 400);
    }
    
    const id = parseInt(idParam);
    
    if (isNaN(id) || id <= 0) {
      return c.json(createErrorResponse('Invalid product ID', 'VALIDATION_ERROR'), 400);
    }
    
    let body;
    try {
      body = await c.req.json();
    } catch (error) {
      return c.json(createErrorResponse('Invalid JSON in request body', 'VALIDATION_ERROR'), 400);
    }
    
    const { quantity, operation = 'set' } = body;
    
    if (typeof quantity !== 'number' || quantity < 0) {
      return c.json(createErrorResponse('Invalid quantity', 'VALIDATION_ERROR'), 400);
    }
    
    if (!['set', 'add', 'subtract'].includes(operation)) {
      return c.json(createErrorResponse('Invalid operation', 'VALIDATION_ERROR'), 400);
    }
    
    const result = await productService.updateStock(id, quantity, operation);
    return c.json(result, result.success ? 200 : 400);
    
  } catch (error) {
    console.error('Error in PUT /api/v1/products/:id/stock:', error);
    return c.json(createErrorResponse(error, 'STOCK_UPDATE_ERROR'), 500);
  }
});

app.get('/api/v1/categories', async (c) => {
  try {
    const productService = new ProductService(c.env.DB);
    const result = await productService.getCategories();
    return c.json(result, result.success ? 200 : 500);
    
  } catch (error) {
    console.error('Error in GET /api/v1/categories:', error);
    return c.json(createErrorResponse(error, 'CATEGORIES_FETCH_ERROR'), 500);
  }
});

// Analytics endpoints with optimized queries
app.get('/api/v1/analytics/dashboard', async (c) => {
  try {
    const dashboardQueries = new OptimizedDashboardQueries(c.env.DB);
    const kpis = await dashboardQueries.getDashboardKPIs();
    
    return c.json(createSuccessResponse(kpis, 'Dashboard KPIs retrieved successfully'));
    
  } catch (error) {
    console.error('Error in GET /api/v1/analytics/dashboard:', error);
    return c.json(createErrorResponse(error, 'ANALYTICS_FETCH_ERROR'), 500);
  }
});

app.get('/api/v1/analytics/top-products', async (c) => {
  try {
    const dashboardQueries = new OptimizedDashboardQueries(c.env.DB);
    const limit = parseInt(c.req.query('limit') || '5');
    const products = await dashboardQueries.getTopProducts(limit);
    
    return c.json(createSuccessResponse(products, 'Top products retrieved successfully'));
    
  } catch (error) {
    console.error('Error in GET /api/v1/analytics/top-products:', error);
    return c.json(createErrorResponse(error, 'TOP_PRODUCTS_FETCH_ERROR'), 500);
  }
});

app.get('/api/v1/analytics/low-stock', async (c) => {
  try {
    const dashboardQueries = new OptimizedDashboardQueries(c.env.DB);
    const limit = parseInt(c.req.query('limit') || '5');
    const products = await dashboardQueries.getLowStockProducts(limit);
    
    return c.json(createSuccessResponse(products, 'Low stock products retrieved successfully'));
    
  } catch (error) {
    console.error('Error in GET /api/v1/analytics/low-stock:', error);
    return c.json(createErrorResponse(error, 'LOW_STOCK_FETCH_ERROR'), 500);
  }
});

app.get('/api/v1/analytics/revenue-chart', async (c) => {
  try {
    const dashboardQueries = new OptimizedDashboardQueries(c.env.DB);
    const days = parseInt(c.req.query('days') || '7');
    const chartData = await dashboardQueries.getRevenueChart(days);
    
    return c.json(createSuccessResponse(chartData, 'Revenue chart data retrieved successfully'));
    
  } catch (error) {
    console.error('Error in GET /api/v1/analytics/revenue-chart:', error);
    return c.json(createErrorResponse(error, 'REVENUE_CHART_FETCH_ERROR'), 500);
  }
});

app.get('/api/v1/analytics/sales-chart', async (c) => {
  try {
    const dashboardQueries = new OptimizedDashboardQueries(c.env.DB);
    const chartData = await dashboardQueries.getSalesChart();
    
    return c.json(createSuccessResponse(chartData, 'Sales chart data retrieved successfully'));
    
  } catch (error) {
    console.error('Error in GET /api/v1/analytics/sales-chart:', error);
    return c.json(createErrorResponse(error, 'SALES_CHART_FETCH_ERROR'), 500);
  }
});

app.get('/api/v1/analytics/all', async (c) => {
  try {
    const dashboardQueries = new OptimizedDashboardQueries(c.env.DB);
    const allData = await dashboardQueries.getAllDashboardData();
    
    return c.json(createSuccessResponse(allData, 'All dashboard data retrieved successfully'));
    
  } catch (error) {
    console.error('Error in GET /api/v1/analytics/all:', error);
    return c.json(createErrorResponse(error, 'ALL_ANALYTICS_FETCH_ERROR'), 500);
  }
});

// Payment webhook endpoints (placeholder)
app.post('/api/v1/payments/vnpay/webhook', async (c) => {
  try {
    const body = await c.req.json();
    console.log('VNPay webhook received:', body);
    
    // TODO: Implement VNPay webhook processing
    
    return c.json(createSuccessResponse(
      { processed: true },
      'VNPay webhook processed successfully'
    ));
    
  } catch (error) {
    console.error('Error in VNPay webhook:', error);
    return c.json(createErrorResponse(error, 'WEBHOOK_PROCESSING_ERROR'), 500);
  }
});

// Catch-all for unmatched routes - ALWAYS return a response
app.all('*', (c) => {
  return c.json(createErrorResponse(
    `Route not found: ${c.req.method} ${c.req.path}`,
    'ROUTE_NOT_FOUND'
  ), 404);
});

// Ensure all requests get a response by using a final catch-all middleware
app.use('*', async (c) => {
  // This should never be reached, but ensures no request goes unanswered
  console.error('Request reached final middleware without response:', c.req.method, c.req.path);
  return c.json(createErrorResponse(
    'No response generated for request',
    'NO_RESPONSE_ERROR'
  ), 500);
});

export default app;