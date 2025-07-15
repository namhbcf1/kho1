import { z } from 'zod';
// Input validation schemas
export const productSearchSchema = z.object({
    page: z.number().min(1).max(1000).default(1),
    limit: z.number().min(1).max(100).default(50),
    query: z.string().max(255).optional(),
    category: z.string().max(100).optional(),
    status: z.enum(['active', 'inactive']).optional(),
    sortBy: z.enum(['name', 'price', 'stock', 'created_at']).default('name'),
    sortOrder: z.enum(['asc', 'desc']).default('asc')
});
export const productCreateSchema = z.object({
    name: z.string().min(1).max(255),
    description: z.string().max(1000).optional(),
    price: z.number().min(0),
    cost: z.number().min(0).optional(),
    stock: z.number().min(0).default(0),
    category: z.string().max(100).optional(),
    barcode: z.string().max(50).optional(),
    sku: z.string().max(50).optional(),
    unit: z.string().max(20).default('piece'),
    status: z.enum(['active', 'inactive']).default('active')
});
export const productUpdateSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(1000).optional(),
    price: z.number().min(0).optional(),
    cost: z.number().min(0).optional(),
    stock: z.number().min(0).optional(),
    category: z.string().max(100).optional(),
    barcode: z.string().max(50).optional(),
    sku: z.string().max(50).optional(),
    unit: z.string().max(20).optional(),
    status: z.enum(['active', 'inactive']).optional()
});
export const stockUpdateSchema = z.object({
    quantity: z.number().min(0),
    operation: z.enum(['set', 'add', 'subtract']).default('set'),
    reason: z.string().max(255).optional()
});
// Parameterized query builder for secure database operations
export class SecureQueryBuilder {
    db;
    constructor(db) {
        this.db = db;
    }
    // Secure product search with parameterized queries
    async searchProducts(params) {
        const validated = productSearchSchema.parse(params);
        const { page, limit, query, category, status, sortBy, sortOrder } = validated;
        const offset = (page - 1) * limit;
        const conditions = [];
        const values = [];
        // Build WHERE conditions safely
        if (query) {
            conditions.push('(name LIKE ? OR description LIKE ? OR barcode LIKE ? OR sku LIKE ?)');
            const searchTerm = `%${this.sanitizeSearchTerm(query)}%`;
            values.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }
        if (category) {
            conditions.push('category = ?');
            values.push(category);
        }
        if (status) {
            conditions.push('status = ?');
            values.push(status);
        }
        // Build base query
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        // Validate sort column (prevent SQL injection via ORDER BY)
        const allowedSortColumns = ['name', 'price', 'stock', 'created_at'];
        const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'name';
        const safeSortOrder = sortOrder === 'desc' ? 'DESC' : 'ASC';
        // Count query
        const countQuery = `
      SELECT COUNT(*) as total 
      FROM products 
      ${whereClause}
    `;
        // Main query with pagination
        const mainQuery = `
      SELECT id, name, description, price, cost, stock, category, barcode, sku, unit, status, created_at, updated_at
      FROM products 
      ${whereClause}
      ORDER BY ${safeSortBy} ${safeSortOrder}
      LIMIT ? OFFSET ?
    `;
        try {
            // Execute count query
            const countResult = await this.db
                .prepare(countQuery)
                .bind(...values)
                .first();
            // Execute main query
            const productsResult = await this.db
                .prepare(mainQuery)
                .bind(...values, limit, offset)
                .all();
            return {
                success: true,
                data: productsResult.results || [],
                pagination: {
                    page,
                    limit,
                    total: countResult?.total || 0,
                    totalPages: Math.ceil((countResult?.total || 0) / limit)
                }
            };
        }
        catch (error) {
            console.error('Secure product search error:', error);
            return {
                success: false,
                message: 'Error searching products',
                error: 'SEARCH_ERROR'
            };
        }
    }
    // Secure product creation
    async createProduct(productData) {
        const validated = productCreateSchema.parse(productData);
        try {
            // Check for duplicate barcode/sku
            if (validated.barcode) {
                const existingProduct = await this.db
                    .prepare('SELECT id FROM products WHERE barcode = ? AND id != ?')
                    .bind(validated.barcode, '')
                    .first();
                if (existingProduct) {
                    return {
                        success: false,
                        message: 'Barcode already exists',
                        error: 'DUPLICATE_BARCODE'
                    };
                }
            }
            if (validated.sku) {
                const existingProduct = await this.db
                    .prepare('SELECT id FROM products WHERE sku = ? AND id != ?')
                    .bind(validated.sku, '')
                    .first();
                if (existingProduct) {
                    return {
                        success: false,
                        message: 'SKU already exists',
                        error: 'DUPLICATE_SKU'
                    };
                }
            }
            // Generate new product ID
            const productId = crypto.randomUUID();
            const now = new Date().toISOString();
            // Insert product with parameterized query
            const result = await this.db
                .prepare(`
          INSERT INTO products (
            id, name, description, price, cost, stock, category, 
            barcode, sku, unit, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
                .bind(productId, validated.name, validated.description || null, validated.price, validated.cost || null, validated.stock, validated.category || null, validated.barcode || null, validated.sku || null, validated.unit, validated.status, now, now)
                .run();
            if (result.success) {
                // Fetch the created product
                const newProduct = await this.getProductById(productId);
                return newProduct;
            }
            else {
                return {
                    success: false,
                    message: 'Failed to create product',
                    error: 'CREATE_ERROR'
                };
            }
        }
        catch (error) {
            console.error('Secure product creation error:', error);
            return {
                success: false,
                message: 'Error creating product',
                error: 'CREATE_ERROR'
            };
        }
    }
    // Secure product update
    async updateProduct(productId, updateData) {
        const validated = productUpdateSchema.parse(updateData);
        // Validate product ID format
        if (!this.isValidUUID(productId)) {
            return {
                success: false,
                message: 'Invalid product ID format',
                error: 'VALIDATION_ERROR'
            };
        }
        try {
            // Check if product exists
            const existingProduct = await this.getProductById(productId);
            if (!existingProduct.success) {
                return existingProduct;
            }
            // Check for duplicate barcode/sku (excluding current product)
            if (validated.barcode) {
                const duplicateBarcode = await this.db
                    .prepare('SELECT id FROM products WHERE barcode = ? AND id != ?')
                    .bind(validated.barcode, productId)
                    .first();
                if (duplicateBarcode) {
                    return {
                        success: false,
                        message: 'Barcode already exists',
                        error: 'DUPLICATE_BARCODE'
                    };
                }
            }
            if (validated.sku) {
                const duplicateSku = await this.db
                    .prepare('SELECT id FROM products WHERE sku = ? AND id != ?')
                    .bind(validated.sku, productId)
                    .first();
                if (duplicateSku) {
                    return {
                        success: false,
                        message: 'SKU already exists',
                        error: 'DUPLICATE_SKU'
                    };
                }
            }
            // Build update query dynamically but safely
            const updateFields = [];
            const updateValues = [];
            Object.entries(validated).forEach(([key, value]) => {
                if (value !== undefined) {
                    updateFields.push(`${key} = ?`);
                    updateValues.push(value);
                }
            });
            if (updateFields.length === 0) {
                return {
                    success: false,
                    message: 'No fields to update',
                    error: 'NO_UPDATE_FIELDS'
                };
            }
            // Add updated_at field
            updateFields.push('updated_at = ?');
            updateValues.push(new Date().toISOString());
            updateValues.push(productId);
            const updateQuery = `
        UPDATE products 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `;
            const result = await this.db
                .prepare(updateQuery)
                .bind(...updateValues)
                .run();
            if (result.success) {
                // Return updated product
                return await this.getProductById(productId);
            }
            else {
                return {
                    success: false,
                    message: 'Failed to update product',
                    error: 'UPDATE_ERROR'
                };
            }
        }
        catch (error) {
            console.error('Secure product update error:', error);
            return {
                success: false,
                message: 'Error updating product',
                error: 'UPDATE_ERROR'
            };
        }
    }
    // Secure product deletion
    async deleteProduct(productId) {
        // Validate product ID format
        if (!this.isValidUUID(productId)) {
            return {
                success: false,
                message: 'Invalid product ID format',
                error: 'VALIDATION_ERROR'
            };
        }
        try {
            // Check if product exists
            const existingProduct = await this.getProductById(productId);
            if (!existingProduct.success) {
                return existingProduct;
            }
            // Soft delete (mark as inactive) for data integrity
            const result = await this.db
                .prepare('UPDATE products SET status = ?, updated_at = ? WHERE id = ?')
                .bind('inactive', new Date().toISOString(), productId)
                .run();
            if (result.success) {
                return {
                    success: true,
                    message: 'Product deleted successfully'
                };
            }
            else {
                return {
                    success: false,
                    message: 'Failed to delete product',
                    error: 'DELETE_ERROR'
                };
            }
        }
        catch (error) {
            console.error('Secure product deletion error:', error);
            return {
                success: false,
                message: 'Error deleting product',
                error: 'DELETE_ERROR'
            };
        }
    }
    // Secure product retrieval by ID
    async getProductById(productId) {
        // Validate product ID format
        if (!this.isValidUUID(productId)) {
            return {
                success: false,
                message: 'Invalid product ID format',
                error: 'VALIDATION_ERROR'
            };
        }
        try {
            const product = await this.db
                .prepare(`
          SELECT id, name, description, price, cost, stock, category, 
                 barcode, sku, unit, status, created_at, updated_at
          FROM products 
          WHERE id = ?
        `)
                .bind(productId)
                .first();
            if (product) {
                return {
                    success: true,
                    data: product
                };
            }
            else {
                return {
                    success: false,
                    message: 'Product not found',
                    error: 'NOT_FOUND'
                };
            }
        }
        catch (error) {
            console.error('Secure product retrieval error:', error);
            return {
                success: false,
                message: 'Error retrieving product',
                error: 'RETRIEVAL_ERROR'
            };
        }
    }
    // Secure stock update
    async updateStock(productId, stockData) {
        const validated = stockUpdateSchema.parse(stockData);
        // Validate product ID format
        if (!this.isValidUUID(productId)) {
            return {
                success: false,
                message: 'Invalid product ID format',
                error: 'VALIDATION_ERROR'
            };
        }
        try {
            // Get current product
            const product = await this.getProductById(productId);
            if (!product.success) {
                return product;
            }
            const currentStock = product.data.stock || 0;
            let newStock;
            switch (validated.operation) {
                case 'set':
                    newStock = validated.quantity;
                    break;
                case 'add':
                    newStock = currentStock + validated.quantity;
                    break;
                case 'subtract':
                    newStock = Math.max(0, currentStock - validated.quantity);
                    break;
                default:
                    return {
                        success: false,
                        message: 'Invalid stock operation',
                        error: 'INVALID_OPERATION'
                    };
            }
            // Update stock with transaction safety
            const result = await this.db
                .prepare('UPDATE products SET stock = ?, updated_at = ? WHERE id = ?')
                .bind(newStock, new Date().toISOString(), productId)
                .run();
            if (result.success) {
                // Log stock movement (if stock_movements table exists)
                try {
                    await this.db
                        .prepare(`
              INSERT INTO stock_movements (id, product_id, type, quantity, previous_stock, new_stock, reason, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `)
                        .bind(crypto.randomUUID(), productId, validated.operation, validated.quantity, currentStock, newStock, validated.reason || 'Manual adjustment', new Date().toISOString())
                        .run();
                }
                catch (logError) {
                    console.warn('Failed to log stock movement:', logError);
                    // Continue even if logging fails
                }
                return await this.getProductById(productId);
            }
            else {
                return {
                    success: false,
                    message: 'Failed to update stock',
                    error: 'STOCK_UPDATE_ERROR'
                };
            }
        }
        catch (error) {
            console.error('Secure stock update error:', error);
            return {
                success: false,
                message: 'Error updating stock',
                error: 'STOCK_UPDATE_ERROR'
            };
        }
    }
    // Helper methods
    sanitizeSearchTerm(term) {
        // Remove potentially dangerous characters
        return term
            .replace(/[%_\\]/g, '\\$&') // Escape SQL wildcards
            .replace(/[<>]/g, '') // Remove HTML-like characters
            .trim()
            .substring(0, 255); // Limit length
    }
    isValidUUID(uuid) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    }
    // Secure query execution wrapper
    async executeQuery(query, params = []) {
        try {
            const result = await this.db.prepare(query).bind(...params).first();
            return {
                success: true,
                data: result
            };
        }
        catch (error) {
            console.error('Query execution error:', error);
            return {
                success: false,
                error: 'QUERY_ERROR',
                message: 'Database query failed'
            };
        }
    }
}
// Export utility functions
export function validateAndSanitizeId(id) {
    if (!id || typeof id !== 'string') {
        return { isValid: false, error: 'ID is required and must be a string' };
    }
    const trimmedId = id.trim();
    // Check for UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(trimmedId)) {
        return { isValid: true, sanitizedId: trimmedId.toLowerCase() };
    }
    // Check for numeric ID
    const numericRegex = /^\d+$/;
    if (numericRegex.test(trimmedId)) {
        const numId = parseInt(trimmedId);
        if (numId > 0 && numId <= Number.MAX_SAFE_INTEGER) {
            return { isValid: true, sanitizedId: trimmedId };
        }
    }
    return { isValid: false, error: 'Invalid ID format' };
}
export function sanitizeInput(input) {
    if (typeof input === 'string') {
        return input
            .trim()
            .replace(/[<>]/g, '') // Remove potential HTML tags
            .replace(/['"]/g, '') // Remove quotes that could break SQL
            .substring(0, 1000); // Limit length
    }
    if (typeof input === 'number') {
        return isFinite(input) ? input : 0;
    }
    if (Array.isArray(input)) {
        return input.map(item => sanitizeInput(item));
    }
    if (typeof input === 'object' && input !== null) {
        const sanitized = {};
        for (const [key, value] of Object.entries(input)) {
            sanitized[sanitizeInput(key)] = sanitizeInput(value);
        }
        return sanitized;
    }
    return input;
}
