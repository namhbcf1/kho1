import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  loyaltyPoints: number;
  totalSpent: number;
  joinDate: string;
  lastVisit?: string;
  orders?: string[]; // Order IDs
}

export interface LoyaltyTier {
  id: string;
  name: string;
  minSpent: number;
  pointsMultiplier: number;
  benefits: string[];
}

interface CustomerStore {
  customers: Customer[];
  loyaltyTiers: LoyaltyTier[];
  loading: boolean;
  error: string | null;
  
  // Customer actions
  addCustomer: (customer: Omit<Customer, 'id' | 'joinDate' | 'loyaltyTier' | 'loyaltyPoints' | 'totalSpent'>) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  getCustomer: (id: string) => Customer | undefined;
  searchCustomers: (query: string) => Customer[];
  
  // Loyalty actions
  addLoyaltyPoints: (customerId: string, points: number) => void;
  redeemLoyaltyPoints: (customerId: string, points: number) => boolean;
  updateTotalSpent: (customerId: string, amount: number) => void;
  updateLoyaltyTier: (customerId: string) => void;
  
  // Utility actions
  getCustomersByTier: (tier: string) => Customer[];
  getTopCustomers: (limit?: number) => Customer[];
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

// Initial mock data
const initialCustomers: Customer[] = [
  {
    id: 'KH001',
    name: 'Nguyễn Văn A',
    phone: '0901234567',
    email: 'nguyenvana@email.com',
    address: '123 Đường ABC, Quận 1, TP.HCM',
    loyaltyTier: 'gold',
    loyaltyPoints: 2500,
    totalSpent: 5200000,
    joinDate: '2023-01-15',
    lastVisit: '2024-01-15'
  },
  {
    id: 'KH002',
    name: 'Trần Thị B',
    phone: '0902345678',
    email: 'tranthib@email.com',
    address: '456 Đường XYZ, Quận 2, TP.HCM',
    loyaltyTier: 'silver',
    loyaltyPoints: 1200,
    totalSpent: 2800000,
    joinDate: '2023-03-20',
    lastVisit: '2024-01-14'
  },
  {
    id: 'KH003',
    name: 'Lê Văn C',
    phone: '0903456789',
    email: 'levanc@email.com',
    address: '789 Đường DEF, Quận 3, TP.HCM',
    loyaltyTier: 'bronze',
    loyaltyPoints: 500,
    totalSpent: 1200000,
    joinDate: '2023-06-10',
    lastVisit: '2024-01-13'
  },
  {
    id: 'KH004',
    name: 'Phạm Thị D',
    phone: '0904567890',
    email: 'phamthid@email.com',
    address: '321 Đường GHI, Quận 4, TP.HCM',
    loyaltyTier: 'platinum',
    loyaltyPoints: 5800,
    totalSpent: 12500000,
    joinDate: '2022-08-05',
    lastVisit: '2024-01-15'
  },
  {
    id: 'KH005',
    name: 'Hoàng Văn E',
    phone: '0905678901',
    email: 'hoangvane@email.com',
    address: '654 Đường JKL, Quận 5, TP.HCM',
    loyaltyTier: 'diamond',
    loyaltyPoints: 12000,
    totalSpent: 25000000,
    joinDate: '2022-03-12',
    lastVisit: '2024-01-15'
  }
];

const initialLoyaltyTiers: LoyaltyTier[] = [
  {
    id: 'bronze',
    name: 'Đồng',
    minSpent: 0,
    pointsMultiplier: 1,
    benefits: ['Tích điểm cơ bản', 'Nhận thông báo khuyến mãi']
  },
  {
    id: 'silver',
    name: 'Bạc',
    minSpent: 2000000,
    pointsMultiplier: 1.2,
    benefits: ['Tích điểm x1.2', 'Giảm giá 5%', 'Ưu tiên hỗ trợ']
  },
  {
    id: 'gold',
    name: 'Vàng',
    minSpent: 5000000,
    pointsMultiplier: 1.5,
    benefits: ['Tích điểm x1.5', 'Giảm giá 10%', 'Miễn phí giao hàng']
  },
  {
    id: 'platinum',
    name: 'Bạch kim',
    minSpent: 10000000,
    pointsMultiplier: 2,
    benefits: ['Tích điểm x2', 'Giảm giá 15%', 'Quà tặng sinh nhật']
  },
  {
    id: 'diamond',
    name: 'Kim cương',
    minSpent: 20000000,
    pointsMultiplier: 2.5,
    benefits: ['Tích điểm x2.5', 'Giảm giá 20%', 'Ưu tiên tuyệt đối']
  }
];

export const useCustomerStore = create<CustomerStore>()(
  persist(
    (set, get) => ({
      customers: initialCustomers,
      loyaltyTiers: initialLoyaltyTiers,
      loading: false,
      error: null,

      addCustomer: (customerData) => {
        const newCustomer: Customer = {
          ...customerData,
          id: `KH${(get().customers.length + 1).toString().padStart(3, '0')}`,
          loyaltyTier: 'bronze',
          loyaltyPoints: 0,
          totalSpent: 0,
          joinDate: new Date().toISOString()
        };
        
        set((state) => ({
          customers: [...state.customers, newCustomer]
        }));
      },

      updateCustomer: (id, updates) => {
        set((state) => ({
          customers: state.customers.map((customer) =>
            customer.id === id ? { ...customer, ...updates } : customer
          )
        }));
      },

      deleteCustomer: (id) => {
        set((state) => ({
          customers: state.customers.filter((customer) => customer.id !== id)
        }));
      },

      getCustomer: (id) => {
        return get().customers.find((customer) => customer.id === id);
      },

      searchCustomers: (query) => {
        const { customers } = get();
        const searchTerm = query.toLowerCase();
        
        return customers.filter(
          (customer) =>
            customer.name.toLowerCase().includes(searchTerm) ||
            customer.phone?.includes(query) ||
            customer.email?.toLowerCase().includes(searchTerm) ||
            customer.id.toLowerCase().includes(searchTerm)
        );
      },

      addLoyaltyPoints: (customerId, points) => {
        set((state) => ({
          customers: state.customers.map((customer) =>
            customer.id === customerId
              ? { ...customer, loyaltyPoints: customer.loyaltyPoints + points }
              : customer
          )
        }));
        
        get().updateLoyaltyTier(customerId);
      },

      redeemLoyaltyPoints: (customerId, points) => {
        const customer = get().getCustomer(customerId);
        if (!customer || customer.loyaltyPoints < points) {
          return false;
        }
        
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === customerId
              ? { ...c, loyaltyPoints: c.loyaltyPoints - points }
              : c
          )
        }));
        
        return true;
      },

      updateTotalSpent: (customerId, amount) => {
        set((state) => ({
          customers: state.customers.map((customer) =>
            customer.id === customerId
              ? { 
                  ...customer, 
                  totalSpent: customer.totalSpent + amount,
                  lastVisit: new Date().toISOString()
                }
              : customer
          )
        }));
        
        get().updateLoyaltyTier(customerId);
      },

      updateLoyaltyTier: (customerId) => {
        const customer = get().getCustomer(customerId);
        const { loyaltyTiers } = get();
        
        if (!customer) return;
        
        // Find the highest tier the customer qualifies for
        const qualifyingTier = loyaltyTiers
          .filter(tier => customer.totalSpent >= tier.minSpent)
          .sort((a, b) => b.minSpent - a.minSpent)[0];
        
        if (qualifyingTier && qualifyingTier.id !== customer.loyaltyTier) {
          get().updateCustomer(customerId, { loyaltyTier: qualifyingTier.id as Customer['loyaltyTier'] });
        }
      },

      getCustomersByTier: (tier) => {
        return get().customers.filter((customer) => customer.loyaltyTier === tier);
      },

      getTopCustomers: (limit = 10) => {
        return get().customers
          .sort((a, b) => b.totalSpent - a.totalSpent)
          .slice(0, limit);
      },

      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null })
    }),
    {
      name: 'customer-store',
      partialize: (state) => ({
        customers: state.customers,
        loyaltyTiers: state.loyaltyTiers
      })
    }
  )
);