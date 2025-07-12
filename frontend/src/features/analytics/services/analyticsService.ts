// Analytics service for API calls
import { apiClient } from '../../../services/apiClient';
import { AnalyticsFilters, DashboardStats, RevenueDataPoint } from '../hooks/useAnalytics';

export const analyticsService = {
  // Get dashboard statistics
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await apiClient.get('/analytics/dashboard');
    return response.data;
  },

  // Get revenue data with filters
  async getRevenueData(filters: AnalyticsFilters = {}): Promise<RevenueDataPoint[]> {
    const params = new URLSearchParams();
    
    if (filters.period) params.append('period', filters.period);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.groupBy) params.append('groupBy', filters.groupBy);

    const response = await apiClient.get(`/analytics/revenue?${params.toString()}`);
    return response.data;
  },

  // Get product analytics
  async getProductAnalytics(filters: AnalyticsFilters = []) {
    const params = new URLSearchParams();
    
    if (filters.period) params.append('period', filters.period);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await apiClient.get(`/analytics/products?${params.toString()}`);
    return response.data;
  },

  // Get customer analytics
  async getCustomerAnalytics(filters: AnalyticsFilters = {}) {
    const params = new URLSearchParams();
    
    if (filters.period) params.append('period', filters.period);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await apiClient.get(`/analytics/customers?${params.toString()}`);
    return response.data;
  },

  // Get sales analytics
  async getSalesAnalytics(filters: AnalyticsFilters = {}) {
    const params = new URLSearchParams();
    
    if (filters.period) params.append('period', filters.period);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await apiClient.get(`/analytics/sales?${params.toString()}`);
    return response.data;
  },

  // Get performance metrics
  async getPerformanceMetrics(filters: AnalyticsFilters = {}) {
    const params = new URLSearchParams();
    
    if (filters.period) params.append('period', filters.period);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await apiClient.get(`/analytics/performance?${params.toString()}`);
    return response.data;
  },

  // Get inventory analytics
  async getInventoryAnalytics() {
    const response = await apiClient.get('/analytics/inventory');
    return response.data;
  },

  // Get loyalty program analytics
  async getLoyaltyAnalytics(filters: AnalyticsFilters = {}) {
    const params = new URLSearchParams();
    
    if (filters.period) params.append('period', filters.period);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await apiClient.get(`/analytics/loyalty?${params.toString()}`);
    return response.data;
  },

  // Get payment method analytics
  async getPaymentAnalytics(filters: AnalyticsFilters = {}) {
    const params = new URLSearchParams();
    
    if (filters.period) params.append('period', filters.period);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await apiClient.get(`/analytics/payments?${params.toString()}`);
    return response.data;
  },

  // Get real-time statistics
  async getRealTimeStats() {
    const response = await apiClient.get('/analytics/realtime');
    return response.data;
  },

  // Export analytics report
  async exportReport(
    type: 'revenue' | 'products' | 'customers' | 'sales',
    filters: AnalyticsFilters = {},
    format: 'csv' | 'excel' | 'pdf' = 'excel'
  ): Promise<Blob> {
    const params = new URLSearchParams();
    
    if (filters.period) params.append('period', filters.period);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    params.append('format', format);

    const response = await apiClient.get(`/analytics/${type}/export?${params.toString()}`, {
      responseType: 'blob',
    });

    return response.data;
  },

  // Get hourly sales data
  async getHourlySales(date?: string) {
    const params = new URLSearchParams();
    if (date) params.append('date', date);

    const response = await apiClient.get(`/analytics/hourly?${params.toString()}`);
    return response.data;
  },

  // Get daily sales data
  async getDailySales(month?: string) {
    const params = new URLSearchParams();
    if (month) params.append('month', month);

    const response = await apiClient.get(`/analytics/daily?${params.toString()}`);
    return response.data;
  },

  // Get monthly sales data
  async getMonthlySales(year?: string) {
    const params = new URLSearchParams();
    if (year) params.append('year', year);

    const response = await apiClient.get(`/analytics/monthly?${params.toString()}`);
    return response.data;
  },

  // Get category performance
  async getCategoryPerformance(filters: AnalyticsFilters = {}) {
    const params = new URLSearchParams();
    
    if (filters.period) params.append('period', filters.period);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await apiClient.get(`/analytics/categories?${params.toString()}`);
    return response.data;
  },

  // Get staff performance
  async getStaffPerformance(filters: AnalyticsFilters = {}) {
    const params = new URLSearchParams();
    
    if (filters.period) params.append('period', filters.period);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await apiClient.get(`/analytics/staff?${params.toString()}`);
    return response.data;
  },

  // Get profit analysis
  async getProfitAnalysis(filters: AnalyticsFilters = {}) {
    const params = new URLSearchParams();
    
    if (filters.period) params.append('period', filters.period);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await apiClient.get(`/analytics/profit?${params.toString()}`);
    return response.data;
  },

  // Get tax report
  async getTaxReport(filters: AnalyticsFilters = {}) {
    const params = new URLSearchParams();
    
    if (filters.period) params.append('period', filters.period);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await apiClient.get(`/analytics/tax?${params.toString()}`);
    return response.data;
  },

  // Get forecast data
  async getForecast(type: 'revenue' | 'sales' | 'inventory', days: number = 30) {
    const params = new URLSearchParams();
    params.append('type', type);
    params.append('days', days.toString());

    const response = await apiClient.get(`/analytics/forecast?${params.toString()}`);
    return response.data;
  },
};
