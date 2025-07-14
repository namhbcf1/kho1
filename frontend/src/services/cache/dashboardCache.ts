// Dashboard data caching service for performance optimization
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of cache entries
}

class DashboardCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly defaultTTL = 30 * 1000; // 30 seconds
  private readonly maxSize = 100;
  private readonly cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const ttl = options.ttl || this.defaultTTL;
    const maxSize = options.maxSize || this.maxSize;
    
    // Remove oldest entries if cache is full
    if (this.cache.size >= maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired entries
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let expired = 0;
    let active = 0;

    for (const entry of this.cache.values()) {
      if (now - entry.timestamp > entry.ttl) {
        expired++;
      } else {
        active++;
      }
    }

    return {
      total: this.cache.size,
      active,
      expired,
      hitRate: this.hitCount / (this.hitCount + this.missCount) || 0,
    };
  }

  private hitCount = 0;
  private missCount = 0;

  // Enhanced get method with hit/miss tracking
  getWithStats<T>(key: string): T | null {
    const result = this.get<T>(key);
    if (result !== null) {
      this.hitCount++;
    } else {
      this.missCount++;
    }
    return result;
  }

  // Destroy cache and cleanup
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}

// Create singleton instance
export const dashboardCache = new DashboardCache();

// Cache key generators
export const cacheKeys = {
  dashboardKPIs: () => 'dashboard:kpis',
  topProducts: (limit: number) => `dashboard:top-products:${limit}`,
  lowStockProducts: (limit: number) => `dashboard:low-stock:${limit}`,
  revenueChart: (days: number) => `dashboard:revenue-chart:${days}`,
  salesChart: () => 'dashboard:sales-chart',
  analytics: (period: string) => `analytics:${period}`,
  productSearch: (query: string, page: number, limit: number) => 
    `products:search:${query}:${page}:${limit}`,
  productDetail: (id: number) => `product:${id}`,
  categories: () => 'categories:all',
};

// Cache TTL configurations (in milliseconds)
export const cacheTTL = {
  dashboardKPIs: 30 * 1000,      // 30 seconds
  topProducts: 2 * 60 * 1000,    // 2 minutes
  lowStockProducts: 5 * 60 * 1000, // 5 minutes
  revenueChart: 5 * 60 * 1000,   // 5 minutes
  salesChart: 2 * 60 * 1000,     // 2 minutes
  analytics: 10 * 60 * 1000,     // 10 minutes
  productSearch: 1 * 60 * 1000,  // 1 minute
  productDetail: 5 * 60 * 1000,  // 5 minutes
  categories: 30 * 60 * 1000,    // 30 minutes
};

// Enhanced analytics service with caching
export class CachedAnalyticsService {
  async getDashboardKPIs() {
    const cacheKey = cacheKeys.dashboardKPIs();
    
    // Try to get from cache first
    let cached = dashboardCache.getWithStats(cacheKey);
    if (cached) {
      return cached;
    }

    // If not in cache, fetch from API
    try {
      const response = await fetch('/api/v1/analytics/dashboard');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      // Cache the result
      dashboardCache.set(cacheKey, data, { ttl: cacheTTL.dashboardKPIs });
      
      return data;
    } catch (error) {
      console.error('Failed to fetch dashboard KPIs:', error);
      throw error;
    }
  }

  async getTopProducts(limit: number = 5) {
    const cacheKey = cacheKeys.topProducts(limit);
    
    let cached = dashboardCache.getWithStats(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`/api/v1/analytics/top-products?limit=${limit}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      dashboardCache.set(cacheKey, data, { ttl: cacheTTL.topProducts });
      
      return data;
    } catch (error) {
      console.error('Failed to fetch top products:', error);
      throw error;
    }
  }

  async getLowStockProducts(limit: number = 5) {
    const cacheKey = cacheKeys.lowStockProducts(limit);
    
    let cached = dashboardCache.getWithStats(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`/api/v1/analytics/low-stock?limit=${limit}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      dashboardCache.set(cacheKey, data, { ttl: cacheTTL.lowStockProducts });
      
      return data;
    } catch (error) {
      console.error('Failed to fetch low stock products:', error);
      throw error;
    }
  }

  async getRevenueChart(days: number = 7) {
    const cacheKey = cacheKeys.revenueChart(days);
    
    let cached = dashboardCache.getWithStats(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`/api/v1/analytics/revenue-chart?days=${days}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      dashboardCache.set(cacheKey, data, { ttl: cacheTTL.revenueChart });
      
      return data;
    } catch (error) {
      console.error('Failed to fetch revenue chart:', error);
      throw error;
    }
  }

  // Invalidate cache entries
  invalidateCache(pattern?: string) {
    if (pattern) {
      // Remove entries matching pattern
      for (const key of dashboardCache['cache'].keys()) {
        if (key.includes(pattern)) {
          dashboardCache.delete(key);
        }
      }
    } else {
      // Clear all cache
      dashboardCache.clear();
    }
  }

  // Pre-warm cache with common data
  async preWarmCache() {
    try {
      await Promise.allSettled([
        this.getDashboardKPIs(),
        this.getTopProducts(5),
        this.getLowStockProducts(5),
        this.getRevenueChart(7),
      ]);
    } catch (error) {
      console.warn('Failed to pre-warm cache:', error);
    }
  }
}

// Export singleton instance
export const cachedAnalyticsService = new CachedAnalyticsService();

export default dashboardCache;