// Analytics dashboard state
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface DashboardStats {
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

interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
  customers: number;
}

interface AnalyticsStore {
  // State
  dashboardStats: DashboardStats | null;
  revenueData: RevenueData[];
  loading: boolean;
  error: string | null;
  dateRange: [string, string] | null;
  selectedPeriod: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  
  // Actions
  setDashboardStats: (stats: DashboardStats) => void;
  setRevenueData: (data: RevenueData[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setDateRange: (range: [string, string] | null) => void;
  setSelectedPeriod: (period: AnalyticsStore['selectedPeriod']) => void;
  
  // Utility actions
  calculateGrowth: (current: number, previous: number) => number;
  formatCurrency: (amount: number) => string;
  getTotalRevenue: () => number;
  getTotalOrders: () => number;
  getAverageOrderValue: () => number;
  reset: () => void;
}

const initialState = {
  dashboardStats: null,
  revenueData: [],
  loading: false,
  error: null,
  dateRange: null,
  selectedPeriod: 'today' as const,
};

export const useAnalyticsStore = create<AnalyticsStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Setters
      setDashboardStats: (stats) => set({ dashboardStats: stats }),
      setRevenueData: (data) => set({ revenueData: data }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setDateRange: (range) => set({ dateRange: range }),
      setSelectedPeriod: (period) => set({ selectedPeriod: period }),

      // Utility functions
      calculateGrowth: (current, previous) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
      },

      formatCurrency: (amount) => {
        return new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND',
        }).format(amount);
      },

      getTotalRevenue: () => {
        return get().revenueData.reduce((total, item) => total + item.revenue, 0);
      },

      getTotalOrders: () => {
        return get().revenueData.reduce((total, item) => total + item.orders, 0);
      },

      getAverageOrderValue: () => {
        const totalRevenue = get().getTotalRevenue();
        const totalOrders = get().getTotalOrders();
        return totalOrders > 0 ? totalRevenue / totalOrders : 0;
      },

      reset: () => set(initialState),
    }),
    { name: 'AnalyticsStore' }
  )
);
