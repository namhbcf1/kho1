// API constants
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',
  PROFILE: '/auth/profile',
  CHANGE_PASSWORD: '/auth/change-password',

  // Products
  PRODUCTS: '/products',
  PRODUCT_BY_ID: (id: string) => `/products/${id}`,
  PRODUCT_SEARCH: '/products/search',
  PRODUCT_BARCODE: (barcode: string) => `/products/barcode/${barcode}`,
  PRODUCT_BULK: '/products/bulk',
  
  // Categories
  CATEGORIES: '/categories',
  CATEGORY_BY_ID: (id: string) => `/categories/${id}`,
  CATEGORY_TREE: '/categories/tree',

  // Customers
  CUSTOMERS: '/customers',
  CUSTOMER_BY_ID: (id: string) => `/customers/${id}`,
  CUSTOMER_SEARCH: '/customers/search',
  CUSTOMER_LOYALTY: (id: string) => `/customers/${id}/loyalty`,
  CUSTOMER_ORDERS: (id: string) => `/customers/${id}/orders`,
  CUSTOMER_POINTS: (id: string) => `/customers/${id}/points`,

  // Orders
  ORDERS: '/orders',
  ORDER_BY_ID: (id: string) => `/orders/${id}`,
  ORDER_STATUS: (id: string) => `/orders/${id}/status`,
  ORDER_REFUND: (id: string) => `/orders/${id}/refund`,
  ORDER_RECEIPT: (id: string) => `/orders/${id}/receipt`,
  POS_ORDER: '/orders/pos',

  // Payments
  PAYMENTS: '/payments',
  PAYMENT_BY_ID: (id: string) => `/payments/${id}`,
  VNPAY_PAYMENT: '/payments/vnpay',
  VNPAY_VERIFY: '/payments/vnpay/verify',
  VNPAY_CALLBACK: '/payments/vnpay/callback',
  MOMO_PAYMENT: '/payments/momo',
  MOMO_CALLBACK: '/payments/momo/callback',
  ZALOPAY_PAYMENT: '/payments/zalopay',
  ZALOPAY_CALLBACK: '/payments/zalopay/callback',

  // Inventory
  INVENTORY: '/inventory',
  INVENTORY_BY_PRODUCT: (id: string) => `/inventory/product/${id}`,
  INVENTORY_UPDATE: '/inventory/update',
  INVENTORY_TRANSACTIONS: '/inventory/transactions',
  INVENTORY_ADJUSTMENT: '/inventory/adjustment',
  LOW_STOCK: '/inventory/low-stock',
  OUT_OF_STOCK: '/inventory/out-of-stock',

  // Analytics
  DASHBOARD_STATS: '/analytics/dashboard',
  REALTIME_STATS: '/analytics/realtime',
  REVENUE_DATA: '/analytics/revenue',
  PRODUCT_ANALYTICS: '/analytics/products',
  CUSTOMER_ANALYTICS: '/analytics/customers',
  SALES_ANALYTICS: '/analytics/sales',
  INVENTORY_ANALYTICS: '/analytics/inventory',
  STAFF_ANALYTICS: '/analytics/staff',
  EXPORT_REPORT: '/analytics/export',

  // Staff
  STAFF: '/staff',
  STAFF_BY_ID: (id: string) => `/staff/${id}`,
  STAFF_PERFORMANCE: (id: string) => `/staff/${id}/performance`,
  STAFF_COMMISSION: (id: string) => `/staff/${id}/commission`,
  STAFF_SHIFTS: (id: string) => `/staff/${id}/shifts`,
  STAFF_TARGETS: (id: string) => `/staff/${id}/targets`,

  // Settings
  SETTINGS: '/settings',
  BUSINESS_SETTINGS: '/settings/business',
  TAX_SETTINGS: '/settings/tax',
  PAYMENT_SETTINGS: '/settings/payment',
  RECEIPT_SETTINGS: '/settings/receipt',
  LANGUAGE_SETTINGS: '/settings/language',
  BACKUP_SETTINGS: '/settings/backup',
  NOTIFICATION_SETTINGS: '/settings/notifications',

  // Upload
  UPLOAD_IMAGE: '/upload/image',
  UPLOAD_FILE: '/upload/file',
  UPLOAD_BULK: '/upload/bulk',

  // Backup
  BACKUP_CREATE: '/backup/create',
  BACKUP_RESTORE: '/backup/restore',
  BACKUP_LIST: '/backup/list',
  BACKUP_DOWNLOAD: (id: string) => `/backup/download/${id}`,
  BACKUP_DELETE: (id: string) => `/backup/delete/${id}`,

  // Notifications
  NOTIFICATIONS: '/notifications',
  NOTIFICATION_BY_ID: (id: string) => `/notifications/${id}`,
  NOTIFICATION_MARK_READ: (id: string) => `/notifications/${id}/read`,
  NOTIFICATION_SUBSCRIBE: '/notifications/subscribe',
  NOTIFICATION_UNSUBSCRIBE: '/notifications/unsubscribe',

  // External services
  SMS_SEND: '/sms/send',
  SMS_BALANCE: '/sms/balance',
  EMAIL_SEND: '/email/send',
  EMAIL_TEMPLATES: '/email/templates',

  // Health check
  HEALTH: '/health',
  VERSION: '/version',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

export const ERROR_CODES = {
  // Auth errors
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  PASSWORD_EXPIRED: 'PASSWORD_EXPIRED',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_JSON: 'INVALID_JSON',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',

  // Business logic errors
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  CUSTOMER_NOT_FOUND: 'CUSTOMER_NOT_FOUND',
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_CANCELLED: 'PAYMENT_CANCELLED',
  REFUND_NOT_ALLOWED: 'REFUND_NOT_ALLOWED',
  INVENTORY_LOCKED: 'INVENTORY_LOCKED',
  CATEGORY_HAS_PRODUCTS: 'CATEGORY_HAS_PRODUCTS',

  // System errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  SERVER_ERROR: 'SERVER_ERROR',
  MAINTENANCE_MODE: 'MAINTENANCE_MODE',
  FEATURE_DISABLED: 'FEATURE_DISABLED',
} as const;

export const REQUEST_TIMEOUT = {
  DEFAULT: 10000, // 10 seconds
  UPLOAD: 30000, // 30 seconds
  PAYMENT: 60000, // 60 seconds
  EXPORT: 120000, // 2 minutes
  BACKUP: 300000, // 5 minutes
} as const;

export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
  BACKOFF_FACTOR: 2,
  RETRYABLE_STATUS_CODES: [408, 429, 500, 502, 503, 504],
} as const;

export const CACHE_KEYS = {
  USER_PROFILE: 'user_profile',
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  CUSTOMERS: 'customers',
  SETTINGS: 'settings',
  DASHBOARD_STATS: 'dashboard_stats',
  INVENTORY: 'inventory',
  STAFF: 'staff',
} as const;

export const CACHE_TTL = {
  SHORT: 5 * 60 * 1000, // 5 minutes
  MEDIUM: 30 * 60 * 1000, // 30 minutes
  LONG: 2 * 60 * 60 * 1000, // 2 hours
  VERY_LONG: 24 * 60 * 60 * 1000, // 24 hours
} as const;
