// Order processing API service
import { apiClient } from '../api/client';
import { API_ENDPOINTS } from '../api/endpoints';
import type { 
  Order, 
  CreateOrder, 
  UpdateOrder, 
  RefundOrder,
  OrderSearch,
  POSOrder,
  CashPayment 
} from '../../../../shared/src';

export const orderService = {
  // Orders
  async getOrders(params?: OrderSearch) {
    const response = await apiClient.get(API_ENDPOINTS.ORDERS, { params });
    return response.data;
  },

  async getOrderById(id: string) {
    const response = await apiClient.get(API_ENDPOINTS.ORDER_BY_ID(id));
    return response.data;
  },

  async createOrder(order: CreateOrder) {
    const response = await apiClient.post(API_ENDPOINTS.ORDERS, order);
    return response.data;
  },

  async updateOrder(order: UpdateOrder) {
    const response = await apiClient.put(API_ENDPOINTS.ORDER_BY_ID(order.id), order);
    return response.data;
  },

  async deleteOrder(id: string) {
    const response = await apiClient.delete(API_ENDPOINTS.ORDER_BY_ID(id));
    return response.data;
  },

  async updateOrderStatus(id: string, status: string) {
    const response = await apiClient.put(API_ENDPOINTS.ORDER_STATUS(id), { status });
    return response.data;
  },

  // POS Orders
  async createPOSOrder(order: POSOrder) {
    const response = await apiClient.post(API_ENDPOINTS.POS_ORDER, order);
    return response.data;
  },

  // Payments
  async processCashPayment(payment: CashPayment) {
    const response = await apiClient.post(`${API_ENDPOINTS.PAYMENTS}/cash`, payment);
    return response.data;
  },

  async processCardPayment(orderId: string, cardData: any) {
    const response = await apiClient.post(`${API_ENDPOINTS.PAYMENTS}/card`, {
      orderId,
      ...cardData
    });
    return response.data;
  },

  // Refunds
  async refundOrder(refund: RefundOrder) {
    const response = await apiClient.post(API_ENDPOINTS.ORDER_REFUND(refund.orderId), refund);
    return response.data;
  },

  async getRefunds(orderId?: string) {
    const params = orderId ? { orderId } : {};
    const response = await apiClient.get(`${API_ENDPOINTS.ORDERS}/refunds`, { params });
    return response.data;
  },

  // Receipts
  async getOrderReceipt(id: string, format: 'pdf' | 'html' = 'pdf') {
    const response = await apiClient.get(API_ENDPOINTS.ORDER_RECEIPT(id), {
      params: { format },
      responseType: format === 'pdf' ? 'blob' : 'json'
    });
    return response.data;
  },

  async printReceipt(id: string, printerName?: string) {
    const response = await apiClient.post(`${API_ENDPOINTS.ORDER_RECEIPT(id)}/print`, {
      printerName
    });
    return response.data;
  },

  async emailReceipt(id: string, email: string) {
    const response = await apiClient.post(`${API_ENDPOINTS.ORDER_RECEIPT(id)}/email`, {
      email
    });
    return response.data;
  },

  // Order tracking
  async getOrderHistory(id: string) {
    const response = await apiClient.get(`${API_ENDPOINTS.ORDER_BY_ID(id)}/history`);
    return response.data;
  },

  async addOrderNote(id: string, note: string) {
    const response = await apiClient.post(`${API_ENDPOINTS.ORDER_BY_ID(id)}/notes`, {
      note
    });
    return response.data;
  },

  // Order statistics
  async getOrderStats(period: string = 'today') {
    const response = await apiClient.get(`${API_ENDPOINTS.ORDERS}/stats`, {
      params: { period }
    });
    return response.data;
  },

  async getTopProducts(period: string = 'week', limit: number = 10) {
    const response = await apiClient.get(`${API_ENDPOINTS.ORDERS}/top-products`, {
      params: { period, limit }
    });
    return response.data;
  },

  // Bulk operations
  async bulkUpdateOrders(orderIds: string[], updates: Partial<Order>) {
    const response = await apiClient.put(`${API_ENDPOINTS.ORDERS}/bulk`, {
      orderIds,
      updates
    });
    return response.data;
  },

  async exportOrders(params: OrderSearch & { format: 'csv' | 'excel' | 'pdf' }) {
    const response = await apiClient.get(`${API_ENDPOINTS.ORDERS}/export`, {
      params,
      responseType: 'blob'
    });
    return response.data;
  },
};
