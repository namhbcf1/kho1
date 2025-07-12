// Cash payment service
import { apiClient } from '../api/client';

export const cashService = {
  async processCashPayment(paymentData: {
    orderId: string;
    amount: number;
    received: number;
    change: number;
    cashierId: string;
  }) {
    const response = await apiClient.post('/payments/cash/process', paymentData);
    return response.data;
  },

  async openCashDrawer() {
    const response = await apiClient.post('/hardware/cash-drawer/open');
    return response.data;
  },

  async recordCashTransaction(transactionData: {
    type: 'sale' | 'refund' | 'adjustment';
    amount: number;
    orderId?: string;
    notes?: string;
  }) {
    const response = await apiClient.post('/payments/cash/transaction', transactionData);
    return response.data;
  },

  async getCashBalance() {
    const response = await apiClient.get('/payments/cash/balance');
    return response.data;
  },
};
