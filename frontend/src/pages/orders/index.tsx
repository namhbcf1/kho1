import React from 'react';
import { Table, Tag, Typography, Card, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

const { Title } = Typography;

// Mock data
const mockOrders = [
  {
    id: 'ORD001',
    customer: 'Nguyễn Văn A',
    date: '2024-01-15',
    total: 250000,
    status: 'completed',
    paymentMethod: 'cash'
  },
  {
    id: 'ORD002',
    customer: 'Trần Thị B',
    date: '2024-01-15',
    total: 180000,
    status: 'completed',
    paymentMethod: 'card'
  },
  {
    id: 'ORD003',
    customer: 'Lê Văn C',
    date: '2024-01-15',
    total: 320000,
    status: 'pending',
    paymentMethod: 'vnpay'
  }
];

export default function OrdersPage() {
  const statusColors = {
    completed: 'green',
    pending: 'orange',
    cancelled: 'red'
  };

  const statusLabels = {
    completed: 'Hoàn thành',
    pending: 'Đang xử lý',
    cancelled: 'Đã hủy'
  };

  const paymentLabels = {
    cash: 'Tiền mặt',
    card: 'Thẻ ngân hàng',
    vnpay: 'VNPay',
    momo: 'MoMo',
    zalopay: 'ZaloPay'
  };

  const columns = [
    {
      title: 'Mã đơn hàng',
      dataIndex: 'id',
      key: 'id'
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customer',
      key: 'customer'
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => new Date(date).toLocaleDateString('vi-VN')
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'total',
      key: 'total',
      render: (amount: number) => `${amount.toLocaleString()}₫`,
      sorter: (a: any, b: any) => a.total - b.total
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColors[status as keyof typeof statusColors]}>
          {statusLabels[status as keyof typeof statusLabels]}
        </Tag>
      )
    },
    {
      title: 'Phương thức TT',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (method: string) => paymentLabels[method as keyof typeof paymentLabels]
    }
  ];

  return (
    <div className="orders-page">
      <Title level={2} style={{ marginBottom: 24 }}>Quản lý đơn hàng</Title>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder="Tìm kiếm đơn hàng..."
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
          />
        </div>

        <Table
          columns={columns}
          dataSource={mockOrders}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}