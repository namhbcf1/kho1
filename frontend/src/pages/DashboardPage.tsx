// Main dashboard page with Vietnamese business KPIs
import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Typography, Space, Button, Spin, Alert } from 'antd';
import {
  ShoppingCartOutlined,
  DollarOutlined,
  UserOutlined,
  BarChartOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  EyeOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { RevenueChart } from '../components/charts/RevenueChart';
import { SalesChart } from '../components/charts/SalesChart';
import { KPICard } from '../components/charts/KPICards';
import { formatVND } from '../utils/formatters/vndCurrency';
import { ROUTES } from '../constants/routes';
import { usePage } from '../stores';
import { analyticsService, DashboardKPIs, TopProduct, LowStockProduct } from '../services/api/analyticsService';

const { Title, Text } = Typography;

export const DashboardPage: React.FC = () => {
  const { setPageTitle, setBreadcrumbs } = usePage();
  const [dashboardData, setDashboardData] = useState<DashboardKPIs | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [kpis, products, lowStock] = await Promise.all([
        analyticsService.getDashboardKPIs(),
        analyticsService.getTopProducts(5),
        analyticsService.getLowStockProducts(5),
      ]);

      setDashboardData(kpis);
      setTopProducts(products);
      setLowStockProducts(lowStock);
    } catch (err) {
      setError('Không thể tải dữ liệu dashboard. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPageTitle('Tổng quan');
    setBreadcrumbs([
      { title: 'Tổng quan' },
    ]);
    loadDashboardData();
  }, [setPageTitle, setBreadcrumbs]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert
          message="Lỗi tải dữ liệu"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" danger onClick={loadDashboardData} icon={<ReloadOutlined />}>
              Thử lại
            </Button>
          }
        />
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

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
          <Button onClick={loadDashboardData} icon={<ReloadOutlined />}>
            Làm mới
          </Button>
          <Link to="/pos">
            <Button type="primary" icon={<ShoppingCartOutlined />} size="large">
              Bán hàng
            </Button>
          </Link>
          <Link to="/analytics">
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
              value={formatVND(dashboardData.todayRevenue)}
              change={dashboardData.growth.revenue}
              changeType={dashboardData.growth.revenue >= 0 ? "increase" : "decrease"}
              icon={<DollarOutlined />}
              color="#52c41a"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <KPICard
              title="Đơn hàng"
              value={dashboardData.todayOrders}
              change={dashboardData.growth.orders}
              changeType={dashboardData.growth.orders >= 0 ? "increase" : "decrease"}
              icon={<ShoppingCartOutlined />}
              color="#1890ff"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <KPICard
              title="Khách hàng"
              value={dashboardData.todayCustomers}
              change={dashboardData.growth.customers}
              changeType={dashboardData.growth.customers >= 0 ? "increase" : "decrease"}
              icon={<UserOutlined />}
              color="#722ed1"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <KPICard
              title="Giá trị TB"
              value={formatVND(dashboardData.averageOrderValue)}
              change={dashboardData.growth.averageOrder}
              changeType={dashboardData.growth.averageOrder >= 0 ? "increase" : "decrease"}
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
              <Link to="/analytics">
                <Button type="link" icon={<EyeOutlined />}>
                  Xem tất cả
                </Button>
              </Link>
            }
          >
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div>
                    <Text strong>{product.name}</Text>
                    <div className="text-sm text-gray-500">
                      Đã bán: {product.sold} sản phẩm | {product.categoryName}
                    </div>
                  </div>
                  <div className="text-right">
                    <Text strong className="text-green-600">
                      {formatVND(product.revenue)}
                    </Text>
                    <div className="text-sm text-gray-500">
                      Lợi nhuận: {product.margin.toFixed(1)}%
                    </div>
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
              <Link to="/products">
                <Button type="link" icon={<EyeOutlined />}>
                  Quản lý kho
                </Button>
              </Link>
            }
          >
            <div className="space-y-4">
              {lowStockProducts.map((product, index) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div>
                    <Text strong>{product.name}</Text>
                    <div className="text-sm text-gray-500">
                      SKU: {product.sku} | Tối thiểu: {product.minStock}
                    </div>
                  </div>
                  <div className="text-right">
                    <Text strong className="text-red-600">
                      Còn {product.currentStock}
                    </Text>
                    <div className="text-sm text-gray-500">
                      Cần bổ sung: {product.reorderLevel - product.currentStock}
                    </div>
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
              value={dashboardData.monthRevenue}
              formatter={(value) => formatVND(Number(value))}
              prefix={
                dashboardData.growth.revenue >= 0 ? 
                  <ArrowUpOutlined className="text-green-500" /> : 
                  <ArrowDownOutlined className="text-red-500" />
              }
              suffix={
                <span className={dashboardData.growth.revenue >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {Math.abs(dashboardData.growth.revenue).toFixed(1)}%
                </span>
              }
            />
          </Col>
          <Col xs={24} sm={6}>
            <Statistic
              title="Tổng đơn hàng"
              value={dashboardData.monthOrders}
              prefix={
                dashboardData.growth.orders >= 0 ? 
                  <ArrowUpOutlined className="text-green-500" /> : 
                  <ArrowDownOutlined className="text-red-500" />
              }
              suffix={
                <span className={dashboardData.growth.orders >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {Math.abs(dashboardData.growth.orders).toFixed(1)}%
                </span>
              }
            />
          </Col>
          <Col xs={24} sm={6}>
            <Statistic
              title="Khách hàng mới"
              value={dashboardData.monthCustomers}
              prefix={
                dashboardData.growth.customers >= 0 ? 
                  <ArrowUpOutlined className="text-green-500" /> : 
                  <ArrowDownOutlined className="text-red-500" />
              }
              suffix={
                <span className={dashboardData.growth.customers >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {Math.abs(dashboardData.growth.customers).toFixed(1)}%
                </span>
              }
            />
          </Col>
          <Col xs={24} sm={6}>
            <Statistic
              title="Giá trị đơn TB"
              value={dashboardData.averageOrderValue}
              formatter={(value) => formatVND(Number(value))}
              prefix={
                dashboardData.growth.averageOrder >= 0 ? 
                  <ArrowUpOutlined className="text-green-500" /> : 
                  <ArrowDownOutlined className="text-red-500" />
              }
              suffix={
                <span className={dashboardData.growth.averageOrder >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {Math.abs(dashboardData.growth.averageOrder).toFixed(1)}%
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
