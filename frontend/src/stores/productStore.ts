// Product management state with Zustand
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { apiClient } from '../services/api/client';
import { API_ENDPOINTS } from '../services/api/endpoints';
import type { Product, Category, PaginatedResponse, SearchParams } from '../services/api/types';

export interface ProductFilters {
  categoryId?: string;
  active?: boolean;
  lowStock?: boolean;
  priceMin?: number;
  priceMax?: number;
  search?: string;
}

export interface ProductState {
  // Data
  products: Product[];
  categories: Category[];
  selectedProduct: Product | null;
  
  // Pagination
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  
  // Filters & Search
  filters: ProductFilters;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  
  // UI State
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
  
  // Actions
  loadProducts: (params?: SearchParams) => Promise<void>;
  loadCategories: () => Promise<void>;
  createProduct: (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Product>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<Product>;
  deleteProduct: (id: string) => Promise<void>;
  bulkUpdateProducts: (updates: Array<{ id: string; data: Partial<Product> }>) => Promise<void>;
  
  // Category actions
  createCategory: (data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Category>;
  updateCategory: (id: string, data: Partial<Category>) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;
  
  // Selection & Navigation
  selectProduct: (product: Product | null) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setFilters: (filters: Partial<ProductFilters>) => void;
  setSorting: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  clearFilters: () => void;
  
  // Search & Filter
  searchProducts: (query: string) => Promise<Product[]>;
  getProductsByCategory: (categoryId: string) => Product[];
  getLowStockProducts: () => Product[];
  
  // Utility
  clearError: () => void;
  refreshData: () => Promise<void>;
}

export const useProductStore = create<ProductState>()(
  devtools(
    (set, get) => ({
      // Initial state
      products: [],
      categories: [],
      selectedProduct: null,
      
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      pageSize: 20,
      
      filters: {},
      sortBy: 'name',
      sortOrder: 'asc',
      
      isLoading: false,
      isCreating: false,
      isUpdating: false,
      isDeleting: false,
      error: null,

      // Product actions
      loadProducts: async (params) => {
        set({ isLoading: true, error: null });
        
        try {
          const { currentPage, pageSize, filters, sortBy, sortOrder } = get();
          
          const searchParams = {
            page: params?.page || currentPage,
            limit: params?.limit || pageSize,
            sortBy: params?.sortBy || sortBy,
            sortOrder: params?.sortOrder || sortOrder,
            ...filters,
            ...params?.filters,
          };

          const response = await apiClient.get<PaginatedResponse<Product>>(
            API_ENDPOINTS.PRODUCTS.LIST,
            { params: searchParams }
          );

          if (response.success && response.data) {
            set({
              products: response.data,
              currentPage: response.meta?.pagination?.page || 1,
              totalPages: response.meta?.pagination?.totalPages || 1,
              totalItems: response.meta?.pagination?.total || 0,
              isLoading: false,
            });
          } else {
            throw new Error(response.message || 'Failed to load products');
          }
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Tải sản phẩm thất bại',
          });
        }
      },

      loadCategories: async () => {
        try {
          const response = await apiClient.get(API_ENDPOINTS.CATEGORIES.LIST);
          if (response.success && response.data) {
            set({ categories: response.data });
          }
        } catch (error) {
          console.error('Load categories error:', error);
        }
      },

      createProduct: async (data) => {
        set({ isCreating: true, error: null });
        
        try {
          const response = await apiClient.post(API_ENDPOINTS.PRODUCTS.CREATE, data);
          
          if (response.success && response.data) {
            const { products } = get();
            set({
              products: [response.data, ...products],
              isCreating: false,
            });
            return response.data;
          } else {
            throw new Error(response.message || 'Failed to create product');
          }
        } catch (error) {
          set({
            isCreating: false,
            error: error instanceof Error ? error.message : 'Tạo sản phẩm thất bại',
          });
          throw error;
        }
      },

      updateProduct: async (id, data) => {
        set({ isUpdating: true, error: null });
        
        try {
          const response = await apiClient.put(API_ENDPOINTS.PRODUCTS.UPDATE(id), data);
          
          if (response.success && response.data) {
            const { products, selectedProduct } = get();
            const updatedProducts = products.map(product =>
              product.id === id ? response.data : product
            );
            
            set({
              products: updatedProducts,
              selectedProduct: selectedProduct?.id === id ? response.data : selectedProduct,
              isUpdating: false,
            });
            
            return response.data;
          } else {
            throw new Error(response.message || 'Failed to update product');
          }
        } catch (error) {
          set({
            isUpdating: false,
            error: error instanceof Error ? error.message : 'Cập nhật sản phẩm thất bại',
          });
          throw error;
        }
      },

      deleteProduct: async (id) => {
        set({ isDeleting: true, error: null });
        
        try {
          const response = await apiClient.delete(API_ENDPOINTS.PRODUCTS.DELETE(id));
          
          if (response.success) {
            const { products, selectedProduct } = get();
            const updatedProducts = products.filter(product => product.id !== id);
            
            set({
              products: updatedProducts,
              selectedProduct: selectedProduct?.id === id ? null : selectedProduct,
              isDeleting: false,
            });
          } else {
            throw new Error(response.message || 'Failed to delete product');
          }
        } catch (error) {
          set({
            isDeleting: false,
            error: error instanceof Error ? error.message : 'Xóa sản phẩm thất bại',
          });
          throw error;
        }
      },

      bulkUpdateProducts: async (updates) => {
        set({ isUpdating: true, error: null });
        
        try {
          const response = await apiClient.put(API_ENDPOINTS.PRODUCTS.BULK_UPDATE, { updates });
          
          if (response.success) {
            // Reload products to get updated data
            await get().loadProducts();
            set({ isUpdating: false });
          } else {
            throw new Error(response.message || 'Failed to bulk update products');
          }
        } catch (error) {
          set({
            isUpdating: false,
            error: error instanceof Error ? error.message : 'Cập nhật hàng loạt thất bại',
          });
          throw error;
        }
      },

      // Category actions
      createCategory: async (data) => {
        try {
          const response = await apiClient.post(API_ENDPOINTS.CATEGORIES.CREATE, data);
          
          if (response.success && response.data) {
            const { categories } = get();
            set({ categories: [response.data, ...categories] });
            return response.data;
          } else {
            throw new Error(response.message || 'Failed to create category');
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Tạo danh mục thất bại',
          });
          throw error;
        }
      },

      updateCategory: async (id, data) => {
        try {
          const response = await apiClient.put(API_ENDPOINTS.CATEGORIES.UPDATE(id), data);
          
          if (response.success && response.data) {
            const { categories } = get();
            const updatedCategories = categories.map(category =>
              category.id === id ? response.data : category
            );
            set({ categories: updatedCategories });
            return response.data;
          } else {
            throw new Error(response.message || 'Failed to update category');
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Cập nhật danh mục thất bại',
          });
          throw error;
        }
      },

      deleteCategory: async (id) => {
        try {
          const response = await apiClient.delete(API_ENDPOINTS.CATEGORIES.DELETE(id));
          
          if (response.success) {
            const { categories } = get();
            const updatedCategories = categories.filter(category => category.id !== id);
            set({ categories: updatedCategories });
          } else {
            throw new Error(response.message || 'Failed to delete category');
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Xóa danh mục thất bại',
          });
          throw error;
        }
      },

      // Selection & Navigation
      selectProduct: (product) => {
        set({ selectedProduct: product });
      },

      setPage: (page) => {
        set({ currentPage: page });
        get().loadProducts({ page });
      },

      setPageSize: (size) => {
        set({ pageSize: size, currentPage: 1 });
        get().loadProducts({ limit: size, page: 1 });
      },

      setFilters: (newFilters) => {
        const { filters } = get();
        const updatedFilters = { ...filters, ...newFilters };
        set({ filters: updatedFilters, currentPage: 1 });
        get().loadProducts({ filters: updatedFilters, page: 1 });
      },

      setSorting: (sortBy, sortOrder) => {
        set({ sortBy, sortOrder, currentPage: 1 });
        get().loadProducts({ sortBy, sortOrder, page: 1 });
      },

      clearFilters: () => {
        set({ filters: {}, currentPage: 1 });
        get().loadProducts({ filters: {}, page: 1 });
      },

      // Search & Filter
      searchProducts: async (query) => {
        try {
          const response = await apiClient.get(
            `${API_ENDPOINTS.PRODUCTS.SEARCH}?q=${encodeURIComponent(query)}`
          );
          return response.data || [];
        } catch (error) {
          console.error('Search products error:', error);
          return [];
        }
      },

      getProductsByCategory: (categoryId) => {
        const { products } = get();
        return products.filter(product => product.categoryId === categoryId);
      },

      getLowStockProducts: () => {
        const { products } = get();
        return products.filter(product => 
          product.minStock && product.stock <= product.minStock
        );
      },

      // Utility
      clearError: () => {
        set({ error: null });
      },

      refreshData: async () => {
        await Promise.all([
          get().loadProducts(),
          get().loadCategories(),
        ]);
      },
    }),
    {
      name: 'product-store',
    }
  )
);

// Selectors
export const useProducts = () => useProductStore((state) => ({
  products: state.products,
  categories: state.categories,
  selectedProduct: state.selectedProduct,
  isLoading: state.isLoading,
  error: state.error,
}));

export const useProductActions = () => useProductStore((state) => ({
  loadProducts: state.loadProducts,
  createProduct: state.createProduct,
  updateProduct: state.updateProduct,
  deleteProduct: state.deleteProduct,
  selectProduct: state.selectProduct,
  searchProducts: state.searchProducts,
  clearError: state.clearError,
}));

export const useProductFilters = () => useProductStore((state) => ({
  filters: state.filters,
  sortBy: state.sortBy,
  sortOrder: state.sortOrder,
  currentPage: state.currentPage,
  totalPages: state.totalPages,
  pageSize: state.pageSize,
  setFilters: state.setFilters,
  setSorting: state.setSorting,
  setPage: state.setPage,
  setPageSize: state.setPageSize,
  clearFilters: state.clearFilters,
}));
