// Zod customer validation schemas
import { z } from 'zod';

export const AddressSchema = z.object({
  street: z.string().min(1, 'Địa chỉ không được để trống').max(255, 'Địa chỉ quá dài'),
  ward: z.string().min(1, 'Phường/Xã không được để trống').max(100, 'Phường/Xã quá dài'),
  district: z.string().min(1, 'Quận/Huyện không được để trống').max(100, 'Quận/Huyện quá dài'),
  province: z.string().min(1, 'Tỉnh/Thành phố không được để trống').max(100, 'Tỉnh/Thành phố quá dài'),
  postalCode: z.string().max(10, 'Mã bưu điện quá dài').optional(),
  country: z.string().max(50, 'Quốc gia quá dài').default('Việt Nam'),
});

export const LoyaltyTierSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Tên hạng thành viên không được để trống'),
  minimumSpent: z.number().min(0, 'Số tiền tối thiểu phải lớn hơn hoặc bằng 0'),
  discountPercentage: z.number().min(0).max(100, 'Phần trăm giảm giá phải từ 0 đến 100'),
  pointsMultiplier: z.number().min(1, 'Hệ số điểm phải lớn hơn hoặc bằng 1'),
  benefits: z.array(z.string()).default([]),
});

export const CustomerSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Tên khách hàng không được để trống').max(255, 'Tên khách hàng quá dài'),
  email: z.string().email('Email không hợp lệ').max(255, 'Email quá dài').optional(),
  phone: z.string()
    .regex(/^(\+84|0)[0-9]{9,10}$/, 'Số điện thoại không hợp lệ')
    .max(15, 'Số điện thoại quá dài')
    .optional(),
  address: AddressSchema.optional(),
  dateOfBirth: z.string().datetime().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  loyaltyPoints: z.number().int().min(0, 'Điểm thưởng phải lớn hơn hoặc bằng 0').default(0),
  totalSpent: z.number().min(0, 'Tổng chi tiêu phải lớn hơn hoặc bằng 0').default(0),
  totalOrders: z.number().int().min(0, 'Tổng đơn hàng phải lớn hơn hoặc bằng 0').default(0),
  averageOrderValue: z.number().min(0, 'Giá trị đơn hàng trung bình phải lớn hơn hoặc bằng 0').default(0),
  lastVisit: z.string().datetime().optional(),
  tierId: z.string().optional(),
  tier: LoyaltyTierSchema.optional(),
  preferences: z.any().optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().max(1000, 'Ghi chú quá dài').optional(),
  active: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateCustomerSchema = z.object({
  name: z.string().min(1, 'Tên khách hàng không được để trống').max(255, 'Tên khách hàng quá dài'),
  email: z.string().email('Email không hợp lệ').max(255, 'Email quá dài').optional(),
  phone: z.string()
    .regex(/^(\+84|0)[0-9]{9,10}$/, 'Số điện thoại không hợp lệ')
    .max(15, 'Số điện thoại quá dài')
    .optional(),
  address: AddressSchema.optional(),
  dateOfBirth: z.string().datetime().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().max(1000, 'Ghi chú quá dài').optional(),
  preferences: z.any().optional(),
}).refine((data) => {
  // At least email or phone must be provided
  return data.email || data.phone;
}, {
  message: 'Phải cung cấp ít nhất email hoặc số điện thoại',
  path: ['email'],
});

export const UpdateCustomerSchema = CreateCustomerSchema.partial().extend({
  id: z.string().min(1, 'ID khách hàng không được để trống'),
  loyaltyPoints: z.number().int().min(0, 'Điểm thưởng phải lớn hơn hoặc bằng 0').optional(),
  active: z.boolean().optional(),
});

export const CustomerSearchSchema = z.object({
  q: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  tierId: z.string().optional(),
  active: z.boolean().optional(),
  hasOrders: z.boolean().optional(),
  minTotalSpent: z.number().min(0).optional(),
  maxTotalSpent: z.number().min(0).optional(),
  minLoyaltyPoints: z.number().int().min(0).optional(),
  maxLoyaltyPoints: z.number().int().min(0).optional(),
  tags: z.array(z.string()).optional(),
  province: z.string().optional(),
  district: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['name', 'email', 'totalSpent', 'loyaltyPoints', 'createdAt', 'lastVisit']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const LoyaltyPointsTransactionSchema = z.object({
  customerId: z.string().min(1, 'ID khách hàng không được để trống'),
  points: z.number().int().min(1, 'Điểm phải lớn hơn 0'),
  type: z.enum(['earn', 'redeem', 'expire', 'adjust']),
  orderId: z.string().optional(),
  reason: z.string().max(500, 'Lý do quá dài').optional(),
  expiryDate: z.string().datetime().optional(),
});

export const CustomerLoyaltySchema = z.object({
  customerId: z.string().min(1, 'ID khách hàng không được để trống'),
  currentPoints: z.number().int().min(0, 'Điểm hiện tại phải lớn hơn hoặc bằng 0'),
  totalEarned: z.number().int().min(0, 'Tổng điểm đã kiếm phải lớn hơn hoặc bằng 0'),
  totalRedeemed: z.number().int().min(0, 'Tổng điểm đã dùng phải lớn hơn hoặc bằng 0'),
  currentTier: LoyaltyTierSchema.optional(),
  nextTier: LoyaltyTierSchema.optional(),
  pointsToNextTier: z.number().int().min(0, 'Điểm cần để lên hạng phải lớn hơn hoặc bằng 0'),
  transactions: z.array(LoyaltyPointsTransactionSchema).default([]),
});

export const BulkUpdateCustomersSchema = z.object({
  customerIds: z.array(z.string()).min(1, 'Phải chọn ít nhất một khách hàng'),
  updates: z.object({
    tierId: z.string().optional(),
    active: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
    notes: z.string().max(1000, 'Ghi chú quá dài').optional(),
  }),
});

export const CustomerImportSchema = z.object({
  customers: z.array(CreateCustomerSchema).min(1, 'Phải có ít nhất một khách hàng'),
  skipDuplicates: z.boolean().default(true),
  updateExisting: z.boolean().default(false),
});

// Type exports
export type Customer = z.infer<typeof CustomerSchema>;
export type CreateCustomer = z.infer<typeof CreateCustomerSchema>;
export type UpdateCustomer = z.infer<typeof UpdateCustomerSchema>;
export type CustomerSearch = z.infer<typeof CustomerSearchSchema>;
export type LoyaltyPointsTransaction = z.infer<typeof LoyaltyPointsTransactionSchema>;
export type CustomerLoyalty = z.infer<typeof CustomerLoyaltySchema>;
export type BulkUpdateCustomers = z.infer<typeof BulkUpdateCustomersSchema>;
export type CustomerImport = z.infer<typeof CustomerImportSchema>;
export type Address = z.infer<typeof AddressSchema>;
export type LoyaltyTier = z.infer<typeof LoyaltyTierSchema>;
