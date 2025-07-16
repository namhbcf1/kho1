import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import SimpleApp from './SimpleApp-working';
import './index.css';

// Production error handling
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

console.log('🚀 Starting KhoAugment POS Simple application...');

try {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  
  const root = ReactDOM.createRoot(rootElement);
  
  root.render(
    <React.StrictMode>
      <ConfigProvider locale={viVN}>
        <SimpleApp />
      </ConfigProvider>
    </React.StrictMode>
  );
  
  console.log('✅ KhoAugment POS Simple application started successfully');
  
} catch (error) {
  console.error('❌ Fatal error during application initialization:', error);
  
  // Fallback HTML for production
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 50px; font-family: Arial, sans-serif; text-align: center; background: #f5f5f5; min-height: 100vh; display: flex; align-items: center; justify-content: center;">
        <div style="background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); max-width: 500px;">
          <h1 style="color: #1890ff; margin-bottom: 20px;">KhoAugment POS</h1>
          <p style="color: #666; margin-bottom: 20px;">Có lỗi xảy ra khi khởi động ứng dụng:</p>
          <p style="color: #ff4d4f; font-size: 14px;">${error.message}</p>
          <button onclick="window.location.reload()" style="padding: 8px 16px; background: #1890ff; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Tải lại trang
          </button>
        </div>
      </div>
    `;
  }
}