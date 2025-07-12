import React, { useState } from 'react';
import { Modal, Tabs, Card, Button, InputNumber, Space, Typography, Row, Col } from 'antd';
import { 
  CreditCardOutlined, 
  DollarOutlined, 
  MobileOutlined,
  QrcodeOutlined 
} from '@ant-design/icons';
import { VNDDisplay, VNDInput } from '../../../components/business/VNDCurrency';
import type { PaymentMethodsProps } from '../types/pos.types';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

export const PaymentMethods: React.FC<PaymentMethodsProps> = ({
  visible,
  cart,
  total,
  onPaymentComplete,
  onCancel,
}) => {
  const [activeTab, setActiveTab] = useState('cash');
  const [cashReceived, setCashReceived] = useState(total);
  const [processing, setProcessing] = useState(false);

  const change = cashReceived - total;

  const handlePayment = async () => {
    setProcessing(true);
    
    try {
      const paymentData = {
        method: activeTab,
        total,
        cashReceived: activeTab === 'cash' ? cashReceived : total,
        change: activeTab === 'cash' ? change : 0,
        items: cart,
      };

      await onPaymentComplete?.(paymentData);
    } catch (error) {
      console.error('Payment failed:', error);
    } finally {
      setProcessing(false);
    }
  };

  const quickCashAmounts = [
    total,
    Math.ceil(total / 10000) * 10000,
    Math.ceil(total / 50000) * 50000,
    Math.ceil(total / 100000) * 100000,
  ].filter((amount, index, arr) => arr.indexOf(amount) === index);

  return (
    <Modal
      title="Thanh toán"
      open={visible}
      onCancel={onCancel}
      width={600}
      footer={null}
    >
      <div style={{ marginBottom: 16 }}>
        <Title level={4}>
          Tổng tiền: <VNDDisplay amount={total} />
        </Title>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        {/* Cash Payment */}
        <TabPane 
          tab={
            <Space>
              <DollarOutlined />
              Tiền mặt
            </Space>
          } 
          key="cash"
        >
          <Card>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text>Tiền khách đưa:</Text>
                <VNDInput
                  value={cashReceived}
                  onChange={setCashReceived}
                  style={{ width: '100%', marginTop: 8 }}
                  size="large"
                />
              </div>

              <div>
                <Text>Số tiền nhanh:</Text>
                <Row gutter={8} style={{ marginTop: 8 }}>
                  {quickCashAmounts.map(amount => (
                    <Col span={6} key={amount}>
                      <Button
                        block
                        onClick={() => setCashReceived(amount)}
                        type={cashReceived === amount ? 'primary' : 'default'}
                      >
                        <VNDDisplay amount={amount} showSymbol={false} />
                      </Button>
                    </Col>
                  ))}
                </Row>
              </div>

              {change >= 0 && (
                <div style={{ 
                  padding: 16, 
                  background: change > 0 ? '#f6ffed' : '#e6f7ff',
                  borderRadius: 6,
                  border: `1px solid ${change > 0 ? '#b7eb8f' : '#91d5ff'}`
                }}>
                  <Text strong>
                    Tiền thừa: <VNDDisplay amount={change} />
                  </Text>
                </div>
              )}

              <Button
                type="primary"
                size="large"
                block
                disabled={cashReceived < total}
                loading={processing}
                onClick={handlePayment}
              >
                Hoàn tất thanh toán
              </Button>
            </Space>
          </Card>
        </TabPane>

        {/* Card Payment */}
        <TabPane 
          tab={
            <Space>
              <CreditCardOutlined />
              Thẻ
            </Space>
          } 
          key="card"
        >
          <Card>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text>Thanh toán bằng thẻ tín dụng/ghi nợ</Text>
              <Button
                type="primary"
                size="large"
                block
                loading={processing}
                onClick={handlePayment}
              >
                Thanh toán <VNDDisplay amount={total} />
              </Button>
            </Space>
          </Card>
        </TabPane>

        {/* VNPay */}
        <TabPane 
          tab={
            <Space>
              <QrcodeOutlined />
              VNPay
            </Space>
          } 
          key="vnpay"
        >
          <Card>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text>Thanh toán qua VNPay QR Code</Text>
              <Button
                type="primary"
                size="large"
                block
                loading={processing}
                onClick={handlePayment}
              >
                Tạo mã QR VNPay
              </Button>
            </Space>
          </Card>
        </TabPane>

        {/* MoMo */}
        <TabPane 
          tab={
            <Space>
              <MobileOutlined />
              MoMo
            </Space>
          } 
          key="momo"
        >
          <Card>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text>Thanh toán qua ví MoMo</Text>
              <Button
                type="primary"
                size="large"
                block
                loading={processing}
                onClick={handlePayment}
              >
                Thanh toán MoMo
              </Button>
            </Space>
          </Card>
        </TabPane>

        {/* ZaloPay */}
        <TabPane 
          tab={
            <Space>
              <QrcodeOutlined />
              ZaloPay
            </Space>
          } 
          key="zalopay"
        >
          <Card>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text>Thanh toán qua ZaloPay</Text>
              <Button
                type="primary"
                size="large"
                block
                loading={processing}
                onClick={handlePayment}
              >
                Thanh toán ZaloPay
              </Button>
            </Space>
          </Card>
        </TabPane>
      </Tabs>
    </Modal>
  );
};

export default PaymentMethods;
