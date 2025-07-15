export const rateLimitMiddleware = (options) => {
    const { windowMs = 60000, // 1 minute
    maxRequests = 100, keyGenerator = (c) => c.req.header('CF-Connecting-IP') || 'unknown', skipSuccessfulRequests = false } = options;
    return async (c, next) => {
        try {
            const key = `rate_limit:${keyGenerator(c)}`;
            const now = Date.now();
            const windowStart = now - windowMs;
            // Get current request count from KV
            const kvData = await c.env.KV?.get(key);
            let requests = kvData ? JSON.parse(kvData) : [];
            // Remove old requests outside the window
            requests = requests.filter(timestamp => timestamp > windowStart);
            // Check if limit exceeded
            if (requests.length >= maxRequests) {
                return c.json({
                    success: false,
                    error: {
                        code: 'RATE_LIMIT_EXCEEDED',
                        message: 'Too many requests',
                        retryAfter: Math.ceil(windowMs / 1000)
                    }
                }, 429);
            }
            // Add current request
            requests.push(now);
            // Store updated requests in KV
            await c.env.KV?.put(key, JSON.stringify(requests), {
                expirationTtl: Math.ceil(windowMs / 1000)
            });
            // Set rate limit headers
            c.header('X-RateLimit-Limit', maxRequests.toString());
            c.header('X-RateLimit-Remaining', (maxRequests - requests.length).toString());
            c.header('X-RateLimit-Reset', new Date(now + windowMs).toISOString());
            await next();
            // Remove request from count if it was successful and skipSuccessfulRequests is true
            if (skipSuccessfulRequests && c.res.status < 400) {
                const updatedKvData = await c.env.KV?.get(key);
                if (updatedKvData) {
                    let updatedRequests = JSON.parse(updatedKvData);
                    updatedRequests = updatedRequests.filter(timestamp => timestamp !== now);
                    await c.env.KV?.put(key, JSON.stringify(updatedRequests), {
                        expirationTtl: Math.ceil(windowMs / 1000)
                    });
                }
            }
        }
        catch (error) {
            console.error('Rate limiting error:', error);
            // Continue without rate limiting if there's an error
            await next();
        }
    };
};
