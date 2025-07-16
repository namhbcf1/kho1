-- Performance Optimization Schema
-- Fixes: Performance bottlenecks, slow query responses
-- Implements: Query monitoring, cache management, performance metrics

-- Query Performance Metrics
CREATE TABLE IF NOT EXISTS query_metrics (
    id TEXT PRIMARY KEY,
    query_id TEXT NOT NULL,
    sql_query TEXT NOT NULL,
    execution_time REAL NOT NULL,
    rows_affected INTEGER DEFAULT 0,
    tables_used TEXT, -- JSON array of table names
    indexes_used TEXT, -- JSON array of index names
    missing_indexes TEXT, -- JSON array of suggested indexes
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    frequency INTEGER DEFAULT 1,
    avg_execution_time REAL,
    performance_score INTEGER DEFAULT 100 CHECK (performance_score >= 0 AND performance_score <= 100),
    optimization_applied BOOLEAN DEFAULT FALSE,
    user_id TEXT,
    session_id TEXT
);

-- Indexes for query metrics
CREATE INDEX IF NOT EXISTS idx_query_metrics_execution_time 
ON query_metrics(execution_time DESC);

CREATE INDEX IF NOT EXISTS idx_query_metrics_timestamp 
ON query_metrics(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_query_metrics_query_id 
ON query_metrics(query_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_query_metrics_performance_score 
ON query_metrics(performance_score ASC);

-- Index Recommendations
CREATE TABLE IF NOT EXISTS index_recommendations (
    id TEXT PRIMARY KEY,
    table_name TEXT NOT NULL,
    columns TEXT NOT NULL, -- JSON array of column names
    index_type TEXT NOT NULL CHECK (index_type IN ('btree', 'hash', 'composite', 'partial')),
    reason TEXT NOT NULL,
    estimated_improvement REAL DEFAULT 0, -- percentage improvement
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    sql_to_create TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'created', 'failed', 'ignored')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    applied_at DATETIME,
    applied_by TEXT,
    impact_measured REAL -- actual improvement after creation
);

-- Cache Performance Metrics
CREATE TABLE IF NOT EXISTS cache_metrics (
    id TEXT PRIMARY KEY,
    cache_layer TEXT NOT NULL CHECK (cache_layer IN ('memory', 'redis', 'browser')),
    cache_key TEXT NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('hit', 'miss', 'set', 'delete', 'evict')),
    response_time REAL DEFAULT 0,
    data_size INTEGER DEFAULT 0,
    ttl INTEGER DEFAULT 0,
    tags TEXT, -- JSON array of cache tags
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    session_id TEXT,
    user_id TEXT
);

-- Indexes for cache metrics
CREATE INDEX IF NOT EXISTS idx_cache_metrics_timestamp 
ON cache_metrics(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_cache_metrics_operation 
ON cache_metrics(cache_layer, operation, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_cache_metrics_key 
ON cache_metrics(cache_key, timestamp DESC);

-- Server Performance Monitoring
CREATE TABLE IF NOT EXISTS server_metrics (
    id TEXT PRIMARY KEY,
    server_id TEXT NOT NULL,
    metric_type TEXT NOT NULL CHECK (metric_type IN ('cpu', 'memory', 'disk', 'network', 'connections', 'response_time')),
    metric_value REAL NOT NULL,
    unit TEXT NOT NULL, -- '%', 'MB', 'ms', etc.
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    threshold_exceeded BOOLEAN DEFAULT FALSE,
    alert_level TEXT CHECK (alert_level IN ('info', 'warning', 'error', 'critical'))
);

-- Indexes for server metrics
CREATE INDEX IF NOT EXISTS idx_server_metrics_timestamp 
ON server_metrics(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_server_metrics_server_type 
ON server_metrics(server_id, metric_type, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_server_metrics_threshold 
ON server_metrics(threshold_exceeded, alert_level, timestamp DESC);

-- Load Balancer Configuration
CREATE TABLE IF NOT EXISTS load_balancer_servers (
    id TEXT PRIMARY KEY,
    server_id TEXT UNIQUE NOT NULL,
    host TEXT NOT NULL,
    port INTEGER NOT NULL CHECK (port > 0 AND port <= 65535),
    weight INTEGER DEFAULT 1 CHECK (weight > 0 AND weight <= 100),
    is_active BOOLEAN DEFAULT TRUE,
    is_healthy BOOLEAN DEFAULT TRUE,
    max_connections INTEGER DEFAULT 100,
    current_connections INTEGER DEFAULT 0,
    response_time REAL DEFAULT 0,
    last_health_check DATETIME DEFAULT CURRENT_TIMESTAMP,
    cpu_usage REAL DEFAULT 0 CHECK (cpu_usage >= 0 AND cpu_usage <= 100),
    memory_usage REAL DEFAULT 0 CHECK (memory_usage >= 0 AND memory_usage <= 100),
    error_rate REAL DEFAULT 0 CHECK (error_rate >= 0 AND error_rate <= 100),
    throughput REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Load Balancer Health Checks
CREATE TABLE IF NOT EXISTS server_health_checks (
    id TEXT PRIMARY KEY,
    server_id TEXT NOT NULL,
    check_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_healthy BOOLEAN NOT NULL,
    response_time REAL DEFAULT 0,
    status_code INTEGER,
    error_message TEXT,
    cpu_usage REAL,
    memory_usage REAL,
    disk_usage REAL,
    
    FOREIGN KEY (server_id) REFERENCES load_balancer_servers(server_id)
);

-- Circuit Breaker State
CREATE TABLE IF NOT EXISTS circuit_breaker_state (
    server_id TEXT PRIMARY KEY,
    state TEXT NOT NULL DEFAULT 'closed' CHECK (state IN ('closed', 'open', 'half-open')),
    failure_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    last_failure_time DATETIME,
    next_attempt_time DATETIME,
    threshold_exceeded_at DATETIME,
    recovery_time DATETIME,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (server_id) REFERENCES load_balancer_servers(server_id)
);

-- Performance Optimization Jobs
CREATE TABLE IF NOT EXISTS performance_optimization_jobs (
    id TEXT PRIMARY KEY,
    job_type TEXT NOT NULL CHECK (job_type IN ('index_creation', 'query_optimization', 'cache_warmup', 'data_archival')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    target_table TEXT,
    target_query TEXT,
    configuration TEXT, -- JSON configuration
    progress REAL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    estimated_duration INTEGER, -- seconds
    actual_duration INTEGER, -- seconds
    error_message TEXT,
    result_summary TEXT, -- JSON with results
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    started_at DATETIME,
    completed_at DATETIME,
    created_by TEXT
);

-- Application Performance Monitoring (APM)
CREATE TABLE IF NOT EXISTS apm_transactions (
    id TEXT PRIMARY KEY,
    transaction_name TEXT NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('web', 'api', 'background', 'database')),
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    duration REAL, -- milliseconds
    status TEXT NOT NULL CHECK (status IN ('success', 'error', 'timeout')),
    user_id TEXT,
    session_id TEXT,
    request_id TEXT,
    endpoint TEXT,
    method TEXT,
    status_code INTEGER,
    error_type TEXT,
    error_message TEXT,
    stack_trace TEXT,
    metadata TEXT, -- JSON with additional context
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- APM Transaction Spans (for distributed tracing)
CREATE TABLE IF NOT EXISTS apm_spans (
    id TEXT PRIMARY KEY,
    transaction_id TEXT NOT NULL,
    parent_span_id TEXT,
    span_name TEXT NOT NULL,
    span_type TEXT NOT NULL, -- 'db', 'http', 'cache', 'compute'
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    duration REAL, -- milliseconds
    tags TEXT, -- JSON key-value pairs
    logs TEXT, -- JSON array of log entries
    
    FOREIGN KEY (transaction_id) REFERENCES apm_transactions(id)
);

-- System Resource Utilization
CREATE TABLE IF NOT EXISTS resource_utilization (
    id TEXT PRIMARY KEY,
    resource_type TEXT NOT NULL CHECK (resource_type IN ('cpu', 'memory', 'disk', 'network', 'database_connections')),
    current_usage REAL NOT NULL,
    max_capacity REAL NOT NULL,
    utilization_percentage REAL GENERATED ALWAYS AS (ROUND((current_usage / max_capacity) * 100, 2)) STORED,
    alert_threshold REAL DEFAULT 80,
    critical_threshold REAL DEFAULT 95,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    server_id TEXT,
    component TEXT -- specific component using the resource
);

-- Performance Alerts
CREATE TABLE IF NOT EXISTS performance_alerts (
    id TEXT PRIMARY KEY,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('slow_query', 'high_cpu', 'high_memory', 'server_down', 'cache_miss_rate', 'error_rate')),
    severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    title TEXT NOT NULL,
    description TEXT,
    source_table TEXT,
    source_id TEXT,
    metric_value REAL,
    threshold_value REAL,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at DATETIME,
    resolved_by TEXT,
    resolution_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    notified_at DATETIME,
    notification_channels TEXT -- JSON array of notification channels
);

-- Database Connection Pool Metrics
CREATE TABLE IF NOT EXISTS connection_pool_metrics (
    id TEXT PRIMARY KEY,
    pool_name TEXT NOT NULL,
    active_connections INTEGER DEFAULT 0,
    idle_connections INTEGER DEFAULT 0,
    total_connections INTEGER DEFAULT 0,
    max_connections INTEGER NOT NULL,
    waiting_requests INTEGER DEFAULT 0,
    connection_errors INTEGER DEFAULT 0,
    avg_connection_time REAL DEFAULT 0,
    avg_query_time REAL DEFAULT 0,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Views for Performance Monitoring

-- Slow Queries Dashboard
CREATE VIEW IF NOT EXISTS slow_queries_dashboard AS
SELECT 
    query_id,
    sql_query,
    avg_execution_time,
    frequency,
    performance_score,
    COUNT(*) as occurrences,
    MAX(timestamp) as last_occurrence,
    AVG(execution_time) as avg_time,
    MAX(execution_time) as max_time,
    GROUP_CONCAT(DISTINCT tables_used) as all_tables_used
FROM query_metrics 
WHERE avg_execution_time > 100 -- slow queries > 100ms
GROUP BY query_id
ORDER BY avg_execution_time DESC, frequency DESC
LIMIT 50;

-- Cache Performance Summary
CREATE VIEW IF NOT EXISTS cache_performance_summary AS
SELECT 
    cache_layer,
    DATE(timestamp) as date,
    COUNT(CASE WHEN operation = 'hit' THEN 1 END) as hits,
    COUNT(CASE WHEN operation = 'miss' THEN 1 END) as misses,
    COUNT(CASE WHEN operation = 'set' THEN 1 END) as sets,
    COUNT(CASE WHEN operation = 'delete' THEN 1 END) as deletes,
    COUNT(CASE WHEN operation = 'evict' THEN 1 END) as evictions,
    ROUND(100.0 * COUNT(CASE WHEN operation = 'hit' THEN 1 END) / 
        NULLIF(COUNT(CASE WHEN operation IN ('hit', 'miss') THEN 1 END), 0), 2) as hit_rate,
    AVG(response_time) as avg_response_time,
    SUM(data_size) as total_data_cached
FROM cache_metrics
GROUP BY cache_layer, DATE(timestamp)
ORDER BY date DESC, cache_layer;

-- Server Health Summary
CREATE VIEW IF NOT EXISTS server_health_summary AS
SELECT 
    lbs.server_id,
    lbs.host,
    lbs.port,
    lbs.is_active,
    lbs.is_healthy,
    lbs.current_connections,
    lbs.max_connections,
    ROUND(100.0 * lbs.current_connections / lbs.max_connections, 2) as connection_utilization,
    lbs.response_time,
    lbs.cpu_usage,
    lbs.memory_usage,
    lbs.error_rate,
    lbs.throughput,
    cbs.state as circuit_breaker_state,
    cbs.failure_count,
    lbs.last_health_check
FROM load_balancer_servers lbs
LEFT JOIN circuit_breaker_state cbs ON lbs.server_id = cbs.server_id
ORDER BY lbs.is_healthy DESC, lbs.response_time ASC;

-- Resource Utilization Alert View
CREATE VIEW IF NOT EXISTS resource_alerts AS
SELECT 
    resource_type,
    component,
    server_id,
    utilization_percentage,
    alert_threshold,
    critical_threshold,
    CASE 
        WHEN utilization_percentage >= critical_threshold THEN 'critical'
        WHEN utilization_percentage >= alert_threshold THEN 'warning'
        ELSE 'normal'
    END as alert_status,
    timestamp
FROM resource_utilization
WHERE utilization_percentage >= alert_threshold
ORDER BY utilization_percentage DESC, timestamp DESC;

-- Performance Trends View
CREATE VIEW IF NOT EXISTS performance_trends AS
SELECT 
    DATE(timestamp) as date,
    'query_performance' as metric_type,
    AVG(avg_execution_time) as avg_value,
    COUNT(*) as sample_count,
    MIN(performance_score) as min_score,
    AVG(performance_score) as avg_score,
    MAX(performance_score) as max_score
FROM query_metrics
GROUP BY DATE(timestamp)

UNION ALL

SELECT 
    DATE(timestamp) as date,
    'cache_hit_rate' as metric_type,
    ROUND(100.0 * COUNT(CASE WHEN operation = 'hit' THEN 1 END) / 
        NULLIF(COUNT(CASE WHEN operation IN ('hit', 'miss') THEN 1 END), 0), 2) as avg_value,
    COUNT(*) as sample_count,
    NULL as min_score,
    NULL as avg_score,
    NULL as max_score
FROM cache_metrics
GROUP BY DATE(timestamp)

ORDER BY date DESC, metric_type;

-- Triggers for Performance Monitoring

-- Trigger to create alerts for slow queries
CREATE TRIGGER IF NOT EXISTS create_slow_query_alert
AFTER INSERT ON query_metrics
WHEN NEW.execution_time > 1000 -- 1 second threshold
BEGIN
    INSERT INTO performance_alerts (
        id,
        alert_type,
        severity,
        title,
        description,
        source_table,
        source_id,
        metric_value,
        threshold_value
    ) VALUES (
        'alert_' || NEW.id || '_' || strftime('%s', 'now'),
        'slow_query',
        CASE 
            WHEN NEW.execution_time > 5000 THEN 'critical'
            WHEN NEW.execution_time > 2000 THEN 'error'
            ELSE 'warning'
        END,
        'Slow Query Detected',
        'Query execution time: ' || NEW.execution_time || 'ms',
        'query_metrics',
        NEW.id,
        NEW.execution_time,
        1000
    );
END;

-- Trigger to update server health status
CREATE TRIGGER IF NOT EXISTS update_server_health
AFTER INSERT ON server_health_checks
BEGIN
    UPDATE load_balancer_servers 
    SET 
        is_healthy = NEW.is_healthy,
        response_time = COALESCE(NEW.response_time, response_time),
        cpu_usage = COALESCE(NEW.cpu_usage, cpu_usage),
        memory_usage = COALESCE(NEW.memory_usage, memory_usage),
        last_health_check = NEW.check_timestamp,
        updated_at = CURRENT_TIMESTAMP
    WHERE server_id = NEW.server_id;
    
    -- Update circuit breaker state if server becomes unhealthy
    UPDATE circuit_breaker_state 
    SET 
        failure_count = CASE WHEN NEW.is_healthy = 0 THEN failure_count + 1 ELSE 0 END,
        last_failure_time = CASE WHEN NEW.is_healthy = 0 THEN NEW.check_timestamp ELSE last_failure_time END,
        state = CASE 
            WHEN NEW.is_healthy = 0 AND failure_count + 1 >= 3 THEN 'open'
            WHEN NEW.is_healthy = 1 AND state = 'half-open' THEN 'closed'
            ELSE state
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE server_id = NEW.server_id;
END;

-- Trigger to create resource utilization alerts
CREATE TRIGGER IF NOT EXISTS create_resource_alert
AFTER INSERT ON resource_utilization
WHEN NEW.utilization_percentage >= NEW.alert_threshold
BEGIN
    INSERT INTO performance_alerts (
        id,
        alert_type,
        severity,
        title,
        description,
        metric_value,
        threshold_value
    ) VALUES (
        'resource_alert_' || NEW.id || '_' || strftime('%s', 'now'),
        CASE NEW.resource_type
            WHEN 'cpu' THEN 'high_cpu'
            WHEN 'memory' THEN 'high_memory'
            ELSE 'resource_usage'
        END,
        CASE 
            WHEN NEW.utilization_percentage >= NEW.critical_threshold THEN 'critical'
            ELSE 'warning'
        END,
        'High ' || UPPER(NEW.resource_type) || ' Usage',
        NEW.resource_type || ' utilization: ' || NEW.utilization_percentage || '%',
        NEW.utilization_percentage,
        NEW.alert_threshold
    );
END;

-- Initialize performance monitoring data

-- Insert default load balancer server (localhost for development)
INSERT OR IGNORE INTO load_balancer_servers (
    server_id, host, port, weight, max_connections
) VALUES (
    'localhost_primary',
    '127.0.0.1',
    8787,
    100,
    1000
);

-- Initialize circuit breaker state
INSERT OR IGNORE INTO circuit_breaker_state (server_id)
SELECT server_id FROM load_balancer_servers;

-- Insert sample performance optimization jobs
INSERT OR IGNORE INTO performance_optimization_jobs (
    id, job_type, priority, target_table, configuration
) VALUES (
    'optimize_transactions_table',
    'index_creation',
    'high',
    'transactions',
    '{"indexes": [{"columns": ["created_at", "status"], "type": "composite"}]}'
),
(
    'optimize_products_queries',
    'query_optimization',
    'medium',
    'products',
    '{"focus": "inventory_queries", "threshold": 100}'
);

-- Performance configuration settings
INSERT OR IGNORE INTO security_config (config_key, config_value, config_type, description) VALUES
('query_slow_threshold', '100', 'number', 'Slow query threshold in milliseconds'),
('cache_default_ttl', '300', 'number', 'Default cache TTL in seconds'),
('max_connection_pool_size', '20', 'number', 'Maximum database connection pool size'),
('enable_query_cache', 'true', 'boolean', 'Enable query result caching'),
('enable_performance_monitoring', 'true', 'boolean', 'Enable performance monitoring'),
('auto_optimize_queries', 'false', 'boolean', 'Enable automatic query optimization'),
('alert_notification_enabled', 'true', 'boolean', 'Enable performance alert notifications');