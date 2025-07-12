// API endpoints and configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REGISTER: '/auth/register',
    ME: '/auth/me',
    PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/change-password',
  },
  
  // POS
  POS: {
    PRODUCTS: '/pos/products',
    SEARCH_PRODUCTS: '/pos/products/search',
    BARCODE: '/pos/products/barcode',
    ORDERS: '/pos/orders',
    CUSTOMERS: '/pos/customers',
    SEARCH_CUSTOMERS: '/pos/customers/search',
  },
  
  // Products
  PRODUCTS: {
    LIST: '/products',
    CREATE: '/products',
    UPDATE: '/products',
    DELETE: '/products',
    CATEGORIES: '/products/categories',
    INVENTORY: '/products/inventory',
  },
  
  // Customers
  CUSTOMERS: {
    LIST: '/customers',
    CREATE: '/customers',
    UPDATE: '/customers',
    DELETE: '/customers',
    LOYALTY: '/customers/loyalty',
  },
  
  // Orders
  ORDERS: {
    LIST: '/orders',
    CREATE: '/orders',
    UPDATE: '/orders',
    DELETE: '/orders',
    REFUND: '/orders/refund',
  },
  
  // Analytics
  ANALYTICS: {
    DASHBOARD: '/analytics/dashboard',
    SALES: '/analytics/sales',
    REVENUE: '/analytics/revenue',
    INVENTORY: '/analytics/inventory',
    CUSTOMERS: '/analytics/customers',
    EXPORT: '/analytics/export',
  },
  
  // Staff
  STAFF: {
    LIST: '/staff',
    CREATE: '/staff',
    UPDATE: '/staff',
    DELETE: '/staff',
    PERFORMANCE: '/staff/performance',
    SCHEDULE: '/staff/schedule',
  },
  
  // Settings
  SETTINGS: {
    BUSINESS: '/settings/business',
    TAX: '/settings/tax',
    RECEIPT: '/settings/receipt',
    PAYMENT: '/settings/payment',
    BACKUP: '/settings/backup',
  },
  
  // Upload
  UPLOAD: {
    IMAGE: '/upload/image',
    FILE: '/upload/file',
    AVATAR: '/upload/avatar',
  },
} as const;

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Request timeout
export const REQUEST_TIMEOUT = 30000; // 30 seconds

// Retry configuration
export const RETRY_CONFIG = {
  attempts: 3,
  delay: 1000, // 1 second
  backoff: 2, // exponential backoff multiplier
};
