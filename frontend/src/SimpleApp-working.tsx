import React, { useState } from 'react';
import { ConfigProvider, Layout, Button, Card, Row, Col, Statistic, Typography, Alert, Input, Form } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { 
  DollarOutlined, 
  ShoppingCartOutlined, 
  UserOutlined, 
  ShopOutlined,
  LoginOutlined
} from '@ant-design/icons';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

function SimpleApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');

  const handleLogin = (values: any) => {
    console.log('Login attempt:', values);
    // Simple demo login - accept any email/password
    if (values.email && values.password) {
      setIsLoggedIn(true);
      setCurrentPage('dashboard');
    }
  };

  const LoginPage = () => (
    <div style={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1890ff 0%, #52c41a 100%)'
    }}>
      <Card 
        style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
        title={
          <div style={{ textAlign: 'center' }}>
            <ShopOutlined style={{ fontSize: '32px', color: '#1890ff', marginBottom: '8px' }} />
            <Title level={3} style={{ margin: 0 }}>KhoAugment POS</Title>
            <Text type="secondary">Hệ thống bán hàng thông minh</Text>
          </div>
        }
      >
        <Form onFinish={handleLogin} layout="vertical">
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, message: 'Vui lòng nhập email!' }]}
          >
            <Input type="email" placeholder="admin@khoaugment.com" />
          </Form.Item>
          
          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
          >
            <Input.Password placeholder="••••••••" />
          </Form.Item>
          
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              block 
              size="large"
              icon={<LoginOutlined />}
            >
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>
        
        <Alert
          message="Demo Login"
          description="Nhập bất kỳ email và mật khẩu nào để đăng nhập demo"
          type="info"
          showIcon
          style={{ marginTop: '16px' }}
        />
      </Card>
    </div>
  );

  const DashboardPage = () => (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Dashboard</Title>
      
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Doanh thu hôm nay"
              value={15420000}
              precision={0}
              valueStyle={{ color: '#3f8600' }}
              prefix={<DollarOutlined />}
              suffix="₫"
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Đơn hàng"
              value={87}
              valueStyle={{ color: '#1890ff' }}
              prefix={<ShoppingCartOutlined />}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Khách hàng"
              value={234}
              valueStyle={{ color: '#722ed1' }}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Sản phẩm"
              value={156}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<ShopOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Alert
        message="Hệ thống hoạt động bình thường"
        description="Tất cả dịch vụ đang chạy ổn định. Dữ liệu được cập nhật real-time."
        type="success"
        showIcon
        style={{ marginBottom: '24px' }}
      />

      <Card title="Tính năng chính">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card type="inner" title="Bán hàng POS">
              <p>Giao diện bán hàng nhanh chóng, hỗ trợ barcode và thanh toán đa dạng</p>
              <Button type="primary" onClick={() => setCurrentPage('pos')}>
                Mở POS
              </Button>
            </Card>
          </Col>
          
          <Col xs={24} md={8}>
            <Card type="inner" title="Quản lý sản phẩm">
              <p>Quản lý kho hàng, danh mục và giá cả một cách hiệu quả</p>
              <Button onClick={() => setCurrentPage('products')}>
                Quản lý
              </Button>
            </Card>
          </Col>
          
          <Col xs={24} md={8}>
            <Card type="inner" title="Báo cáo">
              <p>Thống kê doanh thu, lợi nhuận và xu hướng kinh doanh</p>
              <Button onClick={() => setCurrentPage('reports')}>
                Xem báo cáo
              </Button>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );

  const POSPage = () => (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Điểm bán hàng (POS)</Title>
      <Alert
        message="Tính năng POS"
        description="Giao diện bán hàng đang được phát triển. Sẽ có đầy đủ tính năng quét mã vạch, tính tiền và in hóa đơn."
        type="info"
        style={{ marginBottom: '24px' }}
      />
      
      <Row gutter={16}>
        <Col span={16}>
          <Card title="Sản phẩm">
            <p>Danh sách sản phẩm sẽ hiển thị ở đây</p>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Giỏ hàng">
            <p>Giỏ hàng trống</p>
            <Button type="primary" block>Thanh toán</Button>
          </Card>
        </Col>
      </Row>
    </div>
  );

  const GenericPage = ({ title, description }: { title: string; description: string }) => (
    <div style={{ padding: '24px' }}>
      <Title level={2}>{title}</Title>
      <Alert
        message="Tính năng đang phát triển"
        description={description}
        type="warning"
        style={{ marginBottom: '24px' }}
      />
      <Card>
        <p>Tính năng này sẽ được hoàn thiện trong phiên bản tiếp theo.</p>
        <Button onClick={() => setCurrentPage('dashboard')}>
          Quay lại Dashboard
        </Button>
      </Card>
    </div>
  );

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'pos':
        return <POSPage />;
      case 'products':
        return <GenericPage title="Quản lý sản phẩm" description="Quản lý danh mục, kho hàng và giá cả sản phẩm" />;
      case 'customers':
        return <GenericPage title="Quản lý khách hàng" description="Quản lý thông tin khách hàng và chương trình khuyến mãi" />;
      case 'reports':
        return <GenericPage title="Báo cáo & Thống kê" description="Xem báo cáo doanh thu, lợi nhuận và phân tích kinh doanh" />;
      default:
        return <DashboardPage />;
    }
  };

  if (!isLoggedIn) {
    return (
      <ConfigProvider locale={viVN}>
        <LoginPage />
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider locale={viVN}>
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ 
          background: '#fff', 
          padding: '0 24px', 
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <ShopOutlined style={{ fontSize: '24px', color: '#1890ff', marginRight: '12px' }} />
            <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
              KhoAugment POS
            </Title>
          </div>
          
          <div>
            <Button.Group>
              <Button 
                type={currentPage === 'dashboard' ? 'primary' : 'default'}
                onClick={() => setCurrentPage('dashboard')}
              >
                Dashboard
              </Button>
              <Button 
                type={currentPage === 'pos' ? 'primary' : 'default'}
                onClick={() => setCurrentPage('pos')}
              >
                POS
              </Button>
              <Button 
                type={currentPage === 'products' ? 'primary' : 'default'}
                onClick={() => setCurrentPage('products')}
              >
                Sản phẩm
              </Button>
              <Button 
                type={currentPage === 'customers' ? 'primary' : 'default'}
                onClick={() => setCurrentPage('customers')}
              >
                Khách hàng
              </Button>
              <Button 
                type={currentPage === 'reports' ? 'primary' : 'default'}
                onClick={() => setCurrentPage('reports')}
              >
                Báo cáo
              </Button>
            </Button.Group>
            
            <Button 
              style={{ marginLeft: '16px' }}
              onClick={() => setIsLoggedIn(false)}
            >
              Đăng xuất
            </Button>
          </div>
        </Header>
        
        <Content>
          {renderContent()}
        </Content>
        
        <Footer style={{ textAlign: 'center', background: '#f0f0f2' }}>
          <Text type="secondary">
            KhoAugment POS ©2024 - Hệ thống bán hàng thông minh cho doanh nghiệp Việt Nam
          </Text>
        </Footer>
      </Layout>
    </ConfigProvider>
  );
}

export default SimpleApp;