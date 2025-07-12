// API configuration constants
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',
  PROFILE: '/auth/profile',

  // Products
  PRODUCTS: '/products',
  PRODUCT_BY_ID: (id: string) => `/products/${id}`,
  PRODUCT_SEARCH: '/products/search',
  PRODUCT_BARCODE: (barcode: string) => `/products/barcode/${barcode}`,
  CATEGORIES: '/categories',
  CATEGORY_BY_ID: (id: string) => `/categories/${id}`,

  // Customers
  CUSTOMERS: '/customers',
  CUSTOMER_BY_ID: (id: string) => `/customers/${id}`,
  CUSTOMER_SEARCH: '/customers/search',
  CUSTOMER_LOYALTY: (id: string) => `/customers/${id}/loyalty`,
  CUSTOMER_ORDERS: (id: string) => `/customers/${id}/orders`,

  // Orders
  ORDERS: '/orders',
  ORDER_BY_ID: (id: string) => `/orders/${id}`,
  ORDER_STATUS: (id: string) => `/orders/${id}/status`,
  ORDER_REFUND: (id: string) => `/orders/${id}/refund`,
  POS_ORDER: '/orders/pos',

  // Payments
  PAYMENTS: '/payments',
  VNPAY_PAYMENT: '/payments/vnpay',
  VNPAY_VERIFY: '/payments/vnpay/verify',
  MOMO_PAYMENT: '/payments/momo',
  MOMO_CALLBACK: '/payments/momo/callback',
  ZALOPAY_PAYMENT: '/payments/zalopay',
  ZALOPAY_CALLBACK: '/payments/zalopay/callback',

  // Inventory
  INVENTORY: '/inventory',
  INVENTORY_UPDATE: '/inventory/update',
  INVENTORY_TRANSACTIONS: '/inventory/transactions',
  LOW_STOCK: '/inventory/low-stock',

  // Analytics
  DASHBOARD_STATS: '/analytics/dashboard',
  REVENUE_DATA: '/analytics/revenue',
  PRODUCT_ANALYTICS: '/analytics/products',
  CUSTOMER_ANALYTICS: '/analytics/customers',
  SALES_ANALYTICS: '/analytics/sales',
  EXPORT_REPORT: '/analytics/export',

  // Settings
  SETTINGS: '/settings',
  BUSINESS_SETTINGS: '/settings/business',
  TAX_SETTINGS: '/settings/tax',
  PAYMENT_SETTINGS: '/settings/payment',
  NOTIFICATION_SETTINGS: '/settings/notifications',

  // Upload
  UPLOAD_IMAGE: '/upload/image',
  UPLOAD_FILE: '/upload/file',

  // Backup
  BACKUP_CREATE: '/backup/create',
  BACKUP_RESTORE: '/backup/restore',
  BACKUP_LIST: '/backup/list',
  BACKUP_EXPORT: '/backup/export',

  // Notifications
  NOTIFICATIONS: '/notifications',
  NOTIFICATION_SUBSCRIBE: '/notifications/subscribe',
  NOTIFICATION_UNSUBSCRIBE: '/notifications/unsubscribe',

  // SMS & Email
  SMS_SEND: '/sms/send',
  SMS_BALANCE: '/sms/balance',
  EMAIL_SEND: '/email/send',
  EMAIL_TEMPLATES: '/email/templates',
} as const;

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

export const ERROR_CODES = {
  // Auth errors
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_JSON: 'INVALID_JSON',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

  // Business logic errors
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  CUSTOMER_NOT_FOUND: 'CUSTOMER_NOT_FOUND',
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  REFUND_NOT_ALLOWED: 'REFUND_NOT_ALLOWED',

  // System errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  SERVER_ERROR: 'SERVER_ERROR',
} as const;

export const REQUEST_TIMEOUT = {
  DEFAULT: 10000, // 10 seconds
  UPLOAD: 30000, // 30 seconds
  PAYMENT: 60000, // 60 seconds
  EXPORT: 120000, // 2 minutes
} as const;

export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
  BACKOFF_FACTOR: 2,
} as const;

export const CACHE_KEYS = {
  USER_PROFILE: 'user_profile',
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  CUSTOMERS: 'customers',
  SETTINGS: 'settings',
  DASHBOARD_STATS: 'dashboard_stats',
} as const;

export const CACHE_TTL = {
  SHORT: 5 * 60 * 1000, // 5 minutes
  MEDIUM: 30 * 60 * 1000, // 30 minutes
  LONG: 2 * 60 * 60 * 1000, // 2 hours
  VERY_LONG: 24 * 60 * 60 * 1000, // 24 hours
} as const;
