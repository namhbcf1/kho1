// Enhanced Cloudflare Workers API Client - Vietnamese POS System 2025
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_BASE_URL, REQUEST_TIMEOUT } from '../../constants/api';
import { storage, STORAGE_KEYS } from '../../constants/storage';
import { ApiResponse, ApiError } from './types';

export interface ApiClientConfig {
  baseURL?: string;
  timeout?: number;
  withCredentials?: boolean;
}

class ApiClient {
  private client: AxiosInstance;

  constructor(config: ApiClientConfig = {}) {
    this.client = axios.create({
      baseURL: config.baseURL || API_BASE_URL,
      timeout: config.timeout || REQUEST_TIMEOUT,
      withCredentials: config.withCredentials || false,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = storage.local.get(STORAGE_KEYS.AUTH_TOKEN);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add request timestamp for debugging
        config.metadata = { startTime: Date.now() };
        
        return config;
      },
      (error) => {
        // Production logging - no console.log
        // Error will be handled by proper logging system
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle common responses
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log response time for performance monitoring
        const endTime = Date.now();
        const startTime = response.config.metadata?.startTime || endTime;
        const duration = endTime - startTime;
        
        // Production monitoring - log slow responses to backend
        if (duration > 5000) {
          // Send performance metrics to monitoring service
          this.logPerformanceMetric(response.config.url || '', duration);
        }

        return response;
      },
      (error) => {
        // Handle common error responses
        if (error.response) {
          const { status, data } = error.response;
          
          switch (status) {
            case 401:
              // Unauthorized - clear auth and redirect to login
              storage.local.remove(STORAGE_KEYS.AUTH_TOKEN);
              storage.local.remove(STORAGE_KEYS.REFRESH_TOKEN);
              window.location.href = '/login';
              break;
              
            case 403:
              // Production logging for forbidden access
              this.logSecurityEvent('access_forbidden', data.message);
              break;

            case 429:
              // Production logging for rate limiting
              this.logRateLimitEvent(data.message);
              break;

            case 500:
              // Production logging for server errors
              this.logServerError(data.message, error);
              break;

            default:
              // Production logging for general API errors
              this.logApiError(data.message || error.message, error);
          }
        } else if (error.request) {
          // Production logging for network errors
          this.logNetworkError(error.message, error);
        } else {
          // Production logging for request setup errors
          this.logRequestError(error.message, error);
        }

        return Promise.reject(error);
      }
    );
  }

  // Production logging methods
  private logPerformanceMetric(url: string, duration: number): void {
    // Send to monitoring service in production
    fetch('/api/metrics/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'slow_response',
        url,
        duration,
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {
      // Silently fail if monitoring service is unavailable
    });
  }

  private logSecurityEvent(type: string, message: string): void {
    fetch('/api/logs/security', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        message,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      }),
    }).catch(() => {
      // Silently fail if logging service is unavailable
    });
  }

  private logRateLimitEvent(message: string): void {
    fetch('/api/logs/rate-limit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        timestamp: new Date().toISOString(),
        ip: 'client-side',
      }),
    }).catch(() => {
      // Silently fail if logging service is unavailable
    });
  }

  private logServerError(message: string, error: any): void {
    fetch('/api/logs/server-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {
      // Silently fail if logging service is unavailable
    });
  }

  private logApiError(message: string, error: any): void {
    fetch('/api/logs/api-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {
      // Silently fail if logging service is unavailable
    });
  }

  private logNetworkError(message: string, error: any): void {
    fetch('/api/logs/network-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {
      // Silently fail if logging service is unavailable
    });
  }

  private logRequestError(message: string, error: any): void {
    fetch('/api/logs/request-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {
      // Silently fail if logging service is unavailable
    });
  }

  // HTTP Methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  // File upload with progress
  async upload<T = any>(
    url: string, 
    file: File, 
    onProgress?: (progress: number) => void
  ): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response.data;
  }

  // Get raw axios instance for advanced usage
  getAxiosInstance(): AxiosInstance {
    return this.client;
  }
}

// Create and export default instance
export const apiClient = new ApiClient();

// Export class for custom instances
export { ApiClient };
