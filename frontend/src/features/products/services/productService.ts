// Product service API calls
import { apiClient } from '../../../services/api/client';

export const productService = {
  async getProducts(params?: any) {
    const response = await apiClient.get('/products', { params });
    return response.data;
  },

  async getProductById(id: string) {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  },

  async createProduct(productData: any) {
    const response = await apiClient.post('/products', productData);
    return response.data;
  },

  async updateProduct(id: string, productData: any) {
    const response = await apiClient.put(`/products/${id}`, productData);
    return response.data;
  },

  async deleteProduct(id: string) {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
  },

  async searchProducts(query: string) {
    const response = await apiClient.get('/products/search', { params: { q: query } });
    return response.data;
  },

  async getProductByBarcode(barcode: string) {
    const response = await apiClient.get(`/products/barcode/${barcode}`);
    return response.data;
  },

  async updateStock(id: string, stock: number) {
    const response = await apiClient.put(`/products/${id}/stock`, { stock });
    return response.data;
  },

  async getCategories() {
    const response = await apiClient.get('/categories');
    return response.data;
  },

  async createCategory(categoryData: any) {
    const response = await apiClient.post('/categories', categoryData);
    return response.data;
  },

  async updateCategory(id: string, categoryData: any) {
    const response = await apiClient.put(`/categories/${id}`, categoryData);
    return response.data;
  },

  async deleteCategory(id: string) {
    const response = await apiClient.delete(`/categories/${id}`);
    return response.data;
  },
};
