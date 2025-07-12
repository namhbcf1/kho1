// Staff management page
import React from 'react';
import { Card, Button, Space, Tabs } from 'antd';
import { PlusOutlined, BarChartOutlined } from '@ant-design/icons';
import { 
  StaffManagement, 
  PerformanceTracker, 
  ShiftManagement,
  CommissionTracker,
  StaffReports 
} from '../../features/staff/components';

const { TabPane } = Tabs;

export const StaffPage: React.FC = () => {
  return (
    <div style={{ padding: '24px' }}>
      <Card
        title="Quản lý nhân viên"
        extra={
          <Space>
            <Button icon={<BarChartOutlined />}>
              Báo cáo hiệu suất
            </Button>
            <Button type="primary" icon={<PlusOutlined />}>
              Thêm nhân viên
            </Button>
          </Space>
        }
      >
        <Tabs defaultActiveKey="staff">
          <TabPane tab="Danh sách nhân viên" key="staff">
            <StaffManagement />
          </TabPane>
          <TabPane tab="Hiệu suất" key="performance">
            <PerformanceTracker />
          </TabPane>
          <TabPane tab="Lịch làm việc" key="schedule">
            <ShiftManagement />
          </TabPane>
          <TabPane tab="Hoa hồng" key="commission">
            <CommissionTracker />
          </TabPane>
          <TabPane tab="Báo cáo" key="reports">
            <StaffReports />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default StaffPage;
