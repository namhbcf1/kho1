// Order service API calls
import { apiClient } from '../../../services/api/client';

export const orderService = {
  async getOrders(params?: any) {
    const response = await apiClient.get('/orders', { params });
    return response.data;
  },

  async getOrderById(id: string) {
    const response = await apiClient.get(`/orders/${id}`);
    return response.data;
  },

  async createOrder(orderData: any) {
    const response = await apiClient.post('/orders', orderData);
    return response.data;
  },

  async updateOrder(id: string, orderData: any) {
    const response = await apiClient.put(`/orders/${id}`, orderData);
    return response.data;
  },

  async cancelOrder(id: string, reason?: string) {
    const response = await apiClient.post(`/orders/${id}/cancel`, { reason });
    return response.data;
  },

  async refundOrder(id: string, refundData: any) {
    const response = await apiClient.post(`/orders/${id}/refund`, refundData);
    return response.data;
  },

  async getOrderReceipt(id: string) {
    const response = await apiClient.get(`/orders/${id}/receipt`);
    return response.data;
  },

  async printReceipt(id: string) {
    const response = await apiClient.post(`/orders/${id}/print`);
    return response.data;
  },
};
