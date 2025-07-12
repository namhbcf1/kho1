// Business constants
export const TAX_RATES = {
  STANDARD: 0.1, // 10% VAT
  REDUCED: 0.05, // 5% VAT for some goods
  ZERO: 0, // 0% VAT for exports
  EXEMPT: -1, // Tax exempt
} as const;

export const DISCOUNT_TYPES = {
  PERCENTAGE: 'percentage',
  FIXED_AMOUNT: 'fixed_amount',
  BUY_X_GET_Y: 'buy_x_get_y',
  FREE_SHIPPING: 'free_shipping',
} as const;

export const INVENTORY_TRANSACTION_TYPES = {
  SALE: 'sale',
  PURCHASE: 'purchase',
  ADJUSTMENT: 'adjustment',
  TRANSFER: 'transfer',
  RETURN: 'return',
  DAMAGE: 'damage',
  EXPIRED: 'expired',
  LOST: 'lost',
  FOUND: 'found',
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
  'Sách báo',
  'Đồ chơi',
  'Thể thao',
  'Khác',
] as const;

export const RECEIPT_TEMPLATES = {
  STANDARD: 'standard',
  COMPACT: 'compact',
  DETAILED: 'detailed',
  THERMAL: 'thermal',
  MINIMAL: 'minimal',
} as const;

export const RECEIPT_SIZES = {
  A4: { width: 210, height: 297, unit: 'mm' },
  A5: { width: 148, height: 210, unit: 'mm' },
  THERMAL_58: { width: 58, height: 'auto', unit: 'mm' },
  THERMAL_80: { width: 80, height: 'auto', unit: 'mm' },
} as const;

export const WORKING_HOURS_DEFAULT = {
  MONDAY: { start: '08:00', end: '22:00', closed: false },
  TUESDAY: { start: '08:00', end: '22:00', closed: false },
  WEDNESDAY: { start: '08:00', end: '22:00', closed: false },
  THURSDAY: { start: '08:00', end: '22:00', closed: false },
  FRIDAY: { start: '08:00', end: '22:00', closed: false },
  SATURDAY: { start: '08:00', end: '22:00', closed: false },
  SUNDAY: { start: '09:00', end: '21:00', closed: false },
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
  BACKUP_COMPLETED: 'backup_completed',
  BACKUP_FAILED: 'backup_failed',
} as const;

export const REPORT_TYPES = {
  DAILY_SALES: 'daily_sales',
  WEEKLY_SALES: 'weekly_sales',
  MONTHLY_SALES: 'monthly_sales',
  QUARTERLY_SALES: 'quarterly_sales',
  YEARLY_SALES: 'yearly_sales',
  PRODUCT_PERFORMANCE: 'product_performance',
  CUSTOMER_ANALYSIS: 'customer_analysis',
  INVENTORY_REPORT: 'inventory_report',
  PROFIT_LOSS: 'profit_loss',
  TAX_REPORT: 'tax_report',
  STAFF_PERFORMANCE: 'staff_performance',
} as const;

export const BACKUP_FREQUENCIES = {
  MANUAL: 'manual',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
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
  MANAGE_STAFF: 'manage_staff',
  VIEW_ANALYTICS: 'view_analytics',
  EXPORT_DATA: 'export_data',
  BACKUP_RESTORE: 'backup_restore',
} as const;

export const LOYALTY_POINT_RULES = {
  POINTS_PER_VND: 0.001, // 1 point per 1000 VND
  MINIMUM_ORDER_FOR_POINTS: 10000, // Minimum 10,000 VND to earn points
  POINTS_EXPIRY_DAYS: 365, // Points expire after 1 year
  REDEMPTION_RATE: 1000, // 1000 points = 1000 VND
  MINIMUM_REDEMPTION: 1000, // Minimum 1000 points to redeem
} as const;

export const COMMISSION_RATES = {
  DEFAULT: 0.03, // 3% default commission
  MANAGER: 0.05, // 5% for managers
  SENIOR_STAFF: 0.04, // 4% for senior staff
  NEW_STAFF: 0.02, // 2% for new staff
} as const;
