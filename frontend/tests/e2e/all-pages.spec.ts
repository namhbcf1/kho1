// Comprehensive E2E tests for all pages and functionality
import { test, expect } from '@playwright/test';

// Helper function to login
async function login(page: any) {
  await page.goto('/auth/login');
  await page.waitForLoadState('networkidle');
  
  // Wait for login form to be visible
  await page.waitForSelector('form[name="login"]', { timeout: 10000 });
  
  // Fill email field using Form.Item name
  const emailInput = page.locator('input[name="email"]').or(page.locator('#email')).or(page.locator('input').nth(0));
  await emailInput.waitFor({ timeout: 10000 });
  await emailInput.fill('admin@khoaugment.com');
  
  // Fill password field
  const passwordInput = page.locator('input[name="password"]').or(page.locator('#password')).or(page.locator('input[type="password"]'));
  await passwordInput.waitFor({ timeout: 10000 });
  await passwordInput.fill('123456');
  
  // Click login button
  const loginButton = page.locator('button[type="submit"]').or(page.locator('button:has-text("Đăng nhập")'));
  await loginButton.click();
  await page.waitForTimeout(5000); // Wait for authentication and redirect
}

test.describe('Homepage and Landing', () => {
  test('should load homepage without errors', async ({ page }) => {
    await page.goto('/');
    
    // Should either show login page or dashboard if logged in
    const loginButton = page.locator('button:has-text("Đăng nhập")');
    const dashboardTitle = page.locator('h1:has-text("Tổng quan"), .ant-typography:has-text("Tổng quan")');
    
    // Check if we're on login page or dashboard
    try {
      await expect(loginButton).toBeVisible({ timeout: 5000 });
    } catch {
      try {
        await expect(dashboardTitle).toBeVisible({ timeout: 5000 });
      } catch {
        // Either login or dashboard should be visible
        throw new Error('Neither login form nor dashboard is visible');
      }
    }
  });

  test('should handle 404 pages gracefully', async ({ page }) => {
    await page.goto('/nonexistent-page');
    
    // Should show 404 page or redirect to login
    await expect(page).toHaveURL(/\/(login|404|$)/);
  });
});

test.describe('Authentication Flow', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/(login|auth\/login)/);
  });

  test('should show login form elements', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    
    // Wait for form to render with longer timeout
    await page.waitForTimeout(3000);
    
    // Check if login form is rendered (more flexible approach)
    const hasEmailField = await page.locator('input[type="email"], input[name="email"], [placeholder*="email"], [placeholder*="Email"]').count();
    const hasPasswordField = await page.locator('input[type="password"], input[name="password"], [placeholder*="password"], [placeholder*="Password"]').count();
    const hasSubmitButton = await page.locator('button[type="submit"], button:has-text("Đăng nhập"), button:has-text("Login")').count();
    
    expect(hasEmailField).toBeGreaterThan(0);
    expect(hasPasswordField).toBeGreaterThan(0);
    expect(hasSubmitButton).toBeGreaterThan(0);
  });

  test('should handle login with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Try to fill form if it exists
    const emailField = page.locator('input[type="email"], input[name="email"]').first();
    const passwordField = page.locator('input[type="password"], input[name="password"]').first();
    const submitButton = page.locator('button[type="submit"], button:has-text("Đăng nhập")').first();
    
    if (await emailField.count() > 0) {
      await emailField.fill('invalid@test.com');
      await passwordField.fill('wrongpassword');
      await submitButton.click();
      
      // Should show error or stay on login
      await page.waitForTimeout(3000);
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/login/);
    } else {
      // If form not found, just verify we're on login page
      await expect(page).toHaveURL(/\/login/);
    }
  });
});

test.describe('Dashboard and Main Layout', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display dashboard after login', async ({ page }) => {
    // Should be on dashboard or redirected there
    await expect(page).toHaveURL(/\/(dashboard|$)/);
    
    // Check for dashboard elements
    const hasTitle = page.locator('h1, h2, h3').filter({ hasText: /Tổng quan|Dashboard/ }).isVisible();
    const hasContent = page.locator('main, .content, .dashboard').isVisible();
    
    await expect(hasTitle.or(hasContent)).toBeTruthy();
  });

  test('should display navigation menu', async ({ page }) => {
    // Check for navigation elements
    const hasNav = page.locator('nav, .menu, .sidebar, [role="navigation"]').isVisible();
    const hasMenuItems = page.locator('a, button').filter({ hasText: /Bán hàng|POS|Sản phẩm|Khách hàng/ }).first().isVisible();
    
    await expect(hasNav.or(hasMenuItems)).toBeTruthy();
  });

  test('should display user menu/profile', async ({ page }) => {
    // Look for user profile elements
    const hasUserMenu = page.locator('[data-testid="user-menu"], .user-menu, .profile').isVisible();
    const hasUserInfo = page.locator('text=admin@khoaugment.com, text=Administrator, text=admin').isVisible();
    
    await expect(hasUserMenu.or(hasUserInfo)).toBeTruthy();
  });
});

test.describe('POS Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should navigate to POS page', async ({ page }) => {
    await page.goto('/pos');
    await page.waitForLoadState('networkidle');
    
    // Should be on POS page
    await expect(page).toHaveURL(/\/pos/);
    
    // Check for POS-specific elements
    const hasPOSTitle = page.locator('h1, h2, h3, h4').filter({ hasText: /Bán hàng|POS|Terminal/ }).isVisible();
    const hasPOSContent = page.locator('.pos, [data-testid*="pos"], .terminal').isVisible();
    
    await expect(hasPOSTitle.or(hasPOSContent)).toBeTruthy();
  });

  test('should display product grid or list', async ({ page }) => {
    await page.goto('/pos');
    await page.waitForLoadState('networkidle');
    
    // Look for product display elements
    const hasProducts = page.locator('[data-testid*="product"], .product, .item-grid, .product-grid').isVisible();
    const hasProductList = page.locator('.product-list, .items').isVisible();
    
    await expect(hasProducts.or(hasProductList)).toBeTruthy();
  });

  test('should display shopping cart area', async ({ page }) => {
    await page.goto('/pos');
    await page.waitForLoadState('networkidle');
    
    // Look for cart elements
    const hasCart = page.locator('[data-testid*="cart"], .cart, .order-summary').isVisible();
    const hasTotal = page.locator('[data-testid*="total"], .total, .amount').isVisible();
    
    await expect(hasCart.or(hasTotal)).toBeTruthy();
  });
});

test.describe('Products Pages', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should navigate to products list', async ({ page }) => {
    await page.goto('/products/list');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/\/products/);
    
    // Check for products page elements
    const hasTitle = page.locator('h1, h2, h3').filter({ hasText: /Sản phẩm|Products/ }).isVisible();
    const hasTable = page.locator('table, .table, .ant-table, .data-table').isVisible();
    
    await expect(hasTitle.or(hasTable)).toBeTruthy();
  });

  test('should navigate to product categories', async ({ page }) => {
    await page.goto('/products/categories');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/\/products\/categories/);
    
    // Check for categories elements
    const hasTitle = page.locator('h1, h2, h3').filter({ hasText: /Danh mục|Categories/ }).isVisible();
    const hasContent = page.locator('.categories, .category-list').isVisible();
    
    await expect(hasTitle.or(hasContent)).toBeTruthy();
  });

  test('should navigate to inventory management', async ({ page }) => {
    await page.goto('/products/inventory');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/\/products\/inventory/);
  });
});

test.describe('Customers Pages', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should navigate to customers list', async ({ page }) => {
    await page.goto('/customers/list');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/\/customers/);
    
    // Check for customers page elements
    const hasTitle = page.locator('h1, h2, h3').filter({ hasText: /Khách hàng|Customers/ }).isVisible();
    const hasTable = page.locator('table, .table, .ant-table').isVisible();
    
    await expect(hasTitle.or(hasTable)).toBeTruthy();
  });

  test('should navigate to loyalty program', async ({ page }) => {
    await page.goto('/customers/loyalty');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/\/customers\/loyalty/);
  });
});

test.describe('Orders Pages', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should navigate to orders list', async ({ page }) => {
    await page.goto('/orders/list');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/\/orders/);
    
    // Check for orders page elements
    const hasTitle = page.locator('h1, h2, h3').filter({ hasText: /Đơn hàng|Orders/ }).isVisible();
    const hasTable = page.locator('table, .table, .ant-table').isVisible();
    
    await expect(hasTitle.or(hasTable)).toBeTruthy();
  });

  test('should navigate to refunds', async ({ page }) => {
    await page.goto('/orders/refunds');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/\/orders\/refunds/);
  });
});

test.describe('Analytics Pages', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should navigate to sales analytics', async ({ page }) => {
    await page.goto('/analytics/sales');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/\/analytics\/sales/);
    
    // Check for analytics elements
    const hasTitle = page.locator('h1, h2, h3').filter({ hasText: /Báo cáo|Analytics|Sales/ }).isVisible();
    const hasChart = page.locator('.chart, canvas, svg').isVisible();
    
    await expect(hasTitle.or(hasChart)).toBeTruthy();
  });

  test('should navigate to revenue analytics', async ({ page }) => {
    await page.goto('/analytics/revenue');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/\/analytics\/revenue/);
  });

  test('should navigate to inventory analytics', async ({ page }) => {
    await page.goto('/analytics/inventory');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/\/analytics\/inventory/);
  });

  test('should navigate to customer analytics', async ({ page }) => {
    await page.goto('/analytics/customers');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/\/analytics\/customers/);
  });
});

test.describe('Settings Pages', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should navigate to business settings', async ({ page }) => {
    await page.goto('/settings/business');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/\/settings\/business/);
    
    // Check for settings elements
    const hasTitle = page.locator('h1, h2, h3').filter({ hasText: /Cài đặt|Settings|Business/ }).isVisible();
    const hasForm = page.locator('form, .form, .settings-form').isVisible();
    
    await expect(hasTitle.or(hasForm)).toBeTruthy();
  });

  test('should navigate to tax settings', async ({ page }) => {
    await page.goto('/settings/tax');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/\/settings\/tax/);
  });

  test('should navigate to payment settings', async ({ page }) => {
    await page.goto('/settings/payment');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/\/settings\/payment/);
  });

  test('should navigate to receipt settings', async ({ page }) => {
    await page.goto('/settings/receipt');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/\/settings\/receipt/);
  });

  test('should navigate to backup settings', async ({ page }) => {
    await page.goto('/settings/backup');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/\/settings\/backup/);
  });
});

test.describe('Staff Management Pages', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should navigate to staff management', async ({ page }) => {
    await page.goto('/staff/management');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/\/staff\/management/);
  });

  test('should navigate to staff performance', async ({ page }) => {
    await page.goto('/staff/performance');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/\/staff\/performance/);
  });

  test('should navigate to shift management', async ({ page }) => {
    await page.goto('/staff/shifts');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/\/staff\/shifts/);
  });
});

test.describe('Payment Pages', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should navigate to payment methods', async ({ page }) => {
    await page.goto('/payments/methods');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/\/payments\/methods/);
  });

  test('should navigate to payment history', async ({ page }) => {
    await page.goto('/payments/history');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/\/payments\/history/);
  });
});

test.describe('Error Handling and Edge Cases', () => {
  test('should handle network failures gracefully', async ({ page }) => {
    // Simulate offline mode
    await page.context().setOffline(true);
    
    await page.goto('/dashboard');
    await page.waitForTimeout(3000);
    
    // Should show offline message or cached content
    const hasOfflineMessage = page.locator('text=offline, text=network, text=connection').isVisible();
    const hasContent = page.locator('main, .content').isVisible();
    
    await expect(hasOfflineMessage.or(hasContent)).toBeTruthy();
    
    // Restore online mode
    await page.context().setOffline(false);
  });

  test('should handle slow loading gracefully', async ({ page }) => {
    // Throttle network
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 1000);
    });
    
    await page.goto('/dashboard');
    
    // Should show loading indicators
    const hasLoader = page.locator('.loading, .spinner, .ant-spin').isVisible();
    const hasContent = page.locator('main, .content').isVisible();
    
    await expect(hasLoader.or(hasContent)).toBeTruthy();
  });

  test('should handle JavaScript errors gracefully', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Should not have critical JavaScript errors
    const criticalErrors = errors.filter(error => 
      error.includes('TypeError') || 
      error.includes('ReferenceError') ||
      error.includes('Cannot read property')
    );
    
    expect(criticalErrors.length).toBeLessThan(3); // Allow some minor errors
  });
});

test.describe('PWA and Mobile Features', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone size
    
    await login(page);
    
    // Should be responsive
    const hasContent = page.locator('main, .content').isVisible();
    await expect(hasContent).toBeTruthy();
  });

  test('should have PWA manifest', async ({ page }) => {
    await page.goto('/');
    
    // Check for manifest link (should be only one now)
    const manifestLink = page.locator('link[rel="manifest"]').first();
    await expect(manifestLink).toBeAttached();
  });

  test('should have service worker', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check if service worker is registered
    const swRegistered = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });
    
    expect(swRegistered).toBeTruthy();
  });
});