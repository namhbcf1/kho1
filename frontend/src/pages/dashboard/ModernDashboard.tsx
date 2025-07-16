// Modern Dashboard for Vietnamese POS System
import {
    ArrowDownOutlined,
    ArrowUpOutlined,
    BarChartOutlined,
    BellOutlined,
    ClockCircleOutlined,
    DatabaseOutlined,
    DollarOutlined,
    DownloadOutlined,
    ExclamationCircleOutlined,
    EyeOutlined,
    FileTextOutlined,
    FilterOutlined,
    FireOutlined,
    LineChartOutlined,
    PieChartOutlined,
    PrinterOutlined,
    SettingOutlined,
    ShoppingCartOutlined,
    SyncOutlined,
    TeamOutlined,
    UserOutlined
} from '@ant-design/icons';
import {
    Alert,
    Avatar,
    Badge,
    Button,
    Card,
    Col,
    DatePicker,
    Input,
    List,
    Row,
    Select,
    Space,
    Statistic,
    Table,
    Tabs,
    Tag,
    Typography
} from 'antd';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DualAxes, Pie } from '../../components/charts/ChartWrappers';

// Mock data imports
import './dashboard.css';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Search } = Input;

// Format Vietnamese currency
const formatVND = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

const ModernDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<[any, any] | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [activeTab, setActiveTab] = useState('overview');

  // Sample data - in production, this would come from API
  const [dashboardData, setDashboardData] = useState({
    totalRevenue: 45680000,
    totalOrders: 234,
    totalCustomers: 1456,
    averageOrder: 195000,
    revenueGrowth: 12.5,
    orderGrowth: 8.3,
    customerGrowth: 15.2,
    averageOrderGrowth: -2.1,
  });

  const [realtimeData, setRealtimeData] = useState({
    onlineUsers: 22,
    pendingOrders: 3,
    pendingPayments: 5,
    lowStock: 8,
  });

  useEffect(() => {
    // Simulate data loading
    setTimeout(() => {
      setLoading(false);
    }, 1000);

    // Simulate real-time updates
    const interval = setInterval(() => {
      setRealtimeData(prev => ({
        ...prev,
        onlineUsers: Math.max(prev.onlineUsers + Math.floor(Math.random() * 3) - 1, 0),
        pendingOrders: Math.max(prev.pendingOrders + Math.floor(Math.random() * 2) - 1, 0),
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Sales chart data for the last week
  const salesData = [
    { date: '07/10', revenue: 4200000, orders: 18 },
    { date: '07/11', revenue: 5800000, orders: 25 },
    { date: '07/12', revenue: 3900000, orders: 16 },
    { date: '07/13', revenue: 6700000, orders: 29 },
    { date: '07/14', revenue: 5200000, orders: 22 },
    { date: '07/15', revenue: 7100000, orders: 31 },
    { date: '07/16', revenue: 8900000, orders: 38 },
  ];

  // Pie chart data for product categories
  const categoryData = [
    { type: 'Điện thoại', value: 12500000 },
    { type: 'Laptop', value: 18900000 },
    { type: 'Phụ kiện', value: 3400000 },
    { type: 'Tablet', value: 7200000 },
    { type: 'Đồng hồ', value: 5600000 },
  ];

  // Recent orders data
  const recentOrders = [
    {
      key: '1',
      id: 'DH001',
      customer: 'Nguyễn Văn A',
      amount: 2450000,
      status: 'completed',
      time: '10:30',
      items: 3,
      phone: '0901234567',
    },
    {
      key: '2',
      id: 'DH002',
      customer: 'Trần Thị B',
      amount: 1890000,
      status: 'pending',
      time: '11:15',
      items: 2,
      phone: '0912345678',
    },
    {
      key: '3',
      id: 'DH003',
      customer: 'Lê Văn C',
      amount: 3200000,
      status: 'processing',
      time: '11:45',
      items: 5,
      phone: '0923456789',
    },
    {
      key: '4',
      id: 'DH004',
      customer: 'Phạm Thị D',
      amount: 890000,
      status: 'completed',
      time: '12:30',
      items: 1,
      phone: '0934567890',
    },
    {
      key: '5',
      id: 'DH005',
      customer: 'Hoàng Văn E',
      amount: 4560000,
      status: 'processing',
      time: '13:00',
      items: 7,
      phone: '0945678901',
    },
  ];

  // Product inventory data
  const inventoryData = [
    { name: 'iPhone 15 Pro Max', stock: 15, alert: 10, category: 'Điện thoại', price: 35000000, sold: 45 },
    { name: 'Samsung Galaxy S24', stock: 21, alert: 8, category: 'Điện thoại', price: 25000000, sold: 38 },
    { name: 'MacBook Air M3', stock: 7, alert: 10, category: 'Laptop', price: 35000000, sold: 23 },
    { name: 'iPad Pro 2024', stock: 12, alert: 8, category: 'Tablet', price: 20000000, sold: 31 },
    { name: 'AirPods Pro', stock: 35, alert: 15, category: 'Phụ kiện', price: 6000000, sold: 67 },
  ];

  // Recent activities
  const activities = [
    {
      id: 1,
      user: 'Admin',
      action: 'đã thêm sản phẩm mới',
      target: 'Xiaomi 14 Pro',
      time: '10 phút trước',
      type: 'product'
    },
    {
      id: 2,
      user: 'Thu Ngân',
      action: 'đã hoàn thành đơn hàng',
      target: '#DH001',
      time: '15 phút trước',
      type: 'order'
    },
    {
      id: 3,
      user: 'Kho',
      action: 'đã nhập thêm hàng',
      target: 'iPhone 15 (10 cái)',
      time: '30 phút trước',
      type: 'inventory'
    },
    {
      id: 4,
      user: 'Admin',
      action: 'đã tạo tài khoản mới',
      target: 'Nguyễn Văn B (Nhân viên)',
      time: '1 giờ trước',
      type: 'user'
    },
    {
      id: 5,
      user: 'Hệ thống',
      action: 'đã sao lưu dữ liệu',
      target: 'backup_16072025.zip',
      time: '2 giờ trước',
      type: 'system'
    }
  ];

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge status="success" text="Hoàn thành" />;
      case 'processing':
        return <Badge status="processing" text="Đang xử lý" />;
      case 'pending':
        return <Badge status="warning" text="Chờ xử lý" />;
      default:
        return <Badge status="default" text="Không xác định" />;
    }
  };

  // Get activity icon
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'product':
        return <ShoppingCartOutlined style={{ color: '#1890ff' }} />;
      case 'order':
        return <FileTextOutlined style={{ color: '#52c41a' }} />;
      case 'inventory':
        return <DatabaseOutlined style={{ color: '#722ed1' }} />;
      case 'user':
        return <UserOutlined style={{ color: '#fa8c16' }} />;
      case 'system':
        return <SettingOutlined style={{ color: '#f5222d' }} />;
      default:
        return <BellOutlined style={{ color: '#1890ff' }} />;
    }
  };

  // Get stock status
  const getStockStatus = (stock: number, alert: number) => {
    if (stock <= 0) return <Tag color="error">Hết hàng</Tag>;
    if (stock <= alert) return <Tag color="warning">Sắp hết</Tag>;
    return <Tag color="success">Đủ hàng</Tag>;
  };

  // Configure the sales chart
  const salesChartConfig = {
    data: salesData,
    xField: 'date',
    yField: ['revenue', 'orders'],
    geometryOptions: [
      {
        geometry: 'column',
        color: '#1890ff',
      },
      {
        geometry: 'line',
        color: '#f5222d',
        lineStyle: {
          lineWidth: 2,
        },
      },
    ],
    yAxis: {
      revenue: {
        min: 0,
        title: {
          text: 'Doanh thu (VND)',
        },
        label: {
          formatter: (v: any) => `${(v / 1000000).toFixed(1)}tr`,
        },
      },
      orders: {
        min: 0,
        title: {
          text: 'Số đơn',
        },
        label: {
          formatter: (v: any) => `${v}`,
        },
      },
    },
    legend: {
      itemName: {
        formatter: (text: string) => {
          if (text === 'revenue') return 'Doanh thu';
          if (text === 'orders') return 'Số đơn';
          return text;
        },
      },
    },
  };

  // Configure the category pie chart
  const categoryChartConfig = {
    data: categoryData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    innerRadius: 0.6,
    label: {
      type: 'inner',
      offset: '-50%',
      autoRotate: false,
      content: '{percentage}',
      style: {
        fill: '#fff',
        fontSize: 14,
        textAlign: 'center',
      },
    },
    interactions: [{ type: 'element-active' }],
    statistic: {
      title: {
        content: 'Doanh thu',
        style: {
          fontSize: '14px',
        },
      },
      content: {
        style: {
          fontSize: '16px',
        },
        formatter: () => formatVND(categoryData.reduce((acc, item) => acc + item.value, 0)),
      },
    },
    legend: {
      position: 'bottom',
    },
  };

  // Table columns for recent orders
  const orderColumns = [
    {
      title: 'Mã đơn',
      dataIndex: 'id',
      key: 'id',
      render: (text: string) => (
        <a href="#" onClick={(e) => e.preventDefault()}>{text}</a>
      ),
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customer',
      key: 'customer',
    },
    {
      title: 'Số lượng',
      dataIndex: 'items',
      key: 'items',
      render: (count: number) => (
        <span>{count} sản phẩm</span>
      ),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => (
        <span className="font-semibold">{formatVND(amount)}</span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusBadge(status),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record: any) => (
        <Space size="small">
          <Button size="small" icon={<EyeOutlined />} />
          <Button size="small" icon={<PrinterOutlined />} />
        </Space>
      ),
    },
  ];

  // Table columns for inventory
  const inventoryColumns = [
    {
      title: 'Sản phẩm',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Danh mục',
      dataIndex: 'category',
      key: 'category',
      render: (text: string) => <Tag>{text}</Tag>,
    },
    {
      title: 'Giá bán',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => (
        <span>{formatVND(price)}</span>
      ),
    },
    {
      title: 'Tồn kho',
      dataIndex: 'stock',
      key: 'stock',
      render: (stock: number, record: any) => (
        <Space>
          <span>{stock}</span>
          {getStockStatus(stock, record.alert)}
        </Space>
      ),
    },
    {
      title: 'Đã bán',
      dataIndex: 'sold',
      key: 'sold',
    },
  ];

  // Render KPI cards
  const renderKpiCards = () => {
    const kpis = [
      {
        title: 'Doanh thu hôm nay',
        value: dashboardData.totalRevenue,
        format: formatVND,
        icon: <DollarOutlined />,
        growth: dashboardData.revenueGrowth,
        color: '#1890ff',
      },
      {
        title: 'Số đơn hàng',
        value: dashboardData.totalOrders,
        icon: <ShoppingCartOutlined />,
        growth: dashboardData.orderGrowth,
        color: '#52c41a',
      },
      {
        title: 'Khách hàng mới',
        value: dashboardData.totalCustomers,
        icon: <UserOutlined />,
        growth: dashboardData.customerGrowth,
        color: '#722ed1',
      },
      {
        title: 'Giá trị trung bình',
        value: dashboardData.averageOrder,
        format: formatVND,
        icon: <BarChartOutlined />,
        growth: dashboardData.averageOrderGrowth,
        color: '#fa8c16',
      },
    ];

    return (
      <Row gutter={[16, 16]}>
        {kpis.map((kpi, index) => (
          <Col key={index} xs={24} sm={12} md={6}>
            <Card 
              className="kpi-card" 
              loading={loading}
              bodyStyle={{ padding: '20px' }}
            >
              <div className="kpi-icon" style={{ backgroundColor: `${kpi.color}15` }}>
                {React.cloneElement(kpi.icon, { style: { color: kpi.color, fontSize: '28px' } })}
              </div>
              <Statistic
                title={<span style={{ fontSize: '14px' }}>{kpi.title}</span>}
                value={kpi.value}
                formatter={value => kpi.format ? kpi.format(value as number) : value}
              />
              <div className="kpi-growth">
                {kpi.growth > 0 ? (
                  <span style={{ color: '#52c41a' }}>
                    <ArrowUpOutlined /> {kpi.growth}%
                  </span>
                ) : (
                  <span style={{ color: '#f5222d' }}>
                    <ArrowDownOutlined /> {Math.abs(kpi.growth)}%
                  </span>
                )}
                <span className="growth-label">so với hôm qua</span>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    );
  };

  // Render realtime stats
  const renderRealtimeStats = () => {
    const stats = [
      {
        title: 'Đang online',
        value: realtimeData.onlineUsers,
        icon: <TeamOutlined />,
        color: '#1890ff',
      },
      {
        title: 'Đơn đang xử lý',
        value: realtimeData.pendingOrders,
        icon: <SyncOutlined spin />,
        color: '#fa8c16',
      },
      {
        title: 'Chờ thanh toán',
        value: realtimeData.pendingPayments,
        icon: <ClockCircleOutlined />,
        color: '#722ed1',
      },
      {
        title: 'Sắp hết hàng',
        value: realtimeData.lowStock,
        icon: <ExclamationCircleOutlined />,
        color: '#f5222d',
      },
    ];

    return (
      <Row gutter={[16, 16]}>
        {stats.map((stat, index) => (
          <Col key={index} xs={12} sm={12} md={6}>
            <Card className="stat-card">
              <div className="stat-content">
                {React.cloneElement(stat.icon, { style: { color: stat.color, fontSize: '24px' } })}
                <div className="stat-details">
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-title">{stat.title}</div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    );
  };

  // Handle date range change
  const handleDateChange = (dates: any, dateStrings: [string, string]) => {
    setDateRange(dates);
  };

  // Handle period selection
  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value);
  };

  return (
    <div className="modern-dashboard">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="dashboard-title">
          <Title level={3}>
            Tổng quan hệ thống
          </Title>
          <Text type="secondary">
            Theo dõi hoạt động kinh doanh hôm nay
          </Text>
        </div>
        <div className="dashboard-actions">
          <Space size="middle">
            <Select 
              value={selectedPeriod} 
              onChange={handlePeriodChange}
              style={{ width: 120 }}
            >
              <Option value="today">Hôm nay</Option>
              <Option value="week">Tuần này</Option>
              <Option value="month">Tháng này</Option>
              <Option value="year">Năm này</Option>
            </Select>
            <RangePicker 
              onChange={handleDateChange} 
              format="DD/MM/YYYY"
              placeholder={['Từ ngày', 'Đến ngày']}
            />
            <Button 
              type="primary" 
              icon={<DownloadOutlined />}
              onClick={() => {}}
            >
              Xuất báo cáo
            </Button>
          </Space>
        </div>
      </div>

      {/* Alerts */}
      {realtimeData.lowStock > 5 && (
        <Alert
          message="Cảnh báo tồn kho"
          description={`Có ${realtimeData.lowStock} sản phẩm đang sắp hết hàng. Vui lòng kiểm tra và nhập thêm hàng kịp thời.`}
          type="warning"
          showIcon
          closable
          style={{ marginBottom: 24 }}
          action={
            <Button size="small" type="link">
              Xem chi tiết
            </Button>
          }
        />
      )}

      {/* KPI Cards */}
      {renderKpiCards()}

      {/* Realtime Stats */}
      <div style={{ marginTop: 24 }}>
        {renderRealtimeStats()}
      </div>

      {/* Tabs for different dashboard views */}
      <div style={{ marginTop: 24 }}>
        <Tabs 
          activeKey={activeTab}
          onChange={setActiveTab}
          type="card"
          tabBarExtraContent={{
            right: <Search placeholder="Tìm kiếm..." style={{ width: 250 }} />
          }}
        >
          <TabPane 
            tab={<span><LineChartOutlined />Doanh thu</span>} 
            key="revenue"
          >
            <Card title="Biểu đồ doanh thu & đơn hàng" extra={<Button size="small" icon={<FilterOutlined />}>Lọc</Button>}>
              <DualAxes {...salesChartConfig} />
            </Card>
          </TabPane>

          <TabPane 
            tab={<span><ShoppingCartOutlined />Đơn hàng</span>} 
            key="orders"
          >
            <Card title="Đơn hàng gần đây" extra={<Button type="link">Xem tất cả</Button>}>
              <Table 
                columns={orderColumns} 
                dataSource={recentOrders}
                pagination={{ pageSize: 5 }}
                loading={loading}
              />
            </Card>
          </TabPane>

          <TabPane 
            tab={<span><PieChartOutlined />Danh mục</span>} 
            key="categories"
          >
            <Card title="Phân bổ doanh thu theo danh mục">
              <Pie {...categoryChartConfig} />
            </Card>
          </TabPane>

          <TabPane 
            tab={<span><DatabaseOutlined />Tồn kho</span>} 
            key="inventory"
          >
            <Card title="Tình trạng tồn kho" extra={<Button type="link">Quản lý kho</Button>}>
              <Table 
                columns={inventoryColumns}
                dataSource={inventoryData}
                pagination={{ pageSize: 5 }}
                loading={loading}
              />
            </Card>
          </TabPane>
        </Tabs>
      </div>

      {/* Additional info sections */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={16}>
          <Card 
            title="Biểu đồ doanh thu theo thời gian" 
            extra={<Button type="text" icon={<EyeOutlined />}>Chi tiết</Button>}
          >
            <DualAxes {...salesChartConfig} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card 
            title="Doanh thu theo danh mục" 
            extra={<Button type="text" icon={<FilterOutlined />}></Button>}
          >
            <Pie {...categoryChartConfig} height={300} />
          </Card>
        </Col>
      </Row>

      {/* Activities and Orders */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} md={12}>
          <Card 
            title="Hoạt động gần đây" 
            extra={<Button type="link">Xem tất cả</Button>}
          >
            <List
              itemLayout="horizontal"
              dataSource={activities}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar icon={getActivityIcon(item.type)} />
                    }
                    title={<span>{item.user} {item.action} <a href="#">{item.target}</a></span>}
                    description={item.time}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card 
            title="Đơn hàng gần đây" 
            extra={<Button type="link" onClick={() => navigate('/orders')}>Xem tất cả</Button>}
          >
            <Table 
              columns={orderColumns.filter(col => col.key !== 'action')} 
              dataSource={recentOrders}
              pagination={{ pageSize: 4 }}
              size="small"
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      {/* Best selling products */}
      <Card 
        title="Top sản phẩm bán chạy" 
        style={{ marginTop: 24 }}
        extra={<Button type="link">Xem tất cả sản phẩm</Button>}
      >
        <Row gutter={[16, 16]}>
          {inventoryData.sort((a, b) => b.sold - a.sold).map((product, index) => (
            <Col key={product.name} xs={24} sm={12} md={8} lg={6}>
              <Card size="small" className="product-card">
                <div className="product-rank">#{index + 1}</div>
                <div className="product-details">
                  <div className="product-name">{product.name}</div>
                  <div className="product-category">{product.category}</div>
                  <div className="product-price">{formatVND(product.price)}</div>
                  <div className="product-stats">
                    <span className="product-sold">
                      <FireOutlined /> Đã bán: {product.sold}
                    </span>
                    <span className="product-stock">
                      Còn: {product.stock}
                    </span>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );
};

export default ModernDashboard;