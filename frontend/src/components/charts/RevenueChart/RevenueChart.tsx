import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockData = [
  { date: '20/07', revenue: 12500000, orders: 35 },
  { date: '21/07', revenue: 15750000, orders: 42 },
  { date: '22/07', revenue: 18900000, orders: 48 },
  { date: '23/07', revenue: 16200000, orders: 39 },
  { date: '24/07', revenue: 22100000, orders: 55 },
  { date: '25/07', revenue: 19800000, orders: 46 },
  { date: '26/07', revenue: 25300000, orders: 62 },
];

interface RevenueChartProps {
  height?: number;
}

export const RevenueChart: React.FC<RevenueChartProps> = ({
  height = 300,
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatShortCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M ₫`;
    }
    return formatCurrency(value);
  };

  return (
    <div style={{ height: height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={mockData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
            formatter={(value: number) => [formatCurrency(value), 'Doanh thu']}
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
};

export default RevenueChart;
