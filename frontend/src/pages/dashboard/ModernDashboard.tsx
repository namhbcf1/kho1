// Modern Dashboard for Vietnamese POS System
import { Line, Pie } from '@ant-design/charts';

import {
  AreaChartOutlined,
  BarChartOutlined,
  DollarOutlined,
  LineChartOutlined,
  ReloadOutlined,
  ShoppingCartOutlined,
  TagOutlined,
  UserOutlined
} from '@ant-design/icons';
import { Button, DatePicker, Empty, Select, Space, Tabs } from 'antd';
import React, { useEffect, useState } from 'react';
import { ModernDataCard, ModernOrderCard, ModernStatsCard, ModernTable } from '../../components/ui/ModernComponents';
import '../../styles/modern-ui.css';

const { RangePicker } = DatePicker;
const { TabPane } = Tabs;
const { Option } = Select;

// Format currency in VND
const formatVND = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  }).format(amount);
};

// Sample data for demonstration
const generateSampleData = () => {
  // Sales data
  const salesData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    
    return {
      date: date.toISOString().split('T')[0],
      sales: Math.floor(Math.random() * 10000000) + 5000000,
    };
  });
  
  // Product categories
  const categoryData = [
    { category: 'Điện thoại', value: 35 },
    { category: 'Laptop', value: 25 },
    { category: 'Phụ kiện', value: 18 },
    { category: 'Máy tính bảng', value: 15 },
    { category: 'Khác', value: 7 },
  ];
  
  // Recent orders
  const recentOrders = Array.from({ length: 5 }, (_, i) => {
    const date = new Date();
    date.setHours(date.getHours() - i * 2);
    
    return {
      id: `ORD-${Math.floor(Math.random() * 10000)}`,
      customer: `Khách hàng ${i + 1}`,
      date: date.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
      amount: Math.floor(Math.random() * 5000000) + 1000000,
      status: ['pending', 'processing', 'completed', 'cancelled'][Math.floor(Math.random() * 4)] as 'pending' | 'processing' | 'completed' | 'cancelled',
      items: Math.floor(Math.random() * 10) + 1,
    };
  });
  
  // Top products
  const topProducts = Array.from({ length: 5 }, (_, i) => ({
    name: `Sản phẩm ${i + 1}`,
    category: ['Điện thoại', 'Laptop', 'Phụ kiện', 'Máy tính bảng', 'Khác'][i % 5],
    sales: Math.floor(Math.random() * 100) + 20,
    revenue: Math.floor(Math.random() * 50000000) + 10000000,
  }));
  
  return { salesData, categoryData, recentOrders, topProducts };
};

const ModernDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [timeRange, setTimeRange] = useState<string>('7d');
  
  // Simulate data loading
  useEffect(() => {
    setLoading(true);
    
    setTimeout(() => {
      setData(generateSampleData());
      setLoading(false);
    }, 1000);
  }, [timeRange]);
  
  // Time range options
  const timeRangeOptions = [
    { label: 'Hôm nay', value: '1d' },
    { label: '7 ngày qua', value: '7d' },
    { label: '30 ngày qua', value: '30d' },
    { label: 'Tháng này', value: 'month' },
    { label: 'Quý này', value: 'quarter' },
    { label: 'Năm nay', value: 'year' },
  ];
  
  // Chart configurations
  const salesChartConfig = {
    data: data?.salesData || [],
    xField: 'date',
    yField: 'sales',
    smooth: true,
    lineStyle: {
      stroke: 'var(--color-primary)',
      lineWidth: 3,
    },
    areaStyle: {
      fill: 'l(270) 0:#ffffff00 1:var(--color-primary)20',
    },
    point: {
      size: 5,
      shape: 'circle',
      style: {
        fill: 'var(--color-primary)',
        stroke: '#fff',
        lineWidth: 2,
      },
    },
    yAxis: {
      label: {
        formatter: (v: string) => {
          return `${Number(v) / 1000000}M`;
        },
      },
    },
    tooltip: {
      formatter: (datum: any) => {
        return { name: 'Doanh thu', value: formatVND(datum.sales) };
      },
    },
  };
  
  const categoryChartConfig = {
    data: data?.categoryData || [],
    angleField: 'value',
    colorField: 'category',
    radius: 0.8,
    innerRadius: 0.6,
    label: {
      type: 'outer',
      content: '{percentage}',
    },
    interactions: [{ type: 'element-active' }],
    legend: {
      layout: 'horizontal',
      position: 'bottom',
    },
    tooltip: {
      formatter: (datum: any) => {
        return { name: datum.category, value: `${datum.value}%` };
      },
    },
  };
  
  // Table columns for top products
  const topProductColumns = [
    {
      title: 'Sản phẩm',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Danh mục',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Đã bán',
      dataIndex: 'sales',
      key: 'sales',
      align: 'right' as const,
    },
    {
      title: 'Doanh thu',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (value: number) => formatVND(value),
      align: 'right' as const,
    },
  ];
  
  return (
    <div className="modern-dashboard">
      {/* Dashboard Header */}
      <div className="modern-page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h1 className="modern-page-title">Tổng quan</h1>
            <p className="modern-page-description">Xem tổng quan về hoạt động kinh doanh của bạn</p>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Select 
              defaultValue="7d" 
              style={{ width: 150 }}
              onChange={(value) => setTimeRange(value)}
            >
              {timeRangeOptions.map(option => (
                <Option key={option.value} value={option.value}>{option.label}</Option>
              ))}
            </Select>
            <Button 
              type="primary" 
              icon={<ReloadOutlined />}
              onClick={() => {
                setLoading(true);
                setTimeout(() => {
                  setData(generateSampleData());
                  setLoading(false);
                }, 1000);
              }}
            >
              Làm mới
            </Button>
          </div>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="modern-grid">
        <div className="modern-grid-item-3">
          <ModernStatsCard
            title="Doanh thu hôm nay"
            value={formatVND(data?.salesData?.[data?.salesData.length - 1]?.sales || 0)}
            icon={<DollarOutlined style={{ fontSize: 20 }} />}
            trend={{ value: 12.5, type: 'up', label: 'so với hôm qua' }}
            loading={loading}
          />
        </div>
        <div className="modern-grid-item-3">
          <ModernStatsCard
            title="Đơn hàng hôm nay"
            value="28"
            icon={<ShoppingCartOutlined style={{ fontSize: 20 }} />}
            trend={{ value: 5.2, type: 'up', label: 'so với hôm qua' }}
            loading={loading}
            color="var(--color-vndOrange)"
          />
        </div>
        <div className="modern-grid-item-3">
          <ModernStatsCard
            title="Khách hàng mới"
            value="12"
            icon={<UserOutlined style={{ fontSize: 20 }} />}
            trend={{ value: 2.1, type: 'down', label: 'so với hôm qua' }}
            loading={loading}
            color="var(--color-vndPurple)"
          />
        </div>
        <div className="modern-grid-item-3">
          <ModernStatsCard
            title="Sản phẩm đã bán"
            value="156"
            icon={<TagOutlined style={{ fontSize: 20 }} />}
            trend={{ value: 8.3, type: 'up', label: 'so với hôm qua' }}
            loading={loading}
            color="var(--color-vndGreen)"
          />
        </div>
      </div>
      
      {/* Charts */}
      <div className="modern-grid" style={{ marginTop: 24 }}>
        <div className="modern-grid-item-8">
          <ModernDataCard
            title="Doanh thu theo thời gian"
            subtitle={`Biểu đồ doanh thu ${timeRangeOptions.find(o => o.value === timeRange)?.label.toLowerCase() || '7 ngày qua'}`}
            loading={loading}
            extra={
              <Space>
                <Button type="text" icon={<LineChartOutlined />} />
                <Button type="text" icon={<BarChartOutlined />} />
                <Button type="text" icon={<AreaChartOutlined />} />
              </Space>
            }
          >
            <div style={{ height: 350 }}>
              {data?.salesData ? (
                <Line {...salesChartConfig} />
              ) : (
                <Empty description="Không có dữ liệu" style={{ marginTop: 100 }} />
              )}
            </div>
          </ModernDataCard>
        </div>
        
        <div className="modern-grid-item-4">
          <ModernDataCard
            title="Phân loại sản phẩm"
            subtitle="Tỷ lệ doanh thu theo danh mục"
            loading={loading}
          >
            <div style={{ height: 350 }}>
              {data?.categoryData ? (
                <Pie {...categoryChartConfig} />
              ) : (
                <Empty description="Không có dữ liệu" style={{ marginTop: 100 }} />
              )}
            </div>
          </ModernDataCard>
        </div>
      </div>
      
      {/* Recent Orders & Top Products */}
      <div className="modern-grid" style={{ marginTop: 24 }}>
        <div className="modern-grid-item-6">
          <ModernDataCard
            title="Đơn hàng gần đây"
            subtitle="5 đơn hàng mới nhất trong hệ thống"
            loading={loading}
            extra={
              <Button type="link" style={{ padding: 0 }}>
                Xem tất cả
              </Button>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {data?.recentOrders?.map((order: any) => (
                <ModernOrderCard
                  key={order.id}
                  orderNumber={order.id}
                  customer={order.customer}
                  date={order.date}
                  amount={formatVND(order.amount)}
                  status={order.status}
                  items={order.items}
                  onClick={() => console.log(`View order ${order.id}`)}
                />
              ))}
            </div>
          </ModernDataCard>
        </div>
        
        <div className="modern-grid-item-6">
          <ModernDataCard
            title="Sản phẩm bán chạy"
            subtitle="Top 5 sản phẩm có doanh thu cao nhất"
            loading={loading}
            extra={
              <Button type="link" style={{ padding: 0 }}>
                Xem tất cả
              </Button>
            }
          >
            <ModernTable
              dataSource={data?.topProducts}
              columns={topProductColumns}
              pagination={false}
            />
          </ModernDataCard>
        </div>
      </div>
    </div>
  );
};

export default ModernDashboard;