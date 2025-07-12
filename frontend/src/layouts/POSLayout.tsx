// POS terminal layout optimized for touch and speed
import React, { useEffect } from 'react';
import { Layout, ConfigProvider, Button, Space, Typography, Badge } from 'antd';
import { Outlet, useNavigate } from 'react-router-dom';
import { 
  ShoppingCartOutlined, 
  UserOutlined, 
  SettingOutlined,
  LogoutOutlined,
  WifiOutlined,
  SyncOutlined
} from '@ant-design/icons';
import viVN from 'antd/locale/vi_VN';
import { useAuth, usePOSCart, useLayout } from '../stores';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { formatVND } from '../services/utils';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useOfflineSync } from '../hooks/useOfflineSync';

const { Header, Content } = Layout;
const { Text } = Typography;

interface POSLayoutProps {
  children?: React.ReactNode;
}

export const POSLayout: React.FC<POSLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const { cart, total } = usePOSCart();
  const { theme } = useLayout();
  const { isOnline } = useNetworkStatus();
  const { syncStatus, queueSize } = useOfflineSync();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login', { replace: true });
  };

  const handleBackToMain = () => {
    navigate('/dashboard');
  };

  // Don't render if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 4,
          fontSize: 16, // Larger font for touch interface
        },
        algorithm: theme === 'dark' ? 'darkAlgorithm' : 'defaultAlgorithm',
      }}
    >
      <Layout className="min-h-screen bg-white">
        {/* POS Header */}
        <Header className="bg-white border-b-2 border-blue-500 px-6 h-16 flex items-center justify-between">
          {/* Left: Brand and Status */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <ShoppingCartOutlined className="text-white text-lg" />
              </div>
              <div>
                <Text strong className="text-lg">KhoAugment POS</Text>
                <div className="flex items-center space-x-2 text-xs">
                  <Badge 
                    status={isOnline ? "success" : "error"} 
                    text={isOnline ? "Trực tuyến" : "Ngoại tuyến"}
                  />
                  {!isOnline && queueSize > 0 && (
                    <Badge count={queueSize} size="small">
                      <SyncOutlined className="text-orange-500" />
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Center: Cart Summary */}
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <Text className="text-sm text-gray-500">Giỏ hàng</Text>
              <div className="flex items-center space-x-2">
                <Badge count={cart.length} size="small">
                  <ShoppingCartOutlined className="text-xl" />
                </Badge>
                <Text strong className="text-lg text-blue-600">
                  {formatVND(total)}
                </Text>
              </div>
            </div>
          </div>

          {/* Right: User and Actions */}
          <div className="flex items-center space-x-2">
            <Space>
              <Button
                type="text"
                icon={<UserOutlined />}
                className="flex items-center"
              >
                <span className="hidden sm:inline">{user.name}</span>
              </Button>
              
              <Button
                type="text"
                icon={<SettingOutlined />}
                onClick={handleBackToMain}
                className="hidden sm:flex"
              >
                Quản lý
              </Button>

              <Button
                type="text"
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                className="text-red-500 hover:text-red-600"
              >
                <span className="hidden sm:inline">Đăng xuất</span>
              </Button>
            </Space>
          </div>
        </Header>

        {/* POS Content */}
        <Content className="flex-1 bg-gray-50">
          <ErrorBoundary>
            {children || <Outlet />}
          </ErrorBoundary>
        </Content>

        {/* Network Status Bar */}
        {!isOnline && (
          <div className="bg-orange-500 text-white px-4 py-2 text-center text-sm">
            <WifiOutlined className="mr-2" />
            Đang hoạt động ngoại tuyến. Dữ liệu sẽ được đồng bộ khi có kết nối.
            {queueSize > 0 && ` (${queueSize} giao dịch chờ đồng bộ)`}
          </div>
        )}
      </Layout>
    </ConfigProvider>
  );
};

export default POSLayout;
