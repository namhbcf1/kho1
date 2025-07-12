-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_settings_category_key ON settings(category, key);
CREATE INDEX IF NOT EXISTS idx_settings_category ON settings(category);

-- Insert default settings
INSERT OR IGNORE INTO settings (key, value, category) VALUES
-- Business settings
('name', '"KhoAugment POS"', 'business'),
('address', '"123 Đường ABC, Phường 1, Quận 1, TP Hồ Chí Minh"', 'business'),
('phone', '"0901234567"', 'business'),
('email', '"info@khoaugment.com"', 'business'),
('taxCode', '"1234567890"', 'business'),

-- Tax settings
('enabled', 'true', 'tax'),
('rate', '0.1', 'tax'),
('method', '"exclusive"', 'tax'),

-- Payment settings
('enableCash', 'true', 'payment'),
('enableCard', 'true', 'payment'),
('enableVNPay', 'false', 'payment'),
('enableMoMo', 'false', 'payment'),
('enableZaloPay', 'false', 'payment'),

-- Receipt settings
('template', '"standard"', 'receipt'),
('paperSize', '"thermal_80"', 'receipt'),
('showLogo', 'true', 'receipt'),
('showTax', 'true', 'receipt'),
('header', '"Cảm ơn quý khách đã mua hàng!"', 'receipt'),
('footer', '"Hẹn gặp lại quý khách!"', 'receipt'),

-- Language settings
('defaultLanguage', '"vi"', 'language'),
('dateFormat', '"DD/MM/YYYY"', 'language'),
('currency', '"VND"', 'language'),
('timezone', '"Asia/Ho_Chi_Minh"', 'language'),

-- Backup settings
('autoBackup', 'true', 'backup'),
('frequency', '"daily"', 'backup'),
('retention', '30', 'backup');

-- Create files table for R2 uploads
CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  original_name TEXT NOT NULL,
  filename TEXT NOT NULL,
  key TEXT NOT NULL UNIQUE,
  size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  folder TEXT NOT NULL DEFAULT 'uploads',
  uploaded_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_files_folder ON files(folder);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON files(uploaded_by);

-- Create images table for image-specific uploads
CREATE TABLE IF NOT EXISTS images (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  original_name TEXT NOT NULL,
  filename TEXT NOT NULL,
  key TEXT NOT NULL UNIQUE,
  size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  folder TEXT NOT NULL DEFAULT 'images',
  variants TEXT, -- JSON array of image variants
  uploaded_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_images_folder ON images(folder);
CREATE INDEX IF NOT EXISTS idx_images_uploaded_by ON images(uploaded_by);

-- Create pending uploads table for presigned URLs
CREATE TABLE IF NOT EXISTS pending_uploads (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  key TEXT NOT NULL UNIQUE,
  original_name TEXT NOT NULL,
  filename TEXT NOT NULL,
  content_type TEXT,
  folder TEXT NOT NULL DEFAULT 'uploads',
  uploaded_by TEXT,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pending_uploads_expires_at ON pending_uploads(expires_at);
CREATE INDEX IF NOT EXISTS idx_pending_uploads_uploaded_by ON pending_uploads(uploaded_by);
