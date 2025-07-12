// POS terminal state management with Zustand
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { apiClient } from '../services/api/client';
import { API_ENDPOINTS } from '../services/api/endpoints';
import { offlineSyncService } from '../services/pwa/offlineSync';
import type { Product, Customer, Order, OrderItem } from '../services/api/types';

export interface CartItem extends OrderItem {
  product: Product;
  discount?: number;
  discountType?: 'percentage' | 'amount';
  note?: string;
}

export interface POSState {
  // Cart state
  cart: CartItem[];
  customer: Customer | null;
  subtotal: number;
  discount: number;
  discountType: 'percentage' | 'amount';
  tax: number;
  total: number;
  cashReceived: number;
  change: number;
  
  // UI state
  isProcessing: boolean;
  error: string | null;
  searchQuery: string;
  selectedPaymentMethod: 'cash' | 'card' | 'vnpay' | 'momo' | 'zalopay' | 'bank_transfer';
  
  // Recent data
  recentProducts: Product[];
  recentCustomers: Customer[];
  recentOrders: Order[];
  
  // Actions
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartItem: (productId: string, updates: Partial<CartItem>) => void;
  clearCart: () => void;
  setCustomer: (customer: Customer | null) => void;
  setDiscount: (discount: number, type?: 'percentage' | 'amount') => void;
  setCashReceived: (amount: number) => void;
  setPaymentMethod: (method: POSState['selectedPaymentMethod']) => void;
  setSearchQuery: (query: string) => void;
  
  // Order processing
  processOrder: () => Promise<Order>;
  processRefund: (orderId: string, items: OrderItem[], reason?: string) => Promise<void>;
  
  // Data loading
  loadRecentProducts: () => Promise<void>;
  loadRecentCustomers: () => Promise<void>;
  loadRecentOrders: () => Promise<void>;
  searchProducts: (query: string) => Promise<Product[]>;
  searchCustomers: (query: string) => Promise<Customer[]>;
  
  // Calculations
  calculateTotals: () => void;
  clearError: () => void;
}

export const usePOSStore = create<POSState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        cart: [],
        customer: null,
        subtotal: 0,
        discount: 0,
        discountType: 'amount',
        tax: 0,
        total: 0,
        cashReceived: 0,
        change: 0,
        
        isProcessing: false,
        error: null,
        searchQuery: '',
        selectedPaymentMethod: 'cash',
        
        recentProducts: [],
        recentCustomers: [],
        recentOrders: [],

        // Cart actions
        addToCart: (product: Product, quantity = 1) => {
          const { cart } = get();
          const existingItem = cart.find(item => item.productId === product.id);
          
          if (existingItem) {
            // Update existing item
            get().updateCartItem(product.id, {
              quantity: existingItem.quantity + quantity,
            });
          } else {
            // Add new item
            const newItem: CartItem = {
              id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              orderId: '',
              productId: product.id,
              product,
              name: product.name,
              price: product.price,
              quantity,
              total: product.price * quantity,
            };
            
            set({ cart: [...cart, newItem] });
            get().calculateTotals();
          }
        },

        removeFromCart: (productId: string) => {
          const { cart } = get();
          const updatedCart = cart.filter(item => item.productId !== productId);
          set({ cart: updatedCart });
          get().calculateTotals();
        },

        updateCartItem: (productId: string, updates: Partial<CartItem>) => {
          const { cart } = get();
          const updatedCart = cart.map(item => {
            if (item.productId === productId) {
              const updatedItem = { ...item, ...updates };
              updatedItem.total = updatedItem.price * updatedItem.quantity;
              
              // Apply item discount
              if (updatedItem.discount && updatedItem.discount > 0) {
                if (updatedItem.discountType === 'percentage') {
                  updatedItem.total -= updatedItem.total * (updatedItem.discount / 100);
                } else {
                  updatedItem.total -= updatedItem.discount;
                }
              }
              
              return updatedItem;
            }
            return item;
          });
          
          set({ cart: updatedCart });
          get().calculateTotals();
        },

        clearCart: () => {
          set({
            cart: [],
            customer: null,
            subtotal: 0,
            discount: 0,
            tax: 0,
            total: 0,
            cashReceived: 0,
            change: 0,
            error: null,
          });
        },

        setCustomer: (customer: Customer | null) => {
          set({ customer });
        },

        setDiscount: (discount: number, type = 'amount') => {
          set({ discount, discountType: type });
          get().calculateTotals();
        },

        setCashReceived: (amount: number) => {
          const { total } = get();
          const change = Math.max(amount - total, 0);
          set({ cashReceived: amount, change });
        },

        setPaymentMethod: (method: POSState['selectedPaymentMethod']) => {
          set({ selectedPaymentMethod: method });
        },

        setSearchQuery: (query: string) => {
          set({ searchQuery: query });
        },

        // Order processing
        processOrder: async () => {
          const {
            cart,
            customer,
            subtotal,
            discount,
            discountType,
            tax,
            total,
            selectedPaymentMethod,
            cashReceived,
            change,
          } = get();

          if (cart.length === 0) {
            throw new Error('Giỏ hàng trống');
          }

          set({ isProcessing: true, error: null });

          try {
            const orderData = {
              customerId: customer?.id,
              items: cart.map(item => ({
                productId: item.productId,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                total: item.total,
              })),
              subtotal,
              discount,
              discountType,
              tax,
              total,
              paymentMethod: selectedPaymentMethod,
              cashReceived: selectedPaymentMethod === 'cash' ? cashReceived : undefined,
              change: selectedPaymentMethod === 'cash' ? change : undefined,
            };

            let order: Order;

            if (navigator.onLine) {
              // Online: process immediately
              const response = await apiClient.post(API_ENDPOINTS.POS.CREATE_ORDER, orderData);
              order = response.data;
            } else {
              // Offline: add to sync queue
              await offlineSyncService.addToQueue({
                type: 'order',
                action: 'create',
                data: orderData,
              });
              
              // Create temporary order for UI
              order = {
                id: `offline_${Date.now()}`,
                orderNumber: `OFF-${Date.now()}`,
                ...orderData,
                status: 'pending',
                paymentStatus: 'pending',
                cashierId: 'current_user',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              } as Order;
            }

            // Clear cart after successful order
            get().clearCart();
            
            // Add to recent orders
            const { recentOrders } = get();
            set({
              recentOrders: [order, ...recentOrders.slice(0, 9)],
              isProcessing: false,
            });

            return order;
          } catch (error) {
            set({
              isProcessing: false,
              error: error instanceof Error ? error.message : 'Xử lý đơn hàng thất bại',
            });
            throw error;
          }
        },

        processRefund: async (orderId: string, items: OrderItem[], reason?: string) => {
          set({ isProcessing: true, error: null });

          try {
            const refundData = {
              orderId,
              items,
              reason,
            };

            if (navigator.onLine) {
              await apiClient.post(`${API_ENDPOINTS.ORDERS.REFUND(orderId)}`, refundData);
            } else {
              await offlineSyncService.addToQueue({
                type: 'order',
                action: 'update',
                data: { id: orderId, status: 'refunded', refundData },
              });
            }

            set({ isProcessing: false });
          } catch (error) {
            set({
              isProcessing: false,
              error: error instanceof Error ? error.message : 'Hoàn trả thất bại',
            });
            throw error;
          }
        },

        // Data loading
        loadRecentProducts: async () => {
          try {
            const response = await apiClient.get(API_ENDPOINTS.POS.PRODUCTS);
            set({ recentProducts: response.data || [] });
          } catch (error) {
            console.error('Load recent products error:', error);
          }
        },

        loadRecentCustomers: async () => {
          try {
            const response = await apiClient.get(API_ENDPOINTS.POS.CUSTOMERS);
            set({ recentCustomers: response.data || [] });
          } catch (error) {
            console.error('Load recent customers error:', error);
          }
        },

        loadRecentOrders: async () => {
          try {
            const response = await apiClient.get(API_ENDPOINTS.POS.ORDERS);
            set({ recentOrders: response.data || [] });
          } catch (error) {
            console.error('Load recent orders error:', error);
          }
        },

        searchProducts: async (query: string) => {
          try {
            const response = await apiClient.get(
              `${API_ENDPOINTS.POS.SEARCH_PRODUCTS}?q=${encodeURIComponent(query)}`
            );
            return response.data || [];
          } catch (error) {
            console.error('Search products error:', error);
            return [];
          }
        },

        searchCustomers: async (query: string) => {
          try {
            const response = await apiClient.get(
              `${API_ENDPOINTS.POS.SEARCH_CUSTOMERS}?q=${encodeURIComponent(query)}`
            );
            return response.data || [];
          } catch (error) {
            console.error('Search customers error:', error);
            return [];
          }
        },

        // Calculations
        calculateTotals: () => {
          const { cart, discount, discountType } = get();
          
          const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
          
          let discountAmount = 0;
          if (discount > 0) {
            if (discountType === 'percentage') {
              discountAmount = subtotal * (discount / 100);
            } else {
              discountAmount = Math.min(discount, subtotal);
            }
          }
          
          const afterDiscount = subtotal - discountAmount;
          const taxAmount = afterDiscount * 0.1; // 10% VAT
          const total = afterDiscount + taxAmount;
          
          set({
            subtotal,
            tax: taxAmount,
            total,
          });
          
          // Update change if cash received is set
          const { cashReceived } = get();
          if (cashReceived > 0) {
            set({ change: Math.max(cashReceived - total, 0) });
          }
        },

        clearError: () => {
          set({ error: null });
        },
      }),
      {
        name: 'pos-store',
        partialize: (state) => ({
          cart: state.cart,
          customer: state.customer,
          discount: state.discount,
          discountType: state.discountType,
          selectedPaymentMethod: state.selectedPaymentMethod,
        }),
      }
    ),
    {
      name: 'pos-store',
    }
  )
);

// Selectors
export const usePOSCart = () => usePOSStore((state) => ({
  cart: state.cart,
  customer: state.customer,
  subtotal: state.subtotal,
  discount: state.discount,
  discountType: state.discountType,
  tax: state.tax,
  total: state.total,
  cashReceived: state.cashReceived,
  change: state.change,
}));

export const usePOSActions = () => usePOSStore((state) => ({
  addToCart: state.addToCart,
  removeFromCart: state.removeFromCart,
  updateCartItem: state.updateCartItem,
  clearCart: state.clearCart,
  setCustomer: state.setCustomer,
  setDiscount: state.setDiscount,
  setCashReceived: state.setCashReceived,
  setPaymentMethod: state.setPaymentMethod,
  processOrder: state.processOrder,
  processRefund: state.processRefund,
}));

export const usePOSData = () => usePOSStore((state) => ({
  recentProducts: state.recentProducts,
  recentCustomers: state.recentCustomers,
  recentOrders: state.recentOrders,
  searchProducts: state.searchProducts,
  searchCustomers: state.searchCustomers,
  loadRecentProducts: state.loadRecentProducts,
  loadRecentCustomers: state.loadRecentCustomers,
  loadRecentOrders: state.loadRecentOrders,
}));
