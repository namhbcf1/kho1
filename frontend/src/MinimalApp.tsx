import React from 'react';

const MinimalApp = () => {
  return (
    <div style={{ padding: '50px' }}>
      <h1>Test React App</h1>
      <p>If you can see this, React is working!</p>
      <button onClick={() => alert('Button clicked!')}>Test Button</button>
    </div>
  );
};

export default MinimalApp;