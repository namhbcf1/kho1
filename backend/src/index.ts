import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { rateLimitMiddleware } from './middleware/rateLimit';

// Route handlers
import { analyticsRoutes } from './handlers/analytics';
import { authRoutes } from './handlers/auth';
import { customerRoutes } from './handlers/customers';
import { orderRoutes } from './handlers/orders';
import { posRoutes } from './handlers/pos';
import { productRoutes } from './handlers/products';
import { uploadRoutes } from './handlers/upload';

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

// Global middleware
app.use('*', logger());
app.use('*', prettyJSON());

// CORS middleware
app.use('*', cors({
  origin: (origin, c) => {
    const allowedOrigins = c.env.CORS_ORIGIN.split(',');
    return allowedOrigins.includes(origin) || c.env.ENVIRONMENT === 'development';
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Rate limiting
app.use('/api/*', rateLimitMiddleware);

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT,
  });
});

// API routes
app.route('/api/auth', authRoutes);
app.route('/api/pos', posRoutes);
app.route('/api/products', productRoutes);
app.route('/api/customers', customerRoutes);
app.route('/api/orders', orderRoutes);
app.route('/api/analytics', analyticsRoutes);
app.route('/api/upload', uploadRoutes);
app.route('/api/logs', logsHandler);

// Protected routes (require authentication)
app.use('/api/pos/*', authMiddleware);
app.use('/api/products/*', authMiddleware);
app.use('/api/customers/*', authMiddleware);
app.use('/api/orders/*', authMiddleware);
app.use('/api/analytics/*', authMiddleware);
app.use('/api/upload/*', authMiddleware);

// Error handling
app.onError(errorHandler);

// 404 handler
app.notFound((c) => {
  return c.json({
    success: false,
    message: 'Endpoint not found',
  }, 404);
});

export default app;
