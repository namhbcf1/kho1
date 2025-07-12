// Export all utility functions
export * from './validation';
export * from './formatting';
export * from './helpers';

// Re-export commonly used items
export {
  formatVND,
  formatDate,
  formatDateTime,
  formatVietnamesePhone,
  formatVietnameseAddress,
} from './formatting';

export {
  debounce,
  throttle,
  generateId,
  generateUUID,
  isEmpty,
  searchMatch,
  copyToClipboard,
  downloadFile,
} from './helpers';

export {
  validateVietnamesePhone,
  validateVietnameseEmail,
  validateFormData,
  productSchema,
  customerSchema,
  orderSchema,
} from './validation';
