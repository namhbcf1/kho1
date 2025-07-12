// Vietnamese customer list component
import React from 'react';
import { Table, Button, Space, Tag, Avatar } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined, UserOutlined } from '@ant-design/icons';
import { formatVND } from '../../../utils/formatters/vndCurrency';

export const CustomerList: React.FC = () => {
  const columns = [
    {
      title: 'Khách hàng',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar icon={<UserOutlined />} />
          <div>
            <div>{name}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{record.phone}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Hạng thành viên',
      dataIndex: 'tier',
      key: 'tier',
      render: (tier: string) => {
        const colors = {
          bronze: '#cd7f32',
          silver: '#c0c0c0',
          gold: '#ffd700',
          platinum: '#e5e4e2',
          diamond: '#b9f2ff',
        };
        return <Tag color={colors[tier as keyof typeof colors]}>{tier}</Tag>;
      },
    },
    {
      title: 'Điểm tích lũy',
      dataIndex: 'loyaltyPoints',
      key: 'loyaltyPoints',
    },
    {
      title: 'Tổng chi tiêu',
      dataIndex: 'totalSpent',
      key: 'totalSpent',
      render: (amount: number) => formatVND(amount),
    },
    {
      title: 'Số đơn hàng',
      dataIndex: 'totalOrders',
      key: 'totalOrders',
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: () => (
        <Space size="middle">
          <Button type="primary" icon={<EyeOutlined />} size="small" />
          <Button icon={<EditOutlined />} size="small" />
          <Button danger icon={<DeleteOutlined />} size="small" />
        </Space>
      ),
    },
  ];

  const data = [
    {
      key: '1',
      name: 'Nguyễn Văn A',
      email: 'nguyenvana@example.com',
      phone: '0901234567',
      tier: 'gold',
      loyaltyPoints: 1500,
      totalSpent: 5000000,
      totalOrders: 25,
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
          `${range[0]}-${range[1]} của ${total} khách hàng`,
      }}
    />
  );
};

export default CustomerList;
