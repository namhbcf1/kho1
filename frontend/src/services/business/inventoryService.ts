// Inventory tracking API service
import { apiClient } from '../api/client';
import { API_ENDPOINTS } from '../api/endpoints';

export const inventoryService = {
  // Inventory items
  async getInventory(params?: any) {
    const response = await apiClient.get(API_ENDPOINTS.INVENTORY, { params });
    return response.data;
  },

  async getInventoryByProduct(productId: string) {
    const response = await apiClient.get(API_ENDPOINTS.INVENTORY_BY_PRODUCT(productId));
    return response.data;
  },

  async updateInventory(updates: any[]) {
    const response = await apiClient.put(API_ENDPOINTS.INVENTORY_UPDATE, { updates });
    return response.data;
  },

  async adjustInventory(adjustments: any[]) {
    const response = await apiClient.post(API_ENDPOINTS.INVENTORY_ADJUSTMENT, { adjustments });
    return response.data;
  },

  // Stock levels
  async getLowStockItems(threshold?: number) {
    const response = await apiClient.get(API_ENDPOINTS.LOW_STOCK, {
      params: threshold ? { threshold } : {}
    });
    return response.data;
  },

  async getOutOfStockItems() {
    const response = await apiClient.get(API_ENDPOINTS.OUT_OF_STOCK);
    return response.data;
  },

  async updateStockLevels(productId: string, stock: number, minStock?: number, maxStock?: number) {
    const response = await apiClient.put(`${API_ENDPOINTS.INVENTORY}/stock/${productId}`, {
      stock,
      minStock,
      maxStock
    });
    return response.data;
  },

  // Inventory transactions
  async getInventoryTransactions(params?: any) {
    const response = await apiClient.get(API_ENDPOINTS.INVENTORY_TRANSACTIONS, { params });
    return response.data;
  },

  async createInventoryTransaction(transaction: any) {
    const response = await apiClient.post(API_ENDPOINTS.INVENTORY_TRANSACTIONS, transaction);
    return response.data;
  },

  async getTransactionsByProduct(productId: string, params?: any) {
    const response = await apiClient.get(`${API_ENDPOINTS.INVENTORY_TRANSACTIONS}/product/${productId}`, { params });
    return response.data;
  },

  // Stock movements
  async recordStockMovement(movement: {
    productId: string;
    variantId?: string;
    type: 'sale' | 'purchase' | 'adjustment' | 'transfer' | 'return' | 'damage' | 'expired';
    quantity: number;
    unitCost?: number;
    referenceType?: string;
    referenceId?: string;
    notes?: string;
  }) {
    const response = await apiClient.post(`${API_ENDPOINTS.INVENTORY}/movements`, movement);
    return response.data;
  },

  async getStockMovements(productId?: string, params?: any) {
    const endpoint = productId 
      ? `${API_ENDPOINTS.INVENTORY}/movements/product/${productId}`
      : `${API_ENDPOINTS.INVENTORY}/movements`;
    
    const response = await apiClient.get(endpoint, { params });
    return response.data;
  },

  // Stock transfers
  async createStockTransfer(transfer: {
    fromLocationId?: string;
    toLocationId?: string;
    items: Array<{
      productId: string;
      variantId?: string;
      quantity: number;
    }>;
    notes?: string;
  }) {
    const response = await apiClient.post(`${API_ENDPOINTS.INVENTORY}/transfers`, transfer);
    return response.data;
  },

  async getStockTransfers(params?: any) {
    const response = await apiClient.get(`${API_ENDPOINTS.INVENTORY}/transfers`, { params });
    return response.data;
  },

  async approveStockTransfer(transferId: string) {
    const response = await apiClient.put(`${API_ENDPOINTS.INVENTORY}/transfers/${transferId}/approve`);
    return response.data;
  },

  // Inventory valuation
  async getInventoryValuation(method: 'fifo' | 'lifo' | 'average' = 'average') {
    const response = await apiClient.get(`${API_ENDPOINTS.INVENTORY}/valuation`, {
      params: { method }
    });
    return response.data;
  },

  async getInventoryValue(productId?: string) {
    const endpoint = productId 
      ? `${API_ENDPOINTS.INVENTORY}/value/product/${productId}`
      : `${API_ENDPOINTS.INVENTORY}/value`;
    
    const response = await apiClient.get(endpoint);
    return response.data;
  },

  // Inventory reports
  async getInventoryReport(type: 'summary' | 'detailed' | 'movements' | 'valuation', params?: any) {
    const response = await apiClient.get(`${API_ENDPOINTS.INVENTORY}/reports/${type}`, { params });
    return response.data;
  },

  async exportInventoryReport(type: string, format: 'csv' | 'excel' | 'pdf', params?: any) {
    const response = await apiClient.get(`${API_ENDPOINTS.INVENTORY}/reports/${type}/export`, {
      params: { ...params, format },
      responseType: 'blob'
    });
    return response.data;
  },

  // Inventory alerts
  async getInventoryAlerts() {
    const response = await apiClient.get(`${API_ENDPOINTS.INVENTORY}/alerts`);
    return response.data;
  },

  async markAlertAsRead(alertId: string) {
    const response = await apiClient.put(`${API_ENDPOINTS.INVENTORY}/alerts/${alertId}/read`);
    return response.data;
  },

  async updateAlertSettings(settings: {
    lowStockEnabled: boolean;
    lowStockThreshold: number;
    outOfStockEnabled: boolean;
    expiryAlertEnabled: boolean;
    expiryAlertDays: number;
  }) {
    const response = await apiClient.put(`${API_ENDPOINTS.INVENTORY}/alerts/settings`, settings);
    return response.data;
  },
};
