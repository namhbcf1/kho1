// Order processing state
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface OrderItem {
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

interface Order {
  id: string;
  orderNumber: string;
  customerId?: string;
  customerName?: string;
  cashierId: string;
  cashierName: string;
  items: OrderItem[];
  subtotal: number;
  discountType?: string;
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

interface OrderStore {
  // State
  orders: Order[];
  selectedOrder: Order | null;
  loading: boolean;
  error: string | null;
  filters: {
    status?: string;
    paymentMethod?: string;
    paymentStatus?: string;
    customerId?: string;
    dateRange?: [string, string];
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
  };

  // Actions
  setOrders: (orders: Order[]) => void;
  setSelectedOrder: (order: Order | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: any) => void;
  setPagination: (pagination: any) => void;
  
  // Order actions
  addOrder: (order: Order) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  removeOrder: (id: string) => void;
  updateOrderStatus: (id: string, status: Order['status']) => void;
  updatePaymentStatus: (id: string, status: Order['paymentStatus']) => void;
  
  // Utility actions
  getOrderById: (id: string) => Order | undefined;
  getOrderByNumber: (orderNumber: string) => Order | undefined;
  getOrdersByCustomer: (customerId: string) => Order[];
  getOrdersByStatus: (status: string) => Order[];
  getOrdersByPaymentMethod: (method: string) => Order[];
  getTodaysOrders: () => Order[];
  getOrdersInDateRange: (startDate: string, endDate: string) => Order[];
  calculateTotalRevenue: (orders?: Order[]) => number;
  calculateAverageOrderValue: (orders?: Order[]) => number;
  clearFilters: () => void;
  reset: () => void;
}

const initialState = {
  orders: [],
  selectedOrder: null,
  loading: false,
  error: null,
  filters: {},
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
  },
};

export const useOrderStore = create<OrderStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Setters
        setOrders: (orders) => set({ orders }),
        setSelectedOrder: (order) => set({ selectedOrder: order }),
        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error }),
        setFilters: (filters) => set({ filters: { ...get().filters, ...filters } }),
        setPagination: (pagination) => set({ pagination: { ...get().pagination, ...pagination } }),

        // Order actions
        addOrder: (order) => set((state) => ({
          orders: [order, ...state.orders],
        })),

        updateOrder: (id, updates) => set((state) => ({
          orders: state.orders.map(order =>
            order.id === id ? { ...order, ...updates } : order
          ),
          selectedOrder: state.selectedOrder?.id === id
            ? { ...state.selectedOrder, ...updates }
            : state.selectedOrder,
        })),

        removeOrder: (id) => set((state) => ({
          orders: state.orders.filter(order => order.id !== id),
          selectedOrder: state.selectedOrder?.id === id ? null : state.selectedOrder,
        })),

        updateOrderStatus: (id, status) => set((state) => ({
          orders: state.orders.map(order =>
            order.id === id ? { ...order, status, updatedAt: new Date().toISOString() } : order
          ),
        })),

        updatePaymentStatus: (id, paymentStatus) => set((state) => ({
          orders: state.orders.map(order =>
            order.id === id ? { ...order, paymentStatus, updatedAt: new Date().toISOString() } : order
          ),
        })),

        // Utility functions
        getOrderById: (id) => {
          return get().orders.find(order => order.id === id);
        },

        getOrderByNumber: (orderNumber) => {
          return get().orders.find(order => order.orderNumber === orderNumber);
        },

        getOrdersByCustomer: (customerId) => {
          return get().orders.filter(order => order.customerId === customerId);
        },

        getOrdersByStatus: (status) => {
          return get().orders.filter(order => order.status === status);
        },

        getOrdersByPaymentMethod: (method) => {
          return get().orders.filter(order => order.paymentMethod === method);
        },

        getTodaysOrders: () => {
          const today = new Date().toISOString().split('T')[0];
          return get().orders.filter(order => 
            order.createdAt.startsWith(today)
          );
        },

        getOrdersInDateRange: (startDate, endDate) => {
          return get().orders.filter(order => {
            const orderDate = order.createdAt.split('T')[0];
            return orderDate >= startDate && orderDate <= endDate;
          });
        },

        calculateTotalRevenue: (orders) => {
          const ordersToCalculate = orders || get().orders;
          return ordersToCalculate
            .filter(order => order.status === 'completed')
            .reduce((total, order) => total + order.total, 0);
        },

        calculateAverageOrderValue: (orders) => {
          const ordersToCalculate = orders || get().orders;
          const completedOrders = ordersToCalculate.filter(order => order.status === 'completed');
          if (completedOrders.length === 0) return 0;
          
          const totalRevenue = completedOrders.reduce((total, order) => total + order.total, 0);
          return totalRevenue / completedOrders.length;
        },

        clearFilters: () => set({
          filters: {},
        }),

        reset: () => set(initialState),
      }),
      {
        name: 'order-store',
        partialize: (state) => ({
          orders: state.orders.slice(0, 100), // Keep only recent 100 orders in storage
        }),
      }
    ),
    { name: 'OrderStore' }
  )
);
