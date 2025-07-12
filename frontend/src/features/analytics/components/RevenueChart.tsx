// Revenue chart component for analytics dashboard
import React, { useState, useEffect } from 'react';
import { Card, Select, DatePicker, Spin } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useTranslation } from 'react-i18next';
import { formatVND } from '../../../utils/formatters/vndCurrency';
import { formatVietnameseDate } from '../../../utils/formatters/vietnameseDate';
import { useAnalytics } from '../hooks/useAnalytics';

const { Option } = Select;
const { RangePicker } = DatePicker;

export const RevenueChart: React.FC = () => {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<string>('week');
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  
  const { revenueData, loading, getRevenueData } = useAnalytics();

  useEffect(() => {
    getRevenueData({
      period,
      startDate: dateRange?.[0],
      endDate: dateRange?.[1],
      groupBy: period === 'today' ? 'hour' : 'day',
    });
  }, [period, dateRange]);

  const formatTooltipValue = (value: number) => {
    return formatVND(value);
  };

  const formatXAxisLabel = (value: string) => {
    if (period === 'today') {
      return `${value}:00`;
    }
    return formatVietnameseDate(value, 'dd/MM');
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-medium">
            {period === 'today' 
              ? `${label}:00` 
              : formatVietnameseDate(label, 'dd/MM/yyyy')
            }
          </p>
          <p className="text-blue-600">
            Doanh thu: {formatVND(payload[0].value)}
          </p>
          {payload[1] && (
            <p className="text-green-600">
              Đơn hàng: {payload[1].value}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card title={t('analytics.revenue')} className="h-96">
        <div className="flex justify-center items-center h-full">
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  return (
    <Card
      title={t('analytics.revenue')}
      extra={
        <div className="flex gap-2">
          <Select
            value={period}
            onChange={setPeriod}
            style={{ width: 120 }}
          >
            <Option value="today">{t('analytics.today')}</Option>
            <Option value="week">{t('analytics.thisWeek')}</Option>
            <Option value="month">{t('analytics.thisMonth')}</Option>
            <Option value="quarter">{t('analytics.thisQuarter')}</Option>
            <Option value="custom">{t('analytics.custom')}</Option>
          </Select>
          
          <Select
            value={chartType}
            onChange={setChartType}
            style={{ width: 100 }}
          >
            <Option value="line">Line</Option>
            <Option value="bar">Bar</Option>
          </Select>
        </div>
      }
      className="h-96"
    >
      {period === 'custom' && (
        <div className="mb-4">
          <RangePicker
            onChange={(dates) => {
              if (dates) {
                setDateRange([
                  dates[0]!.format('YYYY-MM-DD'),
                  dates[1]!.format('YYYY-MM-DD')
                ]);
              } else {
                setDateRange(null);
              }
            }}
            format="DD/MM/YYYY"
          />
        </div>
      )}

      <ResponsiveContainer width="100%" height={300}>
        {chartType === 'line' ? (
          <LineChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatXAxisLabel}
            />
            <YAxis 
              tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#1890ff" 
              strokeWidth={2}
              dot={{ fill: '#1890ff', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="orders" 
              stroke="#52c41a" 
              strokeWidth={2}
              yAxisId="right"
              dot={{ fill: '#52c41a', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        ) : (
          <BarChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatXAxisLabel}
            />
            <YAxis 
              tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="revenue" 
              fill="#1890ff"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        )}
      </ResponsiveContainer>

      {/* Summary Stats */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-blue-600">
            {formatVND(revenueData.reduce((sum, item) => sum + item.revenue, 0))}
          </div>
          <div className="text-sm text-gray-600">Tổng doanh thu</div>
        </div>
        
        <div>
          <div className="text-2xl font-bold text-green-600">
            {revenueData.reduce((sum, item) => sum + item.orders, 0)}
          </div>
          <div className="text-sm text-gray-600">Tổng đơn hàng</div>
        </div>
        
        <div>
          <div className="text-2xl font-bold text-orange-600">
            {formatVND(
              revenueData.reduce((sum, item) => sum + item.revenue, 0) /
              Math.max(revenueData.reduce((sum, item) => sum + item.orders, 0), 1)
            )}
          </div>
          <div className="text-sm text-gray-600">Giá trị TB/đơn</div>
        </div>
      </div>
    </Card>
  );
};

export default RevenueChart;
