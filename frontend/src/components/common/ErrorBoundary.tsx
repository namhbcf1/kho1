// Error Boundary component for graceful error handling
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, Button, Card } from 'antd';
import { ReloadOutlined, BugOutlined } from '@ant-design/icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report to error tracking service (e.g., Sentry)
    // reportError(error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback component if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Card className="m-4">
          <Alert
            message="Đã xảy ra lỗi"
            description="Có lỗi xảy ra khi hiển thị nội dung này. Vui lòng thử lại."
            type="error"
            showIcon
            icon={<BugOutlined />}
            action={
              <div className="space-x-2">
                <Button size="small" onClick={this.handleRetry} icon={<ReloadOutlined />}>
                  Thử lại
                </Button>
                <Button size="small" type="primary" onClick={this.handleReload}>
                  Tải lại trang
                </Button>
              </div>
            }
          />
          
          {this.props.showDetails && this.state.error && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-gray-600 mb-2">
                Chi tiết lỗi (dành cho developer)
              </summary>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </Card>
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with error boundary
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Specific error boundary for charts
export const ChartErrorBoundary: React.FC<{ children: ReactNode; chartName?: string }> = ({ 
  children, 
  chartName = 'biểu đồ' 
}) => {
  return (
    <ErrorBoundary
      fallback={
        <Alert
          message={`Lỗi hiển thị ${chartName}`}
          description={`Không thể hiển thị ${chartName}. Vui lòng thử tải lại trang.`}
          type="warning"
          showIcon
          action={
            <Button size="small" onClick={() => window.location.reload()} icon={<ReloadOutlined />}>
              Tải lại
            </Button>
          }
        />
      }
      onError={(error, errorInfo) => {
        console.error(`Chart error in ${chartName}:`, error, errorInfo);
        // Report chart-specific errors
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

export default ErrorBoundary;