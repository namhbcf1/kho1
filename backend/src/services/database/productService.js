// Product Service with comprehensive D1 integration
import { D1Service, createSuccessResponse, createErrorResponse, createPaginatedResponse } from './d1Service';
import { Schemas } from './schemas';
import { z } from 'zod';
export class ProductService {
    d1Service;
    constructor(database) {
        this.d1Service = new D1Service(database, {
            maxRetries: 3,
            baseDelay: 100,
            maxDelay: 1000,
            jitter: true
        });
    }
    // Get all products with search and pagination
    async getProducts(searchParams) {
        try {
            const validatedParams = Schemas.Search.parse(searchParams);
            let whereConditions = ['p.status = ?'];
            let params = ['active'];
            if (validatedParams.query) {
                whereConditions.push('(p.name LIKE ? OR p.barcode LIKE ? OR p.sku LIKE ?)');
                const searchTerm = `%${validatedParams.query}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }
            if (validatedParams.category) {
                whereConditions.push('p.category_id = ?');
                params.push(validatedParams.category);
            }
            if (validatedParams.status) {
                whereConditions[0] = 'p.status = ?';
                params[0] = validatedParams.status;
            }
            const whereClause = whereConditions.join(' AND ');
            // Get total count
            const countSql = `
        SELECT COUNT(*) as total 
        FROM products p 
        WHERE ${whereClause}
      `;
            const countResult = await this.d1Service.query(countSql, params);
            const total = countResult.results[0]?.total || 0;
            // Get paginated data
            const offset = (validatedParams.page - 1) * validatedParams.limit;
            const sql = `
        SELECT 
          p.*,
          c.name as category_name,
          COALESCE(i.quantity_available, 0) as stock_quantity
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN inventory i ON p.id = i.product_id
        WHERE ${whereClause}
        ORDER BY p.name ASC
        LIMIT ? OFFSET ?
      `;
            const result = await this.d1Service.query(sql, [...params, validatedParams.limit, offset], Schemas.Product);
            const totalPages = Math.ceil(total / validatedParams.limit);
            return createPaginatedResponse({
                data: result.results,
                pagination: {
                    page: validatedParams.page,
                    limit: validatedParams.limit,
                    total,
                    totalPages,
                    hasNext: validatedParams.page < totalPages,
                    hasPrev: validatedParams.page > 1,
                }
            }, 'Products retrieved successfully');
        }
        catch (error) {
            console.error('Error getting products:', error);
            return createErrorResponse(error instanceof Error ? error : new Error('Failed to get products'));
        }
    }
    // Get single product by ID
    async getProductById(id) {
        try {
            const validatedId = Schemas.Id.parse(id);
            const sql = `
        SELECT 
          p.*,
          c.name as category_name,
          COALESCE(i.quantity_available, 0) as stock_quantity,
          COALESCE(i.quantity_reserved, 0) as reserved_quantity
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN inventory i ON p.id = i.product_id
        WHERE p.id = ? AND p.status = 'active'
      `;
            const result = await this.d1Service.query(sql, [validatedId], Schemas.Product);
            if (result.results.length === 0) {
                return createErrorResponse('Product not found', 'PRODUCT_NOT_FOUND');
            }
            return createSuccessResponse(result.results[0], 'Product retrieved successfully');
        }
        catch (error) {
            console.error('Error getting product by ID:', error);
            return createErrorResponse(error instanceof Error ? error : new Error('Failed to get product'));
        }
    }
    // Get product by barcode
    async getProductByBarcode(barcode) {
        try {
            if (!barcode || barcode.trim().length === 0) {
                return createErrorResponse('Barcode is required', 'VALIDATION_ERROR');
            }
            const sql = `
        SELECT 
          p.*,
          c.name as category_name,
          COALESCE(i.quantity_available, 0) as stock_quantity
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN inventory i ON p.id = i.product_id
        WHERE p.barcode = ? AND p.status = 'active'
        LIMIT 1
      `;
            const result = await this.d1Service.query(sql, [barcode.trim()], Schemas.Product);
            if (result.results.length === 0) {
                return createErrorResponse('Product not found', 'PRODUCT_NOT_FOUND');
            }
            return createSuccessResponse(result.results[0], 'Product retrieved successfully');
        }
        catch (error) {
            console.error('Error getting product by barcode:', error);
            return createErrorResponse(error instanceof Error ? error : new Error('Failed to get product'));
        }
    }
    // Create new product
    async createProduct(productData) {
        try {
            const validatedData = Schemas.ProductCreate.parse(productData);
            // Check for duplicate barcode if provided
            if (validatedData.barcode) {
                const existingProduct = await this.d1Service.findOne('products', { barcode: validatedData.barcode }, Schemas.Product);
                if (existingProduct) {
                    return createErrorResponse('Product with this barcode already exists', 'DUPLICATE_BARCODE');
                }
            }
            // Check for duplicate SKU if provided
            if (validatedData.sku) {
                const existingProduct = await this.d1Service.findOne('products', { sku: validatedData.sku }, Schemas.Product);
                if (existingProduct) {
                    return createErrorResponse('Product with this SKU already exists', 'DUPLICATE_SKU');
                }
            }
            // Add timestamps
            const productWithTimestamps = {
                ...validatedData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            const result = await this.d1Service.insert('products', productWithTimestamps, Schemas.Product);
            // Create initial inventory record
            await this.d1Service.insert('inventory', {
                product_id: result.id,
                quantity_available: validatedData.stock_quantity || 0,
                quantity_reserved: 0,
                quantity_incoming: 0,
                quantity_damaged: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });
            return createSuccessResponse(result.data, 'Product created successfully');
        }
        catch (error) {
            console.error('Error creating product:', error);
            return createErrorResponse(error instanceof Error ? error : new Error('Failed to create product'));
        }
    }
    // Update product
    async updateProduct(id, productData) {
        try {
            const validatedId = Schemas.Id.parse(id);
            const validatedData = Schemas.ProductUpdate.parse(productData);
            // Check if product exists
            const existingProduct = await this.d1Service.findOne('products', { id: validatedId });
            if (!existingProduct) {
                return createErrorResponse('Product not found', 'PRODUCT_NOT_FOUND');
            }
            // Check for duplicate barcode if provided and different from current
            if (validatedData.barcode && validatedData.barcode !== existingProduct.barcode) {
                const duplicateProduct = await this.d1Service.findOne('products', { barcode: validatedData.barcode });
                if (duplicateProduct && duplicateProduct.id !== validatedId) {
                    return createErrorResponse('Product with this barcode already exists', 'DUPLICATE_BARCODE');
                }
            }
            // Check for duplicate SKU if provided and different from current
            if (validatedData.sku && validatedData.sku !== existingProduct.sku) {
                const duplicateProduct = await this.d1Service.findOne('products', { sku: validatedData.sku });
                if (duplicateProduct && duplicateProduct.id !== validatedId) {
                    return createErrorResponse('Product with this SKU already exists', 'DUPLICATE_SKU');
                }
            }
            // Add updated timestamp
            const productWithTimestamp = {
                ...validatedData,
                updated_at: new Date().toISOString(),
            };
            const result = await this.d1Service.update('products', validatedId, productWithTimestamp, Schemas.Product);
            // Update inventory if stock_quantity was provided
            if (validatedData.stock_quantity !== undefined) {
                await this.d1Service.execute('UPDATE inventory SET quantity_available = ?, updated_at = ? WHERE product_id = ?', [validatedData.stock_quantity, new Date().toISOString(), validatedId]);
            }
            return createSuccessResponse(result.data, 'Product updated successfully');
        }
        catch (error) {
            console.error('Error updating product:', error);
            return createErrorResponse(error instanceof Error ? error : new Error('Failed to update product'));
        }
    }
    // Delete product (soft delete)
    async deleteProduct(id) {
        try {
            const validatedId = Schemas.Id.parse(id);
            // Check if product exists
            const existingProduct = await this.d1Service.findOne('products', { id: validatedId });
            if (!existingProduct) {
                return createErrorResponse('Product not found', 'PRODUCT_NOT_FOUND');
            }
            // Check if product is used in any orders
            const orderItems = await this.d1Service.query('SELECT COUNT(*) as count FROM order_items WHERE product_id = ?', [validatedId]);
            const hasOrders = orderItems.results[0]?.count > 0;
            if (hasOrders) {
                // Soft delete - mark as inactive
                const result = await this.d1Service.update('products', validatedId, {
                    status: 'inactive',
                    updated_at: new Date().toISOString(),
                });
                return createSuccessResponse({ id: validatedId, status: 'inactive' }, 'Product deactivated successfully (has order history)');
            }
            else {
                // Hard delete if no order history
                await this.d1Service.delete('products', validatedId);
                // Also delete inventory record
                await this.d1Service.execute('DELETE FROM inventory WHERE product_id = ?', [validatedId]);
                return createSuccessResponse({ id: validatedId, deleted: true }, 'Product deleted successfully');
            }
        }
        catch (error) {
            console.error('Error deleting product:', error);
            return createErrorResponse(error instanceof Error ? error : new Error('Failed to delete product'));
        }
    }
    // Get low stock products
    async getLowStockProducts() {
        try {
            const sql = `
        SELECT 
          p.*,
          c.name as category_name,
          i.quantity_available,
          i.quantity_reserved,
          (i.quantity_available - i.quantity_reserved) as available_stock
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN inventory i ON p.id = i.product_id
        WHERE p.status = 'active' 
          AND p.min_stock_level IS NOT NULL
          AND i.quantity_available <= p.min_stock_level
        ORDER BY (i.quantity_available - p.min_stock_level) ASC
      `;
            const result = await this.d1Service.query(sql, [], z.any());
            return createSuccessResponse(result.results, 'Low stock products retrieved successfully');
        }
        catch (error) {
            console.error('Error getting low stock products:', error);
            return createErrorResponse(error instanceof Error ? error : new Error('Failed to get low stock products'));
        }
    }
    // Update stock quantity
    async updateStock(id, quantity, operation = 'set') {
        try {
            const validatedId = Schemas.Id.parse(id);
            const validatedQuantity = z.number().min(0).parse(quantity);
            // Check if product exists
            const product = await this.d1Service.findOne('products', { id: validatedId });
            if (!product) {
                return createErrorResponse('Product not found', 'PRODUCT_NOT_FOUND');
            }
            let newQuantity;
            if (operation === 'set') {
                newQuantity = validatedQuantity;
            }
            else {
                // Get current stock
                const currentStock = await this.d1Service.query('SELECT quantity_available FROM inventory WHERE product_id = ?', [validatedId]);
                const current = currentStock.results[0]?.quantity_available || 0;
                if (operation === 'add') {
                    newQuantity = current + validatedQuantity;
                }
                else { // subtract
                    newQuantity = Math.max(0, current - validatedQuantity);
                }
            }
            // Update inventory
            const updateResult = await this.d1Service.execute(`UPDATE inventory 
         SET quantity_available = ?, updated_at = ?
         WHERE product_id = ?`, [newQuantity, new Date().toISOString(), validatedId]);
            if (updateResult.meta.changes === 0) {
                // Create inventory record if it doesn't exist
                await this.d1Service.insert('inventory', {
                    product_id: validatedId,
                    quantity_available: newQuantity,
                    quantity_reserved: 0,
                    quantity_incoming: 0,
                    quantity_damaged: 0,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                });
            }
            return createSuccessResponse({ id: validatedId, quantity: newQuantity, operation }, 'Stock updated successfully');
        }
        catch (error) {
            console.error('Error updating stock:', error);
            return createErrorResponse(error instanceof Error ? error : new Error('Failed to update stock'));
        }
    }
    // Get product categories
    async getCategories() {
        try {
            const result = await this.d1Service.query('SELECT * FROM categories ORDER BY name ASC');
            return createSuccessResponse(result.results, 'Categories retrieved successfully');
        }
        catch (error) {
            console.error('Error getting categories:', error);
            return createErrorResponse(error instanceof Error ? error : new Error('Failed to get categories'));
        }
    }
}
