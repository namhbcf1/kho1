import React from 'react';
import { Button, message } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import { ReceiptTemplate } from './ReceiptTemplate';
import type { ReceiptPrinterProps } from './ReceiptPrinter.types';

export const ReceiptPrinter: React.FC<ReceiptPrinterProps> = ({
  order,
  businessInfo,
  onPrint,
  disabled = false,
}) => {
  const handlePrint = async () => {
    try {
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        message.error('Không thể mở cửa sổ in. Vui lòng kiểm tra popup blocker.');
        return;
      }

      // Generate receipt HTML
      const receiptElement = document.createElement('div');
      
      // Add print styles
      const printStyles = `
        <style>
          @media print {
            body { margin: 0; padding: 0; }
            * { -webkit-print-color-adjust: exact; }
          }
          @page { 
            size: 80mm auto; 
            margin: 0; 
          }
        </style>
      `;

      printWindow.document.write(`
        <html>
          <head>
            <title>Hóa đơn - ${order.id}</title>
            ${printStyles}
          </head>
          <body>
            <div id="receipt-content"></div>
          </body>
        </html>
      `);

      // Wait for the document to be ready
      printWindow.document.close();
      
      // Trigger print
      printWindow.focus();
      printWindow.print();
      
      // Close the print window after printing
      setTimeout(() => {
        printWindow.close();
      }, 1000);

      onPrint?.();
      message.success('Đã gửi lệnh in hóa đơn');
    } catch (error) {
      console.error('Print error:', error);
      message.error('Có lỗi xảy ra khi in hóa đơn');
    }
  };

  return (
    <Button
      type="primary"
      icon={<PrinterOutlined />}
      onClick={handlePrint}
      disabled={disabled}
    >
      In hóa đơn
    </Button>
  );
};

export default ReceiptPrinter;
