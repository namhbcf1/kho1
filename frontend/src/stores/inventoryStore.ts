// Inventory tracking state
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface InventoryItem {
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

interface InventoryTransaction {
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

interface InventoryStore {
  // State
  inventory: InventoryItem[];
  transactions: InventoryTransaction[];
  selectedItem: InventoryItem | null;
  loading: boolean;
  error: string | null;
  filters: {
    lowStock?: boolean;
    outOfStock?: boolean;
    category?: string;
  };

  // Actions
  setInventory: (inventory: InventoryItem[]) => void;
  setTransactions: (transactions: InventoryTransaction[]) => void;
  setSelectedItem: (item: InventoryItem | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: any) => void;
  
  // Inventory actions
  updateStock: (productId: string, quantity: number, type: string) => void;
  addTransaction: (transaction: InventoryTransaction) => void;
  adjustStock: (productId: string, newStock: number, reason: string) => void;
  reserveStock: (productId: string, quantity: number) => void;
  releaseReservedStock: (productId: string, quantity: number) => void;
  
  // Utility actions
  getInventoryByProduct: (productId: string) => InventoryItem | undefined;
  getLowStockItems: () => InventoryItem[];
  getOutOfStockItems: () => InventoryItem[];
  getTransactionsByProduct: (productId: string) => InventoryTransaction[];
  getTransactionsByType: (type: string) => InventoryTransaction[];
  calculateTotalValue: () => number;
  clearFilters: () => void;
  reset: () => void;
}

const initialState = {
  inventory: [],
  transactions: [],
  selectedItem: null,
  loading: false,
  error: null,
  filters: {},
};

export const useInventoryStore = create<InventoryStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Setters
        setInventory: (inventory) => set({ inventory }),
        setTransactions: (transactions) => set({ transactions }),
        setSelectedItem: (item) => set({ selectedItem: item }),
        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error }),
        setFilters: (filters) => set({ filters: { ...get().filters, ...filters } }),

        // Inventory actions
        updateStock: (productId, quantity, type) => {
          const transaction: InventoryTransaction = {
            id: Date.now().toString(),
            productId,
            type: type as any,
            quantity,
            createdBy: 'system',
            createdAt: new Date().toISOString(),
          };

          set((state) => ({
            inventory: state.inventory.map(item =>
              item.productId === productId
                ? {
                    ...item,
                    stock: type === 'sale' ? item.stock - quantity : item.stock + quantity,
                    availableStock: type === 'sale' 
                      ? item.availableStock - quantity 
                      : item.availableStock + quantity,
                    lastUpdated: new Date().toISOString(),
                  }
                : item
            ),
            transactions: [transaction, ...state.transactions],
          }));
        },

        addTransaction: (transaction) => set((state) => ({
          transactions: [transaction, ...state.transactions],
        })),

        adjustStock: (productId, newStock, reason) => {
          const currentItem = get().getInventoryByProduct(productId);
          if (!currentItem) return;

          const difference = newStock - currentItem.stock;
          const transaction: InventoryTransaction = {
            id: Date.now().toString(),
            productId,
            type: 'adjustment',
            quantity: difference,
            notes: reason,
            createdBy: 'admin',
            createdAt: new Date().toISOString(),
          };

          set((state) => ({
            inventory: state.inventory.map(item =>
              item.productId === productId
                ? {
                    ...item,
                    stock: newStock,
                    availableStock: newStock - item.reservedStock,
                    lastUpdated: new Date().toISOString(),
                  }
                : item
            ),
            transactions: [transaction, ...state.transactions],
          }));
        },

        reserveStock: (productId, quantity) => set((state) => ({
          inventory: state.inventory.map(item =>
            item.productId === productId
              ? {
                  ...item,
                  reservedStock: item.reservedStock + quantity,
                  availableStock: item.availableStock - quantity,
                  lastUpdated: new Date().toISOString(),
                }
              : item
          ),
        })),

        releaseReservedStock: (productId, quantity) => set((state) => ({
          inventory: state.inventory.map(item =>
            item.productId === productId
              ? {
                  ...item,
                  reservedStock: Math.max(0, item.reservedStock - quantity),
                  availableStock: item.availableStock + quantity,
                  lastUpdated: new Date().toISOString(),
                }
              : item
          ),
        })),

        // Utility functions
        getInventoryByProduct: (productId) => {
          return get().inventory.find(item => item.productId === productId);
        },

        getLowStockItems: () => {
          return get().inventory.filter(item => item.stock <= item.minStock);
        },

        getOutOfStockItems: () => {
          return get().inventory.filter(item => item.stock === 0);
        },

        getTransactionsByProduct: (productId) => {
          return get().transactions.filter(transaction => transaction.productId === productId);
        },

        getTransactionsByType: (type) => {
          return get().transactions.filter(transaction => transaction.type === type);
        },

        calculateTotalValue: () => {
          return get().transactions
            .filter(transaction => transaction.totalCost)
            .reduce((total, transaction) => total + (transaction.totalCost || 0), 0);
        },

        clearFilters: () => set({
          filters: {},
        }),

        reset: () => set(initialState),
      }),
      {
        name: 'inventory-store',
        partialize: (state) => ({
          inventory: state.inventory,
          transactions: state.transactions.slice(0, 500), // Keep only recent 500 transactions
        }),
      }
    ),
    { name: 'InventoryStore' }
  )
);
