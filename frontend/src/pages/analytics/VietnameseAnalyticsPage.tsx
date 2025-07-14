// Complete Vietnamese business analytics dashboard
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Tabs, 
  DatePicker, 
  Select, 
  Button, 
  Space, 
  Statistic, 
  Table,
  Tag,
  Tooltip,
  Progress,
  Alert,
  Spin,
  Typography,
  Divider
} from 'antd';
import { 
  TrophyOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  CalendarOutlined,
  ExportOutlined,
  ReloadOutlined,
  RiseOutlined,
  FallOutlined
} from '@ant-design/icons';
import { Line, Column, Pie, Area } from '@ant-design/plots';
import { analyticsService } from '../../services/api/analyticsService';
import { formatVND } from '../../utils/formatters/vndCurrency';
import { usePage } from '../../stores';
import dayjs from 'dayjs';

const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title, Text } = Typography;

interface AnalyticsData {
  dashboardKPIs: any;
  salesData: any[];
  revenueData: any[];
  customerStats: any;
  paymentStats: any;
  regionalSales: any;
  businessHours: any;
  holidayAnalysis: any;
  inventoryStats: any;
}

export const VietnameseAnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs()
  ]);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const { setPageTitle, setBreadcrumbs } = usePage();

  useEffect(() => {
    setPageTitle('Phân tích kinh doanh');
    setBreadcrumbs([
      { title: 'Phân tích' },
    ]);
    loadAnalyticsData();
  }, [setPageTitle, setBreadcrumbs, dateRange, selectedPeriod]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const dateRangeParams = {
        start: dateRange[0].format('YYYY-MM-DD'),
        end: dateRange[1].format('YYYY-MM-DD')
      };

      const [
        dashboardKPIs,
        salesData,
        revenueData,
        customerStats,
        paymentStats,
        regionalSales,
        businessHours,
        holidayAnalysis,
        inventoryStats
      ] = await Promise.all([
        analyticsService.getDashboardKPIs(dateRangeParams),
        analyticsService.getSalesData(selectedPeriod, dateRangeParams),
        analyticsService.getRevenueData(selectedPeriod, dateRangeParams),
        analyticsService.getCustomerStats(selectedPeriod),
        analyticsService.getPaymentStats(selectedPeriod),
        analyticsService.getRegionalSales(selectedPeriod),
        analyticsService.getBusinessHourAnalysis(dateRangeParams),
        analyticsService.getHolidayAnalysis(dayjs().year()),
        analyticsService.getInventoryStats()
      ]);

      setData({
        dashboardKPIs,
        salesData,
        revenueData,
        customerStats,
        paymentStats,
        regionalSales,
        businessHours,
        holidayAnalysis,
        inventoryStats
      });
    } catch (err: any) {
      setError('Không thể tải dữ liệu phân tích. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async (type: string, format: 'csv' | 'xlsx') => {
    try {
      let blob: Blob;
      const dateRangeParams = {
        start: dateRange[0].format('YYYY-MM-DD'),
        end: dateRange[1].format('YYYY-MM-DD')
      };

      switch (type) {
        case 'sales':
          blob = await analyticsService.exportSalesReport(format, dateRangeParams);
          break;
        case 'inventory':
          blob = await analyticsService.exportInventoryReport(format);
          break;
        case 'customers':
          blob = await analyticsService.exportCustomerReport(format, dateRangeParams);
          break;
        default:
          return;
      }

      // Download file
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_report_${dateRange[0].format('YYYY-MM-DD')}_${dateRange[1].format('YYYY-MM-DD')}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Lỗi tải dữ liệu"
        description={error}
        type="error"
        showIcon
        action={
          <Button size="small" danger onClick={loadAnalyticsData} icon={<ReloadOutlined />}>
            Thử lại
          </Button>
        }
      />
    );
  }

  if (!data) {
    return null;
  }

  // Revenue chart data
  const revenueChartData = data.revenueData.map(item => ({
    date: dayjs(item.date).format('DD/MM'),
    revenue: item.revenue,
    orders: item.orders
  }));

  // Sales by payment method pie chart
  const paymentChartData = [
    { type: 'Tiền mặt', value: data.paymentStats.cash.amount, count: data.paymentStats.cash.count },
    { type: 'VNPay', value: data.paymentStats.vnpay.amount, count: data.paymentStats.vnpay.count },
    { type: 'MoMo', value: data.paymentStats.momo.amount, count: data.paymentStats.momo.count },
    { type: 'ZaloPay', value: data.paymentStats.zalopay.amount, count: data.paymentStats.zalopay.count },
    { type: 'Thẻ', value: data.paymentStats.card.amount, count: data.paymentStats.card.count },
  ].filter(item => item.value > 0);

  // Business hours chart data
  const businessHoursData = data.businessHours.hourly.map(item => ({
    hour: `${item.hour}:00`,
    revenue: item.revenue,
    orders: item.orders
  }));

  // Regional sales data
  const regionalData = [
    { region: 'Miền Bắc', ...data.regionalSales.north },
    { region: 'Miền Trung', ...data.regionalSales.central },
    { region: 'Miền Nam', ...data.regionalSales.south },
  ];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={8}>
            <Space>
              <Text strong>Khoảng thời gian:</Text>
              <RangePicker
                value={dateRange}
                onChange={(dates) => dates && setDateRange(dates)}
                format="DD/MM/YYYY"
              />
            </Space>
          </Col>
          <Col xs={24} md={6}>
            <Space>
              <Text strong>Chu kỳ:</Text>
              <Select
                value={selectedPeriod}
                onChange={setSelectedPeriod}
                style={{ width: 120 }}
              >
                <Option value="day">Ngày</Option>
                <Option value="week">Tuần</Option>
                <Option value="month">Tháng</Option>
                <Option value="quarter">Quý</Option>
                <Option value="year">Năm</Option>
              </Select>
            </Space>
          </Col>
          <Col xs={24} md={10}>
            <Space>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={loadAnalyticsData}
              >
                Làm mới
              </Button>
              <Button 
                icon={<ExportOutlined />} 
                onClick={() => handleExportReport('sales', 'xlsx')}
              >
                Xuất báo cáo
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* KPI Overview */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Doanh thu hôm nay"
              value={data.dashboardKPIs.todayRevenue}
              formatter={(value) => formatVND(Number(value))}
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
              suffix={
                <Tooltip title={`Tăng trưởng: ${data.dashboardKPIs.growth.revenue.toFixed(1)}%`}>
                  {data.dashboardKPIs.growth.revenue >= 0 ? 
                    <RiseOutlined style={{ color: '#52c41a' }} /> : 
                    <FallOutlined style={{ color: '#ff4d4f' }} />
                  }
                </Tooltip>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Đơn hàng hôm nay"
              value={data.dashboardKPIs.todayOrders}
              prefix={<ShoppingCartOutlined style={{ color: '#1890ff' }} />}
              suffix={
                <Tooltip title={`Tăng trưởng: ${data.dashboardKPIs.growth.orders.toFixed(1)}%`}>
                  {data.dashboardKPIs.growth.orders >= 0 ? 
                    <RiseOutlined style={{ color: '#52c41a' }} /> : 
                    <FallOutlined style={{ color: '#ff4d4f' }} />
                  }
                </Tooltip>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Khách hàng hôm nay"
              value={data.dashboardKPIs.todayCustomers}
              prefix={<UserOutlined style={{ color: '#722ed1' }} />}
              suffix={
                <Tooltip title={`Tăng trưởng: ${data.dashboardKPIs.growth.customers.toFixed(1)}%`}>
                  {data.dashboardKPIs.growth.customers >= 0 ? 
                    <RiseOutlined style={{ color: '#52c41a' }} /> : 
                    <FallOutlined style={{ color: '#ff4d4f' }} />
                  }
                </Tooltip>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Giá trị đơn TB"
              value={data.dashboardKPIs.averageOrderValue}
              formatter={(value) => formatVND(Number(value))}
              prefix={<BarChartOutlined style={{ color: '#fa8c16' }} />}
              suffix={
                <Tooltip title={`Tăng trưởng: ${data.dashboardKPIs.growth.averageOrder.toFixed(1)}%`}>
                  {data.dashboardKPIs.growth.averageOrder >= 0 ? 
                    <RiseOutlined style={{ color: '#52c41a' }} /> : 
                    <FallOutlined style={{ color: '#ff4d4f' }} />
                  }
                </Tooltip>
              }
            />
          </Card>
        </Col>
      </Row>

      {/* Main Analytics */}
      <Tabs defaultActiveKey="revenue" size="large">
        {/* Revenue Analysis */}
        <TabPane 
          tab={<span><LineChartOutlined />Doanh thu & Bán hàng</span>} 
          key="revenue"
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Card title="Biểu đồ doanh thu theo thời gian">
                <Line
                  data={revenueChartData}
                  xField="date"
                  yField="revenue"
                  height={300}
                  smooth={true}
                  point={{
                    size: 5,
                    shape: 'diamond',
                  }}
                  label={{
                    style: {
                      fill: '#aaa',
                    },
                  }}
                  tooltip={{
                    formatter: (datum) => ({
                      name: 'Doanh thu',
                      value: formatVND(datum.revenue)
                    })
                  }}
                />
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="Phương thức thanh toán">
                <Pie
                  data={paymentChartData}
                  angleField="value"
                  colorField="type"
                  radius={0.8}
                  height={300}
                  label={{
                    type: 'outer',
                    formatter: (datum) => `${datum.type}: ${formatVND(datum.value)}`
                  }}
                  tooltip={{
                    formatter: (datum) => ({
                      name: datum.type,
                      value: `${formatVND(datum.value)} (${datum.count} giao dịch)`
                    })
                  }}
                />
              </Card>
            </Col>
          </Row>
        </TabPane>

        {/* Customer Analysis */}
        <TabPane 
          tab={<span><UserOutlined />Phân tích khách hàng</span>} 
          key="customers"
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="Thống kê khách hàng">
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Statistic
                      title="Tổng khách hàng"
                      value={data.customerStats.totalCustomers}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Khách hàng mới"
                      value={data.customerStats.newCustomers}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Khách hàng quay lại"
                      value={data.customerStats.returningCustomers}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Giá trị trọn đời TB"
                      value={data.customerStats.lifetimeValue}
                      formatter={(value) => formatVND(Number(value))}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="Phân bổ hạng khách hàng thân thiết">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Tag color="#cd7f32">Đồng</Tag>
                    <span>{data.customerStats.loyaltyTiers.dong} khách</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <Tag color="#c0c0c0">Bạc</Tag>
                    <span>{data.customerStats.loyaltyTiers.bac} khách</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <Tag color="#ffd700">Vàng</Tag>
                    <span>{data.customerStats.loyaltyTiers.vang} khách</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <Tag color="#e5e4e2">Bạch kim</Tag>
                    <span>{data.customerStats.loyaltyTiers.bachkim} khách</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <Tag color="#b9f2ff">Kim cương</Tag>
                    <span>{data.customerStats.loyaltyTiers.kimcuong} khách</span>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </TabPane>

        {/* Business Hours Analysis */}
        <TabPane 
          tab={<span><CalendarOutlined />Giờ kinh doanh</span>} 
          key="business-hours"
        >
          <Card title="Phân tích theo giờ kinh doanh (6:00 - 22:00)">
            <Column
              data={businessHoursData}
              xField="hour"
              yField="revenue"
              height={400}
              columnStyle={{
                fill: '#1890ff',
              }}
              tooltip={{
                formatter: (datum) => ({
                  name: 'Doanh thu',
                  value: `${formatVND(datum.revenue)} (${datum.orders} đơn)`
                })
              }}
            />
            <Divider />
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Card size="small">
                  <Statistic
                    title="Giờ cao điểm"
                    value={`${data.businessHours.peakHours[0]?.hour || 0}:00`}
                    prefix={<TrophyOutlined style={{ color: '#faad14' }} />}
                  />
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card size="small">
                  <Statistic
                    title="Doanh thu cao điểm"
                    value={data.businessHours.peakHours[0]?.performance || 0}
                    formatter={(value) => formatVND(Number(value))}
                  />
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card size="small">
                  <Statistic
                    title="Tỷ lệ giờ thấp điểm"
                    value={((data.businessHours.offPeakHours.length / data.businessHours.hourly.length) * 100).toFixed(1)}
                    suffix="%"
                  />
                </Card>
              </Col>
            </Row>
          </Card>
        </TabPane>

        {/* Regional Analysis */}
        <TabPane 
          tab={<span><PieChartOutlined />Phân tích khu vực</span>} 
          key="regional"
        >
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card title="So sánh doanh số 3 miền">
                <Table
                  dataSource={regionalData}
                  rowKey="region"
                  columns={[
                    {
                      title: 'Khu vực',
                      dataIndex: 'region',
                      key: 'region',
                      render: (text) => <Text strong>{text}</Text>
                    },
                    {
                      title: 'Doanh thu',
                      dataIndex: 'revenue',
                      key: 'revenue',
                      render: (value) => <Text strong style={{ color: '#52c41a' }}>{formatVND(value)}</Text>
                    },
                    {
                      title: 'Đơn hàng',
                      dataIndex: 'orders',
                      key: 'orders',
                    },
                    {
                      title: 'Khách hàng',
                      dataIndex: 'customers',
                      key: 'customers',
                    },
                    {
                      title: 'Giá trị đơn TB',
                      key: 'avgOrder',
                      render: (_, record) => formatVND(record.revenue / record.orders || 0)
                    }
                  ]}
                  pagination={false}
                />
              </Card>
            </Col>
          </Row>
        </TabPane>

        {/* Holiday Analysis */}
        <TabPane 
          tab={<span><CalendarOutlined />Ngày lễ & Tết</span>} 
          key="holidays"
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="Doanh số Tết Nguyên Đán">
                <Statistic
                  title="Doanh thu Tết"
                  value={data.holidayAnalysis.tet.revenue}
                  formatter={(value) => formatVND(Number(value))}
                  prefix={<DollarOutlined style={{ color: '#ff4d4f' }} />}
                  suffix={
                    <Tag color={data.holidayAnalysis.tet.growth >= 0 ? 'green' : 'red'}>
                      {data.holidayAnalysis.tet.growth >= 0 ? '+' : ''}{data.holidayAnalysis.tet.growth.toFixed(1)}%
                    </Tag>
                  }
                />
                <Text type="secondary">
                  {data.holidayAnalysis.tet.orders} đơn hàng trong mùa Tết
                </Text>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="Doanh số Trung Thu">
                <Statistic
                  title="Doanh thu Trung Thu"
                  value={data.holidayAnalysis.trungThu.revenue}
                  formatter={(value) => formatVND(Number(value))}
                  prefix={<DollarOutlined style={{ color: '#faad14' }} />}
                  suffix={
                    <Tag color={data.holidayAnalysis.trungThu.growth >= 0 ? 'green' : 'red'}>
                      {data.holidayAnalysis.trungThu.growth >= 0 ? '+' : ''}{data.holidayAnalysis.trungThu.growth.toFixed(1)}%
                    </Tag>
                  }
                />
                <Text type="secondary">
                  {data.holidayAnalysis.trungThu.orders} đơn hàng trong mùa Trung Thu
                </Text>
              </Card>
            </Col>
            <Col span={24}>
              <Card title="Các ngày lễ khác">
                <Table
                  dataSource={data.holidayAnalysis.holidays}
                  rowKey="name"
                  columns={[
                    { title: 'Ngày lễ', dataIndex: 'name', key: 'name' },
                    { 
                      title: 'Ngày', 
                      dataIndex: 'date', 
                      key: 'date',
                      render: (date) => dayjs(date).format('DD/MM/YYYY')
                    },
                    { 
                      title: 'Doanh thu', 
                      dataIndex: 'revenue', 
                      key: 'revenue',
                      render: (value) => formatVND(value)
                    },
                    { title: 'Đơn hàng', dataIndex: 'orders', key: 'orders' },
                    { 
                      title: 'Tăng trưởng', 
                      dataIndex: 'growth', 
                      key: 'growth',
                      render: (value) => (
                        <Tag color={value >= 0 ? 'green' : 'red'}>
                          {value >= 0 ? '+' : ''}{value.toFixed(1)}%
                        </Tag>
                      )
                    },
                  ]}
                  pagination={false}
                />
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default VietnameseAnalyticsPage;