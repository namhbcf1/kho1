// Main application layout with sidebar and header
import React, { useEffect } from 'react';
import { Layout, ConfigProvider } from 'antd';
import { Outlet, useNavigate } from 'react-router-dom';
import viVN from 'antd/locale/vi_VN';
import { useAuth, useLayout } from '../stores';
import { AppHeader } from '../components/layout/Header';
import { AppSidebar } from '../components/layout/Sidebar';
import { AppFooter } from '../components/layout/Footer';
import { AppBreadcrumb } from '../components/layout/Breadcrumb';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { usePermissions } from '../hooks/useAuth';

const { Content } = Layout;

interface MainLayoutProps {
  children?: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { sidebarCollapsed, theme } = useLayout();
  const { hasPermission } = usePermissions();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

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
          borderRadius: 6,
          fontSize: 14,
        },
        algorithm: theme === 'dark' ? 'darkAlgorithm' : 'defaultAlgorithm',
      }}
    >
      <Layout className="min-h-screen">
        {/* Sidebar */}
        <AppSidebar />

        {/* Main Content Area */}
        <Layout
          className={`transition-all duration-300 ${
            sidebarCollapsed ? 'ml-20' : 'ml-64'
          }`}
        >
          {/* Header */}
          <AppHeader />

          {/* Breadcrumb */}
          <div className="px-6 py-3 bg-white border-b">
            <AppBreadcrumb />
          </div>

          {/* Content */}
          <Content className="flex-1 p-6 bg-gray-50">
            <ErrorBoundary>
              {children || <Outlet />}
            </ErrorBoundary>
          </Content>

          {/* Footer */}
          <AppFooter />
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};

export default MainLayout;
