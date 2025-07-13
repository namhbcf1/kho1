// API request/response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchParams extends PaginationParams {
  q?: string;
  filters?: Record<string, any>;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  price: number;
  cost?: number;
  stock: number;
  minStock: number;
  categoryId: string;
  barcode?: string;
  images?: string[];
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  id: string;
}

export interface CreateOrderRequest {
  customerId?: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  paymentMethod: string;
  notes?: string;
}

export interface CreateCustomerRequest {
  name: string;
  email?: string;
  phone?: string;
  address?: {
    street: string;
    ward: string;
    district: string;
    province: string;
  };
}

export interface PaymentRequest {
  orderId: string;
  amount: number;
  method: 'vnpay' | 'momo' | 'zalopay';
  returnUrl?: string;
}

export interface PaymentResponse {
  paymentUrl: string;
  transactionId: string;
  qrCode?: string;
}

export interface PaginatedResponse<T = any> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SearchFilters {
  [key: string]: any;
}

export interface SortConfig {
  field: string;
  order: 'asc' | 'desc';
}

export interface ErrorResponse {
  code: string;
  message: string;
  details?: any;
  path?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}
