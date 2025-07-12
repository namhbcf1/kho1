// Business logic constants
export const TAX_RATES = {
  STANDARD: 0.1, // 10% VAT
  REDUCED: 0.05, // 5% VAT for some goods
  ZERO: 0, // 0% VAT for exports
} as const;

export const DISCOUNT_TYPES = {
  PERCENTAGE: 'percentage',
  FIXED_AMOUNT: 'fixed_amount',
  BUY_X_GET_Y: 'buy_x_get_y',
} as const;

export const INVENTORY_TRANSACTION_TYPES = {
  SALE: 'sale',
  PURCHASE: 'purchase',
  ADJUSTMENT: 'adjustment',
  TRANSFER: 'transfer',
  RETURN: 'return',
  DAMAGE: 'damage',
  EXPIRED: 'expired',
} as const;

export const PRODUCT_CATEGORIES = [
  'Đồ uống',
  'Thức ăn',
  'Bánh kẹo',
  'Gia vị',
  'Đồ gia dụng',
  'Văn phòng phẩm',
  'Mỹ phẩm',
  'Thuốc',
  'Điện tử',
  'Thời trang',
  'Khác',
] as const;

export const UNITS_OF_MEASURE = [
  'Cái',
  'Chiếc',
  'Hộp',
  'Chai',
  'Lon',
  'Gói',
  'Kg',
  'Gram',
  'Lít',
  'Ml',
  'Mét',
  'Cm',
  'Tá',
  'Chục',
  'Trăm',
] as const;

export const RECEIPT_TEMPLATES = {
  STANDARD: 'standard',
  COMPACT: 'compact',
  DETAILED: 'detailed',
  THERMAL: 'thermal',
} as const;

export const RECEIPT_SIZES = {
  A4: { width: 210, height: 297 },
  THERMAL_58: { width: 58, height: 'auto' },
  THERMAL_80: { width: 80, height: 'auto' },
} as const;

export const WORKING_HOURS = {
  MONDAY: { start: '08:00', end: '22:00' },
  TUESDAY: { start: '08:00', end: '22:00' },
  WEDNESDAY: { start: '08:00', end: '22:00' },
  THURSDAY: { start: '08:00', end: '22:00' },
  FRIDAY: { start: '08:00', end: '22:00' },
  SATURDAY: { start: '08:00', end: '22:00' },
  SUNDAY: { start: '09:00', end: '21:00' },
} as const;

export const NOTIFICATION_TYPES = {
  LOW_STOCK: 'low_stock',
  OUT_OF_STOCK: 'out_of_stock',
  NEW_ORDER: 'new_order',
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',
  CUSTOMER_BIRTHDAY: 'customer_birthday',
  PROMOTION: 'promotion',
  SYSTEM_UPDATE: 'system_update',
} as const;

export const REPORT_TYPES = {
  DAILY_SALES: 'daily_sales',
  WEEKLY_SALES: 'weekly_sales',
  MONTHLY_SALES: 'monthly_sales',
  PRODUCT_PERFORMANCE: 'product_performance',
  CUSTOMER_ANALYSIS: 'customer_analysis',
  INVENTORY_REPORT: 'inventory_report',
  PROFIT_LOSS: 'profit_loss',
  TAX_REPORT: 'tax_report',
} as const;

export const BACKUP_FREQUENCIES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  MANUAL: 'manual',
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  CASHIER: 'cashier',
  STAFF: 'staff',
} as const;

export const USER_PERMISSIONS = {
  VIEW_DASHBOARD: 'view_dashboard',
  MANAGE_PRODUCTS: 'manage_products',
  MANAGE_CUSTOMERS: 'manage_customers',
  PROCESS_ORDERS: 'process_orders',
  VIEW_REPORTS: 'view_reports',
  MANAGE_SETTINGS: 'manage_settings',
  MANAGE_USERS: 'manage_users',
  MANAGE_INVENTORY: 'manage_inventory',
  PROCESS_REFUNDS: 'process_refunds',
} as const;
