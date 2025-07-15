import { test, expect } from '@playwright/test';

test.describe('Production KhoAugment POS Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the latest deployment
    await page.goto('https://3f9b81bb.kho1.pages.dev');
    await page.waitForLoadState('networkidle');
  });

  test('should load homepage and show login form', async ({ page }) => {
    console.log('Testing homepage load...');
    
    // Check if page loads
    await expect(page).toHaveTitle(/KhoAugment POS/);
    
    // Check for login elements
    const emailInput = page.locator('input[type="email"], input[placeholder*="email"], #email');
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator('button[type="submit"], button:has-text("Đăng nhập")');
    
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await expect(passwordInput).toBeVisible({ timeout: 5000 });
    await expect(loginButton).toBeVisible({ timeout: 5000 });
    
    console.log('Login form elements found');
  });

  test('should perform login with demo credentials', async ({ page }) => {
    console.log('Testing login functionality...');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Find login form elements
    const emailInput = page.locator('input[type="email"], input[placeholder*="email"], #email').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const loginButton = page.locator('button[type="submit"], button:has-text("Đăng nhập")').first();
    
    // Fill in credentials (from SimpleApp demo)
    await emailInput.fill('admin@khoaugment.com');
    await passwordInput.fill('123456');
    
    console.log('Filled in login credentials');
    
    // Click login
    await loginButton.click();
    
    // Wait for navigation or dashboard
    await page.waitForLoadState('networkidle');
    
    // Check if we're redirected to dashboard
    const dashboardTitle = page.locator('h1, h2, .ant-typography').filter({ hasText: /Tổng quan|Dashboard/ });
    const sidebarMenu = page.locator('.ant-menu, .sidebar, nav');
    
    // Should see either dashboard content or main app layout
    try {
      await expect(dashboardTitle.or(sidebarMenu).first()).toBeVisible({ timeout: 10000 });
      console.log('Login successful - dashboard visible');
    } catch (error) {
      console.log('Login may have failed, checking for error messages...');
      
      // Check for error messages
      const errorAlert = page.locator('.ant-alert-error, .error, [role="alert"]');
      const errorCount = await errorAlert.count();
      
      if (errorCount > 0) {
        const errorText = await errorAlert.first().textContent();
        console.log('Error found:', errorText);
      } else {
        console.log('No specific error found, taking screenshot...');
        await page.screenshot({ path: 'test-results/login-failed.png', fullPage: true });
      }
      
      throw error;
    }
  });

  test('should navigate through main features after login', async ({ page }) => {
    console.log('Testing main navigation...');
    
    // Login first
    await page.waitForLoadState('networkidle');
    
    const emailInput = page.locator('input[type="email"], input[placeholder*="email"], #email').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const loginButton = page.locator('button[type="submit"], button:has-text("Đăng nhập")').first();
    
    await emailInput.fill('admin@khoaugment.com');
    await passwordInput.fill('123456');
    await loginButton.click();
    await page.waitForLoadState('networkidle');
    
    // Now test navigation
    const menuItems = [
      { text: 'Bán hàng', url: '/pos' },
      { text: 'Sản phẩm', url: '/products' },
      { text: 'Khách hàng', url: '/customers' },
      { text: 'Báo cáo', url: '/analytics' },
    ];
    
    for (const item of menuItems) {
      console.log(`Testing navigation to ${item.text}...`);
      
      // Click menu item
      const menuLink = page.locator(`a:has-text("${item.text}"), .ant-menu-item:has-text("${item.text}")`).first();
      
      if (await menuLink.count() > 0) {
        await menuLink.click();
        await page.waitForLoadState('networkidle');
        
        // Check URL or page content
        const currentUrl = page.url();
        const pageContent = page.locator('h1, h2, .page-title, .ant-typography').first();
        
        console.log(`Navigated to: ${currentUrl}`);
        console.log(`Page content visible: ${await pageContent.count() > 0}`);
      } else {
        console.log(`Menu item "${item.text}" not found`);
      }
    }
  });

  test('should display dashboard KPIs and statistics', async ({ page }) => {
    console.log('Testing dashboard KPIs...');
    
    // Login first
    await page.waitForLoadState('networkidle');
    
    const emailInput = page.locator('input[type="email"], input[placeholder*="email"], #email').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const loginButton = page.locator('button[type="submit"], button:has-text("Đăng nhập")').first();
    
    await emailInput.fill('admin@khoaugment.com');
    await passwordInput.fill('123456');
    await loginButton.click();
    await page.waitForLoadState('networkidle');
    
    // Check for dashboard statistics
    const statistics = page.locator('.ant-statistic, .statistic, .kpi-card');
    const cards = page.locator('.ant-card');
    const numbers = page.locator('.ant-statistic-content-value, .statistic-value');
    
    console.log(`Found ${await statistics.count()} statistics elements`);
    console.log(`Found ${await cards.count()} card elements`);
    console.log(`Found ${await numbers.count()} number elements`);
    
    // Should have some statistical content
    const hasStats = await statistics.count() > 0;
    const hasCards = await cards.count() > 0;
    const hasNumbers = await numbers.count() > 0;
    
    expect(hasStats || hasCards || hasNumbers).toBeTruthy();
    
    console.log('Dashboard KPIs verification completed');
  });

  test('should handle responsive design', async ({ page }) => {
    console.log('Testing responsive design...');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const loginForm = page.locator('form, .login-form, .ant-form');
    await expect(loginForm).toBeVisible({ timeout: 5000 });
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    await expect(loginForm).toBeVisible({ timeout: 5000 });
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    await expect(loginForm).toBeVisible({ timeout: 5000 });
    
    console.log('Responsive design test completed');
  });
});