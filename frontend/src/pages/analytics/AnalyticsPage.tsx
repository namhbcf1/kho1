// Analytics dashboard page
import React from 'react';
import { Card, Row, Col, Tabs } from 'antd';
import { 
  DashboardKPIs, 
  SalesAnalytics, 
  RevenueReports, 
  CustomerAnalytics,
  InventoryReports 
} from '../../features/analytics/components';

const { TabPane } = Tabs;

export const AnalyticsPage: React.FC = () => {
  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="Tổng quan kinh doanh">
            <DashboardKPIs />
          </Card>
        </Col>
        
        <Col span={24}>
          <Card>
            <Tabs defaultActiveKey="sales">
              <TabPane tab="Phân tích bán hàng" key="sales">
                <SalesAnalytics />
              </TabPane>
              <TabPane tab="Báo cáo doanh thu" key="revenue">
                <RevenueReports />
              </TabPane>
              <TabPane tab="Phân tích khách hàng" key="customers">
                <CustomerAnalytics />
              </TabPane>
              <TabPane tab="Báo cáo tồn kho" key="inventory">
                <InventoryReports />
              </TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AnalyticsPage;
