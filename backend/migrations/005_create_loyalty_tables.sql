-- Create loyalty tiers table
CREATE TABLE IF NOT EXISTS loyalty_tiers (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  minimum_spent REAL NOT NULL DEFAULT 0,
  discount_percentage REAL NOT NULL DEFAULT 0,
  points_multiplier REAL NOT NULL DEFAULT 1,
  benefits TEXT, -- JSON array of benefits
  active BOOLEAN NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_loyalty_tiers_minimum_spent ON loyalty_tiers(minimum_spent);
CREATE INDEX IF NOT EXISTS idx_loyalty_tiers_active ON loyalty_tiers(active);

-- Insert default loyalty tiers
INSERT OR IGNORE INTO loyalty_tiers (id, name, minimum_spent, discount_percentage, points_multiplier, benefits, sort_order) VALUES
('bronze-tier', 'Đồng', 0, 0, 1, '["Tích điểm cơ bản"]', 1),
('silver-tier', 'Bạc', 1000000, 2, 1.2, '["Tích điểm x1.2", "Giảm giá 2%"]', 2),
('gold-tier', 'Vàng', 5000000, 5, 1.5, '["Tích điểm x1.5", "Giảm giá 5%", "Ưu tiên hỗ trợ"]', 3),
('platinum-tier', 'Bạch kim', 10000000, 8, 2, '["Tích điểm x2", "Giảm giá 8%", "Miễn phí vận chuyển"]', 4),
('diamond-tier', 'Kim cương', 20000000, 10, 2.5, '["Tích điểm x2.5", "Giảm giá 10%", "Ưu đãi đặc biệt"]', 5);

-- Create loyalty transactions table
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  customer_id TEXT NOT NULL,
  order_id TEXT,
  type TEXT NOT NULL CHECK (type IN ('earn', 'redeem', 'expire', 'adjust')),
  points INTEGER NOT NULL,
  description TEXT,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_customer_id ON loyalty_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_order_id ON loyalty_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_type ON loyalty_transactions(type);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_expires_at ON loyalty_transactions(expires_at);

-- Create inventory alerts table
CREATE TABLE IF NOT EXISTS inventory_alerts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  product_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('low_stock', 'out_of_stock', 'expired')),
  message TEXT NOT NULL,
  current_stock INTEGER,
  min_stock INTEGER,
  resolved BOOLEAN NOT NULL DEFAULT 0,
  resolved_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_inventory_alerts_product_id ON inventory_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_type ON inventory_alerts(type);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_resolved ON inventory_alerts(resolved);

-- Create inventory reservations table
CREATE TABLE IF NOT EXISTS inventory_reservations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  product_id TEXT NOT NULL,
  order_id TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_inventory_reservations_product_id ON inventory_reservations(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_order_id ON inventory_reservations(order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_expires_at ON inventory_reservations(expires_at);

-- Create backups table
CREATE TABLE IF NOT EXISTS backups (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  filename TEXT NOT NULL,
  size INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('manual', 'auto')),
  status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'failed')),
  cloud_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_backups_type ON backups(type);
CREATE INDEX IF NOT EXISTS idx_backups_status ON backups(status);
CREATE INDEX IF NOT EXISTS idx_backups_created_at ON backups(created_at);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  customer_id TEXT,
  user_id TEXT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT 0,
  read_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_customer_id ON notifications(customer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
