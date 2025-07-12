// API endpoint constants for Cloudflare Workers backend
export const API_ENDPOINTS = {
  // Authentication endpoints
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/change-password',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },

  // POS endpoints
  POS: {
    PRODUCTS: '/pos/products',
    SEARCH_PRODUCTS: '/pos/products/search',
    PRODUCT_BY_BARCODE: '/pos/products/barcode',
    ORDERS: '/pos/orders',
    CREATE_ORDER: '/pos/orders',
    CUSTOMERS: '/pos/customers',
    SEARCH_CUSTOMERS: '/pos/customers/search',
  },

  // Product management endpoints
  PRODUCTS: {
    LIST: '/products',
    CREATE: '/products',
    GET_BY_ID: (id: string) => `/products/${id}`,
    UPDATE: (id: string) => `/products/${id}`,
    DELETE: (id: string) => `/products/${id}`,
    SEARCH: '/products/search',
    BULK_UPDATE: '/products/bulk',
    EXPORT: '/products/export',
    IMPORT: '/products/import',
  },

  // Category endpoints
  CATEGORIES: {
    LIST: '/products/categories',
    CREATE: '/products/categories',
    GET_BY_ID: (id: string) => `/products/categories/${id}`,
    UPDATE: (id: string) => `/products/categories/${id}`,
    DELETE: (id: string) => `/products/categories/${id}`,
    TREE: '/products/categories/tree',
  },

  // Inventory endpoints
  INVENTORY: {
    LIST: '/products/inventory',
    UPDATE_STOCK: (id: string) => `/products/inventory/${id}`,
    BULK_UPDATE: '/products/inventory/bulk',
    TRANSACTIONS: '/products/inventory/transactions',
    LOW_STOCK: '/products/inventory/low-stock',
    ADJUSTMENTS: '/products/inventory/adjustments',
  },

  // Customer management endpoints
  CUSTOMERS: {
    LIST: '/customers',
    CREATE: '/customers',
    GET_BY_ID: (id: string) => `/customers/${id}`,
    UPDATE: (id: string) => `/customers/${id}`,
    DELETE: (id: string) => `/customers/${id}`,
    SEARCH: '/customers/search',
    HISTORY: (id: string) => `/customers/${id}/history`,
    LOYALTY: (id: string) => `/customers/${id}/loyalty`,
    EXPORT: '/customers/export',
    IMPORT: '/customers/import',
  },

  // Order management endpoints
  ORDERS: {
    LIST: '/orders',
    CREATE: '/orders',
    GET_BY_ID: (id: string) => `/orders/${id}`,
    UPDATE: (id: string) => `/orders/${id}`,
    DELETE: (id: string) => `/orders/${id}`,
    UPDATE_STATUS: (id: string) => `/orders/${id}/status`,
    CANCEL: (id: string) => `/orders/${id}/cancel`,
    REFUND: (id: string) => `/orders/${id}/refund`,
    RECEIPT: (id: string) => `/orders/${id}/receipt`,
    EXPORT: '/orders/export',
  },

  // Payment endpoints
  PAYMENTS: {
    PROCESS: '/payments/process',
    VNPAY: {
      CREATE: '/payments/vnpay/create',
      CALLBACK: '/payments/vnpay/callback',
      IPN: '/payments/vnpay/ipn',
    },
    MOMO: {
      CREATE: '/payments/momo/create',
      CALLBACK: '/payments/momo/callback',
      IPN: '/payments/momo/ipn',
    },
    ZALOPAY: {
      CREATE: '/payments/zalopay/create',
      CALLBACK: '/payments/zalopay/callback',
      IPN: '/payments/zalopay/ipn',
    },
    HISTORY: '/payments/history',
    REFUND: '/payments/refund',
  },

  // Analytics endpoints
  ANALYTICS: {
    DASHBOARD: '/analytics/dashboard',
    SALES: '/analytics/sales',
    REVENUE: '/analytics/revenue',
    INVENTORY: '/analytics/inventory',
    CUSTOMERS: '/analytics/customers',
    PRODUCTS: '/analytics/products',
    STAFF: '/analytics/staff',
    EXPORT: '/analytics/export',
    REPORTS: {
      DAILY: '/analytics/reports/daily',
      WEEKLY: '/analytics/reports/weekly',
      MONTHLY: '/analytics/reports/monthly',
      YEARLY: '/analytics/reports/yearly',
      CUSTOM: '/analytics/reports/custom',
    },
  },

  // Staff management endpoints
  STAFF: {
    LIST: '/staff',
    CREATE: '/staff',
    GET_BY_ID: (id: string) => `/staff/${id}`,
    UPDATE: (id: string) => `/staff/${id}`,
    DELETE: (id: string) => `/staff/${id}`,
    PERFORMANCE: (id: string) => `/staff/${id}/performance`,
    SCHEDULE: '/staff/schedule',
    ATTENDANCE: '/staff/attendance',
    ROLES: '/staff/roles',
    PERMISSIONS: '/staff/permissions',
  },

  // Upload endpoints
  UPLOADS: {
    IMAGE: '/uploads/image',
    AVATAR: '/uploads/avatar',
    PRODUCT_IMAGE: '/uploads/product-image',
    BULK_IMAGES: '/uploads/bulk-images',
    PRESIGNED_URL: '/uploads/presigned-url',
  },

  // Settings endpoints
  SETTINGS: {
    BUSINESS: '/settings/business',
    TAX: '/settings/tax',
    RECEIPT: '/settings/receipt',
    PAYMENT: '/settings/payment',
    NOTIFICATIONS: '/settings/notifications',
    BACKUP: '/settings/backup',
    SYSTEM: '/settings/system',
  },

  // Admin endpoints
  ADMIN: {
    USERS: '/admin/users',
    SYSTEM_INFO: '/admin/system-info',
    LOGS: '/admin/logs',
    BACKUP: '/admin/backup',
    RESTORE: '/admin/restore',
    MAINTENANCE: '/admin/maintenance',
  },
} as const;

// Helper function to build URLs with query parameters
export const buildUrl = (endpoint: string, params?: Record<string, any>): string => {
  if (!params) return endpoint;
  
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `${endpoint}?${queryString}` : endpoint;
};

// Helper function to replace path parameters
export const buildPathUrl = (template: string, params: Record<string, string>): string => {
  let url = template;
  Object.entries(params).forEach(([key, value]) => {
    url = url.replace(`:${key}`, value);
  });
  return url;
};
