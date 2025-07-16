import React from 'react';
import ReactDOM from 'react-dom/client';

console.log('🔍 Debug - Starting application...');

function DebugApp() {
  return (
    <div style={{ 
      padding: '50px', 
      fontFamily: 'Arial, sans-serif', 
      textAlign: 'center' 
    }}>
      <h1 style={{ color: '#1890ff' }}>KhoAugment POS - Debug Mode</h1>
      <p>React 18 is working correctly!</p>
      <p>Vietnamese: Ứng dụng đang hoạt động bình thường</p>
      <div style={{ marginTop: '20px' }}>
        <button onClick={() => alert('Button clicked!')}>
          Test Button
        </button>
      </div>
    </div>
  );
}

try {
  console.log('🔍 Debug - Looking for root element...');
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  
  console.log('🔍 Debug - Creating React root...');
  const root = ReactDOM.createRoot(rootElement);
  
  console.log('🔍 Debug - Rendering app...');
  root.render(<DebugApp />);
  
  console.log('✅ Debug - Application rendered successfully');
  
} catch (error) {
  console.error('❌ Debug - Error:', error);
  
  // Simple fallback
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 50px; color: red;">
        <h1>Debug Error</h1>
        <p>Error: ${error.message}</p>
      </div>
    `;
  }
}