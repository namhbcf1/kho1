// Business domain types
export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  stock: number;
  minStock: number;
  maxStock?: number;
  barcode?: string;
  sku?: string;
  categoryId: string;
  supplierId?: string;
  images: string[];
  variants?: ProductVariant[];
  attributes?: ProductAttribute[];
  tags?: string[];
  active: boolean;
  featured: boolean;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  expirationDate?: string;
  batchNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  value: string;
  price?: number;
  stock?: number;
  sku?: string;
  barcode?: string;
}

export interface ProductAttribute {
  id: string;
  name: string;
  value: string;
  type: 'text' | 'number' | 'boolean' | 'select';
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  image?: string;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

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
  totalOrders: number;
  averageOrderValue: number;
  lastVisit?: string;
  tierId?: string;
  tier?: LoyaltyTier;
  preferences?: any;
  tags?: string[];
  notes?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  street: string;
  ward: string;
  district: string;
  province: string;
  postalCode?: string;
  country?: string;
}

export interface LoyaltyTier {
  id: string;
  name: string;
  minimumSpent: number;
  discountPercentage: number;
  pointsMultiplier: number;
  benefits: string[];
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId?: string;
  customerName?: string;
  cashierId: string;
  cashierName: string;
  items: OrderItem[];
  subtotal: number;
  discountType?: 'percentage' | 'fixed_amount';
  discountValue?: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'partial_refund';
  cashReceived?: number;
  changeAmount?: number;
  transactionId?: string;
  gatewayResponse?: any;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';
  notes?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  discountType?: string;
  discountValue?: number;
  discountAmount: number;
  total: number;
  notes?: string;
}

export interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  variantId?: string;
  stock: number;
  minStock: number;
  maxStock?: number;
  reservedStock: number;
  availableStock: number;
  lastUpdated: string;
}

export interface InventoryTransaction {
  id: string;
  productId: string;
  variantId?: string;
  type: 'sale' | 'purchase' | 'adjustment' | 'transfer' | 'return' | 'damage' | 'expired';
  quantity: number;
  unitCost?: number;
  totalCost?: number;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}
