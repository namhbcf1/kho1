// Comprehensive store hooks with cleanup and error handling
import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { shallow } from 'zustand/shallow';
import { useAnalyticsStore } from '../stores/analyticsStore.enhanced';
import { subscriptionManager, useStoreSubscription, useStoreSelector } from '../stores/subscriptionManager';
import { AnalyticsStore, DashboardKPIs, TopProduct, LowStockProduct, StoreError } from '../stores/types';

// Enhanced analytics store hooks with cleanup
export function useAnalytics() {
  const store = useAnalyticsStore;
  
  // Memoized selectors for performance
  const data = useStoreSelector(
    store,
    (state) => ({
      dashboardKPIs: state.dashboardKPIs,
      topProducts: state.topProducts,
      lowStockProducts: state.lowStockProducts,
      revenueChart: state.revenueChart,
      salesChart: state.salesChart,
    }),
    []
  );

  const state = useStoreSelector(
    store,
    (state) => ({
      loading: state.loading,
      error: state.error,
      lastUpdated: state.lastUpdated,
    }),
    []
  );

  const config = useStoreSelector(
    store,
    (state) => ({
      selectedPeriod: state.selectedPeriod,
      dateRange: state.dateRange,
      autoRefresh: state.autoRefresh,
      refreshInterval: state.refreshInterval,
    }),
    []
  );

  const actions = useMemo(() => ({
    fetchDashboardData: store.getState().fetchDashboardData,
    fetchKPIs: store.getState().fetchKPIs,
    fetchTopProducts: store.getState().fetchTopProducts,
    fetchLowStockProducts: store.getState().fetchLowStockProducts,
    fetchRevenueChart: store.getState().fetchRevenueChart,
    fetchSalesChart: store.getState().fetchSalesChart,
    setSelectedPeriod: store.getState().setSelectedPeriod,
    setDateRange: store.getState().setDateRange,
    setAutoRefresh: store.getState().setAutoRefresh,
    setRefreshInterval: store.getState().setRefreshInterval,
    invalidateCache: store.getState().invalidateCache,
    refreshData: store.getState().refreshData,
    clearError: store.getState().clearError,
    reset: store.getState().reset,
  }), []);

  const utils = useMemo(() => ({
    calculateGrowth: store.getState().calculateGrowth,
    formatCurrency: store.getState().formatCurrency,
    getTotalRevenue: store.getState().getTotalRevenue,
    getTotalOrders: store.getState().getTotalOrders,
    getAverageOrderValue: store.getState().getAverageOrderValue,
  }), []);

  return {
    ...data,
    ...state,
    ...config,
    actions,
    utils,
  };
}

// Hook for dashboard KPIs with optimistic updates
export function useDashboardKPIs() {
  const kpis = useStoreSelector(
    useAnalyticsStore,
    (state) => state.dashboardKPIs,
    []
  );

  const loading = useStoreSelector(
    useAnalyticsStore,
    (state) => state.loading,
    []
  );

  const error = useStoreSelector(
    useAnalyticsStore,
    (state) => state.error,
    []
  );

  const actions = useMemo(() => ({
    fetch: useAnalyticsStore.getState().fetchKPIs,
    setOptimistic: (data: DashboardKPIs) => 
      useAnalyticsStore.getState().setDashboardKPIs(data, true),
    clear: useAnalyticsStore.getState().clearError,
  }), []);

  // Auto-fetch on mount if no data
  useEffect(() => {
    if (!kpis && !loading && !error) {
      actions.fetch();
    }
  }, [kpis, loading, error, actions.fetch]);

  return {
    data: kpis,
    loading,
    error,
    actions,
  };
}

// Hook for top products with pagination and filtering
export function useTopProducts(limit: number = 5) {
  const products = useStoreSelector(
    useAnalyticsStore,
    (state) => state.topProducts.slice(0, limit),
    [limit]
  );

  const loading = useStoreSelector(
    useAnalyticsStore,
    (state) => state.loading,
    []
  );

  const actions = useMemo(() => ({
    fetch: (forceRefresh = false) => 
      useAnalyticsStore.getState().fetchTopProducts(limit, forceRefresh),
    setOptimistic: (data: TopProduct[]) => 
      useAnalyticsStore.getState().setTopProducts(data, true),
  }), [limit]);

  return {
    data: products,
    loading,
    actions,
  };
}

// Hook for low stock products with alerts
export function useLowStockProducts(limit: number = 5) {
  const products = useStoreSelector(
    useAnalyticsStore,
    (state) => state.lowStockProducts.slice(0, limit),
    [limit]
  );

  const loading = useStoreSelector(
    useAnalyticsStore,
    (state) => state.loading,
    []
  );

  // Calculate alert level
  const alertLevel = useMemo(() => {
    const criticalCount = products.filter(p => p.currentStock <= p.minStock * 0.5).length;
    const warningCount = products.filter(p => 
      p.currentStock > p.minStock * 0.5 && p.currentStock <= p.minStock
    ).length;

    if (criticalCount > 0) return 'critical';
    if (warningCount > 0) return 'warning';
    return 'normal';
  }, [products]);

  const actions = useMemo(() => ({
    fetch: (forceRefresh = false) => 
      useAnalyticsStore.getState().fetchLowStockProducts(limit, forceRefresh),
    setOptimistic: (data: LowStockProduct[]) => 
      useAnalyticsStore.getState().setLowStockProducts(data, true),
  }), [limit]);

  return {
    data: products,
    loading,
    alertLevel,
    actions,
  };
}

// Hook for revenue chart with period management
export function useRevenueChart(days: number = 7) {
  const chartData = useStoreSelector(
    useAnalyticsStore,
    (state) => state.revenueChart,
    []
  );

  const selectedPeriod = useStoreSelector(
    useAnalyticsStore,
    (state) => state.selectedPeriod,
    []
  );

  const dateRange = useStoreSelector(
    useAnalyticsStore,
    (state) => state.dateRange,
    []
  );

  const loading = useStoreSelector(
    useAnalyticsStore,
    (state) => state.loading,
    []
  );

  // Calculate summary statistics
  const summary = useMemo(() => {
    if (!chartData.length) return null;

    const totalRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0);
    const totalOrders = chartData.reduce((sum, item) => sum + item.orders, 0);
    const averageDaily = totalRevenue / chartData.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      totalRevenue,
      totalOrders,
      averageDaily,
      averageOrderValue,
      dataPoints: chartData.length,
    };
  }, [chartData]);

  const actions = useMemo(() => ({
    fetch: (forceRefresh = false) => 
      useAnalyticsStore.getState().fetchRevenueChart(days, forceRefresh),
    setPeriod: useAnalyticsStore.getState().setSelectedPeriod,
    setDateRange: useAnalyticsStore.getState().setDateRange,
  }), [days]);

  return {
    data: chartData,
    summary,
    selectedPeriod,
    dateRange,
    loading,
    actions,
  };
}

// Hook for auto-refresh management
export function useAutoRefresh() {
  const autoRefresh = useStoreSelector(
    useAnalyticsStore,
    (state) => state.autoRefresh,
    []
  );

  const refreshInterval = useStoreSelector(
    useAnalyticsStore,
    (state) => state.refreshInterval,
    []
  );

  const lastUpdated = useStoreSelector(
    useAnalyticsStore,
    (state) => state.lastUpdated,
    []
  );

  const actions = useMemo(() => ({
    toggle: () => useAnalyticsStore.getState().setAutoRefresh(!autoRefresh),
    enable: () => useAnalyticsStore.getState().setAutoRefresh(true),
    disable: () => useAnalyticsStore.getState().setAutoRefresh(false),
    setInterval: useAnalyticsStore.getState().setRefreshInterval,
    refreshNow: useAnalyticsStore.getState().refreshData,
  }), [autoRefresh]);

  return {
    enabled: autoRefresh,
    interval: refreshInterval,
    lastUpdated,
    actions,
  };
}

// Hook for error handling with retry logic
export function useStoreErrorHandler() {
  const error = useStoreSelector(
    useAnalyticsStore,
    (state) => state.error,
    []
  );

  const retryCountRef = useRef(0);
  const maxRetries = 3;

  const retry = useCallback(async () => {
    if (retryCountRef.current >= maxRetries) {
      console.warn('Max retries reached for store error recovery');
      return false;
    }

    retryCountRef.current += 1;
    
    try {
      await useAnalyticsStore.getState().refreshData();
      retryCountRef.current = 0; // Reset on success
      return true;
    } catch (err) {
      console.error(`Retry ${retryCountRef.current} failed:`, err);
      return false;
    }
  }, [maxRetries]);

  const clearError = useCallback(() => {
    useAnalyticsStore.getState().clearError();
    retryCountRef.current = 0;
  }, []);

  return {
    error,
    canRetry: retryCountRef.current < maxRetries,
    retryCount: retryCountRef.current,
    retry,
    clearError,
  };
}

// Hook for store synchronization status
export function useStoreSyncStatus() {
  const [syncStatus, setSyncStatus] = useState({
    connected: true,
    lastSync: null as Date | null,
    syncErrors: 0,
  });

  useEffect(() => {
    const channel = new BroadcastChannel('analytics-sync');
    
    const handleSync = () => {
      setSyncStatus(prev => ({
        ...prev,
        connected: true,
        lastSync: new Date(),
      }));
    };

    const handleSyncError = () => {
      setSyncStatus(prev => ({
        ...prev,
        syncErrors: prev.syncErrors + 1,
      }));
    };

    // Listen for sync events
    channel.addEventListener('message', handleSync);
    
    // Check connectivity periodically
    const connectivityCheck = setInterval(() => {
      setSyncStatus(prev => ({
        ...prev,
        connected: navigator.onLine,
      }));
    }, 30000);

    return () => {
      channel.close();
      clearInterval(connectivityCheck);
    };
  }, []);

  return syncStatus;
}

// Hook for optimistic updates with rollback
export function useOptimisticUpdates() {
  const [pendingUpdates, setPendingUpdates] = useState<Array<{
    id: string;
    type: string;
    timestamp: Date;
  }>>([]);

  const addOptimisticUpdate = useCallback((type: string, id: string) => {
    setPendingUpdates(prev => [...prev, {
      id,
      type,
      timestamp: new Date(),
    }]);
  }, []);

  const removeOptimisticUpdate = useCallback((id: string) => {
    setPendingUpdates(prev => prev.filter(update => update.id !== id));
  }, []);

  const clearAllUpdates = useCallback(() => {
    setPendingUpdates([]);
  }, []);

  return {
    pendingUpdates,
    hasPendingUpdates: pendingUpdates.length > 0,
    addOptimisticUpdate,
    removeOptimisticUpdate,
    clearAllUpdates,
  };
}

// Hook for store performance monitoring
export function useStorePerformance() {
  const [performance, setPerformance] = useState({
    subscriptionCount: 0,
    renderCount: 0,
    lastRenderTime: 0,
  });

  const renderCountRef = useRef(0);

  useEffect(() => {
    renderCountRef.current += 1;
    const renderStart = performance.now();
    
    setPerformance(prev => ({
      ...prev,
      renderCount: renderCountRef.current,
      lastRenderTime: performance.now() - renderStart,
    }));

    // Get subscription stats
    const stats = subscriptionManager.getStats();
    setPerformance(prev => ({
      ...prev,
      subscriptionCount: stats.totalSubscriptions,
    }));
  });

  return performance;
}

// Composite hook for complete dashboard data
export function useDashboard() {
  const analytics = useAnalytics();
  const kpis = useDashboardKPIs();
  const topProducts = useTopProducts(5);
  const lowStock = useLowStockProducts(5);
  const revenueChart = useRevenueChart(7);
  const autoRefresh = useAutoRefresh();
  const errorHandler = useStoreErrorHandler();
  const syncStatus = useStoreSyncStatus();

  // Aggregate loading state
  const isLoading = analytics.loading;
  
  // Aggregate error state
  const hasErrors = Boolean(analytics.error || kpis.error || errorHandler.error);

  // Data freshness
  const isDataFresh = useMemo(() => {
    if (!analytics.lastUpdated) return false;
    const now = new Date();
    const age = now.getTime() - analytics.lastUpdated.getTime();
    return age < 5 * 60 * 1000; // 5 minutes
  }, [analytics.lastUpdated]);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    try {
      await analytics.actions.refreshData();
    } catch (error) {
      console.error('Failed to refresh dashboard data:', error);
    }
  }, [analytics.actions]);

  return {
    // Data
    kpis: kpis.data,
    topProducts: topProducts.data,
    lowStockProducts: lowStock.data,
    revenueChart: revenueChart.data,
    
    // State
    loading: isLoading,
    error: analytics.error,
    hasErrors,
    isDataFresh,
    lastUpdated: analytics.lastUpdated,
    
    // Configuration
    selectedPeriod: analytics.selectedPeriod,
    dateRange: analytics.dateRange,
    autoRefreshEnabled: autoRefresh.enabled,
    
    // Actions
    actions: {
      ...analytics.actions,
      refreshAll,
      retry: errorHandler.retry,
      clearError: errorHandler.clearError,
      toggleAutoRefresh: autoRefresh.actions.toggle,
    },
    
    // Utils
    utils: analytics.utils,
    
    // Status
    syncStatus,
    errorHandler,
    autoRefresh,
    
    // Alerts
    lowStockAlert: lowStock.alertLevel,
  };
}

export default {
  useAnalytics,
  useDashboardKPIs,
  useTopProducts,
  useLowStockProducts,
  useRevenueChart,
  useAutoRefresh,
  useStoreErrorHandler,
  useStoreSyncStatus,
  useOptimisticUpdates,
  useStorePerformance,
  useDashboard,
};