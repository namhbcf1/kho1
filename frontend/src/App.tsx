import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import React, { useState, useEffect } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';

// Import layout
import SimpleLayout from './layouts/SimpleLayout';

// Import comprehensive dashboard components
import SimpleLoginPage from './pages/auth/SimpleLoginPage';
import ModernDashboard from './pages/dashboard/ModernDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import ModernPOSPage from './pages/pos/ModernPOSPage';

// Import theme system
import { getTheme, generateCSSVariables, ThemeMode } from './styles/theme';

// Import CSS
import './styles/global.css';
import './styles/responsive-mobile.css';
import './pages/dashboard/AdminDashboard.css';

// Dummy components for pages not yet implemented
const ProductsPage = () => <div style={{padding: '20px'}}><h2>Quản lý sản phẩm</h2><p>Trang đang được phát triển</p></div>;
const OrdersPage = () => <div style={{padding: '20px'}}><h2>Quản lý đơn hàng</h2><p>Trang đang được phát triển</p></div>;
const CustomersPage = () => <div style={{padding: '20px'}}><h2>Quản lý khách hàng</h2><p>Trang đang được phát triển</p></div>;
const PaymentsPage = () => <div style={{padding: '20px'}}><h2>Thanh toán</h2><p>Trang đang được phát triển</p></div>;
const StaffPage = () => <div style={{padding: '20px'}}><h2>Quản lý nhân viên</h2><p>Trang đang được phát triển</p></div>;
const SettingsPage = () => <div style={{padding: '20px'}}><h2>Cài đặt hệ thống</h2><p>Trang đang được phát triển</p></div>;
const AnalyticsPage = () => <div style={{padding: '20px'}}><h2>Phân tích dữ liệu</h2><p>Trang đang được phát triển</p></div>;
const InventoryPage = () => <div style={{padding: '20px'}}><h2>Quản lý kho</h2><p>Trang đang được phát triển</p></div>;

import './App.css';

// Simple auth check function
const isAuthenticated = () => {
  return localStorage.getItem('auth') === 'true';
};

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return isAuthenticated() ? <>{children}</> : <Navigate to="/auth/login" replace />;
};

function App() {
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');

  // Apply theme on mount and when theme changes
  useEffect(() => {
    const theme = getTheme(themeMode);
    const cssVariables = generateCSSVariables(theme);
    
    // Apply CSS variables to document root
    const root = document.documentElement;
    Object.entries(cssVariables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    
    // Set theme attribute for CSS selectors
    root.setAttribute('data-theme', themeMode);
    
    // Store theme preference
    localStorage.setItem('theme', themeMode);
  }, [themeMode]);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as ThemeMode;
    if (savedTheme && ['light', 'dark', 'vietnamese'].includes(savedTheme)) {
      setThemeMode(savedTheme);
    }
  }, []);

  // Ant Design theme configuration
  const antdTheme = {
    token: {
      colorPrimary: themeMode === 'vietnamese' ? '#d4af37' : '#1890ff',
      borderRadius: 8,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
    },
    algorithm: themeMode === 'dark' ? 'darkAlgorithm' : undefined,
  };

  return (
    <ConfigProvider 
      locale={viVN}
      theme={antdTheme}
    >
      <div className="app-container" data-theme={themeMode}>
        <Router>
          <Routes>
            {/* Authentication Routes */}
            <Route path="/login" element={<SimpleLoginPage />} />
            <Route path="/auth/login" element={<SimpleLoginPage />} />
            
            {/* Main Application Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <SimpleLayout themeMode={themeMode} setThemeMode={setThemeMode} />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<ModernDashboard />} />
              <Route path="dashboard/admin" element={<AdminDashboard />} />
              <Route path="pos" element={<ModernPOSPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="staff" element={<StaffPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="inventory" element={<InventoryPage />} />

              {/* Product management nested routes */}
              <Route path="products/categories" element={<ProductsPage />} />
              <Route path="products/inventory" element={<ProductsPage />} />
              <Route path="products/barcodes" element={<ProductsPage />} />
              <Route path="products/add" element={<ProductsPage />} />
              <Route path="products/:id" element={<ProductsPage />} />

              {/* Order management nested routes */}
              <Route path="orders/new" element={<OrdersPage />} />
              <Route path="orders/history" element={<OrdersPage />} />
              <Route path="orders/:id" element={<OrdersPage />} />
              
              {/* Customer management nested routes */}
              <Route path="customers/loyalty" element={<CustomersPage />} />
              <Route path="customers/add" element={<CustomersPage />} />
              <Route path="customers/:id" element={<CustomersPage />} />
            </Route>
          </Routes>
        </Router>
      </div>
    </ConfigProvider>
  );
}

export default App;