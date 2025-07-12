// Order list page
import React from 'react';
import { Card, Button, Space, Tabs } from 'antd';
import { PlusOutlined, ExportOutlined } from '@ant-design/icons';
import { OrderList } from '../../features/orders/components';

const { TabPane } = Tabs;

export const OrderListPage: React.FC = () => {
  return (
    <div style={{ padding: '24px' }}>
      <Card
        title="Quản lý đơn hàng"
        extra={
          <Space>
            <Button icon={<ExportOutlined />}>
              Xuất báo cáo
            </Button>
            <Button type="primary" icon={<PlusOutlined />}>
              Tạo đơn hàng
            </Button>
          </Space>
        }
      >
        <Tabs defaultActiveKey="all">
          <TabPane tab="Tất cả" key="all">
            <OrderList />
          </TabPane>
          <TabPane tab="Chờ xử lý" key="pending">
            <OrderList status="pending" />
          </TabPane>
          <TabPane tab="Đang xử lý" key="processing">
            <OrderList status="processing" />
          </TabPane>
          <TabPane tab="Hoàn thành" key="completed">
            <OrderList status="completed" />
          </TabPane>
          <TabPane tab="Đã hủy" key="cancelled">
            <OrderList status="cancelled" />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default OrderListPage;
