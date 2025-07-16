/**
 * Advanced PWA Cache Manager
 * Fixes: Service worker cache corruption, stale data serving
 * Implements: Smart cache strategies, real-time invalidation, conflict resolution
 */

export interface CacheStrategy {
  name: string;
  pattern: string | RegExp;
  strategy: 'cache-first' | 'network-first' | 'network-only' | 'stale-while-revalidate';
  maxAge: number; // seconds
  maxEntries?: number;
  updateInterval?: number; // seconds for background updates
  criticalData: boolean;
}

export interface CacheEntry {
  url: string;
  data: any;
  timestamp: number;
  version: string;
  checksum: string;
  strategy: string;
  expires: number;
}

export interface CacheValidation {
  isValid: boolean;
  isStale: boolean;
  needsUpdate: boolean;
  conflicts: string[];
}

/**
 * Critical Data Cache Manager with Conflict Resolution
 */
export class AdvancedCacheManager {
  private cacheName = 'kho-pos-advanced-cache-v1';
  private strategies: CacheStrategy[] = [
    // Critical real-time data - NEVER cache
    {
      name: 'real-time-prices',
      pattern: /\/api\/v1\/products\/\d+\/price/,
      strategy: 'network-only',
      maxAge: 0,
      criticalData: true
    },
    {
      name: 'inventory-levels',
      pattern: /\/api\/v1\/inventory\/check/,
      strategy: 'network-only',
      maxAge: 0,
      criticalData: true
    },
    {
      name: 'payment-processing',
      pattern: /\/api\/v1\/payments\//,
      strategy: 'network-only',
      maxAge: 0,
      criticalData: true
    },
    
    // Semi-critical data - Short cache with validation
    {
      name: 'product-catalog',
      pattern: /\/api\/v1\/products(?!\/.+\/price)/,
      strategy: 'stale-while-revalidate',
      maxAge: 300, // 5 minutes
      maxEntries: 500,
      updateInterval: 60, // Update every minute
      criticalData: false
    },
    {
      name: 'customer-data',
      pattern: /\/api\/v1\/customers/,
      strategy: 'stale-while-revalidate',
      maxAge: 600, // 10 minutes
      maxEntries: 200,
      criticalData: false
    },
    
    // Static resources - Long cache
    {
      name: 'static-assets',
      pattern: /\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$/,
      strategy: 'cache-first',
      maxAge: 86400, // 24 hours
      maxEntries: 100,
      criticalData: false
    },
    
    // API metadata - Medium cache
    {
      name: 'api-metadata',
      pattern: /\/api\/v1\/(config|settings|business-info)/,
      strategy: 'stale-while-revalidate',
      maxAge: 1800, // 30 minutes
      criticalData: false
    }
  ];

  private conflictResolver = new CacheConflictResolver();
  private validationQueue = new Map<string, Promise<CacheValidation>>();

  /**
   * Handle fetch requests with advanced caching
   */
  async handleRequest(request: Request): Promise<Response> {
    const strategy = this.getStrategy(request.url);
    
    // Always bypass cache for critical data
    if (strategy.criticalData) {
      return this.fetchFromNetwork(request);
    }

    switch (strategy.strategy) {
      case 'cache-first':
        return this.cacheFirst(request, strategy);
      case 'network-first':
        return this.networkFirst(request, strategy);
      case 'stale-while-revalidate':
        return this.staleWhileRevalidate(request, strategy);
      case 'network-only':
      default:
        return this.fetchFromNetwork(request);
    }
  }

  /**
   * Cache-first strategy with validation
   */
  private async cacheFirst(request: Request, strategy: CacheStrategy): Promise<Response> {
    const cache = await caches.open(this.cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      const validation = await this.validateCacheEntry(request, cachedResponse);
      
      if (validation.isValid && !validation.needsUpdate) {
        return cachedResponse;
      }
      
      if (validation.conflicts.length > 0) {
        // Resolve conflicts and invalidate cache
        await this.resolveConflicts(request, validation.conflicts);
        await cache.delete(request);
      }
    }

    // Fetch from network and cache
    try {
      const networkResponse = await this.fetchFromNetwork(request);
      await this.cacheResponse(request, networkResponse.clone(), strategy);
      return networkResponse;
    } catch (error) {
      // Return stale cache if network fails
      if (cachedResponse) {
        return cachedResponse;
      }
      throw error;
    }
  }

  /**
   * Network-first strategy with cache fallback
   */
  private async networkFirst(request: Request, strategy: CacheStrategy): Promise<Response> {
    try {
      const networkResponse = await this.fetchFromNetwork(request);
      await this.cacheResponse(request, networkResponse.clone(), strategy);
      return networkResponse;
    } catch (error) {
      // Fallback to cache
      const cache = await caches.open(this.cacheName);
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        const validation = await this.validateCacheEntry(request, cachedResponse);
        if (!validation.conflicts.length) {
          return cachedResponse;
        }
      }
      
      throw error;
    }
  }

  /**
   * Stale-while-revalidate with background updates
   */
  private async staleWhileRevalidate(request: Request, strategy: CacheStrategy): Promise<Response> {
    const cache = await caches.open(this.cacheName);
    const cachedResponse = await cache.match(request);

    // Return cached response immediately if available
    if (cachedResponse) {
      const validation = await this.validateCacheEntry(request, cachedResponse);
      
      if (validation.conflicts.length === 0) {
        // Background revalidation
        this.backgroundUpdate(request, strategy);
        return cachedResponse;
      } else {
        // Conflicts detected - fetch fresh data
        await this.resolveConflicts(request, validation.conflicts);
        await cache.delete(request);
      }
    }

    // No cache or conflicts - fetch from network
    const networkResponse = await this.fetchFromNetwork(request);
    await this.cacheResponse(request, networkResponse.clone(), strategy);
    return networkResponse;
  }

  /**
   * Background cache update
   */
  private async backgroundUpdate(request: Request, strategy: CacheStrategy): Promise<void> {
    try {
      const networkResponse = await this.fetchFromNetwork(request);
      await this.cacheResponse(request, networkResponse.clone(), strategy);
    } catch (error) {
      console.warn('Background update failed:', error);
    }
  }

  /**
   * Validate cache entry against server
   */
  private async validateCacheEntry(request: Request, cachedResponse: Response): Promise<CacheValidation> {
    const url = request.url;
    
    // Check if validation is already in progress
    if (this.validationQueue.has(url)) {
      return await this.validationQueue.get(url)!;
    }

    const validationPromise = this.performValidation(request, cachedResponse);
    this.validationQueue.set(url, validationPromise);

    try {
      return await validationPromise;
    } finally {
      this.validationQueue.delete(url);
    }
  }

  /**
   * Perform actual cache validation
   */
  private async performValidation(request: Request, cachedResponse: Response): Promise<CacheValidation> {
    try {
      const cacheMetadata = await this.getCacheMetadata(request);
      const now = Date.now();
      
      const validation: CacheValidation = {
        isValid: true,
        isStale: false,
        needsUpdate: false,
        conflicts: []
      };

      // Check expiration
      if (cacheMetadata && now > cacheMetadata.expires) {
        validation.isStale = true;
        validation.needsUpdate = true;
      }

      // Check for version conflicts with server
      try {
        const headResponse = await fetch(request.url, { method: 'HEAD' });
        const serverVersion = headResponse.headers.get('X-Data-Version');
        const serverChecksum = headResponse.headers.get('X-Data-Checksum');
        
        if (cacheMetadata) {
          if (serverVersion && serverVersion !== cacheMetadata.version) {
            validation.conflicts.push('version_mismatch');
            validation.needsUpdate = true;
          }
          
          if (serverChecksum && serverChecksum !== cacheMetadata.checksum) {
            validation.conflicts.push('checksum_mismatch');
            validation.needsUpdate = true;
          }
        }
      } catch (error) {
        // Network error - assume cache is still valid
        console.warn('Cache validation network error:', error);
      }

      return validation;
    } catch (error) {
      console.error('Cache validation error:', error);
      return {
        isValid: false,
        isStale: true,
        needsUpdate: true,
        conflicts: ['validation_error']
      };
    }
  }

  /**
   * Cache response with metadata
   */
  private async cacheResponse(request: Request, response: Response, strategy: CacheStrategy): Promise<void> {
    if (!response.ok) {
      return; // Don't cache error responses
    }

    const cache = await caches.open(this.cacheName);
    const now = Date.now();
    
    // Add cache metadata headers
    const metadata = {
      timestamp: now,
      expires: now + (strategy.maxAge * 1000),
      version: response.headers.get('X-Data-Version') || Date.now().toString(),
      checksum: response.headers.get('X-Data-Checksum') || this.generateChecksum(await response.clone().text()),
      strategy: strategy.name
    };

    // Clone response and add metadata
    const responseToCache = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...Object.fromEntries(response.headers),
        'X-Cache-Metadata': JSON.stringify(metadata)
      }
    });

    await cache.put(request, responseToCache);
    
    // Enforce cache size limits
    if (strategy.maxEntries) {
      await this.enforceCacheLimit(strategy);
    }
  }

  /**
   * Resolve cache conflicts
   */
  private async resolveConflicts(request: Request, conflicts: string[]): Promise<void> {
    console.warn(`Cache conflicts detected for ${request.url}:`, conflicts);
    
    // Log conflict for analytics
    this.conflictResolver.logConflict(request.url, conflicts);
    
    // Invalidate related cache entries
    await this.invalidateRelatedEntries(request.url);
  }

  /**
   * Invalidate related cache entries
   */
  private async invalidateRelatedEntries(url: string): Promise<void> {
    const cache = await caches.open(this.cacheName);
    const requests = await cache.keys();
    
    // Find related URLs to invalidate
    const urlObj = new URL(url);
    const relatedPatterns = [
      urlObj.pathname,
      urlObj.pathname.split('/').slice(0, -1).join('/'), // Parent path
    ];

    for (const request of requests) {
      const requestUrl = new URL(request.url);
      
      if (relatedPatterns.some(pattern => requestUrl.pathname.startsWith(pattern))) {
        await cache.delete(request);
      }
    }
  }

  /**
   * Get cache metadata
   */
  private async getCacheMetadata(request: Request): Promise<any> {
    const cache = await caches.open(this.cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      const metadataHeader = cachedResponse.headers.get('X-Cache-Metadata');
      if (metadataHeader) {
        try {
          return JSON.parse(metadataHeader);
        } catch (error) {
          console.error('Failed to parse cache metadata:', error);
        }
      }
    }
    
    return null;
  }

  /**
   * Enforce cache size limits
   */
  private async enforceCacheLimit(strategy: CacheStrategy): Promise<void> {
    if (!strategy.maxEntries) return;

    const cache = await caches.open(this.cacheName);
    const requests = await cache.keys();
    
    // Filter requests matching this strategy
    const strategyRequests = requests.filter(request => 
      this.getStrategy(request.url).name === strategy.name
    );

    if (strategyRequests.length > strategy.maxEntries) {
      // Sort by timestamp and remove oldest
      const requestsWithMetadata = await Promise.all(
        strategyRequests.map(async request => {
          const metadata = await this.getCacheMetadata(request);
          return { request, timestamp: metadata?.timestamp || 0 };
        })
      );

      requestsWithMetadata
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(0, requestsWithMetadata.length - strategy.maxEntries)
        .forEach(({ request }) => cache.delete(request));
    }
  }

  /**
   * Get caching strategy for URL
   */
  private getStrategy(url: string): CacheStrategy {
    return this.strategies.find(strategy => {
      if (typeof strategy.pattern === 'string') {
        return url.includes(strategy.pattern);
      } else {
        return strategy.pattern.test(url);
      }
    }) || this.strategies[this.strategies.length - 1]; // Default to last strategy
  }

  /**
   * Fetch from network with error handling
   */
  private async fetchFromNetwork(request: Request): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(request, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Generate checksum for content
   */
  private generateChecksum(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Clear all caches
   */
  async clearAll(): Promise<void> {
    const cache = await caches.open(this.cacheName);
    const requests = await cache.keys();
    await Promise.all(requests.map(request => cache.delete(request)));
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalEntries: number;
    strategiesUsed: Record<string, number>;
    cacheSize: number;
    conflicts: number;
  }> {
    const cache = await caches.open(this.cacheName);
    const requests = await cache.keys();
    
    const strategiesUsed: Record<string, number> = {};
    let totalSize = 0;
    
    for (const request of requests) {
      const strategy = this.getStrategy(request.url);
      strategiesUsed[strategy.name] = (strategiesUsed[strategy.name] || 0) + 1;
      
      const response = await cache.match(request);
      if (response) {
        const text = await response.clone().text();
        totalSize += text.length;
      }
    }

    return {
      totalEntries: requests.length,
      strategiesUsed,
      cacheSize: totalSize,
      conflicts: this.conflictResolver.getConflictCount()
    };
  }
}

/**
 * Cache Conflict Resolution
 */
class CacheConflictResolver {
  private conflicts: Array<{ url: string; conflicts: string[]; timestamp: number }> = [];

  logConflict(url: string, conflicts: string[]): void {
    this.conflicts.push({
      url,
      conflicts,
      timestamp: Date.now()
    });

    // Keep only recent conflicts (last 100)
    if (this.conflicts.length > 100) {
      this.conflicts = this.conflicts.slice(-100);
    }
  }

  getConflictCount(): number {
    return this.conflicts.length;
  }

  getRecentConflicts(minutes = 60): Array<{ url: string; conflicts: string[]; timestamp: number }> {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.conflicts.filter(conflict => conflict.timestamp > cutoff);
  }
}