// Payment TypeScript types
export interface PaymentMethod {
  id: string;
  name: string;
  type: 'cash' | 'card' | 'vnpay' | 'momo' | 'zalopay' | 'bank_transfer';
  enabled: boolean;
  config?: Record<string, any>;
}

export interface PaymentRequest {
  orderId: string;
  amount: number;
  currency: 'VND';
  method: string;
  description?: string;
  returnUrl?: string;
  cancelUrl?: string;
}

export interface PaymentResponse {
  transactionId: string;
  status: 'pending' | 'success' | 'failed' | 'cancelled';
  paymentUrl?: string;
  qrCode?: string;
  message?: string;
}

export interface VNPayPayment {
  vnp_TmnCode: string;
  vnp_Amount: number;
  vnp_Command: string;
  vnp_CreateDate: string;
  vnp_CurrCode: string;
  vnp_IpAddr: string;
  vnp_Locale: string;
  vnp_OrderInfo: string;
  vnp_OrderType: string;
  vnp_ReturnUrl: string;
  vnp_TxnRef: string;
  vnp_Version: string;
  vnp_SecureHash?: string;
}

export interface MoMoPayment {
  partnerCode: string;
  requestId: string;
  amount: number;
  orderId: string;
  orderInfo: string;
  redirectUrl: string;
  ipnUrl: string;
  requestType: string;
  extraData: string;
  lang: string;
  signature?: string;
}

export interface ZaloPayPayment {
  app_id: string;
  app_trans_id: string;
  app_user: string;
  amount: number;
  description: string;
  bank_code: string;
  callback_url: string;
  mac?: string;
}
