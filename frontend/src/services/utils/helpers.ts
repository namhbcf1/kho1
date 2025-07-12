// General utility helper functions
import { VIETNAMESE_PROVINCES } from '../../constants/vietnamese';

// Debounce function
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle function
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Deep clone object
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as any;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as any;
  if (typeof obj === 'object') {
    const cloned: any = {};
    Object.keys(obj).forEach(key => {
      cloned[key] = deepClone((obj as any)[key]);
    });
    return cloned;
  }
  return obj;
};

// Generate unique ID
export const generateId = (prefix = ''): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 9);
  return `${prefix}${timestamp}_${random}`;
};

// Generate UUID v4
export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Sleep function
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Retry function with exponential backoff
export const retry = async <T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delay = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      // Exponential backoff
      await sleep(delay * Math.pow(2, attempt - 1));
    }
  }
  
  throw lastError!;
};

// Check if value is empty
export const isEmpty = (value: any): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

// Check if value is valid number
export const isValidNumber = (value: any): boolean => {
  return !isNaN(value) && isFinite(value);
};

// Clamp number between min and max
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

// Round to specified decimal places
export const roundTo = (value: number, decimals = 2): number => {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
};

// Calculate percentage
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return (value / total) * 100;
};

// Calculate discount amount
export const calculateDiscount = (
  price: number,
  discount: number,
  type: 'percentage' | 'amount' = 'percentage'
): number => {
  if (type === 'percentage') {
    return price * (discount / 100);
  } else {
    return Math.min(discount, price);
  }
};

// Calculate tax amount
export const calculateTax = (amount: number, taxRate: number): number => {
  return amount * (taxRate / 100);
};

// Calculate total with tax and discount
export const calculateTotal = (
  subtotal: number,
  discount = 0,
  discountType: 'percentage' | 'amount' = 'amount',
  taxRate = 0
): { discount: number; tax: number; total: number } => {
  const discountAmount = calculateDiscount(subtotal, discount, discountType);
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = calculateTax(afterDiscount, taxRate);
  const total = afterDiscount + taxAmount;
  
  return {
    discount: discountAmount,
    tax: taxAmount,
    total,
  };
};

// Vietnamese text utilities
export const removeVietnameseAccents = (text: string): string => {
  const accents = 'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ';
  const noAccents = 'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd';
  
  return text
    .toLowerCase()
    .split('')
    .map(char => {
      const index = accents.indexOf(char);
      return index !== -1 ? noAccents[index] : char;
    })
    .join('');
};

// Search text matching (Vietnamese-friendly)
export const searchMatch = (text: string, query: string): boolean => {
  if (!text || !query) return false;
  
  const normalizedText = removeVietnameseAccents(text.toLowerCase());
  const normalizedQuery = removeVietnameseAccents(query.toLowerCase());
  
  return normalizedText.includes(normalizedQuery);
};

// Sort Vietnamese text
export const sortVietnameseText = (a: string, b: string): number => {
  return a.localeCompare(b, 'vi', { sensitivity: 'base' });
};

// Get Vietnamese province by code
export const getProvinceByCode = (code: string) => {
  return VIETNAMESE_PROVINCES.find(province => province.code === code);
};

// Validate Vietnamese ID card number
export const validateVietnameseIdCard = (idCard: string): boolean => {
  // Old format: 9 digits or 12 digits
  // New format: 12 digits
  const cleaned = idCard.replace(/\s/g, '');
  return /^[0-9]{9}$|^[0-9]{12}$/.test(cleaned);
};

// Format Vietnamese ID card
export const formatVietnameseIdCard = (idCard: string): string => {
  const cleaned = idCard.replace(/\s/g, '');
  
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  } else if (cleaned.length === 12) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  }
  
  return idCard;
};

// Download file
export const downloadFile = (data: Blob | string, filename: string, type = 'text/plain'): void => {
  const blob = data instanceof Blob ? data : new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

// Copy to clipboard
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    }
  } catch (error) {
    console.error('Copy to clipboard failed:', error);
    return false;
  }
};

// Get device info
export const getDeviceInfo = () => {
  const userAgent = navigator.userAgent;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(userAgent);
  const isDesktop = !isMobile && !isTablet;
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    userAgent,
    platform: navigator.platform,
    language: navigator.language,
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
  };
};

// Check if running in PWA mode
export const isPWA = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
};

// Get URL parameters
export const getUrlParams = (): Record<string, string> => {
  const params: Record<string, string> = {};
  const searchParams = new URLSearchParams(window.location.search);
  
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  
  return params;
};

// Build URL with parameters
export const buildUrl = (baseUrl: string, params: Record<string, any>): string => {
  const url = new URL(baseUrl, window.location.origin);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });
  
  return url.toString();
};
