// Purchase history component
import React from 'react';
import { Table, Tag, Button } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { formatVND } from '../../../utils/formatters/vndCurrency';
import { formatVietnameseDate } from '../../../utils/formatters/vietnameseDate';

export const CustomerHistory: React.FC = () => {
  const columns = [
    {
      title: 'Mã đơn hàng',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
    },
    {
      title: 'Ngày mua',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => formatVietnameseDate(date),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'total',
      key: 'total',
      render: (amount: number) => formatVND(amount),
    },
    {
      title: 'Phương thức thanh toán',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (method: string) => {
        const colors = {
          cash: 'green',
          card: 'blue',
          vnpay: 'red',
          momo: 'purple',
        };
        return <Tag color={colors[method as keyof typeof colors]}>{method}</Tag>;
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = {
          completed: 'green',
          pending: 'orange',
          cancelled: 'red',
        };
        const labels = {
          completed: 'Hoàn thành',
          pending: 'Đang xử lý',
          cancelled: 'Đã hủy',
        };
        return (
          <Tag color={colors[status as keyof typeof colors]}>
            {labels[status as keyof typeof labels]}
          </Tag>
        );
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: () => (
        <Button type="primary" icon={<EyeOutlined />} size="small">
          Xem chi tiết
        </Button>
      ),
    },
  ];

  const data = [
    {
      key: '1',
      orderNumber: 'DH001',
      createdAt: '2024-01-15T10:30:00Z',
      total: 150000,
      paymentMethod: 'cash',
      status: 'completed',
    },
    {
      key: '2',
      orderNumber: 'DH002',
      createdAt: '2024-01-10T14:20:00Z',
      total: 250000,
      paymentMethod: 'vnpay',
      status: 'completed',
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h3>Lịch sử mua hàng</h3>
        <div>
          <span style={{ marginRight: 16 }}>
            Tổng đơn hàng: <strong>25</strong>
          </span>
          <span>
            Tổng chi tiêu: <strong>{formatVND(5000000)}</strong>
          </span>
        </div>
      </div>
      
      <Table
        columns={columns}
        dataSource={data}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} của ${total} đơn hàng`,
        }}
      />
    </div>
  );
};

export default CustomerHistory;
