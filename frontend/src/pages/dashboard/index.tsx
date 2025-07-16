import React, { useState } from 'react';
import { Button, Space, Tooltip, Switch } from 'antd';
import { 
  ThunderboltOutlined,
  ReloadOutlined,
  SettingOutlined 
} from '@ant-design/icons';
import RealTimeDashboard from './RealTimeDashboard';
import RealTimeErrorBoundary from '../../components/common/RealTimeErrorBoundary';
import RealTimeNotificationSystem from '../../components/notifications/RealTimeNotificationSystem';
import { Row, Col, Card, Statistic, List, Progress, Typography } from 'antd';
import { 
  DollarOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  ProductOutlined 
} from '@ant-design/icons';

const { Title } = Typography;

// Legacy mock data for fallback
const recentOrders = [
  { id: 'ORD001', customer: 'Nguyễn Văn A', total: 250000, time: '10:30 AM' },
  { id: 'ORD002', customer: 'Trần Thị B', total: 180000, time: '11:15 AM' },
  { id: 'ORD003', customer: 'Lê Văn C', total: 320000, time: '12:00 PM' },
  { id: 'ORD004', customer: 'Phạm Thị D', total: 150000, time: '12:30 PM' },
  { id: 'ORD005', customer: 'Hoàng Văn E', total: 420000, time: '1:15 PM' }
];

const lowStockItems = [
  { name: 'Coca Cola 330ml', stock: 5, percentage: 10 },
  { name: 'Bánh mì sandwich', stock: 8, percentage: 16 },
  { name: 'Nước suối Lavie', stock: 12, percentage: 24 },
  { name: 'Kẹo Mentos', stock: 3, percentage: 6 },
  { name: 'Mì tôm Hảo Hảo', stock: 15, percentage: 30 }
];

// Legacy Dashboard Component
function LegacyDashboard() {
  return (
    <div className="dashboard-container" style={{ 
      padding: '0',
      background: 'transparent'
    }}>
      <Title 
        level={2} 
        style={{ 
          marginBottom: 24,
          fontSize: 'clamp(1.5rem, 4vw, 2rem)'
        }}
      >
        Dashboard (Static)
      </Title>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            hoverable
            style={{ 
              borderRadius: 8,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <Statistic
              title="Doanh thu hôm nay"
              value={15420000}
              precision={0}
              valueStyle={{ 
                color: '#3f8600',
                fontSize: 'clamp(1.2rem, 3vw, 1.5rem)'
              }}
              prefix={<DollarOutlined />}
              suffix="₫"
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card 
            hoverable
            style={{ 
              borderRadius: 8,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <Statistic
              title="Đơn hàng hôm nay"
              value={87}
              valueStyle={{ 
                color: '#1890ff',
                fontSize: 'clamp(1.2rem, 3vw, 1.5rem)'
              }}
              prefix={<ShoppingCartOutlined />}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card 
            hoverable
            style={{ 
              borderRadius: 8,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <Statistic
              title="Khách hàng mới"
              value={12}
              valueStyle={{ 
                color: '#722ed1',
                fontSize: 'clamp(1.2rem, 3vw, 1.5rem)'
              }}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card 
            hoverable
            style={{ 
              borderRadius: 8,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <Statistic
              title="Sản phẩm bán chạy"
              value={45}
              valueStyle={{ 
                color: '#fa8c16',
                fontSize: 'clamp(1.2rem, 3vw, 1.5rem)'
              }}
              prefix={<ProductOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <Card 
            title="Đơn hàng gần đây" 
            size="small"
            style={{ 
              borderRadius: 8,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              height: '100%'
            }}
          >
            <List
              dataSource={recentOrders}
              size="small"
              renderItem={order => (
                <List.Item
                  style={{
                    padding: '8px 16px',
                    borderBottom: '1px solid #f0f0f0'
                  }}
                >
                  <List.Item.Meta
                    title={
                      <span style={{ 
                        fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                        fontWeight: 500
                      }}>
                        Đơn hàng #{order.id}
                      </span>
                    }
                    description={
                      <span style={{ 
                        fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                        color: '#666'
                      }}>
                        {order.customer} - {order.total.toLocaleString()}₫
                      </span>
                    }
                  />
                  <div style={{ 
                    fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                    color: '#999'
                  }}>
                    {order.time}
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        
        <Col xs={24} xl={8}>
          <Card 
            title="Tồn kho sắp hết" 
            size="small"
            style={{ 
              borderRadius: 8,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              height: '100%'
            }}
          >
            <List
              dataSource={lowStockItems}
              size="small"
              renderItem={item => (
                <List.Item
                  style={{
                    padding: '8px 16px',
                    borderBottom: '1px solid #f0f0f0',
                    flexDirection: 'column',
                    alignItems: 'stretch'
                  }}
                >
                  <List.Item.Meta
                    title={
                      <span style={{ 
                        fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                        fontWeight: 500
                      }}>
                        {item.name}
                      </span>
                    }
                    description={
                      <span style={{ 
                        fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                        color: '#666'
                      }}>
                        Còn {item.stock} sản phẩm
                      </span>
                    }
                    style={{ marginBottom: 8 }}
                  />
                  <Progress 
                    percent={item.percentage} 
                    size="small" 
                    status={item.percentage < 20 ? 'exception' : 'normal'}
                    strokeWidth={6}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default function Dashboard() {
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Get WebSocket URL from environment or use default
  const wsUrl = import.meta.env.VITE_WEBSOCKET_URL || 'wss://kho1.pages.dev/ws';
  
  const handleToggleRealTime = () => {
    setRealTimeEnabled(!realTimeEnabled);
    setRefreshKey(prev => prev + 1);
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error('Dashboard error:', error);
    console.error('Error info:', errorInfo);
    
    // Optional: Send error to monitoring service
    // errorReportingService.report(error, errorInfo);
  };

  const handleRetry = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Header Controls */}
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        right: 0, 
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '8px 16px',
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '0 0 0 8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <Space>
          <Tooltip title={realTimeEnabled ? 'Tắt cập nhật thời gian thực' : 'Bật cập nhật thời gian thực'}>
            <Switch
              checked={realTimeEnabled}
              onChange={handleToggleRealTime}
              checkedChildren={<ThunderboltOutlined />}
              unCheckedChildren={<SettingOutlined />}
            />
          </Tooltip>
          
          <Tooltip title="Làm mới dữ liệu">
            <Button
              type="text"
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              size="small"
            />
          </Tooltip>
          
          {realTimeEnabled && (
            <RealTimeNotificationSystem
              websocketUrl={wsUrl}
              showBadge={true}
              enableSound={true}
              enableDesktop={true}
              onNotificationClick={(notification) => {
                console.log('Notification clicked:', notification);
              }}
            />
          )}
        </Space>
      </div>

      {/* Main Dashboard Content */}
      <RealTimeErrorBoundary
        onError={handleError}
        onRetry={handleRetry}
        showNetworkStatus={realTimeEnabled}
        enableAutoRetry={realTimeEnabled}
        maxRetries={3}
        fallback={<LegacyDashboard />}
      >
        {realTimeEnabled ? (
          <RealTimeDashboard
            key={refreshKey}
            refreshInterval={30000}
            enableWebSocket={true}
            channels={['dashboard', 'inventory', 'orders', 'alerts']}
          />
        ) : (
          <LegacyDashboard />
        )}
      </RealTimeErrorBoundary>
    </div>
  );
}