import { create } from 'zustand';
import { Product } from './useProductStore';
import { 
  calculateVAT, 
  calculateLoyaltyPoints, 
  vietnamesePaymentMethods,
  formatVND 
} from '../utils/vietnamese';

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  price: number; // Price at time of adding to cart
  total: number;
}

export interface PaymentMethod {
  type: 'cash' | 'bank_transfer' | 'vnpay' | 'momo' | 'zalopay' | 'shopee_pay' | 'grab_pay' | 'credit_card' | 'debit_card';
  label: string;
  icon: string;
}

interface CartStore {
  items: CartItem[];
  subtotal: number;
  tax: number;
  taxRate: number;
  discount: number;
  total: number;
  loyaltyPointsEarned: number;
  customer?: {
    id: string;
    name: string;
    phone?: string;
    loyaltyPoints?: number;
    loyaltyTier?: string;
  };
  
  // Cart actions
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  
  // Customer actions
  setCustomer: (customer: CartStore['customer']) => void;
  clearCustomer: () => void;
  
  // Payment actions
  applyDiscount: (amount: number) => void;
  applyLoyaltyDiscount: (points: number) => void;
  setTaxRate: (rate: number) => void;
  calculateTotals: () => void;
  
  // Order actions
  createOrder: (paymentMethod: string, notes?: string) => Promise<any>;
  quickSale: (paymentMethod: string, receivedAmount?: number, notes?: string) => Promise<any>;
  
  // Vietnamese business logic
  calculateLoyaltyPoints: () => number;
  getPaymentMethods: () => PaymentMethod[];
  getFormattedTotal: () => string;
  getVietnameseInvoiceData: () => any;
  
  // Getters
  getItemCount: () => number;
  getCartSummary: () => {
    itemCount: number;
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    loyaltyPointsEarned: number;
    formattedTotal: string;
  };
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  subtotal: 0,
  tax: 0,
  taxRate: 10, // 10% VAT for Vietnam
  discount: 0,
  total: 0,
  loyaltyPointsEarned: 0,
  customer: undefined,

  addToCart: (product, quantity = 1) => {
    const { items } = get();
    const existingItem = items.find(item => item.product.id === product.id);
    
    if (existingItem) {
      // Update quantity if item already exists
      get().updateQuantity(product.id, existingItem.quantity + quantity);
    } else {
      // Add new item
      const newItem: CartItem = {
        id: `cart-${product.id}-${Date.now()}`,
        product,
        quantity,
        price: product.price,
        total: product.price * quantity
      };
      
      set((state) => ({
        items: [...state.items, newItem]
      }));
      
      get().calculateTotals();
    }
  },

  removeFromCart: (productId) => {
    set((state) => ({
      items: state.items.filter(item => item.product.id !== productId)
    }));
    get().calculateTotals();
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(productId);
      return;
    }
    
    set((state) => ({
      items: state.items.map(item =>
        item.product.id === productId
          ? { ...item, quantity, total: item.price * quantity }
          : item
      )
    }));
    
    get().calculateTotals();
  },

  clearCart: () => {
    set({
      items: [],
      subtotal: 0,
      tax: 0,
      discount: 0,
      total: 0,
      customer: undefined
    });
  },

  setCustomer: (customer) => {
    set({ customer });
  },

  clearCustomer: () => {
    set({ customer: undefined });
  },

  applyDiscount: (amount) => {
    set({ discount: Math.max(0, amount) });
    get().calculateTotals();
  },

  setTaxRate: (rate) => {
    set({ taxRate: Math.max(0, rate) });
    get().calculateTotals();
  },

  applyLoyaltyDiscount: (points) => {
    // 1 point = 1000 VND discount
    const discountAmount = points * 1000;
    set({ discount: discountAmount });
    get().calculateTotals();
  },

  calculateTotals: () => {
    const { items, taxRate, discount, customer } = get();
    
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = calculateVAT(subtotal);
    const total = subtotal + tax - discount;
    
    // Calculate loyalty points earned
    const loyaltyPointsEarned = customer?.loyaltyTier 
      ? calculateLoyaltyPoints(subtotal, customer.loyaltyTier)
      : calculateLoyaltyPoints(subtotal, 'bronze');
    
    set({
      subtotal,
      tax,
      total: Math.max(0, total),
      loyaltyPointsEarned
    });
  },

  // Vietnamese business logic implementations
  calculateLoyaltyPoints: () => {
    const { subtotal, customer } = get();
    return customer?.loyaltyTier 
      ? calculateLoyaltyPoints(subtotal, customer.loyaltyTier)
      : calculateLoyaltyPoints(subtotal, 'bronze');
  },

  getPaymentMethods: () => {
    return vietnamesePaymentMethods;
  },

  getFormattedTotal: () => {
    return formatVND(get().total);
  },

  getVietnameseInvoiceData: () => {
    const { items, subtotal, tax, total, customer } = get();
    
    return {
      items: items.map(item => ({
        ...item,
        formattedPrice: formatVND(item.price),
        formattedTotal: formatVND(item.total)
      })),
      subtotal,
      tax,
      total,
      formattedSubtotal: formatVND(subtotal),
      formattedTax: formatVND(tax),
      formattedTotal: formatVND(total),
      customer,
      invoiceDate: new Date().toISOString(),
      vatRate: 10,
      // Vietnamese business info
      seller: {
        name: 'KhoAugment POS',
        address: 'Địa chỉ cửa hàng',
        taxCode: '0123456789',
        phone: '1900-xxxx'
      }
    };
  },

  getItemCount: () => {
    return get().items.reduce((count, item) => count + item.quantity, 0);
  },

  getCartSummary: () => {
    const { items, subtotal, tax, discount, total, loyaltyPointsEarned } = get();
    return {
      itemCount: items.reduce((count, item) => count + item.quantity, 0),
      subtotal,
      tax,
      discount,
      total,
      loyaltyPointsEarned,
      formattedTotal: formatVND(total)
    };
  },

  // Order creation methods
  createOrder: async (paymentMethod: string, notes?: string) => {
    const { items, customer, discount, loyaltyPointsEarned } = get();
    
    if (items.length === 0) {
      throw new Error('Cart is empty');
    }

    const orderData = {
      items: items.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
      })),
      customer_id: customer?.id,
      payment_method: paymentMethod,
      discount,
      notes,
      loyalty_points_used: 0 // This would be calculated based on customer selection
    };

    try {
      const response = await fetch('/api/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const result = await response.json();
      
      if (result.success) {
        get().clearCart();
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to create order');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  quickSale: async (paymentMethod: string, receivedAmount?: number, notes?: string) => {
    const { items, customer, discount } = get();
    
    if (items.length === 0) {
      throw new Error('Cart is empty');
    }

    const saleData = {
      items: items.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
      })),
      payment_method: paymentMethod,
      customer_phone: customer?.phone,
      discount,
      received_amount: receivedAmount,
      notes
    };

    try {
      const response = await fetch('/api/v1/pos/quick-sale', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saleData),
      });

      if (!response.ok) {
        throw new Error('Failed to process quick sale');
      }

      const result = await response.json();
      
      if (result.success) {
        get().clearCart();
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to process quick sale');
      }
    } catch (error) {
      console.error('Error processing quick sale:', error);
      throw error;
    }
  }
}));