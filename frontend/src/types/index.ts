// Export all frontend types
export * from './global';

// Re-export shared types for convenience
export * from '../../../shared/types';

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
