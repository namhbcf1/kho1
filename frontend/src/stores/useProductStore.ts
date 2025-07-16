import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  barcode?: string;
  image?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

interface ProductStore {
  products: Product[];
  categories: Category[];
  loading: boolean;
  error: string | null;
  
  // Product actions
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  getProduct: (id: string) => Product | undefined;
  searchProducts: (query: string) => Product[];
  getProductsByCategory: (category: string) => Product[];
  
  // Category actions
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  
  // Utility actions
  updateStock: (id: string, quantity: number) => void;
  getLowStockProducts: (threshold?: number) => Product[];
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

// Initial mock data
const initialProducts: Product[] = [
  {
    id: '1',
    name: 'Coca Cola 330ml',
    price: 15000,
    stock: 50,
    category: 'drink',
    barcode: '8934563156789',
    image: '/images/coca-cola.jpg',
    description: 'Nước ngọt có gas Coca Cola lon 330ml',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Bánh mì sandwich',
    price: 25000,
    stock: 20,
    category: 'food',
    barcode: '8934563156790',
    image: '/images/sandwich.jpg',
    description: 'Bánh mì sandwich thịt nguội, rau củ tươi',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Nước suối Lavie 500ml',
    price: 8000,
    stock: 100,
    category: 'drink',
    barcode: '8934563156791',
    image: '/images/lavie.jpg',
    description: 'Nước suối tinh khiết Lavie chai 500ml',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '4',
    name: 'Mì tôm Hảo Hảo',
    price: 4500,
    stock: 30,
    category: 'food',
    barcode: '8934563156792',
    image: '/images/haohao.jpg',
    description: 'Mì ăn liền Hảo Hảo vị tôm chua cay',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '5',
    name: 'Sữa tươi TH True Milk',
    price: 32000,
    stock: 25,
    category: 'drink',
    barcode: '8934563156793',
    image: '/images/th-milk.jpg',
    description: 'Sữa tươi tiệt trùng TH True Milk hộp 1L',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const initialCategories: Category[] = [
  { id: 'food', name: 'Thực phẩm', description: 'Các sản phẩm thực phẩm' },
  { id: 'drink', name: 'Đồ uống', description: 'Các loại đồ uống' },
  { id: 'household', name: 'Gia dụng', description: 'Đồ gia dụng hàng ngày' },
  { id: 'electronics', name: 'Điện tử', description: 'Thiết bị điện tử' },
  { id: 'clothing', name: 'Thời trang', description: 'Quần áo, phụ kiện' }
];

export const useProductStore = create<ProductStore>()(
  persist(
    (set, get) => ({
      products: initialProducts,
      categories: initialCategories,
      loading: false,
      error: null,

      // Product actions
      addProduct: (productData) => {
        const newProduct: Product = {
          ...productData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        set((state) => ({
          products: [...state.products, newProduct]
        }));
      },

      updateProduct: (id, updates) => {
        set((state) => ({
          products: state.products.map((product) =>
            product.id === id
              ? { ...product, ...updates, updatedAt: new Date().toISOString() }
              : product
          )
        }));
      },

      deleteProduct: (id) => {
        set((state) => ({
          products: state.products.filter((product) => product.id !== id)
        }));
      },

      getProduct: (id) => {
        return get().products.find((product) => product.id === id);
      },

      searchProducts: (query) => {
        const { products } = get();
        const searchTerm = query.toLowerCase();
        
        return products.filter(
          (product) =>
            product.name.toLowerCase().includes(searchTerm) ||
            product.barcode?.includes(query) ||
            product.description?.toLowerCase().includes(searchTerm)
        );
      },

      getProductsByCategory: (category) => {
        return get().products.filter((product) => product.category === category);
      },

      // Category actions
      addCategory: (categoryData) => {
        const newCategory: Category = {
          ...categoryData,
          id: Date.now().toString()
        };
        
        set((state) => ({
          categories: [...state.categories, newCategory]
        }));
      },

      updateCategory: (id, updates) => {
        set((state) => ({
          categories: state.categories.map((category) =>
            category.id === id ? { ...category, ...updates } : category
          )
        }));
      },

      deleteCategory: (id) => {
        set((state) => ({
          categories: state.categories.filter((category) => category.id !== id)
        }));
      },

      // Utility actions
      updateStock: (id, quantity) => {
        set((state) => ({
          products: state.products.map((product) =>
            product.id === id
              ? { 
                  ...product, 
                  stock: Math.max(0, product.stock + quantity),
                  updatedAt: new Date().toISOString()
                }
              : product
          )
        }));
      },

      getLowStockProducts: (threshold = 10) => {
        return get().products.filter((product) => product.stock <= threshold);
      },

      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null })
    }),
    {
      name: 'product-store',
      partialize: (state) => ({
        products: state.products,
        categories: state.categories
      })
    }
  )
);