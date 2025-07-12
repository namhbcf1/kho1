// Product list page
import React from 'react';
import { Card, Button, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { ProductList } from '../../features/products/components';

export const ProductListPage: React.FC = () => {
  return (
    <div style={{ padding: '24px' }}>
      <Card
        title="Quản lý sản phẩm"
        extra={
          <Space>
            <Button type="primary" icon={<PlusOutlined />}>
              Thêm sản phẩm
            </Button>
          </Space>
        }
      >
        <ProductList />
      </Card>
    </div>
  );
};

export default ProductListPage;
