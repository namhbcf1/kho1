// Enhanced Vietnamese receipt template with business compliance
import React from 'react';
import { Divider, Typography, QRCode } from 'antd';
import { formatVND } from '../../../utils/formatters/vndCurrency';
import type { ReceiptTemplateProps } from './ReceiptPrinter.types';

const { Text, Title } = Typography;

export const ReceiptTemplate: React.FC<ReceiptTemplateProps> = ({
  order,
  businessInfo,
  format = 'standard',
  settings,
  showLogo = true,
}) => {
  const currentDate = new Date().toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const paperWidth = settings?.paperWidth || 80;
  const fontSize = settings?.fontSize === 'small' ? '10px' : settings?.fontSize === 'large' ? '14px' : '12px';

  // Calculate Vietnamese VAT breakdown
  const vatBreakdown = order.items.reduce((acc, item) => {
    const vatRate = item.vatRate || 10;
    const itemTotal = item.quantity * item.price;
    const vatAmount = (itemTotal * vatRate) / (100 + vatRate);
    
    if (!acc[vatRate]) {
      acc[vatRate] = { amount: 0, vat: 0 };
    }
    acc[vatRate].amount += itemTotal - vatAmount;
    acc[vatRate].vat += vatAmount;
    
    return acc;
  }, {} as Record<number, { amount: number; vat: number }>);

  const renderHeader = () => (
    <div style={{ textAlign: 'center', marginBottom: '16px' }}>
      {showLogo && businessInfo.logo && (
        <img 
          src={businessInfo.logo} 
          alt="Logo" 
          style={{ maxWidth: '60px', marginBottom: '8px' }}
        />
      )}
      
      <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
        {businessInfo.name}
      </div>
      
      <div style={{ fontSize: fontSize, lineHeight: '1.4' }}>
        <div>{businessInfo.address}</div>
        <div>ĐT: {businessInfo.phone}</div>
        {businessInfo.email && <div>Email: {businessInfo.email}</div>}
        {businessInfo.website && <div>Web: {businessInfo.website}</div>}
        {businessInfo.taxCode && <div><strong>MST: {businessInfo.taxCode}</strong></div>}
        {businessInfo.businessLicense && <div>GPKD: {businessInfo.businessLicense}</div>}
      </div>
    </div>
  );

  const renderOrderInfo = () => (
    <div style={{ marginBottom: '16px', fontSize: fontSize }}>
      <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
        {format === 'gift' ? 'PHIẾU QUÀ TẶNG' : 'HÓA ĐƠN BÁN HÀNG'}
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Số HĐ:</span>
        <span><strong>{order.id}</strong></span>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Ngày:</span>
        <span>{currentDate}</span>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Thu ngân:</span>
        <span>{order.cashier}</span>
      </div>
      
      {order.customer && (
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Khách hàng:</span>
          <span>{order.customer}</span>
        </div>
      )}
      
      {order.loyaltyCard && (
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Thẻ thành viên:</span>
          <span>{order.loyaltyCard}</span>
        </div>
      )}
      
      {order.invoiceNumber && (
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Số hóa đơn GTGT:</span>
          <span>{order.invoiceNumber}</span>
        </div>
      )}
    </div>
  );

  const renderItems = () => (
    <div style={{ marginBottom: '16px' }}>
      {format === 'detailed' ? renderDetailedItems() : renderStandardItems()}
    </div>
  );

  const renderStandardItems = () => (
    <div>
      {order.items.map((item, index) => (
        <div key={index} style={{ marginBottom: '12px', fontSize: fontSize }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
            <span style={{ flex: 1 }}>{index + 1}. {item.name}</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
            <span>
              {item.quantity} {item.unit || 'cái'} × {formatVND(item.price)}
              {item.vatRate !== undefined && ` (VAT ${item.vatRate}%)`}
            </span>
            <span style={{ fontWeight: 'bold' }}>
              {formatVND(item.quantity * item.price)}
            </span>
          </div>
          
          {item.discount && item.discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ff4d4f' }}>
              <span>Giảm giá:</span>
              <span>-{formatVND(item.discount)}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderDetailedItems = () => (
    <div>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'auto 1fr auto auto', 
        gap: '4px',
        fontSize: fontSize,
        borderBottom: '1px solid #ccc',
        paddingBottom: '4px',
        marginBottom: '8px',
        fontWeight: 'bold'
      }}>
        <span>STT</span>
        <span>Tên hàng</span>
        <span>SL</span>
        <span>Thành tiền</span>
      </div>
      
      {order.items.map((item, index) => (
        <div key={index} style={{ marginBottom: '8px' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'auto 1fr auto auto', 
            gap: '4px',
            fontSize: fontSize
          }}>
            <span>{index + 1}</span>
            <span>{item.name}</span>
            <span>{item.quantity}</span>
            <span>{formatVND(item.quantity * item.price)}</span>
          </div>
          
          <div style={{ 
            gridColumn: '2 / 5', 
            fontSize: '10px', 
            color: '#666',
            marginLeft: '16px'
          }}>
            {item.unit || 'cái'} × {formatVND(item.price)}
            {item.vatRate !== undefined && ` | VAT ${item.vatRate}%`}
            {item.barcode && ` | ${item.barcode}`}
          </div>
          
          {item.discount && item.discount > 0 && (
            <div style={{ 
              gridColumn: '2 / 5', 
              fontSize: '10px', 
              color: '#ff4d4f',
              marginLeft: '16px'
            }}>
              Giảm giá: -{formatVND(item.discount)}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderTotals = () => (
    <div style={{ marginBottom: '16px', fontSize: fontSize }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Tạm tính:</span>
        <span>{formatVND(order.subtotal)}</span>
      </div>
      
      {order.discount > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ff4d4f' }}>
          <span>Giảm giá:</span>
          <span>-{formatVND(order.discount)}</span>
        </div>
      )}
      
      {order.loyaltyDiscount && order.loyaltyDiscount > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ff4d4f' }}>
          <span>Ưu đãi thành viên:</span>
          <span>-{formatVND(order.loyaltyDiscount)}</span>
        </div>
      )}
      
      {format === 'detailed' && renderVATBreakdown()}
      
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Thuế VAT:</span>
        <span>{formatVND(order.vatAmount)}</span>
      </div>
      
      <Divider style={{ margin: '8px 0' }} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold' }}>
        <span>TỔNG CỘNG:</span>
        <span>{formatVND(order.total)}</span>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Thanh toán ({order.paymentMethod}):</span>
        <span>{formatVND(order.paid)}</span>
      </div>
      
      {order.change > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Tiền thừa:</span>
          <span>{formatVND(order.change)}</span>
        </div>
      )}
    </div>
  );

  const renderVATBreakdown = () => (
    <div style={{ marginTop: '8px', marginBottom: '8px', padding: '8px', backgroundColor: '#f5f5f5' }}>
      <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>
        Chi tiết thuế VAT:
      </div>
      {Object.entries(vatBreakdown).map(([rate, data]) => (
        <div key={rate} style={{ fontSize: '10px', display: 'flex', justifyContent: 'space-between' }}>
          <span>VAT {rate}%: {formatVND(data.amount)}</span>
          <span>{formatVND(data.vat)}</span>
        </div>
      ))}
    </div>
  );

  const renderLoyaltyInfo = () => {
    if (!order.loyaltyPointsEarned && !order.totalLoyaltyPoints) return null;
    
    return (
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '16px', 
        padding: '8px',
        backgroundColor: '#f0f8ff',
        borderRadius: '4px',
        fontSize: fontSize
      }}>
        {order.loyaltyPointsEarned && order.loyaltyPointsEarned > 0 && (
          <div style={{ color: '#1890ff', fontWeight: 'bold' }}>
            🎉 Bạn vừa tích được {order.loyaltyPointsEarned} điểm!
          </div>
        )}
        {order.totalLoyaltyPoints && (
          <div style={{ color: '#666', fontSize: '11px' }}>
            Tổng điểm tích lũy: {order.totalLoyaltyPoints} điểm
          </div>
        )}
      </div>
    );
  };

  const renderQRCode = () => {
    if (!settings?.printQR || !order.digitalReceiptUrl) return null;
    
    return (
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <QRCode 
          value={order.digitalReceiptUrl} 
          size={80}
          style={{ marginBottom: '4px' }}
        />
        <div style={{ fontSize: '10px', color: '#666' }}>
          Quét mã QR để xem hóa đơn điện tử
        </div>
      </div>
    );
  };

  const renderFooter = () => (
    <div style={{ textAlign: 'center', fontSize: '11px', lineHeight: '1.4' }}>
      {format !== 'gift' && (
        <>
          <div style={{ marginBottom: '8px' }}>
            <strong>Cảm ơn quý khách đã mua hàng!</strong>
          </div>
          <div style={{ marginBottom: '8px' }}>
            Hẹn gặp lại! 😊
          </div>
        </>
      )}
      
      {format === 'gift' && (
        <>
          <div style={{ marginBottom: '8px', color: '#ff4d4f' }}>
            🎁 PHIẾU QUÀ TẶNG 🎁
          </div>
          <div style={{ marginBottom: '8px' }}>
            Chúc mừng và cảm ơn quý khách!
          </div>
        </>
      )}
      
      {businessInfo.returnPolicy && (
        <div style={{ marginBottom: '8px', fontSize: '10px', color: '#666' }}>
          {businessInfo.returnPolicy}
        </div>
      )}
      
      {businessInfo.workingHours && (
        <div style={{ marginBottom: '8px', fontSize: '10px', color: '#666' }}>
          Giờ làm việc: {businessInfo.workingHours}
        </div>
      )}
      
      <div style={{ fontSize: '10px', color: '#999' }}>
        Hóa đơn được in lúc {currentDate}
      </div>
      
      {format !== 'compact' && (
        <div style={{ marginTop: '8px', fontSize: '9px', color: '#ccc' }}>
          Powered by POS System Vietnam
        </div>
      )}
    </div>
  );

  return (
    <div style={{ 
      width: `${paperWidth}mm`, 
      fontFamily: "'Courier New', monospace", 
      fontSize: fontSize,
      padding: '8px',
      backgroundColor: 'white',
      color: 'black',
      lineHeight: '1.3'
    }}>
      {renderHeader()}
      
      <Divider style={{ margin: '8px 0', borderColor: '#000' }} />
      
      {renderOrderInfo()}
      
      <Divider style={{ margin: '8px 0', borderColor: '#000' }} />
      
      {renderItems()}
      
      <Divider style={{ margin: '8px 0', borderColor: '#000' }} />
      
      {renderTotals()}
      
      {format !== 'compact' && (
        <>
          <Divider style={{ margin: '8px 0', borderColor: '#000' }} />
          
          {renderLoyaltyInfo()}
          
          {renderQRCode()}
          
          {renderFooter()}
        </>
      )}
    </div>
  );
};

export default ReceiptTemplate;