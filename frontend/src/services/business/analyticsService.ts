// Analytics data API service
import { apiClient } from '../api/client';
import { API_ENDPOINTS } from '../api/endpoints';

export const analyticsService = {
  // Dashboard
  async getDashboardStats() {
    const response = await apiClient.get(API_ENDPOINTS.DASHBOARD_STATS);
    return response.data;
  },

  async getRealtimeStats() {
    const response = await apiClient.get(API_ENDPOINTS.REALTIME_STATS);
    return response.data;
  },

  // Revenue analytics
  async getRevenueData(params: {
    period?: 'today' | 'week' | 'month' | 'quarter' | 'year';
    startDate?: string;
    endDate?: string;
    groupBy?: 'hour' | 'day' | 'week' | 'month';
  }) {
    const response = await apiClient.get(API_ENDPOINTS.REVENUE_DATA, { params });
    return response.data;
  },

  async getRevenueComparison(currentPeriod: string, previousPeriod: string) {
    const response = await apiClient.get(`${API_ENDPOINTS.REVENUE_DATA}/comparison`, {
      params: { currentPeriod, previousPeriod }
    });
    return response.data;
  },

  // Sales analytics
  async getSalesAnalytics(params: {
    period?: string;
    startDate?: string;
    endDate?: string;
    groupBy?: string;
  }) {
    const response = await apiClient.get(API_ENDPOINTS.SALES_ANALYTICS, { params });
    return response.data;
  },

  async getSalesPerformance(period: string = 'month') {
    const response = await apiClient.get(`${API_ENDPOINTS.SALES_ANALYTICS}/performance`, {
      params: { period }
    });
    return response.data;
  },

  async getSalesTrends(period: string = 'month', metric: 'revenue' | 'orders' | 'customers' = 'revenue') {
    const response = await apiClient.get(`${API_ENDPOINTS.SALES_ANALYTICS}/trends`, {
      params: { period, metric }
    });
    return response.data;
  },

  // Product analytics
  async getProductAnalytics(params: {
    period?: string;
    startDate?: string;
    endDate?: string;
    categoryId?: string;
  }) {
    const response = await apiClient.get(API_ENDPOINTS.PRODUCT_ANALYTICS, { params });
    return response.data;
  },

  async getTopProducts(params: {
    period?: string;
    limit?: number;
    sortBy?: 'revenue' | 'quantity' | 'orders';
  }) {
    const response = await apiClient.get(`${API_ENDPOINTS.PRODUCT_ANALYTICS}/top`, { params });
    return response.data;
  },

  async getProductPerformance(productId: string, period: string = 'month') {
    const response = await apiClient.get(`${API_ENDPOINTS.PRODUCT_ANALYTICS}/product/${productId}`, {
      params: { period }
    });
    return response.data;
  },

  async getCategoryPerformance(period: string = 'month') {
    const response = await apiClient.get(`${API_ENDPOINTS.PRODUCT_ANALYTICS}/categories`, {
      params: { period }
    });
    return response.data;
  },

  // Customer analytics
  async getCustomerAnalytics(params: {
    period?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const response = await apiClient.get(API_ENDPOINTS.CUSTOMER_ANALYTICS, { params });
    return response.data;
  },

  async getCustomerSegmentation() {
    const response = await apiClient.get(`${API_ENDPOINTS.CUSTOMER_ANALYTICS}/segmentation`);
    return response.data;
  },

  async getCustomerLifetimeValue(period: string = 'year') {
    const response = await apiClient.get(`${API_ENDPOINTS.CUSTOMER_ANALYTICS}/lifetime-value`, {
      params: { period }
    });
    return response.data;
  },

  async getCustomerRetention(period: string = 'month') {
    const response = await apiClient.get(`${API_ENDPOINTS.CUSTOMER_ANALYTICS}/retention`, {
      params: { period }
    });
    return response.data;
  },

  // Inventory analytics
  async getInventoryAnalytics(params?: any) {
    const response = await apiClient.get(API_ENDPOINTS.INVENTORY_ANALYTICS, { params });
    return response.data;
  },

  async getInventoryTurnover(period: string = 'month') {
    const response = await apiClient.get(`${API_ENDPOINTS.INVENTORY_ANALYTICS}/turnover`, {
      params: { period }
    });
    return response.data;
  },

  async getSlowMovingProducts(days: number = 30) {
    const response = await apiClient.get(`${API_ENDPOINTS.INVENTORY_ANALYTICS}/slow-moving`, {
      params: { days }
    });
    return response.data;
  },

  // Staff analytics
  async getStaffAnalytics(params: {
    period?: string;
    startDate?: string;
    endDate?: string;
    staffId?: string;
  }) {
    const response = await apiClient.get(API_ENDPOINTS.STAFF_ANALYTICS, { params });
    return response.data;
  },

  async getStaffPerformance(staffId?: string, period: string = 'month') {
    const endpoint = staffId 
      ? `${API_ENDPOINTS.STAFF_ANALYTICS}/staff/${staffId}`
      : `${API_ENDPOINTS.STAFF_ANALYTICS}/performance`;
    
    const response = await apiClient.get(endpoint, {
      params: { period }
    });
    return response.data;
  },

  // Export reports
  async exportReport(params: {
    type: 'revenue' | 'sales' | 'products' | 'customers' | 'inventory' | 'staff';
    format: 'csv' | 'excel' | 'pdf';
    period?: string;
    startDate?: string;
    endDate?: string;
    filters?: any;
  }) {
    const response = await apiClient.get(API_ENDPOINTS.EXPORT_REPORT, {
      params,
      responseType: 'blob'
    });
    return response.data;
  },

  // Custom reports
  async createCustomReport(report: {
    name: string;
    type: string;
    filters: any;
    metrics: string[];
    groupBy?: string;
    sortBy?: string;
  }) {
    const response = await apiClient.post(`${API_ENDPOINTS.EXPORT_REPORT}/custom`, report);
    return response.data;
  },

  async getCustomReports() {
    const response = await apiClient.get(`${API_ENDPOINTS.EXPORT_REPORT}/custom`);
    return response.data;
  },

  async runCustomReport(reportId: string, params?: any) {
    const response = await apiClient.get(`${API_ENDPOINTS.EXPORT_REPORT}/custom/${reportId}/run`, { params });
    return response.data;
  },
};
