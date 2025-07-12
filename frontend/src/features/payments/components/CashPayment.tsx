// Cash payment processing component
import React from 'react';
import { Card, InputNumber, Button, Statistic } from 'antd';
import { DollarOutlined } from '@ant-design/icons';
import { formatVND } from '../../../utils/formatters/vndCurrency';

export const CashPayment: React.FC = () => {
  const [cashReceived, setCashReceived] = React.useState<number>(0);
  const total = 150000;
  const change = cashReceived > total ? cashReceived - total : 0;

  return (
    <Card title="Thanh toán tiền mặt" icon={<DollarOutlined />}>
      <div style={{ marginBottom: 16 }}>
        <Statistic
          title="Tổng tiền"
          value={total}
          formatter={formatVND}
          valueStyle={{ color: '#1890ff' }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label>Tiền khách đưa:</label>
        <InputNumber
          style={{ width: '100%', marginTop: 8 }}
          value={cashReceived}
          onChange={(value) => setCashReceived(value || 0)}
          formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
          size="large"
        />
      </div>

      {change > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Statistic
            title="Tiền thừa"
            value={change}
            formatter={formatVND}
            valueStyle={{ color: '#52c41a' }}
          />
        </div>
      )}

      <Button
        type="primary"
        size="large"
        block
        disabled={cashReceived < total}
      >
        Hoàn tất thanh toán
      </Button>
    </Card>
  );
};

export default CashPayment;
