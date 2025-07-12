// ZaloPay integration component
import React from 'react';
import { Button, Modal, QRCode } from 'antd';
import { BankOutlined } from '@ant-design/icons';

export const ZaloPayGateway: React.FC = () => {
  const [showModal, setShowModal] = React.useState(false);

  const handlePayment = () => {
    setShowModal(true);
    // ZaloPay payment logic
  };

  return (
    <>
      <Button
        type="primary"
        icon={<BankOutlined />}
        onClick={handlePayment}
        style={{ backgroundColor: '#0068ff' }}
      >
        Thanh toán ZaloPay
      </Button>

      <Modal
        title="Thanh toán ZaloPay"
        open={showModal}
        onCancel={() => setShowModal(false)}
        footer={null}
      >
        <div style={{ textAlign: 'center' }}>
          <QRCode value="zalopay://payment/123456" />
          <p style={{ marginTop: 16 }}>
            Quét mã QR để thanh toán qua ZaloPay
          </p>
        </div>
      </Modal>
    </>
  );
};

export default ZaloPayGateway;
