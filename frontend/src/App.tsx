import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';

// Import layout
import MainLayout from './layouts/MainLayout';

// Import comprehensive dashboard components
import DashboardPage from './pages/DashboardPage.modern';
import ModernDashboard from './pages/dashboard/ModernDashboard';
import ModernPOSPage from './pages/pos/ModernPOSPage';
import SimpleLoginPage from './pages/auth/SimpleLoginPage';

import './App.css';

function App() {
  return (
    <ConfigProvider locale={viVN}>
      <Router>
        <Routes>
          {/* Authentication Routes */}
          <Route path="/login" element={<SimpleLoginPage />} />
          <Route path="/auth/login" element={<SimpleLoginPage />} />
          
          {/* Main Application Routes */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<ModernDashboard />} />
            <Route path="pos" element={<ModernPOSPage />} />
          </Route>
        </Routes>
      </Router>
    </ConfigProvider>
  );
}

export default App;