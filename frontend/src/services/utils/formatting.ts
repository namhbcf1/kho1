// Formatting utilities for Vietnamese locale
import dayjs from 'dayjs';
import 'dayjs/locale/vi';

// Set Vietnamese locale
dayjs.locale('vi');

// Vietnamese currency formatting
export const formatVND = (amount: number): string => {
  if (isNaN(amount)) return '0₫';
  
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format number with Vietnamese locale
export const formatNumber = (number: number, decimals = 0): string => {
  if (isNaN(number)) return '0';
  
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number);
};

// Format percentage
export const formatPercentage = (value: number, decimals = 1): string => {
  if (isNaN(value)) return '0%';
  
  return new Intl.NumberFormat('vi-VN', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
};

// Date formatting
export const formatDate = (date: string | Date, format = 'DD/MM/YYYY'): string => {
  if (!date) return '';
  return dayjs(date).format(format);
};

export const formatDateTime = (date: string | Date, format = 'DD/MM/YYYY HH:mm'): string => {
  if (!date) return '';
  return dayjs(date).format(format);
};

export const formatTime = (date: string | Date, format = 'HH:mm'): string => {
  if (!date) return '';
  return dayjs(date).format(format);
};

// Relative time formatting
export const formatRelativeTime = (date: string | Date): string => {
  if (!date) return '';
  return dayjs(date).fromNow();
};

// Vietnamese phone number formatting
export const formatVietnamesePhone = (phone: string): string => {
  if (!phone) return '';
  
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Handle different formats
  if (digits.startsWith('84')) {
    // +84 format
    const number = digits.slice(2);
    if (number.length === 9) {
      return `+84 ${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6)}`;
    }
  } else if (digits.startsWith('0')) {
    // 0 format
    if (digits.length === 10) {
      return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
    }
  }
  
  return phone; // Return original if can't format
};

// Vietnamese address formatting
export const formatVietnameseAddress = (address: {
  street?: string;
  ward?: string;
  district?: string;
  province?: string;
}): string => {
  const parts = [
    address.street,
    address.ward,
    address.district,
    address.province,
  ].filter(Boolean);
  
  return parts.join(', ');
};

// Tax code formatting
export const formatTaxCode = (taxCode: string): string => {
  if (!taxCode) return '';
  
  const digits = taxCode.replace(/\D/g, '');
  
  if (digits.length === 10) {
    return digits;
  } else if (digits.length === 13) {
    return `${digits.slice(0, 10)}-${digits.slice(10)}`;
  }
  
  return taxCode;
};

// Barcode formatting
export const formatBarcode = (barcode: string): string => {
  if (!barcode) return '';
  
  const digits = barcode.replace(/\D/g, '');
  
  // Format based on length
  if (digits.length === 8) {
    return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  } else if (digits.length === 12) {
    return `${digits.slice(0, 1)} ${digits.slice(1, 7)} ${digits.slice(7, 12)} ${digits.slice(12)}`;
  } else if (digits.length === 13) {
    return `${digits.slice(0, 1)} ${digits.slice(1, 7)} ${digits.slice(7, 13)}`;
  }
  
  return barcode;
};

// File size formatting
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

// Duration formatting
export const formatDuration = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

// Order number formatting
export const formatOrderNumber = (orderNumber: string): string => {
  if (!orderNumber) return '';
  
  // Format: ORD-YYYYMMDD-XXXXXX
  if (orderNumber.match(/^ORD-\d{8}-\d{6}$/)) {
    return orderNumber;
  }
  
  return orderNumber;
};

// Vietnamese name formatting
export const formatVietnameseName = (name: string): string => {
  if (!name) return '';
  
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Truncate text with ellipsis
export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text;
  
  return text.slice(0, maxLength - 3) + '...';
};

// Format search query
export const formatSearchQuery = (query: string): string => {
  if (!query) return '';
  
  return query
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' '); // Replace multiple spaces with single space
};

// Format discount
export const formatDiscount = (discount: number, type: 'percentage' | 'amount' = 'amount'): string => {
  if (type === 'percentage') {
    return formatPercentage(discount);
  } else {
    return formatVND(discount);
  }
};

// Format stock status
export const formatStockStatus = (stock: number, minStock = 0): {
  text: string;
  color: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
} => {
  if (stock === 0) {
    return {
      text: 'Hết hàng',
      color: 'red',
      status: 'out_of_stock',
    };
  } else if (stock <= minStock) {
    return {
      text: 'Sắp hết',
      color: 'orange',
      status: 'low_stock',
    };
  } else {
    return {
      text: 'Còn hàng',
      color: 'green',
      status: 'in_stock',
    };
  }
};

// Format payment method
export const formatPaymentMethod = (method: string): string => {
  const methods: Record<string, string> = {
    cash: 'Tiền mặt',
    card: 'Thẻ',
    vnpay: 'VNPay',
    momo: 'MoMo',
    zalopay: 'ZaloPay',
    bank_transfer: 'Chuyển khoản',
  };
  
  return methods[method] || method;
};

// Format order status
export const formatOrderStatus = (status: string): {
  text: string;
  color: string;
} => {
  const statuses: Record<string, { text: string; color: string }> = {
    pending: { text: 'Chờ xử lý', color: 'orange' },
    processing: { text: 'Đang xử lý', color: 'blue' },
    completed: { text: 'Hoàn thành', color: 'green' },
    cancelled: { text: 'Đã hủy', color: 'red' },
    refunded: { text: 'Đã hoàn trả', color: 'purple' },
  };
  
  return statuses[status] || { text: status, color: 'default' };
};

// Format user role
export const formatUserRole = (role: string): string => {
  const roles: Record<string, string> = {
    admin: 'Quản trị viên',
    manager: 'Quản lý',
    cashier: 'Thu ngân',
    staff: 'Nhân viên',
  };
  
  return roles[role] || role;
};
