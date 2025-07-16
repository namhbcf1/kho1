import React, { useState, useMemo } from 'react';
import { 
  Card, Row, Col, DatePicker, Select, Button, Typography, 
  Statistic, Progress, Table, Tag, Space, Grid, Tooltip, Alert
} from 'antd';
import { 
  DownloadOutlined, TrendingUpOutlined, ShoppingCartOutlined,
  UserOutlined, ProductOutlined, DollarCircleOutlined,
  PercentageOutlined, ClockCircleOutlined, CalendarOutlined
} from '@ant-design/icons';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { useProductStore } from '../../stores/useProductStore';
import { useCustomerStore } from '../../stores/useCustomerStore';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { useBreakpoint } = Grid;

// Mock data for charts - trong thực tế sẽ lấy từ API
const dailyRevenueData = [
  { date: '01/01', revenue: 12500000, orders: 45 },
  { date: '02/01', revenue: 15600000, orders: 52 },
  { date: '03/01', revenue: 18200000, orders: 61 },
  { date: '04/01', revenue: 14800000, orders: 48 },
  { date: '05/01', revenue: 21300000, orders: 67 },
  { date: '06/01', revenue: 19700000, orders: 59 },
  { date: '07/01', revenue: 23400000, orders: 72 },
  { date: '08/01', revenue: 17900000, orders: 55 },
  { date: '09/01', revenue: 25100000, orders: 78 },
  { date: '10/01', revenue: 22800000, orders: 69 },
  { date: '11/01', revenue: 26500000, orders: 82 },
  { date: '12/01', revenue: 28900000, orders: 89 },
  { date: '13/01', revenue: 31200000, orders: 95 },
  { date: '14/01', revenue: 29600000, orders: 91 },
  { date: '15/01', revenue: 33400000, orders: 102 }
];

const topProductsData = [
  { name: 'Coca Cola 330ml', sales: 1250, revenue: 18750000, category: 'Đồ uống' },
  { name: 'Bánh mì sandwich', sales: 890, revenue: 22250000, category: 'Thực phẩm' },
  { name: 'Nước suối Lavie', sales: 2100, revenue: 16800000, category: 'Đồ uống' },
  { name: 'Mì tôm Hảo Hảo', sales: 1850, revenue: 8325000, category: 'Thực phẩm' },
  { name: 'Sữa TH True Milk', sales: 650, revenue: 20800000, category: 'Đồ uống' }
];

const categoryData = [
  { name: 'Thực phẩm', value: 35, revenue: 145600000, color: '#8884d8' },
  { name: 'Đồ uống', value: 28, revenue: 98750000, color: '#82ca9d' },
  { name: 'Gia dụng', value: 20, revenue: 67890000, color: '#ffc658' },
  { name: 'Điện tử', value: 12, revenue: 45230000, color: '#ff7c7c' },
  { name: 'Thời trang', value: 5, revenue: 23100000, color: '#8dd1e1' }
];

const hourlyData = [
  { hour: '6h', orders: 5, revenue: 2100000 },
  { hour: '7h', orders: 12, revenue: 4800000 },
  { hour: '8h', orders: 25, revenue: 8900000 },
  { hour: '9h', orders: 42, revenue: 15600000 },
  { hour: '10h', orders: 58, revenue: 21200000 },
  { hour: '11h', orders: 75, revenue: 28400000 },
  { hour: '12h', orders: 89, revenue: 32100000 },
  { hour: '13h', orders: 82, revenue: 29800000 },
  { hour: '14h', orders: 71, revenue: 25600000 },
  { hour: '15h', orders: 65, revenue: 23400000 },
  { hour: '16h', orders: 52, revenue: 18900000 },
  { hour: '17h', orders: 48, revenue: 17200000 },
  { hour: '18h', orders: 39, revenue: 14100000 },
  { hour: '19h', orders: 28, revenue: 9800000 },
  { hour: '20h', orders: 18, revenue: 6400000 },
  { hour: '21h', orders: 8, revenue: 2800000 }
];

export default function ReportsPage() {
  const screens = useBreakpoint();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [timeFrame, setTimeFrame] = useState('month');
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'orders'>('revenue');

  const { products, categories } = useProductStore();
  const { customers, loyaltyTiers } = useCustomerStore();

  // Tính toán thống kê từ dữ liệu thực
  const stats = useMemo(() => {
    const totalRevenue = dailyRevenueData.reduce((sum, day) => sum + day.revenue, 0);
    const totalOrders = dailyRevenueData.reduce((sum, day) => sum + day.orders, 0);
    const totalProducts = topProductsData.reduce((sum, product) => sum + product.sales, 0);
    const newCustomers = customers.filter(c => 
      dayjs(c.joinDate).isAfter(dayjs().subtract(30, 'day'))
    ).length;

    const avgOrderValue = totalRevenue / totalOrders;
    const dailyAvgRevenue = totalRevenue / dailyRevenueData.length;
    const dailyAvgOrders = totalOrders / dailyRevenueData.length;

    return {
      totalRevenue,
      totalOrders,
      totalProducts,
      newCustomers,
      avgOrderValue,
      dailyAvgRevenue,
      dailyAvgOrders,
      revenueGrowth: 15.8, // Giả lập tăng trưởng
      orderGrowth: 12.4,
      customerGrowth: 8.9
    };
  }, [customers]);

  const customerTierData = useMemo(() => {
    return loyaltyTiers.map(tier => {
      const count = customers.filter(c => c.loyaltyTier === tier.id).length;
      const percentage = (count / customers.length) * 100;
      return {
        name: tier.name,
        value: count,
        percentage: percentage.toFixed(1),
        color: getTierColor(tier.id)
      };
    });
  }, [customers, loyaltyTiers]);

  const getTierColor = (tier: string) => {
    const colors = {
      bronze: '#cd7f32',
      silver: '#c0c0c0',
      gold: '#ffd700',
      platinum: '#e5e4e2',
      diamond: '#b9f2ff'
    };
    return colors[tier as keyof typeof colors] || '#1890ff';
  };

  const handleExport = () => {
    // TODO: Implement Excel export
    console.log('Exporting to Excel...');
  };

  const topProductColumns = [
    {
      title: 'Sản phẩm',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: any) => (
        <div>
          <Text strong>{name}</Text>
          <br />
          <Tag color="blue">{record.category}</Tag>
        </div>
      ),
    },
    {
      title: 'Số lượng bán',
      dataIndex: 'sales',
      key: 'sales',
      render: (sales: number) => (
        <Text strong style={{ color: '#1890ff' }}>{sales.toLocaleString()}</Text>
      ),
      sorter: (a: any, b: any) => a.sales - b.sales,
    },
    {
      title: 'Doanh thu',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (revenue: number) => (
        <Text strong style={{ color: '#52c41a' }}>{revenue.toLocaleString()}₫</Text>
      ),
      sorter: (a: any, b: any) => a.revenue - b.revenue,
    },
  ];

  return (
    <div className="reports-page" style={{ padding: 0 }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 24,
        flexWrap: 'wrap',
        gap: 16
      }}>
        <Title level={2} style={{ margin: 0, fontSize: 'clamp(1.25rem, 3vw, 1.75rem)' }}>
          Báo cáo & Thống kê
        </Title>
        <Space wrap>
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            format="DD/MM/YYYY"
            placeholder={['Từ ngày', 'Đến ngày']}
          />
          <Select 
            value={timeFrame} 
            onChange={setTimeFrame}
            style={{ width: screens.lg ? 120 : 100 }}
          >
            <Option value="today">Hôm nay</Option>
            <Option value="week">Tuần này</Option>
            <Option value="month">Tháng này</Option>
            <Option value="quarter">Quý này</Option>
            <Option value="year">Năm này</Option>
          </Select>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            {screens.lg ? 'Xuất Excel' : 'Xuất'}
          </Button>
        </Space>
      </div>

      {/* Main Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6} lg={6}>
          <Card hoverable>
            <Statistic
              title="Doanh thu tháng"
              value={stats.totalRevenue}
              precision={0}
              valueStyle={{ 
                color: '#52c41a',
                fontSize: screens.lg ? '24px' : '18px'
              }}
              prefix={<DollarCircleOutlined />}
              suffix="₫"
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">
                <TrendingUpOutlined style={{ color: '#52c41a' }} />
                {' +' + stats.revenueGrowth}% so với tháng trước
              </Text>
            </div>
          </Card>
        </Col>
        
        <Col xs={12} sm={6} lg={6}>
          <Card hoverable>
            <Statistic
              title="Đơn hàng tháng"
              value={stats.totalOrders}
              valueStyle={{ 
                color: '#1890ff',
                fontSize: screens.lg ? '24px' : '18px'
              }}
              prefix={<ShoppingCartOutlined />}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">
                <TrendingUpOutlined style={{ color: '#52c41a' }} />
                {' +' + stats.orderGrowth}% so với tháng trước
              </Text>
            </div>
          </Card>
        </Col>
        
        <Col xs={12} sm={6} lg={6}>
          <Card hoverable>
            <Statistic
              title="Sản phẩm bán ra"
              value={stats.totalProducts}
              valueStyle={{ 
                color: '#722ed1',
                fontSize: screens.lg ? '24px' : '18px'
              }}
              prefix={<ProductOutlined />}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">
                TB: {Math.round(stats.dailyAvgOrders)} đơn/ngày
              </Text>
            </div>
          </Card>
        </Col>
        
        <Col xs={12} sm={6} lg={6}>
          <Card hoverable>
            <Statistic
              title="Khách hàng mới"
              value={stats.newCustomers}
              valueStyle={{ 
                color: '#fa8c16',
                fontSize: screens.lg ? '24px' : '18px'
              }}
              prefix={<UserOutlined />}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">
                <TrendingUpOutlined style={{ color: '#52c41a' }} />
                {' +' + stats.customerGrowth}% so với tháng trước
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Secondary Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Giá trị đơn hàng TB"
              value={stats.avgOrderValue}
              precision={0}
              suffix="₫"
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Doanh thu TB/ngày"
              value={stats.dailyAvgRevenue}
              precision={0}
              suffix="₫"
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Tổng khách hàng"
              value={customers.length}
              valueStyle={{ color: '#2f54eb' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts Row 1 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card 
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Doanh thu theo ngày</span>
                <Select
                  value={selectedMetric}
                  onChange={setSelectedMetric}
                  size="small"
                  style={{ width: 120 }}
                >
                  <Option value="revenue">Doanh thu</Option>
                  <Option value="orders">Đơn hàng</Option>
                </Select>
              </div>
            }
          >
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailyRevenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis 
                  tickFormatter={(value) => 
                    selectedMetric === 'revenue' 
                      ? `${(value / 1000000).toFixed(0)}M₫`
                      : value.toString()
                  }
                />
                <RechartsTooltip 
                  formatter={(value: any, name: string) => [
                    selectedMetric === 'revenue' 
                      ? `${Number(value).toLocaleString()}₫`
                      : value,
                    selectedMetric === 'revenue' ? 'Doanh thu' : 'Đơn hàng'
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey={selectedMetric}
                  stroke="#1890ff"
                  fill="#1890ff"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        
        <Col xs={24} lg={8}>
          <Card title="Phân bố theo danh mục">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                  labelLine={false}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  formatter={(value: any, name: string, props: any) => [
                    `${value}%`,
                    props.payload.name
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Charts Row 2 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Phân bố khách hàng theo hạng">
            <div style={{ marginBottom: 16 }}>
              {customerTierData.map((tier, index) => (
                <div key={index} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text>{tier.name}</Text>
                    <Text strong>{tier.value} ({tier.percentage}%)</Text>
                  </div>
                  <Progress 
                    percent={Number(tier.percentage)} 
                    strokeColor={tier.color}
                    showInfo={false}
                  />
                </div>
              ))}
            </div>
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card title="Doanh thu theo giờ">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis 
                  tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M₫`}
                />
                <RechartsTooltip 
                  formatter={(value: any) => [`${Number(value).toLocaleString()}₫`, 'Doanh thu']}
                />
                <Bar dataKey="revenue" fill="#52c41a" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Top Products Table */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title="Top sản phẩm bán chạy">
            <Table
              columns={topProductColumns}
              dataSource={topProductsData}
              rowKey="name"
              pagination={false}
              size={screens.lg ? 'middle' : 'small'}
              scroll={{ x: 600 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}