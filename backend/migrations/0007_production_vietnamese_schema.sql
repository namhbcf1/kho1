-- Production Vietnamese Business Schema for KhoAugment POS
-- Complies with Vietnamese tax law and business regulations
-- Real production schema for live deployment

-- Vietnamese provinces, districts, and wards for address validation
CREATE TABLE provinces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    division_type TEXT NOT NULL,
    region TEXT NOT NULL,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE districts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    province_id TEXT NOT NULL,
    division_type TEXT NOT NULL,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (province_id) REFERENCES provinces(id)
);

CREATE TABLE wards (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    district_id TEXT NOT NULL,
    division_type TEXT NOT NULL,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (district_id) REFERENCES districts(id)
);

-- Enhanced customers table with Vietnamese compliance
ALTER TABLE customers ADD COLUMN citizen_id TEXT;
ALTER TABLE customers ADD COLUMN province_id TEXT;
ALTER TABLE customers ADD COLUMN district_id TEXT;
ALTER TABLE customers ADD COLUMN ward_id TEXT;
ALTER TABLE customers ADD COLUMN detailed_address TEXT;
ALTER TABLE customers ADD COLUMN loyalty_tier TEXT DEFAULT 'bronze' CHECK (loyalty_tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond'));
ALTER TABLE customers ADD COLUMN tier_points INTEGER DEFAULT 0;
ALTER TABLE customers ADD COLUMN tier_updated_at DATETIME;
ALTER TABLE customers ADD COLUMN tax_code TEXT;
ALTER TABLE customers ADD COLUMN company_name TEXT;
ALTER TABLE customers ADD COLUMN company_address TEXT;

-- Customer loyalty tiers configuration
CREATE TABLE loyalty_tiers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    min_points INTEGER NOT NULL,
    max_points INTEGER,
    discount_percentage REAL DEFAULT 0,
    point_multiplier REAL DEFAULT 1.0,
    benefits TEXT, -- JSON array of benefits
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Loyalty points transactions
CREATE TABLE loyalty_transactions (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    order_id TEXT,
    type TEXT NOT NULL CHECK (type IN ('earn', 'redeem', 'adjustment', 'expire')),
    points INTEGER NOT NULL,
    description TEXT,
    reference_id TEXT,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- Vietnamese VAT and tax configuration
CREATE TABLE tax_rates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    rate REAL NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('vat', 'excise', 'import', 'special')),
    category TEXT,
    effective_from DATE NOT NULL,
    effective_to DATE,
    description TEXT,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Product tax mappings
CREATE TABLE product_taxes (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    tax_rate_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (tax_rate_id) REFERENCES tax_rates(id)
);

-- Enhanced orders table for Vietnamese compliance
ALTER TABLE orders ADD COLUMN invoice_number TEXT UNIQUE;
ALTER TABLE orders ADD COLUMN invoice_date DATETIME;
ALTER TABLE orders ADD COLUMN vat_amount REAL DEFAULT 0;
ALTER TABLE orders ADD COLUMN excise_amount REAL DEFAULT 0;
ALTER TABLE orders ADD COLUMN total_before_tax REAL;
ALTER TABLE orders ADD COLUMN buyer_name TEXT;
ALTER TABLE orders ADD COLUMN buyer_tax_code TEXT;
ALTER TABLE orders ADD COLUMN buyer_address TEXT;
ALTER TABLE orders ADD COLUMN invoice_type TEXT DEFAULT 'retail' CHECK (invoice_type IN ('retail', 'wholesale', 'export'));
ALTER TABLE orders ADD COLUMN loyalty_points_earned INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN loyalty_points_redeemed INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN province_id TEXT;
ALTER TABLE orders ADD COLUMN district_id TEXT;
ALTER TABLE orders ADD COLUMN ward_id TEXT;

-- Payment gateway configurations
CREATE TABLE payment_gateways (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('vnpay', 'momo', 'zalopay', 'banking')),
    merchant_id TEXT NOT NULL,
    api_key TEXT NOT NULL,
    secret_key TEXT NOT NULL,
    endpoint_url TEXT NOT NULL,
    return_url TEXT,
    notify_url TEXT,
    sandbox_mode INTEGER DEFAULT 1,
    active INTEGER DEFAULT 1,
    config TEXT, -- JSON configuration
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced payments table with Vietnamese gateway support
ALTER TABLE payments ADD COLUMN gateway_id TEXT;
ALTER TABLE payments ADD COLUMN gateway_order_id TEXT;
ALTER TABLE payments ADD COLUMN gateway_transaction_id TEXT;
ALTER TABLE payments ADD COLUMN gateway_fee REAL DEFAULT 0;
ALTER TABLE payments ADD COLUMN exchange_rate REAL DEFAULT 1.0;
ALTER TABLE payments ADD COLUMN original_amount REAL;
ALTER TABLE payments ADD COLUMN original_currency TEXT DEFAULT 'VND';
ALTER TABLE payments ADD COLUMN callback_data TEXT; -- JSON
ALTER TABLE payments ADD COLUMN webhook_received INTEGER DEFAULT 0;
ALTER TABLE payments ADD COLUMN reconciled INTEGER DEFAULT 0;
ALTER TABLE payments ADD COLUMN reconciled_at DATETIME;

-- VNPay specific transactions
CREATE TABLE vnpay_transactions (
    id TEXT PRIMARY KEY,
    payment_id TEXT NOT NULL,
    vnp_TmnCode TEXT NOT NULL,
    vnp_Amount INTEGER NOT NULL,
    vnp_Command TEXT NOT NULL,
    vnp_CreateDate TEXT NOT NULL,
    vnp_CurrCode TEXT DEFAULT 'VND',
    vnp_IpAddr TEXT,
    vnp_Locale TEXT DEFAULT 'vn',
    vnp_OrderInfo TEXT NOT NULL,
    vnp_OrderType TEXT NOT NULL,
    vnp_ReturnUrl TEXT NOT NULL,
    vnp_TxnRef TEXT NOT NULL,
    vnp_Version TEXT NOT NULL,
    vnp_SecureHash TEXT,
    vnp_ResponseCode TEXT,
    vnp_TransactionNo TEXT,
    vnp_BankCode TEXT,
    vnp_BankTranNo TEXT,
    vnp_CardType TEXT,
    vnp_PayDate TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payment_id) REFERENCES payments(id)
);

-- MoMo specific transactions
CREATE TABLE momo_transactions (
    id TEXT PRIMARY KEY,
    payment_id TEXT NOT NULL,
    partner_code TEXT NOT NULL,
    order_id TEXT NOT NULL,
    request_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    order_info TEXT NOT NULL,
    redirect_url TEXT NOT NULL,
    ipn_url TEXT NOT NULL,
    lang TEXT DEFAULT 'vi',
    extra_data TEXT,
    request_type TEXT NOT NULL,
    signature TEXT,
    qr_code_url TEXT,
    deeplink TEXT,
    response_time INTEGER,
    result_code INTEGER,
    message TEXT,
    pay_url TEXT,
    trans_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payment_id) REFERENCES payments(id)
);

-- ZaloPay specific transactions
CREATE TABLE zalopay_transactions (
    id TEXT PRIMARY KEY,
    payment_id TEXT NOT NULL,
    app_id INTEGER NOT NULL,
    app_trans_id TEXT NOT NULL,
    app_user TEXT NOT NULL,
    app_time INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    description TEXT NOT NULL,
    bank_code TEXT,
    callback_url TEXT NOT NULL,
    embed_data TEXT,
    mac TEXT,
    return_code INTEGER,
    return_message TEXT,
    sub_return_code INTEGER,
    sub_return_message TEXT,
    zp_trans_id TEXT,
    order_url TEXT,
    qr_code TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payment_id) REFERENCES payments(id)
);

-- Staff management with Vietnamese labor law compliance
CREATE TABLE staff_shifts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    break_duration INTEGER DEFAULT 0, -- minutes
    overtime_hours REAL DEFAULT 0,
    hourly_rate REAL NOT NULL,
    overtime_rate REAL,
    total_sales REAL DEFAULT 0,
    commission_rate REAL DEFAULT 0,
    commission_amount REAL DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'break', 'completed')),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Commission tracking
CREATE TABLE staff_commissions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    order_id TEXT NOT NULL,
    shift_id TEXT,
    commission_rate REAL NOT NULL,
    commission_amount REAL NOT NULL,
    paid INTEGER DEFAULT 0,
    paid_at DATETIME,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (shift_id) REFERENCES staff_shifts(id)
);

-- Offline transaction queue for sync
CREATE TABLE offline_transactions (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('order', 'payment', 'inventory', 'customer')),
    data TEXT NOT NULL, -- JSON data
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    synced INTEGER DEFAULT 0,
    synced_at DATETIME,
    retry_count INTEGER DEFAULT 0,
    last_error TEXT
);

-- Backup and audit logs
CREATE TABLE audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    old_values TEXT, -- JSON
    new_values TEXT, -- JSON
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- System settings for Vietnamese business
CREATE TABLE system_settings (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    key TEXT NOT NULL,
    value TEXT,
    data_type TEXT DEFAULT 'string' CHECK (data_type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    editable INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category, key)
);

-- Receipt templates for Vietnamese compliance
CREATE TABLE receipt_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('sale', 'refund', 'exchange')),
    template TEXT NOT NULL, -- HTML template
    paper_size TEXT DEFAULT '80mm',
    default_template INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Product variants and options
CREATE TABLE product_variants (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    name TEXT NOT NULL,
    sku TEXT UNIQUE,
    barcode TEXT UNIQUE,
    price REAL,
    cost REAL,
    stock INTEGER DEFAULT 0,
    weight REAL,
    dimensions TEXT, -- JSON: width, height, depth
    attributes TEXT, -- JSON: color, size, etc.
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Suppliers for inventory management
CREATE TABLE suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    tax_code TEXT,
    bank_account TEXT,
    payment_terms INTEGER DEFAULT 30,
    credit_limit REAL DEFAULT 0,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Purchase orders
CREATE TABLE purchase_orders (
    id TEXT PRIMARY KEY,
    po_number TEXT UNIQUE NOT NULL,
    supplier_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'received', 'cancelled')),
    subtotal REAL NOT NULL,
    tax_amount REAL DEFAULT 0,
    total REAL NOT NULL,
    notes TEXT,
    expected_delivery DATE,
    received_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Purchase order items
CREATE TABLE purchase_order_items (
    id TEXT PRIMARY KEY,
    po_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_cost REAL NOT NULL,
    total_cost REAL NOT NULL,
    received_quantity INTEGER DEFAULT 0,
    FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Create comprehensive indexes for production performance
CREATE INDEX idx_provinces_code ON provinces(code);
CREATE INDEX idx_districts_province ON districts(province_id);
CREATE INDEX idx_wards_district ON wards(district_id);
CREATE INDEX idx_customers_citizen_id ON customers(citizen_id);
CREATE INDEX idx_customers_loyalty_tier ON customers(loyalty_tier);
CREATE INDEX idx_loyalty_transactions_customer ON loyalty_transactions(customer_id);
CREATE INDEX idx_loyalty_transactions_order ON loyalty_transactions(order_id);
CREATE INDEX idx_tax_rates_type ON tax_rates(type);
CREATE INDEX idx_tax_rates_effective ON tax_rates(effective_from, effective_to);
CREATE INDEX idx_product_taxes_product ON product_taxes(product_id);
CREATE INDEX idx_orders_invoice_number ON orders(invoice_number);
CREATE INDEX idx_orders_province ON orders(province_id);
CREATE INDEX idx_payment_gateways_type ON payment_gateways(type);
CREATE INDEX idx_payments_gateway ON payments(gateway_id);
CREATE INDEX idx_vnpay_payment ON vnpay_transactions(payment_id);
CREATE INDEX idx_momo_payment ON momo_transactions(payment_id);
CREATE INDEX idx_zalopay_payment ON zalopay_transactions(payment_id);
CREATE INDEX idx_staff_shifts_user ON staff_shifts(user_id);
CREATE INDEX idx_staff_shifts_date ON staff_shifts(start_time);
CREATE INDEX idx_commissions_user ON staff_commissions(user_id);
CREATE INDEX idx_commissions_period ON staff_commissions(period_start, period_end);
CREATE INDEX idx_offline_synced ON offline_transactions(synced, created_at);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX idx_system_settings_category ON system_settings(category);
CREATE INDEX idx_product_variants_product ON product_variants(product_id);
CREATE INDEX idx_product_variants_barcode ON product_variants(barcode);
CREATE INDEX idx_suppliers_tax_code ON suppliers(tax_code);
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_po_items_po ON purchase_order_items(po_id);

-- Insert Vietnamese standard tax rates
INSERT INTO tax_rates (id, name, rate, type, effective_from, description, active) VALUES
('vat_standard', 'VAT Standard Rate', 0.10, 'vat', '2024-01-01', 'Standard VAT rate 10% for most goods and services', 1),
('vat_reduced', 'VAT Reduced Rate', 0.05, 'vat', '2024-01-01', 'Reduced VAT rate 5% for essential goods', 1),
('vat_zero', 'VAT Zero Rate', 0.00, 'vat', '2024-01-01', 'Zero VAT rate for exports and specific goods', 1),
('excise_alcohol', 'Excise Tax - Alcohol', 0.65, 'excise', '2024-01-01', 'Excise tax on alcoholic beverages', 1),
('excise_tobacco', 'Excise Tax - Tobacco', 0.75, 'excise', '2024-01-01', 'Excise tax on tobacco products', 1);

-- Insert default loyalty tiers
INSERT INTO loyalty_tiers (id, name, min_points, max_points, discount_percentage, point_multiplier, benefits, active) VALUES
('bronze', 'Bronze', 0, 999, 0, 1.0, '["Standard customer service", "Basic promotions"]', 1),
('silver', 'Silver', 1000, 2999, 2, 1.2, '["Priority customer service", "Exclusive promotions", "Birthday discounts"]', 1),
('gold', 'Gold', 3000, 9999, 5, 1.5, '["Premium customer service", "VIP promotions", "Free shipping", "Extended warranty"]', 1),
('platinum', 'Platinum', 10000, 24999, 8, 1.8, '["Dedicated account manager", "Early access to sales", "Free gift wrapping", "Special events"]', 1),
('diamond', 'Diamond', 25000, NULL, 12, 2.0, '["White-glove service", "Personal shopping assistant", "Complimentary services", "Exclusive products"]', 1);

-- Insert default system settings
INSERT INTO system_settings (id, category, key, value, data_type, description) VALUES
('business_name', 'business', 'name', 'KhoAugment POS', 'string', 'Business name'),
('business_tax_code', 'business', 'tax_code', '', 'string', 'Business tax identification code'),
('default_currency', 'business', 'currency', 'VND', 'string', 'Default currency code'),
('default_timezone', 'business', 'timezone', 'Asia/Ho_Chi_Minh', 'string', 'Default timezone'),
('default_language', 'business', 'language', 'vi', 'string', 'Default language'),
('vat_enabled', 'tax', 'vat_enabled', 'true', 'boolean', 'Enable VAT calculation'),
('default_vat_rate', 'tax', 'default_vat_rate', '0.10', 'number', 'Default VAT rate'),
('loyalty_enabled', 'loyalty', 'enabled', 'true', 'boolean', 'Enable loyalty program'),
('points_per_vnd', 'loyalty', 'points_per_vnd', '0.01', 'number', 'Points earned per VND spent'),
('offline_sync_interval', 'system', 'offline_sync_interval', '300', 'number', 'Offline sync interval in seconds'),
('receipt_logo', 'receipt', 'logo_url', '', 'string', 'Receipt logo URL'),
('receipt_footer', 'receipt', 'footer_text', 'Cảm ơn quý khách đã mua hàng!', 'string', 'Receipt footer text');

-- Insert default receipt template
INSERT INTO receipt_templates (id, name, type, template, paper_size, default_template, active) VALUES
('default_sale', 'Default Sale Receipt', 'sale', 
'<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: monospace; width: 300px; margin: 0; }
        .header { text-align: center; margin-bottom: 10px; }
        .line { border-bottom: 1px dashed #000; margin: 5px 0; }
        .total { font-weight: bold; }
        .footer { text-align: center; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h3>{{business_name}}</h3>
        <p>{{business_address}}</p>
        <p>Điện thoại: {{business_phone}}</p>
        <p>MST: {{business_tax_code}}</p>
    </div>
    <div class="line"></div>
    <p>Hóa đơn: {{invoice_number}}</p>
    <p>Ngày: {{invoice_date}}</p>
    <p>Thu ngân: {{cashier_name}}</p>
    <div class="line"></div>
    {{#items}}
    <p>{{name}} x{{quantity}}</p>
    <p style="text-align: right;">{{total}} đ</p>
    {{/items}}
    <div class="line"></div>
    <p>Tạm tính: {{subtotal}} đ</p>
    <p>VAT ({{vat_rate}}%): {{vat_amount}} đ</p>
    <p class="total">Tổng cộng: {{total}} đ</p>
    <p>Tiền mặt: {{cash_amount}} đ</p>
    <p>Tiền thối: {{change_amount}} đ</p>
    <div class="line"></div>
    <div class="footer">
        <p>{{footer_text}}</p>
        <p>Xin chân thành cảm ơn!</p>
    </div>
</body>
</html>', '80mm', 1, 1);