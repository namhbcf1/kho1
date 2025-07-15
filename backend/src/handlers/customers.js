import { Hono } from 'hono';
import { z } from 'zod';
import { customerService } from '../services/customerService';
import { requireRole } from '../middleware/auth';
const customerRoutes = new Hono();
// Validation schemas
const createCustomerSchema = z.object({
    name: z.string().min(1, 'Tên khách hàng không được để trống'),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.object({
        street: z.string().optional(),
        ward: z.string().optional(),
        district: z.string().optional(),
        province: z.string().optional(),
    }).optional(),
    dateOfBirth: z.string().optional(),
    gender: z.enum(['male', 'female', 'other']).optional(),
});
const updateCustomerSchema = createCustomerSchema.partial();
// Get customers
customerRoutes.get('/', async (c) => {
    try {
        const page = parseInt(c.req.query('page') || '1');
        const limit = parseInt(c.req.query('limit') || '20');
        const search = c.req.query('search');
        const result = await customerService.getCustomers(c.env.DB, {
            page,
            limit,
            search,
        });
        return c.json(result);
    }
    catch (error) {
        console.error('Get customers error:', error);
        return c.json({
            success: false,
            message: 'Có lỗi xảy ra khi tải khách hàng',
        }, 500);
    }
});
// Get customer by ID
customerRoutes.get('/:id', async (c) => {
    try {
        const customerId = c.req.param('id');
        const result = await customerService.getCustomerById(c.env.DB, customerId);
        return c.json(result);
    }
    catch (error) {
        console.error('Get customer by ID error:', error);
        return c.json({
            success: false,
            message: 'Không tìm thấy khách hàng',
        }, 500);
    }
});
// Create customer
customerRoutes.post('/', requireRole(['admin', 'manager', 'cashier']), async (c) => {
    try {
        const body = await c.req.json();
        const customerData = createCustomerSchema.parse(body);
        const result = await customerService.createCustomer(c.env.DB, customerData);
        return c.json(result);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({
                success: false,
                message: 'Dữ liệu khách hàng không hợp lệ',
                errors: error.errors,
            }, 400);
        }
        console.error('Create customer error:', error);
        return c.json({
            success: false,
            message: 'Có lỗi xảy ra khi tạo khách hàng',
        }, 500);
    }
});
// Update customer
customerRoutes.put('/:id', requireRole(['admin', 'manager', 'cashier']), async (c) => {
    try {
        const customerId = c.req.param('id');
        const body = await c.req.json();
        const updateData = updateCustomerSchema.parse(body);
        const result = await customerService.updateCustomer(c.env.DB, customerId, updateData);
        return c.json(result);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({
                success: false,
                message: 'Dữ liệu cập nhật không hợp lệ',
                errors: error.errors,
            }, 400);
        }
        console.error('Update customer error:', error);
        return c.json({
            success: false,
            message: 'Có lỗi xảy ra khi cập nhật khách hàng',
        }, 500);
    }
});
// Delete customer
customerRoutes.delete('/:id', requireRole(['admin', 'manager']), async (c) => {
    try {
        const customerId = c.req.param('id');
        const result = await customerService.deleteCustomer(c.env.DB, customerId);
        return c.json(result);
    }
    catch (error) {
        console.error('Delete customer error:', error);
        return c.json({
            success: false,
            message: 'Có lỗi xảy ra khi xóa khách hàng',
        }, 500);
    }
});
export { customerRoutes };
