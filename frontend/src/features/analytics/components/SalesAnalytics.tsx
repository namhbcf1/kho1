// Sales performance charts component
import React from 'react';
import { Card, Row, Col } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export const SalesAnalytics: React.FC = () => {
  const salesData = [
    { name: 'T2', sales: 4000, orders: 24 },
    { name: 'T3', sales: 3000, orders: 18 },
    { name: 'T4', sales: 2000, orders: 12 },
    { name: 'T5', sales: 2780, orders: 16 },
    { name: 'T6', sales: 1890, orders: 11 },
    { name: 'T7', sales: 2390, orders: 14 },
    { name: 'CN', sales: 3490, orders: 20 },
  ];

  const categoryData = [
    { name: 'Đồ uống', value: 400, color: '#0088FE' },
    { name: 'Thức ăn', value: 300, color: '#00C49F' },
    { name: 'Bánh kẹo', value: 200, color: '#FFBB28' },
    { name: 'Khác', value: 100, color: '#FF8042' },
  ];

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={16}>
        <Card title="Doanh số theo ngày">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="sales" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </Col>
      <Col xs={24} lg={8}>
        <Card title="Doanh số theo danh mục">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </Col>
    </Row>
  );
};

export default SalesAnalytics;
