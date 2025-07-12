// Inventory management page
import React from 'react';
import { Card, Button, Space, Tabs, Alert } from 'antd';
import { PlusOutlined, WarningOutlined, ExportOutlined } from '@ant-design/icons';

const { TabPane } = Tabs;

export const InventoryPage: React.FC = () => {
  return (
    <div style={{ padding: '24px' }}>
      <Card
        title="Quản lý tồn kho"
        extra={
          <Space>
            <Button icon={<ExportOutlined />}>
              Xuất báo cáo
            </Button>
            <Button type="primary" icon={<PlusOutlined />}>
              Điều chỉnh tồn kho
            </Button>
          </Space>
        }
      >
        <Alert
          message="Cảnh báo tồn kho"
          description="Có 5 sản phẩm sắp hết hàng và 2 sản phẩm đã hết hàng"
          type="warning"
          icon={<WarningOutlined />}
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Tabs defaultActiveKey="overview">
          <TabPane tab="Tổng quan" key="overview">
            <div>Tổng quan tồn kho sẽ được hiển thị ở đây</div>
          </TabPane>
          <TabPane tab="Sản phẩm sắp hết" key="low-stock">
            <div>Danh sách sản phẩm sắp hết hàng</div>
          </TabPane>
          <TabPane tab="Hết hàng" key="out-of-stock">
            <div>Danh sách sản phẩm hết hàng</div>
          </TabPane>
          <TabPane tab="Lịch sử giao dịch" key="transactions">
            <div>Lịch sử giao dịch tồn kho</div>
          </TabPane>
          <TabPane tab="Báo cáo" key="reports">
            <div>Báo cáo tồn kho chi tiết</div>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default InventoryPage;
