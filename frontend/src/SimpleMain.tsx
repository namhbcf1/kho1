import React from 'react';
import ReactDOM from 'react-dom/client';

function SimpleApp() {
  return (
    <div style={{ 
      padding: '50px', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f0f0f0',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#1890ff' }}>KhoAugment POS - Simple Test</h1>
      <p>✅ React is working correctly!</p>
      <p>Time: {new Date().toLocaleString()}</p>
      <button onClick={() => alert('Button works!')}>Test Button</button>
    </div>
  );
}

console.log('Simple React app starting...');

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<SimpleApp />);

console.log('Simple React app rendered');