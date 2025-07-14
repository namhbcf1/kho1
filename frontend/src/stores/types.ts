// Comprehensive TypeScript types for all Zustand stores
export interface BaseStore {
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  version: number;
}

export interface PersistConfig {
  name: string;
  version: number;
  partialize?: <T>(state: T) => Partial<T>;
  migrate?: (persistedState: any, version: number) => any;
  storage?: any;
}

export interface StoreActions<T> {
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
  updateLastUpdated: () => void;
  optimisticUpdate: <K extends keyof T>(key: K, value: T[K], rollback: () => void) => void;
}

// Dashboard Analytics Types
export interface DashboardKPIs {
  todayRevenue: number;
  todayOrders: number;
  todayCustomers: number;
  averageOrderValue: number;
  monthRevenue: number;
  monthOrders: number;
  monthCustomers: number;
  growth: {
    revenue: number;
    orders: number;
    customers: number;
    averageOrder: number;
  };
}

export interface TopProduct {
  id: string | number;
  name: string;
  sku?: string;
  categoryName?: string;
  sold: number;
  revenue: number;
  margin: number;
  orderCount?: number;
}

export interface LowStockProduct {
  id: string | number;
  name: string;
  sku?: string;
  currentStock: number;
  minStock: number;
  reorderLevel: number;
  price?: number;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  orders: number;
  customers?: number;
  formattedDate?: string;
}

export interface SalesDistribution {
  range: string;
  count: number;
  revenue: number;
  percentage?: number;
}

// Analytics Store State
export interface AnalyticsState extends BaseStore {
  dashboardKPIs: DashboardKPIs | null;
  topProducts: TopProduct[];
  lowStockProducts: LowStockProduct[];
  revenueChart: RevenueDataPoint[];
  salesChart: SalesDistribution[];
  selectedPeriod: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  dateRange: [string, string] | null;
  autoRefresh: boolean;
  refreshInterval: number;
}

// Analytics Store Actions
export interface AnalyticsActions extends StoreActions<AnalyticsState> {
  // Data setters with optimistic updates
  setDashboardKPIs: (kpis: DashboardKPIs, optimistic?: boolean) => Promise<void>;
  setTopProducts: (products: TopProduct[], optimistic?: boolean) => Promise<void>;
  setLowStockProducts: (products: LowStockProduct[], optimistic?: boolean) => Promise<void>;
  setRevenueChart: (data: RevenueDataPoint[], optimistic?: boolean) => Promise<void>;
  setSalesChart: (data: SalesDistribution[], optimistic?: boolean) => Promise<void>;
  
  // Period and range setters
  setSelectedPeriod: (period: AnalyticsState['selectedPeriod']) => void;
  setDateRange: (range: [string, string] | null) => void;
  setAutoRefresh: (enabled: boolean) => void;
  setRefreshInterval: (interval: number) => void;
  
  // Data fetching actions
  fetchDashboardData: (force?: boolean) => Promise<void>;
  fetchKPIs: (force?: boolean) => Promise<void>;
  fetchTopProducts: (limit?: number, force?: boolean) => Promise<void>;
  fetchLowStockProducts: (limit?: number, force?: boolean) => Promise<void>;
  fetchRevenueChart: (days?: number, force?: boolean) => Promise<void>;
  fetchSalesChart: (force?: boolean) => Promise<void>;
  
  // Utility functions
  calculateGrowth: (current: number, previous: number) => number;
  formatCurrency: (amount: number) => string;
  getTotalRevenue: () => number;
  getTotalOrders: () => number;
  getAverageOrderValue: () => number;
  
  // Cache management
  invalidateCache: (keys?: string[]) => void;
  refreshData: () => Promise<void>;
}

// Combined Analytics Store Type
export interface AnalyticsStore extends AnalyticsState, AnalyticsActions {}

// Error handling types
export interface StoreError {
  code: string;
  message: string;
  timestamp: Date;
  context?: string;
  retryable: boolean;
}

export interface OptimisticUpdate<T> {
  id: string;
  key: keyof T;
  previousValue: any;
  newValue: any;
  timestamp: Date;
  rollback: () => void;
}

// Subscription types
export interface StoreSubscription {
  id: string;
  selector: (state: any) => any;
  callback: (state: any) => void;
  cleanup: () => void;
}

// Sync types for multi-tab synchronization
export interface SyncMessage {
  type: 'STATE_UPDATE' | 'STATE_RESET' | 'OPTIMISTIC_UPDATE' | 'ROLLBACK';
  storeName: string;
  data: any;
  timestamp: Date;
  source: string;
}

// Store configuration
export interface StoreConfig {
  persist: boolean;
  sync: boolean;
  devtools: boolean;
  autoCleanup: boolean;
  errorHandling: boolean;
  optimisticUpdates: boolean;
}

// Vietnamese specific types
export interface VietnameseFormatting {
  currency: (amount: number) => string;
  number: (num: number) => string;
  percentage: (value: number) => string;
  date: (date: Date | string) => string;
  time: (date: Date | string) => string;
}

// Network state types
export interface NetworkState {
  isOnline: boolean;
  connectionType: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
  effectiveType: '2g' | '3g' | '4g' | 'slow-2g' | 'unknown';
  downlink: number;
  rtt: number;
}

// Export commonly used type guards
export const isStoreError = (error: any): error is StoreError => {
  return error && typeof error === 'object' && 'code' in error && 'message' in error;
};

export const isValidDashboardKPIs = (data: any): data is DashboardKPIs => {
  return data && 
    typeof data === 'object' &&
    typeof data.todayRevenue === 'number' &&
    typeof data.todayOrders === 'number' &&
    typeof data.todayCustomers === 'number' &&
    typeof data.averageOrderValue === 'number' &&
    data.growth &&
    typeof data.growth === 'object';
};

export const isValidTopProduct = (product: any): product is TopProduct => {
  return product &&
    typeof product === 'object' &&
    (typeof product.id === 'string' || typeof product.id === 'number') &&
    typeof product.name === 'string' &&
    typeof product.sold === 'number' &&
    typeof product.revenue === 'number';
};

export const isValidRevenueDataPoint = (point: any): point is RevenueDataPoint => {
  return point &&
    typeof point === 'object' &&
    typeof point.date === 'string' &&
    typeof point.revenue === 'number' &&
    typeof point.orders === 'number';
};

// Constants
export const STORE_VERSIONS = {
  ANALYTICS: 2,
  AUTH: 1,
  POS: 3,
  PRODUCT: 2,
  CUSTOMER: 1,
  ORDER: 2,
  INVENTORY: 1,
  SETTINGS: 1,
  UI: 1,
} as const;

export const CACHE_KEYS = {
  DASHBOARD_KPIS: 'dashboard-kpis',
  TOP_PRODUCTS: 'top-products',
  LOW_STOCK: 'low-stock',
  REVENUE_CHART: 'revenue-chart',
  SALES_CHART: 'sales-chart',
} as const;

export const SYNC_CHANNELS = {
  ANALYTICS: 'analytics-sync',
  GENERAL: 'store-sync',
} as const;