-- Add optimistic locking version columns to existing tables
-- This is a simplified version that works with D1's ALTER TABLE limitations

-- Add version column to products table
ALTER TABLE products ADD COLUMN version INTEGER DEFAULT 1;

-- Add version column to inventory_transactions table
ALTER TABLE inventory_transactions ADD COLUMN version INTEGER DEFAULT 1;

-- Add version column to customers table
ALTER TABLE customers ADD COLUMN version INTEGER DEFAULT 1;

-- Add version column to users table
ALTER TABLE users ADD COLUMN version INTEGER DEFAULT 1;

-- Add version column to business_settings table
ALTER TABLE business_settings ADD COLUMN version INTEGER DEFAULT 1;

-- Update existing records to have version 1
UPDATE products SET version = 1 WHERE version IS NULL;
UPDATE inventory_transactions SET version = 1 WHERE version IS NULL;
UPDATE customers SET version = 1 WHERE version IS NULL;
UPDATE users SET version = 1 WHERE version IS NULL;
UPDATE business_settings SET version = 1 WHERE version IS NULL;

-- Record migration
INSERT INTO d1_migrations (name, applied_at) VALUES ('0010_add_optimistic_locking_simple.sql', datetime('now')); 