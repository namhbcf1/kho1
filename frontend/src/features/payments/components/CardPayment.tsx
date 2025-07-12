// Card payment interface component
import React from 'react';
import { Card, Button, Steps } from 'antd';
import { CreditCardOutlined } from '@ant-design/icons';

export const CardPayment: React.FC = () => {
  const [currentStep, setCurrentStep] = React.useState(0);

  const steps = [
    { title: 'Chuẩ bị thẻ', description: 'Khách hàng chuẩn bị thẻ' },
    { title: 'Quẹt thẻ', description: 'Quẹt thẻ qua máy POS' },
    { title: 'Nhập PIN', description: 'Khách hàng nhập mã PIN' },
    { title: 'Hoàn tất', description: 'Giao dịch thành công' },
  ];

  return (
    <Card title="Thanh toán thẻ" icon={<CreditCardOutlined />}>
      <Steps
        current={currentStep}
        direction="vertical"
        items={steps}
      />
      
      <div style={{ marginTop: 24 }}>
        <Button
          type="primary"
          onClick={() => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1))}
          disabled={currentStep === steps.length - 1}
        >
          Bước tiếp theo
        </Button>
      </div>
    </Card>
  );
};

export default CardPayment;
