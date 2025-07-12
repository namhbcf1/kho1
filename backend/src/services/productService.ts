export interface ProductResponse {
  success: boolean;
  message?: string;
  data?: any;
}

class ProductService {
  async getProducts(db: D1Database, params: {
    page: number;
    limit: number;
    category?: string;
    search?: string;
    active?: boolean;
  }): Promise<ProductResponse> {
    try {
      const offset = (params.page - 1) * params.limit;
      let whereConditions = ['1=1'];
      let bindParams: any[] = [];

      if (params.category) {
        whereConditions.push('p.category_id = ?');
        bindParams.push(params.category);
      }

      if (params.search) {
        whereConditions.push('(p.name LIKE ? OR p.barcode LIKE ? OR p.sku LIKE ?)');
        const searchTerm = `%${params.search}%`;
        bindParams.push(searchTerm, searchTerm, searchTerm);
      }

      if (params.active !== undefined) {
        whereConditions.push('p.active = ?');
        bindParams.push(params.active ? 1 : 0);
      }

      const whereClause = whereConditions.join(' AND ');

      const products = await db
        .prepare(`
          SELECT 
            p.*,
            c.name as category_name
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          WHERE ${whereClause}
          ORDER BY p.name
          LIMIT ? OFFSET ?
        `)
        .bind(...bindParams, params.limit, offset)
        .all();

      const countResult = await db
        .prepare(`
          SELECT COUNT(*) as total
          FROM products p
          WHERE ${whereClause}
        `)
        .bind(...bindParams)
        .first();

      const total = countResult?.total as number || 0;
      const totalPages = Math.ceil(total / params.limit);

      return {
        success: true,
        data: {
          products: products.results,
          pagination: {
            page: params.page,
            limit: params.limit,
            total,
            totalPages,
            hasNext: params.page < totalPages,
            hasPrev: params.page > 1,
          },
        },
      };
    } catch (error) {
      console.error('Get products error:', error);
      return {
        success: false,
        message: 'Có lỗi xảy ra khi tải sản phẩm',
      };
    }
  }

  async getProductById(db: D1Database, productId: string): Promise<ProductResponse> {
    try {
      const product = await db
        .prepare(`
          SELECT 
            p.*,
            c.name as category_name
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          WHERE p.id = ?
        `)
        .bind(productId)
        .first();

      if (!product) {
        return {
          success: false,
          message: 'Không tìm thấy sản phẩm',
        };
      }

      return {
        success: true,
        data: product,
      };
    } catch (error) {
      console.error('Get product by ID error:', error);
      return {
        success: false,
        message: 'Có lỗi xảy ra khi tải sản phẩm',
      };
    }
  }

  async createProduct(db: D1Database, productData: any): Promise<ProductResponse> {
    try {
      const productId = crypto.randomUUID();

      await db
        .prepare(`
          INSERT INTO products (
            id, name, description, price, cost, stock, min_stock, barcode, sku,
            category_id, images, active, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `)
        .bind(
          productId,
          productData.name,
          productData.description || null,
          productData.price,
          productData.cost || null,
          productData.stock,
          productData.minStock || null,
          productData.barcode || null,
          productData.sku || null,
          productData.categoryId,
          productData.images ? JSON.stringify(productData.images) : null,
          productData.active ? 1 : 0
        )
        .run();

      const product = await this.getProductById(db, productId);
      return {
        success: true,
        message: 'Tạo sản phẩm thành công',
        data: product.data,
      };
    } catch (error) {
      console.error('Create product error:', error);
      return {
        success: false,
        message: 'Có lỗi xảy ra khi tạo sản phẩm',
      };
    }
  }

  async updateProduct(db: D1Database, productId: string, updateData: any): Promise<ProductResponse> {
    try {
      const updates: string[] = [];
      const values: any[] = [];

      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          if (key === 'images') {
            updates.push('images = ?');
            values.push(JSON.stringify(updateData[key]));
          } else if (key === 'active') {
            updates.push('active = ?');
            values.push(updateData[key] ? 1 : 0);
          } else {
            updates.push(`${key} = ?`);
            values.push(updateData[key]);
          }
        }
      });

      if (updates.length === 0) {
        return {
          success: false,
          message: 'Không có dữ liệu để cập nhật',
        };
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(productId);

      await db
        .prepare(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`)
        .bind(...values)
        .run();

      const product = await this.getProductById(db, productId);
      return {
        success: true,
        message: 'Cập nhật sản phẩm thành công',
        data: product.data,
      };
    } catch (error) {
      console.error('Update product error:', error);
      return {
        success: false,
        message: 'Có lỗi xảy ra khi cập nhật sản phẩm',
      };
    }
  }

  async deleteProduct(db: D1Database, productId: string): Promise<ProductResponse> {
    try {
      await db
        .prepare('UPDATE products SET active = 0 WHERE id = ?')
        .bind(productId)
        .run();

      return {
        success: true,
        message: 'Xóa sản phẩm thành công',
      };
    } catch (error) {
      console.error('Delete product error:', error);
      return {
        success: false,
        message: 'Có lỗi xảy ra khi xóa sản phẩm',
      };
    }
  }

  async getCategories(db: D1Database): Promise<ProductResponse> {
    try {
      const categories = await db
        .prepare(`
          SELECT * FROM categories 
          WHERE active = 1 
          ORDER BY name
        `)
        .all();

      return {
        success: true,
        data: categories.results,
      };
    } catch (error) {
      console.error('Get categories error:', error);
      return {
        success: false,
        message: 'Có lỗi xảy ra khi tải danh mục',
      };
    }
  }
}

export const productService = new ProductService();
