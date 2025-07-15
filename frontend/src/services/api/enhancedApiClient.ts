// Enhanced API client with caching, retry logic, and Vietnamese business features
import { authService } from '../auth/authService';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiConfig {
  baseURL?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  cache?: boolean;
  cacheTTL?: number;
}

export interface RequestConfig extends RequestInit {
  timeout?: number;
  retries?: number;
  cache?: boolean;
  cacheTTL?: number;
  skipAuth?: boolean;
}

// Cache interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class ApiCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clear expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

class EnhancedApiClient {
  private baseURL: string;
  private timeout: number;
  private retries: number;
  private retryDelay: number;
  private cache: ApiCache;

  constructor(config: ApiConfig = {}) {
    this.baseURL = config.baseURL || '/api';
    this.timeout = config.timeout || 30000;
    this.retries = config.retries || 3;
    this.retryDelay = config.retryDelay || 1000;
    this.cache = new ApiCache();

    // Cleanup cache every 10 minutes
    setInterval(() => this.cache.cleanup(), 10 * 60 * 1000);
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getCacheKey(url: string, options: RequestConfig): string {
    const method = options.method || 'GET';
    const body = options.body ? JSON.stringify(options.body) : '';
    return `${method}:${url}:${body}`;
  }

  private async makeRequest<T>(
    url: string,
    options: RequestConfig = {},
    attempt = 1
  ): Promise<ApiResponse<T>> {
    const {
      timeout = this.timeout,
      retries = this.retries,
      cache = false,
      cacheTTL = 5 * 60 * 1000,
      skipAuth = false,
      ...requestOptions
    } = options;

    // Check cache for GET requests
    if (cache && (options.method === 'GET' || !options.method)) {
      const cacheKey = this.getCacheKey(url, options);
      const cachedData = this.cache.get<ApiResponse<T>>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    // Prepare request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...requestOptions.headers as Record<string, string>,
    };

    // Add authentication header
    if (!skipAuth) {
      const token = authService.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const requestConfig: RequestInit = {
      ...requestOptions,
      headers,
      signal: controller.signal,
      credentials: 'include',
    };

    try {
      const response = await fetch(fullUrl, requestConfig);
      clearTimeout(timeoutId);

      // Handle authentication errors
      if (response.status === 401) {
        // Try to refresh token
        const refreshed = await this.handleAuthError();
        if (refreshed && attempt <= retries) {
          return this.makeRequest<T>(url, options, attempt + 1);
        }
        throw new Error('Phiên đăng nhập đã hết hạn');
      }

      const data: ApiResponse<T> = await response.json();

      // Handle server errors with retry
      if (!response.ok) {
        if (attempt <= retries && this.shouldRetry(response.status)) {
          await this.sleep(this.retryDelay * attempt);
          return this.makeRequest<T>(url, options, attempt + 1);
        }
        
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      // Cache successful GET requests
      if (cache && (options.method === 'GET' || !options.method) && data.success) {
        const cacheKey = this.getCacheKey(url, options);
        this.cache.set(cacheKey, data, cacheTTL);
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        // Handle network errors with retry
        if (attempt <= retries && this.shouldRetryNetworkError(error)) {
          await this.sleep(this.retryDelay * attempt);
          return this.makeRequest<T>(url, options, attempt + 1);
        }

        // Handle specific error types
        if (error.name === 'AbortError') {
          throw new Error('Yêu cầu đã bị hủy do hết thời gian chờ');
        }
        
        if (error.message.includes('fetch')) {
          throw new Error('Không thể kết nối đến máy chủ');
        }

        throw error;
      }

      throw new Error('Có lỗi không xác định xảy ra');
    }
  }

  private shouldRetry(status: number): boolean {
    // Retry on server errors but not client errors
    return status >= 500 || status === 408 || status === 429;
  }

  private shouldRetryNetworkError(error: Error): boolean {
    return (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.name === 'NetworkError'
    );
  }

  private async handleAuthError(): Promise<boolean> {
    try {
      // This would trigger token refresh in auth service
      const currentUser = await authService.getCurrentUser();
      return !!currentUser;
    } catch {
      return false;
    }
  }

  // Public API methods
  async get<T>(url: string, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, { ...config, method: 'GET' });
  }

  async post<T>(url: string, data?: any, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(url: string, data?: any, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(url: string, data?: any, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(url: string, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, { ...config, method: 'DELETE' });
  }

  // File upload
  async upload<T>(
    url: string,
    file: File | FormData,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const formData = file instanceof FormData ? file : new FormData();
    if (file instanceof File) {
      formData.append('file', file);
    }

    const { headers, ...restConfig } = config;
    return this.makeRequest<T>(url, {
      ...restConfig,
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData, let browser set it
        ...headers,
      },
    });
  }

  // Batch requests
  async batch<T>(requests: Array<{
    url: string;
    method?: string;
    data?: any;
    config?: RequestConfig;
  }>): Promise<Array<ApiResponse<T>>> {
    const promises = requests.map(({ url, method = 'GET', data, config = {} }) => {
      return this.makeRequest<T>(url, {
        ...config,
        method,
        body: data ? JSON.stringify(data) : undefined,
      });
    });

    return Promise.all(promises);
  }

  // Cache management
  clearCache(): void {
    this.cache.clear();
  }

  invalidateCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    // Simple pattern matching for cache invalidation
    for (const [key] of this.cache['cache'].entries()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get('/health', { 
        timeout: 5000,
        retries: 1,
        skipAuth: true 
      });
      return response.success;
    } catch {
      return false;
    }
  }
}

// Create singleton instance
export const apiClient = new EnhancedApiClient({
  baseURL: '/api',
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
});

export default apiClient;