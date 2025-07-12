// Product management API service
import { apiClient } from '../api/client';
import { API_ENDPOINTS } from '../api/endpoints';
import type { 
  Product, 
  CreateProduct, 
  UpdateProduct, 
  Category, 
  CreateCategory, 
  UpdateCategory,
  ProductSearch,
  BulkUpdateProducts 
} from '../../../../shared/src';

export const productService = {
  // Products
  async getProducts(params?: ProductSearch) {
    const response = await apiClient.get(API_ENDPOINTS.PRODUCTS, { params });
    return response.data;
  },

  async getProductById(id: string) {
    const response = await apiClient.get(API_ENDPOINTS.PRODUCT_BY_ID(id));
    return response.data;
  },

  async createProduct(product: CreateProduct) {
    const response = await apiClient.post(API_ENDPOINTS.PRODUCTS, product);
    return response.data;
  },

  async updateProduct(product: UpdateProduct) {
    const response = await apiClient.put(API_ENDPOINTS.PRODUCT_BY_ID(product.id), product);
    return response.data;
  },

  async deleteProduct(id: string) {
    const response = await apiClient.delete(API_ENDPOINTS.PRODUCT_BY_ID(id));
    return response.data;
  },

  async searchProducts(query: string) {
    const response = await apiClient.get(API_ENDPOINTS.PRODUCT_SEARCH, {
      params: { q: query }
    });
    return response.data;
  },

  async getProductByBarcode(barcode: string) {
    const response = await apiClient.get(API_ENDPOINTS.PRODUCT_BARCODE(barcode));
    return response.data;
  },

  async bulkUpdateProducts(data: BulkUpdateProducts) {
    const response = await apiClient.put(API_ENDPOINTS.PRODUCT_BULK, data);
    return response.data;
  },

  // Categories
  async getCategories() {
    const response = await apiClient.get(API_ENDPOINTS.CATEGORIES);
    return response.data;
  },

  async getCategoryById(id: string) {
    const response = await apiClient.get(API_ENDPOINTS.CATEGORY_BY_ID(id));
    return response.data;
  },

  async createCategory(category: CreateCategory) {
    const response = await apiClient.post(API_ENDPOINTS.CATEGORIES, category);
    return response.data;
  },

  async updateCategory(category: UpdateCategory) {
    const response = await apiClient.put(API_ENDPOINTS.CATEGORY_BY_ID(category.id), category);
    return response.data;
  },

  async deleteCategory(id: string) {
    const response = await apiClient.delete(API_ENDPOINTS.CATEGORY_BY_ID(id));
    return response.data;
  },

  async getCategoryTree() {
    const response = await apiClient.get(API_ENDPOINTS.CATEGORY_TREE);
    return response.data;
  },

  // Product images
  async uploadProductImage(file: File, productId?: string) {
    const formData = new FormData();
    formData.append('image', file);
    if (productId) {
      formData.append('productId', productId);
    }

    const response = await apiClient.post(API_ENDPOINTS.UPLOAD_IMAGE, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Product variants
  async getProductVariants(productId: string) {
    const response = await apiClient.get(`${API_ENDPOINTS.PRODUCT_BY_ID(productId)}/variants`);
    return response.data;
  },

  async createProductVariant(productId: string, variant: any) {
    const response = await apiClient.post(`${API_ENDPOINTS.PRODUCT_BY_ID(productId)}/variants`, variant);
    return response.data;
  },

  async updateProductVariant(productId: string, variantId: string, variant: any) {
    const response = await apiClient.put(`${API_ENDPOINTS.PRODUCT_BY_ID(productId)}/variants/${variantId}`, variant);
    return response.data;
  },

  async deleteProductVariant(productId: string, variantId: string) {
    const response = await apiClient.delete(`${API_ENDPOINTS.PRODUCT_BY_ID(productId)}/variants/${variantId}`);
    return response.data;
  },

  // Product attributes
  async getProductAttributes(productId: string) {
    const response = await apiClient.get(`${API_ENDPOINTS.PRODUCT_BY_ID(productId)}/attributes`);
    return response.data;
  },

  async updateProductAttributes(productId: string, attributes: any[]) {
    const response = await apiClient.put(`${API_ENDPOINTS.PRODUCT_BY_ID(productId)}/attributes`, { attributes });
    return response.data;
  },
};
