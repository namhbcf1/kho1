// Export all frontend types
export * from './global';

// Re-export shared types for convenience (if available)
// export * from '../../../shared/types';

// Component prop types
export interface BaseComponentProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export interface LoadingProps {
  loading?: boolean;
  size?: 'small' | 'default' | 'large';
  tip?: string;
}

export interface ErrorProps {
  error?: string | Error | null;
  onRetry?: () => void;
}

// Form types
export interface FormFieldProps {
  name: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  help?: string;
  error?: string;
}

export interface FormSelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

// Table types
export interface TableColumn<T = any> {
  key: string;
  title: string;
  dataIndex?: string;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  sorter?: boolean | ((a: T, b: T) => number);
  render?: (value: any, record: T, index: number) => React.ReactNode;
  fixed?: 'left' | 'right';
}

export interface TableProps<T = any> {
  columns: TableColumn<T>[];
  dataSource: T[];
  loading?: boolean;
  pagination?: boolean | object;
  rowKey?: string | ((record: T) => string);
  onRow?: (record: T, index?: number) => object;
  scroll?: { x?: number | string; y?: number | string };
}

// Modal types
export interface ModalProps {
  open?: boolean;
  title?: string;
  width?: number | string;
  onOk?: () => void;
  onCancel?: () => void;
  okText?: string;
  cancelText?: string;
  confirmLoading?: boolean;
  destroyOnClose?: boolean;
}

// Chart types
export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: any;
}

export interface ChartProps {
  data: ChartDataPoint[];
  width?: number;
  height?: number;
  loading?: boolean;
}

// Vietnamese business types
export interface VietnameseFormData {
  name: string;
  phone?: string;
  email?: string;
  address?: {
    street?: string;
    ward?: string;
    district?: string;
    province?: string;
  };
  taxCode?: string;
  businessLicense?: string;
}

// POS specific types
export interface POSProduct {
  id: string;
  name: string;
  price: number;
  image?: string;
  barcode?: string;
  stock: number;
  category?: string;
}

export interface POSCartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
  discount?: number;
  note?: string;
}

export interface POSPayment {
  method: 'cash' | 'card' | 'vnpay' | 'momo' | 'zalopay' | 'bank_transfer';
  amount: number;
  received?: number;
  change?: number;
  transactionId?: string;
}

// Navigation types
export interface MenuItem {
  key: string;
  label: string;
  icon?: string;
  path?: string;
  permission?: string;
  children?: MenuItem[];
}

export interface BreadcrumbItem {
  title: string;
  path?: string;
}

// Notification types
export interface NotificationConfig {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  description?: string;
  duration?: number;
  placement?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
}

// Upload types
export interface UploadFile {
  uid: string;
  name: string;
  status: 'uploading' | 'done' | 'error' | 'removed';
  url?: string;
  thumbUrl?: string;
  size?: number;
  type?: string;
}

// Search types
export interface SearchFilters {
  [key: string]: any;
}

export interface SearchParams {
  query?: string;
  filters?: SearchFilters;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Analytics types
export interface KPIData {
  title: string;
  value: number | string;
  change?: number;
  changeType?: 'increase' | 'decrease';
  format?: 'number' | 'currency' | 'percentage';
  icon?: string;
  color?: string;
}

export interface ReportData {
  period: string;
  data: ChartDataPoint[];
  summary: {
    total: number;
    average: number;
    growth: number;
  };
}

// Settings types
export interface SettingsSection {
  key: string;
  title: string;
  description?: string;
  icon?: string;
  component: React.ComponentType;
}

// Theme types
export interface ThemeConfig {
  primaryColor: string;
  borderRadius: number;
  fontSize: number;
  algorithm?: 'defaultAlgorithm' | 'darkAlgorithm';
}

// Language types
export interface LanguageConfig {
  code: 'vi' | 'en';
  name: string;
  flag: string;
  rtl?: boolean;
}

// Device types
export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop';
  os: string;
  browser: string;
  screen: {
    width: number;
    height: number;
  };
  touch: boolean;
}

// PWA types
export interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface ServiceWorkerUpdate {
  waiting: ServiceWorker | null;
  skipWaiting: () => void;
}

// Cloudflare types
export interface CloudflareConfig {
  accountId: string;
  apiToken: string;
  d1DatabaseId: string;
  r2BucketName: string;
  kvNamespaces: {
    cache: string;
    sessions: string;
    rateLimits: string;
  };
}

// Error boundary types
export interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
  eventId?: string;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

// D1 Database Query Result Types
export interface D1DatabaseResult<T = any> {
  success: boolean;
  meta: {
    served_by: string;
    duration: number;
    changes: number;
    last_row_id: number;
    changed_db: boolean;
    size_after: number;
    rows_read: number;
    rows_written: number;
  };
  results: T[];
}

export interface D1QueryMeta {
  served_by: string;
  duration: number;
  changes: number;
  last_row_id: number;
  changed_db: boolean;
  size_after: number;
  rows_read: number;
  rows_written: number;
}

// Product database types
export interface ProductRecord {
  id: string;
  name: string;
  description?: string;
  price: number;
  cost_price?: number;
  sku?: string;
  barcode?: string;
  category_id?: string;
  brand?: string;
  unit?: string;
  stock_quantity: number;
  min_stock_level?: number;
  status: 'active' | 'inactive' | 'discontinued';
  vat_rate?: number;
  images?: string[];
  attributes?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Order database types
export interface OrderRecord {
  id: string;
  order_number: string;
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  change_amount: number;
  payment_method: string;
  payment_status: 'pending' | 'paid' | 'partially_paid' | 'refunded';
  order_status: 'draft' | 'completed' | 'cancelled' | 'refunded';
  cashier_id: string;
  cashier_name: string;
  notes?: string;
  receipt_printed: boolean;
  created_at: string;
  updated_at: string;
}

// Order items database types
export interface OrderItemRecord {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_sku?: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  vat_rate?: number;
  vat_amount: number;
  total_amount: number;
  created_at: string;
}

// Customer database types
export interface CustomerRecord {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  ward?: string;
  district?: string;
  province?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  loyalty_points: number;
  total_spent: number;
  visit_count: number;
  last_visit?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

// Inventory database types
export interface InventoryRecord {
  id: string;
  product_id: string;
  location?: string;
  quantity_available: number;
  quantity_reserved: number;
  quantity_incoming: number;
  quantity_damaged: number;
  last_stock_check?: string;
  created_at: string;
  updated_at: string;
}

// Staff database types
export interface StaffRecord {
  id: string;
  username: string;
  full_name: string;
  email?: string;
  phone?: string;
  role: 'admin' | 'manager' | 'cashier' | 'staff';
  permissions: string[];
  status: 'active' | 'inactive';
  last_login?: string;
  created_at: string;
  updated_at: string;
}

// Settings database types
export interface SettingsRecord {
  id: string;
  key: string;
  value: string;
  description?: string;
  category: string;
  data_type: 'string' | 'number' | 'boolean' | 'json';
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

// Analytics database types
export interface SalesAnalyticsRecord {
  date: string;
  total_sales: number;
  total_orders: number;
  average_order_value: number;
  top_products: string[];
  payment_methods: Record<string, number>;
  hourly_sales: Record<string, number>;
}

export interface InventoryAnalyticsRecord {
  product_id: string;
  product_name: string;
  current_stock: number;
  sold_quantity: number;
  revenue: number;
  profit: number;
  turnover_rate: number;
  days_of_supply: number;
}

// Loyalty program database types
export interface LoyaltyTransactionRecord {
  id: string;
  customer_id: string;
  order_id?: string;
  points_earned: number;
  points_redeemed: number;
  transaction_type: 'earn' | 'redeem' | 'expire' | 'adjust';
  description?: string;
  created_at: string;
}

// Form types with proper Ant Design compatibility
export interface FormFieldConfig {
  name: string | string[];
  label?: string;
  rules?: any[];
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  help?: string;
  tooltip?: string;
  dependencies?: string[];
  shouldUpdate?: boolean | ((prevValues: any, curValues: any) => boolean);
}

export interface FormSelectConfig extends FormFieldConfig {
  options: FormSelectOption[];
  mode?: 'multiple' | 'tags';
  allowClear?: boolean;
  showSearch?: boolean;
  filterOption?: boolean | ((input: string, option: any) => boolean);
}

export interface FormInputConfig extends FormFieldConfig {
  type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url';
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  addonBefore?: React.ReactNode;
  addonAfter?: React.ReactNode;
  maxLength?: number;
  showCount?: boolean;
}
