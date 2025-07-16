import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { MainLayout } from './components/Layout';
import { PWAInstallPrompt, PWAUpdatePrompt, OfflineIndicator } from './components/PWA';
import Dashboard from './pages/Dashboard';
import POSScreen from './pages/POS';
import ProductsPage from './pages/Products';
import CustomersPage from './pages/Customers';
import OrdersPage from './pages/Orders';
import ReportsPage from './pages/Reports';
import SettingsPage from './pages/Settings';
import { routes } from './routes';
import './App.css';

function App() {
  return (
    <ConfigProvider 
      locale={viVN}
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
          wireframe: false,
        },
        components: {
          Layout: {
            bodyBg: '#f0f2f5',
            headerBg: '#fff',
            siderBg: '#fff',
          },
          Menu: {
            itemBg: 'transparent',
            itemSelectedBg: '#e6f7ff',
            itemSelectedColor: '#1890ff',
          },
        },
      }}
    >
      <BrowserRouter>
        <MainLayout>
          <Routes>
            <Route path={routes.DASHBOARD} element={<Dashboard />} />
            <Route path={routes.POS} element={<POSScreen />} />
            <Route path={routes.PRODUCTS} element={<ProductsPage />} />
            <Route path={routes.CUSTOMERS} element={<CustomersPage />} />
            <Route path={routes.ORDERS} element={<OrdersPage />} />
            <Route path={routes.REPORTS} element={<ReportsPage />} />
            <Route path={routes.SETTINGS} element={<SettingsPage />} />
            
            {/* Redirect any unknown routes to dashboard */}
            <Route path="*" element={<Navigate to={routes.DASHBOARD} replace />} />
          </Routes>
        </MainLayout>
        
        {/* PWA Components */}
        <PWAInstallPrompt 
          onInstall={() => console.log('PWA installed')}
          onDismiss={() => console.log('PWA install dismissed')}
        />
        <PWAUpdatePrompt 
          onUpdate={() => console.log('PWA updated')}
        />
        <OfflineIndicator />
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;