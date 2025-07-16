// Real-Time Error Boundary with Network Connectivity Handling
import React, { Component, ReactNode } from 'react';
import { Result, Button, Alert, Card, Space, Typography, Tag } from 'antd';
import { 
  ReloadOutlined, 
  ExceptionOutlined, 
  WifiOutlined,
  DisconnectOutlined,
  WarningOutlined 
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onRetry?: () => void;
  showNetworkStatus?: boolean;
  enableAutoRetry?: boolean;
  retryDelay?: number;
  maxRetries?: number;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
  isRetrying: boolean;
  networkStatus: 'online' | 'offline' | 'slow' | 'unknown';
  lastErrorTime: number;
  errorHistory: Array<{
    error: string;
    timestamp: number;
    resolved: boolean;
  }>;
}

export class RealTimeErrorBoundary extends Component<Props, State> {
  private retryTimer: NodeJS.Timeout | null = null;
  private networkMonitor: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
      networkStatus: navigator.onLine ? 'online' : 'offline',
      lastErrorTime: 0,
      errorHistory: []
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      lastErrorTime: Date.now()
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState(prevState => ({
      errorInfo,
      errorHistory: [
        ...prevState.errorHistory,
        {
          error: error.message,
          timestamp: Date.now(),
          resolved: false
        }
      ].slice(-10) // Keep last 10 errors
    }));

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error for debugging
    console.error('RealTimeErrorBoundary caught an error:', error);
    console.error('Error info:', errorInfo);

    // Auto-retry if enabled
    if (this.props.enableAutoRetry && this.state.retryCount < (this.props.maxRetries || 3)) {
      this.scheduleRetry();
    }
  }

  componentDidMount() {
    // Monitor network status
    this.startNetworkMonitoring();
    
    // Setup network event listeners
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  componentWillUnmount() {
    // Cleanup
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
    if (this.networkMonitor) {
      clearInterval(this.networkMonitor);
    }
    
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }

  private startNetworkMonitoring = () => {
    this.updateNetworkStatus();
    
    this.networkMonitor = setInterval(() => {
      this.updateNetworkStatus();
    }, 5000);
  };

  private updateNetworkStatus = () => {
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    let networkStatus: State['networkStatus'] = 'unknown';
    
    if (!navigator.onLine) {
      networkStatus = 'offline';
    } else if (connection) {
      const effectiveType = connection.effectiveType;
      if (effectiveType === 'slow-2g' || effectiveType === '2g') {
        networkStatus = 'slow';
      } else {
        networkStatus = 'online';
      }
    } else {
      networkStatus = 'online';
    }

    this.setState({ networkStatus });
  };

  private handleOnline = () => {
    this.setState({ networkStatus: 'online' });
    
    // Auto-retry when back online
    if (this.state.hasError && this.props.enableAutoRetry) {
      this.scheduleRetry();
    }
  };

  private handleOffline = () => {
    this.setState({ networkStatus: 'offline' });
  };

  private scheduleRetry = () => {
    const delay = this.props.retryDelay || 3000;
    const backoffDelay = delay * Math.pow(2, this.state.retryCount);
    
    this.setState({ isRetrying: true });
    
    this.retryTimer = setTimeout(() => {
      this.handleRetry();
    }, backoffDelay);
  };

  private handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
      isRetrying: false,
      errorHistory: prevState.errorHistory.map(err => ({
        ...err,
        resolved: true
      }))
    }));

    // Call custom retry handler
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  private handleManualRetry = () => {
    this.setState({ retryCount: 0 });
    this.handleRetry();
  };

  private getErrorSeverity = (error: Error): 'low' | 'medium' | 'high' | 'critical' => {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return 'medium';
    }
    if (errorMessage.includes('websocket') || errorMessage.includes('connection')) {
      return 'high';
    }
    if (errorMessage.includes('critical') || errorMessage.includes('fatal')) {
      return 'critical';
    }
    
    return 'low';
  };

  private getNetworkStatusColor = (status: State['networkStatus']): string => {
    switch (status) {
      case 'online': return '#52c41a';
      case 'offline': return '#ff4d4f';
      case 'slow': return '#faad14';
      default: return '#8c8c8c';
    }
  };

  private getNetworkStatusIcon = (status: State['networkStatus']) => {
    switch (status) {
      case 'online': return <WifiOutlined />;
      case 'offline': return <DisconnectOutlined />;
      case 'slow': return <WifiOutlined />;
      default: return <WifiOutlined />;
    }
  };

  private getErrorSuggestion = (error: Error): string => {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return 'Vui lòng kiểm tra kết nối mạng và thử lại.';
    }
    if (errorMessage.includes('websocket')) {
      return 'Kết nối thời gian thực bị gián đoạn. Hệ thống sẽ tự động kết nối lại.';
    }
    if (errorMessage.includes('timeout')) {
      return 'Yêu cầu quá thời gian chờ. Vui lòng thử lại sau.';
    }
    if (errorMessage.includes('unauthorized')) {
      return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    }
    
    return 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại hoặc liên hệ hỗ trợ.';
  };

  render() {
    if (this.state.hasError && this.props.fallback) {
      return this.props.fallback;
    }

    if (this.state.hasError) {
      const { error, retryCount, isRetrying, networkStatus, errorHistory } = this.state;
      const maxRetries = this.props.maxRetries || 3;
      const severity = error ? this.getErrorSeverity(error) : 'low';
      const suggestion = error ? this.getErrorSuggestion(error) : '';

      return (
        <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
          {/* Network Status Alert */}
          {this.props.showNetworkStatus && (
            <Alert
              message={
                <Space>
                  {this.getNetworkStatusIcon(networkStatus)}
                  <Text>
                    Trạng thái mạng: {
                      networkStatus === 'online' ? 'Trực tuyến' :
                      networkStatus === 'offline' ? 'Ngoại tuyến' :
                      networkStatus === 'slow' ? 'Mạng chậm' :
                      'Không xác định'
                    }
                  </Text>
                </Space>
              }
              type={networkStatus === 'online' ? 'success' : 'warning'}
              style={{ marginBottom: '16px' }}
            />
          )}

          {/* Main Error Display */}
          <Result
            status="error"
            icon={<ExceptionOutlined />}
            title="Lỗi Thời Gian Thực"
            subTitle={
              <Space direction="vertical" size="small">
                <Text>Dashboard thời gian thực gặp sự cố.</Text>
                <Tag color={
                  severity === 'critical' ? 'red' :
                  severity === 'high' ? 'orange' :
                  severity === 'medium' ? 'yellow' :
                  'blue'
                }>
                  {severity === 'critical' ? 'Nghiêm trọng' :
                   severity === 'high' ? 'Cao' :
                   severity === 'medium' ? 'Trung bình' :
                   'Thấp'}
                </Tag>
              </Space>
            }
            extra={
              <Space direction="vertical" size="large">
                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={this.handleManualRetry}
                  loading={isRetrying}
                  disabled={isRetrying}
                >
                  {isRetrying ? 'Đang thử lại...' : 'Thử lại'}
                </Button>
                
                {retryCount > 0 && (
                  <Text type="secondary">
                    Đã thử lại: {retryCount}/{maxRetries}
                  </Text>
                )}
              </Space>
            }
          />

          {/* Error Details */}
          <Card title="Chi tiết lỗi" style={{ marginTop: '24px' }}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Alert
                message="Gợi ý giải quyết"
                description={suggestion}
                type="info"
                showIcon
              />
              
              {error && (
                <div>
                  <Title level={5}>Thông tin lỗi:</Title>
                  <Paragraph code>
                    {error.message}
                  </Paragraph>
                </div>
              )}
              
              {errorHistory.length > 0 && (
                <div>
                  <Title level={5}>Lịch sử lỗi:</Title>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    {errorHistory.slice(-3).map((err, index) => (
                      <div key={index} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px',
                        background: '#f5f5f5',
                        borderRadius: '4px'
                      }}>
                        <Text style={{ fontSize: '12px' }}>
                          {err.error}
                        </Text>
                        <Space>
                          <Text type="secondary" style={{ fontSize: '11px' }}>
                            {new Date(err.timestamp).toLocaleString('vi-VN')}
                          </Text>
                          {err.resolved && (
                            <Tag color="green" size="small">Đã giải quyết</Tag>
                          )}
                        </Space>
                      </div>
                    ))}
                  </Space>
                </div>
              )}
            </Space>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for easy wrapping
export function withRealTimeErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  return function WrappedComponent(props: P) {
    return (
      <RealTimeErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </RealTimeErrorBoundary>
    );
  };
}

export default RealTimeErrorBoundary;