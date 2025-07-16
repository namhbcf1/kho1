import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
  vatRate?: number;
}

interface VietnameseReceiptProps {
  receiptNumber: string;
  businessInfo: {
    name: string;
    address: string;
    taxCode: string;
    phone: string;
  };
  items: ReceiptItem[];
  subtotal: number;
  vatAmount: number;
  total: number;
  paymentMethod: string;
  cashier: string;
  timestamp: Date;
}

export const VietnameseReceipt: React.FC<VietnameseReceiptProps> = ({
  receiptNumber,
  businessInfo,
  items,
  subtotal,
  vatAmount,
  total,
  paymentMethod,
  cashier,
  timestamp
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const qrData = JSON.stringify({
    receiptNumber,
    total,
    timestamp: timestamp.toISOString(),
    taxCode: businessInfo.taxCode
  });

  return (
    <div className="receipt-container" style={{ 
      width: '80mm', 
      padding: '5mm', 
      fontSize: '12px',
      fontFamily: 'monospace',
      lineHeight: '1.2'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <h2 style={{ margin: '0', fontSize: '16px' }}>{businessInfo.name}</h2>
        <p style={{ margin: '2px 0' }}>{businessInfo.address}</p>
        <p style={{ margin: '2px 0' }}>ĐT: {businessInfo.phone}</p>
        <p style={{ margin: '2px 0' }}>MST: {businessInfo.taxCode}</p>
      </div>

      {/* Receipt Title */}
      <div style={{ textAlign: 'center', margin: '10px 0' }}>
        <h3 style={{ margin: '0', fontSize: '14px' }}>HÓA ĐƠN BÁN LẺ</h3>
        <p style={{ margin: '2px 0' }}>Số: {receiptNumber}</p>
        <p style={{ margin: '2px 0' }}>Ngày: {timestamp.toLocaleDateString('vi-VN')}</p>
        <p style={{ margin: '2px 0' }}>Giờ: {timestamp.toLocaleTimeString('vi-VN')}</p>
      </div>

      {/* Items */}
      <div style={{ borderTop: '1px dashed #000', paddingTop: '5px' }}>
        {items.map((item, index) => (
          <div key={index} style={{ marginBottom: '5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{item.name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
              <span>{item.quantity} x {formatCurrency(item.price)}</span>
              <span>{formatCurrency(item.total)}</span>
            </div>
            {item.vatRate && (
              <div style={{ fontSize: '10px', color: '#666' }}>
                VAT {item.vatRate}%
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Totals */}
      <div style={{ borderTop: '1px dashed #000', paddingTop: '5px', marginTop: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Tạm tính:</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        {vatAmount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Thuế VAT:</span>
            <span>{formatCurrency(vatAmount)}</span>
          </div>
        )}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          fontWeight: 'bold',
          fontSize: '14px',
          borderTop: '1px solid #000',
          paddingTop: '2px',
          marginTop: '2px'
        }}>
          <span>TỔNG CỘNG:</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Payment Info */}
      <div style={{ marginTop: '10px' }}>
        <p style={{ margin: '2px 0' }}>Thanh toán: {paymentMethod}</p>
        <p style={{ margin: '2px 0' }}>Thu ngân: {cashier}</p>
      </div>

      {/* QR Code */}
      <div style={{ textAlign: 'center', marginTop: '10px' }}>
        <QRCodeSVG value={qrData} size={80} />
        <p style={{ margin: '5px 0 0 0', fontSize: '10px' }}>
          Quét mã QR để xem chi tiết
        </p>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '10px' }}>
        <p style={{ margin: '2px 0' }}>Cảm ơn quý khách!</p>
        <p style={{ margin: '2px 0' }}>Hẹn gặp lại!</p>
        <p style={{ margin: '5px 0 0 0' }}>
          Hóa đơn được lưu trữ 5 năm theo quy định pháp luật
        </p>
      </div>
    </div>
  );
};

// Thermal printer service
export class ThermalPrinterService {
  private port: SerialPort | null = null;

  async connect(): Promise<boolean> {
    try {
      if ('serial' in navigator) {
        this.port = await (navigator as any).serial.requestPort();
        await this.port.open({ baudRate: 9600 });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to connect to thermal printer:', error);
      return false;
    }
  }

  async printReceipt(receiptData: VietnameseReceiptProps): Promise<boolean> {
    if (!this.port) {
      throw new Error('Printer not connected');
    }

    try {
      const commands = this.generatePrintCommands(receiptData);
      const writer = this.port.writable?.getWriter();
      
      if (writer) {
        await writer.write(new TextEncoder().encode(commands));
        writer.releaseLock();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to print receipt:', error);
      return false;
    }
  }

  private generatePrintCommands(data: VietnameseReceiptProps): string {
    let commands = '';
    
    // ESC/POS commands for thermal printer
    commands += '\x1B\x40'; // Initialize
    commands += '\x1B\x61\x01'; // Center align
    
    // Business info
    commands += `${data.businessInfo.name}\n`;
    commands += `${data.businessInfo.address}\n`;
    commands += `ĐT: ${data.businessInfo.phone}\n`;
    commands += `MST: ${data.businessInfo.taxCode}\n\n`;
    
    // Receipt title
    commands += 'HÓA ĐƠN BÁN LẺ\n';
    commands += `Số: ${data.receiptNumber}\n`;
    commands += `Ngày: ${data.timestamp.toLocaleDateString('vi-VN')}\n\n`;
    
    // Items
    commands += '\x1B\x61\x00'; // Left align
    data.items.forEach(item => {
      commands += `${item.name}\n`;
      commands += `${item.quantity} x ${this.formatCurrency(item.price)} = ${this.formatCurrency(item.total)}\n`;
    });
    
    // Totals
    commands += '\n';
    commands += `Tạm tính: ${this.formatCurrency(data.subtotal)}\n`;
    if (data.vatAmount > 0) {
      commands += `Thuế VAT: ${this.formatCurrency(data.vatAmount)}\n`;
    }
    commands += `TỔNG CỘNG: ${this.formatCurrency(data.total)}\n\n`;
    
    // Payment info
    commands += `Thanh toán: ${data.paymentMethod}\n`;
    commands += `Thu ngân: ${data.cashier}\n\n`;
    
    // Footer
    commands += '\x1B\x61\x01'; // Center align
    commands += 'Cảm ơn quý khách!\n';
    commands += 'Hẹn gặp lại!\n\n';
    
    // Cut paper
    commands += '\x1B\x69';
    
    return commands;
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

  async disconnect(): Promise<void> {
    if (this.port) {
      await this.port.close();
      this.port = null;
    }
  }
}

export default VietnameseReceipt;