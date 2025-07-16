import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';

// Import layout
import SimpleLayout from './layouts/SimpleLayout';

// Import comprehensive dashboard components
import ModernDashboard from './pages/dashboard/ModernDashboard';
import ModernPOSPage from './pages/pos/ModernPOSPage';
import SimpleLoginPage from './pages/auth/SimpleLoginPage';

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
  return (
    <ConfigProvider locale={viVN}>
      <Router>
        <Routes>
          {/* Authentication Routes */}
          <Route path="/login" element={<SimpleLoginPage />} />
          <Route path="/auth/login" element={<SimpleLoginPage />} />
          
          {/* Main Application Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <SimpleLayout />
            </ProtectedRoute>
          }>
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