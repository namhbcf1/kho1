// Enhanced Analytics Store with comprehensive state management
import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  AnalyticsStore,
  AnalyticsState,
  AnalyticsActions,
  DashboardKPIs,
  TopProduct,
  LowStockProduct,
  RevenueDataPoint,
  SalesDistribution,
  StoreError,
  STORE_VERSIONS,
  CACHE_KEYS,
  SYNC_CHANNELS,
  isValidDashboardKPIs,
  isValidTopProduct,
  isValidRevenueDataPoint,
} from './types';
import {
  enhancedPersist,
  syncMiddleware,
  errorHandlingMiddleware,
  optimisticUpdatesMiddleware,
  cleanupMiddleware,
} from './middleware';
import { analyticsService } from '../services/api/analyticsService';

// Initial state with proper defaults
const initialState: AnalyticsState = {
  // Data
  dashboardKPIs: null,
  topProducts: [],
  lowStockProducts: [],
  revenueChart: [],
  salesChart: [],
  
  // Configuration
  selectedPeriod: 'today',
  dateRange: null,
  autoRefresh: true,
  refreshInterval: 30000, // 30 seconds
  
  // Base store properties
  loading: false,
  error: null,
  lastUpdated: null,
  version: STORE_VERSIONS.ANALYTICS,
};

// Race condition prevention
const requestIds = new Map<string, string>();
const pendingRequests = new Set<string>();

// Enhanced Analytics Store with all improvements
export const useAnalyticsStore = create<AnalyticsStore>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer(
          cleanupMiddleware(
            errorHandlingMiddleware(
              optimisticUpdatesMiddleware(
                syncMiddleware(
                  (set, get, api) => ({
                    ...initialState,

                    // Enhanced setters with validation and optimistic updates
                    setDashboardKPIs: async (kpis: DashboardKPIs, optimistic = false) => {
                      if (!isValidDashboardKPIs(kpis)) {
                        const error = 'Invalid dashboard KPIs data format';
                        set((state) => {
                          state.error = error;
                        });
                        throw new Error(error);
                      }

                      if (optimistic) {
                        return (api as any).optimisticUpdate(
                          'dashboardKPIs',
                          kpis,
                          () => get().fetchKPIs(true)
                        );
                      }

                      set((state) => {
                        state.dashboardKPIs = kpis;
                        state.lastUpdated = new Date();
                        state.error = null;
                      });
                    },

                    setTopProducts: async (products: TopProduct[], optimistic = false) => {
                      const validProducts = products.filter(isValidTopProduct);
                      
                      if (validProducts.length !== products.length) {
                        console.warn('Some top products have invalid format and were filtered out');
                      }

                      if (optimistic) {
                        return (api as any).optimisticUpdate(
                          'topProducts',
                          validProducts,
                          () => get().fetchTopProducts(validProducts.length, true)
                        );
                      }

                      set((state) => {
                        state.topProducts = validProducts;
                        state.lastUpdated = new Date();
                        state.error = null;
                      });
                    },

                    setLowStockProducts: async (products: LowStockProduct[], optimistic = false) => {
                      if (optimistic) {
                        return (api as any).optimisticUpdate(
                          'lowStockProducts',
                          products,
                          () => get().fetchLowStockProducts(products.length, true)
                        );
                      }

                      set((state) => {
                        state.lowStockProducts = products;
                        state.lastUpdated = new Date();
                        state.error = null;
                      });
                    },

                    setRevenueChart: async (data: RevenueDataPoint[], optimistic = false) => {
                      const validData = data.filter(isValidRevenueDataPoint);
                      
                      if (validData.length !== data.length) {
                        console.warn('Some revenue data points have invalid format and were filtered out');
                      }

                      if (optimistic) {
                        return (api as any).optimisticUpdate(
                          'revenueChart',
                          validData,
                          () => get().fetchRevenueChart(7, true)
                        );
                      }

                      set((state) => {
                        state.revenueChart = validData;
                        state.lastUpdated = new Date();
                        state.error = null;
                      });
                    },

                    setSalesChart: async (data: SalesDistribution[], optimistic = false) => {
                      if (optimistic) {
                        return (api as any).optimisticUpdate(
                          'salesChart',
                          data,
                          () => get().fetchSalesChart(true)
                        );
                      }

                      set((state) => {
                        state.salesChart = data;
                        state.lastUpdated = new Date();
                        state.error = null;
                      });
                    },

                    // Configuration setters
                    setSelectedPeriod: (period) => {
                      set((state) => {
                        state.selectedPeriod = period;
                        // Auto-fetch data for new period
                        setTimeout(() => get().fetchDashboardData(true), 0);
                      });
                    },

                    setDateRange: (range) => {
                      set((state) => {
                        state.dateRange = range;
                        if (range) {
                          state.selectedPeriod = 'custom';
                        }
                        // Auto-fetch data for new range
                        setTimeout(() => get().fetchDashboardData(true), 0);
                      });
                    },

                    setAutoRefresh: (enabled) => {
                      set((state) => {
                        state.autoRefresh = enabled;
                      });
                      
                      if (enabled) {
                        get().startAutoRefresh();
                      } else {
                        get().stopAutoRefresh();
                      }
                    },

                    setRefreshInterval: (interval) => {
                      set((state) => {
                        state.refreshInterval = Math.max(interval, 10000); // Minimum 10 seconds
                      });
                      
                      if (get().autoRefresh) {
                        get().stopAutoRefresh();
                        get().startAutoRefresh();
                      }
                    },

                    // Base store methods
                    setLoading: (loading) => {
                      set((state) => {
                        state.loading = loading;
                      });
                    },

                    setError: (error) => {
                      set((state) => {
                        state.error = error;
                        state.loading = false;
                      });
                    },

                    clearError: () => {
                      set((state) => {
                        state.error = null;
                      });
                    },

                    updateLastUpdated: () => {
                      set((state) => {
                        state.lastUpdated = new Date();
                      });
                    },

                    optimisticUpdate: async (key, value, rollback) => {
                      (api as any).optimisticUpdate(key, value, rollback);
                    },

                    // Data fetching methods with race condition prevention
                    fetchDashboardData: async (force = false) => {
                      const requestId = generateRequestId('dashboard');
                      
                      if (!force && pendingRequests.has('dashboard')) {
                        return; // Prevent duplicate requests
                      }

                      pendingRequests.add('dashboard');
                      requestIds.set('dashboard', requestId);

                      try {
                        set((state) => {
                          state.loading = true;
                          state.error = null;
                        });

                        const [kpis, topProducts, lowStock, revenueChart, salesChart] = await Promise.all([
                          analyticsService.getDashboardKPIs(),
                          analyticsService.getTopProducts(5),
                          analyticsService.getLowStockProducts(5),
                          analyticsService.getRevenueChart(7),
                          analyticsService.getSalesChart(),
                        ]);

                        // Check if this request is still current
                        if (requestIds.get('dashboard') !== requestId) {
                          return; // Request was superseded
                        }

                        set((state) => {
                          state.dashboardKPIs = kpis;
                          state.topProducts = topProducts.filter(isValidTopProduct);
                          state.lowStockProducts = lowStock;
                          state.revenueChart = revenueChart.filter(isValidRevenueDataPoint);
                          state.salesChart = salesChart;
                          state.loading = false;
                          state.lastUpdated = new Date();
                          state.error = null;
                        });

                      } catch (error) {
                        if (requestIds.get('dashboard') === requestId) {
                          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch dashboard data';
                          set((state) => {
                            state.loading = false;
                            state.error = errorMessage;
                          });
                        }
                      } finally {
                        pendingRequests.delete('dashboard');
                        requestIds.delete('dashboard');
                      }
                    },

                    fetchKPIs: async (force = false) => {
                      const requestId = generateRequestId('kpis');
                      
                      if (!force && pendingRequests.has('kpis')) {
                        return;
                      }

                      pendingRequests.add('kpis');
                      requestIds.set('kpis', requestId);

                      try {
                        const kpis = await analyticsService.getDashboardKPIs();
                        
                        if (requestIds.get('kpis') === requestId) {
                          await get().setDashboardKPIs(kpis);
                        }
                      } catch (error) {
                        if (requestIds.get('kpis') === requestId) {
                          get().setError(error instanceof Error ? error.message : 'Failed to fetch KPIs');
                        }
                      } finally {
                        pendingRequests.delete('kpis');
                        requestIds.delete('kpis');
                      }
                    },

                    fetchTopProducts: async (limit = 5, force = false) => {
                      const requestId = generateRequestId('topProducts');
                      
                      if (!force && pendingRequests.has('topProducts')) {
                        return;
                      }

                      pendingRequests.add('topProducts');
                      requestIds.set('topProducts', requestId);

                      try {
                        const products = await analyticsService.getTopProducts(limit);
                        
                        if (requestIds.get('topProducts') === requestId) {
                          await get().setTopProducts(products);
                        }
                      } catch (error) {
                        if (requestIds.get('topProducts') === requestId) {
                          get().setError(error instanceof Error ? error.message : 'Failed to fetch top products');
                        }
                      } finally {
                        pendingRequests.delete('topProducts');
                        requestIds.delete('topProducts');
                      }
                    },

                    fetchLowStockProducts: async (limit = 5, force = false) => {
                      const requestId = generateRequestId('lowStock');
                      
                      if (!force && pendingRequests.has('lowStock')) {
                        return;
                      }

                      pendingRequests.add('lowStock');
                      requestIds.set('lowStock', requestId);

                      try {
                        const products = await analyticsService.getLowStockProducts(limit);
                        
                        if (requestIds.get('lowStock') === requestId) {
                          await get().setLowStockProducts(products);
                        }
                      } catch (error) {
                        if (requestIds.get('lowStock') === requestId) {
                          get().setError(error instanceof Error ? error.message : 'Failed to fetch low stock products');
                        }
                      } finally {
                        pendingRequests.delete('lowStock');
                        requestIds.delete('lowStock');
                      }
                    },

                    fetchRevenueChart: async (days = 7, force = false) => {
                      const requestId = generateRequestId('revenueChart');
                      
                      if (!force && pendingRequests.has('revenueChart')) {
                        return;
                      }

                      pendingRequests.add('revenueChart');
                      requestIds.set('revenueChart', requestId);

                      try {
                        const data = await analyticsService.getRevenueChart(days);
                        
                        if (requestIds.get('revenueChart') === requestId) {
                          await get().setRevenueChart(data);
                        }
                      } catch (error) {
                        if (requestIds.get('revenueChart') === requestId) {
                          get().setError(error instanceof Error ? error.message : 'Failed to fetch revenue chart');
                        }
                      } finally {
                        pendingRequests.delete('revenueChart');
                        requestIds.delete('revenueChart');
                      }
                    },

                    fetchSalesChart: async (force = false) => {
                      const requestId = generateRequestId('salesChart');
                      
                      if (!force && pendingRequests.has('salesChart')) {
                        return;
                      }

                      pendingRequests.add('salesChart');
                      requestIds.set('salesChart', requestId);

                      try {
                        const data = await analyticsService.getSalesChart();
                        
                        if (requestIds.get('salesChart') === requestId) {
                          await get().setSalesChart(data);
                        }
                      } catch (error) {
                        if (requestIds.get('salesChart') === requestId) {
                          get().setError(error instanceof Error ? error.message : 'Failed to fetch sales chart');
                        }
                      } finally {
                        pendingRequests.delete('salesChart');
                        requestIds.delete('salesChart');
                      }
                    },

                    // Utility functions
                    calculateGrowth: (current, previous) => {
                      if (previous === 0) return current > 0 ? 100 : 0;
                      return Number(((current - previous) / previous * 100).toFixed(2));
                    },

                    formatCurrency: (amount) => {
                      return new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(amount);
                    },

                    getTotalRevenue: () => {
                      return get().revenueChart.reduce((total, item) => total + item.revenue, 0);
                    },

                    getTotalOrders: () => {
                      return get().revenueChart.reduce((total, item) => total + item.orders, 0);
                    },

                    getAverageOrderValue: () => {
                      const totalRevenue = get().getTotalRevenue();
                      const totalOrders = get().getTotalOrders();
                      return totalOrders > 0 ? totalRevenue / totalOrders : 0;
                    },

                    // Cache management
                    invalidateCache: (keys = []) => {
                      if (keys.length === 0) {
                        // Invalidate all
                        get().fetchDashboardData(true);
                      } else {
                        keys.forEach(key => {
                          switch (key) {
                            case CACHE_KEYS.DASHBOARD_KPIS:
                              get().fetchKPIs(true);
                              break;
                            case CACHE_KEYS.TOP_PRODUCTS:
                              get().fetchTopProducts(5, true);
                              break;
                            case CACHE_KEYS.LOW_STOCK:
                              get().fetchLowStockProducts(5, true);
                              break;
                            case CACHE_KEYS.REVENUE_CHART:
                              get().fetchRevenueChart(7, true);
                              break;
                            case CACHE_KEYS.SALES_CHART:
                              get().fetchSalesChart(true);
                              break;
                          }
                        });
                      }
                    },

                    refreshData: async () => {
                      await get().fetchDashboardData(true);
                    },

                    // Auto-refresh management
                    startAutoRefresh: () => {
                      const interval = setInterval(() => {
                        if (get().autoRefresh) {
                          get().fetchDashboardData();
                        }
                      }, get().refreshInterval);
                      
                      (api as any).addInterval(interval);
                    },

                    stopAutoRefresh: () => {
                      // Intervals are automatically cleaned up by cleanup middleware
                    },

                    reset: () => {
                      set(initialState);
                    },
                  }),
                  {
                    channel: SYNC_CHANNELS.ANALYTICS,
                    enabled: true,
                    debounceMs: 300,
                    syncKeys: ['dashboardKPIs', 'topProducts', 'lowStockProducts', 'revenueChart', 'salesChart'],
                    onSyncReceived: (message) => {
                      console.log('Analytics sync received:', message);
                    },
                    onSyncError: (error) => {
                      console.error('Analytics sync error:', error);
                    },
                  }
                ),
                {
                  enabled: true,
                  timeout: 10000, // 10 seconds
                  onRollback: (update) => {
                    console.warn('Analytics optimistic update rolled back:', update);
                  },
                }
              ),
              {
                enabled: true,
                maxRetries: 3,
                retryDelay: 1000,
                onError: (error) => {
                  console.error('Analytics store error:', error);
                },
                onRecovery: () => {
                  console.log('Analytics store recovered from error');
                },
              }
            )
          )
        )
      ),
      {
        name: 'analytics-store',
        version: STORE_VERSIONS.ANALYTICS,
        partialize: (state) => ({
          // Only persist essential data, not loading states
          dashboardKPIs: state.dashboardKPIs,
          topProducts: state.topProducts,
          lowStockProducts: state.lowStockProducts,
          revenueChart: state.revenueChart,
          salesChart: state.salesChart,
          selectedPeriod: state.selectedPeriod,
          dateRange: state.dateRange,
          autoRefresh: state.autoRefresh,
          refreshInterval: state.refreshInterval,
          lastUpdated: state.lastUpdated,
        }),
        migrate: (persistedState: any, version: number) => {
          // Handle store migrations
          if (version < STORE_VERSIONS.ANALYTICS) {
            console.log(`Migrating analytics store from version ${version} to ${STORE_VERSIONS.ANALYTICS}`);
            return {
              ...initialState,
              ...persistedState,
              version: STORE_VERSIONS.ANALYTICS,
            };
          }
          return persistedState;
        },
        onRehydrateStorage: () => {
          console.log('Analytics store hydration started');
          return (state, error) => {
            if (error) {
              console.error('Analytics store hydration failed:', error);
            } else {
              console.log('Analytics store hydration completed');
              // Start auto-refresh if enabled
              if (state?.autoRefresh) {
                state.startAutoRefresh();
              }
            }
          };
        },
      }
    ),
    { name: 'AnalyticsStore' }
  )
);

// Helper function to generate unique request IDs
function generateRequestId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Selector hooks for optimized re-renders
export const useAnalyticsData = () => useAnalyticsStore((state) => ({
  dashboardKPIs: state.dashboardKPIs,
  topProducts: state.topProducts,
  lowStockProducts: state.lowStockProducts,
  revenueChart: state.revenueChart,
  salesChart: state.salesChart,
}));

export const useAnalyticsState = () => useAnalyticsStore((state) => ({
  loading: state.loading,
  error: state.error,
  lastUpdated: state.lastUpdated,
}));

export const useAnalyticsConfig = () => useAnalyticsStore((state) => ({
  selectedPeriod: state.selectedPeriod,
  dateRange: state.dateRange,
  autoRefresh: state.autoRefresh,
  refreshInterval: state.refreshInterval,
}));

export const useAnalyticsActions = () => useAnalyticsStore((state) => ({
  setDashboardKPIs: state.setDashboardKPIs,
  setTopProducts: state.setTopProducts,
  setLowStockProducts: state.setLowStockProducts,
  setRevenueChart: state.setRevenueChart,
  setSalesChart: state.setSalesChart,
  setSelectedPeriod: state.setSelectedPeriod,
  setDateRange: state.setDateRange,
  setAutoRefresh: state.setAutoRefresh,
  setRefreshInterval: state.setRefreshInterval,
  fetchDashboardData: state.fetchDashboardData,
  fetchKPIs: state.fetchKPIs,
  fetchTopProducts: state.fetchTopProducts,
  fetchLowStockProducts: state.fetchLowStockProducts,
  fetchRevenueChart: state.fetchRevenueChart,
  fetchSalesChart: state.fetchSalesChart,
  invalidateCache: state.invalidateCache,
  refreshData: state.refreshData,
  reset: state.reset,
  clearError: state.clearError,
}));

export const useAnalyticsUtils = () => useAnalyticsStore((state) => ({
  calculateGrowth: state.calculateGrowth,
  formatCurrency: state.formatCurrency,
  getTotalRevenue: state.getTotalRevenue,
  getTotalOrders: state.getTotalOrders,
  getAverageOrderValue: state.getAverageOrderValue,
}));

export default useAnalyticsStore;