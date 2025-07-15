import { Hono } from 'hono';
import { z } from 'zod';
import { productService } from '../services/productService';
import { requireRole } from '../middleware/auth';
const productRoutes = new Hono();
// Validation schemas
const createProductSchema = z.object({
    name: z.string().min(1, 'Tên sản phẩm không được để trống'),
    description: z.string().optional(),
    price: z.number().positive('Giá phải lớn hơn 0'),
    cost: z.number().positive().optional(),
    stock: z.number().int().min(0, 'Tồn kho không được âm'),
    minStock: z.number().int().min(0).optional(),
    barcode: z.string().optional(),
    sku: z.string().optional(),
    categoryId: z.string().min(1, 'Danh mục không được để trống'),
    images: z.array(z.string()).optional(),
    active: z.boolean().default(true),
});
const updateProductSchema = createProductSchema.partial();
// Get products
productRoutes.get('/', async (c) => {
    try {
        const page = parseInt(c.req.query('page') || '1');
        const limit = parseInt(c.req.query('limit') || '20');
        const category = c.req.query('category');
        const search = c.req.query('search');
        const active = c.req.query('active');
        const result = await productService.getProducts(c.env.DB, {
            page,
            limit,
            category,
            search,
            active: active ? active === 'true' : undefined,
        });
        return c.json(result);
    }
    catch (error) {
        console.error('Get products error:', error);
        return c.json({
            success: false,
            message: 'Có lỗi xảy ra khi tải sản phẩm',
        }, 500);
    }
});
// Get product by ID
productRoutes.get('/:id', async (c) => {
    try {
        const productId = c.req.param('id');
        const result = await productService.getProductById(c.env.DB, productId);
        return c.json(result);
    }
    catch (error) {
        console.error('Get product by ID error:', error);
        return c.json({
            success: false,
            message: 'Không tìm thấy sản phẩm',
        }, 500);
    }
});
// Create product
productRoutes.post('/', requireRole(['admin', 'manager']), async (c) => {
    try {
        const body = await c.req.json();
        const productData = createProductSchema.parse(body);
        const user = c.get('user');
        const result = await productService.createProduct(c.env.DB, {
            ...productData,
            createdBy: user.id,
        });
        return c.json(result);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({
                success: false,
                message: 'Dữ liệu sản phẩm không hợp lệ',
                errors: error.errors,
            }, 400);
        }
        console.error('Create product error:', error);
        return c.json({
            success: false,
            message: 'Có lỗi xảy ra khi tạo sản phẩm',
        }, 500);
    }
});
// Update product
productRoutes.put('/:id', requireRole(['admin', 'manager']), async (c) => {
    try {
        const productId = c.req.param('id');
        const body = await c.req.json();
        const updateData = updateProductSchema.parse(body);
        const user = c.get('user');
        const result = await productService.updateProduct(c.env.DB, productId, {
            ...updateData,
            updatedBy: user.id,
        });
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
        console.error('Update product error:', error);
        return c.json({
            success: false,
            message: 'Có lỗi xảy ra khi cập nhật sản phẩm',
        }, 500);
    }
});
// Delete product
productRoutes.delete('/:id', requireRole(['admin', 'manager']), async (c) => {
    try {
        const productId = c.req.param('id');
        const result = await productService.deleteProduct(c.env.DB, productId);
        return c.json(result);
    }
    catch (error) {
        console.error('Delete product error:', error);
        return c.json({
            success: false,
            message: 'Có lỗi xảy ra khi xóa sản phẩm',
        }, 500);
    }
});
// Get categories
productRoutes.get('/categories', async (c) => {
    try {
        const result = await productService.getCategories(c.env.DB);
        return c.json(result);
    }
    catch (error) {
        console.error('Get categories error:', error);
        return c.json({
            success: false,
            message: 'Có lỗi xảy ra khi tải danh mục',
        }, 500);
    }
});
export { productRoutes };
