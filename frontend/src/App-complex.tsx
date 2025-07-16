import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Alert, Card, Row, Col, Statistic, ConfigProvider, theme } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { 
  DollarOutlined, 
  ShoppingCartOutlined, 
  UserOutlined, 
  ShopOutlined 
} from '@ant-design/icons';
import ModernDashboardPage from './pages/DashboardPage.modern';
import ModernPOSPage from './pages/pos/ModernPOSPage';
import ModernProductPage from './pages/products/ModernProductPage';
import ModernCustomerPage from './pages/customers/ModernCustomerPage';
import ModernOrderPage from './pages/orders/ModernOrderPage';
import { useAuth } from './hooks/useAuth';
import { RoleGuard } from './features/auth/components/RoleGuard';
import { AppHeader } from './components/layout/Header';
import { AppSidebar } from './components/layout/Sidebar';
import { AppFooter } from './components/layout/Footer';
import { AuthLayout } from './layouts/AuthLayout';
import EnhancedLoginPage from './pages/auth/EnhancedLoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import { AuthLoading, PageLoading } from './components/ui/Loading';
import { AccessibilityProvider } from './components/dashboard/AccessibilityProvider/AccessibilityProvider';
import { ROUTES } from './constants/routes';
import { useAuthStore } from './stores/authStore';
import { useUIStore } from './stores/uiStore';
import './App.css';
import './components/ui/Loading/Loading.css';
import './styles/themes.css';
import './styles/dashboard.css';
import './styles/accessibility.css';
import './styles/antd-overrides.css';

const { Content } = Layout;

function App() {
  const { user, isAuthenticated, isLoading, error, isInitialized, logout, clearError, initialize } = useAuthStore();
  const { theme, isDarkMode } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize auth on app start
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [theme, isDarkMode]);

  // Handle navigation when auth state changes
  useEffect(() => {
    if (isAuthenticated && user && (location.pathname === '/login' || location.pathname === '/auth/login')) {
      console.log('🔄 Auth state changed, redirecting to dashboard...');
      const redirectTo = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location.pathname, location.state]);

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
        <Route path={ROUTES.LOGIN} element={<EnhancedLoginPage />} />
        <Route path={ROUTES.AUTH.LOGIN} element={<EnhancedLoginPage />} />
        <Route path={ROUTES.REGISTER} element={<AuthLayout><RegisterPage /></AuthLayout>} />
        <Route path={ROUTES.AUTH.REGISTER} element={<AuthLayout><RegisterPage /></AuthLayout>} />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<AuthLayout><ForgotPasswordPage /></AuthLayout>} />
        <Route path={ROUTES.AUTH.FORGOT_PASSWORD} element={<AuthLayout><ForgotPasswordPage /></AuthLayout>} />
        <Route path="*" element={<Navigate to={ROUTES.AUTH.LOGIN} replace />} />
      </Routes>
    );
  }

  // Ant Design theme configuration (simplified to avoid algorithm issues)
  const antdTheme = {
    token: {
      colorPrimary: isDarkMode ? '#177ddc' : '#1890ff',
      colorBgBase: isDarkMode ? '#000000' : '#ffffff',
      colorTextBase: isDarkMode ? '#ffffffd9' : '#000000d9',
      colorBorder: isDarkMode ? '#303030' : '#d9d9d9',
      borderRadius: 8,
      wireframe: false,
    },
  };

  return (
    <ConfigProvider theme={antdTheme} locale={viVN}>
      <AccessibilityProvider>
        <div className="dashboard-theme" data-theme={theme}>
          <Layout style={{ minHeight: '100vh' }} className="main-layout">
            <AppSidebar 
              selectedKey={getCurrentPageKey()}
              onMenuSelect={handleSidebarMenuClick}
            />
            
            <Layout>
              <AppHeader 
                user={user} 
                onMenuClick={handleUserMenuClick}
              />
              
              <Content 
                style={{ margin: '16px' }}
                id="main-content"
                role="main"
                aria-label="Nội dung chính"
              >
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  
                  <Route 
                    path="/dashboard" 
                    element={
                      <div id="dashboard" role="main" aria-label="Dashboard">
                        <ModernDashboardPage />
                      </div>
                    } 
                  />
                  
                  <Route 
                    path="/pos" 
                    element={
                      <RoleGuard allowedRoles={['admin', 'manager', 'cashier', 'staff']}>
                        <div role="main" aria-label="Điểm bán hàng">
                          <ModernPOSPage />
                        </div>
                      </RoleGuard>
                    } 
                  />
                  
                  <Route 
                    path="/products" 
                    element={
                      <RoleGuard allowedRoles={['admin', 'manager']}>
                        <div role="main" aria-label="Quản lý sản phẩm">
                          <ModernProductPage />
                        </div>
                      </RoleGuard>
                    } 
                  />
                  
                  <Route 
                    path="/customers" 
                    element={
                      <RoleGuard allowedRoles={['admin', 'manager', 'cashier']}>
                        <div role="main" aria-label="Quản lý khách hàng">
                          <ModernCustomerPage />
                        </div>
                      </RoleGuard>
                    } 
                  />
                  
                  <Route 
                    path="/orders" 
                    element={
                      <RoleGuard allowedRoles={['admin', 'manager', 'cashier']}>
                        <div role="main" aria-label="Quản lý đơn hàng">
                          <ModernOrderPage />
                        </div>
                      </RoleGuard>
                    } 
                  />
                  
                  <Route 
                    path="/analytics" 
                    element={
                      <RoleGuard allowedRoles={['admin', 'manager']}>
                        <div role="main" aria-label="Báo cáo và thống kê">
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
                        <div role="main" aria-label="Quản lý nhân viên">
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
                        <div role="main" aria-label="Cài đặt hệ thống">
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
        </div>
      </AccessibilityProvider>
    </ConfigProvider>
  );
}

export default App;
