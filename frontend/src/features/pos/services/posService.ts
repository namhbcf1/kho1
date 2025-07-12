// Cloudflare Workers API calls for POS operations
const API_BASE = '/api/pos';

export interface POSResponse {
  success: boolean;
  message?: string;
  data?: any;
}

class POSService {
  private getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  async getProducts(): Promise<POSResponse> {
    try {
      const response = await fetch(`${API_BASE}/products`, {
        headers: this.getAuthHeaders(),
      });

      return await response.json();
    } catch (error) {
      console.error('Get products error:', error);
      return {
        success: false,
        message: 'Có lỗi xảy ra khi tải sản phẩm',
      };
    }
  }

  async searchProducts(query: string): Promise<POSResponse> {
    try {
      const response = await fetch(`${API_BASE}/products/search?q=${encodeURIComponent(query)}`, {
        headers: this.getAuthHeaders(),
      });

      return await response.json();
    } catch (error) {
      console.error('Search products error:', error);
      return {
        success: false,
        message: 'Có lỗi xảy ra khi tìm kiếm sản phẩm',
      };
    }
  }

  async getProductByBarcode(barcode: string): Promise<POSResponse> {
    try {
      const response = await fetch(`${API_BASE}/products/barcode/${barcode}`, {
        headers: this.getAuthHeaders(),
      });

      return await response.json();
    } catch (error) {
      console.error('Get product by barcode error:', error);
      return {
        success: false,
        message: 'Không tìm thấy sản phẩm với mã vạch này',
      };
    }
  }

  async createOrder(orderData: any): Promise<POSResponse> {
    try {
      const response = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(orderData),
      });

      return await response.json();
    } catch (error) {
      console.error('Create order error:', error);
      return {
        success: false,
        message: 'Có lỗi xảy ra khi tạo đơn hàng',
      };
    }
  }

  async getOrders(params?: any): Promise<POSResponse> {
    try {
      const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
      const response = await fetch(`${API_BASE}/orders${queryString}`, {
        headers: this.getAuthHeaders(),
      });

      return await response.json();
    } catch (error) {
      console.error('Get orders error:', error);
      return {
        success: false,
        message: 'Có lỗi xảy ra khi tải danh sách đơn hàng',
      };
    }
  }

  async getOrderById(orderId: string): Promise<POSResponse> {
    try {
      const response = await fetch(`${API_BASE}/orders/${orderId}`, {
        headers: this.getAuthHeaders(),
      });

      return await response.json();
    } catch (error) {
      console.error('Get order by ID error:', error);
      return {
        success: false,
        message: 'Không tìm thấy đơn hàng',
      };
    }
  }

  async updateOrderStatus(orderId: string, status: string): Promise<POSResponse> {
    try {
      const response = await fetch(`${API_BASE}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ status }),
      });

      return await response.json();
    } catch (error) {
      console.error('Update order status error:', error);
      return {
        success: false,
        message: 'Có lỗi xảy ra khi cập nhật trạng thái đơn hàng',
      };
    }
  }

  async processRefund(orderId: string, refundData: any): Promise<POSResponse> {
    try {
      const response = await fetch(`${API_BASE}/orders/${orderId}/refund`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(refundData),
      });

      return await response.json();
    } catch (error) {
      console.error('Process refund error:', error);
      return {
        success: false,
        message: 'Có lỗi xảy ra khi xử lý hoàn trả',
      };
    }
  }

  async getCustomers(): Promise<POSResponse> {
    try {
      const response = await fetch(`${API_BASE}/customers`, {
        headers: this.getAuthHeaders(),
      });

      return await response.json();
    } catch (error) {
      console.error('Get customers error:', error);
      return {
        success: false,
        message: 'Có lỗi xảy ra khi tải danh sách khách hàng',
      };
    }
  }

  async searchCustomers(query: string): Promise<POSResponse> {
    try {
      const response = await fetch(`${API_BASE}/customers/search?q=${encodeURIComponent(query)}`, {
        headers: this.getAuthHeaders(),
      });

      return await response.json();
    } catch (error) {
      console.error('Search customers error:', error);
      return {
        success: false,
        message: 'Có lỗi xảy ra khi tìm kiếm khách hàng',
      };
    }
  }
}

export const posService = new POSService();
