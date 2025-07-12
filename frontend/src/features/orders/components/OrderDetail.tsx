// Order details view component
import React from 'react';
import { Card, Descriptions, Table, Tag, Button, Space, Divider } from 'antd';
import { PrinterOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { formatVND } from '../../../utils/formatters/vndCurrency';
import { formatVietnameseDate } from '../../../utils/formatters/vietnameseDate';

export const OrderDetail: React.FC = () => {
  const orderData = {
    orderNumber: 'DH001',
    customerName: 'Nguyễn Văn A',
    customerPhone: '0901234567',
    createdAt: '2024-01-15T10:30:00Z',
    status: 'completed',
    paymentMethod: 'cash',
    cashierName: 'Thu ngân 1',
    subtotal: 135000,
    discount: 15000,
    tax: 12000,
    total: 132000,
    cashReceived: 150000,
    change: 18000,
    notes: 'Khách hàng yêu cầu ít đường',
  };

  const items = [
    {
      key: '1',
      name: 'Cà phê đen',
      price: 25000,
      quantity: 2,
      total: 50000,
    },
    {
      key: '2',
      name: 'Bánh croissant',
      price: 35000,
      quantity: 1,
      total: 35000,
    },
    {
      key: '3',
      name: 'Trà sữa',
      price: 40000,
      quantity: 1,
      total: 40000,
    },
  ];

  const itemColumns = [
    {
      title: 'Sản phẩm',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Đơn giá',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => formatVND(price),
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: 'Thành tiền',
      dataIndex: 'total',
      key: 'total',
      render: (total: number) => formatVND(total),
    },
  ];

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'orange',
      processing: 'blue',
      completed: 'green',
      cancelled: 'red',
      refunded: 'purple',
    };
    return colors[status as keyof typeof colors];
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'Chờ xử lý',
      processing: 'Đang xử lý',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy',
      refunded: 'Đã hoàn tiền',
    };
    return labels[status as keyof typeof labels];
  };

  return (
    <div>
      <Card 
        title={`Chi tiết đơn hàng ${orderData.orderNumber}`}
        extra={
          <Space>
            <Button icon={<PrinterOutlined />}>In hóa đơn</Button>
            {orderData.status === 'pending' && (
              <>
                <Button icon={<EditOutlined />}>Chỉnh sửa</Button>
                <Button danger icon={<DeleteOutlined />}>Hủy đơn</Button>
              </>
            )}
          </Space>
        }
      >
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Mã đơn hàng">
            {orderData.orderNumber}
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Tag color={getStatusColor(orderData.status)}>
              {getStatusLabel(orderData.status)}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Khách hàng">
            {orderData.customerName || 'Khách lẻ'}
          </Descriptions.Item>
          <Descriptions.Item label="Số điện thoại">
            {orderData.customerPhone || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày tạo">
            {formatVietnameseDate(orderData.createdAt)}
          </Descriptions.Item>
          <Descriptions.Item label="Thu ngân">
            {orderData.cashierName}
          </Descriptions.Item>
          <Descriptions.Item label="Phương thức thanh toán">
            <Tag color="green">
              {orderData.paymentMethod === 'cash' ? 'Tiền mặt' : orderData.paymentMethod}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Ghi chú">
            {orderData.notes || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Sản phẩm" style={{ marginTop: 16 }}>
        <Table
          columns={itemColumns}
          dataSource={items}
          pagination={false}
          summary={() => (
            <Table.Summary>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={3}>
                  <strong>Tạm tính</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1}>
                  <strong>{formatVND(orderData.subtotal)}</strong>
                </Table.Summary.Cell>
              </Table.Summary.Row>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={3}>
                  Giảm giá
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1}>
                  -{formatVND(orderData.discount)}
                </Table.Summary.Cell>
              </Table.Summary.Row>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={3}>
                  Thuế VAT (10%)
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1}>
                  {formatVND(orderData.tax)}
                </Table.Summary.Cell>
              </Table.Summary.Row>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={3}>
                  <strong style={{ fontSize: '16px' }}>Tổng cộng</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1}>
                  <strong style={{ fontSize: '16px', color: '#1890ff' }}>
                    {formatVND(orderData.total)}
                  </strong>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </Card>

      {orderData.paymentMethod === 'cash' && (
        <Card title="Thông tin thanh toán" style={{ marginTop: 16 }}>
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Tiền khách đưa">
              {formatVND(orderData.cashReceived)}
            </Descriptions.Item>
            <Descriptions.Item label="Tiền thừa">
              {formatVND(orderData.change)}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}
    </div>
  );
};

export default OrderDetail;
