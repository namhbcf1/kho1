// Production error handling utilities
import { message } from 'antd';
import { AxiosError } from 'axios';

// Production error types
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',
  SERVER = 'SERVER',
  RATE_LIMIT = 'RATE_LIMIT',
  UNKNOWN = 'UNKNOWN',
}

export interface ProductionError {
  type: ErrorType;
  message: string;
  code?: string;
  details?: Record<string, any>;
  timestamp: string;
  requestId?: string;
}

// Vietnamese error messages for production
const VIETNAMESE_ERROR_MESSAGES = {
  [ErrorType.NETWORK]: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.',
  [ErrorType.AUTHENTICATION]: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  [ErrorType.AUTHORIZATION]: 'Bạn không có quyền thực hiện thao tác này.',
  [ErrorType.VALIDATION]: 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.',
  [ErrorType.BUSINESS_LOGIC]: 'Không thể thực hiện thao tác này do vi phạm quy tắc kinh doanh.',
  [ErrorType.SERVER]: 'Lỗi máy chủ. Vui lòng thử lại sau.',
  [ErrorType.RATE_LIMIT]: 'Quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.',
  [ErrorType.UNKNOWN]: 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.',
} as const;

/**
 * Convert API error to production error
 */
export const parseApiError = (error: AxiosError): ProductionError => {
  const timestamp = new Date().toISOString();
  const requestId = error.config?.headers?.['X-Request-ID'] as string;

  if (!error.response) {
    // Network error
    return {
      type: ErrorType.NETWORK,
      message: VIETNAMESE_ERROR_MESSAGES[ErrorType.NETWORK],
      timestamp,
      requestId,
    };
  }

  const { status, data } = error.response;
  const errorData = data as any;

  switch (status) {
    case 400:
      return {
        type: ErrorType.VALIDATION,
        message: errorData?.message || VIETNAMESE_ERROR_MESSAGES[ErrorType.VALIDATION],
        code: errorData?.code,
        details: errorData?.details,
        timestamp,
        requestId,
      };

    case 401:
      return {
        type: ErrorType.AUTHENTICATION,
        message: VIETNAMESE_ERROR_MESSAGES[ErrorType.AUTHENTICATION],
        timestamp,
        requestId,
      };

    case 403:
      return {
        type: ErrorType.AUTHORIZATION,
        message: VIETNAMESE_ERROR_MESSAGES[ErrorType.AUTHORIZATION],
        timestamp,
        requestId,
      };

    case 422:
      return {
        type: ErrorType.BUSINESS_LOGIC,
        message: errorData?.message || VIETNAMESE_ERROR_MESSAGES[ErrorType.BUSINESS_LOGIC],
        code: errorData?.code,
        details: errorData?.details,
        timestamp,
        requestId,
      };

    case 429:
      return {
        type: ErrorType.RATE_LIMIT,
        message: VIETNAMESE_ERROR_MESSAGES[ErrorType.RATE_LIMIT],
        timestamp,
        requestId,
      };

    case 500:
    case 502:
    case 503:
    case 504:
      return {
        type: ErrorType.SERVER,
        message: VIETNAMESE_ERROR_MESSAGES[ErrorType.SERVER],
        code: status.toString(),
        timestamp,
        requestId,
      };

    default:
      return {
        type: ErrorType.UNKNOWN,
        message: errorData?.message || VIETNAMESE_ERROR_MESSAGES[ErrorType.UNKNOWN],
        code: status.toString(),
        timestamp,
        requestId,
      };
  }
};

/**
 * Handle production errors with user-friendly messages
 */
export const handleProductionError = (error: Error | AxiosError): void => {
  let productionError: ProductionError;

  if (error.name === 'AxiosError') {
    productionError = parseApiError(error as AxiosError);
  } else {
    productionError = {
      type: ErrorType.UNKNOWN,
      message: error.message || VIETNAMESE_ERROR_MESSAGES[ErrorType.UNKNOWN],
      timestamp: new Date().toISOString(),
    };
  }

  // Show user-friendly message
  showErrorMessage(productionError);

  // Log error for monitoring
  logProductionError(productionError, error);

  // Handle specific error types
  handleSpecificErrorType(productionError);
};

/**
 * Show error message to user
 */
const showErrorMessage = (error: ProductionError): void => {
  switch (error.type) {
    case ErrorType.AUTHENTICATION:
      message.error(error.message, 5);
      break;

    case ErrorType.AUTHORIZATION:
      message.warning(error.message, 5);
      break;

    case ErrorType.VALIDATION:
      message.warning(error.message, 3);
      break;

    case ErrorType.RATE_LIMIT:
      message.warning(error.message, 10);
      break;

    case ErrorType.SERVER:
      message.error(error.message, 5);
      break;

    default:
      message.error(error.message, 3);
  }
};

/**
 * Log production error for monitoring
 */
const logProductionError = (productionError: ProductionError, originalError: Error): void => {
  // Send to backend logging service
  fetch('/api/logs/frontend-error', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...productionError,
      originalError: {
        name: originalError.name,
        message: originalError.message,
        stack: originalError.stack,
      },
      userAgent: navigator.userAgent,
      url: window.location.href,
    }),
  }).catch(() => {
    // Silently fail if logging service is unavailable
    // Don't show error to user for logging failures
  });
};

/**
 * Handle specific error types with appropriate actions
 */
const handleSpecificErrorType = (error: ProductionError): void => {
  switch (error.type) {
    case ErrorType.AUTHENTICATION:
      // Redirect to login after a delay
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      break;

    case ErrorType.RATE_LIMIT:
      // Disable UI temporarily
      // This could be implemented with a global state
      break;

    case ErrorType.NETWORK:
      // Could implement retry logic or offline mode
      break;

    default:
      // No specific action needed
      break;
  }
};

/**
 * Create production-safe error for business logic
 */
export const createBusinessError = (message: string, code?: string): ProductionError => {
  return {
    type: ErrorType.BUSINESS_LOGIC,
    message,
    code,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Create production-safe validation error
 */
export const createValidationError = (
  message: string,
  details?: Record<string, string[]>
): ProductionError => {
  return {
    type: ErrorType.VALIDATION,
    message,
    details,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Global error boundary handler
 */
export const handleGlobalError = (error: Error, errorInfo?: any): void => {
  const productionError: ProductionError = {
    type: ErrorType.UNKNOWN,
    message: 'Ứng dụng gặp lỗi không mong muốn. Trang sẽ được tải lại.',
    timestamp: new Date().toISOString(),
    details: {
      componentStack: errorInfo?.componentStack,
    },
  };

  // Log critical error
  logProductionError(productionError, error);

  // Show error message
  message.error(productionError.message, 10);

  // Reload page after delay for critical errors
  setTimeout(() => {
    window.location.reload();
  }, 5000);
};
