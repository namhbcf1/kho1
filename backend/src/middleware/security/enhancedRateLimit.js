const RATE_LIMIT_CONFIG = {
    default: {
        requests: 100,
        window: 60,
        blockDuration: 60,
    },
    auth: {
        requests: 5, // Very strict for auth endpoints
        window: 60,
        blockDuration: 300, // 5 minutes
    },
    api: {
        requests: 60,
        window: 60,
        blockDuration: 120,
    },
    strict: {
        requests: 10,
        window: 60,
        blockDuration: 600, // 10 minutes
    },
};
export const createRateLimitMiddleware = (type = 'default') => {
    const config = RATE_LIMIT_CONFIG[type];
    return async (c, next) => {
        try {
            const clientIP = c.req.header('CF-Connecting-IP') ||
                c.req.header('X-Forwarded-For') ||
                c.req.header('X-Real-IP') ||
                'unknown';
            const userAgent = c.req.header('User-Agent') || '';
            const fingerprint = `${clientIP}:${userAgent.slice(0, 50)}`;
            const key = `rate_limit:${type}:${fingerprint}`;
            const blockKey = `rate_limit_block:${type}:${fingerprint}`;
            const now = Math.floor(Date.now() / 1000);
            const windowStart = now - config.window;
            // Check if IP is currently blocked
            const blockData = await c.env.CACHE.get(blockKey);
            if (blockData) {
                const blockInfo = JSON.parse(blockData);
                if (blockInfo.until > now) {
                    return c.json({
                        success: false,
                        message: 'IP bị tạm khóa do quá nhiều yêu cầu',
                        error: 'RATE_LIMIT_BLOCKED',
                        retryAfter: blockInfo.until - now,
                        blockedUntil: new Date(blockInfo.until * 1000).toISOString(),
                    }, 429);
                }
                else {
                    // Block expired, remove it
                    await c.env.CACHE.delete(blockKey);
                }
            }
            // Get current request count from KV
            const currentData = await c.env.CACHE.get(key);
            let requests = currentData ? JSON.parse(currentData) : [];
            // Remove old requests outside the window
            requests = requests.filter(timestamp => timestamp > windowStart);
            // Check if limit exceeded
            if (requests.length >= config.requests) {
                // Block IP if configured
                if (config.blockDuration) {
                    const blockUntil = now + config.blockDuration;
                    await c.env.CACHE.put(blockKey, JSON.stringify({
                        until: blockUntil,
                        attempts: requests.length,
                        firstAttempt: requests[0],
                        lastAttempt: now,
                    }), {
                        expirationTtl: config.blockDuration + 10,
                    });
                }
                // Log potential attack
                console.warn(`Rate limit exceeded for ${type} endpoint:`, {
                    ip: clientIP,
                    userAgent,
                    attempts: requests.length,
                    window: config.window,
                    blocked: !!config.blockDuration,
                });
                return c.json({
                    success: false,
                    message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
                    error: 'RATE_LIMIT_EXCEEDED',
                    retryAfter: config.window,
                    limit: config.requests,
                    window: config.window,
                }, 429);
            }
            // Add current request
            requests.push(now);
            // Store updated requests with TTL
            await c.env.CACHE.put(key, JSON.stringify(requests), {
                expirationTtl: config.window + 10,
            });
            // Add rate limit headers
            c.header('X-RateLimit-Limit', config.requests.toString());
            c.header('X-RateLimit-Remaining', (config.requests - requests.length).toString());
            c.header('X-RateLimit-Reset', (now + config.window).toString());
            c.header('X-RateLimit-Type', type);
            await next();
        }
        catch (error) {
            console.error('Enhanced rate limit middleware error:', error);
            // Continue on error to avoid blocking requests
            await next();
        }
    };
};
// Brute force protection specifically for login attempts
export const createBruteForceProtection = () => {
    return async (c, next) => {
        try {
            const clientIP = c.req.header('CF-Connecting-IP') ||
                c.req.header('X-Forwarded-For') ||
                'unknown';
            const { email } = await c.req.json().catch(() => ({}));
            // Track both IP and email-based attempts
            const ipKey = `brute_force:ip:${clientIP}`;
            const emailKey = email ? `brute_force:email:${email}` : null;
            const now = Math.floor(Date.now() / 1000);
            const window = 300; // 5 minutes
            const maxAttempts = 5;
            const blockDuration = 900; // 15 minutes
            // Check IP-based attempts
            const ipData = await c.env.CACHE.get(ipKey);
            let ipAttempts = ipData ? JSON.parse(ipData) : [];
            ipAttempts = ipAttempts.filter(t => t > now - window);
            // Check email-based attempts
            let emailAttempts = [];
            if (emailKey) {
                const emailData = await c.env.CACHE.get(emailKey);
                emailAttempts = emailData ? JSON.parse(emailData) : [];
                emailAttempts = emailAttempts.filter(t => t > now - window);
            }
            // Block if too many attempts
            if (ipAttempts.length >= maxAttempts || emailAttempts.length >= maxAttempts) {
                // Store block information
                const blockKey = `brute_force_block:${clientIP}`;
                await c.env.CACHE.put(blockKey, JSON.stringify({
                    until: now + blockDuration,
                    ipAttempts: ipAttempts.length,
                    emailAttempts: emailAttempts.length,
                    email: email || null,
                }), {
                    expirationTtl: blockDuration + 10,
                });
                console.warn('Brute force attack detected:', {
                    ip: clientIP,
                    email: email || 'unknown',
                    ipAttempts: ipAttempts.length,
                    emailAttempts: emailAttempts.length,
                });
                return c.json({
                    success: false,
                    message: 'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút.',
                    error: 'BRUTE_FORCE_BLOCKED',
                    retryAfter: blockDuration,
                }, 429);
            }
            // Store the middleware state for failed login tracking
            c.set('bruteForceState', {
                ipKey,
                emailKey,
                ipAttempts,
                emailAttempts,
                now,
                window,
            });
            await next();
        }
        catch (error) {
            console.error('Brute force protection error:', error);
            await next();
        }
    };
};
// Middleware to track failed login attempts
export const trackFailedLogin = async (c, next) => {
    await next();
    // Only track if response indicates failed login
    if (c.res.status === 401) {
        try {
            const state = c.get('bruteForceState');
            if (state) {
                const { ipKey, emailKey, ipAttempts, emailAttempts, now, window } = state;
                // Add current attempt
                ipAttempts.push(now);
                if (emailKey) {
                    emailAttempts.push(now);
                }
                // Store updated attempts
                await c.env.CACHE.put(ipKey, JSON.stringify(ipAttempts), {
                    expirationTtl: window + 10,
                });
                if (emailKey) {
                    await c.env.CACHE.put(emailKey, JSON.stringify(emailAttempts), {
                        expirationTtl: window + 10,
                    });
                }
            }
        }
        catch (error) {
            console.error('Failed to track failed login:', error);
        }
    }
};
// Export pre-configured middleware
export const authRateLimit = createRateLimitMiddleware('auth');
export const apiRateLimit = createRateLimitMiddleware('api');
export const strictRateLimit = createRateLimitMiddleware('strict');
export const defaultRateLimit = createRateLimitMiddleware('default');
export const bruteForceProtection = createBruteForceProtection();
