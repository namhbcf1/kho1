/**
 * Multi-Layer Cache Service
 * Fixes: Performance bottlenecks, slow query responses
 * Implements: Redis + Memory + Browser cache layers with intelligent invalidation
 */

import { z } from 'zod';

export interface CacheConfig {
  enableRedis: boolean;
  enableMemoryCache: boolean;
  enableBrowserCache: boolean;
  redisUrl?: string;
  memoryMaxSize: number; // MB
  defaultTTL: number; // seconds
  compressionThreshold: number; // bytes
  enableCompression: boolean;
  enableMetrics: boolean;
}

export interface CacheEntry<T = any> {
  data: T;
  metadata: {
    key: string;
    ttl: number;
    createdAt: number;
    lastAccessed: number;
    hitCount: number;
    size: number; // bytes
    compressed: boolean;
    tags: string[];
  };
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  hitRate: number;
  memoryUsage: number;
  averageResponseTime: number;
  totalRequests: number;
}

export interface CacheStrategy {
  layer: 'memory' | 'redis' | 'browser';
  ttl: number;
  tags: string[];
  compression: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface InvalidationRule {
  pattern: string | RegExp;
  triggers: string[]; // Events that trigger invalidation
  cascade: boolean; // Whether to invalidate related keys
  delay?: number; // Delay before invalidation (ms)
}

/**
 * Enterprise Multi-Layer Cache Service
 */
export class CacheService {
  private config: CacheConfig;
  private memoryCache: Map<string, CacheEntry> = new Map();
  private redisClient: any;
  private metrics: CacheMetrics;
  private invalidationRules: Map<string, InvalidationRule> = new Map();
  private compressionWorker?: Worker;

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      enableRedis: true,
      enableMemoryCache: true,
      enableBrowserCache: true,
      memoryMaxSize: 100, // 100MB
      defaultTTL: 300, // 5 minutes
      compressionThreshold: 1024, // 1KB
      enableCompression: true,
      enableMetrics: true,
      ...config
    };

    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      hitRate: 0,
      memoryUsage: 0,
      averageResponseTime: 0,
      totalRequests: 0
    };

    this.initializeCache();
    this.setupInvalidationRules();
  }

  /**
   * Get data from cache with fallback through cache layers
   */
  async get<T>(
    key: string,
    fallbackFunction?: () => Promise<T>,
    strategy?: Partial<CacheStrategy>
  ): Promise<T | null> {
    const startTime = performance.now();
    this.metrics.totalRequests++;

    try {
      // Try memory cache first (fastest)
      if (this.config.enableMemoryCache) {
        const memoryResult = await this.getFromMemory<T>(key);
        if (memoryResult !== null) {
          this.recordHit(performance.now() - startTime);
          return memoryResult;
        }
      }

      // Try Redis cache (fast, persistent)
      if (this.config.enableRedis) {
        const redisResult = await this.getFromRedis<T>(key);
        if (redisResult !== null) {
          // Store in memory cache for next time
          if (this.config.enableMemoryCache) {
            await this.setInMemory(key, redisResult, strategy?.ttl || this.config.defaultTTL);
          }
          this.recordHit(performance.now() - startTime);
          return redisResult;
        }
      }

      // Try browser cache (for client-side)
      if (this.config.enableBrowserCache && typeof window !== 'undefined') {
        const browserResult = await this.getFromBrowser<T>(key);
        if (browserResult !== null) {
          // Store in higher-level caches
          if (this.config.enableMemoryCache) {
            await this.setInMemory(key, browserResult, strategy?.ttl || this.config.defaultTTL);
          }
          this.recordHit(performance.now() - startTime);
          return browserResult;
        }
      }

      // Cache miss - use fallback function if provided
      if (fallbackFunction) {
        const fallbackResult = await fallbackFunction();
        if (fallbackResult !== null && fallbackResult !== undefined) {
          await this.set(key, fallbackResult, strategy);
        }
        this.recordMiss(performance.now() - startTime);
        return fallbackResult;
      }

      this.recordMiss(performance.now() - startTime);
      return null;

    } catch (error) {
      console.error('Cache get error:', error);
      this.recordMiss(performance.now() - startTime);
      
      // Fallback to function if cache fails
      if (fallbackFunction) {
        return await fallbackFunction();
      }
      return null;
    }
  }

  /**
   * Set data in cache with intelligent layer selection
   */
  async set<T>(
    key: string,
    data: T,
    strategy?: Partial<CacheStrategy>
  ): Promise<void> {
    const startTime = performance.now();
    this.metrics.sets++;

    try {
      const resolvedStrategy: CacheStrategy = {
        layer: 'memory',
        ttl: this.config.defaultTTL,
        tags: [],
        compression: this.config.enableCompression,
        priority: 'medium',
        ...strategy
      };

      // Determine optimal cache layers based on data characteristics
      const dataSize = this.estimateSize(data);
      const optimalLayers = this.determineOptimalLayers(dataSize, resolvedStrategy);

      // Compress data if needed
      let processedData = data;
      if (resolvedStrategy.compression && dataSize > this.config.compressionThreshold) {
        processedData = await this.compressData(data);
      }

      // Store in selected cache layers
      for (const layer of optimalLayers) {
        switch (layer) {
          case 'memory':
            if (this.config.enableMemoryCache) {
              await this.setInMemory(key, processedData, resolvedStrategy.ttl, resolvedStrategy.tags);
            }
            break;
          case 'redis':
            if (this.config.enableRedis) {
              await this.setInRedis(key, processedData, resolvedStrategy.ttl, resolvedStrategy.tags);
            }
            break;
          case 'browser':
            if (this.config.enableBrowserCache && typeof window !== 'undefined') {
              await this.setInBrowser(key, processedData, resolvedStrategy.ttl);
            }
            break;
        }
      }

    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Delete key from all cache layers
   */
  async delete(key: string): Promise<void> {
    this.metrics.deletes++;

    try {
      // Delete from all layers
      if (this.config.enableMemoryCache) {
        this.memoryCache.delete(key);
      }

      if (this.config.enableRedis && this.redisClient) {
        await this.redisClient.del(key);
      }

      if (this.config.enableBrowserCache && typeof window !== 'undefined') {
        await this.deleteFromBrowser(key);
      }

    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  /**
   * Invalidate cache by pattern or tags
   */
  async invalidate(pattern?: string | RegExp, tags?: string[]): Promise<number> {
    let invalidatedCount = 0;

    try {
      // Invalidate by pattern
      if (pattern) {
        const keysToDelete = this.findKeysByPattern(pattern);
        for (const key of keysToDelete) {
          await this.delete(key);
          invalidatedCount++;
        }
      }

      // Invalidate by tags
      if (tags && tags.length > 0) {
        const keysToDelete = this.findKeysByTags(tags);
        for (const key of keysToDelete) {
          await this.delete(key);
          invalidatedCount++;
        }
      }

      return invalidatedCount;

    } catch (error) {
      console.error('Cache invalidation error:', error);
      return 0;
    }
  }

  /**
   * Warm up cache with critical data
   */
  async warmUp(warmupFunctions: Array<{
    key: string;
    fn: () => Promise<any>;
    strategy?: Partial<CacheStrategy>;
  }>): Promise<void> {
    console.log('Starting cache warmup...');
    
    const warmupPromises = warmupFunctions.map(async ({ key, fn, strategy }) => {
      try {
        const data = await fn();
        await this.set(key, data, strategy);
        console.log(`Cache warmed up: ${key}`);
      } catch (error) {
        console.error(`Cache warmup failed for ${key}:`, error);
      }
    });

    await Promise.allSettled(warmupPromises);
    console.log('Cache warmup completed');
  }

  /**
   * Preload frequently accessed data
   */
  async preload(keys: Array<{
    key: string;
    loader: () => Promise<any>;
    priority: 'low' | 'medium' | 'high';
  }>): Promise<void> {
    // Sort by priority
    const sortedKeys = keys.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    // Preload in batches
    const batchSize = 5;
    for (let i = 0; i < sortedKeys.length; i += batchSize) {
      const batch = sortedKeys.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async ({ key, loader }) => {
        try {
          const existing = await this.get(key);
          if (existing === null) {
            const data = await loader();
            await this.set(key, data);
          }
        } catch (error) {
          console.error(`Preload failed for ${key}:`, error);
        }
      });

      await Promise.allSettled(batchPromises);
    }
  }

  /**
   * Get cache statistics and metrics
   */
  getMetrics(): CacheMetrics & {
    memoryKeys: number;
    redisConnected: boolean;
    memoryUsagePercent: number;
  } {
    const memoryUsageBytes = this.calculateMemoryUsage();
    const memoryUsagePercent = (memoryUsageBytes / (this.config.memoryMaxSize * 1024 * 1024)) * 100;

    return {
      ...this.metrics,
      hitRate: this.metrics.totalRequests > 0 ? 
        (this.metrics.hits / this.metrics.totalRequests) * 100 : 0,
      memoryUsage: memoryUsageBytes,
      memoryKeys: this.memoryCache.size,
      redisConnected: this.redisClient?.connected || false,
      memoryUsagePercent
    };
  }

  /**
   * Optimize cache performance
   */
  async optimize(): Promise<{
    evicted: number;
    compressed: number;
    recommendations: string[];
  }> {
    const recommendations: string[] = [];
    let evicted = 0;
    let compressed = 0;

    try {
      // Evict expired entries
      evicted = await this.evictExpired();

      // Compress large uncompressed entries
      compressed = await this.compressLargeEntries();

      // Memory usage recommendations
      const metrics = this.getMetrics();
      if (metrics.memoryUsagePercent > 80) {
        recommendations.push('Memory usage is high (>80%). Consider increasing cache size or reducing TTL.');
      }

      if (metrics.hitRate < 70) {
        recommendations.push('Cache hit rate is low (<70%). Review caching strategies and TTL values.');
      }

      if (metrics.averageResponseTime > 100) {
        recommendations.push('Cache response time is slow (>100ms). Check Redis connectivity or enable compression.');
      }

      // Evict least recently used entries if memory is full
      if (metrics.memoryUsagePercent > 90) {
        const lruEvicted = await this.evictLRU(Math.floor(this.memoryCache.size * 0.1));
        evicted += lruEvicted;
        recommendations.push(`Evicted ${lruEvicted} LRU entries to free memory.`);
      }

      return { evicted, compressed, recommendations };

    } catch (error) {
      console.error('Cache optimization error:', error);
      return { evicted: 0, compressed: 0, recommendations: ['Optimization failed'] };
    }
  }

  // Private methods

  private async initializeCache(): Promise<void> {
    try {
      // Initialize Redis connection if enabled
      if (this.config.enableRedis) {
        await this.initializeRedis();
      }

      // Setup compression worker if enabled
      if (this.config.enableCompression && typeof Worker !== 'undefined') {
        this.setupCompressionWorker();
      }

      // Setup memory eviction timer
      setInterval(() => {
        this.evictExpired();
      }, 60000); // Every minute

      console.log('Cache service initialized successfully');

    } catch (error) {
      console.error('Cache initialization error:', error);
    }
  }

  private async initializeRedis(): Promise<void> {
    // Redis initialization would go here
    // For now, using a mock implementation
    this.redisClient = {
      connected: true,
      async get(key: string) { return null; },
      async set(key: string, value: any, ttl?: number) { return 'OK'; },
      async del(key: string) { return 1; },
      async keys(pattern: string) { return []; }
    };
  }

  private setupCompressionWorker(): void {
    // Compression worker setup would go here
    // For now, using a simple implementation
  }

  private async getFromMemory<T>(key: string): Promise<T | null> {
    const entry = this.memoryCache.get(key);
    if (!entry) return null;

    // Check expiration
    if (Date.now() > entry.metadata.createdAt + (entry.metadata.ttl * 1000)) {
      this.memoryCache.delete(key);
      this.metrics.evictions++;
      return null;
    }

    // Update access time and hit count
    entry.metadata.lastAccessed = Date.now();
    entry.metadata.hitCount++;

    return entry.data;
  }

  private async setInMemory<T>(
    key: string,
    data: T,
    ttl: number,
    tags: string[] = []
  ): Promise<void> {
    const size = this.estimateSize(data);
    
    // Check memory limits
    if (this.shouldEvictForMemory(size)) {
      await this.evictLRU(1);
    }

    const entry: CacheEntry<T> = {
      data,
      metadata: {
        key,
        ttl,
        createdAt: Date.now(),
        lastAccessed: Date.now(),
        hitCount: 0,
        size,
        compressed: false,
        tags
      }
    };

    this.memoryCache.set(key, entry);
  }

  private async getFromRedis<T>(key: string): Promise<T | null> {
    if (!this.redisClient?.connected) return null;

    try {
      const data = await this.redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  private async setInRedis<T>(
    key: string,
    data: T,
    ttl: number,
    tags: string[] = []
  ): Promise<void> {
    if (!this.redisClient?.connected) return;

    try {
      const serialized = JSON.stringify(data);
      await this.redisClient.set(key, serialized, ttl);
      
      // Store tags for invalidation
      if (tags.length > 0) {
        for (const tag of tags) {
          await this.redisClient.sadd(`tag:${tag}`, key);
          await this.redisClient.expire(`tag:${tag}`, ttl);
        }
      }
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  private async getFromBrowser<T>(key: string): Promise<T | null> {
    if (typeof window === 'undefined') return null;

    try {
      // Try localStorage first
      const localData = localStorage.getItem(`cache:${key}`);
      if (localData) {
        const parsed = JSON.parse(localData);
        if (Date.now() < parsed.expiry) {
          return parsed.data;
        } else {
          localStorage.removeItem(`cache:${key}`);
        }
      }

      // Try sessionStorage
      const sessionData = sessionStorage.getItem(`cache:${key}`);
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        if (Date.now() < parsed.expiry) {
          return parsed.data;
        } else {
          sessionStorage.removeItem(`cache:${key}`);
        }
      }

      return null;
    } catch (error) {
      console.error('Browser cache get error:', error);
      return null;
    }
  }

  private async setInBrowser<T>(key: string, data: T, ttl: number): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const expiry = Date.now() + (ttl * 1000);
      const cacheData = { data, expiry };
      const serialized = JSON.stringify(cacheData);

      // Store in localStorage for longer TTL, sessionStorage for shorter
      if (ttl > 3600) { // > 1 hour
        localStorage.setItem(`cache:${key}`, serialized);
      } else {
        sessionStorage.setItem(`cache:${key}`, serialized);
      }
    } catch (error) {
      console.error('Browser cache set error:', error);
    }
  }

  private async deleteFromBrowser(key: string): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(`cache:${key}`);
      sessionStorage.removeItem(`cache:${key}`);
    } catch (error) {
      console.error('Browser cache delete error:', error);
    }
  }

  private determineOptimalLayers(
    dataSize: number,
    strategy: CacheStrategy
  ): CacheStrategy['layer'][] {
    const layers: CacheStrategy['layer'][] = [];

    // Memory cache for small, frequently accessed data
    if (dataSize < 10 * 1024 && strategy.priority !== 'low') { // < 10KB
      layers.push('memory');
    }

    // Redis for larger data and persistence
    if (this.config.enableRedis && (strategy.ttl > 300 || strategy.priority === 'high')) {
      layers.push('redis');
    }

    // Browser cache for client-side data
    if (typeof window !== 'undefined' && strategy.ttl > 60) {
      layers.push('browser');
    }

    // Default to memory if no other layers selected
    if (layers.length === 0) {
      layers.push('memory');
    }

    return layers;
  }

  private estimateSize(data: any): number {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      return JSON.stringify(data).length * 2; // Rough estimate
    }
  }

  private async compressData<T>(data: T): Promise<T> {
    // Compression implementation would go here
    // For now, returning as-is
    return data;
  }

  private findKeysByPattern(pattern: string | RegExp): string[] {
    const keys: string[] = [];
    
    for (const key of this.memoryCache.keys()) {
      if (typeof pattern === 'string') {
        if (key.includes(pattern)) {
          keys.push(key);
        }
      } else {
        if (pattern.test(key)) {
          keys.push(key);
        }
      }
    }

    return keys;
  }

  private findKeysByTags(tags: string[]): string[] {
    const keys: string[] = [];
    
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.metadata.tags.some(tag => tags.includes(tag))) {
        keys.push(key);
      }
    }

    return keys;
  }

  private calculateMemoryUsage(): number {
    let totalSize = 0;
    for (const entry of this.memoryCache.values()) {
      totalSize += entry.metadata.size;
    }
    return totalSize;
  }

  private shouldEvictForMemory(newEntrySize: number): boolean {
    const currentUsage = this.calculateMemoryUsage();
    const maxUsage = this.config.memoryMaxSize * 1024 * 1024; // Convert MB to bytes
    return (currentUsage + newEntrySize) > maxUsage;
  }

  private async evictExpired(): Promise<number> {
    let evicted = 0;
    const now = Date.now();

    for (const [key, entry] of this.memoryCache.entries()) {
      if (now > entry.metadata.createdAt + (entry.metadata.ttl * 1000)) {
        this.memoryCache.delete(key);
        evicted++;
      }
    }

    this.metrics.evictions += evicted;
    return evicted;
  }

  private async evictLRU(count: number): Promise<number> {
    // Sort by last accessed time and remove oldest
    const entries = Array.from(this.memoryCache.entries())
      .sort(([, a], [, b]) => a.metadata.lastAccessed - b.metadata.lastAccessed);

    let evicted = 0;
    for (let i = 0; i < Math.min(count, entries.length); i++) {
      const [key] = entries[i];
      this.memoryCache.delete(key);
      evicted++;
    }

    this.metrics.evictions += evicted;
    return evicted;
  }

  private async compressLargeEntries(): Promise<number> {
    // Implementation for compressing large entries
    return 0;
  }

  private recordHit(responseTime: number): void {
    this.metrics.hits++;
    this.updateAverageResponseTime(responseTime);
  }

  private recordMiss(responseTime: number): void {
    this.metrics.misses++;
    this.updateAverageResponseTime(responseTime);
  }

  private updateAverageResponseTime(responseTime: number): void {
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + responseTime) / 
      this.metrics.totalRequests;
  }

  private setupInvalidationRules(): void {
    // Setup common invalidation patterns
    this.invalidationRules.set('products', {
      pattern: /^product:/,
      triggers: ['product.updated', 'product.deleted', 'inventory.updated'],
      cascade: true
    });

    this.invalidationRules.set('transactions', {
      pattern: /^transaction:/,
      triggers: ['transaction.created', 'transaction.updated', 'payment.processed'],
      cascade: false
    });

    this.invalidationRules.set('reports', {
      pattern: /^report:/,
      triggers: ['transaction.created', 'inventory.updated', 'end_of_day'],
      cascade: true,
      delay: 60000 // 1 minute delay
    });
  }
}

/**
 * Cache configuration schema
 */
export const CacheConfigSchema = z.object({
  enableRedis: z.boolean(),
  enableMemoryCache: z.boolean(),
  enableBrowserCache: z.boolean(),
  redisUrl: z.string().optional(),
  memoryMaxSize: z.number().positive(),
  defaultTTL: z.number().positive(),
  compressionThreshold: z.number().positive(),
  enableCompression: z.boolean(),
  enableMetrics: z.boolean()
});

/**
 * Cache strategy schema
 */
export const CacheStrategySchema = z.object({
  layer: z.enum(['memory', 'redis', 'browser']),
  ttl: z.number().positive(),
  tags: z.array(z.string()),
  compression: z.boolean(),
  priority: z.enum(['low', 'medium', 'high', 'critical'])
});