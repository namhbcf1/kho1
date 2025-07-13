import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout, Alert, Card, Row, Col, Statistic } from 'antd';
import { 
  DollarOutlined, 
  ShoppingCartOutlined, 
  UserOutlined, 
  ShopOutlined 
} from '@ant-design/icons';
import { useAuth } from './features/auth/hooks/useAuth';
import { RoleGuard } from './features/auth/components/RoleGuard';
import { AppHeader } from './components/layout/Header';
import { AppSidebar } from './components/layout/Sidebar';
import { AppFooter } from './components/layout/Footer';
import { LoginForm } from './features/auth/components/LoginForm';
import { AuthLoading, PageLoading } from './components/ui/Loading';
import './App.css';
import './components/ui/Loading/Loading.css';

const { Content } = Layout;

function App() {
  const { user, isAuthenticated, loading, error, isInitialized, logout, clearError } = useAuth();

  const handleUserMenuClick = (key: string) => {
    switch (key) {
      case 'logout':
        logout();
        break;
      case 'profile':
        // Navigate to profile page
        break;
      case 'settings':
        // Navigate to settings page
        break;
    }
  };

  // Show loading screen while auth is initializing
  if (!isInitialized || loading) {
    return <AuthLoading />;
  }

  // Show error if there's an auth error
  if (error) {
    return (
      <div style={{ padding: '50px' }}>
        <Alert
          message="Lỗi xác thực"
          description={error}
          type="error"
          showIcon
          closable
          onClose={clearError}
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppSidebar />
      
      <Layout>
        <AppHeader 
          user={user} 
          onMenuClick={handleUserMenuClick}
        />
        
        <Content style={{ margin: '16px' }}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            <Route 
              path="/dashboard" 
              element={
                <div style={{ padding: '24px' }}>
                  <h1 style={{ marginBottom: '16px' }}>Dashboard</h1>
                  <div style={{ marginBottom: '24px' }}>
                    <p>Chào mừng đến với KhoAugment POS!</p>
                    <p>Hệ thống đã được khởi tạo và sẵn sàng hoạt động.</p>
                  </div>
                  
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} lg={6}>
                      <Card>
                        <Statistic
                          title="Doanh thu hôm nay"
                          value={2500000}
                          formatter={(value) => new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND',
                          }).format(Number(value))}
                          prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
                        />
                      </Card>
                    </Col>
                    
                    <Col xs={24} sm={12} lg={6}>
                      <Card>
                        <Statistic
                          title="Đơn hàng"
                          value={145}
                          prefix={<ShoppingCartOutlined style={{ color: '#1890ff' }} />}
                        />
                      </Card>
                    </Col>
                    
                    <Col xs={24} sm={12} lg={6}>
                      <Card>
                        <Statistic
                          title="Khách hàng"
                          value={89}
                          prefix={<UserOutlined style={{ color: '#722ed1' }} />}
                        />
                      </Card>
                    </Col>
                    
                    <Col xs={24} sm={12} lg={6}>
                      <Card>
                        <Statistic
                          title="Sản phẩm"
                          value={567}
                          prefix={<ShopOutlined style={{ color: '#eb2f96' }} />}
                        />
                      </Card>
                    </Col>
                  </Row>
                </div>
              } 
            />
            
            <Route 
              path="/pos" 
              element={
                <RoleGuard allowedRoles={['admin', 'manager', 'cashier', 'staff']}>
                  <div style={{ padding: '24px' }}>
                    <h1>Terminal bán hàng</h1>
                    <p>Giao diện bán hàng đang được phát triển...</p>
                  </div>
                </RoleGuard>
              } 
            />
            
            <Route 
              path="/products" 
              element={
                <RoleGuard allowedRoles={['admin', 'manager']}>
                  <div style={{ padding: '24px' }}>
                    <h1>Quản lý sản phẩm</h1>
                    <p>Tính năng quản lý sản phẩm đang được phát triển...</p>
                  </div>
                </RoleGuard>
              } 
            />
            
            <Route 
              path="/customers" 
              element={
                <RoleGuard allowedRoles={['admin', 'manager', 'cashier']}>
                  <div>
                    <h1>Quản lý khách hàng</h1>
                    <p>Tính năng đang phát triển...</p>
                  </div>
                </RoleGuard>
              } 
            />
            
            <Route 
              path="/orders" 
              element={
                <RoleGuard allowedRoles={['admin', 'manager', 'cashier']}>
                  <div>
                    <h1>Quản lý đơn hàng</h1>
                    <p>Tính năng đang phát triển...</p>
                  </div>
                </RoleGuard>
              } 
            />
            
            <Route 
              path="/analytics" 
              element={
                <RoleGuard allowedRoles={['admin', 'manager']}>
                  <div>
                    <h1>Báo cáo & Thống kê</h1>
                    <p>Tính năng đang phát triển...</p>
                  </div>
                </RoleGuard>
              } 
            />
            
            <Route 
              path="/staff" 
              element={
                <RoleGuard allowedRoles={['admin', 'manager']}>
                  <div>
                    <h1>Quản lý nhân viên</h1>
                    <p>Tính năng đang phát triển...</p>
                  </div>
                </RoleGuard>
              } 
            />
            
            <Route 
              path="/settings" 
              element={
                <RoleGuard allowedRoles={['admin', 'manager']}>
                  <div>
                    <h1>Cài đặt hệ thống</h1>
                    <p>Tính năng đang phát triển...</p>
                  </div>
                </RoleGuard>
              } 
            />
            
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Content>
        
        <AppFooter />
      </Layout>
    </Layout>
  );
}

export default App;
