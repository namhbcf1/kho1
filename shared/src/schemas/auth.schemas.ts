// Zod auth validation schemas
import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string()
    .min(1, 'Email không được để trống')
    .email('Email không hợp lệ')
    .max(255, 'Email quá dài'),
  password: z.string()
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
    .max(255, 'Mật khẩu quá dài'),
  rememberMe: z.boolean().default(false),
});

export const RegisterSchema = z.object({
  name: z.string()
    .min(1, 'Tên không được để trống')
    .max(255, 'Tên quá dài'),
  email: z.string()
    .min(1, 'Email không được để trống')
    .email('Email không hợp lệ')
    .max(255, 'Email quá dài'),
  password: z.string()
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
    .max(255, 'Mật khẩu quá dài')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Mật khẩu phải chứa ít nhất 1 chữ thường, 1 chữ hoa và 1 số'),
  confirmPassword: z.string()
    .min(1, 'Xác nhận mật khẩu không được để trống'),
  role: z.enum(['admin', 'manager', 'cashier', 'staff']).default('staff'),
  phone: z.string()
    .regex(/^(\+84|0)[0-9]{9,10}$/, 'Số điện thoại không hợp lệ')
    .optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string()
    .min(1, 'Mật khẩu hiện tại không được để trống'),
  newPassword: z.string()
    .min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự')
    .max(255, 'Mật khẩu mới quá dài')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Mật khẩu mới phải chứa ít nhất 1 chữ thường, 1 chữ hoa và 1 số'),
  confirmNewPassword: z.string()
    .min(1, 'Xác nhận mật khẩu mới không được để trống'),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmNewPassword'],
});

export const ForgotPasswordSchema = z.object({
  email: z.string()
    .min(1, 'Email không được để trống')
    .email('Email không hợp lệ')
    .max(255, 'Email quá dài'),
});

export const ResetPasswordSchema = z.object({
  token: z.string()
    .min(1, 'Token không được để trống'),
  password: z.string()
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
    .max(255, 'Mật khẩu quá dài')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Mật khẩu phải chứa ít nhất 1 chữ thường, 1 chữ hoa và 1 số'),
  confirmPassword: z.string()
    .min(1, 'Xác nhận mật khẩu không được để trống'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string()
    .min(1, 'Refresh token không được để trống'),
});

export const UserSchema = z.object({
  id: z.string(),
  name: z.string()
    .min(1, 'Tên không được để trống')
    .max(255, 'Tên quá dài'),
  email: z.string()
    .email('Email không hợp lệ')
    .max(255, 'Email quá dài'),
  role: z.enum(['admin', 'manager', 'cashier', 'staff']),
  phone: z.string()
    .regex(/^(\+84|0)[0-9]{9,10}$/, 'Số điện thoại không hợp lệ')
    .optional(),
  active: z.boolean().default(true),
  lastLogin: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const UpdateUserProfileSchema = z.object({
  name: z.string()
    .min(1, 'Tên không được để trống')
    .max(255, 'Tên quá dài')
    .optional(),
  phone: z.string()
    .regex(/^(\+84|0)[0-9]{9,10}$/, 'Số điện thoại không hợp lệ')
    .optional(),
  avatar: z.string().url('URL avatar không hợp lệ').optional(),
  preferences: z.object({
    language: z.enum(['vi', 'en']).default('vi'),
    theme: z.enum(['light', 'dark']).default('light'),
    notifications: z.object({
      email: z.boolean().default(true),
      sms: z.boolean().default(false),
      push: z.boolean().default(true),
    }).default({}),
  }).optional(),
});

export const CreateUserSchema = z.object({
  name: z.string()
    .min(1, 'Tên không được để trống')
    .max(255, 'Tên quá dài'),
  email: z.string()
    .min(1, 'Email không được để trống')
    .email('Email không hợp lệ')
    .max(255, 'Email quá dài'),
  password: z.string()
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
    .max(255, 'Mật khẩu quá dài')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Mật khẩu phải chứa ít nhất 1 chữ thường, 1 chữ hoa và 1 số'),
  role: z.enum(['admin', 'manager', 'cashier', 'staff']).default('staff'),
  phone: z.string()
    .regex(/^(\+84|0)[0-9]{9,10}$/, 'Số điện thoại không hợp lệ')
    .optional(),
  active: z.boolean().default(true),
  permissions: z.array(z.string()).default([]),
});

export const UpdateUserSchema = z.object({
  id: z.string().min(1, 'ID người dùng không được để trống'),
  name: z.string()
    .min(1, 'Tên không được để trống')
    .max(255, 'Tên quá dài')
    .optional(),
  email: z.string()
    .email('Email không hợp lệ')
    .max(255, 'Email quá dài')
    .optional(),
  role: z.enum(['admin', 'manager', 'cashier', 'staff']).optional(),
  phone: z.string()
    .regex(/^(\+84|0)[0-9]{9,10}$/, 'Số điện thoại không hợp lệ')
    .optional(),
  active: z.boolean().optional(),
  permissions: z.array(z.string()).optional(),
});

export const LoginResponseSchema = z.object({
  user: UserSchema,
  token: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number().int().min(1),
});

export const PermissionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  resource: z.string(),
  action: z.string(),
});

export const RoleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  permissions: z.array(PermissionSchema),
  active: z.boolean().default(true),
});

// Type exports
export type Login = z.infer<typeof LoginSchema>;
export type Register = z.infer<typeof RegisterSchema>;
export type ChangePassword = z.infer<typeof ChangePasswordSchema>;
export type ForgotPassword = z.infer<typeof ForgotPasswordSchema>;
export type ResetPassword = z.infer<typeof ResetPasswordSchema>;
export type RefreshToken = z.infer<typeof RefreshTokenSchema>;
export type User = z.infer<typeof UserSchema>;
export type UpdateUserProfile = z.infer<typeof UpdateUserProfileSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type Permission = z.infer<typeof PermissionSchema>;
export type Role = z.infer<typeof RoleSchema>;
