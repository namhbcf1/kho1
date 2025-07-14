// API Client with comprehensive error handling and retry logic
import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
import { z } from 'zod';

// API Response schemas
const ApiSuccessResponseSchema = z.object({
  success: z.literal(true),
  message: z.string().optional(),
  data: z.any(),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }).optional(),
  timestamp: z.string(),
});

const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    message: z.string(),
    code: z.string(),
  }),
  timestamp: z.string(),
});

export type ApiSuccessResponse<T = any> = {
  success: true;
  message?: string;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  timestamp: string;
};

export type ApiErrorResponse = {
  success: false;
  error: {
    message: string;
    code: string;
  };
  timestamp: string;
};

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

// Custom error classes
export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends ApiError {
  constructor(message: string, cause?: Error) {
    super(message, 'NETWORK_ERROR', 0, cause);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, response?: any) {
    super(message, 'VALIDATION_ERROR', 400, response);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ApiError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found') {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class ServerError extends ApiError {
  constructor(message: string = 'Internal server error') {
    super(message, 'SERVER_ERROR', 500);
    this.name = 'ServerError';
  }
}

// Retry configuration
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  retryCondition: (error: AxiosError) => boolean;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  retryCondition: (error: AxiosError) => {
    if (!error.response) return true; // Network errors
    const status = error.response.status;
    return status >= 500 || status === 429; // Server errors or rate limiting
  },
};

// API Client class
export class ApiClient {
  private client: AxiosInstance;
  private retryConfig: RetryConfig;

  constructor(
    baseURL: string = import.meta.env.VITE_API_BASE_URL || '/api/v1',
    timeout: number = 30000,
    retryConfig: Partial<RetryConfig> = {}
  ) {
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
    
    this.client = axios.create({
      baseURL,
      timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add request ID for tracing
        config.headers['X-Request-ID'] = this.generateRequestId();

        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`, {
          params: config.params,
          data: config.data,
        });

        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor with retry logic
    this.client.interceptors.response.use(
      (response) => {
        console.log(`API Response: ${response.status} ${response.config.url}`, {
          data: response.data,
        });
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // Don't retry if we've already retried max times
        if (originalRequest._retryCount >= this.retryConfig.maxRetries) {
          return Promise.reject(this.createApiError(error));
        }

        // Check if we should retry
        if (this.retryConfig.retryCondition(error)) {
          originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

          const delay = Math.min(
            this.retryConfig.baseDelay * Math.pow(2, originalRequest._retryCount - 1),
            this.retryConfig.maxDelay
          );

          console.warn(
            `Retrying request (${originalRequest._retryCount}/${this.retryConfig.maxRetries}) in ${delay}ms:`,
            error.message
          );

          await this.sleep(delay);
          return this.client(originalRequest);
        }

        return Promise.reject(this.createApiError(error));
      }
    );
  }

  private createApiError(error: AxiosError): ApiError {
    if (!error.response) {
      return new NetworkError('Network error occurred', error);
    }

    const status = error.response.status;
    const data = error.response.data as any;

    // Try to parse error response
    let message = 'An error occurred';
    let code = 'UNKNOWN_ERROR';

    if (data && typeof data === 'object') {
      if (data.error && data.error.message) {
        message = data.error.message;
        code = data.error.code || code;
      } else if (data.message) {
        message = data.message;
      }
    }

    switch (status) {
      case 400:
        return new ValidationError(message, data);
      case 401:
        return new AuthenticationError(message);
      case 403:
        return new AuthorizationError(message);
      case 404:
        return new NotFoundError(message);
      case 429:
        return new ApiError('Too many requests', 'RATE_LIMIT_ERROR', status, data);
      case 500:
      default:
        return new ServerError(message);
    }
  }

  private getAuthToken(): string | null {
    // Get token from localStorage, sessionStorage, or wherever you store it
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Generic request method with validation
  async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    url: string,
    data?: any,
    params?: any,
    responseSchema?: z.ZodSchema<T>
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse = await this.client.request({
        method,
        url,
        data,
        params,
      });

      // Validate response structure
      const parsedResponse = ApiSuccessResponseSchema.parse(response.data);

      // Validate response data if schema provided
      if (responseSchema && parsedResponse.data) {
        try {
          parsedResponse.data = responseSchema.parse(parsedResponse.data);
        } catch (validationError) {
          console.warn('Response data validation failed:', validationError);
          // Don't throw, just log warning as server might return slightly different structure
        }
      }

      return parsedResponse as ApiResponse<T>;
    } catch (error) {
      if (error instanceof ApiError) {
        // Create error response format
        return {
          success: false,
          error: {
            message: error.message,
            code: error.code,
          },
          timestamp: new Date().toISOString(),
        };
      }
      throw error;
    }
  }

  // Convenience methods
  async get<T>(url: string, params?: any, responseSchema?: z.ZodSchema<T>): Promise<ApiResponse<T>> {
    return this.request('GET', url, undefined, params, responseSchema);
  }

  async post<T>(url: string, data?: any, responseSchema?: z.ZodSchema<T>): Promise<ApiResponse<T>> {
    return this.request('POST', url, data, undefined, responseSchema);
  }

  async put<T>(url: string, data?: any, responseSchema?: z.ZodSchema<T>): Promise<ApiResponse<T>> {
    return this.request('PUT', url, data, undefined, responseSchema);
  }

  async patch<T>(url: string, data?: any, responseSchema?: z.ZodSchema<T>): Promise<ApiResponse<T>> {
    return this.request('PATCH', url, data, undefined, responseSchema);
  }

  async delete<T>(url: string, responseSchema?: z.ZodSchema<T>): Promise<ApiResponse<T>> {
    return this.request('DELETE', url, undefined, undefined, responseSchema);
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<any>> {
    return this.get('/health');
  }

  // Set auth token
  setAuthToken(token: string) {
    localStorage.setItem('auth_token', token);
  }

  // Clear auth token
  clearAuthToken() {
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
  }

  // Get base URL
  getBaseURL(): string {
    return this.client.defaults.baseURL || '';
  }

  // Update base URL
  setBaseURL(baseURL: string) {
    this.client.defaults.baseURL = baseURL;
  }
}

// Create default client instance
export const apiClient = new ApiClient();

// Helper function to check if response is successful
export function isApiSuccess<T>(response: ApiResponse<T>): response is ApiSuccessResponse<T> {
  return response.success === true;
}

// Helper function to get error message from response
export function getErrorMessage(response: ApiResponse<any>): string {
  if (isApiSuccess(response)) {
    return '';
  }
  return response.error.message;
}

// Helper function to handle API responses with notifications
export function handleApiResponse<T>(
  response: ApiResponse<T>,
  options: {
    showSuccessMessage?: boolean;
    successMessage?: string;
    showErrorMessage?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: ApiErrorResponse['error']) => void;
  } = {}
): T | null {
  const {
    showSuccessMessage = false,
    successMessage,
    showErrorMessage = true,
    onSuccess,
    onError,
  } = options;

  if (isApiSuccess(response)) {
    if (showSuccessMessage && (successMessage || response.message)) {
      // You can integrate with your notification system here
      console.log('Success:', successMessage || response.message);
    }
    
    if (onSuccess) {
      onSuccess(response.data);
    }
    
    return response.data;
  } else {
    if (showErrorMessage) {
      // You can integrate with your notification system here
      console.error('API Error:', response.error.message);
    }
    
    if (onError) {
      onError(response.error);
    }
    
    return null;
  }
}

export default apiClient;