import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import SimpleApp from './SimpleApp';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider locale={viVN}>
      <BrowserRouter>
        <SimpleApp />
      </BrowserRouter>
    </ConfigProvider>
  </React.StrictMode>,
);
