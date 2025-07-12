// MoMo service for frontend
import { apiClient } from '../api/client';

export const momoService = {
  async createPayment(paymentData: {
    amount: number;
    orderId: string;
    orderInfo: string;
    redirectUrl: string;
  }) {
    const response = await apiClient.post('/payments/momo/create', paymentData);
    return response.data;
  },

  async verifyCallback(params: Record<string, any>) {
    const response = await apiClient.post('/payments/momo/verify', params);
    return response.data;
  },

  async queryTransaction(transactionId: string) {
    const response = await apiClient.get(`/payments/momo/query/${transactionId}`);
    return response.data;
  },

  async refund(refundData: {
    transactionId: string;
    amount: number;
    description: string;
  }) {
    const response = await apiClient.post('/payments/momo/refund', refundData);
    return response.data;
  },
};
