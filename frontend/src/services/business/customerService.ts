// Customer management API service
import { apiClient } from '../api/client';
import { API_ENDPOINTS } from '../api/endpoints';
import type { 
  Customer, 
  CreateCustomer, 
  UpdateCustomer, 
  CustomerSearch,
  CustomerLoyalty,
  LoyaltyPointsTransaction,
  BulkUpdateCustomers,
  CustomerImport 
} from '../../../../shared/src';

export const customerService = {
  // Customers
  async getCustomers(params?: CustomerSearch) {
    const response = await apiClient.get(API_ENDPOINTS.CUSTOMERS, { params });
    return response.data;
  },

  async getCustomerById(id: string) {
    const response = await apiClient.get(API_ENDPOINTS.CUSTOMER_BY_ID(id));
    return response.data;
  },

  async createCustomer(customer: CreateCustomer) {
    const response = await apiClient.post(API_ENDPOINTS.CUSTOMERS, customer);
    return response.data;
  },

  async updateCustomer(customer: UpdateCustomer) {
    const response = await apiClient.put(API_ENDPOINTS.CUSTOMER_BY_ID(customer.id), customer);
    return response.data;
  },

  async deleteCustomer(id: string) {
    const response = await apiClient.delete(API_ENDPOINTS.CUSTOMER_BY_ID(id));
    return response.data;
  },

  async searchCustomers(query: string) {
    const response = await apiClient.get(API_ENDPOINTS.CUSTOMER_SEARCH, {
      params: { q: query }
    });
    return response.data;
  },

  // Customer orders
  async getCustomerOrders(id: string, params?: any) {
    const response = await apiClient.get(API_ENDPOINTS.CUSTOMER_ORDERS(id), { params });
    return response.data;
  },

  async getCustomerStats(id: string) {
    const response = await apiClient.get(`${API_ENDPOINTS.CUSTOMER_BY_ID(id)}/stats`);
    return response.data;
  },

  // Loyalty program
  async getCustomerLoyalty(id: string): Promise<CustomerLoyalty> {
    const response = await apiClient.get(API_ENDPOINTS.CUSTOMER_LOYALTY(id));
    return response.data;
  },

  async addLoyaltyPoints(transaction: LoyaltyPointsTransaction) {
    const response = await apiClient.post(API_ENDPOINTS.CUSTOMER_POINTS(transaction.customerId), transaction);
    return response.data;
  },

  async redeemLoyaltyPoints(customerId: string, points: number, orderId?: string) {
    const response = await apiClient.post(`${API_ENDPOINTS.CUSTOMER_POINTS(customerId)}/redeem`, {
      points,
      orderId
    });
    return response.data;
  },

  async getLoyaltyHistory(customerId: string, params?: any) {
    const response = await apiClient.get(`${API_ENDPOINTS.CUSTOMER_POINTS(customerId)}/history`, { params });
    return response.data;
  },

  // Customer tiers
  async getLoyaltyTiers() {
    const response = await apiClient.get(`${API_ENDPOINTS.CUSTOMERS}/tiers`);
    return response.data;
  },

  async updateCustomerTier(customerId: string, tierId: string) {
    const response = await apiClient.put(`${API_ENDPOINTS.CUSTOMER_BY_ID(customerId)}/tier`, {
      tierId
    });
    return response.data;
  },

  // Customer communication
  async sendEmail(customerId: string, templateId: string, data?: any) {
    const response = await apiClient.post(`${API_ENDPOINTS.CUSTOMER_BY_ID(customerId)}/email`, {
      templateId,
      data
    });
    return response.data;
  },

  async sendSMS(customerId: string, message: string) {
    const response = await apiClient.post(`${API_ENDPOINTS.CUSTOMER_BY_ID(customerId)}/sms`, {
      message
    });
    return response.data;
  },

  // Customer preferences
  async getCustomerPreferences(id: string) {
    const response = await apiClient.get(`${API_ENDPOINTS.CUSTOMER_BY_ID(id)}/preferences`);
    return response.data;
  },

  async updateCustomerPreferences(id: string, preferences: any) {
    const response = await apiClient.put(`${API_ENDPOINTS.CUSTOMER_BY_ID(id)}/preferences`, preferences);
    return response.data;
  },

  // Bulk operations
  async bulkUpdateCustomers(data: BulkUpdateCustomers) {
    const response = await apiClient.put(`${API_ENDPOINTS.CUSTOMERS}/bulk`, data);
    return response.data;
  },

  async importCustomers(data: CustomerImport) {
    const response = await apiClient.post(`${API_ENDPOINTS.CUSTOMERS}/import`, data);
    return response.data;
  },

  async exportCustomers(params: CustomerSearch & { format: 'csv' | 'excel' | 'pdf' }) {
    const response = await apiClient.get(`${API_ENDPOINTS.CUSTOMERS}/export`, {
      params,
      responseType: 'blob'
    });
    return response.data;
  },

  // Customer analytics
  async getCustomerAnalytics(period: string = 'month') {
    const response = await apiClient.get(`${API_ENDPOINTS.CUSTOMERS}/analytics`, {
      params: { period }
    });
    return response.data;
  },

  async getCustomerSegments() {
    const response = await apiClient.get(`${API_ENDPOINTS.CUSTOMERS}/segments`);
    return response.data;
  },
};
