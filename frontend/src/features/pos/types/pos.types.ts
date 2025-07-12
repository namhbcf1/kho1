export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  categoryId: string;
  barcode?: string;
  image?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  barcode?: string;
  image?: string;
  maxStock: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
  cashReceived?: number;
  change?: number;
  status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  customerId?: string;
  customerName?: string;
  cashierId: string;
  cashierName: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export interface POSTerminalProps {
  onOrderComplete?: (order: Order) => void;
}

export interface ProductGridProps {
  products: Product[];
  loading?: boolean;
  onProductSelect?: (product: Product) => void;
}

export interface ShoppingCartProps {
  items: CartItem[];
  onUpdateQuantity?: (productId: string, quantity: number) => void;
  onRemoveItem?: (productId: string) => void;
  onClear?: () => void;
  total: number;
}

export interface PaymentMethodsProps {
  visible: boolean;
  cart: CartItem[];
  total: number;
  onPaymentComplete?: (paymentData: PaymentData) => void;
  onCancel?: () => void;
}

export interface PaymentData {
  method: 'cash' | 'card' | 'vnpay' | 'momo' | 'zalopay';
  total: number;
  cashReceived?: number;
  change?: number;
  items: CartItem[];
}
