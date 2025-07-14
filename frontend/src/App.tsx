import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Alert, Card, Row, Col, Statistic } from 'antd';
import { 
  DollarOutlined, 
  ShoppingCartOutlined, 
  UserOutlined, 
  ShopOutlined 
} from '@ant-design/icons';
import { DashboardPage } from './pages/DashboardPage';
import { POSTerminalPage } from './pages/pos/POSTerminalPage';
import { ProductListPage } from './pages/products/ProductListPage';
import { CustomerListPage } from './pages/customers/CustomerListPage';
import { OrderListPage } from './pages/orders/OrderListPage';
import { useAuth } from './hooks/useAuth';
import { RoleGuard } from './features/auth/components/RoleGuard';
import { AppHeader } from './components/layout/Header';
import { AppSidebar } from './components/layout/Sidebar';
import { AppFooter } from './components/layout/Footer';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import { AuthLoading, PageLoading } from './components/ui/Loading';
import { ROUTES } from './constants/routes';
import { useAuthStore } from './stores/authStore';
import './App.css';
import './components/ui/Loading/Loading.css';

const { Content } = Layout;

function App() {
  const { user, isAuthenticated, isLoading, error, isInitialized, logout, clearError, initialize } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize auth on app start
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  const handleUserMenuClick = (key: string) => {
    switch (key) {
      case 'logout':
        logout();
        break;
      case 'profile':
        navigate('/profile');
        break;
      case 'settings':
        navigate('/settings');
        break;
    }
  };

  const handleSidebarMenuClick = (key: string) => {
    switch (key) {
      case 'dashboard':
        navigate('/dashboard');
        break;
      case 'pos':
        navigate('/pos');
        break;
      case 'products':
      case 'products-list':
        navigate('/products');
        break;
      case 'customers':
      case 'customers-list':
        navigate('/customers');
        break;
      case 'orders':
      case 'orders-list':
        navigate('/orders');
        break;
      case 'analytics':
        navigate('/analytics');
        break;
      case 'staff':
        navigate('/staff');
        break;
      case 'settings':
        navigate('/settings');
        break;
      default:
        // Handle sub-menu items that don't have pages yet
        console.log('Navigation not implemented for:', key);
        break;
    }
  };

  // Get current page key for sidebar selection
  const getCurrentPageKey = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'dashboard';
    if (path.includes('/pos')) return 'pos';
    if (path.includes('/products')) return 'products';
    if (path.includes('/customers')) return 'customers';
    if (path.includes('/orders')) return 'orders';
    if (path.includes('/analytics')) return 'analytics';
    if (path.includes('/staff')) return 'staff';
    if (path.includes('/settings')) return 'settings';
    return 'dashboard';
  };

  // Show loading screen while auth is initializing
  if (!isInitialized || isLoading) {
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
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.AUTH.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
        <Route path={ROUTES.AUTH.REGISTER} element={<RegisterPage />} />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
        <Route path={ROUTES.AUTH.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
        <Route path="*" element={<Navigate to={ROUTES.AUTH.LOGIN} replace />} />
      </Routes>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppSidebar 
        selectedKey={getCurrentPageKey()}
        onMenuSelect={handleSidebarMenuClick}
      />
      
      <Layout>
        <AppHeader 
          user={user} 
          onMenuClick={handleUserMenuClick}
        />
        
        <Content style={{ margin: '16px' }}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            <Route path="/dashboard" element={<DashboardPage />} />
            
            <Route 
              path="/pos" 
              element={
                <RoleGuard allowedRoles={['admin', 'manager', 'cashier', 'staff']}>
                  <POSTerminalPage />
                </RoleGuard>
              } 
            />
            
            <Route 
              path="/products" 
              element={
                <RoleGuard allowedRoles={['admin', 'manager']}>
                  <ProductListPage />
                </RoleGuard>
              } 
            />
            
            <Route 
              path="/customers" 
              element={
                <RoleGuard allowedRoles={['admin', 'manager', 'cashier']}>
                  <CustomerListPage />
                </RoleGuard>
              } 
            />
            
            <Route 
              path="/orders" 
              element={
                <RoleGuard allowedRoles={['admin', 'manager', 'cashier']}>
                  <OrderListPage />
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
