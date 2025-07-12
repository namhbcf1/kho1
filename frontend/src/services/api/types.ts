// API response types for Cloudflare Workers backend

// Base API response structure
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: ValidationError[];
  meta?: ResponseMeta;
}

// Validation error structure
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Response metadata
export interface ResponseMeta {
  timestamp: string;
  requestId: string;
  version: string;
  pagination?: PaginationMeta;
}

// Pagination metadata
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Paginated response
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  data: T[];
  meta: ResponseMeta & {
    pagination: PaginationMeta;
  };
}

// Authentication responses
export interface LoginResponse extends ApiResponse {
  data: {
    user: User;
    token: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export interface RefreshTokenResponse extends ApiResponse {
  data: {
    token: string;
    expiresIn: number;
  };
}

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  position?: string;
  permissions: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'admin' | 'manager' | 'cashier' | 'staff';

// Product types
export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  stock: number;
  minStock?: number;
  barcode?: string;
  sku?: string;
  categoryId: string;
  category?: Category;
  images: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  parent?: Category;
  children?: Category[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// Customer types
export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: Address;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  loyaltyPoints: number;
  totalSpent: number;
  lastVisit?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  street?: string;
  ward?: string;
  district?: string;
  province?: string;
  country?: string;
  postalCode?: string;
}

// Order types
export interface Order {
  id: string;
  orderNumber: string;
  customerId?: string;
  customer?: Customer;
  cashierId: string;
  cashier?: User;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product?: Product;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export type PaymentMethod = 'cash' | 'card' | 'vnpay' | 'momo' | 'zalopay' | 'bank_transfer';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'partial_refund';
export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';

// Payment types
export interface Payment {
  id: string;
  orderId: string;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  transactionId?: string;
  gatewayResponse?: any;
  createdAt: string;
  updatedAt: string;
}

// Analytics types
export interface DashboardData {
  todaySales: SalesSummary;
  monthSales: SalesSummary;
  topProducts: TopProduct[];
  lowStockProducts: LowStockProduct[];
  recentOrders: Order[];
}

export interface SalesSummary {
  ordersCount: number;
  totalRevenue: number;
  averageOrderValue: number;
  growth: number;
}

export interface TopProduct {
  productId: string;
  name: string;
  totalSold: number;
  totalRevenue: number;
}

export interface LowStockProduct {
  productId: string;
  name: string;
  stock: number;
  minStock: number;
}

// Settings types
export interface BusinessSettings {
  id: string;
  name: string;
  address: Address;
  phone: string;
  email: string;
  website?: string;
  taxCode?: string;
  logo?: string;
  currency: string;
  timezone: string;
  language: string;
  taxRate: number;
  receiptTemplate?: string;
  updatedAt: string;
}

// Upload types
export interface UploadResponse extends ApiResponse {
  data: {
    filename: string;
    url: string;
    size: number;
    type: string;
  };
}

// Error types
export interface ApiError {
  message: string;
  code: string;
  status: number;
  details?: any;
}

// Request types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchParams extends PaginationParams {
  search?: string;
  filters?: Record<string, any>;
}

export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

// Cloudflare specific types
export interface CloudflareResponse<T = any> {
  result: T;
  success: boolean;
  errors: string[];
  messages: string[];
}

export interface D1Response<T = any> {
  results: T[];
  success: boolean;
  meta: {
    served_by: string;
    duration: number;
    changes: number;
    last_row_id: number;
    rows_read: number;
    rows_written: number;
  };
}

// WebSocket types for real-time updates
export interface WebSocketMessage<T = any> {
  type: string;
  data: T;
  timestamp: string;
}

export interface RealtimeUpdate {
  entity: 'order' | 'product' | 'customer' | 'inventory';
  action: 'create' | 'update' | 'delete';
  data: any;
}
