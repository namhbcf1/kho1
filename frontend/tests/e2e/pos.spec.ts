// E2E tests for POS functionality
import { test, expect } from '@playwright/test';

test.describe('POS Terminal', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'cashier@khoaugment.com');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    
    // Navigate to POS
    await page.goto('/pos');
  });

  test('should display POS interface', async ({ page }) => {
    await expect(page.locator('h4')).toContainText('Bán hàng');
    await expect(page.locator('[data-testid="product-grid"]')).toBeVisible();
    await expect(page.locator('[data-testid="shopping-cart"]')).toBeVisible();
    await expect(page.locator('[data-testid="payment-methods"]')).toBeVisible();
  });

  test('should add product to cart', async ({ page }) => {
    // Click on a product
    await page.click('[data-testid="product-item"]:first-child');
    
    // Check if product is added to cart
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1);
    
    // Check cart total is updated
    const total = page.locator('[data-testid="cart-total"]');
    await expect(total).not.toContainText('0 ₫');
  });

  test('should update product quantity in cart', async ({ page }) => {
    // Add product to cart
    await page.click('[data-testid="product-item"]:first-child');
    
    // Increase quantity
    await page.click('[data-testid="quantity-increase"]');
    
    // Check quantity is updated
    await expect(page.locator('[data-testid="item-quantity"]')).toContainText('2');
  });

  test('should remove product from cart', async ({ page }) => {
    // Add product to cart
    await page.click('[data-testid="product-item"]:first-child');
    
    // Remove product
    await page.click('[data-testid="remove-item"]');
    
    // Check cart is empty
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="cart-total"]')).toContainText('0 ₫');
  });

  test('should clear entire cart', async ({ page }) => {
    // Add multiple products
    await page.click('[data-testid="product-item"]:first-child');
    await page.click('[data-testid="product-item"]:nth-child(2)');
    
    // Clear cart
    await page.click('[data-testid="clear-cart"]');
    await page.click('text=Có'); // Confirm dialog
    
    // Check cart is empty
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(0);
  });

  test('should apply discount', async ({ page }) => {
    // Add product to cart
    await page.click('[data-testid="product-item"]:first-child');
    
    // Apply discount
    await page.click('[data-testid="apply-discount"]');
    await page.fill('[data-testid="discount-input"]', '10');
    await page.click('[data-testid="discount-confirm"]');
    
    // Check discount is applied
    await expect(page.locator('[data-testid="discount-amount"]')).toBeVisible();
  });

  test('should search products', async ({ page }) => {
    // Search for product
    await page.fill('[data-testid="product-search"]', 'cà phê');
    
    // Check filtered results
    const products = page.locator('[data-testid="product-item"]');
    await expect(products).toHaveCount.greaterThan(0);
    
    // Check product names contain search term
    const firstProduct = products.first();
    await expect(firstProduct).toContainText('cà phê', { ignoreCase: true });
  });

  test('should scan barcode', async ({ page }) => {
    // Mock barcode scanner
    await page.click('[data-testid="barcode-scanner"]');
    
    // Simulate barcode scan
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('barcode-scanned', {
        detail: { barcode: '1234567890123' }
      }));
    });
    
    // Check product is added to cart
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1);
  });

  test('should select customer', async ({ page }) => {
    // Open customer selector
    await page.click('[data-testid="select-customer"]');
    
    // Search and select customer
    await page.fill('[data-testid="customer-search"]', 'Nguyễn');
    await page.click('[data-testid="customer-option"]:first-child');
    
    // Check customer is selected
    await expect(page.locator('[data-testid="selected-customer"]')).toBeVisible();
  });
});

test.describe('POS Checkout', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to POS
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'cashier@khoaugment.com');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.goto('/pos');
    
    // Add product to cart
    await page.click('[data-testid="product-item"]:first-child');
  });

  test('should process cash payment', async ({ page }) => {
    // Select cash payment
    await page.click('[data-testid="payment-cash"]');
    
    // Enter cash received
    await page.fill('[data-testid="cash-received"]', '100000');
    
    // Complete payment
    await page.click('[data-testid="complete-payment"]');
    
    // Check order is completed
    await expect(page.locator('[data-testid="order-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="change-amount"]')).toBeVisible();
  });

  test('should process card payment', async ({ page }) => {
    // Select card payment
    await page.click('[data-testid="payment-card"]');
    
    // Complete payment
    await page.click('[data-testid="complete-payment"]');
    
    // Check order is completed
    await expect(page.locator('[data-testid="order-success"]')).toBeVisible();
  });

  test('should process VNPay payment', async ({ page }) => {
    // Select VNPay payment
    await page.click('[data-testid="payment-vnpay"]');
    
    // Complete payment
    await page.click('[data-testid="complete-payment"]');
    
    // Should redirect to VNPay (mock)
    await expect(page.locator('[data-testid="payment-processing"]')).toBeVisible();
  });

  test('should print receipt', async ({ page }) => {
    // Complete cash payment
    await page.click('[data-testid="payment-cash"]');
    await page.fill('[data-testid="cash-received"]', '100000');
    await page.click('[data-testid="complete-payment"]');
    
    // Print receipt
    await page.click('[data-testid="print-receipt"]');
    
    // Check print dialog or success message
    await expect(page.locator('[data-testid="print-success"]')).toBeVisible();
  });

  test('should email receipt', async ({ page }) => {
    // Select customer with email
    await page.click('[data-testid="select-customer"]');
    await page.click('[data-testid="customer-option"]:first-child');
    
    // Complete payment
    await page.click('[data-testid="payment-cash"]');
    await page.fill('[data-testid="cash-received"]', '100000');
    await page.click('[data-testid="complete-payment"]');
    
    // Email receipt
    await page.click('[data-testid="email-receipt"]');
    
    // Check email sent message
    await expect(page.locator('[data-testid="email-success"]')).toBeVisible();
  });

  test('should handle insufficient payment', async ({ page }) => {
    // Select cash payment with insufficient amount
    await page.click('[data-testid="payment-cash"]');
    await page.fill('[data-testid="cash-received"]', '1000'); // Less than total
    
    // Try to complete payment
    await page.click('[data-testid="complete-payment"]');
    
    // Check error message
    await expect(page.locator('[data-testid="insufficient-payment"]')).toBeVisible();
  });

  test('should start new order after completion', async ({ page }) => {
    // Complete payment
    await page.click('[data-testid="payment-cash"]');
    await page.fill('[data-testid="cash-received"]', '100000');
    await page.click('[data-testid="complete-payment"]');
    
    // Start new order
    await page.click('[data-testid="new-order"]');
    
    // Check cart is empty and ready for new order
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="cart-total"]')).toContainText('0 ₫');
  });
});
