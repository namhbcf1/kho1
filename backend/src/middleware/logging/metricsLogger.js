export const metricsLogger = async (c, next) => {
    const start = Date.now();
    const startMemory = performance.memory?.usedJSHeapSize || 0;
    const requestId = c.get('requestId') || crypto.randomUUID();
    // Initialize metrics tracking
    c.set('metrics', {
        dbQueries: 0,
        cacheHits: 0,
        cacheMisses: 0,
    });
    try {
        await next();
    }
    finally {
        const duration = Date.now() - start;
        const endMemory = performance.memory?.usedJSHeapSize || 0;
        const metrics = c.get('metrics') || {};
        const metricsData = {
            requestId,
            timestamp: new Date().toISOString(),
            method: c.req.method,
            path: new URL(c.req.url).pathname,
            status: c.res.status,
            duration,
            memoryUsage: endMemory - startMemory,
            dbQueries: metrics.dbQueries || 0,
            cacheHits: metrics.cacheHits || 0,
            cacheMisses: metrics.cacheMisses || 0,
            ip: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For'),
            userAgent: c.req.header('User-Agent'),
            country: c.req.header('CF-IPCountry'),
            ray: c.req.header('CF-Ray'),
        };
        // Log metrics
        console.log('Request Metrics:', JSON.stringify(metricsData));
        // Store metrics in KV for analytics
        try {
            const kv = c.env.KV;
            if (kv) {
                const date = new Date().toISOString().split('T')[0];
                const metricsKey = `metrics:${date}:${requestId}`;
                await kv.put(metricsKey, JSON.stringify(metricsData), {
                    expirationTtl: 7 * 24 * 60 * 60, // 7 days
                });
                // Update daily aggregates
                await updateDailyMetrics(kv, date, metricsData);
            }
        }
        catch (kvError) {
            console.warn('Failed to store metrics:', kvError);
        }
    }
};
export const trackDBQuery = (c) => {
    const metrics = c.get('metrics') || {};
    metrics.dbQueries = (metrics.dbQueries || 0) + 1;
    c.set('metrics', metrics);
};
export const trackCacheHit = (c) => {
    const metrics = c.get('metrics') || {};
    metrics.cacheHits = (metrics.cacheHits || 0) + 1;
    c.set('metrics', metrics);
};
export const trackCacheMiss = (c) => {
    const metrics = c.get('metrics') || {};
    metrics.cacheMisses = (metrics.cacheMisses || 0) + 1;
    c.set('metrics', metrics);
};
const updateDailyMetrics = async (kv, date, metrics) => {
    try {
        const dailyKey = `daily-metrics:${date}`;
        const existingData = await kv.get(dailyKey);
        let dailyMetrics = {
            date,
            totalRequests: 0,
            totalDuration: 0,
            averageDuration: 0,
            totalDbQueries: 0,
            totalCacheHits: 0,
            totalCacheMisses: 0,
            statusCodes: {},
            methods: {},
            paths: {},
            countries: {},
        };
        if (existingData) {
            try {
                dailyMetrics = JSON.parse(existingData);
            }
            catch (parseError) {
                console.warn('Failed to parse daily metrics:', parseError);
            }
        }
        // Update aggregates
        dailyMetrics.totalRequests += 1;
        dailyMetrics.totalDuration += metrics.duration;
        dailyMetrics.averageDuration = dailyMetrics.totalDuration / dailyMetrics.totalRequests;
        dailyMetrics.totalDbQueries += metrics.dbQueries || 0;
        dailyMetrics.totalCacheHits += metrics.cacheHits || 0;
        dailyMetrics.totalCacheMisses += metrics.cacheMisses || 0;
        // Update counters
        const statusCode = metrics.status.toString();
        dailyMetrics.statusCodes[statusCode] = (dailyMetrics.statusCodes[statusCode] || 0) + 1;
        dailyMetrics.methods[metrics.method] = (dailyMetrics.methods[metrics.method] || 0) + 1;
        dailyMetrics.paths[metrics.path] = (dailyMetrics.paths[metrics.path] || 0) + 1;
        if (metrics.country) {
            dailyMetrics.countries[metrics.country] = (dailyMetrics.countries[metrics.country] || 0) + 1;
        }
        await kv.put(dailyKey, JSON.stringify(dailyMetrics), {
            expirationTtl: 30 * 24 * 60 * 60, // 30 days
        });
    }
    catch (error) {
        console.warn('Failed to update daily metrics:', error);
    }
};
export const getDailyMetrics = async (c, date) => {
    try {
        const kv = c.env.KV;
        if (!kv) {
            return null;
        }
        const dailyKey = `daily-metrics:${date}`;
        const data = await kv.get(dailyKey);
        return data ? JSON.parse(data) : null;
    }
    catch (error) {
        console.error('Failed to get daily metrics:', error);
        return null;
    }
};
export const getMetricsRange = async (c, startDate, endDate) => {
    try {
        const kv = c.env.KV;
        if (!kv) {
            return [];
        }
        const metrics = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
            const dateStr = date.toISOString().split('T')[0];
            const dailyMetrics = await getDailyMetrics(c, dateStr);
            if (dailyMetrics) {
                metrics.push(dailyMetrics);
            }
        }
        return metrics;
    }
    catch (error) {
        console.error('Failed to get metrics range:', error);
        return [];
    }
};
