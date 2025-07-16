-- Security Infrastructure Schema
-- Fixes: Authentication bypass, session management vulnerabilities
-- Implements: Secure token management, audit logging, role-based access

-- User Roles and Permissions
CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default roles
INSERT OR IGNORE INTO roles (role_name, display_name, description) VALUES
('super_admin', 'Super Administrator', 'Full system access and management'),
('admin', 'Administrator', 'Store management and configuration'),
('manager', 'Manager', 'Inventory and staff management'),
('cashier', 'Cashier', 'Sales transactions and basic operations'),
('viewer', 'Viewer', 'Read-only access to reports and data');

-- System Permissions
CREATE TABLE IF NOT EXISTS permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    permission_name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL, -- 'system', 'user', 'inventory', 'sales', 'reports'
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default permissions
INSERT OR IGNORE INTO permissions (permission_name, display_name, description, category) VALUES
-- System permissions
('system.manage', 'System Management', 'Manage system settings and configuration', 'system'),
('system.backup', 'System Backup', 'Create and restore system backups', 'system'),
('system.logs', 'System Logs', 'View system logs and audit trails', 'system'),
('system.security', 'Security Management', 'Manage security settings and policies', 'system'),

-- User permissions
('user.create', 'Create Users', 'Create new user accounts', 'user'),
('user.read', 'View Users', 'View user information', 'user'),
('user.update', 'Update Users', 'Modify user accounts and profiles', 'user'),
('user.delete', 'Delete Users', 'Remove user accounts', 'user'),
('user.permissions', 'Manage Permissions', 'Assign roles and permissions to users', 'user'),

-- Inventory permissions
('inventory.create', 'Create Products', 'Add new products to inventory', 'inventory'),
('inventory.read', 'View Inventory', 'View product information and stock levels', 'inventory'),
('inventory.update', 'Update Inventory', 'Modify product details and stock levels', 'inventory'),
('inventory.delete', 'Delete Products', 'Remove products from inventory', 'inventory'),
('inventory.transfer', 'Transfer Inventory', 'Transfer stock between locations', 'inventory'),

-- Sales permissions
('sales.create', 'Process Sales', 'Create and process sales transactions', 'sales'),
('sales.read', 'View Sales', 'View sales transactions and history', 'sales'),
('sales.update', 'Modify Sales', 'Edit or void sales transactions', 'sales'),
('sales.refund', 'Process Refunds', 'Process customer refunds', 'sales'),
('sales.discount', 'Apply Discounts', 'Apply discounts to transactions', 'sales'),

-- Report permissions
('reports.sales', 'Sales Reports', 'View sales reports and analytics', 'reports'),
('reports.inventory', 'Inventory Reports', 'View inventory reports', 'reports'),
('reports.financial', 'Financial Reports', 'View financial reports and statements', 'reports'),
('reports.user', 'User Reports', 'View user activity reports', 'reports'),
('reports.export', 'Export Reports', 'Export reports to external formats', 'reports');

-- Role-Permission Mapping
CREATE TABLE IF NOT EXISTS role_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_id INTEGER NOT NULL,
    permission_id INTEGER NOT NULL,
    granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    granted_by TEXT,
    
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE (role_id, permission_id)
);

-- Grant permissions to roles
INSERT OR IGNORE INTO role_permissions (role_id, permission_id, granted_by)
SELECT r.id, p.id, 'system'
FROM roles r
CROSS JOIN permissions p
WHERE 
    -- Super Admin gets all permissions
    (r.role_name = 'super_admin') OR
    
    -- Admin gets most permissions except system management
    (r.role_name = 'admin' AND p.category IN ('user', 'inventory', 'sales', 'reports')) OR
    
    -- Manager gets inventory, sales, and reports
    (r.role_name = 'manager' AND p.category IN ('inventory', 'sales', 'reports') AND p.permission_name NOT LIKE '%.delete') OR
    
    -- Cashier gets basic sales and inventory read
    (r.role_name = 'cashier' AND p.permission_name IN ('sales.create', 'sales.read', 'sales.refund', 'sales.discount', 'inventory.read', 'reports.sales')) OR
    
    -- Viewer gets read-only access
    (r.role_name = 'viewer' AND p.permission_name LIKE '%.read');

-- User Accounts with Enhanced Security
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    last_login DATETIME,
    password_changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until DATETIME,
    must_change_password BOOLEAN DEFAULT FALSE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret TEXT,
    store_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    updated_by TEXT
);

-- User-Role Mapping
CREATE TABLE IF NOT EXISTS user_roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    role_id INTEGER NOT NULL,
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    assigned_by TEXT,
    expires_at DATETIME,
    is_active BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- Refresh Token Storage
CREATE TABLE IF NOT EXISTS refresh_tokens (
    token_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    device_id TEXT,
    ip_address TEXT NOT NULL,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    last_used DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_revoked BOOLEAN DEFAULT FALSE,
    revoked_at DATETIME,
    revoked_reason TEXT,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for refresh tokens
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user 
ON refresh_tokens(user_id, is_revoked);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_session 
ON refresh_tokens(session_id);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires 
ON refresh_tokens(expires_at);

-- Security Audit Logs
CREATE TABLE IF NOT EXISTS security_audit_logs (
    id TEXT PRIMARY KEY,
    timestamp DATETIME NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('login', 'logout', 'token_refresh', 'token_revoke', 'failed_auth', 'suspicious_activity', 'password_change', 'account_locked')),
    user_id TEXT,
    session_id TEXT,
    ip_address TEXT NOT NULL,
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    details TEXT, -- JSON with additional context
    risk_level TEXT NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_security_audit_timestamp 
ON security_audit_logs(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_security_audit_user 
ON security_audit_logs(user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_security_audit_action 
ON security_audit_logs(action, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_security_audit_risk 
ON security_audit_logs(risk_level, timestamp DESC);

-- Session Management
CREATE TABLE IF NOT EXISTS user_sessions (
    session_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    device_id TEXT,
    ip_address TEXT NOT NULL,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    location_country TEXT,
    location_city TEXT,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user 
ON user_sessions(user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_user_sessions_expires 
ON user_sessions(expires_at);

-- API Keys for Service-to-Service Communication
CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY,
    key_name TEXT NOT NULL,
    key_hash TEXT UNIQUE NOT NULL,
    user_id TEXT,
    service_name TEXT,
    permissions TEXT, -- JSON array of permissions
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    last_used DATETIME,
    usage_count INTEGER DEFAULT 0,
    rate_limit INTEGER DEFAULT 1000, -- requests per hour
    created_by TEXT,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for API keys
CREATE INDEX IF NOT EXISTS idx_api_keys_hash 
ON api_keys(key_hash);

CREATE INDEX IF NOT EXISTS idx_api_keys_user 
ON api_keys(user_id, is_active);

-- Encryption Key Management
CREATE TABLE IF NOT EXISTS encryption_keys (
    key_id TEXT PRIMARY KEY,
    key_purpose TEXT NOT NULL CHECK (key_purpose IN ('general', 'payment', 'personal', 'audit')),
    key_version INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    rotated_at DATETIME,
    algorithm TEXT DEFAULT 'AES-256-GCM',
    key_length INTEGER DEFAULT 256
);

-- Security Configuration
CREATE TABLE IF NOT EXISTS security_config (
    config_key TEXT PRIMARY KEY,
    config_value TEXT NOT NULL,
    config_type TEXT NOT NULL CHECK (config_type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    is_sensitive BOOLEAN DEFAULT FALSE,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_by TEXT
);

-- Insert default security configuration
INSERT OR IGNORE INTO security_config (config_key, config_value, config_type, description, is_sensitive) VALUES
('password_min_length', '8', 'number', 'Minimum password length', FALSE),
('password_require_uppercase', 'true', 'boolean', 'Require uppercase letters in passwords', FALSE),
('password_require_lowercase', 'true', 'boolean', 'Require lowercase letters in passwords', FALSE),
('password_require_numbers', 'true', 'boolean', 'Require numbers in passwords', FALSE),
('password_require_symbols', 'true', 'boolean', 'Require symbols in passwords', FALSE),
('password_expiry_days', '90', 'number', 'Password expiry in days', FALSE),
('max_failed_login_attempts', '5', 'number', 'Maximum failed login attempts before lockout', FALSE),
('account_lockout_duration', '30', 'number', 'Account lockout duration in minutes', FALSE),
('session_timeout', '480', 'number', 'Session timeout in minutes', FALSE),
('jwt_access_token_expiry', '15', 'number', 'JWT access token expiry in minutes', FALSE),
('jwt_refresh_token_expiry', '10080', 'number', 'JWT refresh token expiry in minutes (7 days)', FALSE),
('enable_two_factor', 'false', 'boolean', 'Enable two-factor authentication', FALSE),
('enable_ip_whitelist', 'false', 'boolean', 'Enable IP address whitelisting', FALSE),
('enable_rate_limiting', 'true', 'boolean', 'Enable API rate limiting', FALSE),
('rate_limit_requests_per_hour', '1000', 'number', 'Rate limit requests per hour', FALSE);

-- Security Incidents
CREATE TABLE IF NOT EXISTS security_incidents (
    id TEXT PRIMARY KEY,
    incident_type TEXT NOT NULL CHECK (incident_type IN ('brute_force', 'suspicious_login', 'data_breach', 'unauthorized_access', 'malware', 'phishing')),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
    title TEXT NOT NULL,
    description TEXT,
    affected_users TEXT, -- JSON array of user IDs
    affected_systems TEXT, -- JSON array of system components
    detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    resolved_by TEXT,
    resolution_notes TEXT,
    created_by TEXT DEFAULT 'system'
);

-- Views for Security Reporting

-- Active User Sessions View
CREATE VIEW IF NOT EXISTS active_user_sessions AS
SELECT 
    us.session_id,
    us.user_id,
    u.username,
    u.email,
    us.ip_address,
    us.created_at,
    us.last_activity,
    us.expires_at,
    us.location_country,
    us.location_city,
    GROUP_CONCAT(r.role_name) as roles
FROM user_sessions us
JOIN users u ON us.user_id = u.id
LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = 1
LEFT JOIN roles r ON ur.role_id = r.id
WHERE us.is_active = 1 AND us.expires_at > datetime('now')
GROUP BY us.session_id
ORDER BY us.last_activity DESC;

-- Security Risk Dashboard View
CREATE VIEW IF NOT EXISTS security_risk_dashboard AS
SELECT 
    'failed_logins' as metric_type,
    COUNT(*) as count,
    'last_24h' as period
FROM security_audit_logs 
WHERE action = 'failed_auth' AND timestamp > datetime('now', '-24 hours')

UNION ALL

SELECT 
    'high_risk_events' as metric_type,
    COUNT(*) as count,
    'last_24h' as period
FROM security_audit_logs 
WHERE risk_level IN ('high', 'critical') AND timestamp > datetime('now', '-24 hours')

UNION ALL

SELECT 
    'locked_accounts' as metric_type,
    COUNT(*) as count,
    'current' as period
FROM users 
WHERE locked_until > datetime('now')

UNION ALL

SELECT 
    'active_sessions' as metric_type,
    COUNT(*) as count,
    'current' as period
FROM user_sessions 
WHERE is_active = 1 AND expires_at > datetime('now');

-- User Permissions View
CREATE VIEW IF NOT EXISTS user_permissions_view AS
SELECT 
    u.id as user_id,
    u.username,
    u.email,
    r.role_name,
    p.permission_name,
    p.category as permission_category,
    ur.assigned_at,
    ur.expires_at
FROM users u
JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = 1
JOIN roles r ON ur.role_id = r.id AND r.is_active = 1
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id AND p.is_active = 1
WHERE u.is_active = 1
ORDER BY u.username, r.role_name, p.category, p.permission_name;

-- Triggers for Security Events

-- Trigger for failed login tracking
CREATE TRIGGER IF NOT EXISTS track_failed_logins
AFTER INSERT ON security_audit_logs
WHEN NEW.action = 'failed_auth' AND NEW.success = 0
BEGIN
    UPDATE users 
    SET 
        failed_login_attempts = failed_login_attempts + 1,
        locked_until = CASE 
            WHEN failed_login_attempts + 1 >= (SELECT CAST(config_value AS INTEGER) FROM security_config WHERE config_key = 'max_failed_login_attempts')
            THEN datetime('now', '+' || (SELECT config_value FROM security_config WHERE config_key = 'account_lockout_duration') || ' minutes')
            ELSE locked_until
        END
    WHERE id = NEW.user_id;
END;

-- Trigger for successful login reset
CREATE TRIGGER IF NOT EXISTS reset_failed_logins
AFTER INSERT ON security_audit_logs
WHEN NEW.action = 'login' AND NEW.success = 1
BEGIN
    UPDATE users 
    SET 
        failed_login_attempts = 0,
        locked_until = NULL,
        last_login = datetime('now')
    WHERE id = NEW.user_id;
END;

-- Trigger for session cleanup
CREATE TRIGGER IF NOT EXISTS cleanup_expired_sessions
AFTER INSERT ON user_sessions
BEGIN
    UPDATE user_sessions 
    SET is_active = 0 
    WHERE expires_at < datetime('now');
    
    UPDATE refresh_tokens 
    SET is_revoked = 1 
    WHERE expires_at < datetime('now') AND is_revoked = 0;
END;

-- Create default admin user (password should be changed immediately)
INSERT OR IGNORE INTO users (
    id, username, email, password_hash, salt, first_name, last_name, 
    is_active, is_verified, must_change_password, created_by
) VALUES (
    'admin_001',
    'admin',
    'admin@khoaugment.com',
    'hashed_password_placeholder', -- This should be properly hashed
    'random_salt_placeholder',
    'System',
    'Administrator',
    1,
    1,
    1,
    'system'
);

-- Assign super admin role to default admin
INSERT OR IGNORE INTO user_roles (user_id, role_id, assigned_by)
SELECT 'admin_001', id, 'system'
FROM roles 
WHERE role_name = 'super_admin';