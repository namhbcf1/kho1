-- Seed data for KhoAugment POS

-- Insert default admin user (password: admin123)
INSERT INTO users (id, email, password, name, role, active) VALUES 
('admin-001', 'admin@khoaugment.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Quản trị viên', 'admin', 1);

-- Insert sample manager (password: manager123)
INSERT INTO users (id, email, password, name, role, phone, position, active) VALUES 
('manager-001', 'manager@khoaugment.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Nguyễn Văn Quản Lý', 'manager', '0901234567', 'Quản lý cửa hàng', 1);

-- Insert sample cashiers (password: cashier123)
INSERT INTO users (id, email, password, name, role, phone, position, active) VALUES 
('cashier-001', 'cashier1@khoaugment.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Trần Thị Thu Ngân', 'cashier', '0901234568', 'Thu ngân', 1),
('cashier-002', 'cashier2@khoaugment.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Lê Văn Bán Hàng', 'cashier', '0901234569', 'Thu ngân', 1);

-- Insert default business settings
INSERT INTO business_settings (
    id, name, address, phone, email, website, tax_code, currency, timezone, language, tax_rate
) VALUES (
    'default',
    'KhoAugment Store',
    '{"street": "123 Đường ABC", "ward": "Phường XYZ", "district": "Quận 1", "province": "Hồ Chí Minh", "country": "Việt Nam"}',
    '028-1234-5678',
    'info@khoaugment.com',
    'https://khoaugment.com',
    '0123456789',
    'VND',
    'Asia/Ho_Chi_Minh',
    'vi',
    0.1
);

-- Insert sample categories
INSERT INTO categories (id, name, description, active) VALUES 
('cat-001', 'Đồ uống', 'Các loại đồ uống', 1),
('cat-002', 'Thực phẩm', 'Các loại thực phẩm', 1),
('cat-003', 'Điện tử', 'Thiết bị điện tử', 1),
('cat-004', 'Thời trang', 'Quần áo, phụ kiện', 1),
('cat-005', 'Gia dụng', 'Đồ gia dụng', 1);

-- Insert subcategories
INSERT INTO categories (id, name, description, parent_id, active) VALUES 
('cat-001-001', 'Nước ngọt', 'Các loại nước ngọt', 'cat-001', 1),
('cat-001-002', 'Cà phê', 'Cà phê các loại', 'cat-001', 1),
('cat-001-003', 'Trà', 'Trà các loại', 'cat-001', 1),
('cat-002-001', 'Bánh kẹo', 'Bánh kẹo các loại', 'cat-002', 1),
('cat-002-002', 'Mì gói', 'Mì ăn liền', 'cat-002', 1);

-- Insert sample products
INSERT INTO products (id, name, description, price, cost, stock, min_stock, barcode, sku, category_id, active) VALUES 
('prod-001', 'Coca Cola 330ml', 'Nước ngọt Coca Cola lon 330ml', 15000, 12000, 100, 10, '8934673123456', 'COCA-330', 'cat-001-001', 1),
('prod-002', 'Pepsi 330ml', 'Nước ngọt Pepsi lon 330ml', 15000, 12000, 80, 10, '8934673123457', 'PEPSI-330', 'cat-001-001', 1),
('prod-003', 'Cà phê G7 3in1', 'Cà phê hòa tan G7 3in1 hộp 21 gói', 45000, 38000, 50, 5, '8934673123458', 'G7-3IN1-21', 'cat-001-002', 1),
('prod-004', 'Mì Hảo Hảo tôm chua cay', 'Mì ăn liền Hảo Hảo vị tôm chua cay', 4500, 3800, 200, 20, '8934673123459', 'HAOHAO-TCC', 'cat-002-002', 1),
('prod-005', 'Bánh Oreo', 'Bánh quy Oreo gói 137g', 25000, 20000, 60, 10, '8934673123460', 'OREO-137', 'cat-002-001', 1),
('prod-006', 'Nước suối Lavie 500ml', 'Nước suối Lavie chai 500ml', 8000, 6000, 150, 20, '8934673123461', 'LAVIE-500', 'cat-001', 1),
('prod-007', 'Trà xanh C2 455ml', 'Trà xanh C2 chai 455ml', 12000, 9500, 90, 15, '8934673123462', 'C2-455', 'cat-001-003', 1),
('prod-008', 'Bánh mì sandwich', 'Bánh mì sandwich thịt nguội', 35000, 25000, 30, 5, '8934673123463', 'SANDWICH-001', 'cat-002', 1),
('prod-009', 'Kẹo Mentos', 'Kẹo Mentos vị bạc hà', 8000, 6500, 120, 15, '8934673123464', 'MENTOS-MINT', 'cat-002-001', 1),
('prod-010', 'Nước tăng lực Red Bull', 'Nước tăng lực Red Bull lon 250ml', 18000, 15000, 70, 10, '8934673123465', 'REDBULL-250', 'cat-001', 1);

-- Insert sample customers
INSERT INTO customers (id, name, email, phone, address, loyalty_points, total_spent, active) VALUES 
('cust-001', 'Nguyễn Văn A', 'nguyenvana@email.com', '0987654321', '{"street": "456 Đường DEF", "ward": "Phường ABC", "district": "Quận 3", "province": "Hồ Chí Minh"}', 150, 500000, 1),
('cust-002', 'Trần Thị B', 'tranthib@email.com', '0987654322', '{"street": "789 Đường GHI", "ward": "Phường DEF", "district": "Quận 5", "province": "Hồ Chí Minh"}', 200, 750000, 1),
('cust-003', 'Lê Văn C', 'levanc@email.com', '0987654323', '{"street": "321 Đường JKL", "ward": "Phường GHI", "district": "Quận 7", "province": "Hồ Chí Minh"}', 80, 300000, 1);

-- Insert sample orders
INSERT INTO orders (id, order_number, customer_id, cashier_id, subtotal, tax, total, payment_method, payment_status, status) VALUES 
('order-001', 'ORD-20241201-001', 'cust-001', 'cashier-001', 50000, 5000, 55000, 'cash', 'paid', 'completed'),
('order-002', 'ORD-20241201-002', 'cust-002', 'cashier-001', 75000, 7500, 82500, 'vnpay', 'paid', 'completed'),
('order-003', 'ORD-20241201-003', NULL, 'cashier-002', 30000, 3000, 33000, 'cash', 'paid', 'completed');

-- Insert sample order items
INSERT INTO order_items (id, order_id, product_id, name, price, quantity, total) VALUES 
('item-001', 'order-001', 'prod-001', 'Coca Cola 330ml', 15000, 2, 30000),
('item-002', 'order-001', 'prod-004', 'Mì Hảo Hảo tôm chua cay', 4500, 4, 18000),
('item-003', 'order-001', 'prod-009', 'Kẹo Mentos', 8000, 1, 8000),
('item-004', 'order-002', 'prod-003', 'Cà phê G7 3in1', 45000, 1, 45000),
('item-005', 'order-002', 'prod-005', 'Bánh Oreo', 25000, 1, 25000),
('item-006', 'order-002', 'prod-006', 'Nước suối Lavie 500ml', 8000, 1, 8000),
('item-007', 'order-003', 'prod-002', 'Pepsi 330ml', 15000, 2, 30000);

-- Insert sample payments
INSERT INTO payments (id, order_id, method, amount, status, transaction_id) VALUES 
('pay-001', 'order-001', 'cash', 55000, 'paid', NULL),
('pay-002', 'order-002', 'vnpay', 82500, 'paid', 'VNP-20241201-001'),
('pay-003', 'order-003', 'cash', 33000, 'paid', NULL);

-- Insert sample inventory transactions
INSERT INTO inventory_transactions (id, product_id, type, quantity, reason, reference_id, user_id) VALUES 
('inv-001', 'prod-001', 'out', -2, 'Sale', 'order-001', 'cashier-001'),
('inv-002', 'prod-004', 'out', -4, 'Sale', 'order-001', 'cashier-001'),
('inv-003', 'prod-009', 'out', -1, 'Sale', 'order-001', 'cashier-001'),
('inv-004', 'prod-003', 'out', -1, 'Sale', 'order-002', 'cashier-001'),
('inv-005', 'prod-005', 'out', -1, 'Sale', 'order-002', 'cashier-001'),
('inv-006', 'prod-006', 'out', -1, 'Sale', 'order-002', 'cashier-001'),
('inv-007', 'prod-002', 'out', -2, 'Sale', 'order-003', 'cashier-002');
