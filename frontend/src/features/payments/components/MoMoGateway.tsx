// MoMo integration component
import React from 'react';
import { Button, Modal, QRCode } from 'antd';
import { MobileOutlined } from '@ant-design/icons';

export const MoMoGateway: React.FC = () => {
  const [showModal, setShowModal] = React.useState(false);

  const handlePayment = () => {
    setShowModal(true);
    // MoMo payment logic
  };

  return (
    <>
      <Button
        type="primary"
        icon={<MobileOutlined />}
        onClick={handlePayment}
        style={{ backgroundColor: '#d82d8b' }}
      >
        Thanh toán MoMo
      </Button>

      <Modal
        title="Thanh toán MoMo"
        open={showModal}
        onCancel={() => setShowModal(false)}
        footer={null}
      >
        <div style={{ textAlign: 'center' }}>
          <QRCode value="momo://payment/123456" />
          <p style={{ marginTop: 16 }}>
            Quét mã QR để thanh toán qua MoMo
          </p>
        </div>
      </Modal>
    </>
  );
};

export default MoMoGateway;
