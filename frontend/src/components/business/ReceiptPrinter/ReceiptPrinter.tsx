// Production-ready Vietnamese receipt printer with thermal printer support
import React, { useState } from 'react';
import { Button, Modal, Select, Switch, message, Typography, Space, Row, Col, Card } from 'antd';
import { 
  PrinterOutlined, 
  SettingOutlined, 
  EyeOutlined
} from '@ant-design/icons';
import { ReceiptTemplate } from './ReceiptTemplate';
import type { ReceiptPrinterProps, PrinterSettings, PrintFormat } from './ReceiptPrinter.types';

const { Option } = Select;
const { Text } = Typography;

// Vietnamese thermal printer configurations
const VIETNAMESE_PRINTERS = {
  'xprinter_xp58': {
    name: 'XPrinter XP-58III',
    width: 58, // mm
    encoding: 'utf-8',
    commands: {
      init: '\x1B\x40',
      cutPaper: '\x1D\x56\x00',
      centerAlign: '\x1B\x61\x01',
      leftAlign: '\x1B\x61\x00',
      bold: '\x1B\x45\x01',
      normal: '\x1B\x45\x00',
      largeFontSize: '\x1D\x21\x11',
      normalFontSize: '\x1D\x21\x00',
      lineFeed: '\x0A'
    }
  },
  'xprinter_xp80': {
    name: 'XPrinter XP-80C',
    width: 80, // mm
    encoding: 'utf-8',
    commands: {
      init: '\x1B\x40',
      cutPaper: '\x1D\x56\x00',
      centerAlign: '\x1B\x61\x01',
      leftAlign: '\x1B\x61\x00',
      bold: '\x1B\x45\x01',
      normal: '\x1B\x45\x00',
      largeFontSize: '\x1D\x21\x11',
      normalFontSize: '\x1D\x21\x00',
      lineFeed: '\x0A'
    }
  },
  'epson_tm_t20': {
    name: 'Epson TM-T20II',
    width: 80, // mm
    encoding: 'utf-8',
    commands: {
      init: '\x1B\x40',
      cutPaper: '\x1D\x56\x00',
      centerAlign: '\x1B\x61\x01',
      leftAlign: '\x1B\x61\x00',
      bold: '\x1B\x45\x01',
      normal: '\x1B\x45\x00',
      largeFontSize: '\x1D\x21\x11',
      normalFontSize: '\x1D\x21\x00',
      lineFeed: '\x0A'
    }
  }
} as const;

// Vietnamese business receipt formats
const RECEIPT_FORMATS = {
  standard: { name: 'Hóa đơn tiêu chuẩn', template: 'standard' },
  detailed: { name: 'Hóa đơn chi tiết', template: 'detailed' },
  compact: { name: 'Hóa đơn gọn', template: 'compact' },
  gift: { name: 'Hóa đơn quà tặng', template: 'gift' }
} as const;

export const ReceiptPrinter: React.FC<ReceiptPrinterProps> = ({
  order,
  businessInfo,
  onPrint,
  disabled = false,
  format = 'standard'
}) => {
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [printerSettings, setPrinterSettings] = useState<PrinterSettings>({
    printerType: 'xprinter_xp80',
    connectionType: 'usb',
    paperWidth: 80,
    cutPaper: true,
    openDrawer: true,
    printLogo: true,
    printQR: true,
    fontSize: 'normal',
    copies: 1
  });

  // Enhanced printing with Vietnamese business requirements
  const handlePrint = async (printFormat: PrintFormat = format) => {
    if (!order || !businessInfo) {
      message.error('Thiếu thông tin hóa đơn hoặc cửa hàng');
      return;
    }

    setPrinting(true);

    try {
      // Validate Vietnamese business requirements
      if (!businessInfo.taxCode) {
        message.warning('Cảnh báo: Chưa có mã số thuế doanh nghiệp');
      }

      // Check for Vietnamese business compliance
      const hasValidVAT = order.items.every(item => item.vatRate !== undefined);
      if (!hasValidVAT) {
        message.warning('Cảnh báo: Một số sản phẩm chưa có thông tin VAT');
      }

      // Generate receipt content with Vietnamese formatting
      const receiptContent = generateVietnameseReceipt(order, businessInfo, printFormat, printerSettings);

      // Handle different print methods
      switch (printerSettings.connectionType) {
        case 'thermal_usb':
          await printToThermalPrinter(receiptContent);
          break;
        case 'thermal_network':
          await printToNetworkPrinter(receiptContent);
          break;
        case 'pdf':
          await generatePDFReceipt(receiptContent);
          break;
        case 'image':
          await generateImageReceipt(receiptContent);
          break;
        default:
          await printToBrowser(receiptContent);
      }

      // Open cash drawer if enabled
      if (printerSettings.openDrawer && printerSettings.connectionType.includes('thermal')) {
        await openCashDrawer();
      }

      // Print multiple copies if requested
      for (let i = 1; i < (printerSettings.copies || 1); i++) {
        setTimeout(() => {
          handlePrint(printFormat);
        }, 1000 * i);
      }

      onPrint?.();
      message.success(
        `Đã in ${printerSettings.copies || 1} bản hóa đơn${printerSettings.openDrawer ? ' và mở ngăn kéo tiền' : ''}`
      );

    } catch (error: any) {
      console.error('Print error:', error);
      message.error(`Lỗi in hóa đơn: ${error.message || 'Không xác định'}`);
    } finally {
      setPrinting(false);
    }
  };

  // Generate Vietnamese-compliant receipt content
  const generateVietnameseReceipt = (
    order: any, 
    businessInfo: any, 
    format: PrintFormat, 
    settings: PrinterSettings
  ): string => {
    const printer = VIETNAMESE_PRINTERS[settings.printerType as keyof typeof VIETNAMESE_PRINTERS];
    const { commands } = printer;
    
    let content = '';
    
    // Initialize printer
    content += commands.init;
    
    // Header with business info
    content += commands.centerAlign;
    if (settings.printLogo && businessInfo.logo) {
      content += `[LOGO: ${businessInfo.logo}]${commands.lineFeed}`;
    }
    
    content += commands.bold + commands.largeFontSize;
    content += `${businessInfo.name}${commands.lineFeed}`;
    content += commands.normal + commands.normalFontSize;
    content += `${businessInfo.address}${commands.lineFeed}`;
    content += `ĐT: ${businessInfo.phone}${commands.lineFeed}`;
    
    if (businessInfo.taxCode) {
      content += `MST: ${businessInfo.taxCode}${commands.lineFeed}`;
    }
    
    if (businessInfo.website) {
      content += `${businessInfo.website}${commands.lineFeed}`;
    }
    
    content += commands.lineFeed;
    content += '================================';
    content += commands.lineFeed;
    
    // Receipt title
    content += commands.centerAlign + commands.bold;
    content += 'HÓA ĐƠN BÁN HÀNG';
    content += commands.lineFeed + commands.normal;
    
    // Order information
    content += commands.leftAlign;
    content += `Số HĐ: ${order.id}${commands.lineFeed}`;
    content += `Ngày: ${new Date().toLocaleString('vi-VN')}${commands.lineFeed}`;
    content += `Thu ngân: ${order.cashier || 'N/A'}${commands.lineFeed}`;
    
    if (order.customer) {
      content += `Khách hàng: ${order.customer}${commands.lineFeed}`;
    }
    
    if (order.loyaltyCard) {
      content += `Thẻ KH: ${order.loyaltyCard}${commands.lineFeed}`;
    }
    
    content += '================================';
    content += commands.lineFeed;
    
    // Items with Vietnamese formatting
    order.items.forEach((item: any, index: number) => {
      content += `${index + 1}. ${item.name}${commands.lineFeed}`;
      
      const unitPrice = item.price.toLocaleString('vi-VN');
      const itemTotal = (item.quantity * item.price).toLocaleString('vi-VN');
      
      content += `   ${item.quantity} ${item.unit || 'cái'} x ${unitPrice}đ`;
      content += ' '.repeat(Math.max(0, Math.floor(printer.width/2) - 20)) + `${itemTotal}đ${commands.lineFeed}`;
      
      if (item.vatRate !== undefined) {
        content += `   (VAT ${item.vatRate}%)${commands.lineFeed}`;
      }
      
      if (item.discount > 0) {
        content += `   Giảm giá: -${item.discount.toLocaleString('vi-VN')}đ${commands.lineFeed}`;
      }
    });
    
    content += '================================';
    content += commands.lineFeed;
    
    // Totals with Vietnamese tax breakdown
    content += `Tạm tính:` + ' '.repeat(Math.floor(printer.width/2) - 5) + `${order.subtotal.toLocaleString('vi-VN')}đ${commands.lineFeed}`;
    
    if (order.discount > 0) {
      content += `Giảm giá:` + ' '.repeat(Math.floor(printer.width/2) - 5) + `-${order.discount.toLocaleString('vi-VN')}đ${commands.lineFeed}`;
    }
    
    if (order.loyaltyDiscount > 0) {
      content += `Ưu đãi thành viên:` + ' '.repeat(Math.floor(printer.width/2) - 10) + `-${order.loyaltyDiscount.toLocaleString('vi-VN')}đ${commands.lineFeed}`;
    }
    
    content += `Thuế VAT:` + ' '.repeat(Math.floor(printer.width/2) - 5) + `${order.vatAmount.toLocaleString('vi-VN')}đ${commands.lineFeed}`;
    
    content += '--------------------------------';
    content += commands.lineFeed;
    
    content += commands.bold;
    content += `TỔNG CỘNG:` + ' '.repeat(Math.floor(printer.width/2) - 8) + `${order.total.toLocaleString('vi-VN')}đ${commands.lineFeed}`;
    content += commands.normal;
    
    // Payment details
    content += `TT ${order.paymentMethod}:` + ' '.repeat(Math.floor(printer.width/2) - 8) + `${order.paid.toLocaleString('vi-VN')}đ${commands.lineFeed}`;
    
    if (order.change > 0) {
      content += `Tiền thừa:` + ' '.repeat(Math.floor(printer.width/2) - 5) + `${order.change.toLocaleString('vi-VN')}đ${commands.lineFeed}`;
    }
    
    content += '================================';
    content += commands.lineFeed;
    
    // Loyalty points
    if (order.loyaltyPointsEarned && order.loyaltyPointsEarned > 0) {
      content += commands.centerAlign;
      content += `Điểm tích lũy: +${order.loyaltyPointsEarned} điểm${commands.lineFeed}`;
      content += `Tổng điểm: ${order.totalLoyaltyPoints} điểm${commands.lineFeed}`;
      content += commands.leftAlign;
      content += commands.lineFeed;
    }
    
    // QR code for digital receipt
    if (settings.printQR && order.digitalReceiptUrl) {
      content += commands.centerAlign;
      content += `[QR: ${order.digitalReceiptUrl}]${commands.lineFeed}`;
      content += 'Quét QR để xem hóa đơn điện tử';
      content += commands.lineFeed + commands.leftAlign;
    }
    
    // Footer messages
    content += commands.centerAlign;
    content += commands.lineFeed;
    content += 'Cảm ơn quý khách!';
    content += commands.lineFeed;
    content += 'Hẹn gặp lại!';
    content += commands.lineFeed;
    
    if (businessInfo.returnPolicy) {
      content += commands.lineFeed;
      content += businessInfo.returnPolicy;
      content += commands.lineFeed;
    }
    
    // Cut paper
    if (settings.cutPaper) {
      content += commands.lineFeed + commands.lineFeed;
      content += commands.cutPaper;
    }
    
    return content;
  };

  // Print to thermal printer via USB/Serial
  const printToThermalPrinter = async (content: string): Promise<void> => {
    try {
      // Try to use Web Serial API for direct thermal printer communication
      if ('serial' in navigator) {
        const port = await (navigator as any).serial.requestPort();
        await port.open({ baudRate: 9600 });
        
        const writer = port.writable.getWriter();
        const encoder = new TextEncoder();
        await writer.write(encoder.encode(content));
        
        writer.releaseLock();
        await port.close();
      } else {
        // Fallback to browser print with thermal styling
        await printToBrowser(content);
      }
    } catch (error) {
      throw new Error('Không thể kết nối với máy in nhiệt');
    }
  };

  // Print to network thermal printer
  const printToNetworkPrinter = async (content: string): Promise<void> => {
    try {
      // Send to thermal printer via network endpoint
      const response = await fetch('/api/print/thermal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          printerSettings,
          printerIP: printerSettings.networkIP
        })
      });
      
      if (!response.ok) {
        throw new Error('Lỗi kết nối máy in mạng');
      }
    } catch (error) {
      throw new Error('Không thể in qua mạng');
    }
  };

  // Generate PDF receipt
  const generatePDFReceipt = async (content: string): Promise<void> => {
    try {
      const response = await fetch('/api/print/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order,
          businessInfo,
          format,
          template: 'vietnamese_standard'
        })
      });
      
      if (!response.ok) {
        throw new Error('Lỗi tạo file PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hoa-don-${order.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      throw new Error('Không thể tạo file PDF');
    }
  };

  // Generate image receipt
  const generateImageReceipt = async (content: string): Promise<void> => {
    try {
      // Create canvas with receipt content
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Không thể tạo canvas');
      }
      
      // Set canvas size for Vietnamese receipt
      canvas.width = 300; // 80mm at 96 DPI
      canvas.height = Math.max(600, order.items.length * 50 + 400);
      
      // Draw receipt content
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = 'black';
      ctx.font = '12px monospace';
      
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        ctx.fillText(line, 10, 20 + index * 15);
      });
      
      // Download as image
      canvas.toBlob((blob) => {
        if (blob) {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `hoa-don-${order.id}.png`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }
      });
    } catch (error) {
      throw new Error('Không thể tạo file hình ảnh');
    }
  };

  // Browser print fallback
  const printToBrowser = async (content: string): Promise<void> => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Không thể mở cửa sổ in');
    }

    const htmlContent = `
      <html>
        <head>
          <title>Hóa đơn - ${order.id}</title>
          <style>
            @media print {
              body { margin: 0; padding: 0; }
              * { -webkit-print-color-adjust: exact; }
            }
            @page { 
              size: ${printerSettings.paperWidth}mm auto;
              margin: 5mm;
            }
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.4;
              white-space: pre-wrap;
            }
          </style>
        </head>
        <body>${content.replace(/\n/g, '<br>')}</body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    
    setTimeout(() => {
      printWindow.close();
    }, 1000);
  };

  // Open cash drawer
  const openCashDrawer = async (): Promise<void> => {
    try {
      if (printerSettings.connectionType.includes('thermal')) {
        // Send cash drawer open command
        const drawerCommand = '\x1B\x70\x00\x19\xFA'; // Standard ESC/POS command
        
        if ('serial' in navigator) {
          // Send via serial if available
          const port = await (navigator as any).serial.requestPort();
          await port.open({ baudRate: 9600 });
          
          const writer = port.writable.getWriter();
          const encoder = new TextEncoder();
          await writer.write(encoder.encode(drawerCommand));
          
          writer.releaseLock();
          await port.close();
        } else {
          // Send to backend for network printers
          await fetch('/api/print/drawer', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              printerIP: printerSettings.networkIP,
              command: drawerCommand
            })
          });
        }
      }
    } catch (error) {
      console.error('Cash drawer error:', error);
      // Don't throw error as this is not critical
    }
  };

  const handlePreview = () => {
    setPreviewVisible(true);
  };

  const handleSettings = () => {
    setSettingsVisible(true);
  };

  return (
    <>
      <Space.Compact>
        <Button
          type="primary"
          icon={<PrinterOutlined />}
          onClick={() => handlePrint()}
          disabled={disabled || printing}
          loading={printing}
        >
          In hóa đơn
        </Button>
        
        <Button
          icon={<EyeOutlined />}
          onClick={handlePreview}
          disabled={disabled}
        >
          Xem trước
        </Button>
        
        <Button
          icon={<SettingOutlined />}
          onClick={handleSettings}
          disabled={disabled}
        />
      </Space.Compact>

      {/* Printer Settings Modal */}
      <Modal
        title="Cài đặt máy in"
        open={settingsVisible}
        onCancel={() => setSettingsVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setSettingsVisible(false)}>
            Hủy
          </Button>,
          <Button 
            key="save" 
            type="primary" 
            onClick={() => {
              setSettingsVisible(false);
              message.success('Đã lưu cài đặt máy in');
            }}
          >
            Lưu
          </Button>,
        ]}
        width={600}
      >
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card title="Loại máy in" size="small">
              <Select
                style={{ width: '100%' }}
                value={printerSettings.printerType}
                onChange={(value) => setPrinterSettings(prev => ({ ...prev, printerType: value }))}
              >
                {Object.entries(VIETNAMESE_PRINTERS).map(([key, printer]) => (
                  <Option key={key} value={key}>
                    {printer.name} ({printer.width}mm)
                  </Option>
                ))}
              </Select>
            </Card>
          </Col>
          
          <Col span={12}>
            <Card title="Kết nối" size="small">
              <Select
                style={{ width: '100%' }}
                value={printerSettings.connectionType}
                onChange={(value) => setPrinterSettings(prev => ({ ...prev, connectionType: value }))}
              >
                <Option value="thermal_usb">Máy in nhiệt USB</Option>
                <Option value="thermal_network">Máy in nhiệt mạng</Option>
                <Option value="browser">In qua trình duyệt</Option>
                <Option value="pdf">Xuất file PDF</Option>
                <Option value="image">Xuất hình ảnh</Option>
              </Select>
            </Card>
          </Col>
          
          <Col span={12}>
            <Card title="Tùy chọn" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Switch
                    checked={printerSettings.cutPaper}
                    onChange={(checked) => setPrinterSettings(prev => ({ ...prev, cutPaper: checked }))}
                  />
                  <Text style={{ marginLeft: 8 }}>Cắt giấy tự động</Text>
                </div>
                
                <div>
                  <Switch
                    checked={printerSettings.openDrawer}
                    onChange={(checked) => setPrinterSettings(prev => ({ ...prev, openDrawer: checked }))}
                  />
                  <Text style={{ marginLeft: 8 }}>Mở ngăn kéo tiền</Text>
                </div>
                
                <div>
                  <Switch
                    checked={printerSettings.printLogo}
                    onChange={(checked) => setPrinterSettings(prev => ({ ...prev, printLogo: checked }))}
                  />
                  <Text style={{ marginLeft: 8 }}>In logo cửa hàng</Text>
                </div>
                
                <div>
                  <Switch
                    checked={printerSettings.printQR}
                    onChange={(checked) => setPrinterSettings(prev => ({ ...prev, printQR: checked }))}
                  />
                  <Text style={{ marginLeft: 8 }}>In mã QR</Text>
                </div>
              </Space>
            </Card>
          </Col>
          
          <Col span={12}>
            <Card title="Số bản in" size="small">
              <Select
                style={{ width: '100%' }}
                value={printerSettings.copies}
                onChange={(value) => setPrinterSettings(prev => ({ ...prev, copies: value }))}
              >
                <Option value={1}>1 bản</Option>
                <Option value={2}>2 bản</Option>
                <Option value={3}>3 bản</Option>
              </Select>
            </Card>
          </Col>
        </Row>
      </Modal>

      {/* Receipt Preview Modal */}
      <Modal
        title="Xem trước hóa đơn"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        width={400}
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            Đóng
          </Button>,
          <Button 
            key="print" 
            type="primary" 
            icon={<PrinterOutlined />}
            onClick={() => {
              setPreviewVisible(false);
              handlePrint();
            }}
          >
            In ngay
          </Button>,
        ]}
      >
        <div style={{ 
          maxHeight: '60vh', 
          overflow: 'auto',
          border: '1px solid #d9d9d9',
          borderRadius: '6px',
          padding: '16px',
          backgroundColor: '#fafafa'
        }}>
          <ReceiptTemplate
            order={order}
            businessInfo={businessInfo}
            format={format}
            settings={printerSettings}
          />
        </div>
      </Modal>
    </>
  );
};

export default ReceiptPrinter;