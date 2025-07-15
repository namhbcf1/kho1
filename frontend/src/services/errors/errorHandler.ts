// Production-ready error handling system for Vietnamese POS
import { notificationService } from '../notifications/notificationService';
import { authService } from '../auth/authService';

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  timestamp?: Date;
  userAgent?: string;
  url?: string;
  additionalData?: Record<string, any>;
}

export interface ErrorReport {
  id: string;
  message: string;
  stack?: string;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'network' | 'validation' | 'business' | 'system' | 'user' | 'payment' | 'auth';
  resolved: boolean;
  reportedAt: Date;
}

export class PosError extends Error {
  public readonly code: string;
  public readonly category: ErrorReport['category'];
  public readonly severity: ErrorReport['severity'];
  public readonly context: ErrorContext;
  public readonly userMessage: string;

  constructor(
    message: string,
    code: string,
    category: ErrorReport['category'],
    severity: ErrorReport['severity'] = 'medium',
    userMessage?: string,
    context: ErrorContext = {}
  ) {
    super(message);
    this.name = 'PosError';
    this.code = code;
    this.category = category;
    this.severity = severity;
    this.userMessage = userMessage || this.getDefaultUserMessage();
    this.context = {
      ...context,
      timestamp: new Date(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };
  }

  private getDefaultUserMessage(): string {
    switch (this.category) {
      case 'network':
        return 'Có lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.';
      case 'validation':
        return 'Dữ liệu nhập vào không hợp lệ. Vui lòng kiểm tra lại.';
      case 'business':
        return 'Có lỗi trong quy trình kinh doanh. Vui lòng thử lại.';
      case 'system':
        return 'Có lỗi hệ thống. Chúng tôi đang khắc phục.';
      case 'payment':
        return 'Có lỗi trong quá trình thanh toán. Vui lòng thử lại.';
      case 'auth':
        return 'Có lỗi xác thực. Vui lòng đăng nhập lại.';
      default:
        return 'Có lỗi xảy ra. Vui lòng thử lại sau.';
    }
  }
}

class ErrorHandler {
  private errorReports: ErrorReport[] = [];
  private maxReports = 1000;
  private retryAttempts = new Map<string, number>();
  private maxRetries = 3;

  // Initialize error handling
  init(): void {
    this.setupGlobalErrorHandlers();
    this.setupUnhandledRejectionHandler();
    this.setupReactErrorBoundary();
  }

  // Handle different types of errors
  handleError(error: Error | PosError, context: ErrorContext = {}): void {
    const errorReport = this.createErrorReport(error, context);
    this.logError(errorReport);
    this.notifyUser(errorReport);
    this.reportToServer(errorReport);
  }

  // Handle API errors specifically
  handleApiError(error: any, context: ErrorContext = {}): void {
    let posError: PosError;

    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const message = error.response.data?.message || error.message;

      if (status === 401) {
        posError = new PosError(
          'Authentication failed',
          'AUTH_FAILED',
          'auth',
          'high',
          'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
          context
        );
        this.handleAuthError();
      } else if (status === 403) {
        posError = new PosError(
          'Forbidden',
          'FORBIDDEN',
          'auth',
          'medium',
          'Bạn không có quyền thực hiện thao tác này.',
          context
        );
      } else if (status === 404) {
        posError = new PosError(
          'Resource not found',
          'NOT_FOUND',
          'business',
          'low',
          'Không tìm thấy dữ liệu yêu cầu.',
          context
        );
      } else if (status === 422) {
        posError = new PosError(
          'Validation error',
          'VALIDATION_ERROR',
          'validation',
          'low',
          'Dữ liệu nhập vào không hợp lệ.',
          context
        );
      } else if (status >= 500) {
        posError = new PosError(
          'Server error',
          'SERVER_ERROR',
          'system',
          'high',
          'Có lỗi máy chủ. Chúng tôi đang khắc phục.',
          context
        );
      } else {
        posError = new PosError(
          message,
          'API_ERROR',
          'network',
          'medium',
          undefined,
          context
        );
      }
    } else if (error.request) {
      // Network error
      posError = new PosError(
        'Network error',
        'NETWORK_ERROR',
        'network',
        'high',
        'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet.',
        context
      );
    } else {
      // Other error
      posError = new PosError(
        error.message || 'Unknown error',
        'UNKNOWN_ERROR',
        'system',
        'medium',
        undefined,
        context
      );
    }

    this.handleError(posError, context);
  }

  // Handle Vietnamese business logic errors
  handleBusinessError(
    operation: string,
    details: string,
    context: ErrorContext = {}
  ): void {
    const businessMessages: Record<string, string> = {
      'insufficient_stock': 'Không đủ hàng tồn kho để thực hiện giao dịch.',
      'invalid_price': 'Giá sản phẩm không hợp lệ.',
      'customer_not_found': 'Không tìm thấy thông tin khách hàng.',
      'invalid_payment': 'Thông tin thanh toán không hợp lệ.',
      'order_already_processed': 'Đơn hàng đã được xử lý.',
      'loyalty_points_insufficient': 'Điểm tích lũy không đủ để sử dụng.',
      'product_discontinued': 'Sản phẩm đã ngừng kinh doanh.',
      'invalid_vat_rate': 'Thuế suất VAT không hợp lệ.',
      'receipt_print_failed': 'In hóa đơn thất bại.',
      'cash_drawer_error': 'Lỗi ngăn kéo tiền mặt.',
      'barcode_scanner_error': 'Lỗi máy quét mã vạch.',
    };

    const userMessage = businessMessages[operation] || details;
    
    const posError = new PosError(
      `Business operation failed: ${operation}`,
      operation.toUpperCase(),
      'business',
      'medium',
      userMessage,
      { ...context, operation, details }
    );

    this.handleError(posError, context);
  }

  // Handle payment errors
  handlePaymentError(
    gateway: 'vnpay' | 'momo' | 'zalopay' | 'cash',
    error: string,
    transactionId?: string,
    context: ErrorContext = {}
  ): void {
    const paymentMessages: Record<string, string> = {
      'vnpay_timeout': 'Giao dịch VNPay hết thời gian chờ.',
      'momo_insufficient_balance': 'Tài khoản MoMo không đủ số dư.',
      'zalopay_network_error': 'Lỗi kết nối ZaloPay.',
      'cash_drawer_not_ready': 'Ngăn kéo tiền mặt chưa sẵn sàng.',
      'payment_declined': 'Giao dịch bị từ chối.',
      'invalid_card': 'Thẻ không hợp lệ.',
      'expired_card': 'Thẻ đã hết hạn.',
    };

    const userMessage = paymentMessages[error] || 'Có lỗi trong quá trình thanh toán.';
    
    const posError = new PosError(
      `Payment error: ${gateway} - ${error}`,
      'PAYMENT_ERROR',
      'payment',
      'high',
      userMessage,
      { ...context, gateway, transactionId, paymentError: error }
    );

    this.handleError(posError, context);

    // Show specific payment error notification
    notificationService.posTransactionError(userMessage);
  }

  // Handle authentication errors
  private handleAuthError(): void {
    // Clear auth state
    authService.logout();
    
    // Redirect to login
    setTimeout(() => {
      window.location.href = '/login';
    }, 2000);
  }

  // Retry mechanism
  canRetry(errorCode: string): boolean {
    const attempts = this.retryAttempts.get(errorCode) || 0;
    return attempts < this.maxRetries;
  }

  recordRetryAttempt(errorCode: string): void {
    const attempts = this.retryAttempts.get(errorCode) || 0;
    this.retryAttempts.set(errorCode, attempts + 1);
  }

  clearRetryAttempts(errorCode: string): void {
    this.retryAttempts.delete(errorCode);
  }

  // Create error report
  private createErrorReport(error: Error | PosError, context: ErrorContext): ErrorReport {
    const user = authService.getCurrentUser();
    
    return {
      id: this.generateErrorId(),
      message: error.message,
      stack: error.stack,
      context: {
        ...context,
        userId: user?.id,
        timestamp: new Date(),
      },
      severity: error instanceof PosError ? error.severity : 'medium',
      category: error instanceof PosError ? error.category : 'system',
      resolved: false,
      reportedAt: new Date(),
    };
  }

  // Log error locally
  private logError(errorReport: ErrorReport): void {
    console.error('[POS Error]', errorReport);
    
    // Store in local storage for offline debugging
    this.errorReports.push(errorReport);
    
    // Keep only last N reports
    if (this.errorReports.length > this.maxReports) {
      this.errorReports = this.errorReports.slice(-this.maxReports);
    }
    
    // Store in localStorage for persistence
    try {
      localStorage.setItem('pos_error_reports', JSON.stringify(this.errorReports.slice(-100)));
    } catch {
      // Handle storage quota exceeded
    }
  }

  // Notify user
  private notifyUser(errorReport: ErrorReport): void {
    const error = errorReport.message;
    const userMessage = error instanceof PosError ? error.userMessage : errorReport.message;
    
    if (errorReport.severity === 'critical') {
      notificationService.notify({
        type: 'error',
        title: 'Lỗi nghiêm trọng',
        message: userMessage,
        persistent: true,
        actions: [
          {
            label: 'Tải lại trang',
            handler: () => window.location.reload(),
          },
        ],
      });
    } else if (errorReport.severity === 'high') {
      notificationService.businessError(userMessage);
    } else if (errorReport.severity === 'medium') {
      notificationService.businessWarning(userMessage);
    }
    // Don't show low severity errors to users
  }

  // Report to server
  private async reportToServer(errorReport: ErrorReport): Promise<void> {
    try {
      // Only report high/critical errors to reduce server load
      if (errorReport.severity === 'high' || errorReport.severity === 'critical') {
        await fetch('/api/errors/report', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(errorReport),
        });
      }
    } catch {
      // Silently fail - don't want error reporting to cause more errors
    }
  }

  // Setup global error handlers
  private setupGlobalErrorHandlers(): void {
    window.onerror = (message, source, lineno, colno, error) => {
      this.handleError(
        error || new Error(message as string),
        { component: 'window', action: 'global_error' }
      );
    };
  }

  private setupUnhandledRejectionHandler(): void {
    window.onunhandledrejection = (event) => {
      this.handleError(
        new Error(event.reason),
        { component: 'window', action: 'unhandled_rejection' }
      );
    };
  }

  private setupReactErrorBoundary(): void {
    // This would be handled by ErrorBoundary components
  }

  // Utility methods
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public methods for getting error data
  getErrorReports(): ErrorReport[] {
    return [...this.errorReports];
  }

  getUnresolvedErrors(): ErrorReport[] {
    return this.errorReports.filter(report => !report.resolved);
  }

  markErrorResolved(errorId: string): void {
    const error = this.errorReports.find(report => report.id === errorId);
    if (error) {
      error.resolved = true;
    }
  }

  clearAllErrors(): void {
    this.errorReports = [];
    this.retryAttempts.clear();
    localStorage.removeItem('pos_error_reports');
  }
}

// Create singleton instance
export const errorHandler = new ErrorHandler();

// Export convenience functions
export const handleError = (error: Error | PosError, context?: ErrorContext) => {
  errorHandler.handleError(error, context);
};

export const handleApiError = (error: any, context?: ErrorContext) => {
  errorHandler.handleApiError(error, context);
};

export const handleBusinessError = (operation: string, details: string, context?: ErrorContext) => {
  errorHandler.handleBusinessError(operation, details, context);
};

export const handlePaymentError = (
  gateway: 'vnpay' | 'momo' | 'zalopay' | 'cash',
  error: string,
  transactionId?: string,
  context?: ErrorContext
) => {
  errorHandler.handlePaymentError(gateway, error, transactionId, context);
};

// Initialize error handling
errorHandler.init();

export default errorHandler;