import { Hono } from 'hono';
import { analyticsService } from '../services/analyticsService';
import { requireRole } from '../middleware/auth';
const analyticsRoutes = new Hono();
// Dashboard analytics
analyticsRoutes.get('/dashboard', requireRole(['admin', 'manager']), async (c) => {
    try {
        const result = await analyticsService.getDashboardData(c.env.DB);
        return c.json(result);
    }
    catch (error) {
        console.error('Get dashboard analytics error:', error);
        return c.json({
            success: false,
            message: 'Có lỗi xảy ra khi tải dữ liệu dashboard',
        }, 500);
    }
});
// Sales analytics
analyticsRoutes.get('/sales', requireRole(['admin', 'manager']), async (c) => {
    try {
        const startDate = c.req.query('startDate');
        const endDate = c.req.query('endDate');
        const groupBy = c.req.query('groupBy') || 'day';
        const result = await analyticsService.getSalesAnalytics(c.env.DB, {
            startDate,
            endDate,
            groupBy,
        });
        return c.json(result);
    }
    catch (error) {
        console.error('Get sales analytics error:', error);
        return c.json({
            success: false,
            message: 'Có lỗi xảy ra khi tải báo cáo bán hàng',
        }, 500);
    }
});
// Revenue analytics
analyticsRoutes.get('/revenue', requireRole(['admin', 'manager']), async (c) => {
    try {
        const startDate = c.req.query('startDate');
        const endDate = c.req.query('endDate');
        const result = await analyticsService.getRevenueAnalytics(c.env.DB, {
            startDate,
            endDate,
        });
        return c.json(result);
    }
    catch (error) {
        console.error('Get revenue analytics error:', error);
        return c.json({
            success: false,
            message: 'Có lỗi xảy ra khi tải báo cáo doanh thu',
        }, 500);
    }
});
export { analyticsRoutes };
