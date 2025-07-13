// Shared types and schemas exports

// Types (prefer schema-generated types over interface types where they conflict)
export type {
  // API types
  ApiResponse,
  PaginatedResponse,
  SearchFilters,
  SortConfig,
  ErrorResponse,
  ValidationError,
  CreateProductRequest,
  UpdateProductRequest,
  CreateOrderRequest,
  CreateCustomerRequest,
} from './types/api.types';

export type {
  // Vietnamese specific types
  VietnameseAddress,
  VietnameseProvince,
  VietnamesePhoneNumber,
  VietnamMobileCarrier,
} from './types/vietnamese.types';

export type {
  // Database types  
  DatabaseProduct,
  DatabaseCategory,
  DatabaseCustomer,
  DatabaseOrder,
  DatabaseOrderItem,
  DatabaseUser,
  DatabaseSession,
  DatabaseSettings,
  DatabaseAnalytics,
} from './types/database.types';

export type {
  // Cloudflare types
  CloudflareEnv,
  CloudflareBindings,
  CloudflareRequest,
  CloudflareResponse,
  D1Result,
  KVOperation,
  R2Operation,
} from './types/cloudflare.types';

// Export all constants
export * from './constants/vietnamese.constants';
export * from './constants/business.constants';
export * from './constants/api.constants';

// Export all schemas and their types (these take precedence over interfaces)
export * from './schemas/product.schemas';
export * from './schemas/order.schemas';
export * from './schemas/customer.schemas';
export * from './schemas/auth.schemas';

// Export utilities
export * from './utils/logger';
