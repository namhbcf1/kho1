-- Create monitoring and logging tables for comprehensive error tracking
-- Migration: 0011_create_monitoring_tables.sql

-- Error logs table
CREATE TABLE IF NOT EXISTS error_logs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  timestamp DATETIME NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('info', 'warn', 'error', 'critical')),
  message TEXT NOT NULL,
  error_details TEXT, -- JSON string
  context TEXT NOT NULL, -- JSON string
  metadata TEXT, -- JSON string
  tags TEXT, -- JSON array
  environment TEXT NOT NULL DEFAULT 'development',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Security logs table
CREATE TABLE IF NOT EXISTS security_logs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  timestamp DATETIME NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('authentication', 'authorization', 'rate_limit', 'suspicious_activity', 'data_breach')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message TEXT NOT NULL,
  context TEXT NOT NULL, -- JSON string
  metadata TEXT, -- JSON string
  environment TEXT NOT NULL DEFAULT 'development',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Performance logs table
CREATE TABLE IF NOT EXISTS performance_logs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  timestamp DATETIME NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('database', 'api', 'external_service', 'file_operation')),
  operation TEXT NOT NULL,
  duration INTEGER NOT NULL, -- milliseconds
  success BOOLEAN NOT NULL DEFAULT 0,
  context TEXT NOT NULL, -- JSON string
  metadata TEXT, -- JSON string
  environment TEXT NOT NULL DEFAULT 'development',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Business logs table
CREATE TABLE IF NOT EXISTS business_logs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  timestamp DATETIME NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('order', 'payment', 'inventory', 'customer', 'loyalty', 'promotion')),
  action TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT 0,
  context TEXT NOT NULL, -- JSON string
  metadata TEXT, -- JSON string
  environment TEXT NOT NULL DEFAULT 'development',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- API request logs table
CREATE TABLE IF NOT EXISTS api_request_logs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  timestamp DATETIME NOT NULL,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time INTEGER NOT NULL, -- milliseconds
  user_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  request_size INTEGER,
  response_size INTEGER,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Database performance monitoring
CREATE TABLE IF NOT EXISTS db_performance_logs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  timestamp DATETIME NOT NULL,
  query_type TEXT NOT NULL, -- SELECT, INSERT, UPDATE, DELETE
  table_name TEXT,
  execution_time INTEGER NOT NULL, -- milliseconds
  rows_affected INTEGER DEFAULT 0,
  query_hash TEXT, -- Hash of the query for grouping
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Rate limit tracking
CREATE TABLE IF NOT EXISTS rate_limit_logs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  timestamp DATETIME NOT NULL,
  ip_address TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  requests_count INTEGER NOT NULL DEFAULT 1,
  window_start DATETIME NOT NULL,
  window_end DATETIME NOT NULL,
  blocked BOOLEAN NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- System health metrics
CREATE TABLE IF NOT EXISTS system_health_metrics (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  timestamp DATETIME NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value REAL NOT NULL,
  unit TEXT,
  tags TEXT, -- JSON object
  environment TEXT NOT NULL DEFAULT 'development',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_error_logs_level ON error_logs(level);
CREATE INDEX IF NOT EXISTS idx_error_logs_environment ON error_logs(environment);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_security_logs_timestamp ON security_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_security_logs_type ON security_logs(type);
CREATE INDEX IF NOT EXISTS idx_security_logs_severity ON security_logs(severity);
CREATE INDEX IF NOT EXISTS idx_security_logs_environment ON security_logs(environment);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON security_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_performance_logs_timestamp ON performance_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_performance_logs_type ON performance_logs(type);
CREATE INDEX IF NOT EXISTS idx_performance_logs_operation ON performance_logs(operation);
CREATE INDEX IF NOT EXISTS idx_performance_logs_duration ON performance_logs(duration);
CREATE INDEX IF NOT EXISTS idx_performance_logs_success ON performance_logs(success);
CREATE INDEX IF NOT EXISTS idx_performance_logs_environment ON performance_logs(environment);

CREATE INDEX IF NOT EXISTS idx_business_logs_timestamp ON business_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_business_logs_type ON business_logs(type);
CREATE INDEX IF NOT EXISTS idx_business_logs_action ON business_logs(action);
CREATE INDEX IF NOT EXISTS idx_business_logs_success ON business_logs(success);
CREATE INDEX IF NOT EXISTS idx_business_logs_environment ON business_logs(environment);

CREATE INDEX IF NOT EXISTS idx_api_request_logs_timestamp ON api_request_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_api_request_logs_method ON api_request_logs(method);
CREATE INDEX IF NOT EXISTS idx_api_request_logs_path ON api_request_logs(path);
CREATE INDEX IF NOT EXISTS idx_api_request_logs_status_code ON api_request_logs(status_code);
CREATE INDEX IF NOT EXISTS idx_api_request_logs_user_id ON api_request_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_request_logs_ip_address ON api_request_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_api_request_logs_response_time ON api_request_logs(response_time);

CREATE INDEX IF NOT EXISTS idx_db_performance_logs_timestamp ON db_performance_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_db_performance_logs_query_type ON db_performance_logs(query_type);
CREATE INDEX IF NOT EXISTS idx_db_performance_logs_table_name ON db_performance_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_db_performance_logs_execution_time ON db_performance_logs(execution_time);
CREATE INDEX IF NOT EXISTS idx_db_performance_logs_query_hash ON db_performance_logs(query_hash);

CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_timestamp ON rate_limit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_ip_address ON rate_limit_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_endpoint ON rate_limit_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_window_start ON rate_limit_logs(window_start);
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_blocked ON rate_limit_logs(blocked);

CREATE INDEX IF NOT EXISTS idx_system_health_metrics_timestamp ON system_health_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_system_health_metrics_metric_name ON system_health_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_system_health_metrics_environment ON system_health_metrics(environment);

-- Create views for common monitoring queries
CREATE VIEW IF NOT EXISTS error_summary_view AS
SELECT 
  level,
  environment,
  COUNT(*) as error_count,
  date(timestamp) as error_date
FROM error_logs
WHERE timestamp >= datetime('now', '-30 days')
GROUP BY level, environment, date(timestamp)
ORDER BY error_date DESC, error_count DESC;

CREATE VIEW IF NOT EXISTS security_incidents_view AS
SELECT 
  type,
  severity,
  COUNT(*) as incident_count,
  date(timestamp) as incident_date
FROM security_logs
WHERE timestamp >= datetime('now', '-7 days')
GROUP BY type, severity, date(timestamp)
ORDER BY incident_date DESC, incident_count DESC;

CREATE VIEW IF NOT EXISTS performance_summary_view AS
SELECT 
  type,
  operation,
  AVG(duration) as avg_duration,
  MIN(duration) as min_duration,
  MAX(duration) as max_duration,
  COUNT(*) as operation_count,
  SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as success_count,
  date(timestamp) as performance_date
FROM performance_logs
WHERE timestamp >= datetime('now', '-7 days')
GROUP BY type, operation, date(timestamp)
ORDER BY performance_date DESC, avg_duration DESC;

CREATE VIEW IF NOT EXISTS api_performance_view AS
SELECT 
  method,
  path,
  AVG(response_time) as avg_response_time,
  MIN(response_time) as min_response_time,
  MAX(response_time) as max_response_time,
  COUNT(*) as request_count,
  SUM(CASE WHEN status_code >= 200 AND status_code < 300 THEN 1 ELSE 0 END) as success_count,
  SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as error_count,
  date(timestamp) as request_date
FROM api_request_logs
WHERE timestamp >= datetime('now', '-7 days')
GROUP BY method, path, date(timestamp)
ORDER BY request_date DESC, avg_response_time DESC;

CREATE VIEW IF NOT EXISTS business_metrics_view AS
SELECT 
  type,
  action,
  COUNT(*) as total_actions,
  SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_actions,
  SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed_actions,
  ROUND(
    (SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 2
  ) as success_rate,
  date(timestamp) as business_date
FROM business_logs
WHERE timestamp >= datetime('now', '-30 days')
GROUP BY type, action, date(timestamp)
ORDER BY business_date DESC, total_actions DESC;

CREATE VIEW IF NOT EXISTS slow_queries_view AS
SELECT 
  query_type,
  table_name,
  AVG(execution_time) as avg_execution_time,
  MAX(execution_time) as max_execution_time,
  COUNT(*) as query_count,
  date(timestamp) as query_date
FROM db_performance_logs
WHERE timestamp >= datetime('now', '-7 days')
  AND execution_time > 100 -- Queries slower than 100ms
GROUP BY query_type, table_name, date(timestamp)
ORDER BY query_date DESC, avg_execution_time DESC;

CREATE VIEW IF NOT EXISTS rate_limit_violations_view AS
SELECT 
  ip_address,
  endpoint,
  COUNT(*) as violation_count,
  SUM(requests_count) as total_requests,
  date(timestamp) as violation_date
FROM rate_limit_logs
WHERE timestamp >= datetime('now', '-7 days')
  AND blocked = 1
GROUP BY ip_address, endpoint, date(timestamp)
ORDER BY violation_date DESC, violation_count DESC;

-- Create triggers for automatic cleanup of old logs
CREATE TRIGGER IF NOT EXISTS cleanup_old_error_logs
  AFTER INSERT ON error_logs
  FOR EACH ROW
  WHEN (SELECT COUNT(*) FROM error_logs) > 100000
  BEGIN
    DELETE FROM error_logs 
    WHERE created_at < datetime('now', '-90 days');
  END;

CREATE TRIGGER IF NOT EXISTS cleanup_old_performance_logs
  AFTER INSERT ON performance_logs
  FOR EACH ROW
  WHEN (SELECT COUNT(*) FROM performance_logs) > 50000
  BEGIN
    DELETE FROM performance_logs 
    WHERE created_at < datetime('now', '-30 days');
  END;

CREATE TRIGGER IF NOT EXISTS cleanup_old_api_request_logs
  AFTER INSERT ON api_request_logs
  FOR EACH ROW
  WHEN (SELECT COUNT(*) FROM api_request_logs) > 200000
  BEGIN
    DELETE FROM api_request_logs 
    WHERE created_at < datetime('now', '-30 days');
  END;

-- Insert initial system health metrics
INSERT INTO system_health_metrics (timestamp, metric_name, metric_value, unit, environment)
VALUES 
  (datetime('now'), 'database_initialized', 1, 'boolean', 'production'),
  (datetime('now'), 'monitoring_enabled', 1, 'boolean', 'production'),
  (datetime('now'), 'logging_system_version', 1.0, 'version', 'production'); 