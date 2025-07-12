// Zod order validation schemas
import { z } from 'zod';

export const OrderItemSchema = z.object({
  id: z.string(),
  productId: z.string().min(1, 'ID sản phẩm không được để trống'),
  variantId: z.string().optional(),
  name: z.string().min(1, 'Tên sản phẩm không được để trống'),
  price: z.number().min(0, 'Giá phải lớn hơn hoặc bằng 0'),
  quantity: z.number().int().min(1, 'Số lượng phải lớn hơn 0'),
  discountType: z.enum(['percentage', 'fixed_amount']).optional(),
  discountValue: z.number().min(0, 'Giá trị giảm giá phải lớn hơn hoặc bằng 0').optional(),
  discountAmount: z.number().min(0, 'Số tiền giảm giá phải lớn hơn hoặc bằng 0').default(0),
  total: z.number().min(0, 'Tổng tiền phải lớn hơn hoặc bằng 0'),
  notes: z.string().max(500, 'Ghi chú quá dài').optional(),
});

export const CreateOrderItemSchema = OrderItemSchema.omit({
  id: true,
  total: true,
  discountAmount: true,
});

export const OrderSchema = z.object({
  id: z.string(),
  orderNumber: z.string().min(1, 'Số đơn hàng không được để trống'),
  customerId: z.string().optional(),
  customerName: z.string().optional(),
  cashierId: z.string().min(1, 'ID nhân viên không được để trống'),
  cashierName: z.string().min(1, 'Tên nhân viên không được để trống'),
  items: z.array(OrderItemSchema).min(1, 'Đơn hàng phải có ít nhất một sản phẩm'),
  subtotal: z.number().min(0, 'Tạm tính phải lớn hơn hoặc bằng 0'),
  discountType: z.enum(['percentage', 'fixed_amount']).optional(),
  discountValue: z.number().min(0, 'Giá trị giảm giá phải lớn hơn hoặc bằng 0').optional(),
  discountAmount: z.number().min(0, 'Số tiền giảm giá phải lớn hơn hoặc bằng 0').default(0),
  taxRate: z.number().min(0).max(1, 'Thuế suất phải từ 0 đến 1').default(0.1),
  taxAmount: z.number().min(0, 'Tiền thuế phải lớn hơn hoặc bằng 0').default(0),
  total: z.number().min(0, 'Tổng tiền phải lớn hơn hoặc bằng 0'),
  paymentMethod: z.enum(['cash', 'card', 'vnpay', 'momo', 'zalopay', 'bank_transfer']),
  paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded', 'partial_refund']).default('pending'),
  cashReceived: z.number().min(0, 'Tiền nhận phải lớn hơn hoặc bằng 0').optional(),
  changeAmount: z.number().min(0, 'Tiền thối phải lớn hơn hoặc bằng 0').optional(),
  transactionId: z.string().optional(),
  gatewayResponse: z.any().optional(),
  status: z.enum(['pending', 'processing', 'completed', 'cancelled', 'refunded']).default('pending'),
  notes: z.string().max(1000, 'Ghi chú quá dài').optional(),
  metadata: z.any().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateOrderSchema = z.object({
  customerId: z.string().optional(),
  customerName: z.string().optional(),
  items: z.array(CreateOrderItemSchema).min(1, 'Đơn hàng phải có ít nhất một sản phẩm'),
  discountType: z.enum(['percentage', 'fixed_amount']).optional(),
  discountValue: z.number().min(0, 'Giá trị giảm giá phải lớn hơn hoặc bằng 0').optional(),
  paymentMethod: z.enum(['cash', 'card', 'vnpay', 'momo', 'zalopay', 'bank_transfer']),
  cashReceived: z.number().min(0, 'Tiền nhận phải lớn hơn hoặc bằng 0').optional(),
  notes: z.string().max(1000, 'Ghi chú quá dài').optional(),
  metadata: z.any().optional(),
});

export const UpdateOrderSchema = z.object({
  id: z.string().min(1, 'ID đơn hàng không được để trống'),
  status: z.enum(['pending', 'processing', 'completed', 'cancelled', 'refunded']).optional(),
  paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded', 'partial_refund']).optional(),
  transactionId: z.string().optional(),
  gatewayResponse: z.any().optional(),
  notes: z.string().max(1000, 'Ghi chú quá dài').optional(),
});

export const RefundOrderSchema = z.object({
  orderId: z.string().min(1, 'ID đơn hàng không được để trống'),
  amount: z.number().min(0, 'Số tiền hoàn phải lớn hơn hoặc bằng 0'),
  reason: z.string().min(1, 'Lý do hoàn tiền không được để trống').max(500, 'Lý do quá dài'),
  refundMethod: z.enum(['cash', 'original_payment', 'store_credit']).default('original_payment'),
  items: z.array(z.object({
    orderItemId: z.string(),
    quantity: z.number().int().min(1),
    reason: z.string().optional(),
  })).optional(),
});

export const OrderSearchSchema = z.object({
  q: z.string().optional(),
  customerId: z.string().optional(),
  cashierId: z.string().optional(),
  status: z.enum(['pending', 'processing', 'completed', 'cancelled', 'refunded']).optional(),
  paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded', 'partial_refund']).optional(),
  paymentMethod: z.enum(['cash', 'card', 'vnpay', 'momo', 'zalopay', 'bank_transfer']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  minTotal: z.number().min(0).optional(),
  maxTotal: z.number().min(0).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['orderNumber', 'total', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const POSOrderSchema = CreateOrderSchema.extend({
  usePoints: z.boolean().default(false),
  pointsToUse: z.number().int().min(0, 'Điểm sử dụng phải lớn hơn hoặc bằng 0').default(0),
  printReceipt: z.boolean().default(true),
  sendEmail: z.boolean().default(false),
  sendSMS: z.boolean().default(false),
});

// Validation for cash payment
export const CashPaymentSchema = z.object({
  orderId: z.string().min(1, 'ID đơn hàng không được để trống'),
  cashReceived: z.number().min(0, 'Tiền nhận phải lớn hơn hoặc bằng 0'),
}).refine((data) => {
  // This would need the order total to validate properly
  // For now, just ensure cash received is provided
  return data.cashReceived > 0;
}, {
  message: 'Tiền nhận phải lớn hơn 0',
  path: ['cashReceived'],
});

// Type exports
export type Order = z.infer<typeof OrderSchema>;
export type CreateOrder = z.infer<typeof CreateOrderSchema>;
export type UpdateOrder = z.infer<typeof UpdateOrderSchema>;
export type RefundOrder = z.infer<typeof RefundOrderSchema>;
export type OrderSearch = z.infer<typeof OrderSearchSchema>;
export type POSOrder = z.infer<typeof POSOrderSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
export type CreateOrderItem = z.infer<typeof CreateOrderItemSchema>;
export type CashPayment = z.infer<typeof CashPaymentSchema>;
