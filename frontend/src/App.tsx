import type { ThemeConfig } from 'antd';
import { ConfigProvider, theme } from 'antd';
import viVN from 'antd/locale/vi_VN';
import React, { useEffect, useState } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';

// Import layouts
import ModernLayout from './layouts/ModernLayout';

// Import comprehensive dashboard components
import SimpleLoginPage from './pages/auth/SimpleLoginPage';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import ModernDashboard from './pages/dashboard/ModernDashboard';
import RealTimePage from './pages/dashboard/RealTimePage';
import ReportsPage from './pages/dashboard/ReportsPage';
import ModernPOSPage from './pages/pos/ModernPOSPage';

// Import inventory pages
import InventoryExportPage from './pages/inventory/InventoryExportPage';
import InventoryImportPage from './pages/inventory/InventoryImportPage';
import InventoryPage from './pages/inventory/InventoryPage';

// Import suppliers page
import SuppliersPage from './pages/suppliers/SuppliersPage';

// Import customer pages
import ModernCustomerPage from './pages/customers/ModernCustomerPage';

// Import finance pages
import ExpensesPage from './pages/finance/ExpensesPage';
import RevenueReportPage from './pages/finance/RevenueReportPage';

// Import theme system
import { generateCSSVariables, getTheme, ThemeMode } from './styles/theme';

// Import CSS
import './App.css';
import './pages/dashboard/AdminDashboard.css';
import './styles/blue-theme.css'; // Import blue theme
import './styles/global.css';
import './styles/modern-ui.css'; // Import modern UI styles
import './styles/responsive-mobile.css';

// Import real working pages instead of dummy components
import ModernProductPage from './pages/products/ModernProductPage';
import ModernOrderPage from './pages/orders/ModernOrderPage';
import VietnameseAnalyticsPage from './pages/analytics/VietnameseAnalyticsPage';
import StaffPage from './pages/staff/StaffPage';
import SettingsPage from './pages/settings/SettingsPage';
import PaymentsPage from './pages/payments';

// Simple auth check function
const isAuthenticated = () => {
  return localStorage.getItem('auth') === 'true';
};

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return isAuthenticated() ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
  const [themeMode, setThemeMode] = useState<ThemeMode>('modern');

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
    if (savedTheme && ['light', 'dark', 'vietnamese', 'blue', 'modern', 'modern-dark'].includes(savedTheme)) {
      setThemeMode(savedTheme);
    }
  }, []);

  // Ant Design theme configuration
  const antdTheme: ThemeConfig = {
    token: {
      colorPrimary: themeMode === 'vietnamese' ? '#d4af37' : 
                    themeMode === 'blue' ? '#1890ff' :
                    themeMode === 'modern' || themeMode === 'modern-dark' ? '#2563eb' : '#1890ff',
      borderRadius: 8,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
    },
    algorithm: themeMode === 'dark' || themeMode === 'modern-dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
  };

  // Type-safe theme mode setter
  const handleThemeModeChange = (mode: string) => {
    setThemeMode(mode as ThemeMode);
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
            
            {/* Root redirect */}
            <Route path="/" element={isAuthenticated() ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
            
            {/* Main Application Routes - Using Modern Layout */}
            <Route path="/*" element={
              <ProtectedRoute>
                <ModernLayout themeMode={themeMode} setThemeMode={handleThemeModeChange} />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<ModernDashboard />} />
              <Route path="dashboard/admin" element={<AdminDashboard />} />
              <Route path="dashboard/reports" element={<ReportsPage />} />
              <Route path="dashboard/realtime" element={<RealTimePage />} />
              <Route path="pos" element={<ModernPOSPage />} />
              <Route path="products" element={<ModernProductPage />} />
              <Route path="orders" element={<ModernOrderPage />} />
              <Route path="customers" element={<ModernCustomerPage />} />
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="staff" element={<StaffPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="analytics" element={<VietnameseAnalyticsPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="inventory/import" element={<InventoryImportPage />} />
              <Route path="inventory/export" element={<InventoryExportPage />} />
              <Route path="suppliers" element={<SuppliersPage />} />
              <Route path="finance/revenue" element={<RevenueReportPage />} />
              <Route path="finance/expenses" element={<ExpensesPage />} />

              {/* Product management nested routes */}
              <Route path="products/categories" element={<ModernProductPage />} />
              <Route path="products/inventory" element={<ModernProductPage />} />
              <Route path="products/barcodes" element={<ModernProductPage />} />
              <Route path="products/add" element={<ModernProductPage />} />
              <Route path="products/:id" element={<ModernProductPage />} />

              {/* Order management nested routes */}
              <Route path="orders/new" element={<ModernOrderPage />} />
              <Route path="orders/history" element={<ModernOrderPage />} />
              <Route path="orders/:id" element={<ModernOrderPage />} />
              
              {/* Customer management nested routes */}
              <Route path="customers/loyalty" element={<ModernCustomerPage />} />
              <Route path="customers/add" element={<ModernCustomerPage />} />
              <Route path="customers/:id" element={<ModernCustomerPage />} />
            </Route>
          </Routes>
        </Router>
      </div>
    </ConfigProvider>
  );
}

export default App;