// Settings page
import React from 'react';
import { Card, Tabs } from 'antd';
import { 
  BusinessSettings, 
  TaxSettings, 
  PaymentSettings,
  ReceiptSettings,
  LanguageSettings,
  BackupSettings 
} from '../../features/settings/components';

const { TabPane } = Tabs;

export const SettingsPage: React.FC = () => {
  return (
    <div style={{ padding: '24px' }}>
      <Card title="Cài đặt hệ thống">
        <Tabs defaultActiveKey="business" tabPosition="left">
          <TabPane tab="Thông tin doanh nghiệp" key="business">
            <BusinessSettings />
          </TabPane>
          <TabPane tab="Cài đặt thuế" key="tax">
            <TaxSettings />
          </TabPane>
          <TabPane tab="Thanh toán" key="payment">
            <PaymentSettings />
          </TabPane>
          <TabPane tab="Hóa đơn" key="receipt">
            <ReceiptSettings />
          </TabPane>
          <TabPane tab="Ngôn ngữ" key="language">
            <LanguageSettings />
          </TabPane>
          <TabPane tab="Sao lưu" key="backup">
            <BackupSettings />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default SettingsPage;
