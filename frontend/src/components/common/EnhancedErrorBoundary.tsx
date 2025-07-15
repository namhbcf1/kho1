// Enhanced Error Boundary with Vietnamese POS features
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Result, Button, Typography, Collapse, Space, Alert } from 'antd';
import { 
  BugOutlined, 
  ReloadOutlined, 
  HomeOutlined, 
  PhoneOutlined,
  WarningOutlined 
} from '@ant-design/icons';
import { errorHandler, PosError, ErrorContext } from '../../services/errors/errorHandler';
import { notificationService } from '../../services/notifications/notificationService';

const { Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showErrorDetails?: boolean;
  level?: 'page' | 'component' | 'critical';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  isRetrying: boolean;
}

export class EnhancedErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private readonly maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      isRetrying: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `boundary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, level = 'component' } = this.props;
    
    // Create error context
    const context: ErrorContext = {
      component: 'ErrorBoundary',
      action: 'component_error',
      additionalData: {
        componentStack: errorInfo.componentStack,
        level,
        retryCount: this.retryCount,
      },
    };

    // Create PosError for better categorization
    const posError = new PosError(
      error.message,
      'COMPONENT_ERROR',
      'system',
      level === 'critical' ? 'critical' : 'high',
      this.getUserFriendlyMessage(error, level),
      context
    );

    // Handle the error
    errorHandler.handleError(posError, context);

    // Update state
    this.setState({
      errorInfo,
    });

    // Call custom error handler
    onError?.(error, errorInfo);

    // Show notification for critical errors
    if (level === 'critical') {
      notificationService.notify({
        type: 'error',
        title: 'Lỗi nghiêm trọng',
        message: 'Ứng dụng gặp lỗi nghiêm trọng. Vui lòng tải lại trang.',
        persistent: true,
        actions: [
          {
            label: 'Tải lại',
            handler: () => window.location.reload(),
          },
        ],
      });
    }
  }

  private getUserFriendlyMessage(error: Error, level: string): string {
    if (level === 'critical') {
      return 'Ứng dụng POS gặp lỗi nghiêm trọng. Vui lòng liên hệ hỗ trợ kỹ thuật.';
    }
    
    if (error.message.includes('ChunkLoadError') || error.message.includes('Loading chunk')) {
      return 'Có cập nhật mới. Vui lòng tải lại trang để sử dụng phiên bản mới nhất.';
    }
    
    if (error.message.includes('Network Error')) {
      return 'Mất kết nối internet. Vui lòng kiểm tra kết nối và thử lại.';
    }
    
    return 'Một phần của ứng dụng gặp lỗi. Vui lòng thử lại hoặc tải lại trang.';
  }

  private handleRetry = async () => {
    if (this.retryCount >= this.maxRetries) {
      notificationService.businessError('Đã thử lại quá nhiều lần. Vui lòng tải lại trang.');
      return;
    }

    this.setState({ isRetrying: true });
    this.retryCount++;

    // Wait a bit before retrying
    await new Promise(resolve => setTimeout(resolve, 1000));

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      isRetrying: false,
    });

    notificationService.businessInfo('Đang thử lại...');
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  private handleContactSupport = () => {
    // In a real app, this might open a support chat or email
    const subject = encodeURIComponent('Lỗi hệ thống POS');
    const body = encodeURIComponent(
      `Mã lỗi: ${this.state.errorId}\n` +
      `Thời gian: ${new Date().toLocaleString('vi-VN')}\n` +
      `Lỗi: ${this.state.error?.message}\n` +
      `Trang: ${window.location.href}`
    );
    
    window.open(`mailto:support@yourpos.com?subject=${subject}&body=${body}`);
  };

  private renderErrorDetails() {
    const { error, errorInfo } = this.state;
    const { showErrorDetails = false } = this.props;

    if (!showErrorDetails || !error) return null;

    return (
      <Collapse ghost>
        <Panel header="Chi tiết lỗi (dành cho kỹ thuật viên)" key="details">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Alert
              type="warning"
              message="Thông tin này chỉ dành cho nhân viên kỹ thuật"
              banner
            />
            
            <div>
              <Text strong>Lỗi:</Text>
              <Paragraph code copyable>
                {error.message}
              </Paragraph>
            </div>

            {error.stack && (
              <div>
                <Text strong>Stack trace:</Text>
                <Paragraph code copyable style={{ fontSize: '12px' }}>
                  {error.stack}
                </Paragraph>
              </div>
            )}

            {errorInfo?.componentStack && (
              <div>
                <Text strong>Component stack:</Text>
                <Paragraph code style={{ fontSize: '12px' }}>
                  {errorInfo.componentStack}
                </Paragraph>
              </div>
            )}

            <div>
              <Text strong>Mã lỗi:</Text>
              <Text code copyable style={{ marginLeft: 8 }}>
                {this.state.errorId}
              </Text>
            </div>

            <div>
              <Text strong>Thời gian:</Text>
              <Text style={{ marginLeft: 8 }}>
                {new Date().toLocaleString('vi-VN')}
              </Text>
            </div>
          </Space>
        </Panel>
      </Collapse>
    );
  }

  private renderErrorActions() {
    const { level = 'component' } = this.props;
    const { isRetrying } = this.state;
    const canRetry = this.retryCount < this.maxRetries;

    return (
      <Space>
        {canRetry && level !== 'critical' && (
          <Button 
            type="primary" 
            icon={<ReloadOutlined />}
            onClick={this.handleRetry}
            loading={isRetrying}
          >
            Thử lại
          </Button>
        )}
        
        <Button 
          icon={<ReloadOutlined />}
          onClick={this.handleReload}
        >
          Tải lại trang
        </Button>
        
        {level !== 'page' && (
          <Button 
            icon={<HomeOutlined />}
            onClick={this.handleGoHome}
          >
            Về trang chủ
          </Button>
        )}
        
        <Button 
          icon={<PhoneOutlined />}
          onClick={this.handleContactSupport}
          type="dashed"
        >
          Liên hệ hỗ trợ
        </Button>
      </Space>
    );
  }

  render() {
    const { hasError, error } = this.state;
    const { children, fallback, level = 'component' } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Determine error display based on level
      const getResultProps = () => {
        switch (level) {
          case 'critical':
            return {
              status: 'error' as const,
              title: 'Hệ thống POS gặp lỗi nghiêm trọng',
              subTitle: 'Ứng dụng không thể hoạt động. Vui lòng liên hệ bộ phận kỹ thuật ngay lập tức.',
              icon: <WarningOutlined style={{ color: '#ff4d4f' }} />,
            };
          case 'page':
            return {
              status: 'error' as const,
              title: 'Trang này gặp lỗi',
              subTitle: 'Không thể tải nội dung trang. Vui lòng thử lại hoặc quay về trang chủ.',
              icon: <BugOutlined />,
            };
          default:
            return {
              status: 'warning' as const,
              title: 'Một phần giao diện gặp lỗi',
              subTitle: 'Một số tính năng có thể không hoạt động. Vui lòng thử lại.',
              icon: <BugOutlined />,
            };
        }
      };

      const resultProps = getResultProps();

      return (
        <div style={{ padding: level === 'component' ? '20px' : '40px' }}>
          <Result
            {...resultProps}
            extra={this.renderErrorActions()}
          >
            {this.renderErrorDetails()}
            
            {/* Business continuity message */}
            {level === 'critical' && (
              <Alert
                type="info"
                message="Chế độ offline"
                description="Hệ thống sẽ tự động chuyển sang chế độ offline để đảm bảo hoạt động kinh doanh liên tục."
                showIcon
                style={{ marginTop: 16, textAlign: 'left' }}
              />
            )}
          </Result>
        </div>
      );
    }

    return children;
  }
}

// Higher-order component for easier usage
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <EnhancedErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </EnhancedErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

export default EnhancedErrorBoundary;