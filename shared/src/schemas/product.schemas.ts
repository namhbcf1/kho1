// Zod product validation schemas
import { z } from 'zod';

export const ProductVariantSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Tên biến thể không được để trống'),
  value: z.string().min(1, 'Giá trị biến thể không được để trống'),
  price: z.number().min(0, 'Giá phải lớn hơn hoặc bằng 0').optional(),
  stock: z.number().int().min(0, 'Tồn kho phải lớn hơn hoặc bằng 0').optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
});

export const ProductAttributeSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Tên thuộc tính không được để trống'),
  value: z.string().min(1, 'Giá trị thuộc tính không được để trống'),
  type: z.enum(['text', 'number', 'boolean', 'select']),
});

export const ProductDimensionsSchema = z.object({
  length: z.number().min(0, 'Chiều dài phải lớn hơn hoặc bằng 0'),
  width: z.number().min(0, 'Chiều rộng phải lớn hơn hoặc bằng 0'),
  height: z.number().min(0, 'Chiều cao phải lớn hơn hoặc bằng 0'),
});

export const CreateProductSchema = z.object({
  name: z.string().min(1, 'Tên sản phẩm không được để trống').max(255, 'Tên sản phẩm quá dài'),
  description: z.string().max(1000, 'Mô tả quá dài').optional(),
  price: z.number().min(0, 'Giá phải lớn hơn hoặc bằng 0'),
  cost: z.number().min(0, 'Giá vốn phải lớn hơn hoặc bằng 0').optional(),
  stock: z.number().int().min(0, 'Tồn kho phải lớn hơn hoặc bằng 0'),
  minStock: z.number().int().min(0, 'Tồn kho tối thiểu phải lớn hơn hoặc bằng 0'),
  maxStock: z.number().int().min(0, 'Tồn kho tối đa phải lớn hơn hoặc bằng 0').optional(),
  barcode: z.string().max(50, 'Mã vạch quá dài').optional(),
  sku: z.string().max(50, 'SKU quá dài').optional(),
  categoryId: z.string().min(1, 'Danh mục không được để trống'),
  supplierId: z.string().optional(),
  images: z.array(z.string().url('URL hình ảnh không hợp lệ')).default([]),
  variants: z.array(ProductVariantSchema).default([]),
  attributes: z.array(ProductAttributeSchema).default([]),
  tags: z.array(z.string()).default([]),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
  weight: z.number().min(0, 'Trọng lượng phải lớn hơn hoặc bằng 0').optional(),
  dimensions: ProductDimensionsSchema.optional(),
  expirationDate: z.string().datetime().optional(),
  batchNumber: z.string().max(50, 'Số lô quá dài').optional(),
});

export const UpdateProductSchema = CreateProductSchema.partial().extend({
  id: z.string().min(1, 'ID sản phẩm không được để trống'),
});

export const ProductSchema = CreateProductSchema.extend({
  id: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Tên danh mục không được để trống').max(255, 'Tên danh mục quá dài'),
  description: z.string().max(500, 'Mô tả quá dài').optional(),
  parentId: z.string().optional(),
  image: z.string().url('URL hình ảnh không hợp lệ').optional(),
  active: z.boolean().default(true),
  sortOrder: z.number().int().min(0, 'Thứ tự sắp xếp phải lớn hơn hoặc bằng 0').default(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateCategorySchema = CategorySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateCategorySchema = CreateCategorySchema.partial().extend({
  id: z.string().min(1, 'ID danh mục không được để trống'),
});

export const ProductSearchSchema = z.object({
  q: z.string().optional(),
  categoryId: z.string().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  inStock: z.boolean().optional(),
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['name', 'price', 'stock', 'createdAt', 'updatedAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const BulkUpdateProductsSchema = z.object({
  productIds: z.array(z.string()).min(1, 'Phải chọn ít nhất một sản phẩm'),
  updates: z.object({
    categoryId: z.string().optional(),
    active: z.boolean().optional(),
    featured: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
    price: z.number().min(0).optional(),
    stock: z.number().int().min(0).optional(),
  }),
});

// Type exports
export type Product = z.infer<typeof ProductSchema>;
export type CreateProduct = z.infer<typeof CreateProductSchema>;
export type UpdateProduct = z.infer<typeof UpdateProductSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type CreateCategory = z.infer<typeof CreateCategorySchema>;
export type UpdateCategory = z.infer<typeof UpdateCategorySchema>;
export type ProductSearch = z.infer<typeof ProductSearchSchema>;
export type BulkUpdateProducts = z.infer<typeof BulkUpdateProductsSchema>;
