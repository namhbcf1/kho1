// Real VNPay integration service for Vietnamese payment gateway
import { apiClient } from './client';

export interface VNPayConfig {
  vnpUrl: string;
  vnpReturnUrl: string;
  vnpIpnUrl: string;
  vnpHashSecret: string;
  vnpTmnCode: string;
  vnpVersion: string;
  vnpCurrCode: string;
  vnpLocale: string;
}

export interface VNPayPaymentRequest {
  orderId: string;
  amount: number; // VND amount
  orderInfo: string;
  customerEmail?: string;
  customerPhone?: string;
  customerName?: string;
  customerAddress?: string;
  bankCode?: string;
  paymentMethod?: 'ATM' | 'CC' | 'QRCODE';
  expireTime?: string;
}

export interface VNPayPaymentResponse {
  paymentUrl: string;
  transactionId: string;
  orderId: string;
  amount: number;
  qrCode?: string;
  deepLink?: string;
}

export interface VNPayCallbackData {
  vnpAmount: string;
  vnpBankCode: string;
  vnpBankTranNo: string;
  vnpCardType: string;
  vnpOrderInfo: string;
  vnpPayDate: string;
  vnpResponseCode: string;
  vnpTmnCode: string;
  vnpTransactionNo: string;
  vnpTransactionStatus: string;
  vnpTxnRef: string;
  vnpSecureHash: string;
}

export interface VNPayRefundRequest {
  transactionId: string;
  orderId: string;
  amount: number;
  refundReason: string;
  refundInfo: string;
}

export interface VNPayRefundResponse {
  refundId: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  refundAmount: number;
  refundDate: string;
  message: string;
}

export interface VNPayTransactionQuery {
  orderId: string;
  transactionDate: string;
}

export interface VNPayTransactionStatus {
  orderId: string;
  transactionId: string;
  amount: number;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'CANCELLED';
  paymentDate: string;
  bankCode: string;
  bankTransactionNo: string;
  cardType: string;
  orderInfo: string;
  responseCode: string;
  message: string;
}

class VNPayService {
  private readonly vnpHashSecret: string;
  private readonly vnpTmnCode: string;
  private readonly vnpUrl: string;
  private readonly vnpReturnUrl: string;
  private readonly vnpIpnUrl: string;

  constructor() {
    // These should be loaded from environment variables
    this.vnpHashSecret = import.meta.env.VITE_VNPAY_HASH_SECRET || '';
    this.vnpTmnCode = import.meta.env.VITE_VNPAY_TMN_CODE || '';
    this.vnpUrl = import.meta.env.VITE_VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    this.vnpReturnUrl = import.meta.env.VITE_VNPAY_RETURN_URL || `${window.location.origin}/payment/vnpay/return`;
    this.vnpIpnUrl = import.meta.env.VITE_VNPAY_IPN_URL || `${window.location.origin}/api/payment/vnpay/ipn`;
  }

  // Create payment request
  async createPayment(request: VNPayPaymentRequest): Promise<VNPayPaymentResponse> {
    const response = await apiClient.post('/api/payments/vnpay/create', {
      ...request,
      vnpReturnUrl: this.vnpReturnUrl,
      vnpIpnUrl: this.vnpIpnUrl,
    });
    return response.data;
  }

  // Process payment return from VNPay
  async processPaymentReturn(params: URLSearchParams): Promise<VNPayTransactionStatus> {
    const callbackData: Partial<VNPayCallbackData> = {};
    
    // Extract VNPay parameters
    for (const [key, value] of params.entries()) {
      if (key.startsWith('vnp_')) {
        callbackData[key as keyof VNPayCallbackData] = value;
      }
    }

    const response = await apiClient.post('/api/payments/vnpay/return', callbackData);
    return response.data;
  }

  // Verify payment callback signature
  async verifyCallback(callbackData: VNPayCallbackData): Promise<boolean> {
    const response = await apiClient.post('/api/payments/vnpay/verify', callbackData);
    return response.data.isValid;
  }

  // Query transaction status
  async queryTransaction(query: VNPayTransactionQuery): Promise<VNPayTransactionStatus> {
    const response = await apiClient.post('/api/payments/vnpay/query', query);
    return response.data;
  }

  // Request refund
  async requestRefund(refundRequest: VNPayRefundRequest): Promise<VNPayRefundResponse> {
    const response = await apiClient.post('/api/payments/vnpay/refund', refundRequest);
    return response.data;
  }

  // Get supported banks
  async getSupportedBanks(): Promise<Array<{
    bankCode: string;
    bankName: string;
    logo: string;
    isActive: boolean;
  }>> {
    const response = await apiClient.get('/api/payments/vnpay/banks');
    return response.data;
  }

  // Generate QR code for payment
  async generateQRCode(orderId: string, amount: number): Promise<{ qrCode: string; deepLink: string }> {
    const response = await apiClient.post('/api/payments/vnpay/qr', {
      orderId,
      amount,
    });
    return response.data;
  }

  // Vietnamese specific methods
  async createVietnamesePayment(request: {
    orderId: string;
    amount: number;
    customerInfo: {
      name: string;
      phone: string;
      email?: string;
      address?: {
        street: string;
        ward: string;
        district: string;
        province: string;
      };
    };
    orderInfo: string;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
      vatRate: number;
    }>;
    vatDetails: {
      subtotal: number;
      vatAmount: number;
      total: number;
    };
  }): Promise<VNPayPaymentResponse> {
    // Format order info with Vietnamese business requirements
    const formattedOrderInfo = this.formatVietnameseOrderInfo(request);
    
    const vnpayRequest: VNPayPaymentRequest = {
      orderId: request.orderId,
      amount: request.amount,
      orderInfo: formattedOrderInfo,
      customerName: request.customerInfo.name,
      customerPhone: request.customerInfo.phone,
      customerEmail: request.customerInfo.email,
      customerAddress: request.customerInfo.address ? 
        `${request.customerInfo.address.street}, ${request.customerInfo.address.ward}, ${request.customerInfo.address.district}, ${request.customerInfo.address.province}` : 
        undefined,
    };

    return this.createPayment(vnpayRequest);
  }

  // Format order info according to Vietnamese business standards
  private formatVietnameseOrderInfo(orderData: {
    orderId: string;
    customerInfo: { name: string; phone: string };
    items: Array<{ name: string; quantity: number; price: number; vatRate: number }>;
    vatDetails: { subtotal: number; vatAmount: number; total: number };
  }): string {
    const { orderId, customerInfo, items, vatDetails } = orderData;
    
    // Vietnamese order format
    const itemsText = items.map(item => 
      `${item.name} x${item.quantity} (${this.formatVND(item.price * item.quantity)} - VAT ${item.vatRate}%)`
    ).join(', ');

    return `Đơn hàng ${orderId} - ${customerInfo.name} (${customerInfo.phone}) - ${itemsText} - Tổng: ${this.formatVND(vatDetails.total)} (Gồm VAT: ${this.formatVND(vatDetails.vatAmount)})`;
  }

  // Format VND currency
  private formatVND(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

  // Validate Vietnamese phone number
  private isValidVietnamesePhone(phone: string): boolean {
    const phoneRegex = /^(\+84|84|0)?[3-9][0-9]{8}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
  }

  // Get payment method display text in Vietnamese
  getPaymentMethodText(method: string): string {
    const methods: Record<string, string> = {
      'ATM': 'Thẻ ATM nội địa',
      'CC': 'Thẻ tín dụng/Ghi nợ quốc tế',
      'QRCODE': 'Quét mã QR',
      'WALLET': 'Ví điện tử',
      'BANK': 'Chuyển khoản ngân hàng'
    };
    return methods[method] || method;
  }

  // Get response code meaning in Vietnamese
  getResponseCodeMessage(code: string): string {
    const codes: Record<string, string> = {
      '00': 'Giao dịch thành công',
      '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
      '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.',
      '10': 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
      '11': 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.',
      '12': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.',
      '13': 'Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP). Xin quý khách vui lòng thực hiện lại giao dịch.',
      '24': 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
      '51': 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.',
      '65': 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.',
      '75': 'Ngân hàng thanh toán đang bảo trì.',
      '79': 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định. Xin quý khách vui lòng thực hiện lại giao dịch',
      '99': 'Các lỗi khác (lỗi không xác định)'
    };
    return codes[code] || `Mã lỗi: ${code}`;
  }

  // Check if payment is successful
  isPaymentSuccessful(responseCode: string): boolean {
    return responseCode === '00';
  }

  // Check if payment is suspicious but successful
  isPaymentSuspicious(responseCode: string): boolean {
    return responseCode === '07';
  }
}

export const vnpayService = new VNPayService();