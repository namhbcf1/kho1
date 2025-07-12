// Staff management interface
import React from 'react';
import { Table, Button, Space, Tag, Avatar } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined, UserOutlined } from '@ant-design/icons';

export const StaffManagement: React.FC = () => {
  const columns = [
    {
      title: 'Nhân viên',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar icon={<UserOutlined />} />
          <div>
            <div>{name}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Chức vụ',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const colors = {
          admin: 'red',
          manager: 'blue',
          cashier: 'green',
          staff: 'default',
        };
        const labels = {
          admin: 'Quản trị viên',
          manager: 'Quản lý',
          cashier: 'Thu ngân',
          staff: 'Nhân viên',
        };
        return <Tag color={colors[role as keyof typeof colors]}>{labels[role as keyof typeof labels]}</Tag>;
      },
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Ca làm việc',
      dataIndex: 'shift',
      key: 'shift',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'active',
      key: 'active',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'red'}>
          {active ? 'Hoạt động' : 'Tạm dừng'}
        </Tag>
      ),
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
      email: 'nguyenvana@company.com',
      role: 'manager',
      phone: '0901234567',
      shift: 'Ca sáng',
      active: true,
    },
    {
      key: '2',
      name: 'Trần Thị B',
      email: 'tranthib@company.com',
      role: 'cashier',
      phone: '0907654321',
      shift: 'Ca chiều',
      active: true,
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      pagination={{
        total: 50,
        pageSize: 20,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) =>
          `${range[0]}-${range[1]} của ${total} nhân viên`,
      }}
    />
  );
};

export default StaffManagement;
