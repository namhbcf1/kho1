// MoMo API integration service
import { apiClient } from '../../../services/api/client';

export const momoService = {
  async createPayment(paymentData: any) {
    const response = await apiClient.post('/payments/momo/create', paymentData);
    return response.data;
  },

  async verifyPayment(params: any) {
    const response = await apiClient.post('/payments/momo/verify', params);
    return response.data;
  },

  async getPaymentStatus(transactionId: string) {
    const response = await apiClient.get(`/payments/momo/status/${transactionId}`);
    return response.data;
  },

  async refundPayment(refundData: any) {
    const response = await apiClient.post('/payments/momo/refund', refundData);
    return response.data;
  },
};
