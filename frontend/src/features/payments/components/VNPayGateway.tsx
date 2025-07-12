// VNPay integration component
import React from 'react';
import { Button, Modal, QRCode } from 'antd';
import { CreditCardOutlined } from '@ant-design/icons';

export const VNPayGateway: React.FC = () => {
  const [showModal, setShowModal] = React.useState(false);

  const handlePayment = () => {
    setShowModal(true);
    // VNPay payment logic
  };

  return (
    <>
      <Button
        type="primary"
        icon={<CreditCardOutlined />}
        onClick={handlePayment}
        style={{ backgroundColor: '#d32f2f' }}
      >
        Thanh toán VNPay
      </Button>

      <Modal
        title="Thanh toán VNPay"
        open={showModal}
        onCancel={() => setShowModal(false)}
        footer={null}
      >
        <div style={{ textAlign: 'center' }}>
          <QRCode value="vnpay://payment/123456" />
          <p style={{ marginTop: 16 }}>
            Quét mã QR để thanh toán qua VNPay
          </p>
        </div>
      </Modal>
    </>
  );
};

export default VNPayGateway;
