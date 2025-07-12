// Permission constants for role-based access control
export const PERMISSIONS = {
  // POS permissions
  POS_ACCESS: 'pos.access',
  POS_REFUND: 'pos.refund',
  POS_DISCOUNT: 'pos.discount',
  POS_VOID_TRANSACTION: 'pos.void_transaction',
  
  // Product permissions
  PRODUCT_VIEW: 'product.view',
  PRODUCT_CREATE: 'product.create',
  PRODUCT_UPDATE: 'product.update',
  PRODUCT_DELETE: 'product.delete',
  PRODUCT_IMPORT: 'product.import',
  PRODUCT_EXPORT: 'product.export',
  
  // Category permissions
  CATEGORY_VIEW: 'category.view',
  CATEGORY_CREATE: 'category.create',
  CATEGORY_UPDATE: 'category.update',
  CATEGORY_DELETE: 'category.delete',
  
  // Inventory permissions
  INVENTORY_VIEW: 'inventory.view',
  INVENTORY_UPDATE: 'inventory.update',
  INVENTORY_ADJUSTMENT: 'inventory.adjustment',
  INVENTORY_TRANSFER: 'inventory.transfer',
  
  // Customer permissions
  CUSTOMER_VIEW: 'customer.view',
  CUSTOMER_CREATE: 'customer.create',
  CUSTOMER_UPDATE: 'customer.update',
  CUSTOMER_DELETE: 'customer.delete',
  CUSTOMER_EXPORT: 'customer.export',
  
  // Order permissions
  ORDER_VIEW: 'order.view',
  ORDER_CREATE: 'order.create',
  ORDER_UPDATE: 'order.update',
  ORDER_DELETE: 'order.delete',
  ORDER_REFUND: 'order.refund',
  ORDER_CANCEL: 'order.cancel',
  
  // Analytics permissions
  ANALYTICS_VIEW: 'analytics.view',
  ANALYTICS_EXPORT: 'analytics.export',
  ANALYTICS_SALES: 'analytics.sales',
  ANALYTICS_REVENUE: 'analytics.revenue',
  ANALYTICS_INVENTORY: 'analytics.inventory',
  ANALYTICS_CUSTOMER: 'analytics.customer',
  
  // Payment permissions
  PAYMENT_VIEW: 'payment.view',
  PAYMENT_PROCESS: 'payment.process',
  PAYMENT_REFUND: 'payment.refund',
  PAYMENT_CONFIG: 'payment.config',
  
  // Staff permissions
  STAFF_VIEW: 'staff.view',
  STAFF_CREATE: 'staff.create',
  STAFF_UPDATE: 'staff.update',
  STAFF_DELETE: 'staff.delete',
  STAFF_MANAGE: 'staff.manage',
  STAFF_SCHEDULE: 'staff.schedule',
  STAFF_PERFORMANCE: 'staff.performance',
  
  // Settings permissions
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_UPDATE: 'settings.update',
  SETTINGS_BUSINESS: 'settings.business',
  SETTINGS_TAX: 'settings.tax',
  SETTINGS_RECEIPT: 'settings.receipt',
  SETTINGS_PAYMENT: 'settings.payment',
  SETTINGS_BACKUP: 'settings.backup',
  SETTINGS_SYSTEM: 'settings.system',
  
  // System permissions
  SYSTEM_ADMIN: 'system.admin',
  SYSTEM_BACKUP: 'system.backup',
  SYSTEM_RESTORE: 'system.restore',
  SYSTEM_MAINTENANCE: 'system.maintenance',
  SYSTEM_LOGS: 'system.logs',
  
  // User management permissions
  USER_VIEW: 'user.view',
  USER_CREATE: 'user.create',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
  USER_PERMISSIONS: 'user.permissions',
  USER_ROLES: 'user.roles',
} as const;

// Role-based permission mapping
export const ROLE_PERMISSIONS = {
  admin: [
    // All permissions
    ...Object.values(PERMISSIONS),
  ],
  
  manager: [
    // POS permissions
    PERMISSIONS.POS_ACCESS,
    PERMISSIONS.POS_REFUND,
    PERMISSIONS.POS_DISCOUNT,
    
    // Product permissions
    PERMISSIONS.PRODUCT_VIEW,
    PERMISSIONS.PRODUCT_CREATE,
    PERMISSIONS.PRODUCT_UPDATE,
    PERMISSIONS.PRODUCT_DELETE,
    PERMISSIONS.PRODUCT_IMPORT,
    PERMISSIONS.PRODUCT_EXPORT,
    
    // Category permissions
    PERMISSIONS.CATEGORY_VIEW,
    PERMISSIONS.CATEGORY_CREATE,
    PERMISSIONS.CATEGORY_UPDATE,
    PERMISSIONS.CATEGORY_DELETE,
    
    // Inventory permissions
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_UPDATE,
    PERMISSIONS.INVENTORY_ADJUSTMENT,
    
    // Customer permissions
    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.CUSTOMER_CREATE,
    PERMISSIONS.CUSTOMER_UPDATE,
    PERMISSIONS.CUSTOMER_DELETE,
    PERMISSIONS.CUSTOMER_EXPORT,
    
    // Order permissions
    PERMISSIONS.ORDER_VIEW,
    PERMISSIONS.ORDER_CREATE,
    PERMISSIONS.ORDER_UPDATE,
    PERMISSIONS.ORDER_REFUND,
    PERMISSIONS.ORDER_CANCEL,
    
    // Analytics permissions
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.ANALYTICS_EXPORT,
    PERMISSIONS.ANALYTICS_SALES,
    PERMISSIONS.ANALYTICS_REVENUE,
    PERMISSIONS.ANALYTICS_INVENTORY,
    PERMISSIONS.ANALYTICS_CUSTOMER,
    
    // Payment permissions
    PERMISSIONS.PAYMENT_VIEW,
    PERMISSIONS.PAYMENT_PROCESS,
    PERMISSIONS.PAYMENT_REFUND,
    
    // Staff permissions
    PERMISSIONS.STAFF_VIEW,
    PERMISSIONS.STAFF_SCHEDULE,
    PERMISSIONS.STAFF_PERFORMANCE,
    
    // Settings permissions (limited)
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_RECEIPT,
  ],
  
  cashier: [
    // POS permissions
    PERMISSIONS.POS_ACCESS,
    
    // Product permissions (read-only)
    PERMISSIONS.PRODUCT_VIEW,
    
    // Customer permissions
    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.CUSTOMER_CREATE,
    PERMISSIONS.CUSTOMER_UPDATE,
    
    // Order permissions
    PERMISSIONS.ORDER_VIEW,
    PERMISSIONS.ORDER_CREATE,
    
    // Payment permissions
    PERMISSIONS.PAYMENT_VIEW,
    PERMISSIONS.PAYMENT_PROCESS,
  ],
  
  staff: [
    // POS permissions (basic)
    PERMISSIONS.POS_ACCESS,
    
    // Product permissions (read-only)
    PERMISSIONS.PRODUCT_VIEW,
    
    // Customer permissions (read-only)
    PERMISSIONS.CUSTOMER_VIEW,
    
    // Order permissions (read-only)
    PERMISSIONS.ORDER_VIEW,
  ],
} as const;

// Permission groups for easier management
export const PERMISSION_GROUPS = {
  POS: [
    PERMISSIONS.POS_ACCESS,
    PERMISSIONS.POS_REFUND,
    PERMISSIONS.POS_DISCOUNT,
    PERMISSIONS.POS_VOID_TRANSACTION,
  ],
  
  PRODUCT_MANAGEMENT: [
    PERMISSIONS.PRODUCT_VIEW,
    PERMISSIONS.PRODUCT_CREATE,
    PERMISSIONS.PRODUCT_UPDATE,
    PERMISSIONS.PRODUCT_DELETE,
    PERMISSIONS.PRODUCT_IMPORT,
    PERMISSIONS.PRODUCT_EXPORT,
    PERMISSIONS.CATEGORY_VIEW,
    PERMISSIONS.CATEGORY_CREATE,
    PERMISSIONS.CATEGORY_UPDATE,
    PERMISSIONS.CATEGORY_DELETE,
  ],
  
  INVENTORY_MANAGEMENT: [
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_UPDATE,
    PERMISSIONS.INVENTORY_ADJUSTMENT,
    PERMISSIONS.INVENTORY_TRANSFER,
  ],
  
  CUSTOMER_MANAGEMENT: [
    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.CUSTOMER_CREATE,
    PERMISSIONS.CUSTOMER_UPDATE,
    PERMISSIONS.CUSTOMER_DELETE,
    PERMISSIONS.CUSTOMER_EXPORT,
  ],
  
  ORDER_MANAGEMENT: [
    PERMISSIONS.ORDER_VIEW,
    PERMISSIONS.ORDER_CREATE,
    PERMISSIONS.ORDER_UPDATE,
    PERMISSIONS.ORDER_DELETE,
    PERMISSIONS.ORDER_REFUND,
    PERMISSIONS.ORDER_CANCEL,
  ],
  
  ANALYTICS: [
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.ANALYTICS_EXPORT,
    PERMISSIONS.ANALYTICS_SALES,
    PERMISSIONS.ANALYTICS_REVENUE,
    PERMISSIONS.ANALYTICS_INVENTORY,
    PERMISSIONS.ANALYTICS_CUSTOMER,
  ],
  
  STAFF_MANAGEMENT: [
    PERMISSIONS.STAFF_VIEW,
    PERMISSIONS.STAFF_CREATE,
    PERMISSIONS.STAFF_UPDATE,
    PERMISSIONS.STAFF_DELETE,
    PERMISSIONS.STAFF_MANAGE,
    PERMISSIONS.STAFF_SCHEDULE,
    PERMISSIONS.STAFF_PERFORMANCE,
  ],
  
  SYSTEM_SETTINGS: [
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_UPDATE,
    PERMISSIONS.SETTINGS_BUSINESS,
    PERMISSIONS.SETTINGS_TAX,
    PERMISSIONS.SETTINGS_RECEIPT,
    PERMISSIONS.SETTINGS_PAYMENT,
    PERMISSIONS.SETTINGS_BACKUP,
    PERMISSIONS.SETTINGS_SYSTEM,
  ],
  
  SYSTEM_ADMIN: [
    PERMISSIONS.SYSTEM_ADMIN,
    PERMISSIONS.SYSTEM_BACKUP,
    PERMISSIONS.SYSTEM_RESTORE,
    PERMISSIONS.SYSTEM_MAINTENANCE,
    PERMISSIONS.SYSTEM_LOGS,
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.USER_PERMISSIONS,
    PERMISSIONS.USER_ROLES,
  ],
} as const;
