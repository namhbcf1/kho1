// Comprehensive POS functionality tests
import { test, expect } from '@playwright/test';

const CASHIER_CREDENTIALS = {
  email: 'cashier@khoaugment.com',
  password: 'KhoCashier2024!'
};

test.describe('POS Terminal Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Login as cashier first
    await page.goto('https://kho1.pages.dev/auth/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', CASHIER_CREDENTIALS.email);
    await page.fill('input[type="password"]', CASHIER_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Navigate to POS
    await page.goto('https://kho1.pages.dev/pos');
    await page.waitForLoadState('networkidle');
  });

  test('POS interface loads correctly', async ({ page }) => {
    console.log('Testing POS interface loading...');
    
    // Verify POS elements are visible
    await expect(page.locator('[data-testid="pos-terminal"]')).toBeVisible();
    await expect(page.locator('[data-testid="product-grid"]')).toBeVisible();
    await expect(page.locator('[data-testid="shopping-cart"]')).toBeVisible();
    await expect(page.locator('[data-testid="payment-methods"]')).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/pos-interface.png', fullPage: true });
  });

  test('Product search functionality', async ({ page }) => {
    console.log('Testing product search...');
    
    // Find and use search box
    const searchBox = page.locator('[data-testid="product-search"]');
    await expect(searchBox).toBeVisible();
    
    // Search for a product
    await searchBox.fill('bánh mì');
    await page.keyboard.press('Enter');
    
    // Wait for search results
    await page.waitForLoadState('networkidle');
    
    // Verify search results
    await expect(page.locator('[data-testid="product-item"]')).toHaveCount({ min: 1 });
    
    // Take screenshot of search results
    await page.screenshot({ path: 'test-results/product-search.png' });
  });

  test('Add product to cart', async ({ page }) => {
    console.log('Testing add product to cart...');
    
    // Find first product and add to cart
    const firstProduct = page.locator('[data-testid="product-item"]').first();
    await expect(firstProduct).toBeVisible();
    
    await firstProduct.click();
    
    // Verify product added to cart
    const cartItems = page.locator('[data-testid="cart-item"]');
    await expect(cartItems).toHaveCount({ min: 1 });
    
    // Verify cart total updates
    const cartTotal = page.locator('[data-testid="cart-total"]');
    await expect(cartTotal).not.toContainText('0 ₫');
    
    await page.screenshot({ path: 'test-results/product-in-cart.png' });
  });

  test('Modify quantity in cart', async ({ page }) => {
    console.log('Testing quantity modification...');
    
    // Add product to cart first
    await page.locator('[data-testid="product-item"]').first().click();
    
    // Find quantity controls
    const quantityInput = page.locator('[data-testid="quantity-input"]').first();
    const increaseBtn = page.locator('[data-testid="quantity-increase"]').first();
    const decreaseBtn = page.locator('[data-testid="quantity-decrease"]').first();
    
    // Test increase quantity
    await increaseBtn.click();
    await expect(quantityInput).toHaveValue('2');
    
    // Test decrease quantity
    await decreaseBtn.click();
    await expect(quantityInput).toHaveValue('1');
    
    // Test manual input
    await quantityInput.fill('5');
    await page.keyboard.press('Enter');
    await expect(quantityInput).toHaveValue('5');
    
    await page.screenshot({ path: 'test-results/quantity-modification.png' });
  });

  test('Remove item from cart', async ({ page }) => {
    console.log('Testing remove item from cart...');
    
    // Add product to cart first
    await page.locator('[data-testid="product-item"]').first().click();
    
    // Remove item
    const removeBtn = page.locator('[data-testid="remove-item"]').first();
    await removeBtn.click();
    
    // Verify item removed
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(0);
    
    // Verify cart total is 0
    await expect(page.locator('[data-testid="cart-total"]')).toContainText('0 ₫');
  });

  test('Apply discount to cart', async ({ page }) => {
    console.log('Testing discount application...');
    
    // Add product to cart first
    await page.locator('[data-testid="product-item"]').first().click();
    
    // Apply discount
    const discountBtn = page.locator('[data-testid="apply-discount"]');
    await discountBtn.click();
    
    // Fill discount form
    await page.fill('[data-testid="discount-amount"]', '10');
    await page.selectOption('[data-testid="discount-type"]', 'percentage');
    await page.click('[data-testid="confirm-discount"]');
    
    // Verify discount applied
    await expect(page.locator('[data-testid="discount-info"]')).toContainText('10%');
    
    await page.screenshot({ path: 'test-results/discount-applied.png' });
  });

  test('Cash payment process', async ({ page }) => {
    console.log('Testing cash payment...');
    
    // Add product and proceed to payment
    await page.locator('[data-testid="product-item"]').first().click();
    await page.click('[data-testid="checkout-button"]');
    
    // Select cash payment
    await page.click('[data-testid="payment-cash"]');
    
    // Enter cash received
    const cashInput = page.locator('[data-testid="cash-received"]');
    await cashInput.fill('100000');
    
    // Complete payment
    await page.click('[data-testid="complete-payment"]');
    
    // Verify payment success
    await expect(page.locator('[data-testid="payment-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="receipt"]')).toBeVisible();
    
    await page.screenshot({ path: 'test-results/cash-payment-complete.png' });
  });

  test('VNPay payment integration', async ({ page }) => {
    console.log('Testing VNPay payment...');
    
    // Add product and proceed to payment
    await page.locator('[data-testid="product-item"]').first().click();
    await page.click('[data-testid="checkout-button"]');
    
    // Select VNPay
    await page.click('[data-testid="payment-vnpay"]');
    
    // Complete VNPay flow
    await page.click('[data-testid="vnpay-submit"]');
    
    // Should redirect to VNPay (or show sandbox)
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of VNPay page
    await page.screenshot({ path: 'test-results/vnpay-redirect.png' });
  });

  test('Print receipt functionality', async ({ page }) => {
    console.log('Testing receipt printing...');
    
    // Complete a transaction first
    await page.locator('[data-testid="product-item"]').first().click();
    await page.click('[data-testid="checkout-button"]');
    await page.click('[data-testid="payment-cash"]');
    await page.fill('[data-testid="cash-received"]', '100000');
    await page.click('[data-testid="complete-payment"]');
    
    // Print receipt
    await page.click('[data-testid="print-receipt"]');
    
    // Verify print dialog or receipt generation
    await expect(page.locator('[data-testid="receipt-generated"]')).toBeVisible();
    
    await page.screenshot({ path: 'test-results/receipt-printed.png' });
  });

  test('Customer selection and loyalty', async ({ page }) => {
    console.log('Testing customer selection...');
    
    // Open customer selector
    await page.click('[data-testid="select-customer"]');
    
    // Search for customer
    await page.fill('[data-testid="customer-search"]', '0901234567');
    await page.click('[data-testid="search-customer"]');
    
    // Select customer
    await page.click('[data-testid="customer-item"]').first();
    
    // Verify customer selected
    await expect(page.locator('[data-testid="selected-customer"]')).toBeVisible();
    
    // Check loyalty points display
    await expect(page.locator('[data-testid="loyalty-points"]')).toBeVisible();
    
    await page.screenshot({ path: 'test-results/customer-selected.png' });
  });

  test('Barcode scanning simulation', async ({ page }) => {
    console.log('Testing barcode scanning...');
    
    // Open barcode scanner
    await page.click('[data-testid="barcode-scanner"]');
    
    // Simulate barcode input
    await page.fill('[data-testid="barcode-input"]', '1234567890123');
    await page.keyboard.press('Enter');
    
    // Verify product added to cart
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount({ min: 1 });
    
    await page.screenshot({ path: 'test-results/barcode-scanned.png' });
  });

  test('Offline mode functionality', async ({ page }) => {
    console.log('Testing offline mode...');
    
    // Simulate going offline
    await page.context().setOffline(true);
    
    // Try to add product (should work in offline mode)
    await page.locator('[data-testid="product-item"]').first().click();
    
    // Verify offline indicator
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
    
    // Complete offline transaction
    await page.click('[data-testid="checkout-button"]');
    await page.click('[data-testid="payment-cash"]');
    await page.fill('[data-testid="cash-received"]', '100000');
    await page.click('[data-testid="complete-payment"]');
    
    // Verify transaction queued for sync
    await expect(page.locator('[data-testid="sync-queue"]')).toContainText('1');
    
    await page.screenshot({ path: 'test-results/offline-transaction.png' });
    
    // Go back online
    await page.context().setOffline(false);
    
    // Verify sync happens
    await page.waitForTimeout(2000);
    await expect(page.locator('[data-testid="sync-queue"]')).toContainText('0');
  });
});