import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from 'antd';
import type { SalesChartProps } from './SalesChart.types';

export const SalesChart: React.FC<SalesChartProps> = ({
  data,
  title = 'Thống kê bán hàng',
  height = 300,
}) => {
  return (
    <Card title={title}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="period" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="sales" fill="#52c41a" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default SalesChart;
