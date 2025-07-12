// Cloudflare error handling utilities
import { notification } from 'antd';

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
  timestamp?: string;
}

export interface CloudflareError extends ApiError {
  ray_id?: string;
  cf_cache_status?: string;
  cf_ray?: string;
}

export class ApiErrorHandler {
  private static instance: ApiErrorHandler;
  
  public static getInstance(): ApiErrorHandler {
    if (!ApiErrorHandler.instance) {
      ApiErrorHandler.instance = new ApiErrorHandler();
    }
    return ApiErrorHandler.instance;
  }

  public handleError(error: any): ApiError {
    // Network errors
    if (!navigator.onLine) {
      return this.createError(
        'Không có kết nối internet. Vui lòng kiểm tra kết nối mạng.',
        'NETWORK_OFFLINE',
        0
      );
    }

    // Axios/Fetch errors
    if (error.response) {
      return this.handleHttpError(error.response);
    }

    if (error.request) {
      return this.createError(
        'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.',
        'NETWORK_ERROR',
        0
      );
    }

    // Cloudflare specific errors
    if (error.cf_ray || error.ray_id) {
      return this.handleCloudflareError(error);
    }

    // Generic errors
    return this.createError(
      error.message || 'Đã xảy ra lỗi không xác định',
      'UNKNOWN_ERROR',
      500
    );
  }

  private handleHttpError(response: any): ApiError {
    const status = response.status;
    const data = response.data;

    switch (status) {
      case 400:
        return this.createError(
          data?.message || 'Dữ liệu không hợp lệ',
          'BAD_REQUEST',
          400,
          data?.details
        );

      case 401:
        return this.createError(
          'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
          'UNAUTHORIZED',
          401
        );

      case 403:
        return this.createError(
          'Bạn không có quyền thực hiện hành động này',
          'FORBIDDEN',
          403
        );

      case 404:
        return this.createError(
          'Không tìm thấy tài nguyên yêu cầu',
          'NOT_FOUND',
          404
        );

      case 409:
        return this.createError(
          data?.message || 'Dữ liệu đã tồn tại hoặc xung đột',
          'CONFLICT',
          409,
          data?.details
        );

      case 422:
        return this.createError(
          'Dữ liệu không hợp lệ',
          'VALIDATION_ERROR',
          422,
          data?.errors
        );

      case 429:
        return this.createError(
          'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
          'RATE_LIMITED',
          429
        );

      case 500:
        return this.createError(
          'Lỗi máy chủ nội bộ. Vui lòng thử lại sau.',
          'INTERNAL_SERVER_ERROR',
          500
        );

      case 502:
        return this.createError(
          'Máy chủ tạm thời không khả dụng. Vui lòng thử lại sau.',
          'BAD_GATEWAY',
          502
        );

      case 503:
        return this.createError(
          'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.',
          'SERVICE_UNAVAILABLE',
          503
        );

      case 504:
        return this.createError(
          'Yêu cầu quá thời gian chờ. Vui lòng thử lại.',
          'GATEWAY_TIMEOUT',
          504
        );

      default:
        return this.createError(
          data?.message || `Lỗi HTTP ${status}`,
          'HTTP_ERROR',
          status,
          data
        );
    }
  }

  private handleCloudflareError(error: CloudflareError): CloudflareError {
    const baseError = this.createError(
      error.message || 'Lỗi từ Cloudflare',
      error.code || 'CLOUDFLARE_ERROR',
      error.status || 500,
      error.details
    );

    return {
      ...baseError,
      ray_id: error.ray_id,
      cf_cache_status: error.cf_cache_status,
      cf_ray: error.cf_ray,
    };
  }

  private createError(
    message: string,
    code: string,
    status: number,
    details?: any
  ): ApiError {
    return {
      message,
      code,
      status,
      details,
      timestamp: new Date().toISOString(),
    };
  }

  public showErrorNotification(error: ApiError): void {
    const isNetworkError = error.code === 'NETWORK_OFFLINE' || error.code === 'NETWORK_ERROR';
    const isServerError = error.status && error.status >= 500;

    notification.error({
      message: this.getErrorTitle(error),
      description: error.message,
      duration: isNetworkError || isServerError ? 0 : 4.5, // Persistent for network/server errors
      placement: 'topRight',
    });
  }

  private getErrorTitle(error: ApiError): string {
    switch (error.code) {
      case 'NETWORK_OFFLINE':
      case 'NETWORK_ERROR':
        return 'Lỗi kết nối';
      case 'UNAUTHORIZED':
        return 'Lỗi xác thực';
      case 'FORBIDDEN':
        return 'Không có quyền';
      case 'NOT_FOUND':
        return 'Không tìm thấy';
      case 'VALIDATION_ERROR':
        return 'Lỗi dữ liệu';
      case 'RATE_LIMITED':
        return 'Quá tải';
      case 'INTERNAL_SERVER_ERROR':
      case 'BAD_GATEWAY':
      case 'SERVICE_UNAVAILABLE':
      case 'GATEWAY_TIMEOUT':
        return 'Lỗi máy chủ';
      default:
        return 'Lỗi hệ thống';
    }
  }

  public isRetryableError(error: ApiError): boolean {
    const retryableCodes = [
      'NETWORK_ERROR',
      'RATE_LIMITED',
      'INTERNAL_SERVER_ERROR',
      'BAD_GATEWAY',
      'SERVICE_UNAVAILABLE',
      'GATEWAY_TIMEOUT',
    ];

    return retryableCodes.includes(error.code || '');
  }

  public getRetryDelay(attempt: number): number {
    // Exponential backoff with jitter
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    
    // Add jitter (±25%)
    const jitter = delay * 0.25 * (Math.random() - 0.5);
    
    return Math.round(delay + jitter);
  }

  public shouldShowToUser(error: ApiError): boolean {
    // Don't show certain technical errors to users
    const hiddenCodes = [
      'CLOUDFLARE_ERROR',
      'INTERNAL_SERVER_ERROR',
    ];

    return !hiddenCodes.includes(error.code || '');
  }
}

// Singleton instance
export const errorHandler = ApiErrorHandler.getInstance();

// Convenience functions
export const handleApiError = (error: any): ApiError => {
  return errorHandler.handleError(error);
};

export const showErrorNotification = (error: ApiError): void => {
  errorHandler.showErrorNotification(error);
};

export const isRetryableError = (error: ApiError): boolean => {
  return errorHandler.isRetryableError(error);
};

export const getRetryDelay = (attempt: number): number => {
  return errorHandler.getRetryDelay(attempt);
};
