import React from 'react';
import { Typography } from 'antd';
import type { BarcodeDisplayProps } from './BarcodeScanner.types';

const { Text } = Typography;

export const BarcodeDisplay: React.FC<BarcodeDisplayProps> = ({
  code,
  format = 'text',
  style,
}) => {
  const formatBarcode = (code: string) => {
    // Format barcode for display (e.g., add spaces for readability)
    if (code.length === 13) {
      // EAN-13 format: 123 4567 890123
      return `${code.slice(0, 3)} ${code.slice(3, 7)} ${code.slice(7)}`;
    }
    if (code.length === 12) {
      // UPC-A format: 123456 789012
      return `${code.slice(0, 6)} ${code.slice(6)}`;
    }
    return code;
  };

  if (format === 'monospace') {
    return (
      <Text code style={{ fontFamily: 'monospace', ...style }}>
        {formatBarcode(code)}
      </Text>
    );
  }

  return (
    <Text style={style}>
      {formatBarcode(code)}
    </Text>
  );
};

export default BarcodeDisplay;
