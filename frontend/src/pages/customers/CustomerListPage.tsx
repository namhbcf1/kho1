// Customer list page
import React from 'react';
import { Card, Button, Space } from 'antd';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { CustomerList } from '../../features/customers/components';

export const CustomerListPage: React.FC = () => {
  return (
    <div style={{ padding: '24px' }}>
      <Card
        title="Quản lý khách hàng"
        extra={
          <Space>
            <Button icon={<UploadOutlined />}>
              Import khách hàng
            </Button>
            <Button type="primary" icon={<PlusOutlined />}>
              Thêm khách hàng
            </Button>
          </Space>
        }
      >
        <CustomerList />
      </Card>
    </div>
  );
};

export default CustomerListPage;
