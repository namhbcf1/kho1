-- Event Sourcing Schema for Financial ACID Compliance
-- Fixes: Database architecture catastrophic design issues
-- Implements: True audit trail, concurrency control, rollback capabilities

-- Event Store Table - Core of event sourcing
CREATE TABLE IF NOT EXISTS event_store (
    id TEXT PRIMARY KEY,
    aggregate_id TEXT NOT NULL,
    aggregate_type TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_data TEXT NOT NULL, -- JSON
    metadata TEXT NOT NULL,   -- JSON with userId, timestamp, version, etc.
    stream_position INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure uniqueness and ordering within streams
    UNIQUE(aggregate_id, aggregate_type, stream_position)
);

-- Index for fast stream reading
CREATE INDEX IF NOT EXISTS idx_event_store_stream 
ON event_store(aggregate_id, aggregate_type, stream_position);

-- Index for event type queries
CREATE INDEX IF NOT EXISTS idx_event_store_type 
ON event_store(event_type, created_at);

-- Index for global ordering
CREATE INDEX IF NOT EXISTS idx_event_store_global 
ON event_store(stream_position, created_at);

-- Aggregate Versions Table - Optimistic Concurrency Control
CREATE TABLE IF NOT EXISTS aggregate_versions (
    aggregate_id TEXT NOT NULL,
    aggregate_type TEXT NOT NULL,
    version INTEGER NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (aggregate_id, aggregate_type)
);

-- Aggregate Snapshots - Performance Optimization
CREATE TABLE IF NOT EXISTS aggregate_snapshots (
    aggregate_id TEXT NOT NULL,
    aggregate_type TEXT NOT NULL,
    version INTEGER NOT NULL,
    data TEXT NOT NULL, -- JSON snapshot of aggregate state
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (aggregate_id, aggregate_type, version)
);

-- Index for latest snapshot lookup
CREATE INDEX IF NOT EXISTS idx_snapshots_latest 
ON aggregate_snapshots(aggregate_id, aggregate_type, version DESC);

-- Financial Transaction Events Projection (Read Model)
CREATE TABLE IF NOT EXISTS financial_transactions_projection (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency TEXT DEFAULT 'VND',
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_method TEXT NOT NULL,
    gateway_transaction_id TEXT,
    created_at DATETIME NOT NULL,
    completed_at DATETIME,
    failed_at DATETIME,
    refunded_at DATETIME,
    refund_amount DECIMAL(15,2),
    refund_reason TEXT,
    created_by TEXT NOT NULL,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Foreign key constraints
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- Indexes for transaction queries
CREATE INDEX IF NOT EXISTS idx_financial_trans_order 
ON financial_transactions_projection(order_id);

CREATE INDEX IF NOT EXISTS idx_financial_trans_status 
ON financial_transactions_projection(status, created_at);

CREATE INDEX IF NOT EXISTS idx_financial_trans_method 
ON financial_transactions_projection(payment_method, created_at);

-- Inventory Events Projection (Read Model)
CREATE TABLE IF NOT EXISTS inventory_projection (
    product_id INTEGER PRIMARY KEY,
    current_stock INTEGER NOT NULL DEFAULT 0,
    reserved_stock INTEGER NOT NULL DEFAULT 0,
    available_stock INTEGER GENERATED ALWAYS AS (current_stock - reserved_stock) STORED,
    reorder_level INTEGER DEFAULT 0,
    max_stock INTEGER DEFAULT 1000,
    last_movement_at DATETIME,
    version INTEGER NOT NULL DEFAULT 1,
    
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Inventory Movement Events
CREATE TABLE IF NOT EXISTS inventory_movements_events (
    id TEXT PRIMARY KEY,
    product_id INTEGER NOT NULL,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('sale', 'purchase', 'adjustment', 'reservation', 'release')),
    quantity_change INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    reference_id TEXT, -- order_id, adjustment_id, etc.
    reason TEXT,
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Index for inventory movement history
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product 
ON inventory_movements_events(product_id, created_at DESC);

-- Audit Log for Compliance
CREATE TABLE IF NOT EXISTS financial_audit_log (
    id TEXT PRIMARY KEY,
    aggregate_id TEXT NOT NULL,
    aggregate_type TEXT NOT NULL,
    event_type TEXT NOT NULL,
    user_id TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    details TEXT, -- JSON
    risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    compliance_flags TEXT -- JSON array of compliance requirements met
);

-- Index for audit queries
CREATE INDEX IF NOT EXISTS idx_audit_log_user 
ON financial_audit_log(user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_aggregate 
ON financial_audit_log(aggregate_id, aggregate_type, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_risk 
ON financial_audit_log(risk_level, timestamp DESC);

-- Financial Reconciliation Table
CREATE TABLE IF NOT EXISTS financial_reconciliation (
    id TEXT PRIMARY KEY,
    reconciliation_date DATE NOT NULL,
    total_sales DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_refunds DECIMAL(15,2) NOT NULL DEFAULT 0,
    net_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    transaction_count INTEGER NOT NULL DEFAULT 0,
    discrepancies_found INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'requires_review')),
    created_by TEXT NOT NULL,
    reviewed_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    notes TEXT
);

-- Daily reconciliation constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_reconciliation_date 
ON financial_reconciliation(reconciliation_date);

-- Event Sourcing Triggers for Data Integrity

-- Trigger to update financial projection from events
CREATE TRIGGER IF NOT EXISTS update_financial_projection_from_events
AFTER INSERT ON event_store
WHEN NEW.aggregate_type = 'FinancialTransaction'
BEGIN
    -- Handle TransactionCreated events
    INSERT OR IGNORE INTO financial_transactions_projection (
        id, order_id, amount, currency, status, payment_method, created_at, created_by, version
    )
    SELECT 
        NEW.aggregate_id,
        json_extract(NEW.event_data, '$.orderId'),
        CAST(json_extract(NEW.event_data, '$.amount') AS DECIMAL(15,2)),
        COALESCE(json_extract(NEW.event_data, '$.currency'), 'VND'),
        'pending',
        json_extract(NEW.event_data, '$.paymentMethod'),
        json_extract(NEW.metadata, '$.timestamp'),
        json_extract(NEW.metadata, '$.userId'),
        NEW.stream_position
    WHERE NEW.event_type = 'TransactionCreated';
    
    -- Handle PaymentCompleted events
    UPDATE financial_transactions_projection 
    SET 
        status = 'completed',
        gateway_transaction_id = json_extract(NEW.event_data, '$.gatewayTransactionId'),
        completed_at = json_extract(NEW.event_data, '$.completedAt'),
        last_updated = CURRENT_TIMESTAMP,
        version = NEW.stream_position
    WHERE id = NEW.aggregate_id 
    AND NEW.event_type = 'PaymentCompleted';
    
    -- Handle PaymentFailed events
    UPDATE financial_transactions_projection 
    SET 
        status = 'failed',
        failed_at = json_extract(NEW.event_data, '$.failedAt'),
        last_updated = CURRENT_TIMESTAMP,
        version = NEW.stream_position
    WHERE id = NEW.aggregate_id 
    AND NEW.event_type = 'PaymentFailed';
    
    -- Handle PaymentRefunded events
    UPDATE financial_transactions_projection 
    SET 
        status = 'refunded',
        refunded_at = json_extract(NEW.event_data, '$.refundedAt'),
        refund_amount = CAST(json_extract(NEW.event_data, '$.refundAmount') AS DECIMAL(15,2)),
        refund_reason = json_extract(NEW.event_data, '$.reason'),
        last_updated = CURRENT_TIMESTAMP,
        version = NEW.stream_position
    WHERE id = NEW.aggregate_id 
    AND NEW.event_type = 'PaymentRefunded';
END;

-- Trigger for audit logging
CREATE TRIGGER IF NOT EXISTS financial_audit_logger
AFTER INSERT ON event_store
WHEN NEW.aggregate_type IN ('FinancialTransaction', 'InventoryMovement')
BEGIN
    INSERT INTO financial_audit_log (
        id, aggregate_id, aggregate_type, event_type, user_id, 
        timestamp, details, risk_level, compliance_flags
    ) VALUES (
        'audit_' || NEW.id,
        NEW.aggregate_id,
        NEW.aggregate_type,
        NEW.event_type,
        json_extract(NEW.metadata, '$.userId'),
        NEW.created_at,
        NEW.event_data,
        CASE 
            WHEN NEW.event_type IN ('PaymentCompleted', 'PaymentRefunded') THEN 'high'
            WHEN NEW.event_type = 'PaymentFailed' THEN 'medium'
            ELSE 'low'
        END,
        json_array('AUDIT_TRAIL', 'EVENT_SOURCING', 'FINANCIAL_COMPLIANCE')
    );
END;

-- Views for Financial Reporting

-- Daily Sales Summary View
CREATE VIEW IF NOT EXISTS daily_sales_summary AS
SELECT 
    DATE(created_at) as sale_date,
    COUNT(*) as transaction_count,
    SUM(amount) as total_sales,
    SUM(CASE WHEN status = 'refunded' THEN refund_amount ELSE 0 END) as total_refunds,
    SUM(amount) - SUM(CASE WHEN status = 'refunded' THEN refund_amount ELSE 0 END) as net_sales,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_transactions,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_transactions
FROM financial_transactions_projection
WHERE status IN ('completed', 'refunded')
GROUP BY DATE(created_at)
ORDER BY sale_date DESC;

-- Payment Method Performance View
CREATE VIEW IF NOT EXISTS payment_method_performance AS
SELECT 
    payment_method,
    COUNT(*) as total_transactions,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_count,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
    ROUND(
        100.0 * COUNT(CASE WHEN status = 'completed' THEN 1 END) / COUNT(*), 
        2
    ) as success_rate,
    SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_amount,
    AVG(CASE WHEN status = 'completed' THEN amount ELSE NULL END) as avg_transaction_amount
FROM financial_transactions_projection
GROUP BY payment_method
ORDER BY total_amount DESC;

-- Vietnamese Financial Compliance Views

-- VAT Summary for Tax Reporting
CREATE VIEW IF NOT EXISTS vat_summary_daily AS
SELECT 
    DATE(o.created_at) as transaction_date,
    o.vat_rate,
    COUNT(*) as transaction_count,
    SUM(o.subtotal) as total_subtotal,
    SUM(o.vat_amount) as total_vat,
    SUM(o.total_amount) as total_with_vat
FROM orders o
INNER JOIN financial_transactions_projection ft ON o.id = ft.order_id
WHERE ft.status = 'completed'
GROUP BY DATE(o.created_at), o.vat_rate
ORDER BY transaction_date DESC, o.vat_rate;

-- Insert some initial data for system health
INSERT OR IGNORE INTO aggregate_versions (aggregate_id, aggregate_type, version)
VALUES ('system', 'SystemHealth', 0);

-- Grant necessary permissions (if using role-based access)
-- GRANT SELECT, INSERT ON event_store TO pos_worker;
-- GRANT SELECT, INSERT, UPDATE ON financial_transactions_projection TO pos_worker;
-- GRANT SELECT, INSERT ON financial_audit_log TO pos_worker;