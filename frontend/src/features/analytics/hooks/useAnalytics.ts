// Analytics hooks for dashboard data
import { useState, useCallback } from 'react';
import { analyticsService } from '../services/analyticsService';

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  orders: number;
  customers: number;
}

export interface DashboardStats {
  today: {
    revenue: number;
    orders: number;
    customers: number;
    averageOrder: number;
  };
  growth: {
    revenue: number;
    orders: number;
    customers: number;
  };
  topProducts: Array<{
    id: string;
    name: string;
    sold: number;
    revenue: number;
  }>;
  topCustomers: Array<{
    id: string;
    name: string;
    orders: number;
    spent: number;
  }>;
}

export interface AnalyticsFilters {
  period?: string;
  startDate?: string;
  endDate?: string;
  groupBy?: string;
  metrics?: string[];
}

export const useAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);

  const getDashboardStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const stats = await analyticsService.getDashboardStats();
      setDashboardStats(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  }, []);

  const getRevenueData = useCallback(async (filters: AnalyticsFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await analyticsService.getRevenueData(filters);
      setRevenueData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  }, []);

  const getProductAnalytics = useCallback(async (filters: AnalyticsFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      return await analyticsService.getProductAnalytics(filters);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product analytics');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getCustomerAnalytics = useCallback(async (filters: AnalyticsFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      return await analyticsService.getCustomerAnalytics(filters);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customer analytics');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getSalesAnalytics = useCallback(async (filters: AnalyticsFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      return await analyticsService.getSalesAnalytics(filters);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sales analytics');
      return {};
    } finally {
      setLoading(false);
    }
  }, []);

  const exportReport = useCallback(async (
    type: 'revenue' | 'products' | 'customers' | 'sales',
    filters: AnalyticsFilters = {},
    format: 'csv' | 'excel' | 'pdf' = 'excel'
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      const blob = await analyticsService.exportReport(type, filters, format);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}-report-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export report');
    } finally {
      setLoading(false);
    }
  }, []);

  const getPerformanceMetrics = useCallback(async (filters: AnalyticsFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      return await analyticsService.getPerformanceMetrics(filters);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load performance metrics');
      return {};
    } finally {
      setLoading(false);
    }
  }, []);

  const getInventoryAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      return await analyticsService.getInventoryAnalytics();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory analytics');
      return {};
    } finally {
      setLoading(false);
    }
  }, []);

  const getLoyaltyAnalytics = useCallback(async (filters: AnalyticsFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      return await analyticsService.getLoyaltyAnalytics(filters);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load loyalty analytics');
      return {};
    } finally {
      setLoading(false);
    }
  }, []);

  const getPaymentAnalytics = useCallback(async (filters: AnalyticsFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      return await analyticsService.getPaymentAnalytics(filters);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment analytics');
      return {};
    } finally {
      setLoading(false);
    }
  }, []);

  const getRealTimeStats = useCallback(async () => {
    try {
      return await analyticsService.getRealTimeStats();
    } catch (err) {
      console.error('Failed to load real-time stats:', err);
      return null;
    }
  }, []);

  return {
    loading,
    error,
    revenueData,
    dashboardStats,
    
    // Methods
    getDashboardStats,
    getRevenueData,
    getProductAnalytics,
    getCustomerAnalytics,
    getSalesAnalytics,
    getPerformanceMetrics,
    getInventoryAnalytics,
    getLoyaltyAnalytics,
    getPaymentAnalytics,
    getRealTimeStats,
    exportReport,
  };
};
