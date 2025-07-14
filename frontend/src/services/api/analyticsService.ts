// Real analytics service with Cloudflare API integration
import { apiClient } from './client';
import { API_ENDPOINTS } from '../../constants/api';

export interface DashboardKPIs {
  todayRevenue: number;
  todayOrders: number;
  todayCustomers: number;
  monthRevenue: number;
  monthOrders: number;
  monthCustomers: number;
  averageOrderValue: number;
  growth: {
    revenue: number;
    orders: number;
    customers: number;
    averageOrder: number;
  };
}

export interface SalesData {
  date: string;
  revenue: number;
  orders: number;
  customers: number;
  transactions: number;
}

export interface TopProduct {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  sold: number;
  revenue: number;
  profit: number;
  margin: number;
}

export interface LowStockProduct {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  minStock: number;
  reorderLevel: number;
  lastRestocked: string;
}

export interface InventoryStats {
  totalProducts: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  categories: number;
}

export interface CustomerStats {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  loyaltyTiers: {
    dong: number;
    bac: number;
    vang: number;
    bachkim: number;
    kimcuong: number;
  };
  averageOrderValue: number;
  lifetimeValue: number;
}

export interface PaymentStats {
  cash: { amount: number; count: number };
  vnpay: { amount: number; count: number };
  momo: { amount: number; count: number };
  zalopay: { amount: number; count: number };
  card: { amount: number; count: number };
}

class AnalyticsService {
  async getDashboardKPIs(dateRange?: { start: string; end: string }): Promise<DashboardKPIs> {
    const params = dateRange ? { 
      start_date: dateRange.start, 
      end_date: dateRange.end 
    } : {};
    
    const response = await apiClient.get(API_ENDPOINTS.ANALYTICS.DASHBOARD, { params });
    return response.data;
  }

  async getSalesData(period: string, dateRange?: { start: string; end: string }): Promise<SalesData[]> {
    const params = { 
      period,
      ...(dateRange && { start_date: dateRange.start, end_date: dateRange.end })
    };
    
    const response = await apiClient.get(API_ENDPOINTS.ANALYTICS.SALES, { params });
    return response.data;
  }

  async getRevenueData(period: string, dateRange?: { start: string; end: string }): Promise<SalesData[]> {
    const params = { 
      period,
      ...(dateRange && { start_date: dateRange.start, end_date: dateRange.end })
    };
    
    const response = await apiClient.get(API_ENDPOINTS.ANALYTICS.REVENUE, { params });
    return response.data;
  }

  async getTopProducts(limit = 10, period = 'month'): Promise<TopProduct[]> {
    const response = await apiClient.get(`${API_ENDPOINTS.ANALYTICS.SALES}/top-products`, {
      params: { limit, period }
    });
    return response.data;
  }

  async getLowStockProducts(limit = 10): Promise<LowStockProduct[]> {
    const response = await apiClient.get(`${API_ENDPOINTS.ANALYTICS.INVENTORY}/low-stock`, {
      params: { limit }
    });
    return response.data;
  }

  async getInventoryStats(): Promise<InventoryStats> {
    const response = await apiClient.get(`${API_ENDPOINTS.ANALYTICS.INVENTORY}/stats`);
    return response.data;
  }

  async getCustomerStats(period = 'month'): Promise<CustomerStats> {
    const response = await apiClient.get(API_ENDPOINTS.ANALYTICS.CUSTOMERS, {
      params: { period }
    });
    return response.data;
  }

  async getPaymentStats(period = 'month'): Promise<PaymentStats> {
    const response = await apiClient.get(`${API_ENDPOINTS.ANALYTICS.SALES}/payment-methods`, {
      params: { period }
    });
    return response.data;
  }

  async exportSalesReport(format: 'csv' | 'xlsx', dateRange: { start: string; end: string }): Promise<Blob> {
    const response = await apiClient.get(`${API_ENDPOINTS.ANALYTICS.EXPORT}/sales`, {
      params: { 
        format, 
        start_date: dateRange.start, 
        end_date: dateRange.end 
      },
      responseType: 'blob'
    });
    return response.data;
  }

  async exportInventoryReport(format: 'csv' | 'xlsx'): Promise<Blob> {
    const response = await apiClient.get(`${API_ENDPOINTS.ANALYTICS.EXPORT}/inventory`, {
      params: { format },
      responseType: 'blob'
    });
    return response.data;
  }

  async exportCustomerReport(format: 'csv' | 'xlsx', dateRange: { start: string; end: string }): Promise<Blob> {
    const response = await apiClient.get(`${API_ENDPOINTS.ANALYTICS.EXPORT}/customers`, {
      params: { 
        format, 
        start_date: dateRange.start, 
        end_date: dateRange.end 
      },
      responseType: 'blob'
    });
    return response.data;
  }

  // Vietnamese business hour analysis (6 AM - 10 PM)
  async getBusinessHourAnalysis(dateRange: { start: string; end: string }): Promise<{
    hourly: Array<{ hour: number; revenue: number; orders: number; customers: number }>;
    peakHours: Array<{ hour: number; performance: number }>;
    offPeakHours: Array<{ hour: number; performance: number }>;
  }> {
    const response = await apiClient.get(`${API_ENDPOINTS.ANALYTICS.SALES}/business-hours`, {
      params: { 
        start_date: dateRange.start, 
        end_date: dateRange.end 
      }
    });
    return response.data;
  }

  // Regional sales comparison (North/Central/South Vietnam)
  async getRegionalSales(period = 'month'): Promise<{
    north: { revenue: number; orders: number; customers: number };
    central: { revenue: number; orders: number; customers: number };
    south: { revenue: number; orders: number; customers: number };
  }> {
    const response = await apiClient.get(`${API_ENDPOINTS.ANALYTICS.SALES}/regional`, {
      params: { period }
    });
    return response.data;
  }

  // Lunar calendar integration for traditional holidays
  async getHolidayAnalysis(year: number): Promise<{
    tet: { revenue: number; orders: number; growth: number };
    trungThu: { revenue: number; orders: number; growth: number };
    holidays: Array<{
      name: string;
      date: string;
      revenue: number;
      orders: number;
      growth: number;
    }>;
  }> {
    const response = await apiClient.get(`${API_ENDPOINTS.ANALYTICS.SALES}/holidays`, {
      params: { year }
    });
    return response.data;
  }
}

export const analyticsService = new AnalyticsService();