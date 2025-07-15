export const requestLogger = async (c, next) => {
    const start = Date.now();
    const requestId = crypto.randomUUID();
    // Set request ID for tracking
    c.set('requestId', requestId);
    const logData = {
        requestId,
        method: c.req.method,
        url: c.req.url,
        userAgent: c.req.header('User-Agent'),
        ip: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For'),
        country: c.req.header('CF-IPCountry'),
        ray: c.req.header('CF-Ray'),
        timestamp: new Date().toISOString(),
    };
    console.log('Request started:', JSON.stringify(logData));
    try {
        await next();
    }
    catch (error) {
        console.error('Request error:', {
            requestId,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
        });
        throw error;
    }
    finally {
        const duration = Date.now() - start;
        const responseLog = {
            requestId,
            status: c.res.status,
            duration,
            timestamp: new Date().toISOString(),
        };
        console.log('Request completed:', JSON.stringify(responseLog));
        // Store metrics in KV for analytics (optional)
        try {
            const kv = c.env.KV;
            if (kv) {
                const metricsKey = `metrics:${new Date().toISOString().split('T')[0]}:${requestId}`;
                await kv.put(metricsKey, JSON.stringify({
                    ...logData,
                    ...responseLog,
                }), {
                    expirationTtl: 7 * 24 * 60 * 60, // 7 days
                });
            }
        }
        catch (kvError) {
            console.warn('Failed to store metrics:', kvError);
        }
    }
};
export const errorLogger = async (c, error) => {
    const requestId = c.get('requestId') || 'unknown';
    const errorLog = {
        requestId,
        error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
        },
        request: {
            method: c.req.method,
            url: c.req.url,
            headers: Object.fromEntries(c.req.header()),
        },
        timestamp: new Date().toISOString(),
    };
    console.error('Application error:', JSON.stringify(errorLog));
    // Store error in KV for monitoring (optional)
    try {
        const kv = c.env.KV;
        if (kv) {
            const errorKey = `error:${new Date().toISOString()}:${requestId}`;
            await kv.put(errorKey, JSON.stringify(errorLog), {
                expirationTtl: 30 * 24 * 60 * 60, // 30 days
            });
        }
    }
    catch (kvError) {
        console.warn('Failed to store error log:', kvError);
    }
};
