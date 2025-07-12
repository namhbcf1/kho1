// Error logging middleware
import { Context, Next } from 'hono';

export const errorLogger = async (c: Context, next: Next) => {
  try {
    await next();
  } catch (error) {
    const requestId = c.get('requestId') || crypto.randomUUID();
    
    const errorLog = {
      requestId,
      timestamp: new Date().toISOString(),
      error: {
        name: error instanceof Error ? error.name : 'UnknownError',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        stack: error instanceof Error ? error.stack : undefined,
      },
      request: {
        method: c.req.method,
        url: c.req.url,
        headers: Object.fromEntries(c.req.header()),
        ip: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For'),
        userAgent: c.req.header('User-Agent'),
        ray: c.req.header('CF-Ray'),
      },
      user: c.get('user') ? {
        id: c.get('user').id,
        email: c.get('user').email,
        role: c.get('user').role,
      } : null,
    };

    // Log to console
    console.error('Application Error:', JSON.stringify(errorLog, null, 2));

    // Store in KV for monitoring
    try {
      const kv = c.env.KV;
      if (kv) {
        const errorKey = `error:${Date.now()}:${requestId}`;
        await kv.put(errorKey, JSON.stringify(errorLog), {
          expirationTtl: 30 * 24 * 60 * 60, // 30 days
        });
      }
    } catch (kvError) {
      console.warn('Failed to store error in KV:', kvError);
    }

    // Send error response
    const isDevelopment = c.env.NODE_ENV === 'development';
    
    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: isDevelopment 
          ? (error instanceof Error ? error.message : 'Unknown error')
          : 'An internal server error occurred',
        requestId,
        ...(isDevelopment && error instanceof Error && { stack: error.stack }),
      },
    }, 500);
  }
};

export const logError = async (c: Context, error: Error, context?: any) => {
  const requestId = c.get('requestId') || crypto.randomUUID();
  
  const errorLog = {
    requestId,
    timestamp: new Date().toISOString(),
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    context,
    request: {
      method: c.req.method,
      url: c.req.url,
      ip: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For'),
    },
  };

  console.error('Manual Error Log:', JSON.stringify(errorLog));

  // Store in KV
  try {
    const kv = c.env.KV;
    if (kv) {
      const errorKey = `manual-error:${Date.now()}:${requestId}`;
      await kv.put(errorKey, JSON.stringify(errorLog), {
        expirationTtl: 30 * 24 * 60 * 60, // 30 days
      });
    }
  } catch (kvError) {
    console.warn('Failed to store manual error in KV:', kvError);
  }
};

export const getErrorLogs = async (c: Context, limit: number = 100) => {
  try {
    const kv = c.env.KV;
    if (!kv) {
      return [];
    }

    const errorLogs = [];
    const list = await kv.list({ prefix: 'error:' });
    
    // Sort by timestamp (newest first)
    const sortedKeys = list.keys
      .sort((a, b) => {
        const timestampA = parseInt(a.name.split(':')[1]);
        const timestampB = parseInt(b.name.split(':')[1]);
        return timestampB - timestampA;
      })
      .slice(0, limit);

    for (const key of sortedKeys) {
      const errorData = await kv.get(key.name);
      if (errorData) {
        try {
          errorLogs.push(JSON.parse(errorData));
        } catch (parseError) {
          console.warn('Failed to parse error log:', parseError);
        }
      }
    }

    return errorLogs;
  } catch (error) {
    console.error('Failed to get error logs:', error);
    return [];
  }
};
