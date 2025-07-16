// Vietnamese currency formatting utilities

export const formatVND = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatVNDNumber = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN').format(amount);
};

export const parseVNDInput = (input: string): number => {
  const cleaned = input.replace(/[^\d]/g, '');
  return parseInt(cleaned) || 0;
};

export const roundVND = (amount: number): number => {
  // Round to nearest 1000 VND for cash payments
  return Math.round(amount / 1000) * 1000;
};

export const formatVNDShort = (amount: number): string => {
  if (amount >= 1000000000) {
    return `${(amount / 1000000000).toFixed(1)}B ₫`;
  }
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M ₫`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}K ₫`;
  }
  return `${amount} ₫`;
};

export const calculateChange = (paid: number, total: number): number => {
  return Math.max(0, paid - total);
};

export const suggestCashAmounts = (total: number): number[] => {
  const rounded = roundVND(total);
  return [
    rounded,
    rounded + 50000,
    rounded + 100000,
    rounded + 200000,
    rounded + 500000
  ];
};