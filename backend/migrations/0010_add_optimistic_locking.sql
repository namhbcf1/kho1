-- Add optimistic locking support to prevent race conditions
-- Migration: 0010_add_optimistic_locking.sql

-- Add version column to products table for optimistic locking
ALTER TABLE products ADD COLUMN version INTEGER DEFAULT 0;

-- Add reserved_stock column to track inventory reservations
ALTER TABLE products ADD COLUMN reserved_stock INTEGER DEFAULT 0 CHECK (reserved_stock >= 0);

-- Add available_stock computed column
ALTER TABLE products ADD COLUMN available_stock INTEGER GENERATED ALWAYS AS (stock - COALESCE(reserved_stock, 0)) STORED;

-- Add version column to orders table
ALTER TABLE orders ADD COLUMN version INTEGER DEFAULT 0;

-- Add version column to customers table
ALTER TABLE customers ADD COLUMN version INTEGER DEFAULT 0;

-- Create inventory_reservations table
CREATE TABLE IF NOT EXISTS inventory_reservations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  product_id TEXT NOT NULL,
  order_id TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Create indexes for inventory_reservations
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_product_id ON inventory_reservations(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_order_id ON inventory_reservations(order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_expires_at ON inventory_reservations(expires_at);

-- Create inventory_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  product_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('in', 'out', 'adjustment', 'transfer')),
  quantity INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  unit_cost REAL,
  reference_type TEXT,
  reference_id TEXT,
  reason TEXT,
  created_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Create indexes for inventory_transactions
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_product_id ON inventory_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type ON inventory_transactions(type);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_reference ON inventory_transactions(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_created_at ON inventory_transactions(created_at);

-- Create triggers to update version numbers automatically
CREATE TRIGGER IF NOT EXISTS update_products_version
  AFTER UPDATE ON products
  FOR EACH ROW
  WHEN NEW.stock != OLD.stock OR NEW.reserved_stock != OLD.reserved_stock
  BEGIN
    UPDATE products SET version = version + 1 WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS update_orders_version
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN NEW.status != OLD.status OR NEW.payment_status != OLD.payment_status
  BEGIN
    UPDATE orders SET version = version + 1 WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS update_customers_version
  AFTER UPDATE ON customers
  FOR EACH ROW
  WHEN NEW.total_spent != OLD.total_spent OR NEW.loyalty_points != OLD.loyalty_points
  BEGIN
    UPDATE customers SET version = version + 1 WHERE id = NEW.id;
  END;

-- Create low stock alerts table
CREATE TABLE IF NOT EXISTS low_stock_alerts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  current_stock INTEGER NOT NULL,
  min_stock INTEGER NOT NULL,
  alert_level TEXT NOT NULL CHECK (alert_level IN ('low', 'critical', 'out_of_stock')),
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Create indexes for low_stock_alerts
CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_product_id ON low_stock_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_resolved ON low_stock_alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_created_at ON low_stock_alerts(created_at);

-- Create trigger to automatically create low stock alerts
CREATE TRIGGER IF NOT EXISTS create_low_stock_alert
  AFTER UPDATE ON products
  FOR EACH ROW
  WHEN NEW.stock <= NEW.min_stock AND OLD.stock > OLD.min_stock
  BEGIN
    INSERT INTO low_stock_alerts (product_id, product_name, current_stock, min_stock, alert_level)
    VALUES (
      NEW.id,
      NEW.name,
      NEW.stock,
      NEW.min_stock,
      CASE 
        WHEN NEW.stock = 0 THEN 'out_of_stock'
        WHEN NEW.stock <= NEW.min_stock * 0.5 THEN 'critical'
        ELSE 'low'
      END
    );
  END;

-- Create view for inventory status
CREATE VIEW IF NOT EXISTS inventory_status_view AS
SELECT 
  p.id,
  p.name,
  p.sku,
  p.barcode,
  p.stock,
  p.reserved_stock,
  p.available_stock,
  p.min_stock,
  p.version,
  CASE 
    WHEN p.stock = 0 THEN 'out_of_stock'
    WHEN p.stock <= p.min_stock * 0.5 THEN 'critical'
    WHEN p.stock <= p.min_stock THEN 'low'
    ELSE 'normal'
  END as stock_status,
  COUNT(ir.id) as active_reservations,
  COALESCE(SUM(ir.quantity), 0) as total_reserved,
  p.updated_at
FROM products p
LEFT JOIN inventory_reservations ir ON p.id = ir.product_id AND ir.expires_at > datetime('now')
WHERE p.active = 1
GROUP BY p.id, p.name, p.sku, p.barcode, p.stock, p.reserved_stock, p.available_stock, p.min_stock, p.version, p.updated_at;

-- Create view for recent inventory transactions
CREATE VIEW IF NOT EXISTS recent_inventory_transactions_view AS
SELECT 
  it.id,
  it.product_id,
  p.name as product_name,
  it.type,
  it.quantity,
  it.previous_stock,
  it.new_stock,
  it.reference_type,
  it.reference_id,
  it.reason,
  it.created_by,
  it.created_at
FROM inventory_transactions it
JOIN products p ON it.product_id = p.id
WHERE it.created_at >= datetime('now', '-7 days')
ORDER BY it.created_at DESC;

-- Update existing data to set initial version numbers
UPDATE products SET version = 1 WHERE version = 0;
UPDATE orders SET version = 1 WHERE version = 0;
UPDATE customers SET version = 1 WHERE version = 0; 