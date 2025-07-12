// Barcode generation component
import React from 'react';
import { Card, Button, Input, Space } from 'antd';
import { BarcodeOutlined, CopyOutlined } from '@ant-design/icons';

export const BarcodeGenerator: React.FC = () => {
  const [barcode, setBarcode] = React.useState('');
  const [generated, setGenerated] = React.useState('');

  const generateBarcode = () => {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const newBarcode = `${timestamp.slice(-10)}${random}`;
    setGenerated(newBarcode);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generated);
  };

  return (
    <Card title="Tạo mã vạch" size="small">
      <Space direction="vertical" style={{ width: '100%' }}>
        <Input
          placeholder="Nhập mã vạch hoặc tạo tự động"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          addonAfter={
            <Button
              type="primary"
              icon={<BarcodeOutlined />}
              onClick={generateBarcode}
            >
              Tạo
            </Button>
          }
        />
        
        {generated && (
          <div>
            <div style={{ 
              fontFamily: 'monospace', 
              fontSize: '20px', 
              textAlign: 'center',
              padding: '10px',
              border: '1px solid #d9d9d9',
              borderRadius: '4px'
            }}>
              {generated}
            </div>
            <Button
              type="dashed"
              icon={<CopyOutlined />}
              onClick={copyToClipboard}
              style={{ marginTop: 8, width: '100%' }}
            >
              Sao chép
            </Button>
          </div>
        )}
      </Space>
    </Card>
  );
};

export default BarcodeGenerator;
