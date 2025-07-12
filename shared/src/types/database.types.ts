// D1 database types
export interface DatabaseUser {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: 'admin' | 'manager' | 'cashier' | 'staff';
  active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  stock: number;
  min_stock: number;
  max_stock?: number;
  barcode?: string;
  sku?: string;
  category_id: string;
  supplier_id?: string;
  images: string; // JSON string
  variants?: string; // JSON string
  attributes?: string; // JSON string
  tags?: string; // JSON string
  active: boolean;
  featured: boolean;
  weight?: number;
  dimensions?: string; // JSON string
  expiration_date?: string;
  batch_number?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseCategory {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  image?: string;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DatabaseCustomer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string; // JSON string
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  loyalty_points: number;
  total_spent: number;
  total_orders: number;
  average_order_value: number;
  last_visit?: string;
  tier_id?: string;
  preferences?: string; // JSON string
  tags?: string; // JSON string
  notes?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabaseOrder {
  id: string;
  order_number: string;
  customer_id?: string;
  customer_name?: string;
  cashier_id: string;
  cashier_name: string;
  subtotal: number;
  discount_type?: 'percentage' | 'fixed_amount';
  discount_value?: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  payment_method: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded' | 'partial_refund';
  cash_received?: number;
  change_amount?: number;
  transaction_id?: string;
  gateway_response?: string; // JSON string
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';
  notes?: string;
  metadata?: string; // JSON string
  created_at: string;
  updated_at: string;
}

export interface DatabaseOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id?: string;
  name: string;
  price: number;
  quantity: number;
  discount_type?: string;
  discount_value?: number;
  discount_amount: number;
  total: number;
  notes?: string;
  created_at: string;
}

export interface DatabaseInventoryItem {
  id: string;
  product_id: string;
  product_name: string;
  variant_id?: string;
  stock: number;
  min_stock: number;
  max_stock?: number;
  reserved_stock: number;
  available_stock: number;
  last_updated: string;
}

export interface DatabaseInventoryTransaction {
  id: string;
  product_id: string;
  variant_id?: string;
  type: 'sale' | 'purchase' | 'adjustment' | 'transfer' | 'return' | 'damage' | 'expired';
  quantity: number;
  unit_cost?: number;
  total_cost?: number;
  reference_type?: string;
  reference_id?: string;
  notes?: string;
  created_by: string;
  created_at: string;
}

export interface DatabaseSettings {
  id: string;
  key: string;
  value: string; // JSON string
  category: 'business' | 'tax' | 'payment' | 'receipt' | 'language' | 'backup';
  created_at: string;
  updated_at: string;
}
