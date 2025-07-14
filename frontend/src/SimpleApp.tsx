import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Layout, Form, Input, Button, Typography, Card, Alert, Menu, Avatar, Dropdown, Breadcrumb } from 'antd';
import { UserOutlined, LockOutlined, ShoppingCartOutlined, AppstoreOutlined, TeamOutlined, BarChartOutlined, SettingOutlined, LogoutOutlined } from '@ant-design/icons';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

// Simple in-memory auth store
const useAuth = () => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('auth_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = (email: string, password: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email === 'admin@khoaugment.com' && password === '123456') {
          const userData: User = {
            id: '1',
            email: 'admin@khoaugment.com',
            name: 'Quản trị viên',
            role: 'admin'
          };
          setUser(userData);
          localStorage.setItem('auth_user', JSON.stringify(userData));
          resolve();
        } else {
          reject(new Error('Thông tin đăng nhập không chính xác'));
        }
      }, 1000);
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
  };

  return { user, login, logout };
};

// Login Page
const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (values: { email: string; password: string }) => {
    setLoading(true);
    setError(null);
    try {
      await login(values.email, values.password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
      <Card style={{ width: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3}>Đăng nhập POS</Title>
          <Text type="secondary">Hệ thống bán hàng Việt Nam</Text>
        </div>

        {error && (
          <Alert message={error} type="error" style={{ marginBottom: 16 }} closable onClose={() => setError(null)} />
        )}

        <Form onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, message: 'Vui lòng nhập email!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="admin@khoaugment.com" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="123456" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>

        <div style={{ background: '#fafafa', padding: 12, borderRadius: 6, marginTop: 16 }}>
          <Text strong>Tài khoản demo:</Text><br />
          <Text code>admin@khoaugment.com / 123456</Text>
        </div>
      </Card>
    </div>
  );
};

// Dashboard Page
const DashboardPage = () => {
  return (
    <div>
      <Title level={2}>Tổng quan</Title>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <ShoppingCartOutlined style={{ fontSize: 32, color: '#1890ff', marginRight: 16 }} />
            <div>
              <Text type="secondary">Doanh thu hôm nay</Text>
              <div style={{ fontSize: 24, fontWeight: 'bold' }}>₫15,450,000</div>
            </div>
          </div>
        </Card>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <AppstoreOutlined style={{ fontSize: 32, color: '#52c41a', marginRight: 16 }} />
            <div>
              <Text type="secondary">Đơn hàng</Text>
              <div style={{ fontSize: 24, fontWeight: 'bold' }}>234</div>
            </div>
          </div>
        </Card>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <TeamOutlined style={{ fontSize: 32, color: '#faad14', marginRight: 16 }} />
            <div>
              <Text type="secondary">Khách hàng</Text>
              <div style={{ fontSize: 24, fontWeight: 'bold' }}>1,847</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

// Simple Products Page
const ProductsPage = () => {
  return (
    <div>
      <Title level={2}>Quản lý sản phẩm</Title>
      <Card>
        <Text>Danh sách sản phẩm sẽ được hiển thị tại đây...</Text>
      </Card>
    </div>
  );
};

// Main Layout
const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { key: 'dashboard', icon: <AppstoreOutlined />, label: 'Tổng quan' },
    { key: 'pos', icon: <ShoppingCartOutlined />, label: 'Bán hàng' },
    { key: 'products', icon: <AppstoreOutlined />, label: 'Sản phẩm' },
    { key: 'customers', icon: <TeamOutlined />, label: 'Khách hàng' },
    { key: 'analytics', icon: <BarChartOutlined />, label: 'Báo cáo' },
    { key: 'settings', icon: <SettingOutlined />, label: 'Cài đặt' },
  ];

  const userMenu = (
    <Menu>
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={logout}>
        Đăng xuất
      </Menu.Item>
    </Menu>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="dark" width={250}>
        <div style={{ padding: 16, textAlign: 'center', borderBottom: '1px solid #434343' }}>
          <Title level={4} style={{ color: 'white', margin: 0 }}>KhoAugment POS</Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          items={menuItems}
          onSelect={({ key }) => navigate(`/${key}`)}
          style={{ borderRight: 0 }}
        />
      </Sider>
      
      <Layout>
        <Header style={{ background: '#fff', padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Breadcrumb>
            <Breadcrumb.Item>Trang chủ</Breadcrumb.Item>
          </Breadcrumb>
          
          <Dropdown overlay={userMenu} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <Avatar icon={<UserOutlined />} style={{ marginRight: 8 }} />
              <Text>{user?.name}</Text>
            </div>
          </Dropdown>
        </Header>
        
        <Content style={{ margin: 16, padding: 24, background: '#fff' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

// Main App Component
const SimpleApp = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <MainLayout>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/pos" element={<div><Title level={2}>Bán hàng (POS)</Title><Card><Text>Giao diện POS sẽ được hiển thị tại đây...</Text></Card></div>} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/customers" element={<div><Title level={2}>Khách hàng</Title><Card><Text>Danh sách khách hàng sẽ được hiển thị tại đây...</Text></Card></div>} />
        <Route path="/analytics" element={<div><Title level={2}>Báo cáo</Title><Card><Text>Báo cáo phân tích sẽ được hiển thị tại đây...</Text></Card></div>} />
        <Route path="/settings" element={<div><Title level={2}>Cài đặt</Title><Card><Text>Cài đặt hệ thống sẽ được hiển thị tại đây...</Text></Card></div>} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </MainLayout>
  );
};

export default SimpleApp;