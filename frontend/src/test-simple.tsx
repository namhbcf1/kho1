import React from 'react';
import ReactDOM from 'react-dom/client';

console.log('🚀 Testing simple React loading...');

try {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  
  const root = ReactDOM.createRoot(rootElement);
  
  root.render(
    <div style={{
      padding: '50px',
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center',
      background: '#f5f5f5',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        maxWidth: '500px'
      }}>
        <h1 style={{ color: '#1890ff', marginBottom: '20px' }}>✅ React Works!</h1>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          KhoAugment POS is loading correctly
        </p>
        <p style={{ color: '#999', fontSize: '14px' }}>
          JavaScript execution and React rendering are working properly.
        </p>
      </div>
    </div>
  );
  
  console.log('✅ Simple React test completed successfully');
  
} catch (error) {
  console.error('❌ Simple React test failed:', error);
  
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 50px; font-family: Arial, sans-serif; text-align: center; background: #f5f5f5; min-height: 100vh; display: flex; align-items: center; justify-content: center;">
        <div style="background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); max-width: 500px;">
          <h1 style="color: #ff4d4f; margin-bottom: 20px;">❌ React Test Failed</h1>
          <p style="color: #666; margin-bottom: 20px;">Error: ${error instanceof Error ? error.message : String(error)}</p>
          <p style="color: #999; font-size: 14px;">Please check the console for more details.</p>
        </div>
      </div>
    `;
  }
}