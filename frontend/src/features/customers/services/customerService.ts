// Customer service API calls
import { apiClient } from '../../../services/api/client';

export const customerService = {
  async getCustomers(params?: any) {
    const response = await apiClient.get('/customers', { params });
    return response.data;
  },

  async getCustomerById(id: string) {
    const response = await apiClient.get(`/customers/${id}`);
    return response.data;
  },

  async createCustomer(customerData: any) {
    const response = await apiClient.post('/customers', customerData);
    return response.data;
  },

  async updateCustomer(id: string, customerData: any) {
    const response = await apiClient.put(`/customers/${id}`, customerData);
    return response.data;
  },

  async deleteCustomer(id: string) {
    const response = await apiClient.delete(`/customers/${id}`);
    return response.data;
  },

  async getCustomerOrders(id: string) {
    const response = await apiClient.get(`/customers/${id}/orders`);
    return response.data;
  },

  async getCustomerLoyalty(id: string) {
    const response = await apiClient.get(`/customers/${id}/loyalty`);
    return response.data;
  },

  async updateLoyaltyPoints(id: string, points: number) {
    const response = await apiClient.post(`/customers/${id}/points`, { points });
    return response.data;
  },
};
