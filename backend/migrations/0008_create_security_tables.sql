-- Security enhancement tables for production POS system
-- Migration: 0008_create_security_tables.sql

-- User sessions table for refresh token management
CREATE TABLE IF NOT EXISTS user_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  refresh_token TEXT NOT NULL UNIQUE,
  device_info TEXT,
  ip_address TEXT,
  user_agent TEXT,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_used DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Security audit log table
CREATE TABLE IF NOT EXISTS security_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action_type TEXT NOT NULL, -- 'login', 'logout', 'failed_login', 'password_change', etc.
  ip_address TEXT,
  user_agent TEXT,
  details TEXT, -- JSON string with additional details
  risk_level TEXT DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Failed login attempts table
CREATE TABLE IF NOT EXISTS failed_login_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  attempt_count INTEGER DEFAULT 1,
  first_attempt DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_attempt DATETIME DEFAULT CURRENT_TIMESTAMP,
  blocked_until DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Password history table (prevent password reuse)
CREATE TABLE IF NOT EXISTS password_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- API rate limit tracking
CREATE TABLE IF NOT EXISTS api_rate_limits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip_address TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start DATETIME DEFAULT CURRENT_TIMESTAMP,
  blocked_until DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- System security settings
CREATE TABLE IF NOT EXISTS security_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_by INTEGER,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_refresh_token ON user_sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_action_type ON security_audit_log(action_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_ip_address ON security_audit_log(ip_address);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_created_at ON security_audit_log(created_at);

CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_email ON failed_login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_ip_address ON failed_login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_last_attempt ON failed_login_attempts(last_attempt);

CREATE INDEX IF NOT EXISTS idx_password_history_user_id ON password_history(user_id);
CREATE INDEX IF NOT EXISTS idx_password_history_created_at ON password_history(created_at);

CREATE INDEX IF NOT EXISTS idx_api_rate_limits_ip_address ON api_rate_limits(ip_address);
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_endpoint ON api_rate_limits(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_window_start ON api_rate_limits(window_start);

-- Insert default security settings
INSERT OR REPLACE INTO security_settings (setting_key, setting_value, description) VALUES
('max_login_attempts', '5', 'Maximum failed login attempts before blocking'),
('login_block_duration', '900', 'Login block duration in seconds (15 minutes)'),
('password_min_length', '8', 'Minimum password length'),
('password_require_special', 'true', 'Require special characters in password'),
('password_require_number', 'true', 'Require numbers in password'),
('password_require_uppercase', 'true', 'Require uppercase letters in password'),
('password_history_count', '5', 'Number of previous passwords to remember'),
('session_timeout', '86400', 'Session timeout in seconds (24 hours)'),
('refresh_token_lifetime', '604800', 'Refresh token lifetime in seconds (7 days)'),
('csrf_token_lifetime', '3600', 'CSRF token lifetime in seconds (1 hour)'),
('rate_limit_requests_per_minute', '60', 'API rate limit requests per minute'),
('rate_limit_auth_requests_per_minute', '5', 'Auth endpoint rate limit requests per minute'),
('enable_2fa', 'false', 'Enable two-factor authentication'),
('enable_audit_logging', 'true', 'Enable security audit logging'),
('enable_ip_restriction', 'false', 'Enable IP address restrictions');

-- Update users table to add security fields if not exists
ALTER TABLE users ADD COLUMN password_changed_at DATETIME DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ADD COLUMN force_password_change BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN two_factor_secret TEXT;
ALTER TABLE users ADD COLUMN allowed_ip_addresses TEXT; -- JSON array of allowed IPs
ALTER TABLE users ADD COLUMN account_locked_until DATETIME;