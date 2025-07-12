// Staff performance reports component
import React from 'react';
import { Card, Select, DatePicker, Button, Table } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { formatVND } from '../../../utils/formatters/vndCurrency';

export const StaffReports: React.FC = () => {
  const columns = [
    {
      title: 'Nhân viên',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Số đơn hàng',
      dataIndex: 'orders',
      key: 'orders',
    },
    {
      title: 'Doanh số',
      dataIndex: 'sales',
      key: 'sales',
      render: (amount: number) => formatVND(amount),
    },
    {
      title: 'Hoa hồng',
      dataIndex: 'commission',
      key: 'commission',
      render: (amount: number) => formatVND(amount),
    },
    {
      title: 'Đánh giá',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating: number) => `${rating}/5 ⭐`,
    },
  ];

  const data = [
    {
      key: '1',
      name: 'Nguyễn Văn A',
      orders: 45,
      sales: 15000000,
      commission: 450000,
      rating: 4.8,
    },
    {
      key: '2',
      name: 'Trần Thị B',
      orders: 38,
      sales: 12000000,
      commission: 360000,
      rating: 4.6,
    },
    {
      key: '3',
      name: 'Lê Văn C',
      orders: 52,
      sales: 18000000,
      commission: 540000,
      rating: 4.9,
    },
  ];

  return (
    <Card 
      title="Báo cáo hiệu suất nhân viên"
      extra={
        <div style={{ display: 'flex', gap: 8 }}>
          <DatePicker.RangePicker />
          <Select defaultValue="all" style={{ width: 120 }}>
            <Select.Option value="all">Tất cả</Select.Option>
            <Select.Option value="cashier">Thu ngân</Select.Option>
            <Select.Option value="staff">Nhân viên</Select.Option>
          </Select>
          <Button icon={<DownloadOutlined />}>Xuất báo cáo</Button>
        </div>
      }
    >
      <Table
        columns={columns}
        dataSource={data}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} của ${total} nhân viên`,
        }}
        summary={() => {
          const totalOrders = data.reduce((sum, item) => sum + item.orders, 0);
          const totalSales = data.reduce((sum, item) => sum + item.sales, 0);
          const totalCommission = data.reduce((sum, item) => sum + item.commission, 0);
          const averageRating = data.reduce((sum, item) => sum + item.rating, 0) / data.length;

          return (
            <Table.Summary>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}>
                  <strong>Tổng cộng</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1}>
                  <strong>{totalOrders}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2}>
                  <strong>{formatVND(totalSales)}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3}>
                  <strong>{formatVND(totalCommission)}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4}>
                  <strong>{averageRating.toFixed(1)}/5 ⭐</strong>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          );
        }}
      />
    </Card>
  );
};

export default StaffReports;
