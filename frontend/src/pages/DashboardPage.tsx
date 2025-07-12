// Main dashboard page with Vietnamese business KPIs
import React, { useEffect } from 'react';
import { Row, Col, Card, Statistic, Typography, Space, Button, Spin } from 'antd';
import {
  ShoppingCartOutlined,
  DollarOutlined,
  UserOutlined,
  BarChartOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { RevenueChart } from '../components/charts/RevenueChart';
import { SalesChart } from '../components/charts/SalesChart';
import { KPICard } from '../components/charts/KPICards';
import { formatVND } from '../services/utils';
import { ROUTES } from '../constants/routes';
import { usePage } from '../stores';

const { Title, Text } = Typography;

// Mock data - replace with real API calls
const mockKPIData = {
  todaySales: {
    revenue: 15750000,
    orders: 45,
    customers: 38,
    averageOrder: 350000,
    growth: {
      revenue: 12.5,
      orders: 8.3,
      customers: 15.2,
      averageOrder: 3.7,
    },
  },
  monthSales: {
    revenue: 425000000,
    orders: 1250,
    customers: 890,
    averageOrder: 340000,
    growth: {
      revenue: 18.2,
      orders: 22.1,
      customers: 25.8,
      averageOrder: -2.1,
    },
  },
  topProducts: [
    { name: 'Cà phê đen', sold: 125, revenue: 2500000 },
    { name: 'Bánh mì thịt', sold: 89, revenue: 1780000 },
    { name: 'Nước cam', sold: 67, revenue: 1005000 },
  ],
  lowStockProducts: [
    { name: 'Cà phê đen', stock: 5, minStock: 20 },
    { name: 'Sữa tươi', stock: 8, minStock: 15 },
    { name: 'Bánh quy', stock: 12, minStock: 25 },
  ],
};

export const DashboardPage: React.FC = () => {
  const { setPageTitle, setBreadcrumbs } = usePage();

  useEffect(() => {
    setPageTitle('Tổng quan');
    setBreadcrumbs([
      { title: 'Tổng quan' },
    ]);
  }, [setPageTitle, setBreadcrumbs]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <Title level={2} className="!mb-2">
            Tổng quan hệ thống
          </Title>
          <Text className="text-gray-600">
            Theo dõi hiệu suất kinh doanh và các chỉ số quan trọng
          </Text>
        </div>
        <Space>
          <Link to={ROUTES.POS.TERMINAL}>
            <Button type="primary" icon={<ShoppingCartOutlined />} size="large">
              Bán hàng
            </Button>
          </Link>
          <Link to={ROUTES.ANALYTICS.DASHBOARD}>
            <Button icon={<BarChartOutlined />} size="large">
              Báo cáo chi tiết
            </Button>
          </Link>
        </Space>
      </div>

      {/* Today's KPIs */}
      <Card title="Hiệu suất hôm nay" className="shadow-sm">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <KPICard
              title="Doanh thu"
              value={formatVND(mockKPIData.todaySales.revenue)}
              change={mockKPIData.todaySales.growth.revenue}
              changeType="increase"
              icon={<DollarOutlined />}
              color="#52c41a"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <KPICard
              title="Đơn hàng"
              value={mockKPIData.todaySales.orders}
              change={mockKPIData.todaySales.growth.orders}
              changeType="increase"
              icon={<ShoppingCartOutlined />}
              color="#1890ff"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <KPICard
              title="Khách hàng"
              value={mockKPIData.todaySales.customers}
              change={mockKPIData.todaySales.growth.customers}
              changeType="increase"
              icon={<UserOutlined />}
              color="#722ed1"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <KPICard
              title="Đơn hàng TB"
              value={formatVND(mockKPIData.todaySales.averageOrder)}
              change={mockKPIData.todaySales.growth.averageOrder}
              changeType="increase"
              icon={<BarChartOutlined />}
              color="#fa8c16"
            />
          </Col>
        </Row>
      </Card>

      {/* Charts */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Doanh thu 7 ngày qua" className="shadow-sm">
            <RevenueChart />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Phân bố đơn hàng" className="shadow-sm">
            <SalesChart />
          </Card>
        </Col>
      </Row>

      {/* Quick Stats */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card 
            title="Sản phẩm bán chạy" 
            className="shadow-sm"
            extra={
              <Link to={ROUTES.ANALYTICS.SALES}>
                <Button type="link" icon={<EyeOutlined />}>
                  Xem tất cả
                </Button>
              </Link>
            }
          >
            <div className="space-y-4">
              {mockKPIData.topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <Text strong>{product.name}</Text>
                    <div className="text-sm text-gray-500">
                      Đã bán: {product.sold} sản phẩm
                    </div>
                  </div>
                  <div className="text-right">
                    <Text strong className="text-green-600">
                      {formatVND(product.revenue)}
                    </Text>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card 
            title="Sản phẩm sắp hết hàng" 
            className="shadow-sm"
            extra={
              <Link to={ROUTES.PRODUCTS.INVENTORY}>
                <Button type="link" icon={<EyeOutlined />}>
                  Quản lý kho
                </Button>
              </Link>
            }
          >
            <div className="space-y-4">
              {mockKPIData.lowStockProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <Text strong>{product.name}</Text>
                    <div className="text-sm text-gray-500">
                      Tồn kho tối thiểu: {product.minStock}
                    </div>
                  </div>
                  <div className="text-right">
                    <Text strong className="text-red-600">
                      Còn {product.stock}
                    </Text>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Month Summary */}
      <Card title="Tổng kết tháng này" className="shadow-sm">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={6}>
            <Statistic
              title="Tổng doanh thu"
              value={mockKPIData.monthSales.revenue}
              formatter={(value) => formatVND(Number(value))}
              prefix={
                <ArrowUpOutlined 
                  className={mockKPIData.monthSales.growth.revenue > 0 ? 'text-green-500' : 'text-red-500'} 
                />
              }
              suffix={
                <span className={mockKPIData.monthSales.growth.revenue > 0 ? 'text-green-500' : 'text-red-500'}>
                  {Math.abs(mockKPIData.monthSales.growth.revenue)}%
                </span>
              }
            />
          </Col>
          <Col xs={24} sm={6}>
            <Statistic
              title="Tổng đơn hàng"
              value={mockKPIData.monthSales.orders}
              prefix={
                <ArrowUpOutlined 
                  className={mockKPIData.monthSales.growth.orders > 0 ? 'text-green-500' : 'text-red-500'} 
                />
              }
              suffix={
                <span className={mockKPIData.monthSales.growth.orders > 0 ? 'text-green-500' : 'text-red-500'}>
                  {Math.abs(mockKPIData.monthSales.growth.orders)}%
                </span>
              }
            />
          </Col>
          <Col xs={24} sm={6}>
            <Statistic
              title="Khách hàng mới"
              value={mockKPIData.monthSales.customers}
              prefix={
                <ArrowUpOutlined 
                  className={mockKPIData.monthSales.growth.customers > 0 ? 'text-green-500' : 'text-red-500'} 
                />
              }
              suffix={
                <span className={mockKPIData.monthSales.growth.customers > 0 ? 'text-green-500' : 'text-red-500'}>
                  {Math.abs(mockKPIData.monthSales.growth.customers)}%
                </span>
              }
            />
          </Col>
          <Col xs={24} sm={6}>
            <Statistic
              title="Giá trị đơn TB"
              value={mockKPIData.monthSales.averageOrder}
              formatter={(value) => formatVND(Number(value))}
              prefix={
                mockKPIData.monthSales.growth.averageOrder > 0 ? 
                  <ArrowUpOutlined className="text-green-500" /> : 
                  <ArrowDownOutlined className="text-red-500" />
              }
              suffix={
                <span className={mockKPIData.monthSales.growth.averageOrder > 0 ? 'text-green-500' : 'text-red-500'}>
                  {Math.abs(mockKPIData.monthSales.growth.averageOrder)}%
                </span>
              }
            />
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default DashboardPage;
