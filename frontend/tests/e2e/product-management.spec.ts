// Comprehensive Product Management tests
import { test, expect } from '@playwright/test';

const ADMIN_CREDENTIALS = {
  email: 'admin@khoaugment.com',
  password: 'KhoAdmin2024!'
};

test.describe('Product Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin first
    await page.goto('https://kho1.pages.dev/auth/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', ADMIN_CREDENTIALS.email);
    await page.fill('input[type="password"]', ADMIN_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Navigate to products page
    await page.goto('https://kho1.pages.dev/products');
    await page.waitForLoadState('networkidle');
  });

  test('Product list loads correctly', async ({ page }) => {
    console.log('Testing product list loading...');
    
    // Verify product list elements
    await expect(page.locator('[data-testid="products-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="add-product-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="search-products"]')).toBeVisible();
    
    // Verify at least one product exists
    await expect(page.locator('[data-testid="product-row"]')).toHaveCount({ min: 1 });
    
    await page.screenshot({ path: 'test-results/product-list.png', fullPage: true });
  });

  test('Add new product', async ({ page }) => {
    console.log('Testing add new product...');
    
    // Click add product button
    await page.click('[data-testid="add-product-btn"]');
    
    // Fill product form
    await page.fill('[data-testid="product-name"]', 'Bánh mì thịt nướng test');
    await page.fill('[data-testid="product-sku"]', 'BM-TN-001');
    await page.fill('[data-testid="product-price"]', '25000');
    await page.fill('[data-testid="product-cost"]', '15000');
    await page.fill('[data-testid="product-stock"]', '100');
    await page.selectOption('[data-testid="product-category"]', 'Bánh mì');
    await page.fill('[data-testid="product-description"]', 'Bánh mì thịt nướng thơm ngon');
    
    // Upload product image
    const fileInput = page.locator('[data-testid="product-image"]');
    await fileInput.setInputFiles({
      name: 'test-product.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data')
    });
    
    // Save product
    await page.click('[data-testid="save-product"]');
    
    // Verify success message
    await expect(page.locator('.ant-message-success')).toBeVisible();
    await expect(page.locator('text=Sản phẩm đã được thêm thành công')).toBeVisible();
    
    // Verify product appears in list
    await expect(page.locator('text=Bánh mì thịt nướng test')).toBeVisible();
    
    await page.screenshot({ path: 'test-results/product-added.png' });
  });

  test('Edit existing product', async ({ page }) => {
    console.log('Testing edit product...');
    
    // Click edit on first product
    await page.click('[data-testid="edit-product"]').first();
    
    // Modify product details
    await page.fill('[data-testid="product-name"]', 'Bánh mì pate (updated)');
    await page.fill('[data-testid="product-price"]', '30000');
    
    // Save changes
    await page.click('[data-testid="save-product"]');
    
    // Verify success
    await expect(page.locator('.ant-message-success')).toBeVisible();
    await expect(page.locator('text=Bánh mì pate (updated)')).toBeVisible();
    
    await page.screenshot({ path: 'test-results/product-edited.png' });
  });

  test('Delete product', async ({ page }) => {
    console.log('Testing delete product...');
    
    // Get initial product count
    const initialCount = await page.locator('[data-testid="product-row"]').count();
    
    // Click delete on a product
    await page.click('[data-testid="delete-product"]').first();
    
    // Confirm deletion
    await page.click('[data-testid="confirm-delete"]');
    
    // Verify success message
    await expect(page.locator('.ant-message-success')).toBeVisible();
    
    // Verify product count decreased
    await expect(page.locator('[data-testid="product-row"]')).toHaveCount(initialCount - 1);
    
    await page.screenshot({ path: 'test-results/product-deleted.png' });
  });

  test('Product search functionality', async ({ page }) => {
    console.log('Testing product search...');
    
    // Search for specific product
    await page.fill('[data-testid="search-products"]', 'bánh mì');
    await page.keyboard.press('Enter');
    
    // Wait for search results
    await page.waitForLoadState('networkidle');
    
    // Verify search results contain search term
    const productRows = page.locator('[data-testid="product-row"]');
    await expect(productRows).toHaveCount({ min: 1 });
    
    // Clear search
    await page.fill('[data-testid="search-products"]', '');
    await page.keyboard.press('Enter');
    
    await page.screenshot({ path: 'test-results/product-search.png' });
  });

  test('Product filter by category', async ({ page }) => {
    console.log('Testing category filter...');
    
    // Select category filter
    await page.selectOption('[data-testid="category-filter"]', 'Đồ uống');
    
    // Wait for filter to apply
    await page.waitForLoadState('networkidle');
    
    // Verify filtered results
    const productRows = page.locator('[data-testid="product-row"]');
    const rowCount = await productRows.count();
    
    if (rowCount > 0) {
      // Verify all visible products are in selected category
      await expect(page.locator('[data-testid="product-category"]')).toContainText('Đồ uống');
    }
    
    await page.screenshot({ path: 'test-results/category-filter.png' });
  });

  test('Bulk product operations', async ({ page }) => {
    console.log('Testing bulk operations...');
    
    // Select multiple products
    await page.click('[data-testid="select-all-products"]');
    
    // Verify all products selected
    const checkboxes = page.locator('[data-testid="product-checkbox"]:checked');
    await expect(checkboxes).toHaveCount({ min: 2 });
    
    // Test bulk price update
    await page.click('[data-testid="bulk-actions"]');
    await page.click('text=Cập nhật giá hàng loạt');
    
    await page.fill('[data-testid="bulk-price-increase"]', '5');
    await page.selectOption('[data-testid="bulk-price-type"]', 'percentage');
    await page.click('[data-testid="apply-bulk-price"]');
    
    // Verify success
    await expect(page.locator('.ant-message-success')).toBeVisible();
    
    await page.screenshot({ path: 'test-results/bulk-operations.png' });
  });

  test('Product import from CSV', async ({ page }) => {
    console.log('Testing CSV import...');
    
    // Click import button
    await page.click('[data-testid="import-products"]');
    
    // Upload CSV file
    const csvContent = 'name,sku,price,cost,stock,category\nTest Product,TEST-001,20000,12000,50,Bánh mì';
    const fileInput = page.locator('[data-testid="csv-file-input"]');
    
    await fileInput.setInputFiles({
      name: 'products.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    });
    
    // Start import
    await page.click('[data-testid="start-import"]');
    
    // Wait for import to complete
    await expect(page.locator('[data-testid="import-success"]')).toBeVisible({ timeout: 10000 });
    
    // Verify imported product appears
    await page.goto('https://kho1.pages.dev/products');
    await expect(page.locator('text=Test Product')).toBeVisible();
    
    await page.screenshot({ path: 'test-results/csv-import.png' });
  });

  test('Product export functionality', async ({ page }) => {
    console.log('Testing product export...');
    
    // Click export button
    await page.click('[data-testid="export-products"]');
    
    // Select export format
    await page.selectOption('[data-testid="export-format"]', 'csv');
    
    // Include all fields
    await page.check('[data-testid="include-inventory"]');
    await page.check('[data-testid="include-pricing"]');
    
    // Start export
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="start-export"]');
    
    // Verify download starts
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('products');
    expect(download.suggestedFilename()).toContain('.csv');
    
    await page.screenshot({ path: 'test-results/product-export.png' });
  });
});

test.describe('Inventory Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to inventory
    await page.goto('https://kho1.pages.dev/auth/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', ADMIN_CREDENTIALS.email);
    await page.fill('input[type="password"]', ADMIN_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    await page.goto('https://kho1.pages.dev/inventory');
    await page.waitForLoadState('networkidle');
  });

  test('Stock adjustment', async ({ page }) => {
    console.log('Testing stock adjustment...');
    
    // Find product with low stock
    await page.click('[data-testid="adjust-stock"]').first();
    
    // Add stock
    await page.fill('[data-testid="stock-adjustment"]', '50');
    await page.selectOption('[data-testid="adjustment-type"]', 'add');
    await page.fill('[data-testid="adjustment-reason"]', 'Nhập hàng mới');
    
    // Save adjustment
    await page.click('[data-testid="save-adjustment"]');
    
    // Verify success
    await expect(page.locator('.ant-message-success')).toBeVisible();
    
    await page.screenshot({ path: 'test-results/stock-adjustment.png' });
  });

  test('Low stock alerts', async ({ page }) => {
    console.log('Testing low stock alerts...');
    
    // Check for low stock indicator
    await expect(page.locator('[data-testid="low-stock-alert"]')).toBeVisible();
    
    // View low stock products
    await page.click('[data-testid="view-low-stock"]');
    
    // Verify low stock list
    await expect(page.locator('[data-testid="low-stock-product"]')).toHaveCount({ min: 1 });
    
    await page.screenshot({ path: 'test-results/low-stock-alerts.png' });
  });

  test('Inventory reports', async ({ page }) => {
    console.log('Testing inventory reports...');
    
    // Generate inventory report
    await page.click('[data-testid="generate-report"]');
    
    // Select date range
    await page.click('[data-testid="date-range-picker"]');
    await page.click('text=Tháng này');
    
    // Select report type
    await page.selectOption('[data-testid="report-type"]', 'stock-movement');
    
    // Generate report
    await page.click('[data-testid="create-report"]');
    
    // Verify report generated
    await expect(page.locator('[data-testid="report-table"]')).toBeVisible({ timeout: 10000 });
    
    await page.screenshot({ path: 'test-results/inventory-report.png', fullPage: true });
  });
});