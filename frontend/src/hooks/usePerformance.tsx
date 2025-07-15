// Performance Optimization Hooks for Vietnamese POS System
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { debounce, throttle } from 'lodash';

// Vietnamese Data Virtualization Hook
export const useVietnameseVirtualList = <T,>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );
    
    return {
      startIndex,
      endIndex,
      visibleItems: items.slice(startIndex, endIndex),
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight,
    };
  }, [items, itemHeight, containerHeight, scrollTop]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    setIsScrolling(true);

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, []);

  return {
    ...visibleItems,
    handleScroll,
    isScrolling,
  };
};

// Vietnamese Search Performance Hook
export const useVietnameseSearch = <T,>(
  items: T[],
  searchKeys: (keyof T)[],
  debounceMs: number = 300
) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState<T[]>(items);
  const [isSearching, setIsSearching] = useState(false);

  // Vietnamese character normalization
  const normalizeVietnamese = useCallback((text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  }, []);

  const debouncedSearch = useMemo(
    () => debounce((term: string) => {
      setIsSearching(true);
      
      if (!term.trim()) {
        setFilteredItems(items);
        setIsSearching(false);
        return;
      }

      const normalizedTerm = normalizeVietnamese(term);
      const filtered = items.filter(item =>
        searchKeys.some(key => {
          const value = item[key];
          if (typeof value === 'string') {
            return normalizeVietnamese(value).includes(normalizedTerm);
          }
          return false;
        })
      );

      setFilteredItems(filtered);
      setIsSearching(false);
    }, debounceMs),
    [items, searchKeys, normalizeVietnamese, debounceMs]
  );

  useEffect(() => {
    debouncedSearch(searchTerm);
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchTerm, debouncedSearch]);

  useEffect(() => {
    setFilteredItems(items);
  }, [items]);

  return {
    searchTerm,
    setSearchTerm,
    filteredItems,
    isSearching,
  };
};

// Vietnamese Image Lazy Loading Hook
export const useVietnameseImageLoader = () => {
  const [imageCache, setImageCache] = useState<Map<string, boolean>>(new Map());
  const observerRef = useRef<IntersectionObserver>();

  const loadImage = useCallback((src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (imageCache.has(src)) {
        resolve();
        return;
      }

      const img = new Image();
      img.onload = () => {
        setImageCache(prev => new Map(prev).set(src, true));
        resolve();
      };
      img.onerror = reject;
      img.src = src;
    });
  }, [imageCache]);

  const registerImage = useCallback((element: HTMLImageElement | null, src: string) => {
    if (!element) return;

    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              const dataSrc = img.dataset.src;
              if (dataSrc) {
                loadImage(dataSrc).then(() => {
                  img.src = dataSrc;
                  img.classList.add('loaded');
                }).catch(() => {
                  img.classList.add('error');
                });
                observerRef.current?.unobserve(img);
              }
            }
          });
        },
        { threshold: 0.1 }
      );
    }

    element.dataset.src = src;
    observerRef.current.observe(element);
  }, [loadImage]);

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return { registerImage, imageCache };
};

// Vietnamese Number Formatting Performance Hook
export const useVietnameseNumberFormatter = () => {
  const formatters = useMemo(() => ({
    currency: new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }),
    number: new Intl.NumberFormat('vi-VN'),
    percent: new Intl.NumberFormat('vi-VN', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }),
  }), []);

  const formatCurrency = useCallback((amount: number) => {
    return formatters.currency.format(amount);
  }, [formatters.currency]);

  const formatNumber = useCallback((number: number) => {
    return formatters.number.format(number);
  }, [formatters.number]);

  const formatPercent = useCallback((percent: number) => {
    return formatters.percent.format(percent / 100);
  }, [formatters.percent]);

  return { formatCurrency, formatNumber, formatPercent };
};

// Vietnamese Date/Time Performance Hook
export const useVietnameseDateFormatter = () => {
  const formatters = useMemo(() => ({
    date: new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    time: new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }),
    datetime: new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
    relative: new Intl.RelativeTimeFormat('vi-VN', {
      numeric: 'auto',
    }),
  }), []);

  const formatDate = useCallback((date: Date) => {
    return formatters.date.format(date);
  }, [formatters.date]);

  const formatTime = useCallback((date: Date) => {
    return formatters.time.format(date);
  }, [formatters.time]);

  const formatDateTime = useCallback((date: Date) => {
    return formatters.datetime.format(date);
  }, [formatters.datetime]);

  const formatRelative = useCallback((date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((date.getTime() - now.getTime()) / 1000);
    
    if (Math.abs(diffInSeconds) < 60) {
      return 'vừa xong';
    } else if (Math.abs(diffInSeconds) < 3600) {
      return formatters.relative.format(Math.floor(diffInSeconds / 60), 'minute');
    } else if (Math.abs(diffInSeconds) < 86400) {
      return formatters.relative.format(Math.floor(diffInSeconds / 3600), 'hour');
    } else {
      return formatters.relative.format(Math.floor(diffInSeconds / 86400), 'day');
    }
  }, [formatters.relative]);

  return { formatDate, formatTime, formatDateTime, formatRelative };
};

// Vietnamese Real-time Data Hook
export const useVietnameseRealTime = <T,>(
  fetcher: () => Promise<T>,
  interval: number = 5000
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const result = await fetcher();
      setData(result);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    fetchData();
    
    intervalRef.current = setInterval(fetchData, interval);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData, interval]);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  return { data, loading, error, lastUpdate, refresh };
};

// Vietnamese Offline Support Hook
export const useVietnameseOffline = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useState<Array<{
    id: string;
    action: string;
    data: any;
    timestamp: Date;
  }>>([]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addToQueue = useCallback((action: string, data: any) => {
    const id = Date.now().toString();
    setOfflineQueue(prev => [...prev, {
      id,
      action,
      data,
      timestamp: new Date(),
    }]);
    return id;
  }, []);

  const processQueue = useCallback(async () => {
    if (!isOnline || offlineQueue.length === 0) return;

    const queue = [...offlineQueue];
    setOfflineQueue([]);

    for (const item of queue) {
      try {
        // Process offline actions when back online
        console.log('Processing offline action:', item);
        // Implementation depends on your API structure
      } catch (error) {
        console.error('Failed to process offline action:', error);
        // Re-add to queue on failure
        setOfflineQueue(prev => [...prev, item]);
      }
    }
  }, [isOnline, offlineQueue]);

  useEffect(() => {
    if (isOnline) {
      processQueue();
    }
  }, [isOnline, processQueue]);

  return {
    isOnline,
    offlineQueue,
    addToQueue,
    processQueue,
  };
};

// Vietnamese Performance Monitor Hook
export const useVietnamesePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    apiResponseTime: 0,
    memoryUsage: 0,
    networkSpeed: 'unknown' as 'slow' | 'fast' | 'unknown',
  });

  const measureRenderTime = useCallback((componentName: string) => {
    const start = performance.now();
    
    return () => {
      const end = performance.now();
      const renderTime = end - start;
      
      setMetrics(prev => ({
        ...prev,
        renderTime: Math.max(prev.renderTime, renderTime),
      }));
      
      if (renderTime > 100) {
        console.warn(`Slow render detected for ${componentName}: ${renderTime.toFixed(2)}ms`);
      }
    };
  }, []);

  const measureApiCall = useCallback(async <T,>(
    apiCall: () => Promise<T>,
    endpoint: string
  ): Promise<T> => {
    const start = performance.now();
    
    try {
      const result = await apiCall();
      const end = performance.now();
      const responseTime = end - start;
      
      setMetrics(prev => ({
        ...prev,
        apiResponseTime: Math.max(prev.apiResponseTime, responseTime),
      }));
      
      if (responseTime > 1000) {
        console.warn(`Slow API call detected for ${endpoint}: ${responseTime.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const end = performance.now();
      const responseTime = end - start;
      console.error(`API call failed for ${endpoint} after ${responseTime.toFixed(2)}ms:`, error);
      throw error;
    }
  }, []);

  const checkNetworkSpeed = useCallback(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const speed = connection?.effectiveType;
      
      if (speed === 'slow-2g' || speed === '2g') {
        setMetrics(prev => ({ ...prev, networkSpeed: 'slow' }));
      } else if (speed === '3g' || speed === '4g') {
        setMetrics(prev => ({ ...prev, networkSpeed: 'fast' }));
      }
    }
  }, []);

  useEffect(() => {
    checkNetworkSpeed();
    
    const interval = setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMetrics(prev => ({
          ...prev,
          memoryUsage: memory.usedJSHeapSize / 1024 / 1024, // MB
        }));
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [checkNetworkSpeed]);

  return {
    metrics,
    measureRenderTime,
    measureApiCall,
    checkNetworkSpeed,
  };
};

export default {
  useVietnameseVirtualList,
  useVietnameseSearch,
  useVietnameseImageLoader,
  useVietnameseNumberFormatter,
  useVietnameseDateFormatter,
  useVietnameseRealTime,
  useVietnameseOffline,
  useVietnamesePerformanceMonitor,
};