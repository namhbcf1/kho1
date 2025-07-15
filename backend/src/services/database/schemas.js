// Zod schemas for Vietnamese POS system validation
import { z } from 'zod';
// Base schemas
export const IdSchema = z.number().int().positive();
export const TimestampSchema = z.string().datetime();
export const MoneySchema = z.number().min(0).max(999999999); // Max 999 million VND
export const PercentageSchema = z.number().min(0).max(100);
export const StatusSchema = z.enum(['active', 'inactive']);
// Vietnamese-specific schemas
export const VietnamesePhoneSchema = z.string()
    .regex(/^(\+84|84|0)(3|5|7|8|9)[0-9]{8}$/, 'Invalid Vietnamese phone number format');
export const VietnameseTaxCodeSchema = z.string()
    .regex(/^[0-9]{10}(-[0-9]{3})?$/, 'Invalid Vietnamese tax code format');
export const VietnameseAddressSchema = z.object({
    street: z.string().min(1).max(200),
    ward: z.string().min(1).max(100),
    district: z.string().min(1).max(100),
    province: z.string().min(1).max(100),
});
// Product schemas
export const ProductCreateSchema = z.object({
    name: z.string().min(1).max(200).trim(),
    description: z.string().max(1000).optional(),
    price: MoneySchema,
    cost_price: MoneySchema.optional(),
    sku: z.string().max(50).optional(),
    barcode: z.string().max(100).optional(),
    category_id: IdSchema.optional(),
    brand: z.string().max(100).optional(),
    unit: z.string().max(20).default('cái'),
    stock_quantity: z.number().int().min(0).default(0),
    min_stock_level: z.number().int().min(0).optional(),
    status: StatusSchema.default('active'),
    vat_rate: PercentageSchema.optional(),
    images: z.array(z.string().url()).max(10).default([]),
    attributes: z.record(z.any()).optional(),
});
export const ProductUpdateSchema = ProductCreateSchema.partial();
export const ProductSchema = ProductCreateSchema.extend({
    id: IdSchema,
    created_at: TimestampSchema,
    updated_at: TimestampSchema,
});
// Customer schemas
export const CustomerCreateSchema = z.object({
    name: z.string().min(1).max(200).trim(),
    phone: VietnamesePhoneSchema.optional(),
    email: z.string().email().max(200).optional(),
    address: z.string().max(500).optional(),
    ward: z.string().max(100).optional(),
    district: z.string().max(100).optional(),
    province: z.string().max(100).optional(),
    date_of_birth: z.string().date().optional(),
    gender: z.enum(['male', 'female', 'other']).optional(),
    loyalty_points: z.number().int().min(0).default(0),
    total_spent: MoneySchema.default(0),
    visit_count: z.number().int().min(0).default(0),
    status: StatusSchema.default('active'),
});
export const CustomerUpdateSchema = CustomerCreateSchema.partial();
export const CustomerSchema = CustomerCreateSchema.extend({
    id: IdSchema,
    last_visit: TimestampSchema.optional(),
    created_at: TimestampSchema,
    updated_at: TimestampSchema,
});
// Order schemas
export const OrderItemCreateSchema = z.object({
    product_id: IdSchema,
    product_name: z.string().min(1).max(200),
    product_sku: z.string().max(50).optional(),
    quantity: z.number().min(0.01).max(9999),
    unit_price: MoneySchema,
    discount_amount: MoneySchema.default(0),
    vat_rate: PercentageSchema.optional(),
    vat_amount: MoneySchema.default(0),
    total_amount: MoneySchema,
});
export const OrderItemSchema = OrderItemCreateSchema.extend({
    id: IdSchema,
    order_id: IdSchema,
    created_at: TimestampSchema,
});
export const OrderCreateSchema = z.object({
    order_number: z.string().min(1).max(50),
    customer_id: IdSchema.optional(),
    customer_name: z.string().max(200).optional(),
    customer_phone: VietnamesePhoneSchema.optional(),
    customer_email: z.string().email().max(200).optional(),
    subtotal: MoneySchema,
    discount_amount: MoneySchema.default(0),
    tax_amount: MoneySchema.default(0),
    total_amount: MoneySchema,
    paid_amount: MoneySchema,
    change_amount: MoneySchema.default(0),
    payment_method: z.enum(['cash', 'card', 'vnpay', 'momo', 'zalopay', 'bank_transfer']),
    payment_status: z.enum(['pending', 'paid', 'partially_paid', 'refunded']).default('pending'),
    order_status: z.enum(['draft', 'completed', 'cancelled', 'refunded']).default('draft'),
    cashier_id: IdSchema,
    cashier_name: z.string().min(1).max(200),
    notes: z.string().max(1000).optional(),
    receipt_printed: z.boolean().default(false),
    items: z.array(OrderItemCreateSchema).min(1),
});
export const OrderUpdateSchema = OrderCreateSchema.partial().omit({ items: true });
export const OrderSchema = OrderCreateSchema.extend({
    id: IdSchema,
    created_at: TimestampSchema,
    updated_at: TimestampSchema,
}).omit({ items: true });
// Staff schemas
export const StaffCreateSchema = z.object({
    username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    full_name: z.string().min(1).max(200).trim(),
    email: z.string().email().max(200).optional(),
    phone: VietnamesePhoneSchema.optional(),
    role: z.enum(['admin', 'manager', 'cashier', 'staff']),
    permissions: z.array(z.string()).default([]),
    status: StatusSchema.default('active'),
    password: z.string().min(8).max(128),
});
export const StaffUpdateSchema = StaffCreateSchema.partial().omit({ password: true });
export const StaffSchema = StaffCreateSchema.extend({
    id: IdSchema,
    last_login: TimestampSchema.optional(),
    created_at: TimestampSchema,
    updated_at: TimestampSchema,
}).omit({ password: true });
// Inventory schemas
export const InventoryCreateSchema = z.object({
    product_id: IdSchema,
    location: z.string().max(100).optional(),
    quantity_available: z.number().int().min(0),
    quantity_reserved: z.number().int().min(0).default(0),
    quantity_incoming: z.number().int().min(0).default(0),
    quantity_damaged: z.number().int().min(0).default(0),
    last_stock_check: TimestampSchema.optional(),
});
export const InventoryUpdateSchema = InventoryCreateSchema.partial();
export const InventorySchema = InventoryCreateSchema.extend({
    id: IdSchema,
    created_at: TimestampSchema,
    updated_at: TimestampSchema,
});
// Settings schemas
export const SettingsCreateSchema = z.object({
    key: z.string().min(1).max(100),
    value: z.string().max(5000),
    description: z.string().max(500).optional(),
    category: z.string().min(1).max(50),
    data_type: z.enum(['string', 'number', 'boolean', 'json']).default('string'),
    is_public: z.boolean().default(false),
});
export const SettingsUpdateSchema = SettingsCreateSchema.partial();
export const SettingsSchema = SettingsCreateSchema.extend({
    id: IdSchema,
    created_at: TimestampSchema,
    updated_at: TimestampSchema,
});
// Loyalty schemas
export const LoyaltyTransactionCreateSchema = z.object({
    customer_id: IdSchema,
    order_id: IdSchema.optional(),
    points_earned: z.number().int().min(0).default(0),
    points_redeemed: z.number().int().min(0).default(0),
    transaction_type: z.enum(['earn', 'redeem', 'expire', 'adjust']),
    description: z.string().max(500).optional(),
});
export const LoyaltyTransactionSchema = LoyaltyTransactionCreateSchema.extend({
    id: IdSchema,
    created_at: TimestampSchema,
});
// Analytics schemas
export const SalesAnalyticsSchema = z.object({
    date: z.string().date(),
    total_sales: MoneySchema,
    total_orders: z.number().int().min(0),
    average_order_value: MoneySchema,
    top_products: z.array(z.string()),
    payment_methods: z.record(z.number().min(0)),
    hourly_sales: z.record(z.number().min(0)),
});
export const InventoryAnalyticsSchema = z.object({
    product_id: IdSchema,
    product_name: z.string().min(1).max(200),
    current_stock: z.number().int().min(0),
    sold_quantity: z.number().min(0),
    revenue: MoneySchema,
    profit: MoneySchema,
    turnover_rate: z.number().min(0),
    days_of_supply: z.number().min(0),
});
// API request/response schemas
export const PaginationSchema = z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(50),
});
export const SearchSchema = z.object({
    query: z.string().max(200).optional(),
    category: z.string().max(50).optional(),
    status: StatusSchema.optional(),
    date_from: z.string().date().optional(),
    date_to: z.string().date().optional(),
}).merge(PaginationSchema);
export const ApiResponseSchema = z.object({
    success: z.boolean(),
    message: z.string().optional(),
    data: z.any().optional(),
    error: z.object({
        message: z.string(),
        code: z.string(),
    }).optional(),
    pagination: z.object({
        page: z.number().int(),
        limit: z.number().int(),
        total: z.number().int(),
        totalPages: z.number().int(),
        hasNext: z.boolean(),
        hasPrev: z.boolean(),
    }).optional(),
    timestamp: TimestampSchema,
});
// Vietnamese business validation schemas
export const VietnamProvincesSchema = z.enum([
    'An Giang', 'Bà Rịa - Vũng Tàu', 'Bắc Giang', 'Bắc Kạn', 'Bạc Liêu',
    'Bắc Ninh', 'Bến Tre', 'Bình Định', 'Bình Dương', 'Bình Phước',
    'Bình Thuận', 'Cà Mau', 'Cao Bằng', 'Đắk Lắk', 'Đắk Nông',
    'Điện Biên', 'Đồng Nai', 'Đồng Tháp', 'Gia Lai', 'Hà Giang',
    'Hà Nam', 'Hà Tĩnh', 'Hải Dương', 'Hậu Giang', 'Hòa Bình',
    'Hưng Yên', 'Khánh Hòa', 'Kiên Giang', 'Kon Tum', 'Lai Châu',
    'Lâm Đồng', 'Lạng Sơn', 'Lào Cai', 'Long An', 'Nam Định',
    'Nghệ An', 'Ninh Bình', 'Ninh Thuận', 'Phú Thọ', 'Phú Yên',
    'Quảng Bình', 'Quảng Nam', 'Quảng Ngãi', 'Quảng Ninh', 'Quảng Trị',
    'Sóc Trăng', 'Sơn La', 'Tây Ninh', 'Thái Bình', 'Thái Nguyên',
    'Thanh Hóa', 'Thừa Thiên Huế', 'Tiền Giang', 'Trà Vinh', 'Tuyên Quang',
    'Vĩnh Long', 'Vĩnh Phúc', 'Yên Bái', 'Hà Nội', 'Hồ Chí Minh',
    'Cần Thơ', 'Đà Nẵng', 'Hải Phòng'
]);
export const VATRateSchema = z.enum(['0', '5', '8', '10']).transform(val => parseInt(val));
export const PaymentMethodSchema = z.object({
    method: z.enum(['cash', 'card', 'vnpay', 'momo', 'zalopay', 'bank_transfer']),
    amount: MoneySchema,
    currency: z.literal('VND').default('VND'),
    reference: z.string().max(100).optional(),
    fee: MoneySchema.default(0),
});
// Export all schemas for easy access
export const Schemas = {
    // Base
    Id: IdSchema,
    Timestamp: TimestampSchema,
    Money: MoneySchema,
    Percentage: PercentageSchema,
    Status: StatusSchema,
    // Vietnamese specific
    VietnamesePhone: VietnamesePhoneSchema,
    VietnameseTaxCode: VietnameseTaxCodeSchema,
    VietnameseAddress: VietnameseAddressSchema,
    VietnamProvinces: VietnamProvincesSchema,
    VATRate: VATRateSchema,
    // Products
    ProductCreate: ProductCreateSchema,
    ProductUpdate: ProductUpdateSchema,
    Product: ProductSchema,
    // Customers
    CustomerCreate: CustomerCreateSchema,
    CustomerUpdate: CustomerUpdateSchema,
    Customer: CustomerSchema,
    // Orders
    OrderItemCreate: OrderItemCreateSchema,
    OrderItem: OrderItemSchema,
    OrderCreate: OrderCreateSchema,
    OrderUpdate: OrderUpdateSchema,
    Order: OrderSchema,
    // Staff
    StaffCreate: StaffCreateSchema,
    StaffUpdate: StaffUpdateSchema,
    Staff: StaffSchema,
    // Inventory
    InventoryCreate: InventoryCreateSchema,
    InventoryUpdate: InventoryUpdateSchema,
    Inventory: InventorySchema,
    // Settings
    SettingsCreate: SettingsCreateSchema,
    SettingsUpdate: SettingsUpdateSchema,
    Settings: SettingsSchema,
    // Loyalty
    LoyaltyTransactionCreate: LoyaltyTransactionCreateSchema,
    LoyaltyTransaction: LoyaltyTransactionSchema,
    // Analytics
    SalesAnalytics: SalesAnalyticsSchema,
    InventoryAnalytics: InventoryAnalyticsSchema,
    // API
    Pagination: PaginationSchema,
    Search: SearchSchema,
    ApiResponse: ApiResponseSchema,
    PaymentMethod: PaymentMethodSchema,
};
