// VNPay API integration service
import { apiClient } from '../../../services/api/client';

export const vnpayService = {
  async createPayment(paymentData: any) {
    const response = await apiClient.post('/payments/vnpay/create', paymentData);
    return response.data;
  },

  async verifyPayment(params: any) {
    const response = await apiClient.post('/payments/vnpay/verify', params);
    return response.data;
  },

  async getPaymentStatus(transactionId: string) {
    const response = await apiClient.get(`/payments/vnpay/status/${transactionId}`);
    return response.data;
  },

  async refundPayment(refundData: any) {
    const response = await apiClient.post('/payments/vnpay/refund', refundData);
    return response.data;
  },
};
