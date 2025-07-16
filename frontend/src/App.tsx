import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout, Menu, Typography, Button, Space, Card, Row, Col, Statistic } from 'antd';
import {
  DashboardOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  ProductOutlined,
  BarChartOutlined,
  SettingOutlined,
  DollarCircleOutlined
} from '@ant-design/icons';
import './App.css';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

// Simple Dashboard Component
const Dashboard = () => (
  <div style={{ padding: 24 }}>
    <Title level={2}>🇻🇳 KhoAugment POS Dashboard</Title>
    <Row gutter={16}>
      <Col span={6}>
        <Card>
          <Statistic
            title="Doanh thu hôm nay"
            value={2500000}
            precision={0}
            valueStyle={{ color: '#3f8600' }}
            prefix={<DollarCircleOutlined />}
            suffix="₫"
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic title="Đơn hàng" value={45} prefix={<ShoppingCartOutlined />} />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic title="Khách hàng" value={23} prefix={<UserOutlined />} />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic title="Sản phẩm" value={156} prefix={<ProductOutlined />} />
        </Card>
      </Col>
    </Row>
  </div>
);

// Simple POS Component
const POS = () => (
  <div style={{ padding: 24 }}>
    <Title level={2}>🛒 Điểm Bán Hàng (POS)</Title>
    <p>Chức năng POS sẽ được triển khai ở đây</p>
  </div>
);

// Simple Products Component
const Products = () => (
  <div style={{ padding: 24 }}>
    <Title level={2}>📦 Quản Lý Sản Phẩm</Title>
    <p>Quản lý kho hàng và sản phẩm</p>
  </div>
);

// Simple Customers Component
const Customers = () => (
  <div style={{ padding: 24 }}>
    <Title level={2}>👥 Quản Lý Khách Hàng</Title>
    <p>Hệ thống loyalty và CRM khách hàng</p>
  </div>
);

// Simple Reports Component
const Reports = () => (
  <div style={{ padding: 24 }}>
    <Title level={2}>📊 Báo Cáo & Phân Tích</Title>
    <p>Dashboard analytics và báo cáo doanh thu</p>
  </div>
);

// Simple Settings Component
const Settings = () => (
  <div style={{ padding: 24 }}>
    <Title level={2}>⚙️ Cài Đặt Hệ Thống</Title>
    <p>Cấu hình store và hệ thống</p>
  </div>
);

const menuItems = [
  {
    key: 'dashboard',
    icon: <DashboardOutlined />,
    label: 'Dashboard',
    path: '/dashboard'
  },
  {
    key: 'pos',
    icon: <ShoppingCartOutlined />,
    label: 'POS',
    path: '/pos'
  },
  {
    key: 'products',
    icon: <ProductOutlined />,
    label: 'Sản phẩm',
    path: '/products'
  },
  {
    key: 'customers',
    icon: <UserOutlined />,
    label: 'Khách hàng',
    path: '/customers'
  },
  {
    key: 'reports',
    icon: <BarChartOutlined />,
    label: 'Báo cáo',
    path: '/reports'
  },
  {
    key: 'settings',
    icon: <SettingOutlined />,
    label: 'Cài đặt',
    path: '/settings'
  }
];

function App() {
  const [selectedKey, setSelectedKey] = React.useState('dashboard');

  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider width={250} theme="dark">
          <div style={{ 
            height: 64, 
            margin: 16, 
            color: 'white', 
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Title level={4} style={{ color: 'white', margin: 0 }}>
              🇻🇳 KhoAugment POS
            </Title>
          </div>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[selectedKey]}
            onSelect={({ key }) => setSelectedKey(key)}
            items={menuItems.map(item => ({
              key: item.key,
              icon: item.icon,
              label: (
                <a href={item.path} onClick={(e) => {
                  e.preventDefault();
                  window.history.pushState({}, '', item.path);
                  setSelectedKey(item.key);
                }}>
                  {item.label}
                </a>
              )
            }))}
          />
        </Sider>
        
        <Layout>
          <Header style={{ 
            background: '#fff', 
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Title level={3} style={{ margin: 0 }}>
              Vietnamese Point of Sale System
            </Title>
            <Space>
              <Button type="primary">Đăng nhập</Button>
            </Space>
          </Header>
          
          <Content style={{ margin: 0, background: '#f0f2f5' }}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/pos" element={<POS />} />
              <Route path="/products" element={<Products />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Router>
  );
}

export default App;