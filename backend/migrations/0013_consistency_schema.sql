-- Consistency Management Schema
-- Fixes: Cloudflare KV eventual consistency issues
-- Implements: Strong consistency, version control, conflict resolution

-- Consistency Store - Source of Truth for Critical Data
CREATE TABLE IF NOT EXISTS consistency_store (
    key TEXT PRIMARY KEY,
    data TEXT NOT NULL, -- JSON serialized data
    version INTEGER NOT NULL DEFAULT 1,
    timestamp DATETIME NOT NULL,
    checksum TEXT NOT NULL,
    metadata TEXT NOT NULL, -- JSON with lastModified, modifiedBy, source
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for version queries
CREATE INDEX IF NOT EXISTS idx_consistency_version 
ON consistency_store(key, version DESC);

-- Index for timestamp queries
CREATE INDEX IF NOT EXISTS idx_consistency_timestamp 
ON consistency_store(timestamp DESC);

-- Conflict Resolution Queue
CREATE TABLE IF NOT EXISTS consistency_conflicts (
    id TEXT PRIMARY KEY,
    key TEXT NOT NULL,
    conflict_type TEXT NOT NULL CHECK (conflict_type IN ('version', 'merge', 'overwrite')),
    conflicting_versions TEXT NOT NULL, -- JSON array of conflicting versions
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'escalated')),
    resolution_strategy TEXT CHECK (resolution_strategy IN ('last-write-wins', 'merge', 'manual')),
    resolved_data TEXT, -- JSON of resolved data
    resolved_by TEXT,
    resolved_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (key) REFERENCES consistency_store(key)
);

-- Index for conflict management
CREATE INDEX IF NOT EXISTS idx_conflicts_status 
ON consistency_conflicts(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conflicts_key 
ON consistency_conflicts(key, created_at DESC);

-- Propagation Tracking
CREATE TABLE IF NOT EXISTS kv_propagation_log (
    id TEXT PRIMARY KEY,
    key TEXT NOT NULL,
    version INTEGER NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('write', 'delete', 'invalidate')),
    propagation_start DATETIME DEFAULT CURRENT_TIMESTAMP,
    propagation_end DATETIME,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'timeout')),
    regions_target TEXT, -- JSON array of target regions
    regions_completed TEXT, -- JSON array of completed regions
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    FOREIGN KEY (key) REFERENCES consistency_store(key)
);

-- Index for propagation monitoring
CREATE INDEX IF NOT EXISTS idx_propagation_status 
ON kv_propagation_log(status, propagation_start DESC);

CREATE INDEX IF NOT EXISTS idx_propagation_key 
ON kv_propagation_log(key, version DESC);

-- Performance Metrics for Consistency
CREATE TABLE IF NOT EXISTS consistency_metrics (
    id TEXT PRIMARY KEY,
    metric_type TEXT NOT NULL CHECK (metric_type IN ('read_latency', 'write_latency', 'propagation_time', 'conflict_rate')),
    key_pattern TEXT, -- Pattern like 'pricing:*', 'inventory:*'
    value_numeric REAL,
    value_text TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT -- JSON with additional context
);

-- Index for metrics analysis
CREATE INDEX IF NOT EXISTS idx_metrics_type_time 
ON consistency_metrics(metric_type, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_metrics_pattern 
ON consistency_metrics(key_pattern, timestamp DESC);

-- Pricing Consistency (Critical for Business)
CREATE TABLE IF NOT EXISTS pricing_consistency (
    product_id INTEGER PRIMARY KEY,
    current_price DECIMAL(15,2) NOT NULL,
    price_version INTEGER NOT NULL DEFAULT 1,
    effective_date DATETIME NOT NULL,
    kv_synced BOOLEAN DEFAULT FALSE,
    kv_sync_timestamp DATETIME,
    last_conflict_at DATETIME,
    conflict_count INTEGER DEFAULT 0,
    
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Trigger to update pricing consistency
CREATE TRIGGER IF NOT EXISTS pricing_consistency_update
AFTER UPDATE OF price ON products
BEGIN
    INSERT OR REPLACE INTO pricing_consistency (
        product_id, current_price, price_version, effective_date, kv_synced
    ) VALUES (
        NEW.id,
        NEW.price,
        COALESCE((SELECT price_version + 1 FROM pricing_consistency WHERE product_id = NEW.id), 1),
        CURRENT_TIMESTAMP,
        FALSE
    );
    
    -- Log the pricing change for audit
    INSERT INTO consistency_metrics (
        id, metric_type, key_pattern, value_numeric, metadata
    ) VALUES (
        'price_' || NEW.id || '_' || strftime('%s', 'now'),
        'price_change',
        'pricing:product:' || NEW.id,
        NEW.price,
        json_object(
            'old_price', OLD.price,
            'new_price', NEW.price,
            'product_id', NEW.id,
            'change_type', 'update'
        )
    );
END;

-- Inventory Consistency (Critical for Stock)
CREATE TABLE IF NOT EXISTS inventory_consistency (
    product_id INTEGER PRIMARY KEY,
    current_stock INTEGER NOT NULL,
    reserved_stock INTEGER NOT NULL DEFAULT 0,
    stock_version INTEGER NOT NULL DEFAULT 1,
    last_movement_at DATETIME NOT NULL,
    kv_synced BOOLEAN DEFAULT FALSE,
    kv_sync_timestamp DATETIME,
    last_conflict_at DATETIME,
    conflict_count INTEGER DEFAULT 0,
    
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Trigger to update inventory consistency
CREATE TRIGGER IF NOT EXISTS inventory_consistency_update
AFTER UPDATE OF stock_quantity ON products
BEGIN
    INSERT OR REPLACE INTO inventory_consistency (
        product_id, current_stock, stock_version, last_movement_at, kv_synced
    ) VALUES (
        NEW.id,
        NEW.stock_quantity,
        COALESCE((SELECT stock_version + 1 FROM inventory_consistency WHERE product_id = NEW.id), 1),
        CURRENT_TIMESTAMP,
        FALSE
    );
    
    -- Log the inventory change
    INSERT INTO consistency_metrics (
        id, metric_type, key_pattern, value_numeric, metadata
    ) VALUES (
        'stock_' || NEW.id || '_' || strftime('%s', 'now'),
        'stock_change',
        'inventory:product:' || NEW.id,
        NEW.stock_quantity,
        json_object(
            'old_stock', OLD.stock_quantity,
            'new_stock', NEW.stock_quantity,
            'product_id', NEW.id,
            'change_type', 'update'
        )
    );
END;

-- System Configuration Consistency
CREATE TABLE IF NOT EXISTS system_config_consistency (
    config_key TEXT PRIMARY KEY,
    config_value TEXT NOT NULL,
    config_version INTEGER NOT NULL DEFAULT 1,
    config_type TEXT NOT NULL CHECK (config_type IN ('string', 'number', 'boolean', 'json')),
    is_critical BOOLEAN DEFAULT FALSE,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    kv_synced BOOLEAN DEFAULT FALSE,
    kv_sync_timestamp DATETIME
);

-- Critical system configurations
INSERT OR IGNORE INTO system_config_consistency (config_key, config_value, config_type, is_critical) VALUES
('vat_rates', '{"standard": 0.10, "reduced": 0.05, "exempt": 0.00}', 'json', TRUE),
('business_hours', '{"open": "08:00", "close": "22:00", "timezone": "Asia/Ho_Chi_Minh"}', 'json', TRUE),
('payment_gateways', '{"vnpay": true, "momo": true, "zalopay": true}', 'json', TRUE),
('max_transaction_amount', '500000000', 'number', TRUE),
('currency', 'VND', 'string', TRUE);

-- Views for Consistency Monitoring

-- Pricing Consistency Status View
CREATE VIEW IF NOT EXISTS pricing_consistency_status AS
SELECT 
    p.id as product_id,
    p.name as product_name,
    p.price as db_price,
    pc.current_price as consistency_price,
    pc.price_version,
    pc.kv_synced,
    pc.kv_sync_timestamp,
    CASE 
        WHEN pc.kv_synced = FALSE THEN 'PENDING_SYNC'
        WHEN pc.conflict_count > 0 THEN 'HAS_CONFLICTS'
        ELSE 'SYNCED'
    END as sync_status,
    pc.conflict_count,
    pc.last_conflict_at
FROM products p
LEFT JOIN pricing_consistency pc ON p.id = pc.product_id
WHERE p.is_active = 1;

-- Inventory Consistency Status View
CREATE VIEW IF NOT EXISTS inventory_consistency_status AS
SELECT 
    p.id as product_id,
    p.name as product_name,
    p.stock_quantity as db_stock,
    ic.current_stock as consistency_stock,
    ic.reserved_stock,
    ic.stock_version,
    ic.kv_synced,
    ic.kv_sync_timestamp,
    CASE 
        WHEN ic.kv_synced = FALSE THEN 'PENDING_SYNC'
        WHEN ic.conflict_count > 0 THEN 'HAS_CONFLICTS'
        ELSE 'SYNCED'
    END as sync_status,
    ic.conflict_count,
    ic.last_conflict_at
FROM products p
LEFT JOIN inventory_consistency ic ON p.id = ic.product_id
WHERE p.is_active = 1;

-- Consistency Health Dashboard View
CREATE VIEW IF NOT EXISTS consistency_health_dashboard AS
SELECT 
    'pricing' as component,
    COUNT(*) as total_items,
    COUNT(CASE WHEN kv_synced = FALSE THEN 1 END) as pending_sync,
    COUNT(CASE WHEN conflict_count > 0 THEN 1 END) as has_conflicts,
    ROUND(100.0 * COUNT(CASE WHEN kv_synced = TRUE THEN 1 END) / COUNT(*), 2) as sync_percentage
FROM pricing_consistency

UNION ALL

SELECT 
    'inventory' as component,
    COUNT(*) as total_items,
    COUNT(CASE WHEN kv_synced = FALSE THEN 1 END) as pending_sync,
    COUNT(CASE WHEN conflict_count > 0 THEN 1 END) as has_conflicts,
    ROUND(100.0 * COUNT(CASE WHEN kv_synced = TRUE THEN 1 END) / COUNT(*), 2) as sync_percentage
FROM inventory_consistency

UNION ALL

SELECT 
    'system_config' as component,
    COUNT(*) as total_items,
    COUNT(CASE WHEN kv_synced = FALSE THEN 1 END) as pending_sync,
    0 as has_conflicts,
    ROUND(100.0 * COUNT(CASE WHEN kv_synced = TRUE THEN 1 END) / COUNT(*), 2) as sync_percentage
FROM system_config_consistency;

-- Procedures for Consistency Management

-- Mark KV sync completion
CREATE TRIGGER IF NOT EXISTS mark_pricing_synced
AFTER INSERT ON consistency_metrics
WHEN NEW.metric_type = 'kv_sync_completed' AND NEW.key_pattern LIKE 'pricing:product:%'
BEGIN
    UPDATE pricing_consistency 
    SET 
        kv_synced = TRUE,
        kv_sync_timestamp = CURRENT_TIMESTAMP
    WHERE product_id = CAST(REPLACE(NEW.key_pattern, 'pricing:product:', '') AS INTEGER);
END;

CREATE TRIGGER IF NOT EXISTS mark_inventory_synced
AFTER INSERT ON consistency_metrics
WHEN NEW.metric_type = 'kv_sync_completed' AND NEW.key_pattern LIKE 'inventory:product:%'
BEGIN
    UPDATE inventory_consistency 
    SET 
        kv_synced = TRUE,
        kv_sync_timestamp = CURRENT_TIMESTAMP
    WHERE product_id = CAST(REPLACE(NEW.key_pattern, 'inventory:product:', '') AS INTEGER);
END;

-- Cleanup old metrics (keep last 30 days)
CREATE TRIGGER IF NOT EXISTS cleanup_old_metrics
AFTER INSERT ON consistency_metrics
BEGIN
    DELETE FROM consistency_metrics 
    WHERE timestamp < datetime('now', '-30 days');
END;

-- Initial data for system health monitoring
INSERT OR IGNORE INTO consistency_metrics (
    id, metric_type, key_pattern, value_text, metadata
) VALUES (
    'system_init_' || strftime('%s', 'now'),
    'system_health',
    'system:consistency',
    'initialized',
    json_object('version', '1.0', 'initialization_time', datetime('now'))
);