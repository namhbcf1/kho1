/**
 * API service for communicating with Cloudflare Workers backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// Helper function to make API requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status,
        errorData.error || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    const data: ApiResponse<T> = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'API request failed');
    }

    return data.data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to server');
    }
    
    throw error;
  }
}

// Product API
export const productApi = {
  async getProducts(params?: {
    page?: number;
    limit?: number;
    query?: string;
    category?: string;
    status?: 'active' | 'inactive';
  }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.query) searchParams.set('query', params.query);
    if (params?.category) searchParams.set('category', params.category);
    if (params?.status) searchParams.set('status', params.status);
    
    const queryString = searchParams.toString();
    const endpoint = `/products${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<any>(endpoint);
  },

  async getProduct(id: string) {
    return apiRequest<any>(`/products/${id}`);
  },

  async createProduct(product: any) {
    return apiRequest<any>('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  },

  async updateProduct(id: string, product: any) {
    return apiRequest<any>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
  },

  async deleteProduct(id: string) {
    return apiRequest<any>(`/products/${id}`, {
      method: 'DELETE',
    });
  },

  async updateStock(id: string, quantity: number, operation: 'set' | 'add' | 'subtract' = 'set') {
    return apiRequest<any>(`/products/${id}/stock`, {
      method: 'PUT',
      body: JSON.stringify({ quantity, operation }),
    });
  },

  async getProductByBarcode(barcode: string) {
    return apiRequest<any>(`/products/barcode/${barcode}`);
  },

  async getLowStockProducts() {
    return apiRequest<any>('/products/stock/low');
  },

  async getCategories() {
    return apiRequest<any>('/categories');
  },
};

// Customer API
export const customerApi = {
  async getCustomers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    tier?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.tier) searchParams.set('tier', params.tier);
    
    const queryString = searchParams.toString();
    const endpoint = `/customers${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<any>(endpoint);
  },

  async getCustomer(id: string) {
    return apiRequest<any>(`/customers/${id}`);
  },

  async createCustomer(customer: any) {
    return apiRequest<any>('/customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    });
  },

  async updateCustomer(id: string, customer: any) {
    return apiRequest<any>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customer),
    });
  },

  async deleteCustomer(id: string) {
    return apiRequest<any>(`/customers/${id}`, {
      method: 'DELETE',
    });
  },

  async addLoyaltyPoints(id: string, points: number, reason?: string) {
    return apiRequest<any>(`/customers/${id}/loyalty/add`, {
      method: 'POST',
      body: JSON.stringify({ points, reason }),
    });
  },

  async redeemLoyaltyPoints(id: string, points: number, reason?: string) {
    return apiRequest<any>(`/customers/${id}/loyalty/redeem`, {
      method: 'POST',
      body: JSON.stringify({ points, reason }),
    });
  },

  async getCustomersByTier(tier: string) {
    return apiRequest<any>(`/customers/tier/${tier}`);
  },

  async getLoyaltyTiers() {
    return apiRequest<any>('/loyalty/tiers');
  },
};

// Order API
export const orderApi = {
  async getOrders(params?: {
    page?: number;
    limit?: number;
    status?: string;
    customer_id?: string;
    date_from?: string;
    date_to?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.status) searchParams.set('status', params.status);
    if (params?.customer_id) searchParams.set('customer_id', params.customer_id);
    if (params?.date_from) searchParams.set('date_from', params.date_from);
    if (params?.date_to) searchParams.set('date_to', params.date_to);
    
    const queryString = searchParams.toString();
    const endpoint = `/orders${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<any>(endpoint);
  },

  async getOrder(id: string) {
    return apiRequest<any>(`/orders/${id}`);
  },

  async createOrder(order: any) {
    return apiRequest<any>('/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  },

  async updateOrderStatus(id: string, status: string, notes?: string) {
    return apiRequest<any>(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
    });
  },

  async deleteOrder(id: string) {
    return apiRequest<any>(`/orders/${id}`, {
      method: 'DELETE',
    });
  },

  async getOrderStats(period?: string) {
    const queryString = period ? `?period=${period}` : '';
    return apiRequest<any>(`/orders/stats/summary${queryString}`);
  },

  async getRecentOrders(limit?: number) {
    const queryString = limit ? `?limit=${limit}` : '';
    return apiRequest<any>(`/orders/recent${queryString}`);
  },
};

// POS API
export const posApi = {
  async quickSale(saleData: any) {
    return apiRequest<any>('/pos/quick-sale', {
      method: 'POST',
      body: JSON.stringify(saleData),
    });
  },

  async searchProducts(query: string, limit?: number) {
    const searchParams = new URLSearchParams({ q: query });
    if (limit) searchParams.set('limit', limit.toString());
    
    return apiRequest<any>(`/pos/search?${searchParams.toString()}`);
  },

  async getProductByBarcode(barcode: string) {
    return apiRequest<any>(`/pos/barcode/${barcode}`);
  },

  async getCustomerByPhone(phone: string) {
    return apiRequest<any>(`/pos/customer/${phone}`);
  },

  async getDailySalesStats(date?: string) {
    const queryString = date ? `?date=${date}` : '';
    return apiRequest<any>(`/pos/stats/daily${queryString}`);
  },

  async getCashDrawerStatus() {
    return apiRequest<any>('/pos/cash-drawer');
  },

  async getRecentTransactions(limit?: number) {
    const queryString = limit ? `?limit=${limit}` : '';
    return apiRequest<any>(`/pos/transactions/recent${queryString}`);
  },

  async getReceipt(orderId: string) {
    return apiRequest<any>(`/pos/receipt/${orderId}`);
  },
};

// Analytics API
export const analyticsApi = {
  async getDashboard() {
    return apiRequest<any>('/analytics/dashboard');
  },

  async getTopProducts(limit?: number) {
    const queryString = limit ? `?limit=${limit}` : '';
    return apiRequest<any>(`/analytics/top-products${queryString}`);
  },

  async getLowStockProducts(limit?: number) {
    const queryString = limit ? `?limit=${limit}` : '';
    return apiRequest<any>(`/analytics/low-stock${queryString}`);
  },

  async getRevenueChart(days?: number) {
    const queryString = days ? `?days=${days}` : '';
    return apiRequest<any>(`/analytics/revenue-chart${queryString}`);
  },

  async getSalesChart() {
    return apiRequest<any>('/analytics/sales-chart');
  },

  async getAllAnalytics() {
    return apiRequest<any>('/analytics/all');
  },
};

// Auth API (if needed)
export const authApi = {
  async login(credentials: { email: string; password: string }) {
    return apiRequest<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  async logout() {
    return apiRequest<any>('/auth/logout', {
      method: 'POST',
    });
  },

  async getCurrentUser() {
    return apiRequest<any>('/auth/me');
  },
};

// Export everything
export { ApiError, apiRequest };
export default {
  products: productApi,
  customers: customerApi,
  orders: orderApi,
  pos: posApi,
  analytics: analyticsApi,
  auth: authApi,
};