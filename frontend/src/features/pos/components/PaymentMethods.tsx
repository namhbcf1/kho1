import React, { useState } from 'react';
import { Modal, Tabs, Card, Button, InputNumber, Space, Typography, Row, Col, message } from 'antd';
import { 
  CreditCardOutlined, 
  DollarOutlined, 
  MobileOutlined,
  QrcodeOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { formatVND } from '../../../utils/formatters/vndCurrency';
import { usePOSCart, usePOSActions } from '../../../stores';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

export const PaymentMethods: React.FC = () => {
  const { cart, total } = usePOSCart();
  const { processOrder, clearCart } = usePOSActions();
  
  const [visible, setVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('cash');
  const [cashReceived, setCashReceived] = useState(total);
  const [processing, setProcessing] = useState(false);

  const change = Math.max(0, cashReceived - total);

  const handlePayment = async () => {
    if (cart.length === 0) {
      message.error('Giỏ hàng trống!');
      return;
    }

    if (activeTab === 'cash' && cashReceived < total) {
      message.error('Số tiền nhận không đủ!');
      return;
    }

    setProcessing(true);
    
    try {
      await processOrder();
      message.success('Thanh toán thành công!');
      setVisible(false);
      setCashReceived(0);
      setActiveTab('cash');
    } catch (error) {
      console.error('Payment failed:', error);
      message.error('Thanh toán thất bại!');
    } finally {
      setProcessing(false);
    }
  };

  const handleOpenPayment = () => {
    if (cart.length === 0) {
      message.warning('Vui lòng thêm sản phẩm vào giỏ hàng!');
      return;
    }
    setCashReceived(total);
    setVisible(true);
  };

  const quickCashAmounts = [
    total,
    Math.ceil(total / 10000) * 10000,
    Math.ceil(total / 50000) * 50000,
    Math.ceil(total / 100000) * 100000,
  ].filter((amount, index, arr) => arr.indexOf(amount) === index && amount > total);

  return (
    <div className="p-4">
      <Button
        type="primary"
        size="large"
        block
        icon={<CheckCircleOutlined />}
        onClick={handleOpenPayment}
        disabled={cart.length === 0}
        className="mb-4"
      >
        Thanh toán {total > 0 && `(${formatVND(total)})`}
      </Button>

      <Modal
        title="Thanh toán"
        open={visible}
        onCancel={() => setVisible(false)}
        width={600}
        footer={null}
      >
        <div style={{ marginBottom: 16 }}>
          <Title level={4}>
            Tổng tiền: {formatVND(total)}
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
                <InputNumber
                  value={cashReceived}
                  onChange={(value) => setCashReceived(value || 0)}
                  style={{ width: '100%', marginTop: 8 }}
                  size="large"
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                  addonAfter="₫"
                />
              </div>

              {quickCashAmounts.length > 0 && (
                <div>
                  <Text>Số tiền nhanh:</Text>
                  <Row gutter={8} style={{ marginTop: 8 }}>
                    {quickCashAmounts.slice(0, 4).map(amount => (
                      <Col span={6} key={amount}>
                        <Button
                          block
                          onClick={() => setCashReceived(amount)}
                          type={cashReceived === amount ? 'primary' : 'default'}
                          size="small"
                        >
                          {formatVND(amount).replace('₫', '')}
                        </Button>
                      </Col>
                    ))}
                  </Row>
                </div>
              )}

              {cashReceived >= total && (
                <div style={{ 
                  padding: 16, 
                  background: change > 0 ? '#f6ffed' : '#e6f7ff',
                  borderRadius: 6,
                  border: `1px solid ${change > 0 ? '#b7eb8f' : '#91d5ff'}`
                }}>
                  <Text strong>
                    Tiền thừa: {formatVND(change)}
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
                Thanh toán {formatVND(total)}
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
    </div>
  );
};

export default PaymentMethods;
