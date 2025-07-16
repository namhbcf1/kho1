import { SyncOutlined } from '@ant-design/icons';
import { Alert, Typography } from 'antd';
import React from 'react';
import RealTimeDashboard from './RealTimeDashboard';

const { Title, Text } = Typography;

const RealTimePage: React.FC = () => {
  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px' }}>
        <Title level={2}>
          <SyncOutlined spin style={{ marginRight: '8px' }} />
          Theo dõi thời gian thực
        </Title>
        <Text type="secondary">
          Dữ liệu được cập nhật tự động mỗi 30 giây. Kết nối trực tiếp với hệ thống POS.
        </Text>
      </div>
      
      <Alert
        message="Kết nối thời gian thực"
        description="Hệ thống đang theo dõi hoạt động kinh doanh theo thời gian thực. Dữ liệu được đồng bộ từ tất cả các thiết bị POS và cập nhật liên tục."
        type="info"
        showIcon
        style={{ marginBottom: '16px' }}
      />
      
      <RealTimeDashboard 
        refreshInterval={30000}
        enableWebSocket={true}
        channels={['dashboard', 'inventory', 'orders', 'alerts']}
      />
    </div>
  );
};

export default RealTimePage; 