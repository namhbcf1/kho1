/**
 * Secure API client with CSRF protection, token management,
 * and proper error handling for production
 */
import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../../constants/api';
import { logger } from '../../utils/logger';
import { tokenService } from '../auth/tokenService';

// Create a scoped logger for API operations
const apiLogger = logger.createScopedLogger('api');

// CSRF token storage
let csrfToken: string | null = null;

// Create axios instance with default config
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Include cookies for CSRF
});

/**
 * Request interceptor for API calls
 */
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Get auth token and add to headers if available
    const token = tokenService.getStoredToken();
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }

    // Add CSRF token to state-changing requests
    const isStateChangingMethod = ['post', 'put', 'delete', 'patch'].includes(
      config.method?.toLowerCase() || ''
    );

    if (isStateChangingMethod) {
      // If we don't have a CSRF token yet, fetch one
      if (!csrfToken) {
        try {
          await fetchCsrfToken();
        } catch (error) {
          apiLogger.error('Failed to fetch CSRF token', { 
            error: error instanceof Error ? error.message : String(error) 
          });
        }
      }

      // Add CSRF token to headers if available
      if (csrfToken) {
        config.headers.set('X-CSRF-Token', csrfToken);
      }
    }

    // Add client information
    config.headers.set('X-Client-Version', process.env.VITE_APP_VERSION || '1.0.0');
    config.headers.set('X-Client-Platform', 'web');

    return config;
  },
  (error) => {
    apiLogger.error('Request interceptor error', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    return Promise.reject(error);
  }
);

/**
 * Response interceptor for API calls
 */
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    // Extract CSRF token from response headers if present
    const responseCsrfToken = response.headers['x-csrf-token'];
    if (responseCsrfToken) {
      csrfToken = responseCsrfToken as string;
    }

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized errors (token expired)
    if (error.response?.status === 401 && originalRequest) {
      // Avoid infinite retry loops
      if (!(originalRequest as any)._retry) {
        (originalRequest as any)._retry = true;
        
        try {
          // Try to refresh the token
          const refreshToken = tokenService.getStoredRefreshToken();
          if (refreshToken) {
            // Call token refresh endpoint directly to avoid circular dependencies
            const response = await axios.post(
              `${API_BASE_URL}/auth/refresh`,
              { refreshToken },
              { withCredentials: true }
            );
            
            if (response.data.success && response.data.tokens) {
              // Store new tokens
              tokenService.storeToken(response.data.tokens.accessToken);
              tokenService.storeRefreshToken(response.data.tokens.refreshToken);
              
              // Update Authorization header with new token
              if (originalRequest.headers) {
                originalRequest.headers['Authorization'] = `Bearer ${response.data.tokens.accessToken}`;
              }
              
              // Retry the original request
              return axiosInstance(originalRequest);
            }
          }
        } catch (refreshError) {
          apiLogger.error('Token refresh failed', { 
            error: refreshError instanceof Error ? refreshError.message : String(refreshError) 
          });
          
          // Clear tokens on refresh failure
          tokenService.clearTokens();
          
          // Redirect to login page
          window.location.href = '/auth/login?session=expired';
        }
      }
    }
    
    // Handle CSRF errors
    if (error.response?.status === 403 && 
        typeof error.response?.data === 'object' &&
        error.response?.data !== null &&
        'message' in error.response.data &&
        typeof error.response.data.message === 'string' &&
        error.response.data.message.includes('CSRF')) {
      // CSRF token might be invalid or expired, fetch a new one
      csrfToken = null;
      
      apiLogger.security('csrf.invalid', { 
        url: originalRequest?.url,
        method: originalRequest?.method 
      });
      
      // Retry the request once with a new CSRF token
      if (originalRequest && !(originalRequest as any)._csrfRetry) {
        (originalRequest as any)._csrfRetry = true;
        
        try {
          await fetchCsrfToken();
          
          if (csrfToken && originalRequest.headers) {
            originalRequest.headers['X-CSRF-Token'] = csrfToken;
            return axiosInstance(originalRequest);
          }
        } catch (csrfError) {
          apiLogger.error('CSRF token refresh failed', { 
            error: csrfError instanceof Error ? csrfError.message : String(csrfError) 
          });
        }
      }
    }
    
    // Log all API errors
    logApiError(error);
    
    return Promise.reject(error);
  }
);

/**
 * Fetch a new CSRF token from the server
 */
async function fetchCsrfToken(): Promise<string | null> {
  try {
    const response = await axios.get(`${API_BASE_URL}/auth/csrf-token`, {
      withCredentials: true,
    });
    
    if (response.data.token) {
      csrfToken = response.data.token;
      return csrfToken;
    }
    
    return null;
  } catch (error) {
    apiLogger.error('Failed to fetch CSRF token', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    return null;
  }
}

/**
 * Log API errors with proper context
 */
function logApiError(error: AxiosError): void {
  const errorContext = {
    url: error.config?.url,
    method: error.config?.method,
    status: error.response?.status,
    statusText: error.response?.statusText,
    message: error.response?.data && typeof error.response.data === 'object' && 'message' in error.response.data 
      ? String(error.response.data.message) 
      : error.message,
  };
  
  // Log security-related errors separately
  if (error.response?.status === 401 || error.response?.status === 403) {
    apiLogger.security('api.auth.error', errorContext);
  } else if (error.response?.status === 429) {
    apiLogger.warn('api.rate_limit', errorContext);
  } else if (error.response?.status && error.response.status >= 500) {
    apiLogger.error('api.server_error', errorContext);
  } else {
    apiLogger.error('api.request_failed', errorContext);
  }
}

// Export the configured axios instance
export const apiClient = axiosInstance;

// Export convenience methods
export const api = {
  get: <T = any>(url: string, config?: any) => 
    apiClient.get<T>(url, config),
  
  post: <T = any>(url: string, data?: any, config?: any) => 
    apiClient.post<T>(url, data, config),
  
  put: <T = any>(url: string, data?: any, config?: any) => 
    apiClient.put<T>(url, data, config),
  
  patch: <T = any>(url: string, data?: any, config?: any) => 
    apiClient.patch<T>(url, data, config),
  
  delete: <T = any>(url: string, config?: any) => 
    apiClient.delete<T>(url, config),
  
  // Fetch CSRF token manually if needed
  fetchCsrfToken,
};