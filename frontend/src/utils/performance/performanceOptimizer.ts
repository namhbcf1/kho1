// Performance Optimizer for Vietnamese POS System
// Optimized for Cloudflare Pages and Vietnamese business requirements

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { debounce, throttle } from 'lodash-es';

// Performance monitoring
export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  networkLatency: number;
  cacheHitRatio: number;
  errorRate: number;
  userActions: number;
  lastUpdated: Date;
}

// Cache management
class PerformanceCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private maxSize = 100;

  set(key: string, data: any, ttl: number = 300000) { // 5 minutes default
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, { data, timestamp: Date.now(), ttl });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

// Global performance cache
export const performanceCache = new PerformanceCache();

// Performance monitoring hook
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    networkLatency: 0,
    cacheHitRatio: 0,
    errorRate: 0,
    userActions: 0,
    lastUpdated: new Date()
  });

  const startTime = useRef<number>(0);
  const renderCount = useRef<number>(0);
  const errorCount = useRef<number>(0);
  const actionCount = useRef<number>(0);
  const cacheHits = useRef<number>(0);
  const cacheMisses = useRef<number>(0);

  // Measure render time
  const measureRenderTime = useCallback(() => {
    startTime.current = performance.now();
  }, []);

  const endRenderTime = useCallback(() => {
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;
    renderCount.current++;
    
    setMetrics(prev => ({
      ...prev,
      renderTime: (prev.renderTime + renderTime) / renderCount.current,
      lastUpdated: new Date()
    }));
  }, []);

  // Measure memory usage
  const measureMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      setMetrics(prev => ({
        ...prev,
        memoryUsage: memInfo.usedJSHeapSize / 1024 / 1024, // MB
        lastUpdated: new Date()
      }));
    }
  }, []);

  // Measure network latency
  const measureNetworkLatency = useCallback(async (url: string) => {
    const startTime = performance.now();
    try {
      await fetch(url, { method: 'HEAD' });
      const endTime = performance.now();
      const latency = endTime - startTime;
      
      setMetrics(prev => ({
        ...prev,
        networkLatency: latency,
        lastUpdated: new Date()
      }));
    } catch (error) {
      console.warn('Network latency measurement failed:', error);
    }
  }, []);

  // Track user actions
  const trackUserAction = useCallback(() => {
    actionCount.current++;
    setMetrics(prev => ({
      ...prev,
      userActions: actionCount.current,
      lastUpdated: new Date()
    }));
  }, []);

  // Track cache performance
  const trackCacheHit = useCallback(() => {
    cacheHits.current++;
    updateCacheRatio();
  }, []);

  const trackCacheMiss = useCallback(() => {
    cacheMisses.current++;
    updateCacheRatio();
  }, []);

  const updateCacheRatio = useCallback(() => {
    const total = cacheHits.current + cacheMisses.current;
    const ratio = total > 0 ? (cacheHits.current / total) * 100 : 0;
    
    setMetrics(prev => ({
      ...prev,
      cacheHitRatio: ratio,
      lastUpdated: new Date()
    }));
  }, []);

  // Track errors
  const trackError = useCallback(() => {
    errorCount.current++;
    const errorRate = (errorCount.current / (actionCount.current || 1)) * 100;
    
    setMetrics(prev => ({
      ...prev,
      errorRate,
      lastUpdated: new Date()
    }));
  }, []);

  // Auto-measure memory usage
  useEffect(() => {
    const interval = setInterval(measureMemoryUsage, 10000); // Every 10 seconds
    return () => clearInterval(interval);
  }, [measureMemoryUsage]);

  return {
    metrics,
    measureRenderTime,
    endRenderTime,
    measureMemoryUsage,
    measureNetworkLatency,
    trackUserAction,
    trackCacheHit,
    trackCacheMiss,
    trackError
  };
};

// Optimized data fetching hook
export const useOptimizedFetch = <T>(
  url: string,
  options: RequestInit = {},
  cacheKey?: string,
  ttl?: number
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const { trackCacheHit, trackCacheMiss, trackError } = usePerformanceMonitor();

  const fetchData = useCallback(async () => {
    const key = cacheKey || url;
    
    // Check cache first
    const cachedData = performanceCache.get(key);
    if (cachedData) {
      setData(cachedData);
      setLoading(false);
      trackCacheHit();
      return;
    }

    trackCacheMiss();
    setLoading(true);

    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Cache the result
      performanceCache.set(key, result, ttl);
      
      setData(result);
      setError(null);
    } catch (err) {
      const error = err as Error;
      setError(error);
      trackError();
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [url, options, cacheKey, ttl, trackCacheHit, trackCacheMiss, trackError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

// Debounced search hook
export const useDebouncedSearch = (
  searchFn: (query: string) => Promise<any>,
  delay: number = 300
) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const debouncedSearch = useMemo(
    () => debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const data = await searchFn(searchQuery);
        setResults(data);
        setError(null);
      } catch (err) {
        setError(err as Error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, delay),
    [searchFn, delay]
  );

  useEffect(() => {
    debouncedSearch(query);
    return () => {
      debouncedSearch.cancel();
    };
  }, [query, debouncedSearch]);

  return {
    query,
    setQuery,
    results,
    loading,
    error
  };
};

// Throttled scroll handler
export const useThrottledScroll = (
  handler: (event: Event) => void,
  delay: number = 100
) => {
  const throttledHandler = useMemo(
    () => throttle(handler, delay),
    [handler, delay]
  );

  useEffect(() => {
    window.addEventListener('scroll', throttledHandler);
    return () => {
      window.removeEventListener('scroll', throttledHandler);
      throttledHandler.cancel();
    };
  }, [throttledHandler]);
};

// Virtual scrolling hook
export const useVirtualScroll = <T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) => {
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(0);

  const visibleItems = useMemo(() => {
    const start = Math.max(0, startIndex - 5); // Buffer
    const end = Math.min(items.length, endIndex + 5); // Buffer
    return items.slice(start, end);
  }, [items, startIndex, endIndex]);

  const updateVisibleRange = useCallback((scrollTop: number) => {
    const newStartIndex = Math.floor(scrollTop / itemHeight);
    const newEndIndex = Math.min(
      items.length,
      newStartIndex + Math.ceil(containerHeight / itemHeight)
    );

    setStartIndex(newStartIndex);
    setEndIndex(newEndIndex);
  }, [itemHeight, containerHeight, items.length]);

  return {
    visibleItems,
    updateVisibleRange,
    totalHeight: items.length * itemHeight,
    offsetY: startIndex * itemHeight
  };
};

// Lazy loading hook
export const useLazyLoad = (
  threshold: number = 0.1,
  rootMargin: string = '0px'
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isLoaded) {
          setIsIntersecting(true);
          setIsLoaded(true);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, isLoaded]);

  return { elementRef, isIntersecting, isLoaded };
};

// Image optimization hook
export const useOptimizedImage = (
  src: string,
  options: {
    width?: number;
    height?: number;
    format?: 'webp' | 'avif' | 'jpeg' | 'png';
    quality?: number;
    lazy?: boolean;
  } = {}
) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { elementRef, isIntersecting } = useLazyLoad();

  const { width, height, format = 'webp', quality = 80, lazy = true } = options;

  useEffect(() => {
    if (lazy && !isIntersecting) return;

    const img = new Image();
    
    // Construct optimized URL (assuming Cloudflare Image Resizing)
    let optimizedSrc = src;
    if (width || height || format !== 'webp' || quality !== 80) {
      const params = new URLSearchParams();
      if (width) params.append('width', width.toString());
      if (height) params.append('height', height.toString());
      params.append('format', format);
      params.append('quality', quality.toString());
      optimizedSrc = `${src}?${params.toString()}`;
    }

    img.onload = () => {
      setImageSrc(optimizedSrc);
      setIsLoading(false);
      setError(null);
    };

    img.onerror = () => {
      setError(new Error('Failed to load image'));
      setIsLoading(false);
    };

    img.src = optimizedSrc;
  }, [src, width, height, format, quality, lazy, isIntersecting]);

  return {
    imageSrc,
    isLoading,
    error,
    elementRef: lazy ? elementRef : null
  };
};

// Bundle splitting utilities
export const loadChunk = async (chunkName: string) => {
  try {
    const module = await import(/* webpackChunkName: "[request]" */ `../components/${chunkName}`);
    return module.default || module;
  } catch (error) {
    console.error(`Failed to load chunk ${chunkName}:`, error);
    throw error;
  }
};

// Service Worker utilities
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  }
  throw new Error('Service Worker not supported');
};

// Vietnamese text search optimization
export const useVietnameseSearch = (
  items: any[],
  searchFields: string[],
  options: {
    caseSensitive?: boolean;
    diacriticSensitive?: boolean;
    fuzzy?: boolean;
  } = {}
) => {
  const { caseSensitive = false, diacriticSensitive = false, fuzzy = false } = options;

  const normalizeText = useCallback((text: string) => {
    let normalized = text;
    
    if (!caseSensitive) {
      normalized = normalized.toLowerCase();
    }
    
    if (!diacriticSensitive) {
      normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }
    
    return normalized;
  }, [caseSensitive, diacriticSensitive]);

  const searchItems = useCallback((query: string) => {
    if (!query.trim()) return items;

    const normalizedQuery = normalizeText(query);
    
    return items.filter(item => {
      return searchFields.some(field => {
        const fieldValue = item[field];
        if (!fieldValue) return false;
        
        const normalizedFieldValue = normalizeText(fieldValue.toString());
        
        if (fuzzy) {
          // Simple fuzzy matching
          const words = normalizedQuery.split(/\s+/);
          return words.every(word => normalizedFieldValue.includes(word));
        } else {
          return normalizedFieldValue.includes(normalizedQuery);
        }
      });
    });
  }, [items, searchFields, normalizeText, fuzzy]);

  return { searchItems, normalizeText };
};

// Currency formatting optimization
export const useVietnameseCurrency = () => {
  const formatVND = useCallback((amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }, []);

  const formatVNDShort = useCallback((amount: number) => {
    if (amount >= 1000000000) {
      return `${(amount / 1000000000).toFixed(1)}B₫`;
    } else if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M₫`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K₫`;
    }
    return `${amount}₫`;
  }, []);

  return { formatVND, formatVNDShort };
};

// Export all performance utilities
export const PerformanceUtils = {
  performanceCache,
  usePerformanceMonitor,
  useOptimizedFetch,
  useDebouncedSearch,
  useThrottledScroll,
  useVirtualScroll,
  useLazyLoad,
  useOptimizedImage,
  loadChunk,
  registerServiceWorker,
  useVietnameseSearch,
  useVietnameseCurrency
};

export default PerformanceUtils;