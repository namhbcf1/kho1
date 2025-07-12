import React from 'react';
import { Divider, Typography } from 'antd';
import { VNDDisplay } from '../VNDCurrency';
import type { ReceiptTemplateProps } from './ReceiptPrinter.types';

const { Text, Title } = Typography;

export const ReceiptTemplate: React.FC<ReceiptTemplateProps> = ({
  order,
  businessInfo,
  showLogo = true,
}) => {
  const currentDate = new Date().toLocaleString('vi-VN');

  return (
    <div style={{ 
      width: '80mm', 
      fontFamily: 'monospace', 
      fontSize: '12px',
      padding: '8px',
      backgroundColor: 'white'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        {showLogo && businessInfo.logo && (
          <img 
            src={businessInfo.logo} 
            alt="Logo" 
            style={{ maxWidth: '60px', marginBottom: '8px' }}
          />
        )}
        <Title level={4} style={{ margin: 0 }}>
          {businessInfo.name}
        </Title>
        <Text>{businessInfo.address}</Text><br />
        <Text>ĐT: {businessInfo.phone}</Text><br />
        {businessInfo.taxCode && (
          <>
            <Text>MST: {businessInfo.taxCode}</Text><br />
          </>
        )}
      </div>

      <Divider style={{ margin: '8px 0' }} />

      {/* Order Info */}
      <div style={{ marginBottom: '16px' }}>
        <Text strong>HÓA ĐỚN BÁN HÀNG</Text><br />
        <Text>Số HĐ: {order.id}</Text><br />
        <Text>Ngày: {currentDate}</Text><br />
        <Text>Thu ngân: {order.cashier}</Text><br />
        {order.customer && (
          <Text>Khách hàng: {order.customer}</Text>
        )}
      </div>

      <Divider style={{ margin: '8px 0' }} />

      {/* Items */}
      <div style={{ marginBottom: '16px' }}>
        {order.items.map((item, index) => (
          <div key={index} style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text>{item.name}</Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text>{item.quantity} x <VNDDisplay amount={item.price} /></Text>
              <Text><VNDDisplay amount={item.quantity * item.price} /></Text>
            </div>
          </div>
        ))}
      </div>

      <Divider style={{ margin: '8px 0' }} />

      {/* Totals */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Text>Tạm tính:</Text>
          <Text><VNDDisplay amount={order.subtotal} /></Text>
        </div>
        {order.discount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text>Giảm giá:</Text>
            <Text>-<VNDDisplay amount={order.discount} /></Text>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Text>Thuế VAT:</Text>
          <Text><VNDDisplay amount={order.tax} /></Text>
        </div>
        <Divider style={{ margin: '4px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Text strong>TỔNG CỘNG:</Text>
          <Text strong><VNDDisplay amount={order.total} /></Text>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Text>Tiền khách đưa:</Text>
          <Text><VNDDisplay amount={order.paid} /></Text>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Text>Tiền thừa:</Text>
          <Text><VNDDisplay amount={order.change} /></Text>
        </div>
      </div>

      <Divider style={{ margin: '8px 0' }} />

      {/* Footer */}
      <div style={{ textAlign: 'center', fontSize: '10px' }}>
        <Text>Cảm ơn quý khách!</Text><br />
        <Text>Hẹn gặp lại!</Text><br />
        {businessInfo.website && (
          <Text>{businessInfo.website}</Text>
        )}
      </div>
    </div>
  );
};

export default ReceiptTemplate;
