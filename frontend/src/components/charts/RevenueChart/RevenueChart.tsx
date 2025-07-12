import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from 'antd';
import type { RevenueChartProps } from './RevenueChart.types';

export const RevenueChart: React.FC<RevenueChartProps> = ({
  data,
  title = 'Doanh thu',
  height = 300,
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  return (
    <Card title={title}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis tickFormatter={formatCurrency} />
          <Tooltip formatter={(value) => [formatCurrency(value as number), 'Doanh thu']} />
          <Line type="monotone" dataKey="revenue" stroke="#1890ff" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default RevenueChart;
