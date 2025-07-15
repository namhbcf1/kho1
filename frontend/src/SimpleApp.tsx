import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Layout, Form, Input, Button, Typography, Card, Alert, Menu, Avatar, Dropdown, Breadcrumb, Statistic, Row, Col, Badge } from 'antd';
import { UserOutlined, LockOutlined, ShoppingCartOutlined, AppstoreOutlined, TeamOutlined, BarChartOutlined, SettingOutlined, LogoutOutlined, DollarOutlined, ArrowUpOutlined, SyncOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';

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

  // Effect để sync với localStorage changes
  useEffect(() => {
    const syncUser = () => {
      const stored = localStorage.getItem('auth_user');
      const parsedUser = stored ? JSON.parse(stored) : null;
      setUser(parsedUser);
    };

    // Listen for storage changes
    window.addEventListener('storage', syncUser);
    
    // Check every 100ms for state sync (fallback)
    const interval = setInterval(syncUser, 100);

    return () => {
      window.removeEventListener('storage', syncUser);
      clearInterval(interval);
    };
  }, []);

  const login = (email: string, password: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Demo accounts matching the LoginPage
        const demoUsers = [
          {
            email: 'admin@khoaugment.com',
            password: '123456',
            user: {
              id: 'admin-001',
              email: 'admin@khoaugment.com',
              name: 'System Administrator',
              role: 'admin'
            }
          },
          {
            email: 'manager@khoaugment.com',
            password: '123456',
            user: {
              id: 'manager-001',
              email: 'manager@khoaugment.com',
              name: 'Store Manager',
              role: 'manager'
            }
          },
          {
            email: 'cashier@khoaugment.com',
            password: '123456',
            user: {
              id: 'cashier-001',
              email: 'cashier@khoaugment.com',
              name: 'Thu ngân viên',
              role: 'cashier'
            }
          }
        ];
        
        const demoUser = demoUsers.find(u => u.email === email && u.password === password);
        
        if (demoUser) {
          // Force update state immediately
          setUser(demoUser.user);
          localStorage.setItem('auth_user', JSON.stringify(demoUser.user));
          
          // Force a re-render after a short delay to ensure state is updated
          setTimeout(() => {
            setUser(demoUser.user);
            resolve();
          }, 100);
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
      // Force navigation với replace để tránh back button issues
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 200);
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
          <Text code>admin@khoaugment.com / 123456</Text><br />
          <Text code>manager@khoaugment.com / 123456</Text><br />
          <Text code>cashier@khoaugment.com / 123456</Text>
        </div>
      </Card>
    </div>
  );
};

// Enhanced Dashboard with React Query
const DashboardPage = () => {
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      // Simulate API call with fallback data
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        todayRevenue: 15450000,
        totalOrders: 234,
        totalCustomers: 1847,
        productsSold: 456,
        revenueGrowth: 12.5,
        ordersGrowth: 8.3,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (isLoading) {
    return (
      <div>
        <Title level={2}>Tổng quan</Title>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
          {[1, 2, 3, 4].map(i => (
            <Card key={i} loading />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert 
        message="Lỗi tải dữ liệu" 
        description="Không thể tải thông tin dashboard"
        type="error" 
        showIcon 
      />
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2}>Tổng quan hệ thống</Title>
        <Badge status="processing" text="Đang cập nhật" />
      </div>
      
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Doanh thu hôm nay"
              value={dashboardData?.todayRevenue}
              precision={0}
              valueStyle={{ color: '#3f8600' }}
              prefix={<DollarOutlined />}
              suffix="₫"
              formatter={(value) => `${(value as number / 1000000).toFixed(1)}M`}
            />
            <div style={{ marginTop: 8 }}>
              <ArrowUpOutlined style={{ color: '#52c41a' }} />
              <span style={{ color: '#52c41a', marginLeft: 4 }}>
                +{dashboardData?.revenueGrowth}%
              </span>
              <span style={{ color: '#666', marginLeft: 8 }}>so với hôm qua</span>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Đơn hàng"
              value={dashboardData?.totalOrders}
              valueStyle={{ color: '#1890ff' }}
              prefix={<ShoppingCartOutlined />}
            />
            <div style={{ marginTop: 8 }}>
              <ArrowUpOutlined style={{ color: '#52c41a' }} />
              <span style={{ color: '#52c41a', marginLeft: 4 }}>
                +{dashboardData?.ordersGrowth}%
              </span>
              <span style={{ color: '#666', marginLeft: 8 }}>so với hôm qua</span>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Khách hàng"
              value={dashboardData?.totalCustomers}
              valueStyle={{ color: '#faad14' }}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Sản phẩm đã bán"
              value={dashboardData?.productsSold}
              valueStyle={{ color: '#722ed1' }}
              prefix={<AppstoreOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={16}>
          <Card title="Doanh thu 7 ngày qua" extra={<SyncOutlined />}>
            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Text type="secondary">Biểu đồ doanh thu sẽ được hiển thị tại đây</Text>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} lg={8}>
          <Card title="Sản phẩm bán chạy">
            <div style={{ height: 300 }}>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '12px 0',
                  borderBottom: i < 5 ? '1px solid #f0f0f0' : 'none'
                }}>
                  <span>Sản phẩm {i}</span>
                  <Badge count={`${50 + i * 10}`} style={{ backgroundColor: '#52c41a' }} />
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
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