import React, { memo, useMemo, useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from 'recharts';
import { Spin, Alert, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import type { RevenueChartProps } from './RevenueChart.types';
import { analyticsService } from '../../../services/api/analyticsService';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';

interface RevenueDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

const fallbackData: RevenueDataPoint[] = [
  { date: '20/07', revenue: 12500000, orders: 35 },
  { date: '21/07', revenue: 15750000, orders: 42 },
  { date: '22/07', revenue: 18900000, orders: 48 },
  { date: '23/07', revenue: 16200000, orders: 39 },
  { date: '24/07', revenue: 22100000, orders: 55 },
  { date: '25/07', revenue: 19800000, orders: 46 },
  { date: '26/07', revenue: 25300000, orders: 62 },
];

export const RevenueChart: React.FC<RevenueChartProps> = memo(({
  height = 300,
}) => {
  const { isOnline } = useNetworkStatus();
  const [data, setData] = useState<RevenueDataPoint[]>(fallbackData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRevenueData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!isOnline) {
        setData(fallbackData);
        return;
      }

      // Try to fetch real data from analytics service
      const revenueData = await analyticsService.getRevenueChart(7);
      if (revenueData && revenueData.length > 0) {
        setData(revenueData);
      } else {
        setData(fallbackData);
      }
    } catch (err) {
      console.warn('Failed to load revenue data, using fallback:', err);
      setError('Không thể tải dữ liệu doanh thu');
      setData(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRevenueData();
  }, [isOnline]);
  const formatCurrency = useMemo(() => {
    return (value: number) => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    };
  }, []);

  const formatShortCurrency = useMemo(() => {
    return (value: number) => {
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M ₫`;
      }
      return formatCurrency(value);
    };
  }, [formatCurrency]);

  if (loading) {
    return (
      <div style={{ height: height }} className="flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ height: height }} className="flex items-center justify-center">
        <Alert
          message="Lỗi tải dữ liệu"
          description={error}
          type="warning"
          showIcon
          action={
            <Button size="small" onClick={loadRevenueData} icon={<ReloadOutlined />}>
              Thử lại
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div style={{ height: height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#666' }}
          />
          <YAxis 
            tickFormatter={formatShortCurrency}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#666' }}
          />
          <Tooltip 
            formatter={(value: number, name: string) => [formatCurrency(value), 'Doanh thu']}
            labelStyle={{ color: '#666' }}
            contentStyle={{ 
              border: 'none', 
              borderRadius: '8px', 
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
            }}
          />
          <Line 
            type="monotone" 
            dataKey="revenue" 
            stroke="#1890ff" 
            strokeWidth={3}
            dot={{ fill: '#1890ff', strokeWidth: 2, r: 6 }}
            activeDot={{ r: 8, stroke: '#1890ff', strokeWidth: 2, fill: '#fff' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});

export default RevenueChart;
