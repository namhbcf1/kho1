// Validation utilities for Vietnamese business logic
import { z } from 'zod';

// Vietnamese phone number validation
export const vietnamesePhoneSchema = z.string()
  .regex(/^(\+84|84|0)(3|5|7|8|9)[0-9]{8}$/, 'Số điện thoại không hợp lệ')
  .transform(phone => {
    // Normalize to +84 format
    if (phone.startsWith('0')) {
      return '+84' + phone.slice(1);
    }
    if (phone.startsWith('84')) {
      return '+' + phone;
    }
    return phone;
  });

// Vietnamese email validation
export const vietnameseEmailSchema = z.string()
  .email('Email không hợp lệ')
  .toLowerCase();

// Vietnamese name validation
export const vietnameseNameSchema = z.string()
  .min(2, 'Tên phải có ít nhất 2 ký tự')
  .max(50, 'Tên không được quá 50 ký tự')
  .regex(/^[a-zA-ZÀ-ỹ\s]+$/, 'Tên chỉ được chứa chữ cái và khoảng trắng');

// Vietnamese address validation
export const vietnameseAddressSchema = z.object({
  street: z.string().optional(),
  ward: z.string().optional(),
  district: z.string().optional(),
  province: z.string().min(1, 'Vui lòng chọn tỉnh/thành phố'),
  country: z.string().default('Việt Nam'),
  postalCode: z.string().optional(),
});

// Tax code validation (Vietnamese business registration number)
export const taxCodeSchema = z.string()
  .regex(/^[0-9]{10}(-[0-9]{3})?$/, 'Mã số thuế không hợp lệ (10 số hoặc 10-3 số)');

// Price validation (VND)
export const priceSchema = z.number()
  .min(0, 'Giá không được âm')
  .max(999999999, 'Giá quá lớn')
  .transform(price => Math.round(price)); // Round to nearest VND

// Quantity validation
export const quantitySchema = z.number()
  .int('Số lượng phải là số nguyên')
  .min(0, 'Số lượng không được âm')
  .max(999999, 'Số lượng quá lớn');

// Barcode validation
export const barcodeSchema = z.string()
  .regex(/^[0-9]{8,13}$/, 'Mã vạch phải có 8-13 chữ số');

// SKU validation
export const skuSchema = z.string()
  .min(1, 'SKU không được để trống')
  .max(20, 'SKU không được quá 20 ký tự')
  .regex(/^[A-Z0-9-_]+$/, 'SKU chỉ được chứa chữ hoa, số, dấu gạch ngang và gạch dưới');

// Product validation schema
export const productSchema = z.object({
  name: z.string().min(1, 'Tên sản phẩm không được để trống').max(100, 'Tên sản phẩm quá dài'),
  description: z.string().max(500, 'Mô tả quá dài').optional(),
  price: priceSchema,
  cost: priceSchema.optional(),
  stock: quantitySchema,
  minStock: quantitySchema.optional(),
  barcode: barcodeSchema.optional(),
  sku: skuSchema.optional(),
  categoryId: z.string().min(1, 'Vui lòng chọn danh mục'),
  images: z.array(z.string().url()).optional(),
  active: z.boolean().default(true),
});

// Customer validation schema
export const customerSchema = z.object({
  name: vietnameseNameSchema,
  email: vietnameseEmailSchema.optional(),
  phone: vietnamesePhoneSchema.optional(),
  address: vietnameseAddressSchema.optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
});

// Order validation schema
export const orderSchema = z.object({
  customerId: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().min(1),
    name: z.string().min(1),
    price: priceSchema,
    quantity: quantitySchema.min(1),
    total: priceSchema,
  })).min(1, 'Đơn hàng phải có ít nhất 1 sản phẩm'),
  subtotal: priceSchema,
  discount: priceSchema.default(0),
  tax: priceSchema.default(0),
  total: priceSchema,
  paymentMethod: z.enum(['cash', 'card', 'vnpay', 'momo', 'zalopay', 'bank_transfer']),
  cashReceived: priceSchema.optional(),
  change: priceSchema.optional(),
  notes: z.string().max(200).optional(),
});

// User validation schema
export const userSchema = z.object({
  email: vietnameseEmailSchema,
  name: vietnameseNameSchema,
  phone: vietnamesePhoneSchema.optional(),
  position: z.string().max(50).optional(),
  role: z.enum(['admin', 'manager', 'cashier', 'staff']),
  active: z.boolean().default(true),
});

// Login validation schema
export const loginSchema = z.object({
  email: vietnameseEmailSchema,
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  remember: z.boolean().optional(),
});

// Change password validation schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
  newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
  confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu mới'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

// Business settings validation schema
export const businessSettingsSchema = z.object({
  name: z.string().min(1, 'Tên doanh nghiệp không được để trống'),
  address: vietnameseAddressSchema,
  phone: vietnamesePhoneSchema,
  email: vietnameseEmailSchema,
  website: z.string().url('Website không hợp lệ').optional(),
  taxCode: taxCodeSchema.optional(),
  currency: z.string().default('VND'),
  timezone: z.string().default('Asia/Ho_Chi_Minh'),
  language: z.string().default('vi'),
  taxRate: z.number().min(0).max(1, 'Thuế suất phải từ 0-100%'),
});

// Validation helper functions
export const validateVietnamesePhone = (phone: string): boolean => {
  return vietnamesePhoneSchema.safeParse(phone).success;
};

export const validateVietnameseEmail = (email: string): boolean => {
  return vietnameseEmailSchema.safeParse(email).success;
};

export const validateTaxCode = (taxCode: string): boolean => {
  return taxCodeSchema.safeParse(taxCode).success;
};

export const validateBarcode = (barcode: string): boolean => {
  return barcodeSchema.safeParse(barcode).success;
};

export const validatePrice = (price: number): boolean => {
  return priceSchema.safeParse(price).success;
};

// Format validation error messages
export const formatValidationErrors = (errors: z.ZodError): Record<string, string> => {
  const formatted: Record<string, string> = {};
  
  errors.errors.forEach(error => {
    const path = error.path.join('.');
    formatted[path] = error.message;
  });
  
  return formatted;
};

// Validate form data with schema
export const validateFormData = <T>(schema: z.ZodSchema<T>, data: any): {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
} => {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  } else {
    return {
      success: false,
      errors: formatValidationErrors(result.error),
    };
  }
};
