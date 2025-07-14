-- Comprehensive Vietnamese POS Database Schema
-- Optimized for Cloudflare D1 with proper indexing and constraints

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    parent_id INTEGER,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (parent_id) REFERENCES categories(id)
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL CHECK (price >= 0),
    cost_price REAL CHECK (cost_price >= 0),
    sku TEXT UNIQUE,
    barcode TEXT UNIQUE,
    category_id INTEGER,
    brand TEXT,
    unit TEXT NOT NULL DEFAULT 'cái',
    min_stock_level INTEGER DEFAULT 0 CHECK (min_stock_level >= 0),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
    vat_rate REAL CHECK (vat_rate >= 0 AND vat_rate <= 100),
    images TEXT, -- JSON array of image URLs
    attributes TEXT, -- JSON object for custom attributes
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT UNIQUE,
    email TEXT UNIQUE,
    address TEXT,
    ward TEXT,
    district TEXT,
    province TEXT,
    date_of_birth TEXT,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    loyalty_points INTEGER NOT NULL DEFAULT 0 CHECK (loyalty_points >= 0),
    total_spent REAL NOT NULL DEFAULT 0 CHECK (total_spent >= 0),
    visit_count INTEGER NOT NULL DEFAULT 0 CHECK (visit_count >= 0),
    last_visit TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Staff table
CREATE TABLE IF NOT EXISTS staff (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'cashier', 'staff')),
    permissions TEXT, -- JSON array of permissions
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    last_login TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT NOT NULL UNIQUE,
    customer_id INTEGER,
    customer_name TEXT,
    customer_phone TEXT,
    customer_email TEXT,
    subtotal REAL NOT NULL CHECK (subtotal >= 0),
    discount_amount REAL NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    tax_amount REAL NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    total_amount REAL NOT NULL CHECK (total_amount >= 0),
    paid_amount REAL NOT NULL CHECK (paid_amount >= 0),
    change_amount REAL NOT NULL DEFAULT 0 CHECK (change_amount >= 0),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'vnpay', 'momo', 'zalopay', 'bank_transfer')),
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partially_paid', 'refunded')),
    order_status TEXT NOT NULL DEFAULT 'draft' CHECK (order_status IN ('draft', 'completed', 'cancelled', 'refunded')),
    cashier_id INTEGER NOT NULL,
    cashier_name TEXT NOT NULL,
    notes TEXT,
    receipt_printed INTEGER NOT NULL DEFAULT 0 CHECK (receipt_printed IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (cashier_id) REFERENCES staff(id)
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    product_sku TEXT,
    quantity REAL NOT NULL CHECK (quantity > 0),
    unit_price REAL NOT NULL CHECK (unit_price >= 0),
    discount_amount REAL NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    vat_rate REAL CHECK (vat_rate >= 0 AND vat_rate <= 100),
    vat_amount REAL NOT NULL DEFAULT 0 CHECK (vat_amount >= 0),
    total_amount REAL NOT NULL CHECK (total_amount >= 0),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Inventory table
CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL UNIQUE,
    location TEXT,
    quantity_available INTEGER NOT NULL DEFAULT 0 CHECK (quantity_available >= 0),
    quantity_reserved INTEGER NOT NULL DEFAULT 0 CHECK (quantity_reserved >= 0),
    quantity_incoming INTEGER NOT NULL DEFAULT 0 CHECK (quantity_incoming >= 0),
    quantity_damaged INTEGER NOT NULL DEFAULT 0 CHECK (quantity_damaged >= 0),
    last_stock_check TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    data_type TEXT NOT NULL DEFAULT 'string' CHECK (data_type IN ('string', 'number', 'boolean', 'json')),
    is_public INTEGER NOT NULL DEFAULT 0 CHECK (is_public IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Loyalty transactions table
CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    order_id INTEGER,
    points_earned INTEGER NOT NULL DEFAULT 0 CHECK (points_earned >= 0),
    points_redeemed INTEGER NOT NULL DEFAULT 0 CHECK (points_redeemed >= 0),
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earn', 'redeem', 'expire', 'adjust')),
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- Sales analytics table (for caching)
CREATE TABLE IF NOT EXISTS sales_analytics (
    date TEXT PRIMARY KEY,
    total_sales REAL NOT NULL DEFAULT 0,
    total_orders INTEGER NOT NULL DEFAULT 0,
    average_order_value REAL NOT NULL DEFAULT 0,
    top_products TEXT, -- JSON array
    payment_methods TEXT, -- JSON object
    hourly_sales TEXT, -- JSON object
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_cashier ON orders(cashier_id);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id);

CREATE INDEX IF NOT EXISTS idx_staff_username ON staff(username);
CREATE INDEX IF NOT EXISTS idx_staff_role ON staff(role);
CREATE INDEX IF NOT EXISTS idx_staff_status ON staff(status);

CREATE INDEX IF NOT EXISTS idx_loyalty_customer ON loyalty_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_order ON loyalty_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_type ON loyalty_transactions(transaction_type);

CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
CREATE INDEX IF NOT EXISTS idx_settings_category ON settings(category);

-- Insert default categories
INSERT OR IGNORE INTO categories (name, description) VALUES 
('Thực phẩm', 'Sản phẩm thực phẩm các loại'),
('Đồ uống', 'Nước giải khát, cà phê, trà'),
('Gia vị', 'Gia vị, nước mắm, tương ớt'),
('Đồ gia dụng', 'Đồ dùng trong gia đình'),
('Mỹ phẩm', 'Sản phẩm làm đẹp, chăm sóc da'),
('Điện tử', 'Thiết bị điện tử, phụ kiện'),
('Quần áo', 'Thời trang nam, nữ, trẻ em'),
('Sách báo', 'Sách, tạp chí, văn phòng phẩm');

-- Insert default settings
INSERT OR IGNORE INTO settings (key, value, description, category, data_type, is_public) VALUES 
('store_name', 'KhoAugment POS', 'Tên cửa hàng', 'store', 'string', 1),
('store_address', '123 Đường ABC, Quận 1, TP.HCM', 'Địa chỉ cửa hàng', 'store', 'string', 1),
('store_phone', '0901234567', 'Số điện thoại cửa hàng', 'store', 'string', 1),
('store_email', 'contact@khoaugment.com', 'Email cửa hàng', 'store', 'string', 1),
('tax_code', '0123456789', 'Mã số thuế doanh nghiệp', 'store', 'string', 0),
('currency', 'VND', 'Đơn vị tiền tệ', 'general', 'string', 1),
('vat_rate', '10', 'Thuế VAT mặc định (%)', 'tax', 'number', 1),
('loyalty_rate', '1', 'Tỷ lệ tích điểm (điểm/1000 VND)', 'loyalty', 'number', 1),
('point_value', '1000', 'Giá trị 1 điểm (VND)', 'loyalty', 'number', 1),
('receipt_footer', 'Cảm ơn quý khách! Hẹn gặp lại!', 'Lời cảm ơn trên hóa đơn', 'receipt', 'string', 1);

-- Insert default admin user (password: admin123)
INSERT OR IGNORE INTO staff (username, full_name, email, password_hash, role, permissions) VALUES 
('admin', 'Quản trị viên', 'admin@khoaugment.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/j0B/dVnXe', 'admin', '["*"]');

-- Create triggers for updated_at timestamps
CREATE TRIGGER IF NOT EXISTS update_products_timestamp 
    AFTER UPDATE ON products
    BEGIN
        UPDATE products SET updated_at = datetime('now') WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_customers_timestamp 
    AFTER UPDATE ON customers
    BEGIN
        UPDATE customers SET updated_at = datetime('now') WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_orders_timestamp 
    AFTER UPDATE ON orders
    BEGIN
        UPDATE orders SET updated_at = datetime('now') WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_inventory_timestamp 
    AFTER UPDATE ON inventory
    BEGIN
        UPDATE inventory SET updated_at = datetime('now') WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_staff_timestamp 
    AFTER UPDATE ON staff
    BEGIN
        UPDATE staff SET updated_at = datetime('now') WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_settings_timestamp 
    AFTER UPDATE ON settings
    BEGIN
        UPDATE settings SET updated_at = datetime('now') WHERE id = NEW.id;
    END;

-- Trigger to update customer stats when orders are completed
CREATE TRIGGER IF NOT EXISTS update_customer_stats_on_order
    AFTER UPDATE ON orders
    WHEN NEW.order_status = 'completed' AND OLD.order_status != 'completed'
    BEGIN
        UPDATE customers 
        SET 
            total_spent = total_spent + NEW.total_amount,
            visit_count = visit_count + 1,
            last_visit = NEW.created_at
        WHERE id = NEW.customer_id;
    END;

-- View for product inventory summary
CREATE VIEW IF NOT EXISTS product_inventory_view AS
SELECT 
    p.id,
    p.name,
    p.sku,
    p.barcode,
    p.price,
    p.status,
    c.name as category_name,
    COALESCE(i.quantity_available, 0) as stock_quantity,
    COALESCE(i.quantity_reserved, 0) as reserved_quantity,
    COALESCE(i.quantity_available, 0) - COALESCE(i.quantity_reserved, 0) as available_quantity,
    p.min_stock_level,
    CASE 
        WHEN p.min_stock_level IS NOT NULL AND COALESCE(i.quantity_available, 0) <= p.min_stock_level 
        THEN 1 
        ELSE 0 
    END as is_low_stock
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN inventory i ON p.id = i.product_id
WHERE p.status = 'active';

-- View for customer summary
CREATE VIEW IF NOT EXISTS customer_summary_view AS
SELECT 
    c.*,
    COALESCE(lp.total_points, 0) as current_loyalty_points,
    COALESCE(oc.order_count, 0) as total_orders
FROM customers c
LEFT JOIN (
    SELECT 
        customer_id,
        SUM(points_earned - points_redeemed) as total_points
    FROM loyalty_transactions 
    GROUP BY customer_id
) lp ON c.id = lp.customer_id
LEFT JOIN (
    SELECT 
        customer_id,
        COUNT(*) as order_count
    FROM orders 
    WHERE order_status = 'completed'
    GROUP BY customer_id
) oc ON c.id = oc.customer_id
WHERE c.status = 'active';