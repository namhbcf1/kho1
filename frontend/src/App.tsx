import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout, Spin } from 'antd';
import { useAuth } from './features/auth/hooks/useAuth';
import { RoleGuard } from './features/auth/components/RoleGuard';
import { AppHeader } from './components/layout/Header';
import { AppSidebar } from './components/layout/Sidebar';
import { AppFooter } from './components/layout/Footer';
import { LoginForm } from './features/auth/components/LoginForm';
import { POSTerminal } from './features/pos/components/POSTerminal';
import { ProductList } from './features/products/components/ProductList';
import { PageLoading } from './components/ui/Loading';
import './App.css';

const { Content } = Layout;

function App() {
  const { user, isAuthenticated, loading, checkAuth, logout } = useAuth();

  useEffect(() => {
    checkAuth();
  }, []);

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

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Spin size="large" tip="Đang tải..." />
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
                <div>
                  <h1>Dashboard</h1>
                  <p>Chào mừng đến với KhoAugment POS!</p>
                </div>
              } 
            />
            
            <Route 
              path="/pos" 
              element={
                <RoleGuard allowedRoles={['admin', 'manager', 'cashier', 'staff']}>
                  <POSTerminal />
                </RoleGuard>
              } 
            />
            
            <Route 
              path="/products" 
              element={
                <RoleGuard allowedRoles={['admin', 'manager']}>
                  <ProductList 
                    products={[]} 
                    loading={false}
                    onAdd={() => console.log('Add product')}
                    onEdit={(product) => console.log('Edit product', product)}
                    onDelete={(product) => console.log('Delete product', product)}
                    onView={(product) => console.log('View product', product)}
                  />
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
