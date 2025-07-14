// Main dashboard page with Vietnamese business KPIs
import React, { useEffect, useState, useCallback, useMemo, memo } from 'react';
import { Row, Col, Card, Statistic, Typography, Space, Button, Spin, Alert, Badge, Tooltip } from 'antd';
import {
  ShoppingCartOutlined,
  DollarOutlined,
  UserOutlined,
  BarChartOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  EyeOutlined,
  ReloadOutlined,
  WifiOutlined,
  DisconnectOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { RevenueChart } from '../components/charts/RevenueChart';
import { SalesChart } from '../components/charts/SalesChart';
import { KPICard } from '../components/charts/KPICards';
import { ChartErrorBoundary } from '../components/common/ErrorBoundary';
import { formatVND } from '../utils/formatters/vndCurrency';
import { ROUTES } from '../constants/routes';
import { usePage } from '../stores';
import { analyticsService, DashboardKPIs, TopProduct, LowStockProduct } from '../services/api/analyticsService';
import { useDebouncedCallback } from '../hooks/useDebounce';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useDashboardRealTime } from '../hooks/useRealTimeData';
import { useDashboardCleanup } from '../hooks/useCleanup';
import { useOfflineErrorHandling } from '../hooks/useOfflineErrorHandling';

const { Title, Text } = Typography;

export const DashboardPage: React.FC = memo(() => {
  const { setPageTitle, setBreadcrumbs } = usePage();
  const { isOnline } = useNetworkStatus();
  const realTimeData = useDashboardRealTime();
  const { safeSetState, safeAsyncOperation, addCleanup } = useDashboardCleanup();
  const { handleApiError, getConnectionStatus } = useOfflineErrorHandling();
  
  const [dashboardData, setDashboardData] = useState<DashboardKPIs | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const safeSetDashboardData = safeSetState(setDashboardData);
  const safeSetTopProducts = safeSetState(setTopProducts);
  const safeSetLowStockProducts = safeSetState(setLowStockProducts);
  const safeSetLoading = safeSetState(setLoading);
  const safeSetError = safeSetState(setError);
  const safeSetRefreshing = safeSetState(setRefreshing);

  const loadDashboardData = useCallback(async (isRefresh = false) => {
    await safeAsyncOperation(
      async (signal) => {
        if (isRefresh) {
          safeSetRefreshing(true);
        } else {
          safeSetLoading(true);
        }
        safeSetError(null);

        const [kpis, products, lowStock] = await Promise.all([
          analyticsService.getDashboardKPIs(),
          analyticsService.getTopProducts(5),
          analyticsService.getLowStockProducts(5),
        ]);

        return { kpis, products, lowStock };
      },
      (result) => {
        safeSetDashboardData(result.kpis);
        safeSetTopProducts(result.products);
        safeSetLowStockProducts(result.lowStock);
        safeSetLoading(false);
        safeSetRefreshing(false);
      },
      (err) => {
        safeSetLoading(false);
        safeSetRefreshing(false);
        
        // Use offline error handling
        const errorId = handleApiError(
          err instanceof Error ? err : new Error('Không thể tải dữ liệu dashboard'),
          () => loadDashboardData(isRefresh),
          'Tải dữ liệu dashboard'
        );
        
        if (!errorId) {
          // If not offline error, set local error state
          safeSetError(err instanceof Error ? err.message : 'Không thể tải dữ liệu dashboard. Vui lòng thử lại.');
        }
        
        console.error('Dashboard data loading error:', err);
      }
    );
  }, [
    safeAsyncOperation,
    safeSetRefreshing,
    safeSetLoading,
    safeSetError,
    safeSetDashboardData,
    safeSetTopProducts,
    safeSetLowStockProducts,
    handleApiError,
  ]);

  const debouncedRefresh = useDebouncedCallback(() => loadDashboardData(true), 1000);

  // Update dashboard data when real-time data changes
  useEffect(() => {
    if (realTimeData.data) {
      // If real-time data is newer than current data, update it
      const realTimeKPIs = realTimeData.data as DashboardKPIs;
      if (realTimeKPIs && realTimeKPIs.todayRevenue !== undefined) {
        setDashboardData(realTimeKPIs);
        setError(null);
      }
    }
    
    if (realTimeData.error) {
      console.warn('Real-time data error:', realTimeData.error);
      // Don't override main error state unless we have no data
      if (!dashboardData) {
        setError(`Kết nối thời gian thực thất bại: ${realTimeData.error}`);
      }
    }
  }, [realTimeData.data, realTimeData.error, dashboardData]);

  // Memoized KPI cards data
  const kpiCardsData = useMemo(() => {
    if (!dashboardData) return [];
    
    return [
      {
        title: "Doanh thu",
        value: formatVND(dashboardData.todayRevenue),
        change: dashboardData.growth.revenue,
        changeType: dashboardData.growth.revenue >= 0 ? "increase" as const : "decrease" as const,
        icon: <DollarOutlined />,
        color: "#52c41a"
      },
      {
        title: "Đơn hàng",
        value: dashboardData.todayOrders,
        change: dashboardData.growth.orders,
        changeType: dashboardData.growth.orders >= 0 ? "increase" as const : "decrease" as const,
        icon: <ShoppingCartOutlined />,
        color: "#1890ff"
      },
      {
        title: "Khách hàng",
        value: dashboardData.todayCustomers,
        change: dashboardData.growth.customers,
        changeType: dashboardData.growth.customers >= 0 ? "increase" as const : "decrease" as const,
        icon: <UserOutlined />,
        color: "#722ed1"
      },
      {
        title: "Giá trị TB",
        value: formatVND(dashboardData.averageOrderValue),
        change: dashboardData.growth.averageOrder,
        changeType: dashboardData.growth.averageOrder >= 0 ? "increase" as const : "decrease" as const,
        icon: <BarChartOutlined />,
        color: "#fa8c16"
      }
    ];
  }, [dashboardData]);

  // Memoized month statistics
  const monthStatistics = useMemo(() => {
    if (!dashboardData) return [];
    
    return [
      {
        title: "Tổng doanh thu",
        value: dashboardData.monthRevenue,
        formatter: (value: number) => formatVND(value),
        growth: dashboardData.growth.revenue
      },
      {
        title: "Tổng đơn hàng",
        value: dashboardData.monthOrders,
        growth: dashboardData.growth.orders
      },
      {
        title: "Khách hàng mới",
        value: dashboardData.monthCustomers,
        growth: dashboardData.growth.customers
      },
      {
        title: "Giá trị đơn TB",
        value: dashboardData.averageOrderValue,
        formatter: (value: number) => formatVND(value),
        growth: dashboardData.growth.averageOrder
      }
    ];
  }, [dashboardData]);

  useEffect(() => {
    setPageTitle('Tổng quan');
    setBreadcrumbs([
      { title: 'Tổng quan' },
    ]);
    loadDashboardData();
  }, [setPageTitle, setBreadcrumbs, loadDashboardData]);

  // Auto-refresh every 5 minutes when online with proper cleanup
  useEffect(() => {
    if (!isOnline) return;
    
    const interval = setInterval(() => {
      loadDashboardData(true);
    }, 5 * 60 * 1000); // 5 minutes

    addCleanup(() => clearInterval(interval));
    return () => clearInterval(interval);
  }, [isOnline, loadDashboardData, addCleanup]);

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
            <Button size="small" danger onClick={() => loadDashboardData()} icon={<ReloadOutlined />} disabled={!isOnline}>
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
          <div className="flex items-center gap-3">
            <Title level={2} className="!mb-2">
              Tổng quan hệ thống
            </Title>
            <Tooltip title={
              realTimeData.connected 
                ? `Kết nối thời gian thực - Cập nhật lần cuối: ${realTimeData.lastUpdated?.toLocaleTimeString() || 'Chưa xác định'}`
                : getConnectionStatus().message
            }>
              <Badge 
                status={realTimeData.connected && isOnline ? "processing" : "default"} 
                text={
                  <span className="flex items-center gap-1">
                    {realTimeData.connected && isOnline ? (
                      <>
                        <WifiOutlined style={{ color: getConnectionStatus().color }} />
                        <span style={{ color: getConnectionStatus().color }}>
                          {getConnectionStatus().message}
                        </span>
                      </>
                    ) : (
                      <>
                        <DisconnectOutlined className="text-gray-500" />
                        <span className="text-gray-500">
                          {getConnectionStatus().message}
                        </span>
                      </>
                    )}
                  </span>
                }
              />
            </Tooltip>
          </div>
          <Text className="text-gray-600">
            Theo dõi hiệu suất kinh doanh và các chỉ số quan trọng
          </Text>
        </div>
        <Space>
          <Button 
            onClick={debouncedRefresh} 
            icon={<ReloadOutlined />}
            loading={refreshing}
            disabled={!isOnline}
          >
            {refreshing ? 'Đang làm mới...' : 'Làm mới'}
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
          {kpiCardsData.map((kpi, index) => (
            <Col key={kpi.title} xs={24} sm={12} lg={6}>
              <KPICard {...kpi} />
            </Col>
          ))}
        </Row>
      </Card>

      {/* Charts */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Doanh thu 7 ngày qua" className="shadow-sm">
            <ChartErrorBoundary chartName="biểu đồ doanh thu">
              <RevenueChart />
            </ChartErrorBoundary>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Phân bố đơn hàng" className="shadow-sm">
            <ChartErrorBoundary chartName="biểu đồ bán hàng">
              <SalesChart />
            </ChartErrorBoundary>
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

});

export default DashboardPage;
