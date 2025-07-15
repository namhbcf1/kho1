export const sanitizeMiddleware = async (c, next) => {
    try {
        const contentType = c.req.header('Content-Type');
        if (contentType?.includes('application/json')) {
            const body = await c.req.json();
            const sanitizedBody = sanitizeObject(body);
            // Replace request body with sanitized version
            c.set('sanitizedBody', sanitizedBody);
        }
        await next();
    }
    catch (error) {
        console.error('Sanitization error:', error);
        await next();
    }
};
function sanitizeObject(obj) {
    if (typeof obj === 'string') {
        return sanitizeString(obj);
    }
    if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
    }
    if (obj && typeof obj === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            sanitized[sanitizeString(key)] = sanitizeObject(value);
        }
        return sanitized;
    }
    return obj;
}
function sanitizeString(str) {
    if (typeof str !== 'string')
        return str;
    return str
        // Remove HTML tags
        .replace(/<[^>]*>/g, '')
        // Remove script tags and content
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        // Remove SQL injection patterns
        .replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi, '')
        // Remove XSS patterns
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        // Trim whitespace
        .trim();
}
