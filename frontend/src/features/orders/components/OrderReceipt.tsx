// Vietnamese receipt template component
import React from 'react';
import { Card, Divider } from 'antd';
import { formatVND } from '../../../utils/formatters/vndCurrency';

export const OrderReceipt: React.FC = () => {
  return (
    <Card style={{ maxWidth: 300, margin: '0 auto' }}>
      <div style={{ textAlign: 'center' }}>
        <h3>KHOAUGMENT POS</h3>
        <p>123 Đường ABC, Quận 1, TP.HCM</p>
        <p>ĐT: 0901234567</p>
      </div>
      <Divider />
      <div>
        <p>Mã HĐ: DH001</p>
        <p>Ngày: 15/01/2024 10:30</p>
        <p>Thu ngân: Admin</p>
      </div>
      <Divider />
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Cà phê đen x2</span>
          <span>{formatVND(50000)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Bánh croissant x1</span>
          <span>{formatVND(35000)}</span>
        </div>
      </div>
      <Divider />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
        <span>TỔNG CỘNG:</span>
        <span>{formatVND(85000)}</span>
      </div>
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <p>Cảm ơn quý khách!</p>
      </div>
    </Card>
  );
};

export default OrderReceipt;
