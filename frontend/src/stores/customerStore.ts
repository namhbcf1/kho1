// Customer management state
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: {
    street: string;
    ward: string;
    district: string;
    province: string;
  };
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  loyaltyPoints: number;
  totalSpent: number;
  totalOrders: number;
  averageOrderValue: number;
  lastVisit?: string;
  tierId?: string;
  tier?: {
    id: string;
    name: string;
    discountPercentage: number;
    pointsMultiplier: number;
  };
  preferences?: any;
  tags?: string[];
  notes?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CustomerStore {
  // State
  customers: Customer[];
  selectedCustomer: Customer | null;
  loading: boolean;
  error: string | null;
  searchTerm: string;
  filters: {
    tier?: string;
    active?: boolean;
    hasEmail?: boolean;
    hasPhone?: boolean;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
  };

  // Actions
  setCustomers: (customers: Customer[]) => void;
  setSelectedCustomer: (customer: Customer | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchTerm: (term: string) => void;
  setFilters: (filters: any) => void;
  setPagination: (pagination: any) => void;
  
  // Customer actions
  addCustomer: (customer: Customer) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  removeCustomer: (id: string) => void;
  
  // Loyalty actions
  addLoyaltyPoints: (customerId: string, points: number) => void;
  redeemLoyaltyPoints: (customerId: string, points: number) => void;
  updateTotalSpent: (customerId: string, amount: number) => void;
  
  // Utility actions
  getCustomerById: (id: string) => Customer | undefined;
  getCustomerByPhone: (phone: string) => Customer | undefined;
  getCustomerByEmail: (email: string) => Customer | undefined;
  getCustomersByTier: (tierId: string) => Customer[];
  getTopCustomers: (limit?: number) => Customer[];
  searchCustomers: (term: string) => Customer[];
  clearFilters: () => void;
  reset: () => void;
}

const initialState = {
  customers: [],
  selectedCustomer: null,
  loading: false,
  error: null,
  searchTerm: '',
  filters: {},
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
  },
};

export const useCustomerStore = create<CustomerStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Setters
        setCustomers: (customers) => set({ customers }),
        setSelectedCustomer: (customer) => set({ selectedCustomer: customer }),
        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error }),
        setSearchTerm: (term) => set({ searchTerm: term }),
        setFilters: (filters) => set({ filters: { ...get().filters, ...filters } }),
        setPagination: (pagination) => set({ pagination: { ...get().pagination, ...pagination } }),

        // Customer actions
        addCustomer: (customer) => set((state) => ({
          customers: [customer, ...state.customers],
        })),

        updateCustomer: (id, updates) => set((state) => ({
          customers: state.customers.map(customer =>
            customer.id === id ? { ...customer, ...updates } : customer
          ),
          selectedCustomer: state.selectedCustomer?.id === id
            ? { ...state.selectedCustomer, ...updates }
            : state.selectedCustomer,
        })),

        removeCustomer: (id) => set((state) => ({
          customers: state.customers.filter(customer => customer.id !== id),
          selectedCustomer: state.selectedCustomer?.id === id ? null : state.selectedCustomer,
        })),

        // Loyalty actions
        addLoyaltyPoints: (customerId, points) => set((state) => ({
          customers: state.customers.map(customer =>
            customer.id === customerId
              ? { ...customer, loyaltyPoints: customer.loyaltyPoints + points }
              : customer
          ),
        })),

        redeemLoyaltyPoints: (customerId, points) => set((state) => ({
          customers: state.customers.map(customer =>
            customer.id === customerId
              ? { ...customer, loyaltyPoints: Math.max(0, customer.loyaltyPoints - points) }
              : customer
          ),
        })),

        updateTotalSpent: (customerId, amount) => set((state) => ({
          customers: state.customers.map(customer =>
            customer.id === customerId
              ? {
                  ...customer,
                  totalSpent: customer.totalSpent + amount,
                  totalOrders: customer.totalOrders + 1,
                  averageOrderValue: (customer.totalSpent + amount) / (customer.totalOrders + 1),
                  lastVisit: new Date().toISOString(),
                }
              : customer
          ),
        })),

        // Utility functions
        getCustomerById: (id) => {
          return get().customers.find(customer => customer.id === id);
        },

        getCustomerByPhone: (phone) => {
          return get().customers.find(customer => customer.phone === phone);
        },

        getCustomerByEmail: (email) => {
          return get().customers.find(customer => customer.email === email);
        },

        getCustomersByTier: (tierId) => {
          return get().customers.filter(customer => customer.tierId === tierId);
        },

        getTopCustomers: (limit = 10) => {
          return get().customers
            .filter(customer => customer.active)
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, limit);
        },

        searchCustomers: (term) => {
          const searchTerm = term.toLowerCase();
          return get().customers.filter(customer =>
            customer.name.toLowerCase().includes(searchTerm) ||
            customer.email?.toLowerCase().includes(searchTerm) ||
            customer.phone?.includes(searchTerm)
          );
        },

        clearFilters: () => set({
          filters: {},
          searchTerm: '',
        }),

        reset: () => set(initialState),
      }),
      {
        name: 'customer-store',
        partialize: (state) => ({
          customers: state.customers,
        }),
      }
    ),
    { name: 'CustomerStore' }
  )
);
