-- Initial database schema for Vietnamese POS system
-- Migration 001: Create basic tables

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'cashier', 'staff')),
    phone TEXT,
    position TEXT,
    avatar_url TEXT,
    active INTEGER DEFAULT 1,
    last_login_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    parent_id TEXT REFERENCES categories(id),
    sort_order INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    sku TEXT UNIQUE,
    barcode TEXT UNIQUE,
    category_id TEXT REFERENCES categories(id),
    price DECIMAL(15,2) NOT NULL,
    cost_price DECIMAL(15,2),
    stock_quantity INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 0,
    max_stock_level INTEGER,
    unit TEXT DEFAULT 'pcs',
    weight DECIMAL(10,3),
    dimensions TEXT, -- JSON: {length, width, height}
    image_url TEXT,
    images TEXT, -- JSON array of image URLs
    tags TEXT, -- JSON array of tags
    active INTEGER DEFAULT 1,
    track_inventory INTEGER DEFAULT 1,
    allow_negative_stock INTEGER DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 10.00, -- Vietnamese VAT 10%
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    district TEXT,
    ward TEXT,
    postal_code TEXT,
    birth_date DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    loyalty_points INTEGER DEFAULT 0,
    loyalty_tier TEXT DEFAULT 'bronze' CHECK (loyalty_tier IN ('bronze', 'silver', 'gold', 'platinum')),
    total_spent DECIMAL(15,2) DEFAULT 0,
    visit_count INTEGER DEFAULT 0,
    last_visit_at DATETIME,
    notes TEXT,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    order_number TEXT UNIQUE NOT NULL,
    customer_id TEXT REFERENCES customers(id),
    cashier_id TEXT NOT NULL REFERENCES users(id),
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled', 'refunded')),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'vnpay', 'momo', 'zalopay', 'bank_transfer')),
    payment_status TEXT DEFAULT 'paid' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    subtotal DECIMAL(15,2) NOT NULL,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    discount_type TEXT CHECK (discount_type IN ('fixed', 'percentage')),
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    cash_received DECIMAL(15,2),
    change_amount DECIMAL(15,2),
    loyalty_points_used INTEGER DEFAULT 0,
    loyalty_points_earned INTEGER DEFAULT 0,
    notes TEXT,
    receipt_printed INTEGER DEFAULT 0,
    void_reason TEXT,
    voided_by TEXT REFERENCES users(id),
    voided_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES products(id),
    product_name TEXT NOT NULL, -- Store name at time of sale
    product_sku TEXT,
    product_barcode TEXT,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    total_price DECIMAL(15,2) NOT NULL,
    tax_rate DECIMAL(5,2) DEFAULT 10.00,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Inventory movements table
CREATE TABLE IF NOT EXISTS inventory_movements (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES products(id),
    type TEXT NOT NULL CHECK (type IN ('in', 'out', 'adjustment', 'transfer')),
    quantity INTEGER NOT NULL,
    previous_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    unit_cost DECIMAL(15,2),
    reference_type TEXT, -- 'order', 'adjustment', 'purchase', 'transfer'
    reference_id TEXT,
    reason TEXT,
    notes TEXT,
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Loyalty program table
CREATE TABLE IF NOT EXISTS loyalty_programs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    points_per_vnd DECIMAL(10,4) DEFAULT 0.001, -- 1 point per 1000 VND
    vnd_per_point DECIMAL(10,4) DEFAULT 1000, -- 1000 VND per point
    min_points_redeem INTEGER DEFAULT 100,
    max_points_redeem INTEGER,
    expiry_months INTEGER DEFAULT 12,
    tier_bronze_min INTEGER DEFAULT 0,
    tier_silver_min INTEGER DEFAULT 1000,
    tier_gold_min INTEGER DEFAULT 5000,
    tier_platinum_min INTEGER DEFAULT 10000,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Loyalty transactions table
CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL REFERENCES customers(id),
    order_id TEXT REFERENCES orders(id),
    type TEXT NOT NULL CHECK (type IN ('earned', 'redeemed', 'expired', 'adjusted')),
    points INTEGER NOT NULL,
    balance_before INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    description TEXT,
    expires_at DATETIME,
    created_by TEXT REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Payment transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES orders(id),
    payment_method TEXT NOT NULL,
    gateway TEXT, -- 'vnpay', 'momo', 'zalopay'
    gateway_transaction_id TEXT,
    amount DECIMAL(15,2) NOT NULL,
    currency TEXT DEFAULT 'VND',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'cancelled')),
    gateway_response TEXT, -- JSON response from payment gateway
    fee_amount DECIMAL(15,2) DEFAULT 0,
    processed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Settings table for system configuration
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    type TEXT DEFAULT 'string' CHECK (type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    category TEXT DEFAULT 'general',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_cashier ON orders(cashier_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_product ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_type ON inventory_movements(type);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at ON inventory_movements(created_at);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_active ON customers(active);

CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_customer ON loyalty_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_order ON loyalty_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_type ON loyalty_transactions(type);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_order ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_gateway ON payment_transactions(gateway);

-- Insert default admin user (password: admin123)
INSERT OR REPLACE INTO users (
    id, email, password_hash, name, role, active
) VALUES (
    'admin-001',
    'admin@khoaugment.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- bcrypt hash of 'admin123'
    'System Administrator',
    'admin',
    1
);

-- Insert default categories
INSERT OR REPLACE INTO categories (id, name, description, sort_order) VALUES
('cat-001', 'Đồ uống', 'Nước uống các loại', 1),
('cat-002', 'Thức ăn', 'Thực phẩm và đồ ăn', 2),
('cat-003', 'Snack', 'Bánh kẹo và đồ ăn vặt', 3),
('cat-004', 'Hàng gia dụng', 'Đồ dùng gia đình', 4),
('cat-005', 'Khác', 'Sản phẩm khác', 5);

-- Insert default loyalty program
INSERT OR REPLACE INTO loyalty_programs (
    id, name, description, points_per_vnd, vnd_per_point
) VALUES (
    'loyalty-001',
    'KhoAugment Loyalty',
    'Chương trình tích điểm thành viên',
    0.001,
    1000
);

-- Insert default system settings
INSERT OR REPLACE INTO settings (key, value, type, description, category) VALUES
('business_name', 'KhoAugment Store', 'string', 'Tên cửa hàng', 'business'),
('business_address', '123 Nguyễn Trãi, Quận 1, TP.HCM', 'string', 'Địa chỉ cửa hàng', 'business'),
('business_phone', '0901234567', 'string', 'Số điện thoại cửa hàng', 'business'),
('business_email', 'info@khoaugment.com', 'string', 'Email cửa hàng', 'business'),
('tax_rate', '10', 'number', 'Thuế VAT (%)', 'business'),
('currency', 'VND', 'string', 'Đơn vị tiền tệ', 'business'),
('receipt_footer', 'Cảm ơn quý khách!', 'string', 'Footer hóa đơn', 'receipt'),
('loyalty_enabled', 'true', 'boolean', 'Kích hoạt tích điểm', 'loyalty'),
('auto_print_receipt', 'false', 'boolean', 'Tự động in hóa đơn', 'pos'),
('low_stock_alert', '5', 'number', 'Cảnh báo hết hàng', 'inventory');