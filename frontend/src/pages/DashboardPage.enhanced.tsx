// Enhanced Dashboard Page with comprehensive state management
import React, { useEffect, memo, Suspense } from 'react';
import { Row, Col, Card, Statistic, Typography, Space, Button, Alert, Badge, Tooltip, Spin } from 'antd';
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
  ExclamationCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { ChartErrorBoundary } from '../components/common/ErrorBoundary';
import { 
  DashboardGrid, 
  DashboardWidget, 
  KPICard, 
  ChartContainer,
  DashboardSkeleton 
} from '../components/dashboard';
import { useAccessibility } from '../components/dashboard/AccessibilityProvider/AccessibilityProvider';
import { usePage } from '../stores';
import { useDashboard } from '../hooks/useStore';

const { Title, Text } = Typography;

// Lazy load chart components for better performance
const RevenueChart = React.lazy(() => import('../components/charts/RevenueChart/RevenueChart'));
const SalesChart = React.lazy(() => import('../components/charts/SalesChart/SalesChart'));
const KPICard = React.lazy(() => import('../components/charts/KPICards/KPICard'));

// Memoized components for better performance
const ConnectionStatus = memo(({ syncStatus, autoRefresh, lastUpdated }: {
  syncStatus: any;
  autoRefresh: any;
  lastUpdated: Date | null;
}) => {
  const getStatusColor = () => {
    if (!syncStatus.connected) return '#ff4d4f';
    if (autoRefresh.enabled) return '#52c41a';
    return '#faad14';
  };

  const getStatusText = () => {
    if (!syncStatus.connected) return 'Mất kết nối';
    if (autoRefresh.enabled) return 'Tự động cập nhật';
    return 'Chế độ thủ công';
  };

  const getStatusIcon = () => {
    if (!syncStatus.connected) return <DisconnectOutlined />;
    if (autoRefresh.enabled) return <WifiOutlined />;
    return <ExclamationCircleOutlined />;
  };

  return (
    <Tooltip title={
      syncStatus.connected 
        ? `Cập nhật lần cuối: ${lastUpdated?.toLocaleTimeString() || 'Chưa xác định'}`
        : 'Mất kết nối - Dữ liệu có thể không mới nhất'
    }>
      <Badge 
        status={syncStatus.connected ? "processing" : "default"} 
        text={
          <span className="flex items-center gap-1">
            <span style={{ color: getStatusColor() }}>
              {getStatusIcon()}
            </span>
            <span style={{ color: getStatusColor() }}>
              {getStatusText()}
            </span>
          </span>
        }
      />
    </Tooltip>
  );
});

const ErrorDisplay = memo(({ error, onRetry, canRetry, retryCount }: {
  error: string | null;
  onRetry: () => void;
  canRetry: boolean;
  retryCount: number;
}) => {
  if (!error) return null;

  return (
    <Alert
      message="Lỗi tải dữ liệu"
      description={error}
      type="error"
      showIcon
      action={
        <Space>
          {canRetry && (
            <Button size="small" danger onClick={onRetry} icon={<ReloadOutlined />}>
              Thử lại {retryCount > 0 && `(${retryCount}/3)`}
            </Button>
          )}
        </Space>
      }
      className="mb-6"
    />
  );
});

const LoadingFallback = memo(() => (
  <div className="flex justify-center items-center h-64">
    <Spin size="large" tip="Đang tải dữ liệu dashboard..." />
  </div>
));

const KPISection = memo(({ kpis, loading, utils }: {
  kpis: any;
  loading: boolean;
  utils: any;
}) => {
  if (!kpis) return null;

  const kpiCardsData = [
    {
      title: "Doanh thu",
      value: utils.formatCurrency(kpis.todayRevenue),
      change: kpis.growth.revenue,
      changeType: kpis.growth.revenue >= 0 ? "increase" as const : "decrease" as const,
      icon: <DollarOutlined />,
      color: "#52c41a"
    },
    {
      title: "Đơn hàng",
      value: kpis.todayOrders,
      change: kpis.growth.orders,
      changeType: kpis.growth.orders >= 0 ? "increase" as const : "decrease" as const,
      icon: <ShoppingCartOutlined />,
      color: "#1890ff"
    },
    {
      title: "Khách hàng",
      value: kpis.todayCustomers,
      change: kpis.growth.customers,
      changeType: kpis.growth.customers >= 0 ? "increase" as const : "decrease" as const,
      icon: <UserOutlined />,
      color: "#722ed1"
    },
    {
      title: "Giá trị TB",
      value: utils.formatCurrency(kpis.averageOrderValue),
      change: kpis.growth.averageOrder,
      changeType: kpis.growth.averageOrder >= 0 ? "increase" as const : "decrease" as const,
      icon: <BarChartOutlined />,
      color: "#fa8c16"
    }
  ];

  return (
    <Card title="Hiệu suất hôm nay" className="shadow-sm">
      <Row gutter={[16, 16]}>
        {kpiCardsData.map((kpi, index) => (
          <Col key={kpi.title} xs={24} sm={12} lg={6}>
            <Suspense fallback={<Spin />}>
              <KPICard {...kpi} loading={loading} />
            </Suspense>
          </Col>
        ))}
      </Row>
    </Card>
  );
});

const ChartsSection = memo(() => (
  <Row gutter={[16, 16]}>
    <Col xs={24} lg={16}>
      <Card title="Doanh thu 7 ngày qua" className="shadow-sm">
        <ChartErrorBoundary chartName="biểu đồ doanh thu">
          <Suspense fallback={<LoadingFallback />}>
            <RevenueChart />
          </Suspense>
        </ChartErrorBoundary>
      </Card>
    </Col>
    <Col xs={24} lg={8}>
      <Card title="Phân bố đơn hàng" className="shadow-sm">
        <ChartErrorBoundary chartName="biểu đồ bán hàng">
          <Suspense fallback={<LoadingFallback />}>
            <SalesChart />
          </Suspense>
        </ChartErrorBoundary>
      </Card>
    </Col>
  </Row>
));

const QuickStatsSection = memo(({ topProducts, lowStockProducts, lowStockAlert, utils }: {
  topProducts: any[];
  lowStockProducts: any[];
  lowStockAlert: string;
  utils: any;
}) => (
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
          {topProducts.map((product) => (
            <div key={product.id} className="flex items-center justify-between">
              <div>
                <Text strong>{product.name}</Text>
                <div className="text-sm text-gray-500">
                  Đã bán: {product.sold} sản phẩm | {product.categoryName || 'N/A'}
                </div>
              </div>
              <div className="text-right">
                <Text strong className="text-green-600">
                  {utils.formatCurrency(product.revenue)}
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
        title={
          <span className="flex items-center gap-2">
            Sản phẩm sắp hết hàng
            {lowStockAlert !== 'normal' && (
              <Badge 
                status={lowStockAlert === 'critical' ? 'error' : 'warning'} 
                text={lowStockAlert === 'critical' ? 'Cảnh báo' : 'Thông báo'}
              />
            )}
          </span>
        }
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
          {lowStockProducts.map((product) => (
            <div key={product.id} className="flex items-center justify-between">
              <div>
                <Text strong>{product.name}</Text>
                <div className="text-sm text-gray-500">
                  SKU: {product.sku} | Tối thiểu: {product.minStock}
                </div>
              </div>
              <div className="text-right">
                <Text 
                  strong 
                  className={
                    product.currentStock <= product.minStock * 0.5 
                      ? 'text-red-600' 
                      : 'text-orange-500'
                  }
                >
                  Còn {product.currentStock}
                </Text>
                <div className="text-sm text-gray-500">
                  Cần bổ sung: {Math.max(0, product.reorderLevel - product.currentStock)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </Col>
  </Row>
));

const MonthSummarySection = memo(({ kpis, utils }: {
  kpis: any;
  utils: any;
}) => {
  if (!kpis) return null;

  const monthStatistics = [
    {
      title: "Tổng doanh thu",
      value: kpis.monthRevenue,
      formatter: (value: number) => utils.formatCurrency(value),
      growth: kpis.growth.revenue
    },
    {
      title: "Tổng đơn hàng",
      value: kpis.monthOrders,
      growth: kpis.growth.orders
    },
    {
      title: "Khách hàng mới",
      value: kpis.monthCustomers,
      growth: kpis.growth.customers
    },
    {
      title: "Giá trị đơn TB",
      value: kpis.averageOrderValue,
      formatter: (value: number) => utils.formatCurrency(value),
      growth: kpis.growth.averageOrder
    }
  ];

  return (
    <Card title="Tổng kết tháng này" className="shadow-sm">
      <Row gutter={[16, 16]}>
        {monthStatistics.map((stat) => (
          <Col key={stat.title} xs={24} sm={6}>
            <Statistic
              title={stat.title}
              value={stat.value}
              formatter={stat.formatter}
              prefix={
                stat.growth >= 0 ? 
                  <ArrowUpOutlined className="text-green-500" /> : 
                  <ArrowDownOutlined className="text-red-500" />
              }
              suffix={
                <span className={stat.growth >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {Math.abs(stat.growth).toFixed(1)}%
                </span>
              }
            />
          </Col>
        ))}
      </Row>
    </Card>
  );
});

export const EnhancedDashboardPage: React.FC = memo(() => {
  const { setPageTitle, setBreadcrumbs } = usePage();
  const {
    kpis,
    topProducts,
    lowStockProducts,
    revenueChart,
    loading,
    error,
    hasErrors,
    isDataFresh,
    lastUpdated,
    selectedPeriod,
    autoRefresh,
    actions,
    utils,
    syncStatus,
    errorHandler,
    lowStockAlert,
  } = useDashboard();

  // Initialize page
  useEffect(() => {
    setPageTitle('Tổng quan');
    setBreadcrumbs([
      { title: 'Tổng quan' },
    ]);
  }, [setPageTitle, setBreadcrumbs]);

  // Handle refresh with debouncing
  const handleRefresh = React.useCallback(() => {
    actions.refreshAll();
  }, [actions]);

  if (loading && !kpis) {
    return <LoadingFallback />;
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
            <ConnectionStatus 
              syncStatus={syncStatus}
              autoRefresh={{ enabled: autoRefresh }}
              lastUpdated={lastUpdated}
            />
            {isDataFresh && (
              <Tooltip title="Dữ liệu mới nhất">
                <CheckCircleOutlined className="text-green-500" />
              </Tooltip>
            )}
          </div>
          <Text className="text-gray-600">
            Theo dõi hiệu suất kinh doanh và các chỉ số quan trọng
          </Text>
        </div>
        <Space>
          <Button 
            onClick={handleRefresh} 
            icon={<ReloadOutlined />}
            loading={loading}
            disabled={!syncStatus.connected}
          >
            {loading ? 'Đang làm mới...' : 'Làm mới'}
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

      {/* Error Display */}
      <ErrorDisplay 
        error={error}
        onRetry={errorHandler.retry}
        canRetry={errorHandler.canRetry}
        retryCount={errorHandler.retryCount}
      />

      {/* Today's KPIs */}
      <KPISection kpis={kpis} loading={loading} utils={utils} />

      {/* Charts */}
      <ChartsSection />

      {/* Quick Stats */}
      <QuickStatsSection 
        topProducts={topProducts}
        lowStockProducts={lowStockProducts}
        lowStockAlert={lowStockAlert}
        utils={utils}
      />

      {/* Month Summary */}
      <MonthSummarySection kpis={kpis} utils={utils} />

      {/* Auto-refresh indicator */}
      {autoRefresh && (
        <div className="fixed bottom-4 right-4 z-50">
          <Tooltip title="Tự động cập nhật đang bật">
            <Badge dot>
              <Button 
                shape="circle" 
                icon={<WifiOutlined />} 
                onClick={actions.toggleAutoRefresh}
                className="shadow-lg"
              />
            </Badge>
          </Tooltip>
        </div>
      )}
    </div>
  );
});

export default EnhancedDashboardPage;