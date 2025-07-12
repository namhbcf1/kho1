// VND revenue analytics component
import React from 'react';
import { Card, DatePicker, Select, Button } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatVND } from '../../../utils/formatters/vndCurrency';

export const RevenueReports: React.FC = () => {
  const data = [
    { name: '01/01', revenue: 4000000 },
    { name: '02/01', revenue: 3000000 },
    { name: '03/01', revenue: 2000000 },
    { name: '04/01', revenue: 2780000 },
    { name: '05/01', revenue: 1890000 },
    { name: '06/01', revenue: 2390000 },
    { name: '07/01', revenue: 3490000 },
  ];

  return (
    <Card 
      title="Báo cáo doanh thu"
      extra={
        <div style={{ display: 'flex', gap: 8 }}>
          <DatePicker.RangePicker />
          <Select defaultValue="daily" style={{ width: 100 }}>
            <Select.Option value="daily">Ngày</Select.Option>
            <Select.Option value="weekly">Tuần</Select.Option>
            <Select.Option value="monthly">Tháng</Select.Option>
          </Select>
          <Button icon={<DownloadOutlined />}>Xuất</Button>
        </div>
      }
    >
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis tickFormatter={(value) => formatVND(value)} />
          <Tooltip formatter={(value) => formatVND(value as number)} />
          <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default RevenueReports;
