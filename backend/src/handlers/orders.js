import { Hono } from 'hono';
import { orderService } from '../services/orderService';
import { requireRole } from '../middleware/auth';
const orderRoutes = new Hono();
// Get orders
orderRoutes.get('/', async (c) => {
    try {
        const page = parseInt(c.req.query('page') || '1');
        const limit = parseInt(c.req.query('limit') || '20');
        const status = c.req.query('status');
        const startDate = c.req.query('startDate');
        const endDate = c.req.query('endDate');
        const result = await orderService.getOrders(c.env.DB, {
            page,
            limit,
            status,
            startDate,
            endDate,
        });
        return c.json(result);
    }
    catch (error) {
        console.error('Get orders error:', error);
        return c.json({
            success: false,
            message: 'Có lỗi xảy ra khi tải đơn hàng',
        }, 500);
    }
});
// Get order by ID
orderRoutes.get('/:id', async (c) => {
    try {
        const orderId = c.req.param('id');
        const result = await orderService.getOrderById(c.env.DB, orderId);
        return c.json(result);
    }
    catch (error) {
        console.error('Get order by ID error:', error);
        return c.json({
            success: false,
            message: 'Không tìm thấy đơn hàng',
        }, 500);
    }
});
// Update order status
orderRoutes.put('/:id/status', requireRole(['admin', 'manager']), async (c) => {
    try {
        const orderId = c.req.param('id');
        const { status } = await c.req.json();
        const result = await orderService.updateOrderStatus(c.env.DB, orderId, status);
        return c.json(result);
    }
    catch (error) {
        console.error('Update order status error:', error);
        return c.json({
            success: false,
            message: 'Có lỗi xảy ra khi cập nhật trạng thái',
        }, 500);
    }
});
export { orderRoutes };
