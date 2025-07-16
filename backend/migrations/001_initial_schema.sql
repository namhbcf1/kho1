-- Initial database schema for KhoAugment POS system
-- Vietnamese business-compliant point-of-sale database design

-- Users table for authentication
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user', -- 'admin', 'manager', 'user'
  active INTEGER NOT NULL DEFAULT 1,
  last_login_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Categories table for product organization
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Products table with Vietnamese business features
CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  barcode TEXT UNIQUE,
  sku TEXT UNIQUE,
  category_id INTEGER,
  price REAL NOT NULL DEFAULT 0,
  cost REAL NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 0,
  max_stock INTEGER,
  unit TEXT NOT NULL DEFAULT 'pcs', -- 'kg', 'liter', 'box', etc.
  image_url TEXT,
  images TEXT, -- JSON array of image URLs
  tags TEXT, -- JSON array of tags
  is_service INTEGER NOT NULL DEFAULT 0, -- For service items
  track_stock INTEGER NOT NULL DEFAULT 1,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Customers table with Vietnamese loyalty system
CREATE TABLE customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT UNIQUE,
  email TEXT UNIQUE,
  address TEXT,
  province TEXT, -- Vietnamese province
  district TEXT,
  ward TEXT,
  postal_code TEXT,
  tax_code TEXT, -- Vietnamese tax identification
  business_license TEXT, -- For business customers
  loyalty_tier TEXT NOT NULL DEFAULT 'bronze', -- 'bronze', 'silver', 'gold', 'platinum', 'diamond'
  loyalty_points INTEGER NOT NULL DEFAULT 0,
  total_spent REAL NOT NULL DEFAULT 0,
  total_orders INTEGER NOT NULL DEFAULT 0,
  join_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_visit TEXT,
  notes TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Orders table for transactions
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  order_number TEXT UNIQUE, -- Vietnamese invoice number format
  customer_id TEXT,
  user_id TEXT, -- Staff who created the order
  subtotal REAL NOT NULL DEFAULT 0,
  tax REAL NOT NULL DEFAULT 0, -- 10% VAT for Vietnam
  discount REAL NOT NULL DEFAULT 0,
  loyalty_points_used INTEGER NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL, -- 'cash', 'bank_transfer', 'vnpay', 'momo', etc.
  payment_reference TEXT, -- For electronic payments
  payment_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'refunded'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'cancelled', 'refunded'
  order_type TEXT NOT NULL DEFAULT 'sale', -- 'sale', 'return', 'exchange'
  notes TEXT,
  receipt_printed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Order items table
CREATE TABLE order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  product_id INTEGER NOT NULL,
  product_name TEXT NOT NULL, -- Store name for history
  product_sku TEXT,
  quantity REAL NOT NULL,
  price REAL NOT NULL, -- Price at time of sale
  cost REAL, -- Cost at time of sale for profit calculation
  discount REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Loyalty transactions table for point tracking
CREATE TABLE loyalty_transactions (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  order_id TEXT, -- NULL for manual adjustments
  points INTEGER NOT NULL, -- Positive for earned, negative for redeemed
  type TEXT NOT NULL, -- 'add', 'redeem', 'adjust', 'expire'
  reason TEXT,
  expires_at TEXT, -- For point expiration
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- Stock movements table for inventory tracking
CREATE TABLE stock_movements (
  id TEXT PRIMARY KEY,
  product_id INTEGER NOT NULL,
  movement_type TEXT NOT NULL, -- 'sale', 'purchase', 'adjustment', 'return', 'damage'
  quantity REAL NOT NULL, -- Positive for increase, negative for decrease
  cost REAL, -- Cost per unit
  reference_id TEXT, -- Order ID or other reference
  reference_type TEXT, -- 'order', 'adjustment', 'purchase'
  notes TEXT,
  user_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Cash drawer sessions table
CREATE TABLE cash_drawer_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  opening_balance REAL NOT NULL DEFAULT 0,
  closing_balance REAL,
  expected_balance REAL,
  cash_sales REAL NOT NULL DEFAULT 0,
  cash_refunds REAL NOT NULL DEFAULT 0,
  cash_added REAL NOT NULL DEFAULT 0, -- Manual cash additions
  cash_removed REAL NOT NULL DEFAULT 0, -- Manual cash removals
  status TEXT NOT NULL DEFAULT 'open', -- 'open', 'closed'
  opened_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_at TEXT,
  notes TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Error logs table for debugging
CREATE TABLE error_logs (
  id TEXT PRIMARY KEY,
  message TEXT NOT NULL,
  stack_trace TEXT,
  severity TEXT NOT NULL DEFAULT 'error', -- 'error', 'warning', 'info'
  context TEXT, -- JSON object with additional context
  user_id TEXT,
  ip TEXT,
  user_agent TEXT,
  resolved INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Settings table for application configuration
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
  description TEXT,
  category TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Audit log table for tracking changes
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  action TEXT NOT NULL, -- 'create', 'update', 'delete'
  old_values TEXT, -- JSON object
  new_values TEXT, -- JSON object
  user_id TEXT,
  ip TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(active);
CREATE INDEX idx_products_created ON products(created_at);

CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_tier ON customers(loyalty_tier);
CREATE INDEX idx_customers_active ON customers(active);

CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at);
CREATE INDEX idx_orders_payment_method ON orders(payment_method);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

CREATE INDEX idx_loyalty_transactions_customer ON loyalty_transactions(customer_id);
CREATE INDEX idx_loyalty_transactions_order ON loyalty_transactions(order_id);
CREATE INDEX idx_loyalty_transactions_created ON loyalty_transactions(created_at);

CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_type ON stock_movements(movement_type);
CREATE INDEX idx_stock_movements_created ON stock_movements(created_at);

CREATE INDEX idx_error_logs_severity ON error_logs(severity);
CREATE INDEX idx_error_logs_created ON error_logs(created_at);

-- Insert default settings
INSERT INTO settings (key, value, type, description, category) VALUES
('store_name', 'KhoAugment POS', 'string', 'Store name', 'general'),
('store_address', 'Địa chỉ cửa hàng', 'string', 'Store address', 'general'),
('store_phone', '1900-xxxx', 'string', 'Store phone number', 'general'),
('store_email', 'info@khoaugment.com', 'string', 'Store email', 'general'),
('tax_code', '0123456789', 'string', 'Vietnamese tax code', 'general'),
('vat_rate', '10', 'number', 'VAT percentage', 'tax'),
('currency', 'VND', 'string', 'Store currency', 'general'),
('receipt_footer', 'Cảm ơn quý khách!', 'string', 'Receipt footer message', 'receipt'),
('loyalty_points_rate', '1000', 'number', 'VND per loyalty point', 'loyalty'),
('low_stock_threshold', '10', 'number', 'Low stock alert threshold', 'inventory'),
('receipt_printer', '', 'string', 'Receipt printer name', 'receipt'),
('auto_print_receipt', 'true', 'boolean', 'Auto print receipt after sale', 'receipt'),
('enable_loyalty', 'true', 'boolean', 'Enable loyalty system', 'loyalty'),
('enable_discounts', 'true', 'boolean', 'Enable discounts', 'general'),
('backup_frequency', 'daily', 'string', 'Database backup frequency', 'system');

-- Insert default categories
INSERT INTO categories (name, description, sort_order) VALUES
('Thực phẩm', 'Các sản phẩm thực phẩm', 1),
('Đồ uống', 'Nước uống các loại', 2),
('Điện tử', 'Thiết bị điện tử', 3),
('Quần áo', 'Thời trang và quần áo', 4),
('Gia dụng', 'Đồ dùng gia đình', 5),
('Mỹ phẩm', 'Sản phẩm làm đẹp', 6),
('Sách', 'Sách và văn phòng phẩm', 7),
('Khác', 'Sản phẩm khác', 99);

-- Insert sample products
INSERT INTO products (name, description, barcode, sku, category_id, price, cost, stock, min_stock, unit) VALUES
('Coca Cola 330ml', 'Nước ngọt Coca Cola lon 330ml', '8934588001234', 'COKE-330', 2, 15000, 12000, 100, 20, 'lon'),
('Bánh mì sandwich', 'Bánh mì sandwich thịt nguội', '8934588005678', 'BM-SW-001', 1, 25000, 18000, 50, 10, 'cái'),
('Áo thun nam', 'Áo thun cotton nam size M', '8934588009012', 'AT-NAM-M', 4, 150000, 100000, 30, 5, 'cái'),
('Dầu gội Clear', 'Dầu gội Clear Men 350ml', '8934588003456', 'DG-CLEAR-350', 6, 65000, 50000, 25, 5, 'chai');

-- Insert default admin user (password: admin123)
INSERT INTO users (id, email, password_hash, name, role) VALUES
('admin-001', 'admin@khoaugment.com', '$2b$10$K5H5s9p7TZq8y1F8B9X4O.V3K3rN2M1L9P0Q7R8S3T4U5V6W7X8Y9Z', 'Administrator', 'admin');