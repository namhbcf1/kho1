// Comprehensive Order and Customer Management tests
import { test, expect } from '@playwright/test';

const ADMIN_CREDENTIALS = {
  email: 'admin@khoaugment.com',
  password: 'KhoAdmin2024!'
};

const STAFF_CREDENTIALS = {
  email: 'staff@khoaugment.com',
  password: 'KhoStaff2024!'
};

test.describe('Customer Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('https://kho1.pages.dev/auth/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', ADMIN_CREDENTIALS.email);
    await page.fill('input[type="password"]', ADMIN_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Navigate to customers page
    await page.goto('https://kho1.pages.dev/customers');
    await page.waitForLoadState('networkidle');
  });

  test('Customer list loads correctly', async ({ page }) => {
    console.log('Testing customer list loading...');
    
    // Verify customer list elements
    await expect(page.locator('[data-testid="customers-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="add-customer-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="search-customers"]')).toBeVisible();
    
    await page.screenshot({ path: 'test-results/customer-list.png', fullPage: true });
  });

  test('Add new customer', async ({ page }) => {
    console.log('Testing add new customer...');
    
    // Click add customer button
    await page.click('[data-testid="add-customer-btn"]');
    
    // Fill customer form
    await page.fill('[data-testid="customer-name"]', 'Nguyễn Văn Test');
    await page.fill('[data-testid="customer-phone"]', '0901234567');
    await page.fill('[data-testid="customer-email"]', 'test@example.com');
    await page.fill('[data-testid="customer-address"]', '123 Đường Test, Quận 1, TP.HCM');
    await page.selectOption('[data-testid="customer-gender"]', 'male');
    await page.fill('[data-testid="customer-birthday"]', '1990-01-15');
    
    // Save customer
    await page.click('[data-testid="save-customer"]');
    
    // Verify success message
    await expect(page.locator('.ant-message-success')).toBeVisible();
    await expect(page.locator('text=Khách hàng đã được thêm thành công')).toBeVisible();
    
    // Verify customer appears in list
    await expect(page.locator('text=Nguyễn Văn Test')).toBeVisible();
    
    await page.screenshot({ path: 'test-results/customer-added.png' });
  });

  test('Edit customer information', async ({ page }) => {
    console.log('Testing edit customer...');
    
    // Click edit on first customer
    await page.click('[data-testid="edit-customer"]').first();
    
    // Modify customer details
    await page.fill('[data-testid="customer-name"]', 'Nguyễn Văn Test (Updated)');
    await page.fill('[data-testid="customer-phone"]', '0907654321');
    
    // Save changes
    await page.click('[data-testid="save-customer"]');
    
    // Verify success
    await expect(page.locator('.ant-message-success')).toBeVisible();
    await expect(page.locator('text=Nguyễn Văn Test (Updated)')).toBeVisible();
    
    await page.screenshot({ path: 'test-results/customer-edited.png' });
  });

  test('Customer search functionality', async ({ page }) => {
    console.log('Testing customer search...');
    
    // Search by phone number
    await page.fill('[data-testid="search-customers"]', '0901234567');
    await page.keyboard.press('Enter');
    
    // Wait for search results
    await page.waitForLoadState('networkidle');
    
    // Verify search results
    await expect(page.locator('[data-testid="customer-row"]')).toHaveCount({ min: 1 });
    
    // Search by name
    await page.fill('[data-testid="search-customers"]', 'Nguyễn');
    await page.keyboard.press('Enter');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/customer-search.png' });
  });

  test('Customer loyalty program', async ({ page }) => {
    console.log('Testing loyalty program...');
    
    // Click on customer details
    await page.click('[data-testid="view-customer"]').first();
    
    // Verify loyalty points section
    await expect(page.locator('[data-testid="loyalty-points"]')).toBeVisible();
    await expect(page.locator('[data-testid="loyalty-level"]')).toBeVisible();
    
    // Add loyalty points manually
    await page.click('[data-testid="add-points"]');
    await page.fill('[data-testid="points-amount"]', '100');
    await page.fill('[data-testid="points-reason"]', 'Khuyến mãi đặc biệt');
    await page.click('[data-testid="save-points"]');
    
    // Verify points added
    await expect(page.locator('.ant-message-success')).toBeVisible();
    
    await page.screenshot({ path: 'test-results/loyalty-program.png' });
  });

  test('Customer purchase history', async ({ page }) => {
    console.log('Testing purchase history...');
    
    // View customer details
    await page.click('[data-testid="view-customer"]').first();
    
    // Navigate to purchase history tab
    await page.click('[data-testid="purchase-history-tab"]');
    
    // Verify purchase history table
    await expect(page.locator('[data-testid="purchase-history-table"]')).toBeVisible();
    
    // Check if any orders exist
    const orderRows = page.locator('[data-testid="order-row"]');
    const orderCount = await orderRows.count();
    
    if (orderCount > 0) {
      // View order details
      await page.click('[data-testid="view-order"]').first();
      await expect(page.locator('[data-testid="order-details"]')).toBeVisible();
    }
    
    await page.screenshot({ path: 'test-results/purchase-history.png' });
  });

  test('Customer export functionality', async ({ page }) => {
    console.log('Testing customer export...');
    
    // Click export button
    await page.click('[data-testid="export-customers"]');
    
    // Select export options
    await page.check('[data-testid="include-loyalty"]');
    await page.check('[data-testid="include-purchases"]');
    
    // Start export
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="start-export"]');
    
    // Verify download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('customers');
    
    await page.screenshot({ path: 'test-results/customer-export.png' });
  });
});

test.describe('Order Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as staff
    await page.goto('https://kho1.pages.dev/auth/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', STAFF_CREDENTIALS.email);
    await page.fill('input[type="password"]', STAFF_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Navigate to orders page
    await page.goto('https://kho1.pages.dev/orders');
    await page.waitForLoadState('networkidle');
  });

  test('Order list loads correctly', async ({ page }) => {
    console.log('Testing order list loading...');
    
    // Verify order list elements
    await expect(page.locator('[data-testid="orders-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-filters"]')).toBeVisible();
    await expect(page.locator('[data-testid="search-orders"]')).toBeVisible();
    
    await page.screenshot({ path: 'test-results/order-list.png', fullPage: true });
  });

  test('Filter orders by status', async ({ page }) => {
    console.log('Testing order status filter...');
    
    // Filter by pending orders
    await page.selectOption('[data-testid="status-filter"]', 'pending');
    await page.waitForLoadState('networkidle');
    
    // Verify filtered results
    const statusCells = page.locator('[data-testid="order-status"]');
    const count = await statusCells.count();
    
    if (count > 0) {
      await expect(statusCells.first()).toContainText('Đang xử lý');
    }
    
    // Filter by completed orders
    await page.selectOption('[data-testid="status-filter"]', 'completed');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/order-filter.png' });
  });

  test('Filter orders by date range', async ({ page }) => {
    console.log('Testing date range filter...');
    
    // Open date picker
    await page.click('[data-testid="date-range-picker"]');
    
    // Select today
    await page.click('text=Hôm nay');
    
    // Wait for filter to apply
    await page.waitForLoadState('networkidle');
    
    // Verify orders are from today
    const orderDates = page.locator('[data-testid="order-date"]');
    const count = await orderDates.count();
    
    if (count > 0) {
      const today = new Date().toLocaleDateString('vi-VN');
      await expect(orderDates.first()).toContainText(today);
    }
    
    await page.screenshot({ path: 'test-results/date-filter.png' });
  });

  test('View order details', async ({ page }) => {
    console.log('Testing order details view...');
    
    // Click on first order
    await page.click('[data-testid="view-order"]').first();
    
    // Verify order details modal/page
    await expect(page.locator('[data-testid="order-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-items"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-customer"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-payment"]')).toBeVisible();
    
    await page.screenshot({ path: 'test-results/order-details.png' });
  });

  test('Update order status', async ({ page }) => {
    console.log('Testing order status update...');
    
    // Find pending order and update status
    await page.click('[data-testid="update-status"]').first();
    
    // Select new status
    await page.selectOption('[data-testid="new-status"]', 'processing');
    await page.fill('[data-testid="status-note"]', 'Đang chuẩn bị hàng');
    
    // Save status update
    await page.click('[data-testid="save-status"]');
    
    // Verify success
    await expect(page.locator('.ant-message-success')).toBeVisible();
    
    await page.screenshot({ path: 'test-results/status-updated.png' });
  });

  test('Process refund', async ({ page }) => {
    console.log('Testing refund process...');
    
    // Find completed order and process refund
    await page.click('[data-testid="process-refund"]').first();
    
    // Select refund items
    await page.check('[data-testid="refund-item"]').first();
    
    // Enter refund reason
    await page.fill('[data-testid="refund-reason"]', 'Sản phẩm bị lỗi');
    await page.selectOption('[data-testid="refund-method"]', 'cash');
    
    // Process refund
    await page.click('[data-testid="confirm-refund"]');
    
    // Verify refund processed
    await expect(page.locator('.ant-message-success')).toBeVisible();
    await expect(page.locator('text=Hoàn tiền thành công')).toBeVisible();
    
    await page.screenshot({ path: 'test-results/refund-processed.png' });
  });

  test('Print order invoice', async ({ page }) => {
    console.log('Testing invoice printing...');
    
    // View order details
    await page.click('[data-testid="view-order"]').first();
    
    // Print invoice
    await page.click('[data-testid="print-invoice"]');
    
    // Verify print preview or download
    await expect(page.locator('[data-testid="invoice-preview"]')).toBeVisible();
    
    await page.screenshot({ path: 'test-results/invoice-print.png' });
  });

  test('Order search functionality', async ({ page }) => {
    console.log('Testing order search...');
    
    // Search by order number
    await page.fill('[data-testid="search-orders"]', 'ORD');
    await page.keyboard.press('Enter');
    await page.waitForLoadState('networkidle');
    
    // Verify search results
    const orderRows = page.locator('[data-testid="order-row"]');
    await expect(orderRows).toHaveCount({ min: 1 });
    
    // Search by customer name
    await page.fill('[data-testid="search-orders"]', 'Nguyễn');
    await page.keyboard.press('Enter');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/order-search.png' });
  });

  test('Bulk order operations', async ({ page }) => {
    console.log('Testing bulk order operations...');
    
    // Select multiple orders
    await page.check('[data-testid="select-order"]').first();
    await page.check('[data-testid="select-order"]').nth(1);
    
    // Perform bulk status update
    await page.click('[data-testid="bulk-actions"]');
    await page.click('text=Cập nhật trạng thái hàng loạt');
    
    await page.selectOption('[data-testid="bulk-status"]', 'processing');
    await page.click('[data-testid="apply-bulk-update"]');
    
    // Verify success
    await expect(page.locator('.ant-message-success')).toBeVisible();
    
    await page.screenshot({ path: 'test-results/bulk-operations.png' });
  });

  test('Order analytics and reports', async ({ page }) => {
    console.log('Testing order analytics...');
    
    // Navigate to order analytics
    await page.click('[data-testid="order-analytics"]');
    
    // Verify analytics elements
    await expect(page.locator('[data-testid="total-orders"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-revenue"]')).toBeVisible();
    await expect(page.locator('[data-testid="average-order-value"]')).toBeVisible();
    
    // Generate detailed report
    await page.click('[data-testid="generate-report"]');
    await page.selectOption('[data-testid="report-period"]', 'month');
    await page.click('[data-testid="create-report"]');
    
    // Verify report generated
    await expect(page.locator('[data-testid="report-chart"]')).toBeVisible();
    
    await page.screenshot({ path: 'test-results/order-analytics.png', fullPage: true });
  });
});

test.describe('Payment Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to payment settings
    await page.goto('https://kho1.pages.dev/auth/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', ADMIN_CREDENTIALS.email);
    await page.fill('input[type="password"]', ADMIN_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
  });

  test('VNPay integration test', async ({ page }) => {
    console.log('Testing VNPay integration...');
    
    // Navigate to payment settings
    await page.goto('https://kho1.pages.dev/settings/payments');
    
    // Verify VNPay configuration
    await expect(page.locator('[data-testid="vnpay-config"]')).toBeVisible();
    await expect(page.locator('[data-testid="vnpay-status"]')).toContainText('Hoạt động');
    
    // Test VNPay connection
    await page.click('[data-testid="test-vnpay"]');
    await expect(page.locator('.ant-message-success')).toBeVisible();
    
    await page.screenshot({ path: 'test-results/vnpay-integration.png' });
  });

  test('MoMo integration test', async ({ page }) => {
    console.log('Testing MoMo integration...');
    
    await page.goto('https://kho1.pages.dev/settings/payments');
    
    // Verify MoMo configuration
    await expect(page.locator('[data-testid="momo-config"]')).toBeVisible();
    await expect(page.locator('[data-testid="momo-status"]')).toContainText('Hoạt động');
    
    // Test MoMo connection
    await page.click('[data-testid="test-momo"]');
    await expect(page.locator('.ant-message-success')).toBeVisible();
    
    await page.screenshot({ path: 'test-results/momo-integration.png' });
  });

  test('ZaloPay integration test', async ({ page }) => {
    console.log('Testing ZaloPay integration...');
    
    await page.goto('https://kho1.pages.dev/settings/payments');
    
    // Verify ZaloPay configuration
    await expect(page.locator('[data-testid="zalopay-config"]')).toBeVisible();
    
    // Test ZaloPay connection
    await page.click('[data-testid="test-zalopay"]');
    
    await page.screenshot({ path: 'test-results/zalopay-integration.png' });
  });
});