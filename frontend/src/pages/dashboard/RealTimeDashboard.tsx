// Enhanced Real-Time Dashboard for Vietnamese POS System
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Statistic, 
  List, 
  Progress, 
  Typography, 
  Badge, 
  Tooltip,
  Alert,
  Spin,
  Button,
  Space,
  Divider,
  Tag
} from 'antd';
import { 
  DollarOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  ProductOutlined,
  WifiOutlined,
  ReloadOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined
} from '@ant-design/icons';
import { useDashboardRealTime } from '../../hooks/useRealTimeData';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useNotification } from '../../hooks/useNotification';
import { 
  DashboardData, 
  InventoryUpdate, 
  OrderStatusUpdate, 
  SystemAlert,
  RealTimeChannels 
} from '../../types/realtime';
import './RealTimeDashboard.css';

const { Title, Text } = Typography;

interface RealTimeDashboardProps {
  refreshInterval?: number;
  enableWebSocket?: boolean;
  channels?: RealTimeChannels[];
}

export default function RealTimeDashboard({
  refreshInterval = 30000,
  enableWebSocket = true,
  channels = ['dashboard', 'inventory', 'orders', 'alerts']
}: RealTimeDashboardProps) {
  const { isOnline, effectiveType } = useNetworkStatus();
  const { showNotification } = useNotification();
  
  // Real-time data hooks
  const {
    data: dashboardData,
    connected: wsConnected,
    loading: wsLoading,
    error: wsError,
    lastUpdated,
    reconnectAttempts,
    reconnect,
    disconnect,
    forceRefresh
  } = useDashboardRealTime();

  // Local state
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [recentUpdates, setRecentUpdates] = useState<Array<{
    type: string;
    message: string;
    timestamp: string;
  }>>([]);

  // Format Vietnamese currency
  const formatVND = useCallback((amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }, []);

  // Calculate growth indicators
  const getGrowthIndicator = useCallback((current: number, previous: number) => {
    if (previous === 0) return { value: 0, status: 'neutral' as const };
    const growth = ((current - previous) / previous) * 100;
    return {
      value: growth,
      status: growth > 0 ? 'positive' as const : growth < 0 ? 'negative' as const : 'neutral' as const
    };
  }, []);

  // Connection status indicator
  const connectionStatus = useMemo(() => {
    if (!isOnline) return { color: 'red', text: 'Offline', icon: <CloseCircleOutlined /> };
    if (!wsConnected) return { color: 'orange', text: 'Connecting...', icon: <SyncOutlined spin /> };
    return { color: 'green', text: 'Connected', icon: <CheckCircleOutlined /> };
  }, [isOnline, wsConnected]);

  // Handle real-time updates
  useEffect(() => {
    if (!dashboardData) return;

    // Add recent update
    setRecentUpdates(prev => [
      {
        type: 'dashboard',
        message: 'Dashboard data updated',
        timestamp: new Date().toISOString()
      },
      ...prev.slice(0, 9) // Keep last 10 updates
    ]);

    // Check for alerts
    if (dashboardData.lowStockItems && dashboardData.lowStockItems.length > 0) {
      const criticalItems = dashboardData.lowStockItems.filter(item => item.percentage < 10);
      if (criticalItems.length > 0) {
        showNotification({
          type: 'warning',
          title: 'Cảnh báo tồn kho',
          message: `${criticalItems.length} sản phẩm sắp hết hàng`,
          duration: 5000
        });
      }
    }
  }, [dashboardData, showNotification]);

  // Handle connection errors
  useEffect(() => {
    if (wsError) {
      setAlerts(prev => [
        {
          id: Date.now().toString(),
          type: 'error',
          title: 'Lỗi kết nối',
          message: wsError,
          dismissible: true,
          autoHide: false,
          timestamp: new Date().toISOString()
        },
        ...prev
      ]);
    }
  }, [wsError]);

  // Auto-reconnect when online
  useEffect(() => {
    if (isOnline && !wsConnected && reconnectAttempts < 5) {
      const timer = setTimeout(() => {
        reconnect();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wsConnected, reconnectAttempts, reconnect]);

  // Dismiss alert
  const dismissAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  // Manual refresh
  const handleRefresh = useCallback(() => {
    forceRefresh();
    showNotification({
      type: 'success',
      title: 'Làm mới',
      message: 'Đang cập nhật dữ liệu...',
      duration: 2000
    });
  }, [forceRefresh, showNotification]);

  // Render loading state
  if (wsLoading && !dashboardData) {
    return (
      <div className="dashboard-loading">
        <Spin size="large" />
        <Text style={{ marginTop: 16 }}>Đang tải dữ liệu dashboard...</Text>
      </div>
    );
  }

  return (
    <div className="real-time-dashboard">
      {/* Header with connection status */}
      <div className="dashboard-header">
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={2} style={{ margin: 0 }}>
              Dashboard Thời gian thực
            </Title>
          </Col>
          <Col>
            <Space>
              <Badge 
                color={connectionStatus.color} 
                text={
                  <span style={{ color: connectionStatus.color }}>
                    {connectionStatus.icon} {connectionStatus.text}
                  </span>
                }
              />
              <Tooltip title="Làm mới dữ liệu">
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={handleRefresh}
                  loading={wsLoading}
                  size="small"
                />
              </Tooltip>
              {effectiveType && (
                <Tag color="blue">
                  <WifiOutlined /> {effectiveType.toUpperCase()}
                </Tag>
              )}
            </Space>
          </Col>
        </Row>

        {/* System alerts */}
        {alerts.map(alert => (
          <Alert
            key={alert.id}
            type={alert.type}
            message={alert.title}
            description={alert.message}
            closable={alert.dismissible}
            onClose={() => dismissAlert(alert.id)}
            style={{ marginBottom: 8 }}
          />
        ))}

        {/* Last updated info */}
        {lastUpdated && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            Cập nhật lần cuối: {new Date(lastUpdated).toLocaleString('vi-VN')}
          </Text>
        )}
      </div>

      {/* Main metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable className="metric-card">
            <Statistic
              title="Doanh thu hôm nay"
              value={dashboardData?.revenue || 0}
              precision={0}
              valueStyle={{ color: '#3f8600' }}
              prefix={<DollarOutlined />}
              formatter={(value) => formatVND(Number(value))}
            />
            <div className="metric-trend">
              <Text type="secondary" style={{ fontSize: 12 }}>
                So với hôm qua
              </Text>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable className="metric-card">
            <Statistic
              title="Đơn hàng hôm nay"
              value={dashboardData?.orders || 0}
              valueStyle={{ color: '#1890ff' }}
              prefix={<ShoppingCartOutlined />}
            />
            <div className="metric-trend">
              <Text type="secondary" style={{ fontSize: 12 }}>
                Trung bình: {dashboardData?.orders ? Math.round(dashboardData.orders / 24) : 0}/giờ
              </Text>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable className="metric-card">
            <Statistic
              title="Khách hàng"
              value={dashboardData?.customers || 0}
              valueStyle={{ color: '#722ed1' }}
              prefix={<UserOutlined />}
            />
            <div className="metric-trend">
              <Text type="secondary" style={{ fontSize: 12 }}>
                Đang hoạt động: {dashboardData?.activeSessions || 0}
              </Text>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable className="metric-card">
            <Statistic
              title="Giá trị đơn TB"
              value={dashboardData?.orders && dashboardData.orders > 0 
                ? (dashboardData.revenue / dashboardData.orders) 
                : 0}
              precision={0}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<ProductOutlined />}
              formatter={(value) => formatVND(Number(value))}
            />
            <div className="metric-trend">
              <Text type="secondary" style={{ fontSize: 12 }}>
                Mục tiêu: {formatVND(200000)}
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Recent activity and alerts */}
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <Card 
            title="Đơn hàng gần đây" 
            extra={
              <Badge 
                count={dashboardData?.recentOrders?.length || 0} 
                showZero 
                style={{ backgroundColor: '#52c41a' }}
              />
            }
            className="activity-card"
          >
            <List
              dataSource={dashboardData?.recentOrders || []}
              renderItem={(order) => (
                <List.Item className="order-item">
                  <List.Item.Meta
                    title={
                      <Space>
                        <Text strong>Đơn hàng #{order.id}</Text>
                        <Tag color="blue">Mới</Tag>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={0}>
                        <Text>{order.customer_name}</Text>
                        <Text type="secondary">
                          {new Date(order.created_at).toLocaleString('vi-VN')}
                        </Text>
                      </Space>
                    }
                  />
                  <div className="order-amount">
                    <Text strong>{formatVND(order.total)}</Text>
                  </div>
                </List.Item>
              )}
              locale={{
                emptyText: 'Chưa có đơn hàng nào'
              }}
            />
          </Card>
        </Col>
        
        <Col xs={24} xl={8}>
          <Card 
            title="Cảnh báo tồn kho"
            extra={
              <Badge 
                count={dashboardData?.lowStockItems?.length || 0} 
                showZero 
                style={{ backgroundColor: '#ff4d4f' }}
              />
            }
            className="alerts-card"
          >
            <List
              dataSource={dashboardData?.lowStockItems || []}
              renderItem={(item) => (
                <List.Item className="stock-item">
                  <List.Item.Meta
                    title={
                      <Space>
                        <Text strong>{item.name}</Text>
                        {item.percentage < 10 && (
                          <Tag color="red" icon={<WarningOutlined />}>
                            Khẩn cấp
                          </Tag>
                        )}
                      </Space>
                    }
                    description={`Còn ${item.stock} sản phẩm`}
                  />
                  <div className="stock-progress">
                    <Progress 
                      percent={item.percentage} 
                      size="small" 
                      status={item.percentage < 10 ? 'exception' : 'normal'}
                      showInfo={false}
                    />
                  </div>
                </List.Item>
              )}
              locale={{
                emptyText: 'Tồn kho ổn định'
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Recent updates footer */}
      {recentUpdates.length > 0 && (
        <Card 
          title="Cập nhật gần đây" 
          size="small" 
          className="recent-updates"
          style={{ marginTop: 16 }}
        >
          <List
            dataSource={recentUpdates.slice(0, 5)}
            renderItem={(update) => (
              <List.Item size="small">
                <List.Item.Meta
                  title={
                    <Space>
                      <Badge status="processing" />
                      <Text style={{ fontSize: 12 }}>{update.message}</Text>
                    </Space>
                  }
                  description={
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {new Date(update.timestamp).toLocaleString('vi-VN')}
                    </Text>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )}
    </div>
  );
}