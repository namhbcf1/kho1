// VNPay service for frontend
import { apiClient } from '../api/client';

export const vnpayService = {
  async createPaymentUrl(paymentData: {
    amount: number;
    orderId: string;
    orderInfo: string;
    returnUrl: string;
  }) {
    const response = await apiClient.post('/payments/vnpay/create-url', paymentData);
    return response.data;
  },

  async verifyReturn(params: Record<string, string>) {
    const response = await apiClient.post('/payments/vnpay/verify-return', params);
    return response.data;
  },

  async queryTransaction(transactionId: string) {
    const response = await apiClient.get(`/payments/vnpay/query/${transactionId}`);
    return response.data;
  },

  async refund(refundData: {
    transactionId: string;
    amount: number;
    reason: string;
  }) {
    const response = await apiClient.post('/payments/vnpay/refund', refundData);
    return response.data;
  },
};
