import React from 'react';
import { Layout, Typography, Button, Card, Row, Col, Statistic } from 'antd';
import { DollarOutlined, ShoppingCartOutlined, UserOutlined, ShopOutlined } from '@ant-design/icons';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

function App() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        background: '#1890ff', 
        display: 'flex', 
        alignItems: 'center',
        padding: '0 24px' 
      }}>
        <ShopOutlined style={{ fontSize: '24px', color: '#fff', marginRight: '12px' }} />
        <Title level={3} style={{ margin: 0, color: '#fff' }}>
          KhoAugment POS
        </Title>
      </Header>
      
      <Content style={{ padding: '24px' }}>
        <div style={{ marginBottom: '24px' }}>
          <Title level={2}>Dashboard</Title>
          <Text type="secondary">Hệ thống bán hàng thông minh cho doanh nghiệp Việt Nam</Text>
        </div>
        
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

        <Card title="Tính năng chính" style={{ marginBottom: '24px' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Card type="inner" title="Bán hàng POS">
                <p>Giao diện bán hàng nhanh chóng, hỗ trợ barcode và thanh toán đa dạng</p>
                <Button type="primary">Mở POS</Button>
              </Card>
            </Col>
            
            <Col xs={24} md={8}>
              <Card type="inner" title="Quản lý sản phẩm">
                <p>Quản lý kho hàng, danh mục và giá cả một cách hiệu quả</p>
                <Button>Quản lý</Button>
              </Card>
            </Col>
            
            <Col xs={24} md={8}>
              <Card type="inner" title="Báo cáo">
                <p>Thống kê doanh thu, lợi nhuận và xu hướng kinh doanh</p>
                <Button>Xem báo cáo</Button>
              </Card>
            </Col>
          </Row>
        </Card>
      </Content>
      
      <Footer style={{ textAlign: 'center', background: '#f0f0f2' }}>
        <Text type="secondary">
          KhoAugment POS ©2024 - Hệ thống bán hàng thông minh cho doanh nghiệp Việt Nam
        </Text>
      </Footer>
    </Layout>
  );
}

export default App;