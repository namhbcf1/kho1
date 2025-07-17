import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Simple test first
console.log('🚀 KhoAugment POS Starting...');

const rootElement = document.getElementById('root');
console.log('Root element:', rootElement);

if (rootElement) {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<App />);
    console.log('✅ KhoAugment POS App rendered successfully!');
  } catch (error) {
    console.error('❌ Error rendering app:', error);
    rootElement.innerHTML = `
      <div style="padding: 50px; text-align: center; font-family: Arial, sans-serif; background: white;">
        <h1 style="color: #1890ff;">KhoAugment POS</h1>
        <p style="color: red;">Lỗi khởi động ứng dụng: ${error}</p>
        <button onclick="location.reload()" style="padding: 10px 20px; background: #1890ff; color: white; border: none; border-radius: 5px; cursor: pointer;">Thử lại</button>
      </div>
    `;
  }
} else {
  console.error('❌ Không tìm thấy root element');
  document.body.innerHTML = `
    <div style="padding: 50px; text-align: center; font-family: Arial, sans-serif; background: white; min-height: 100vh;">
      <h1 style="color: #1890ff;">KhoAugment POS</h1>
      <p style="color: red;">Lỗi: Không tìm thấy root element</p>
      <button onclick="location.reload()" style="padding: 10px 20px; background: #1890ff; color: white; border: none; border-radius: 5px; cursor: pointer;">Thử lại</button>
    </div>
  `;
}