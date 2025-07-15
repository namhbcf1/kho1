// Modern Dashboard for Vietnamese POS System
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Progress, Table, Tag, Button, Space, DatePicker, Select, Badge } from 'antd';
import {
  DollarOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  TrendingUpOutlined,
  TrendingDownOutlined,
  CalendarOutlined,
  FilterOutlined,
  DownloadOutlined,
  EyeOutlined,
  EditOutlined,
  PrinterOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { Line, Column, Pie } from '@ant-design/plots';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import '../../styles/modern-theme.css';

const { RangePicker } = DatePicker;
const { Option } = Select;

const ModernDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<[any, any] | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('today');

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
    onlineUsers: 23,
    activeOrders: 12,
    pendingPayments: 5,
    lowStock: 8,
  });

  useEffect(() => {
    // Simulate data loading
    setTimeout(() => {
      setLoading(false);
    }, 1500);

    // Simulate real-time updates
    const interval = setInterval(() => {
      setRealtimeData(prev => ({
        ...prev,
        onlineUsers: prev.onlineUsers + Math.floor(Math.random() * 3) - 1,
        activeOrders: prev.activeOrders + Math.floor(Math.random() * 2) - 1,
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Format Vietnamese currency
  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  // Sales chart data
  const salesData = [
    { date: '2025-01-10', revenue: 4200000, orders: 18 },
    { date: '2025-01-11', revenue: 5800000, orders: 25 },
    { date: '2025-01-12', revenue: 3900000, orders: 16 },
    { date: '2025-01-13', revenue: 6700000, orders: 29 },
    { date: '2025-01-14', revenue: 5200000, orders: 22 },
    { date: '2025-01-15', revenue: 7100000, orders: 31 },
  ];

  // Product performance data
  const productData = [
    { category: 'Điện thoại', sales: 35, revenue: 12500000 },
    { category: 'Laptop', sales: 28, revenue: 18900000 },
    { category: 'Phụ kiện', sales: 42, revenue: 3400000 },
    { category: 'Tablet', sales: 18, revenue: 7200000 },
    { category: 'Đồng hồ', sales: 24, revenue: 5600000 },
  ];

  // Recent orders data
  const recentOrders = [
    {
      id: 'DH001',
      customer: 'Nguyễn Văn A',
      amount: 2450000,
      status: 'completed',
      time: '10:30',
      items: 3,
    },
    {
      id: 'DH002',
      customer: 'Trần Thị B',
      amount: 1890000,
      status: 'pending',
      time: '11:15',
      items: 2,
    },
    {
      id: 'DH003',
      customer: 'Lê Văn C',
      amount: 3200000,
      status: 'processing',
      time: '11:45',
      items: 5,
    },
    {
      id: 'DH004',
      customer: 'Phạm Thị D',
      amount: 890000,
      status: 'completed',
      time: '12:30',
      items: 1,
    },
    {
      id: 'DH005',
      customer: 'Hoàng Văn E',
      amount: 4560000,
      status: 'processing',
      time: '13:00',
      items: 7,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'processing';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Hoàn thành';
      case 'processing':
        return 'Đang xử lý';
      case 'pending':
        return 'Chờ xử lý';
      default:
        return 'Không xác định';
    }
  };

  const orderColumns = [
    {
      title: 'Mã đơn',
      dataIndex: 'id',
      key: 'id',
      render: (text: string) => (
        <span className="font-mono text-blue-600">{text}</span>
      ),
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customer',
      key: 'customer',
      render: (text: string) => (
        <span className="vietnamese-text">{text}</span>
      ),
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
        <span className="vnd-currency">{formatVND(amount)}</span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)} className="vietnamese-text">
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: 'Thời gian',
      dataIndex: 'time',
      key: 'time',
      render: (time: string) => (
        <span className="text-gray-500">{time}</span>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (record: any) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => navigate(`${ROUTES.ORDERS.ROOT}/${record.id}`)}
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            size="small"
            onClick={() => navigate(`${ROUTES.ORDERS.ROOT}/${record.id}/edit`)}
          />
          <Button
            type="text"
            icon={<PrinterOutlined />}
            size="small"
          />
        </Space>
      ),
    },
  ];

  const chartConfig = {
    height: 300,
    autoFit: true,
    smooth: true,
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000,
      },
    },
  };

  return (
    <div className="modern-dashboard space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 vietnamese-text">
            Tổng quan hệ thống
          </h1>
          <p className="text-gray-600 vietnamese-text">
            Theo dõi hoạt động kinh doanh hôm nay
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select
            value={selectedPeriod}
            onChange={setSelectedPeriod}
            className="w-32"
          >
            <Option value="today">Hôm nay</Option>
            <Option value="yesterday">Hôm qua</Option>
            <Option value="week">Tuần này</Option>
            <Option value="month">Tháng này</Option>
          </Select>
          
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            className="vietnamese-text"
            placeholder={['Từ ngày', 'Đến ngày']}
          />
          
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            className="vietnamese-text"
          >
            Xuất báo cáo
          </Button>
        </div>
      </div>

      {/* Real-time Status Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card className="modern-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 vietnamese-text">Đang online</p>
                <p className="text-2xl font-bold text-green-600">
                  {realtimeData.onlineUsers}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Badge status="processing" className="scale-150" />
              </div>
            </div>
          </Card>
        </Col>
        
        <Col xs={12} sm={6}>
          <Card className="modern-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 vietnamese-text">Đơn đang xử lý</p>
                <p className="text-2xl font-bold text-blue-600">
                  {realtimeData.activeOrders}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <SyncOutlined className="text-blue-600" spin />
              </div>
            </div>
          </Card>
        </Col>
        
        <Col xs={12} sm={6}>
          <Card className="modern-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 vietnamese-text">Chờ thanh toán</p>
                <p className="text-2xl font-bold text-orange-600">
                  {realtimeData.pendingPayments}
                </p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <ClockCircleOutlined className="text-orange-600" />
              </div>
            </div>
          </Card>
        </Col>
        
        <Col xs={12} sm={6}>
          <Card className="modern-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 vietnamese-text">Sắp hết hàng</p>
                <p className="text-2xl font-bold text-red-600">
                  {realtimeData.lowStock}
                </p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <ExclamationCircleOutlined className="text-red-600" />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Main KPI Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="modern-card elevated" loading={loading}>
            <Statistic
              title={<span className="vietnamese-text">Doanh thu hôm nay</span>}
              value={dashboardData.totalRevenue}
              formatter={(value) => formatVND(Number(value))}
              prefix={<DollarOutlined />}
              valueStyle={{ 
                color: '#3f8600',
                fontFamily: 'var(--font-family-mono)',
              }}
              suffix={
                <span className="flex items-center gap-1 text-sm">
                  {dashboardData.revenueGrowth > 0 ? (
                    <ArrowUpOutlined className="text-green-500" />
                  ) : (
                    <ArrowDownOutlined className="text-red-500" />
                  )}
                  <span className={dashboardData.revenueGrowth > 0 ? 'text-green-500' : 'text-red-500'}>
                    {Math.abs(dashboardData.revenueGrowth)}%
                  </span>
                </span>
              }
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card className="modern-card elevated" loading={loading}>
            <Statistic
              title={<span className="vietnamese-text">Số đơn hàng</span>}
              value={dashboardData.totalOrders}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#1890ff' }}
              suffix={
                <span className="flex items-center gap-1 text-sm">
                  <ArrowUpOutlined className="text-green-500" />
                  <span className="text-green-500">
                    {dashboardData.orderGrowth}%
                  </span>
                </span>
              }
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card className="modern-card elevated" loading={loading}>
            <Statistic
              title={<span className="vietnamese-text">Khách hàng mới</span>}
              value={dashboardData.totalCustomers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
              suffix={
                <span className="flex items-center gap-1 text-sm">
                  <ArrowUpOutlined className="text-green-500" />
                  <span className="text-green-500">
                    {dashboardData.customerGrowth}%
                  </span>
                </span>
              }
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card className="modern-card elevated" loading={loading}>
            <Statistic
              title={<span className="vietnamese-text">Đơn hàng trung bình</span>}
              value={dashboardData.averageOrder}
              formatter={(value) => formatVND(Number(value))}
              prefix={<TrendingUpOutlined />}
              valueStyle={{ 
                color: '#cf1322',
                fontFamily: 'var(--font-family-mono)',
              }}
              suffix={
                <span className="flex items-center gap-1 text-sm">
                  <ArrowDownOutlined className="text-red-500" />
                  <span className="text-red-500">
                    {Math.abs(dashboardData.averageOrderGrowth)}%
                  </span>
                </span>
              }
            />
          </Card>
        </Col>
      </Row>

      {/* Charts Section */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card 
            className="modern-card"
            title={<span className="vietnamese-text">Biểu đồ doanh thu</span>}
            extra={
              <Button
                type="text"
                icon={<FilterOutlined />}
                className="vietnamese-text"
              >
                Bộ lọc
              </Button>
            }
          >
            <Line
              data={salesData}
              xField="date"
              yField="revenue"
              point={{
                size: 5,
                shape: 'diamond',
                style: {
                  fill: 'white',
                  stroke: '#1890ff',
                  lineWidth: 2,
                },
              }}
              tooltip={{
                formatter: (datum) => ({
                  name: 'Doanh thu',
                  value: formatVND(datum.revenue),
                }),
              }}
              {...chartConfig}
            />
          </Card>
        </Col>
        
        <Col xs={24} lg={8}>
          <Card 
            className="modern-card"
            title={<span className="vietnamese-text">Top danh mục</span>}
          >
            <Pie
              data={productData}
              angleField="revenue"
              colorField="category"
              radius={0.8}
              label={{
                type: 'outer',
                content: '{name}\n{percentage}',
              }}
              tooltip={{
                formatter: (datum) => ({
                  name: datum.category,
                  value: formatVND(datum.revenue),
                }),
              }}
              {...chartConfig}
            />
          </Card>
        </Col>
      </Row>

      {/* Recent Orders */}
      <Card 
        className="modern-card"
        title={<span className="vietnamese-text">Đơn hàng gần đây</span>}
        extra={
          <Button
            type="primary"
            onClick={() => navigate(ROUTES.ORDERS.ROOT)}
            className="vietnamese-text"
          >
            Xem tất cả
          </Button>
        }
      >
        <Table
          columns={orderColumns}
          dataSource={recentOrders}
          rowKey="id"
          pagination={false}
          scroll={{ x: 800 }}
          size="small"
        />
      </Card>
    </div>
  );
};

export default ModernDashboard;