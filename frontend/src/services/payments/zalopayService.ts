// ZaloPay service for frontend
import { apiClient } from '../api/client';

export const zalopayService = {
  async createOrder(orderData: {
    amount: number;
    description: string;
    appTransId: string;
    bankCode?: string;
  }) {
    const response = await apiClient.post('/payments/zalopay/create', orderData);
    return response.data;
  },

  async verifyCallback(params: Record<string, any>) {
    const response = await apiClient.post('/payments/zalopay/callback', params);
    return response.data;
  },

  async queryOrder(appTransId: string) {
    const response = await apiClient.get(`/payments/zalopay/query/${appTransId}`);
    return response.data;
  },

  async refund(refundData: {
    zpTransId: string;
    amount: number;
    description: string;
  }) {
    const response = await apiClient.post('/payments/zalopay/refund', refundData);
    return response.data;
  },
};
