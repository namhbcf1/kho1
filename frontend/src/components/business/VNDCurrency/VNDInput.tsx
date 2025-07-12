import React, { useState, useEffect } from 'react';
import { Input } from 'antd';
import type { VNDInputProps } from './VNDCurrency.types';

export const VNDInput: React.FC<VNDInputProps> = ({
  value,
  onChange,
  placeholder = 'Nhập số tiền',
  ...props
}) => {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    if (value !== undefined) {
      setDisplayValue(formatNumber(value));
    }
  }, [value]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const parseNumber = (str: string) => {
    return parseInt(str.replace(/[^\d]/g, ''), 10) || 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const numericValue = parseNumber(inputValue);
    
    setDisplayValue(formatNumber(numericValue));
    onChange?.(numericValue);
  };

  return (
    <Input
      {...props}
      value={displayValue}
      onChange={handleChange}
      placeholder={placeholder}
      suffix="₫"
    />
  );
};

export default VNDInput;
