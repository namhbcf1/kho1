// Vietnamese order management component
import React from 'react';
import { Table, Button, Space, Tag, Tooltip } from 'antd';
import { EyeOutlined, PrinterOutlined, EditOutlined } from '@ant-design/icons';
import { formatVND } from '../../../utils/formatters/vndCurrency';
import { formatVietnameseDate } from '../../../utils/formatters/vietnameseDate';

export const OrderList: React.FC = () => {
  const columns = [
    {
      title: 'Mã đơn hàng',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (orderNumber: string) => (
        <Button type="link" style={{ padding: 0 }}>
          {orderNumber}
        </Button>
      ),
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customerName',
      key: 'customerName',
      render: (name: string) => name || 'Khách lẻ',
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => formatVietnameseDate(date),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'total',
      key: 'total',
      render: (amount: number) => (
        <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
          {formatVND(amount)}
        </span>
      ),
    },
    {
      title: 'Thanh toán',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (method: string) => {
        const colors = {
          cash: 'green',
          card: 'blue',
          vnpay: 'red',
          momo: 'purple',
          zalopay: 'orange',
        };
        const labels = {
          cash: 'Tiền mặt',
          card: 'Thẻ',
          vnpay: 'VNPay',
          momo: 'MoMo',
          zalopay: 'ZaloPay',
        };
        return (
          <Tag color={colors[method as keyof typeof colors]}>
            {labels[method as keyof typeof labels]}
          </Tag>
        );
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = {
          pending: 'orange',
          processing: 'blue',
          completed: 'green',
          cancelled: 'red',
          refunded: 'purple',
        };
        const labels = {
          pending: 'Chờ xử lý',
          processing: 'Đang xử lý',
          completed: 'Hoàn thành',
          cancelled: 'Đã hủy',
          refunded: 'Đã hoàn tiền',
        };
        return (
          <Tag color={colors[status as keyof typeof colors]}>
            {labels[status as keyof typeof labels]}
          </Tag>
        );
      },
    },
    {
      title: 'Thu ngân',
      dataIndex: 'cashierName',
      key: 'cashierName',
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record: any) => (
        <Space size="middle">
          <Tooltip title="Xem chi tiết">
            <Button type="primary" icon={<EyeOutlined />} size="small" />
          </Tooltip>
          <Tooltip title="In hóa đơn">
            <Button icon={<PrinterOutlined />} size="small" />
          </Tooltip>
          {record.status === 'pending' && (
            <Tooltip title="Chỉnh sửa">
              <Button icon={<EditOutlined />} size="small" />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  const data = [
    {
      key: '1',
      orderNumber: 'DH001',
      customerName: 'Nguyễn Văn A',
      createdAt: '2024-01-15T10:30:00Z',
      total: 150000,
      paymentMethod: 'cash',
      status: 'completed',
      cashierName: 'Thu ngân 1',
    },
    {
      key: '2',
      orderNumber: 'DH002',
      customerName: null,
      createdAt: '2024-01-15T11:15:00Z',
      total: 75000,
      paymentMethod: 'vnpay',
      status: 'pending',
      cashierName: 'Thu ngân 2',
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      pagination={{
        total: 100,
        pageSize: 20,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) =>
          `${range[0]}-${range[1]} của ${total} đơn hàng`,
      }}
      scroll={{ x: 1200 }}
    />
  );
};

export default OrderList;
