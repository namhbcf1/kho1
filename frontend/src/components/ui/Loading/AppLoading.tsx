// Enhanced loading component with error handling
import React from 'react';
import { Spin, Alert, Button } from 'antd';
import { LoadingOutlined, ReloadOutlined } from '@ant-design/icons';

interface AppLoadingProps {
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  size?: 'small' | 'default' | 'large';
  tip?: string;
  children?: React.ReactNode;
}

const AppLoading: React.FC<AppLoadingProps> = ({
  loading = true,
  error = null,
  onRetry,
  size = 'large',
  tip = 'Đang tải...',
  children,
}) => {
  // Show error state
  if (error) {
    return (
      <div className="app-loading error-state">
        <div className="loading-container">
          <Alert
            message="Có lỗi xảy ra"
            description={error}
            type="error"
            showIcon
            action={
              onRetry ? (
                <Button
                  size="small"
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={onRetry}
                >
                  Thử lại
                </Button>
              ) : null
            }
          />
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="app-loading loading-state">
        <div className="loading-container">
          <Spin
            size={size}
            tip={tip}
            indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />}
          />
        </div>
      </div>
    );
  }

  // Show children when not loading and no error
  return <>{children}</>;
};

// Full page loading component
export const PageLoading: React.FC<{ tip?: string }> = ({ tip = 'Đang tải trang...' }) => (
  <div className="page-loading">
    <AppLoading tip={tip} />
  </div>
);

// Auth loading component
export const AuthLoading: React.FC = () => (
  <div className="auth-loading">
    <AppLoading tip="Đang xác thực..." />
  </div>
);

// Component loading wrapper
export const ComponentLoading: React.FC<{
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
  children: React.ReactNode;
}> = ({ loading, error, onRetry, children }) => (
  <AppLoading loading={loading} error={error} onRetry={onRetry} size="default">
    {children}
  </AppLoading>
);

export default AppLoading;