// Modern Dashboard Page with beautiful charts and smart KPI cards
import React, { useEffect, useState, useMemo } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Statistic, 
  Typography, 
  Space, 
  Button, 
  Badge, 
  Tooltip, 
  Progress,
  Timeline,
  Avatar,
  Dropdown,
  Menu,
  Switch,
  Divider
} from 'antd';
import {
  DollarOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  BarChartOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  EyeOutlined,
  ReloadOutlined,
  SettingOutlined,
  FilterOutlined,
  CalendarOutlined,
  TeamOutlined,
  ShopOutlined,
  TrophyOutlined,
  ThunderboltOutlined,
  HeartOutlined,
  BellOutlined,
  FireOutlined,
  StarOutlined,
  GiftOutlined,
  CrownOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend } from 'recharts';
import { usePage } from '../stores';
import './DashboardPage.modern.css';

const { Title, Text } = Typography;

// Mock data for demonstration
const mockData = {
  kpis: {
    todayRevenue: 15420000,
    todayOrders: 156,
    todayCustomers: 89,
    averageOrderValue: 98846,
    growth: {
      revenue: 12.5,
      orders: 8.3,
      customers: 15.2,
      averageOrder: -2.1
    }
  },
  revenueChart: Array.from({ length: 7 }, (_, i) => ({
    date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }),
    revenue: Math.floor(Math.random() * 10000000) + 5000000,
    orders: Math.floor(Math.random() * 100) + 50,
    customers: Math.floor(Math.random() * 60) + 30
  })),
  categoryChart: [
    { name: 'Thời trang', value: 4500000, color: '#1890ff' },
    { name: 'Điện tử', value: 3200000, color: '#52c41a' },
    { name: 'Gia dụng', value: 2800000, color: '#faad14' },
    { name: 'Sách', value: 1900000, color: '#f5222d' },
    { name: 'Khác', value: 1200000, color: '#722ed1' }
  ],
  topProducts: [
    { id: 1, name: 'iPhone 15 Pro Max', sold: 45, revenue: 1350000000, trend: 'up', category: 'Điện tử' },
    { id: 2, name: 'Samsung Galaxy S24', sold: 38, revenue: 950000000, trend: 'up', category: 'Điện tử' },
    { id: 3, name: 'MacBook Air M3', sold: 23, revenue: 805000000, trend: 'down', category: 'Điện tử' },
    { id: 4, name: 'iPad Pro 2024', sold: 31, revenue: 620000000, trend: 'up', category: 'Điện tử' },
    { id: 5, name: 'AirPods Pro', sold: 67, revenue: 402000000, trend: 'up', category: 'Phụ kiện' }
  ],
  recentActivities: [
    { type: 'order', user: 'Nguyễn Văn A', action: 'đặt đơn hàng #1234', time: '2 phút trước', amount: 2500000 },
    { type: 'customer', user: 'Trần Thị B', action: 'đăng ký tài khoản mới', time: '5 phút trước' },
    { type: 'product', user: 'Admin', action: 'thêm sản phẩm mới', time: '10 phút trước' },
    { type: 'payment', user: 'Lê Văn C', action: 'thanh toán đơn hàng #1235', time: '15 phút trước', amount: 1200000 }
  ],
  alerts: [
    { type: 'warning', message: '15 sản phẩm sắp hết hàng', priority: 'high' },
    { type: 'info', message: 'Cập nhật hệ thống lúc 2:00 AM', priority: 'medium' },
    { type: 'success', message: 'Đạt mục tiêu doanh thu tháng này', priority: 'low' }
  ]
};

const ModernDashboardPage: React.FC = () => {
  const { setPageTitle, setBreadcrumbs } = usePage();
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPageTitle('Dashboard');
    setBreadcrumbs([{ title: 'Dashboard' }]);
  }, [setPageTitle, setBreadcrumbs]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const kpiCards = useMemo(() => [
    {
      title: 'Doanh thu hôm nay',
      value: mockData.kpis.todayRevenue,
      formatter: formatCurrency,
      growth: mockData.kpis.growth.revenue,
      icon: <DollarOutlined />,
      color: '#1890ff',
      gradient: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)'
    },
    {
      title: 'Đơn hàng',
      value: mockData.kpis.todayOrders,
      growth: mockData.kpis.growth.orders,
      icon: <ShoppingCartOutlined />,
      color: '#52c41a',
      gradient: 'linear-gradient(135deg, #52c41a 0%, #13c2c2 100%)'
    },
    {
      title: 'Khách hàng',
      value: mockData.kpis.todayCustomers,
      growth: mockData.kpis.growth.customers,
      icon: <UserOutlined />,
      color: '#faad14',
      gradient: 'linear-gradient(135deg, #faad14 0%, #fa541c 100%)'
    },
    {
      title: 'Giá trị trung bình',
      value: mockData.kpis.averageOrderValue,
      formatter: formatCurrency,
      growth: mockData.kpis.growth.averageOrder,
      icon: <BarChartOutlined />,
      color: '#722ed1',
      gradient: 'linear-gradient(135deg, #722ed1 0%, #eb2f96 100%)'
    }
  ], []);

  const periodMenu = (
    <Menu
      items={[
        { key: 'today', label: 'Hôm nay' },
        { key: 'week', label: 'Tuần này' },
        { key: 'month', label: 'Tháng này' },
        { key: 'year', label: 'Năm này' }
      ]}
      onClick={({ key }) => setSelectedPeriod(key)}
    />
  );

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order': return <ShoppingCartOutlined className="text-blue-500" />;
      case 'customer': return <UserOutlined className="text-green-500" />;
      case 'product': return <ShopOutlined className="text-orange-500" />;
      case 'payment': return <DollarOutlined className="text-purple-500" />;
      default: return <BellOutlined />;
    }
  };

  return (
    <div className="modern-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <Title level={2} className="dashboard-title">
              <TrophyOutlined className="title-icon" />
              Dashboard Analytics
            </Title>
            <Text className="dashboard-subtitle">
              Tổng quan hiệu suất kinh doanh và các chỉ số quan trọng
            </Text>
          </div>
          <div className="header-right">
            <Space size="middle">
              <Dropdown overlay={periodMenu} placement="bottomRight">
                <Button icon={<CalendarOutlined />}>
                  {selectedPeriod === 'today' ? 'Hôm nay' : 
                   selectedPeriod === 'week' ? 'Tuần này' :
                   selectedPeriod === 'month' ? 'Tháng này' : 'Năm này'}
                </Button>
              </Dropdown>
              <Button icon={<FilterOutlined />}>
                Lọc
              </Button>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={handleRefresh}
                loading={loading}
              >
                Làm mới
              </Button>
              <Switch
                checked={autoRefresh}
                onChange={setAutoRefresh}
                checkedChildren="Auto"
                unCheckedChildren="Manual"
              />
            </Space>
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="dashboard-alerts">
        <Row gutter={[16, 16]}>
          {mockData.alerts.map((alert, index) => (
            <Col key={index} xs={24} md={8}>
              <Card className={`alert-card alert-${alert.type}`} size="small">
                <div className="alert-content">
                  <div className="alert-icon">
                    {alert.type === 'warning' && <FireOutlined />}
                    {alert.type === 'info' && <BellOutlined />}
                    {alert.type === 'success' && <StarOutlined />}
                  </div>
                  <div className="alert-message">
                    {alert.message}
                  </div>
                  <Badge 
                    status={alert.priority === 'high' ? 'error' : alert.priority === 'medium' ? 'warning' : 'success'}
                    text={alert.priority}
                  />
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* KPI Cards */}
      <div className="kpi-section">
        <Row gutter={[24, 24]}>
          {kpiCards.map((kpi, index) => (
            <Col key={index} xs={24} sm={12} lg={6}>
              <Card 
                className="kpi-card" 
                bodyStyle={{ padding: 0 }}
                hoverable
              >
                <div className="kpi-content" style={{ background: kpi.gradient }}>
                  <div className="kpi-header">
                    <div className="kpi-icon">
                      {kpi.icon}
                    </div>
                    <div className="kpi-growth">
                      {kpi.growth > 0 ? (
                        <ArrowUpOutlined className="growth-up" />
                      ) : (
                        <ArrowDownOutlined className="growth-down" />
                      )}
                      <span className={kpi.growth > 0 ? 'growth-up' : 'growth-down'}>
                        {Math.abs(kpi.growth)}%
                      </span>
                    </div>
                  </div>
                  <div className="kpi-body">
                    <div className="kpi-title">{kpi.title}</div>
                    <div className="kpi-value">
                      {kpi.formatter ? kpi.formatter(kpi.value) : kpi.value.toLocaleString()}
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* Charts Section */}
      <Row gutter={[24, 24]} className="charts-section">
        {/* Revenue Chart */}
        <Col xs={24} lg={16}>
          <Card 
            title={
              <div className="chart-header">
                <div className="chart-title">
                  <BarChartOutlined className="chart-icon" />
                  Doanh thu 7 ngày qua
                </div>
                <div className="chart-actions">
                  <Button type="text" icon={<EyeOutlined />} size="small">
                    Chi tiết
                  </Button>
                </div>
              </div>
            }
            className="chart-card"
          >
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={mockData.revenueChart}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1890ff" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#1890ff" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#8c8c8c" />
                <YAxis stroke="#8c8c8c" />
                <ChartTooltip 
                  formatter={(value) => [formatCurrency(value as number), 'Doanh thu']}
                  labelStyle={{ color: '#262626' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#1890ff" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Category Chart */}
        <Col xs={24} lg={8}>
          <Card 
            title={
              <div className="chart-header">
                <div className="chart-title">
                  <ShopOutlined className="chart-icon" />
                  Doanh thu theo danh mục
                </div>
              </div>
            }
            className="chart-card"
          >
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={mockData.categoryChart}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {mockData.categoryChart.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip 
                  formatter={(value) => [formatCurrency(value as number), 'Doanh thu']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Bottom Section */}
      <Row gutter={[24, 24]} className="bottom-section">
        {/* Top Products */}
        <Col xs={24} lg={12}>
          <Card 
            title={
              <div className="card-header">
                <div className="card-title">
                  <CrownOutlined className="card-icon" />
                  Sản phẩm bán chạy
                </div>
                <Link to="/products">
                  <Button type="text" icon={<EyeOutlined />} size="small">
                    Xem tất cả
                  </Button>
                </Link>
              </div>
            }
            className="products-card"
          >
            <div className="products-list">
              {mockData.topProducts.map((product, index) => (
                <div key={product.id} className="product-item">
                  <div className="product-rank">
                    #{index + 1}
                  </div>
                  <div className="product-info">
                    <div className="product-name">{product.name}</div>
                    <div className="product-meta">
                      <span className="product-category">{product.category}</span>
                      <span className="product-sold">Đã bán: {product.sold}</span>
                    </div>
                  </div>
                  <div className="product-revenue">
                    <div className="revenue-amount">
                      {formatCurrency(product.revenue)}
                    </div>
                    <div className={`revenue-trend ${product.trend}`}>
                      {product.trend === 'up' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        {/* Recent Activities */}
        <Col xs={24} lg={12}>
          <Card 
            title={
              <div className="card-header">
                <div className="card-title">
                  <ThunderboltOutlined className="card-icon" />
                  Hoạt động gần đây
                </div>
                <Badge count={mockData.recentActivities.length} showZero>
                  <Button type="text" icon={<BellOutlined />} size="small">
                    Xem tất cả
                  </Button>
                </Badge>
              </div>
            }
            className="activities-card"
          >
            <Timeline className="activities-timeline">
              {mockData.recentActivities.map((activity, index) => (
                <Timeline.Item 
                  key={index} 
                  dot={getActivityIcon(activity.type)}
                  className="activity-item"
                >
                  <div className="activity-content">
                    <div className="activity-text">
                      <Text strong>{activity.user}</Text> {activity.action}
                    </div>
                    <div className="activity-meta">
                      <Text type="secondary">{activity.time}</Text>
                      {activity.amount && (
                        <Text type="success" strong>
                          {formatCurrency(activity.amount)}
                        </Text>
                      )}
                    </div>
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ModernDashboardPage;