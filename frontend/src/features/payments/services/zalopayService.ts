// ZaloPay API integration service
import { apiClient } from '../../../services/api/client';

export const zalopayService = {
  async createPayment(paymentData: any) {
    const response = await apiClient.post('/payments/zalopay/create', paymentData);
    return response.data;
  },

  async verifyPayment(params: any) {
    const response = await apiClient.post('/payments/zalopay/verify', params);
    return response.data;
  },

  async getPaymentStatus(transactionId: string) {
    const response = await apiClient.get(`/payments/zalopay/status/${transactionId}`);
    return response.data;
  },

  async refundPayment(refundData: any) {
    const response = await apiClient.post('/payments/zalopay/refund', refundData);
    return response.data;
  },
};
