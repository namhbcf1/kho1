// Real product service with Vietnamese business logic
import { apiClient } from './client';
import { API_ENDPOINTS } from '../../constants/api';

export interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  price: number;
  costPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
  reorderLevel: number;
  categoryId: string;
  categoryName: string;
  brandId?: string;
  brandName?: string;
  supplierId?: string;
  supplierName?: string;
  unit: string; // Vietnamese units: kg, g, lít, cái, hộp, etc.
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  images: string[];
  tags: string[];
  attributes: Record<string, any>;
  vatRate: number; // Vietnamese VAT rates
  isActive: boolean;
  isFeatured: boolean;
  isPerishable: boolean;
  expiryDate?: string;
  manufactureDate?: string;
  origin: string; // Vietnamese provinces or countries
  qualityStandards: string[]; // Vietnamese quality standards
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  parentName?: string;
  icon?: string;
  color?: string;
  vatRate: number;
  isActive: boolean;
  sortOrder: number;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  brandId?: string;
  supplierId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  lowStock?: boolean;
  isActive?: boolean;
  isFeatured?: boolean;
  isPerishable?: boolean;
  origin?: string;
  tags?: string[];
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ProductCreateData {
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  price: number;
  costPrice: number;
  stock: number;
  minStock: number;
  reorderLevel: number;
  categoryId: string;
  brandId?: string;
  supplierId?: string;
  unit: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  images?: string[];
  tags?: string[];
  attributes?: Record<string, any>;
  vatRate: number;
  isActive?: boolean;
  isFeatured?: boolean;
  isPerishable?: boolean;
  expiryDate?: string;
  manufactureDate?: string;
  origin: string;
  qualityStandards?: string[];
}

export interface ProductUpdateData extends Partial<ProductCreateData> {
  id: string;
}

export interface InventoryTransaction {
  id: string;
  productId: string;
  type: 'in' | 'out' | 'adjustment' | 'transfer';
  quantity: number;
  previousStock: number;
  newStock: number;
  cost: number;
  reference?: string;
  notes?: string;
  createdAt: string;
  createdBy: string;
}

class ProductService {
  // Product CRUD operations
  async getProducts(filters?: ProductFilters): Promise<{
    products: Product[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const response = await apiClient.get(API_ENDPOINTS.PRODUCTS.LIST, {
      params: filters
    });
    return response.data;
  }

  async getProduct(id: string): Promise<Product> {
    const response = await apiClient.get(`${API_ENDPOINTS.PRODUCTS.LIST}/${id}`);
    return response.data;
  }

  async createProduct(data: ProductCreateData): Promise<Product> {
    const response = await apiClient.post(API_ENDPOINTS.PRODUCTS.CREATE, data);
    return response.data;
  }

  async updateProduct(data: ProductUpdateData): Promise<Product> {
    const response = await apiClient.put(`${API_ENDPOINTS.PRODUCTS.UPDATE}/${data.id}`, data);
    return response.data;
  }

  async deleteProduct(id: string): Promise<void> {
    await apiClient.delete(`${API_ENDPOINTS.PRODUCTS.DELETE}/${id}`);
  }

  async bulkUpdateProducts(products: ProductUpdateData[]): Promise<Product[]> {
    const response = await apiClient.put(`${API_ENDPOINTS.PRODUCTS.UPDATE}/bulk`, { products });
    return response.data;
  }

  // Product search and filtering
  async searchProducts(query: string, categoryId?: string): Promise<Product[]> {
    const response = await apiClient.get(`${API_ENDPOINTS.PRODUCTS.LIST}/search`, {
      params: { q: query, categoryId, limit: 50 }
    });
    return response.data;
  }

  async getProductByBarcode(barcode: string): Promise<Product | null> {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.PRODUCTS.LIST}/barcode/${barcode}`);
      return response.data;
    } catch (error) {
      return null;
    }
  }

  async getProductsBySKU(sku: string): Promise<Product[]> {
    const response = await apiClient.get(`${API_ENDPOINTS.PRODUCTS.LIST}/sku/${sku}`);
    return response.data;
  }

  // Category management
  async getCategories(): Promise<ProductCategory[]> {
    const response = await apiClient.get(API_ENDPOINTS.PRODUCTS.CATEGORIES);
    return response.data;
  }

  async createCategory(data: Omit<ProductCategory, 'id' | 'createdAt' | 'updatedAt' | 'productCount'>): Promise<ProductCategory> {
    const response = await apiClient.post(API_ENDPOINTS.PRODUCTS.CATEGORIES, data);
    return response.data;
  }

  async updateCategory(id: string, data: Partial<ProductCategory>): Promise<ProductCategory> {
    const response = await apiClient.put(`${API_ENDPOINTS.PRODUCTS.CATEGORIES}/${id}`, data);
    return response.data;
  }

  async deleteCategory(id: string): Promise<void> {
    await apiClient.delete(`${API_ENDPOINTS.PRODUCTS.CATEGORIES}/${id}`);
  }

  // Inventory management
  async getInventory(filters?: {
    productId?: string;
    lowStock?: boolean;
    outOfStock?: boolean;
    categoryId?: string;
  }): Promise<{
    items: Array<{
      product: Product;
      stock: number;
      value: number;
      lastTransaction: InventoryTransaction;
    }>;
    summary: {
      totalItems: number;
      totalValue: number;
      lowStockItems: number;
      outOfStockItems: number;
    };
  }> {
    const response = await apiClient.get(API_ENDPOINTS.PRODUCTS.INVENTORY, {
      params: filters
    });
    return response.data;
  }

  async updateStock(productId: string, quantity: number, type: InventoryTransaction['type'], notes?: string): Promise<InventoryTransaction> {
    const response = await apiClient.post(`${API_ENDPOINTS.PRODUCTS.INVENTORY}/transactions`, {
      productId,
      quantity,
      type,
      notes
    });
    return response.data;
  }

  async getInventoryTransactions(productId?: string, page = 1, pageSize = 20): Promise<{
    transactions: InventoryTransaction[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const response = await apiClient.get(`${API_ENDPOINTS.PRODUCTS.INVENTORY}/transactions`, {
      params: { productId, page, pageSize }
    });
    return response.data;
  }

  // Vietnamese business specific methods
  async getProductsByOrigin(origin: string): Promise<Product[]> {
    const response = await apiClient.get(`${API_ENDPOINTS.PRODUCTS.LIST}/origin/${origin}`);
    return response.data;
  }

  async getProductsByVATRate(vatRate: number): Promise<Product[]> {
    const response = await apiClient.get(`${API_ENDPOINTS.PRODUCTS.LIST}/vat/${vatRate}`);
    return response.data;
  }

  async getPerishableProducts(daysToExpiry = 30): Promise<Product[]> {
    const response = await apiClient.get(`${API_ENDPOINTS.PRODUCTS.LIST}/perishable`, {
      params: { daysToExpiry }
    });
    return response.data;
  }

  async getLowStockProducts(threshold?: number): Promise<Product[]> {
    const response = await apiClient.get(`${API_ENDPOINTS.PRODUCTS.LIST}/low-stock`, {
      params: { threshold }
    });
    return response.data;
  }

  // Price management with Vietnamese currency
  async updatePrices(updates: Array<{
    productId: string;
    price?: number;
    costPrice?: number;
    sellPrice?: number;
    vatRate?: number;
  }>): Promise<Product[]> {
    const response = await apiClient.put(`${API_ENDPOINTS.PRODUCTS.UPDATE}/prices`, { updates });
    return response.data;
  }

  async applyDiscountToProducts(productIds: string[], discountPercent: number, startDate?: string, endDate?: string): Promise<void> {
    await apiClient.post(`${API_ENDPOINTS.PRODUCTS.UPDATE}/discount`, {
      productIds,
      discountPercent,
      startDate,
      endDate
    });
  }

  // Import/Export for Vietnamese business
  async importProducts(file: File): Promise<{
    success: number;
    failed: number;
    errors: Array<{ row: number; error: string }>;
  }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post(`${API_ENDPOINTS.PRODUCTS.LIST}/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async exportProducts(format: 'csv' | 'xlsx', filters?: ProductFilters): Promise<Blob> {
    const response = await apiClient.get(`${API_ENDPOINTS.PRODUCTS.LIST}/export`, {
      params: { format, ...filters },
      responseType: 'blob'
    });
    return response.data;
  }

  // Barcode generation
  async generateBarcode(productId: string): Promise<{ barcode: string; image: string }> {
    const response = await apiClient.post(`${API_ENDPOINTS.PRODUCTS.LIST}/${productId}/barcode`);
    return response.data;
  }

  async validateBarcode(barcode: string): Promise<{ isValid: boolean; type: string }> {
    const response = await apiClient.post(`${API_ENDPOINTS.PRODUCTS.LIST}/validate-barcode`, { barcode });
    return response.data;
  }
}

export const productService = new ProductService();