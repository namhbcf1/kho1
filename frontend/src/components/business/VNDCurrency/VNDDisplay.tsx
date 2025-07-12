import React from 'react';
import type { VNDDisplayProps } from './VNDCurrency.types';

export const VNDDisplay: React.FC<VNDDisplayProps> = ({
  amount,
  showSymbol = true,
  showCode = false,
  style,
  className,
}) => {
  const formatVND = (value: number) => {
    const formatted = new Intl.NumberFormat('vi-VN').format(value);
    
    if (showSymbol && showCode) {
      return `${formatted} VND`;
    } else if (showSymbol) {
      return `${formatted}₫`;
    } else if (showCode) {
      return `${formatted} VND`;
    }
    
    return formatted;
  };

  return (
    <span className={className} style={style}>
      {formatVND(amount)}
    </span>
  );
};

export default VNDDisplay;
