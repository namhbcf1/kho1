// Order status tracking component
import React from 'react';
import { Steps, Card } from 'antd';

export const OrderTracking: React.FC = () => {
  return (
    <Card title="Theo dõi đơn hàng">
      <Steps
        current={2}
        items={[
          { title: 'Đặt hàng', description: '10:30 AM' },
          { title: 'Xác nhận', description: '10:32 AM' },
          { title: 'Chuẩn bị', description: '10:35 AM' },
          { title: 'Hoàn thành', description: 'Đang xử lý' },
        ]}
      />
    </Card>
  );
};

export default OrderTracking;
