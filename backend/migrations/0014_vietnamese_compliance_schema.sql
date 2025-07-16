-- Vietnamese Financial Compliance Schema
-- Fixes: Vietnamese Financial Regulations Violations
-- Implements: Circular 219/2013/TT-BTC compliance, audit trails, financial reporting

-- VAT Rates Configuration
CREATE TABLE IF NOT EXISTS vat_rates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rate_type TEXT NOT NULL CHECK (rate_type IN ('standard', 'reduced', 'exempt', 'zero')),
    rate_percentage DECIMAL(5,2) NOT NULL CHECK (rate_percentage >= 0 AND rate_percentage <= 100),
    description TEXT NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert current Vietnamese VAT rates
INSERT OR IGNORE INTO vat_rates (rate_type, rate_percentage, description, effective_from) VALUES
('standard', 10.00, 'Standard VAT rate for most goods and services', '2009-01-01'),
('reduced', 5.00, 'Reduced VAT rate for essential goods, education, healthcare', '2009-01-01'),
('exempt', 0.00, 'VAT exempt goods and services', '2009-01-01'),
('zero', 0.00, 'Zero-rated exports and specific transactions', '2009-01-01');

-- Product VAT Categories
CREATE TABLE IF NOT EXISTS product_vat_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id TEXT UNIQUE NOT NULL,
    category_name TEXT NOT NULL,
    vat_type TEXT NOT NULL CHECK (vat_type IN ('standard', 'reduced', 'exempt', 'zero')),
    is_essential BOOLEAN DEFAULT FALSE,
    requires_declaration BOOLEAN DEFAULT FALSE,
    description TEXT,
    regulatory_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (vat_type) REFERENCES vat_rates(rate_type)
);

-- Insert default product VAT categories
INSERT OR IGNORE INTO product_vat_categories (category_id, category_name, vat_type, is_essential, requires_declaration, description) VALUES
('food-essential', 'Essential Food Items', 'reduced', TRUE, FALSE, 'Basic food items with reduced VAT'),
('medical', 'Medical Supplies and Pharmaceuticals', 'exempt', TRUE, TRUE, 'Medical supplies exempt from VAT'),
('education', 'Educational Materials', 'reduced', TRUE, FALSE, 'Educational books and materials'),
('general', 'General Merchandise', 'standard', FALSE, FALSE, 'Standard consumer goods'),
('luxury', 'Luxury Goods', 'standard', FALSE, TRUE, 'High-value luxury items');

-- VAT Declarations
CREATE TABLE IF NOT EXISTS vat_declarations (
    id TEXT PRIMARY KEY,
    period TEXT NOT NULL, -- YYYY-MM format
    business_tax_id TEXT NOT NULL,
    total_revenue DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_vat_collected DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_vat_payable DECIMAL(15,2) NOT NULL DEFAULT 0,
    submission_date DATETIME,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    approved_by TEXT,
    approved_at DATETIME,
    rejection_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- VAT Declaration Items
CREATE TABLE IF NOT EXISTS vat_declaration_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    declaration_id TEXT NOT NULL,
    item_code TEXT NOT NULL,
    item_name TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_value DECIMAL(15,2) NOT NULL,
    vat_rate DECIMAL(5,2) NOT NULL,
    vat_amount DECIMAL(15,2) NOT NULL,
    category TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (declaration_id) REFERENCES vat_declarations(id)
);

-- Audit Trail
CREATE TABLE IF NOT EXISTS audit_trail (
    id TEXT PRIMARY KEY,
    transaction_id TEXT,
    timestamp DATETIME NOT NULL,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'void')),
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    changes TEXT, -- JSON of field changes
    ip_address TEXT,
    user_agent TEXT,
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for audit trail queries
CREATE INDEX IF NOT EXISTS idx_audit_trail_entity 
ON audit_trail(entity_type, entity_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_audit_trail_user 
ON audit_trail(user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_audit_trail_timestamp 
ON audit_trail(timestamp DESC);

-- Financial Periods
CREATE TABLE IF NOT EXISTS financial_periods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    period_code TEXT UNIQUE NOT NULL, -- YYYY-MM, YYYY-QX, YYYY
    period_type TEXT NOT NULL CHECK (period_type IN ('monthly', 'quarterly', 'annual')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_closed BOOLEAN DEFAULT FALSE,
    closed_by TEXT,
    closed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Financial Reports Cache
CREATE TABLE IF NOT EXISTS financial_reports_cache (
    id TEXT PRIMARY KEY,
    period_code TEXT NOT NULL,
    report_type TEXT NOT NULL CHECK (report_type IN ('revenue', 'vat', 'profit_loss', 'cash_flow', 'compliance')),
    report_data TEXT NOT NULL, -- JSON data
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    generated_by TEXT,
    
    FOREIGN KEY (period_code) REFERENCES financial_periods(period_code)
);

-- Index for report cache
CREATE INDEX IF NOT EXISTS idx_reports_cache_period_type 
ON financial_reports_cache(period_code, report_type);

-- Business Compliance Information
CREATE TABLE IF NOT EXISTS business_compliance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_name TEXT NOT NULL,
    business_tax_id TEXT UNIQUE NOT NULL,
    business_license_number TEXT,
    business_license_expiry DATE,
    business_license_status TEXT DEFAULT 'valid' CHECK (business_license_status IN ('valid', 'expired', 'renewal-required')),
    tax_registration_status TEXT DEFAULT 'active' CHECK (tax_registration_status IN ('active', 'suspended', 'under-review')),
    vat_registration_date DATE,
    business_address TEXT,
    business_phone TEXT,
    business_email TEXT,
    authorized_representative TEXT,
    accountant_name TEXT,
    accountant_license TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Expense Categories for P&L Reporting
CREATE TABLE IF NOT EXISTS expense_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_code TEXT UNIQUE NOT NULL,
    category_name TEXT NOT NULL,
    category_type TEXT NOT NULL CHECK (category_type IN ('operating', 'staff', 'utilities', 'rent', 'marketing', 'other')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default expense categories
INSERT OR IGNORE INTO expense_categories (category_code, category_name, category_type) VALUES
('STAFF_SALARY', 'Staff Salaries', 'staff'),
('STAFF_BENEFITS', 'Staff Benefits', 'staff'),
('RENT', 'Rent and Lease', 'rent'),
('UTILITIES_ELECTRIC', 'Electricity', 'utilities'),
('UTILITIES_WATER', 'Water', 'utilities'),
('UTILITIES_INTERNET', 'Internet and Phone', 'utilities'),
('MARKETING_ADS', 'Advertising', 'marketing'),
('MARKETING_PROMO', 'Promotions', 'marketing'),
('SUPPLIES', 'Office Supplies', 'operating'),
('MAINTENANCE', 'Equipment Maintenance', 'operating'),
('INSURANCE', 'Insurance', 'other'),
('PROFESSIONAL_SERVICES', 'Professional Services', 'other');

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    expense_date DATE NOT NULL,
    category_code TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    receipt_number TEXT,
    vendor_name TEXT,
    payment_method TEXT,
    approved_by TEXT,
    approved_at DATETIME,
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (category_code) REFERENCES expense_categories(category_code)
);

-- Cash Flow Entries
CREATE TABLE IF NOT EXISTS cash_flow_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_date DATE NOT NULL,
    flow_type TEXT NOT NULL CHECK (flow_type IN ('operating', 'investing', 'financing')),
    entry_category TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    is_inflow BOOLEAN NOT NULL, -- TRUE for cash in, FALSE for cash out
    description TEXT,
    reference_id TEXT, -- Reference to transaction, expense, etc.
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Compliance Checklists
CREATE TABLE IF NOT EXISTS compliance_checklists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    period_code TEXT NOT NULL,
    checklist_type TEXT NOT NULL CHECK (checklist_type IN ('monthly', 'quarterly', 'annual')),
    requirement_code TEXT NOT NULL,
    requirement_description TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_by TEXT,
    completed_at DATETIME,
    notes TEXT,
    due_date DATE,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (period_code) REFERENCES financial_periods(period_code)
);

-- Insert compliance requirements
INSERT OR IGNORE INTO compliance_checklists (period_code, checklist_type, requirement_code, requirement_description, due_date, priority) 
SELECT 
    '2024-01' as period_code,
    'monthly' as checklist_type,
    req.code as requirement_code,
    req.description as requirement_description,
    '2024-02-20' as due_date,
    req.priority as priority
FROM (VALUES 
    ('VAT_DECLARATION', 'Submit monthly VAT declaration', 'high'),
    ('REVENUE_RECONCILIATION', 'Reconcile revenue with bank deposits', 'high'),
    ('EXPENSE_DOCUMENTATION', 'Ensure all expenses have proper receipts', 'medium'),
    ('INVENTORY_COUNT', 'Perform inventory count and reconciliation', 'medium'),
    ('BANK_RECONCILIATION', 'Reconcile bank statements', 'high'),
    ('CASH_COUNT', 'Perform cash count and reconciliation', 'high')
) as req(code, description, priority);

-- Transaction VAT Details (extends existing transactions)
CREATE TABLE IF NOT EXISTS transaction_vat_details (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    pre_tax_amount DECIMAL(10,2) NOT NULL,
    vat_rate DECIMAL(5,2) NOT NULL,
    vat_amount DECIMAL(10,2) NOT NULL,
    post_tax_amount DECIMAL(10,2) NOT NULL,
    vat_type TEXT NOT NULL,
    requires_declaration BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (transaction_id) REFERENCES transactions(id),
    FOREIGN KEY (item_id) REFERENCES transaction_items(id)
);

-- Views for Financial Reporting

-- Monthly Revenue Summary View
CREATE VIEW IF NOT EXISTS monthly_revenue_summary AS
SELECT 
    strftime('%Y-%m', created_at) as period,
    COUNT(*) as transaction_count,
    SUM(total_amount) as total_revenue,
    SUM(CASE WHEN payment_method = 'cash' THEN total_amount ELSE 0 END) as cash_revenue,
    SUM(CASE WHEN payment_method = 'card' THEN total_amount ELSE 0 END) as card_revenue,
    SUM(CASE WHEN payment_method IN ('vnpay', 'momo', 'zalopay') THEN total_amount ELSE 0 END) as digital_revenue,
    AVG(total_amount) as avg_transaction_value
FROM transactions 
WHERE status = 'completed'
GROUP BY strftime('%Y-%m', created_at)
ORDER BY period DESC;

-- VAT Summary View
CREATE VIEW IF NOT EXISTS vat_summary AS
SELECT 
    strftime('%Y-%m', t.created_at) as period,
    tvd.vat_type,
    tvd.vat_rate,
    COUNT(*) as transaction_count,
    SUM(tvd.pre_tax_amount) as total_pre_tax,
    SUM(tvd.vat_amount) as total_vat,
    SUM(tvd.post_tax_amount) as total_post_tax
FROM transactions t
JOIN transaction_vat_details tvd ON t.id = tvd.transaction_id
WHERE t.status = 'completed'
GROUP BY strftime('%Y-%m', t.created_at), tvd.vat_type, tvd.vat_rate
ORDER BY period DESC, tvd.vat_rate DESC;

-- Expense Summary View
CREATE VIEW IF NOT EXISTS expense_summary AS
SELECT 
    strftime('%Y-%m', expense_date) as period,
    ec.category_type,
    ec.category_name,
    COUNT(*) as expense_count,
    SUM(e.amount) as total_amount,
    AVG(e.amount) as avg_amount
FROM expenses e
JOIN expense_categories ec ON e.category_code = ec.category_code
GROUP BY strftime('%Y-%m', expense_date), ec.category_type, ec.category_name
ORDER BY period DESC, total_amount DESC;

-- Compliance Status View
CREATE VIEW IF NOT EXISTS compliance_status AS
SELECT 
    period_code,
    checklist_type,
    COUNT(*) as total_requirements,
    COUNT(CASE WHEN is_completed = 1 THEN 1 END) as completed_requirements,
    ROUND(100.0 * COUNT(CASE WHEN is_completed = 1 THEN 1 END) / COUNT(*), 2) as completion_percentage,
    COUNT(CASE WHEN due_date < date('now') AND is_completed = 0 THEN 1 END) as overdue_requirements
FROM compliance_checklists
GROUP BY period_code, checklist_type
ORDER BY period_code DESC;

-- Audit Trail Summary View
CREATE VIEW IF NOT EXISTS audit_trail_summary AS
SELECT 
    strftime('%Y-%m-%d', timestamp) as audit_date,
    entity_type,
    action,
    COUNT(*) as action_count,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT entity_id) as unique_entities
FROM audit_trail
GROUP BY strftime('%Y-%m-%d', timestamp), entity_type, action
ORDER BY audit_date DESC;

-- Triggers for Automatic VAT Calculation

-- Trigger to calculate VAT when transaction items are inserted
CREATE TRIGGER IF NOT EXISTS calculate_vat_on_transaction_item
AFTER INSERT ON transaction_items
BEGIN
    INSERT INTO transaction_vat_details (
        transaction_id,
        item_id,
        pre_tax_amount,
        vat_rate,
        vat_amount,
        post_tax_amount,
        vat_type,
        requires_declaration
    )
    SELECT 
        NEW.transaction_id,
        NEW.id,
        NEW.price * NEW.quantity as pre_tax_amount,
        COALESCE(vr.rate_percentage, 10) as vat_rate,
        ROUND((NEW.price * NEW.quantity) * COALESCE(vr.rate_percentage, 10) / 100, 2) as vat_amount,
        ROUND((NEW.price * NEW.quantity) * (1 + COALESCE(vr.rate_percentage, 10) / 100), 2) as post_tax_amount,
        COALESCE(pvc.vat_type, 'standard') as vat_type,
        COALESCE(pvc.requires_declaration, 0) as requires_declaration
    FROM products p
    LEFT JOIN product_vat_categories pvc ON p.category_id = pvc.category_id
    LEFT JOIN vat_rates vr ON pvc.vat_type = vr.rate_type AND vr.is_active = 1
    WHERE p.id = NEW.product_id;
END;

-- Trigger to update transaction total with VAT
CREATE TRIGGER IF NOT EXISTS update_transaction_total_with_vat
AFTER INSERT ON transaction_vat_details
BEGIN
    UPDATE transactions 
    SET 
        vat_amount = (
            SELECT SUM(vat_amount) 
            FROM transaction_vat_details 
            WHERE transaction_id = NEW.transaction_id
        ),
        total_amount = (
            SELECT SUM(post_tax_amount) 
            FROM transaction_vat_details 
            WHERE transaction_id = NEW.transaction_id
        )
    WHERE id = NEW.transaction_id;
END;

-- Trigger for audit trail on critical table changes
CREATE TRIGGER IF NOT EXISTS audit_transaction_changes
AFTER UPDATE ON transactions
BEGIN
    INSERT INTO audit_trail (
        id,
        transaction_id,
        timestamp,
        user_id,
        action,
        entity_type,
        entity_id,
        changes
    ) VALUES (
        'audit_' || NEW.id || '_' || strftime('%s', 'now'),
        NEW.id,
        CURRENT_TIMESTAMP,
        'system', -- Would be actual user in real implementation
        'update',
        'transaction',
        NEW.id,
        json_object(
            'old_status', OLD.status,
            'new_status', NEW.status,
            'old_total', OLD.total_amount,
            'new_total', NEW.total_amount
        )
    );
END;

-- Initialize default business compliance record
INSERT OR IGNORE INTO business_compliance (
    business_name,
    business_tax_id,
    business_license_number,
    business_license_expiry,
    vat_registration_date,
    business_address,
    authorized_representative
) VALUES (
    'KhoAugment POS System',
    '0123456789',
    'BL2024001',
    '2025-12-31',
    '2024-01-01',
    'Ho Chi Minh City, Vietnam',
    'System Administrator'
);

-- Create default financial periods for current year
INSERT OR IGNORE INTO financial_periods (period_code, period_type, start_date, end_date)
SELECT 
    '2024-' || CASE WHEN month < 10 THEN '0' || month ELSE month END,
    'monthly',
    '2024-' || CASE WHEN month < 10 THEN '0' || month ELSE month END || '-01',
    date('2024-' || CASE WHEN month < 10 THEN '0' || month ELSE month END || '-01', '+1 month', '-1 day')
FROM (
    SELECT 1 as month UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION 
    SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION 
    SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12
);

-- Create quarterly periods
INSERT OR IGNORE INTO financial_periods (period_code, period_type, start_date, end_date) VALUES
('2024-Q1', 'quarterly', '2024-01-01', '2024-03-31'),
('2024-Q2', 'quarterly', '2024-04-01', '2024-06-30'),
('2024-Q3', 'quarterly', '2024-07-01', '2024-09-30'),
('2024-Q4', 'quarterly', '2024-10-01', '2024-12-31');

-- Create annual period
INSERT OR IGNORE INTO financial_periods (period_code, period_type, start_date, end_date) VALUES
('2024', 'annual', '2024-01-01', '2024-12-31');