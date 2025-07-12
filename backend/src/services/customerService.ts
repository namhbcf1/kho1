export interface CustomerResponse {
  success: boolean;
  message?: string;
  data?: any;
}

class CustomerService {
  async getCustomers(db: D1Database, params: {
    page: number;
    limit: number;
    search?: string;
  }): Promise<CustomerResponse> {
    try {
      const offset = (params.page - 1) * params.limit;
      let whereConditions = ['active = 1'];
      let bindParams: any[] = [];

      if (params.search) {
        whereConditions.push('(name LIKE ? OR phone LIKE ? OR email LIKE ?)');
        const searchTerm = `%${params.search}%`;
        bindParams.push(searchTerm, searchTerm, searchTerm);
      }

      const whereClause = whereConditions.join(' AND ');

      const customers = await db
        .prepare(`
          SELECT * FROM customers 
          WHERE ${whereClause}
          ORDER BY name
          LIMIT ? OFFSET ?
        `)
        .bind(...bindParams, params.limit, offset)
        .all();

      const countResult = await db
        .prepare(`
          SELECT COUNT(*) as total
          FROM customers
          WHERE ${whereClause}
        `)
        .bind(...bindParams)
        .first();

      const total = countResult?.total as number || 0;
      const totalPages = Math.ceil(total / params.limit);

      return {
        success: true,
        data: {
          customers: customers.results,
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
      console.error('Get customers error:', error);
      return {
        success: false,
        message: 'Có lỗi xảy ra khi tải khách hàng',
      };
    }
  }

  async getCustomerById(db: D1Database, customerId: string): Promise<CustomerResponse> {
    try {
      const customer = await db
        .prepare('SELECT * FROM customers WHERE id = ? AND active = 1')
        .bind(customerId)
        .first();

      if (!customer) {
        return {
          success: false,
          message: 'Không tìm thấy khách hàng',
        };
      }

      return {
        success: true,
        data: customer,
      };
    } catch (error) {
      console.error('Get customer by ID error:', error);
      return {
        success: false,
        message: 'Có lỗi xảy ra khi tải khách hàng',
      };
    }
  }

  async createCustomer(db: D1Database, customerData: any): Promise<CustomerResponse> {
    try {
      const customerId = crypto.randomUUID();

      await db
        .prepare(`
          INSERT INTO customers (
            id, name, email, phone, address, date_of_birth, gender,
            loyalty_points, total_spent, active, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `)
        .bind(
          customerId,
          customerData.name,
          customerData.email || null,
          customerData.phone || null,
          customerData.address ? JSON.stringify(customerData.address) : null,
          customerData.dateOfBirth || null,
          customerData.gender || null
        )
        .run();

      const customer = await this.getCustomerById(db, customerId);
      return {
        success: true,
        message: 'Tạo khách hàng thành công',
        data: customer.data,
      };
    } catch (error) {
      console.error('Create customer error:', error);
      return {
        success: false,
        message: 'Có lỗi xảy ra khi tạo khách hàng',
      };
    }
  }

  async updateCustomer(db: D1Database, customerId: string, updateData: any): Promise<CustomerResponse> {
    try {
      const updates: string[] = [];
      const values: any[] = [];

      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          if (key === 'address') {
            updates.push('address = ?');
            values.push(JSON.stringify(updateData[key]));
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
      values.push(customerId);

      await db
        .prepare(`UPDATE customers SET ${updates.join(', ')} WHERE id = ?`)
        .bind(...values)
        .run();

      const customer = await this.getCustomerById(db, customerId);
      return {
        success: true,
        message: 'Cập nhật khách hàng thành công',
        data: customer.data,
      };
    } catch (error) {
      console.error('Update customer error:', error);
      return {
        success: false,
        message: 'Có lỗi xảy ra khi cập nhật khách hàng',
      };
    }
  }

  async deleteCustomer(db: D1Database, customerId: string): Promise<CustomerResponse> {
    try {
      await db
        .prepare('UPDATE customers SET active = 0 WHERE id = ?')
        .bind(customerId)
        .run();

      return {
        success: true,
        message: 'Xóa khách hàng thành công',
      };
    } catch (error) {
      console.error('Delete customer error:', error);
      return {
        success: false,
        message: 'Có lỗi xảy ra khi xóa khách hàng',
      };
    }
  }
}

export const customerService = new CustomerService();
