// Request/response interceptors for API client
import { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { storage, STORAGE_KEYS } from '../../constants/storage';
import { HTTP_STATUS } from '../../constants/api';

export interface RequestMetadata {
  startTime: number;
  retryCount?: number;
}

// Request interceptors
export const requestInterceptors = {
  // Add authentication token
  addAuthToken: (config: AxiosRequestConfig): AxiosRequestConfig => {
    const token = storage.local.get(STORAGE_KEYS.AUTH_TOKEN);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },

  // Add request metadata for tracking
  addMetadata: (config: AxiosRequestConfig): AxiosRequestConfig => {
    config.metadata = {
      startTime: Date.now(),
      retryCount: 0,
    };
    return config;
  },

  // Add request ID for tracing
  addRequestId: (config: AxiosRequestConfig): AxiosRequestConfig => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    if (config.headers) {
      config.headers['X-Request-ID'] = requestId;
    }
    return config;
  },

  // Add user agent and client info
  addClientInfo: (config: AxiosRequestConfig): AxiosRequestConfig => {
    if (config.headers) {
      config.headers['X-Client-Version'] = process.env.REACT_APP_VERSION || '1.0.0';
      config.headers['X-Client-Platform'] = 'web';
      config.headers['X-Client-Timezone'] = Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
    return config;
  },

  // Log requests in development
  logRequest: (config: AxiosRequestConfig): AxiosRequestConfig => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        headers: config.headers,
        data: config.data,
      });
    }
    return config;
  },
};

// Response interceptors
export const responseInterceptors = {
  // Log response time and details
  logResponse: (response: AxiosResponse): AxiosResponse => {
    const endTime = Date.now();
    const startTime = response.config.metadata?.startTime || endTime;
    const duration = endTime - startTime;

    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        duration: `${duration}ms`,
        data: response.data,
      });
    }

    // Warn about slow responses
    if (duration > 5000) {
      console.warn(`⚠️ Slow API response: ${response.config.url} took ${duration}ms`);
    }

    return response;
  },

  // Handle successful responses
  handleSuccess: (response: AxiosResponse): AxiosResponse => {
    // Cache successful GET requests
    if (response.config.method === 'get' && response.status === HTTP_STATUS.OK) {
      const cacheKey = `api_cache_${response.config.url}`;
      storage.cache.set(cacheKey, response.data, 5 * 60 * 1000); // 5 minutes
    }

    return response;
  },
};

// Error interceptors
export const errorInterceptors = {
  // Handle authentication errors
  handleAuthError: (error: AxiosError): Promise<AxiosError> => {
    if (error.response?.status === HTTP_STATUS.UNAUTHORIZED) {
      // Clear auth tokens
      storage.local.remove(STORAGE_KEYS.AUTH_TOKEN);
      storage.local.remove(STORAGE_KEYS.REFRESH_TOKEN);
      
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },

  // Handle rate limiting
  handleRateLimit: async (error: AxiosError): Promise<AxiosError> => {
    if (error.response?.status === HTTP_STATUS.TOO_MANY_REQUESTS) {
      const retryAfter = error.response.headers['retry-after'];
      const delay = retryAfter ? parseInt(retryAfter) * 1000 : 5000;
      
      console.warn(`Rate limited. Retrying after ${delay}ms`);
      
      // Wait and retry
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Increment retry count
      if (error.config.metadata) {
        error.config.metadata.retryCount = (error.config.metadata.retryCount || 0) + 1;
      }
      
      // Retry if less than 3 attempts
      if ((error.config.metadata?.retryCount || 0) < 3) {
        return Promise.resolve(error.config as any);
      }
    }
    return Promise.reject(error);
  },

  // Handle network errors
  handleNetworkError: (error: AxiosError): Promise<AxiosError> => {
    if (!error.response) {
      console.error('Network error:', error.message);
      
      // Show user-friendly message
      if (navigator.onLine === false) {
        console.warn('Device is offline');
      } else {
        console.error('Network connection failed');
      }
    }
    return Promise.reject(error);
  },

  // Handle server errors
  handleServerError: (error: AxiosError): Promise<AxiosError> => {
    if (error.response?.status && error.response.status >= 500) {
      console.error('Server error:', {
        status: error.response.status,
        message: error.response.data,
        url: error.config?.url,
      });
    }
    return Promise.reject(error);
  },

  // Log all errors
  logError: (error: AxiosError): Promise<AxiosError> => {
    const errorInfo = {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method,
      data: error.response?.data,
    };

    if (process.env.NODE_ENV === 'development') {
      console.error('❌ API Error:', errorInfo);
    }

    // Send error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error tracking service
    }

    return Promise.reject(error);
  },
};

// Combine all interceptors
export const setupInterceptors = (axiosInstance: any) => {
  // Request interceptors (executed in reverse order)
  axiosInstance.interceptors.request.use(requestInterceptors.logRequest);
  axiosInstance.interceptors.request.use(requestInterceptors.addClientInfo);
  axiosInstance.interceptors.request.use(requestInterceptors.addRequestId);
  axiosInstance.interceptors.request.use(requestInterceptors.addMetadata);
  axiosInstance.interceptors.request.use(requestInterceptors.addAuthToken);

  // Response interceptors (executed in order)
  axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => {
      response = responseInterceptors.handleSuccess(response);
      response = responseInterceptors.logResponse(response);
      return response;
    },
    (error: AxiosError) => {
      error = errorInterceptors.logError(error);
      error = errorInterceptors.handleNetworkError(error);
      error = errorInterceptors.handleServerError(error);
      error = errorInterceptors.handleRateLimit(error);
      error = errorInterceptors.handleAuthError(error);
      return Promise.reject(error);
    }
  );
};
