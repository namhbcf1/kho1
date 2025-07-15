export const corsMiddleware = async (c, next) => {
    const origin = c.req.header('Origin');
    const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://khoaugment.pages.dev',
        c.env.CORS_ORIGIN
    ].filter(Boolean);
    // Check if origin is allowed
    if (origin && allowedOrigins.includes(origin)) {
        c.header('Access-Control-Allow-Origin', origin);
    }
    c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    c.header('Access-Control-Allow-Credentials', 'true');
    c.header('Access-Control-Max-Age', '86400');
    // Handle preflight requests
    if (c.req.method === 'OPTIONS') {
        return c.text('', 204);
    }
    await next();
};
