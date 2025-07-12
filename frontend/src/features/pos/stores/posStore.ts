import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  barcode?: string;
  image?: string;
  maxStock: number;
}

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
}

interface POSState {
  cart: CartItem[];
  products: Product[];
  loading: boolean;
  selectedCustomer?: any;
}

interface POSActions {
  setProducts: (products: Product[]) => void;
  setLoading: (loading: boolean) => void;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setSelectedCustomer: (customer: any) => void;
}

type POSStore = POSState & POSActions;

export const usePOSStore = create<POSStore>()(
  persist(
    (set, get) => ({
      // State
      cart: [],
      products: [],
      loading: false,
      selectedCustomer: undefined,

      // Actions
      setProducts: (products: Product[]) => {
        set({ products });
      },

      setLoading: (loading: boolean) => {
        set({ loading });
      },

      addToCart: (product: Product) => {
        const { cart } = get();
        const existingItem = cart.find(item => item.id === product.id);

        if (existingItem) {
          // Update quantity if item already exists
          set({
            cart: cart.map(item =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            )
          });
        } else {
          // Add new item to cart
          const newItem: CartItem = {
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            barcode: product.barcode,
            image: product.image,
            maxStock: product.stock,
          };
          
          set({ cart: [...cart, newItem] });
        }
      },

      removeFromCart: (productId: string) => {
        const { cart } = get();
        set({
          cart: cart.filter(item => item.id !== productId)
        });
      },

      updateQuantity: (productId: string, quantity: number) => {
        const { cart } = get();
        
        if (quantity <= 0) {
          // Remove item if quantity is 0 or less
          set({
            cart: cart.filter(item => item.id !== productId)
          });
        } else {
          // Update quantity
          set({
            cart: cart.map(item =>
              item.id === productId
                ? { ...item, quantity }
                : item
            )
          });
        }
      },

      clearCart: () => {
        set({ cart: [] });
      },

      setSelectedCustomer: (customer: any) => {
        set({ selectedCustomer: customer });
      },
    }),
    {
      name: 'pos-storage',
      partialize: (state) => ({
        cart: state.cart,
        selectedCustomer: state.selectedCustomer,
      }),
    }
  )
);
