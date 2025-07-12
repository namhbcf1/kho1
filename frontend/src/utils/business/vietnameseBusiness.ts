// Production Vietnamese business logic
import { PRODUCTION_CONFIG } from '../../constants/production';

/**
 * Calculate Vietnamese VAT (Value Added Tax)
 * Standard VAT rate in Vietnam is 10%
 */
export const calculateVietnameseVAT = (amount: number): number => {
  if (amount < 0) {
    throw new Error('Amount cannot be negative');
  }
  
  return Math.round(amount * PRODUCTION_CONFIG.VIETNAM.VAT_RATE);
};

/**
 * Calculate total amount including VAT
 */
export const calculateTotalWithVAT = (subtotal: number): number => {
  if (subtotal < 0) {
    throw new Error('Subtotal cannot be negative');
  }
  
  const vat = calculateVietnameseVAT(subtotal);
  return subtotal + vat;
};

/**
 * Format Vietnamese currency (VND)
 */
export const formatVND = (amount: number): string => {
  if (!Number.isFinite(amount)) {
    throw new Error('Amount must be a finite number');
  }
  
  return new Intl.NumberFormat(PRODUCTION_CONFIG.VIETNAM.LOCALE, {
    style: 'currency',
    currency: PRODUCTION_CONFIG.VIETNAM.CURRENCY,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Parse VND string to number
 */
export const parseVND = (vndString: string): number => {
  if (!vndString || typeof vndString !== 'string') {
    throw new Error('Invalid VND string');
  }
  
  // Remove currency symbol and formatting
  const cleanString = vndString
    .replace(/[₫\s.,]/g, '')
    .replace(/\D/g, '');
  
  const amount = parseInt(cleanString, 10);
  
  if (isNaN(amount)) {
    throw new Error('Cannot parse VND string to number');
  }
  
  return amount;
};

/**
 * Validate Vietnamese phone number
 */
export const validateVietnamesePhone = (phone: string): boolean => {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Vietnamese phone number patterns
  const patterns = [
    /^84[1-9][0-9]{8}$/, // +84 format
    /^0[1-9][0-9]{8}$/, // 0 format
  ];
  
  return patterns.some(pattern => pattern.test(cleanPhone));
};

/**
 * Format Vietnamese phone number
 */
export const formatVietnamesePhone = (phone: string): string => {
  if (!validateVietnamesePhone(phone)) {
    throw new Error('Invalid Vietnamese phone number');
  }
  
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Convert to standard format (0xxx xxx xxx)
  let formattedPhone = cleanPhone;
  if (formattedPhone.startsWith('84')) {
    formattedPhone = '0' + formattedPhone.substring(2);
  }
  
  // Format as 0xxx xxx xxx
  return formattedPhone.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
};

/**
 * Generate Vietnamese order number
 */
export const generateVietnameseOrderNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const timestamp = now.getTime().toString().slice(-6);
  
  return `HD${year}${month}${day}${timestamp}`;
};

/**
 * Generate Vietnamese receipt number
 */
export const generateVietnameseReceiptNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const timestamp = now.getTime().toString().slice(-6);
  
  return `BH${year}${month}${day}${timestamp}`;
};

/**
 * Format Vietnamese date
 */
export const formatVietnameseDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (!dateObj || isNaN(dateObj.getTime())) {
    throw new Error('Invalid date');
  }
  
  return new Intl.DateTimeFormat(PRODUCTION_CONFIG.VIETNAM.LOCALE, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: PRODUCTION_CONFIG.VIETNAM.TIMEZONE,
  }).format(dateObj);
};

/**
 * Format Vietnamese date and time
 */
export const formatVietnameseDateTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (!dateObj || isNaN(dateObj.getTime())) {
    throw new Error('Invalid date');
  }
  
  return new Intl.DateTimeFormat(PRODUCTION_CONFIG.VIETNAM.LOCALE, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: PRODUCTION_CONFIG.VIETNAM.TIMEZONE,
  }).format(dateObj);
};

/**
 * Calculate Vietnamese business hours
 */
export const isVietnameseBusinessHours = (date: Date = new Date()): boolean => {
  const vietnamTime = new Date(date.toLocaleString('en-US', {
    timeZone: PRODUCTION_CONFIG.VIETNAM.TIMEZONE
  }));
  
  const hour = vietnamTime.getHours();
  const day = vietnamTime.getDay();
  
  // Monday to Saturday: 8 AM to 8 PM
  // Sunday: 9 AM to 6 PM
  if (day === 0) { // Sunday
    return hour >= 9 && hour < 18;
  } else { // Monday to Saturday
    return hour >= 8 && hour < 20;
  }
};

/**
 * Round to Vietnamese currency precision (no decimal places)
 */
export const roundToVNDPrecision = (amount: number): number => {
  if (!Number.isFinite(amount)) {
    throw new Error('Amount must be a finite number');
  }
  
  return Math.round(amount);
};

/**
 * Calculate discount amount
 */
export const calculateDiscount = (amount: number, discountPercent: number): number => {
  if (amount < 0) {
    throw new Error('Amount cannot be negative');
  }
  
  if (discountPercent < 0 || discountPercent > 100) {
    throw new Error('Discount percent must be between 0 and 100');
  }
  
  return roundToVNDPrecision(amount * (discountPercent / 100));
};

/**
 * Calculate final amount after discount and VAT
 */
export const calculateFinalAmount = (
  subtotal: number,
  discountPercent: number = 0
): { subtotal: number; discount: number; vat: number; total: number } => {
  if (subtotal < 0) {
    throw new Error('Subtotal cannot be negative');
  }
  
  const discount = calculateDiscount(subtotal, discountPercent);
  const amountAfterDiscount = subtotal - discount;
  const vat = calculateVietnameseVAT(amountAfterDiscount);
  const total = amountAfterDiscount + vat;
  
  return {
    subtotal: roundToVNDPrecision(subtotal),
    discount: roundToVNDPrecision(discount),
    vat: roundToVNDPrecision(vat),
    total: roundToVNDPrecision(total),
  };
};
