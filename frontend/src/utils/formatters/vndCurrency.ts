// Vietnamese currency formatting utilities
export const formatVND = (amount: number): string => {
  if (isNaN(amount)) return '0 ₫';
  
  // Vietnamese number formatting uses dot as thousand separator
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatVNDWithDots = (amount: number): string => {
  if (isNaN(amount)) return '0₫';
  
  // Explicitly format with dots as thousand separators
  const formatted = Math.abs(amount).toLocaleString('vi-VN');
  const sign = amount < 0 ? '-' : '';
  return `${sign}${formatted}₫`;
};

export const formatVNDCompact = (amount: number): string => {
  if (isNaN(amount)) return '0 ₫';
  
  if (amount >= 1000000000) {
    return `${(amount / 1000000000).toFixed(1)}B ₫`;
  } else if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M ₫`;
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K ₫`;
  }
  
  return formatVND(amount);
};

export const parseVND = (value: string): number => {
  // Remove currency symbol and formatting
  const cleanValue = value.replace(/[₫,\s]/g, '');
  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? 0 : parsed;
};

export const formatVNDInput = (value: string): string => {
  // Remove non-numeric characters except decimal point
  const numericValue = value.replace(/[^\d]/g, '');
  
  if (!numericValue) return '';
  
  // Format with thousand separators (dots in Vietnamese)
  return new Intl.NumberFormat('vi-VN').format(parseInt(numericValue));
};

export const formatVNDInputWithDots = (value: string): string => {
  // Remove non-numeric characters
  const numericValue = value.replace(/[^\d]/g, '');
  
  if (!numericValue) return '';
  
  // Manually format with dots as thousand separators
  return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

export const validateVNDAmount = (amount: number): boolean => {
  return !isNaN(amount) && amount >= 0 && amount <= 999999999999; // Max 999 billion VND
};

export const formatVNDRange = (min: number, max: number): string => {
  return `${formatVND(min)} - ${formatVND(max)}`;
};

export const calculateVNDChange = (total: number, received: number): number => {
  return Math.max(0, received - total);
};

export const roundVNDAmount = (amount: number): number => {
  // Round to nearest 1000 VND for cash transactions
  return Math.round(amount / 1000) * 1000;
};

export const formatVNDWithoutSymbol = (amount: number): string => {
  if (isNaN(amount)) return '0';
  
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const convertToVNDWords = (amount: number): string => {
  const ones = [
    '', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín',
    'mười', 'mười một', 'mười hai', 'mười ba', 'mười bốn', 'mười lăm',
    'mười sáu', 'mười bảy', 'mười tám', 'mười chín'
  ];
  
  const tens = [
    '', '', 'hai mười', 'ba mười', 'bốn mười', 'năm mười',
    'sáu mười', 'bảy mười', 'tám mười', 'chín mười'
  ];
  
  const scales = ['', 'nghìn', 'triệu', 'tỷ'];
  
  if (amount === 0) return 'không đồng';
  
  const convertGroup = (num: number): string => {
    let result = '';
    
    const hundreds = Math.floor(num / 100);
    const remainder = num % 100;
    
    if (hundreds > 0) {
      result += ones[hundreds] + ' trăm';
      if (remainder > 0) result += ' ';
    }
    
    if (remainder >= 20) {
      const tensDigit = Math.floor(remainder / 10);
      const onesDigit = remainder % 10;
      result += tens[tensDigit];
      if (onesDigit > 0) {
        result += ' ' + ones[onesDigit];
      }
    } else if (remainder > 0) {
      result += ones[remainder];
    }
    
    return result;
  };
  
  let result = '';
  let scaleIndex = 0;
  
  while (amount > 0) {
    const group = amount % 1000;
    if (group > 0) {
      const groupText = convertGroup(group);
      if (scaleIndex > 0) {
        result = groupText + ' ' + scales[scaleIndex] + ' ' + result;
      } else {
        result = groupText + ' ' + result;
      }
    }
    amount = Math.floor(amount / 1000);
    scaleIndex++;
  }
  
  return result.trim() + ' đồng';
};
