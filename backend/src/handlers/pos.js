import { Hono } from 'hono';
import { z } from 'zod';
import { posService } from '../services/posService';
const posRoutes = new Hono();
// Validation schemas
const createOrderSchema = z.object({
    customerId: z.string().optional(),
    items: z.array(z.object({
        productId: z.string(),
        name: z.string(),
        price: z.number().positive(),
        quantity: z.number().int().positive(),
        total: z.number().positive(),
    })),
    subtotal: z.number().positive(),
    discount: z.number().min(0).default(0),
    tax: z.number().min(0),
    total: z.number().positive(),
    paymentMethod: z.enum(['cash', 'card', 'vnpay', 'momo', 'zalopay', 'bank_transfer']),
    cashReceived: z.number().optional(),
    change: z.number().optional(),
    notes: z.string().optional(),
});
// Get products for POS
posRoutes.get('/products', async (c) => {
    try {
        const result = await posService.getActiveProducts(c.env.DB);
        return c.json(result);
    }
    catch (error) {
        console.error('Get POS products error:', error);
        return c.json({
            success: false,
            message: 'Có lỗi xảy ra khi tải sản phẩm',
        }, 500);
    }
});
// Search products by name or barcode
posRoutes.get('/products/search', async (c) => {
    try {
        const query = c.req.query('q');
        if (!query) {
            return c.json({
                success: false,
                message: 'Vui lòng nhập từ khóa tìm kiếm',
            }, 400);
        }
        const result = await posService.searchProducts(c.env.DB, query);
        return c.json(result);
    }
    catch (error) {
        console.error('Search products error:', error);
        return c.json({
            success: false,
            message: 'Có lỗi xảy ra khi tìm kiếm sản phẩm',
        }, 500);
    }
});
// Get product by barcode
posRoutes.get('/products/barcode/:barcode', async (c) => {
    try {
        const barcode = c.req.param('barcode');
        const result = await posService.getProductByBarcode(c.env.DB, barcode);
        return c.json(result);
    }
    catch (error) {
        console.error('Get product by barcode error:', error);
        return c.json({
            success: false,
            message: 'Có lỗi xảy ra khi tìm sản phẩm',
        }, 500);
    }
});
// Create order
posRoutes.post('/orders', async (c) => {
    try {
        const user = c.get('user');
        const body = await c.req.json();
        const orderData = createOrderSchema.parse(body);
        const result = await posService.createOrder(c.env.DB, {
            ...orderData,
            cashierId: user.id,
        });
        if (result.success) {
            // Log analytics
            c.env.ANALYTICS?.writeDataPoint({
                blobs: [
                    'order_created',
                    user.id,
                    orderData.paymentMethod,
                    orderData.customerId || 'guest',
                ],
                doubles: [orderData.total, orderData.items.length],
                indexes: [Date.now()],
            });
        }
        return c.json(result);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({
                success: false,
                message: 'Dữ liệu đơn hàng không hợp lệ',
                errors: error.errors,
            }, 400);
        }
        console.error('Create order error:', error);
        return c.json({
            success: false,
            message: 'Có lỗi xảy ra khi tạo đơn hàng',
        }, 500);
    }
});
// Get orders
posRoutes.get('/orders', async (c) => {
    try {
        const page = parseInt(c.req.query('page') || '1');
        const limit = parseInt(c.req.query('limit') || '20');
        const status = c.req.query('status');
        const cashierId = c.req.query('cashierId');
        const customerId = c.req.query('customerId');
        const startDate = c.req.query('startDate');
        const endDate = c.req.query('endDate');
        const result = await posService.getOrders(c.env.DB, {
            page,
            limit,
            status,
            cashierId,
            customerId,
            startDate,
            endDate,
        });
        return c.json(result);
    }
    catch (error) {
        console.error('Get orders error:', error);
        return c.json({
            success: false,
            message: 'Có lỗi xảy ra khi tải danh sách đơn hàng',
        }, 500);
    }
});
// Get order by ID
posRoutes.get('/orders/:id', async (c) => {
    try {
        const orderId = c.req.param('id');
        const result = await posService.getOrderById(c.env.DB, orderId);
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
posRoutes.put('/orders/:id/status', async (c) => {
    try {
        const orderId = c.req.param('id');
        const { status } = await c.req.json();
        const user = c.get('user');
        const result = await posService.updateOrderStatus(c.env.DB, orderId, status, user.id);
        return c.json(result);
    }
    catch (error) {
        console.error('Update order status error:', error);
        return c.json({
            success: false,
            message: 'Có lỗi xảy ra khi cập nhật trạng thái đơn hàng',
        }, 500);
    }
});
// Process refund
posRoutes.post('/orders/:id/refund', async (c) => {
    try {
        const orderId = c.req.param('id');
        const refundData = await c.req.json();
        const user = c.get('user');
        const result = await posService.processRefund(c.env.DB, orderId, {
            ...refundData,
            processedBy: user.id,
        });
        return c.json(result);
    }
    catch (error) {
        console.error('Process refund error:', error);
        return c.json({
            success: false,
            message: 'Có lỗi xảy ra khi xử lý hoàn trả',
        }, 500);
    }
});
// Get customers for POS
posRoutes.get('/customers', async (c) => {
    try {
        const search = c.req.query('search');
        const result = await posService.getCustomers(c.env.DB, search);
        return c.json(result);
    }
    catch (error) {
        console.error('Get customers error:', error);
        return c.json({
            success: false,
            message: 'Có lỗi xảy ra khi tải danh sách khách hàng',
        }, 500);
    }
});
// Search customers
posRoutes.get('/customers/search', async (c) => {
    try {
        const query = c.req.query('q');
        if (!query) {
            return c.json({
                success: false,
                message: 'Vui lòng nhập từ khóa tìm kiếm',
            }, 400);
        }
        const result = await posService.searchCustomers(c.env.DB, query);
        return c.json(result);
    }
    catch (error) {
        console.error('Search customers error:', error);
        return c.json({
            success: false,
            message: 'Có lỗi xảy ra khi tìm kiếm khách hàng',
        }, 500);
    }
});
export { posRoutes };
