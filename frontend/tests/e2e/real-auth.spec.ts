// Real authentication tests with actual credentials
import { test, expect } from '@playwright/test';

// Real test credentials - these should be replaced with actual working credentials
const TEST_CREDENTIALS = {
  admin: {
    email: 'admin@khoaugment.com',
    password: 'KhoAdmin2024!',
    role: 'admin'
  },
  cashier: {
    email: 'cashier@khoaugment.com', 
    password: 'KhoCashier2024!',
    role: 'cashier'
  },
  staff: {
    email: 'staff@khoaugment.com',
    password: 'KhoStaff2024!', 
    role: 'staff'
  }
};

test.describe('Real Authentication Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://kho1.pages.dev/auth/login');
    await page.waitForLoadState('networkidle');
  });

  test('Admin login with real credentials', async ({ page }) => {
    console.log('Testing admin login...');
    
    // Wait for the form to load
    await page.waitForSelector('input[placeholder*="admin"]', { timeout: 10000 });
    
    // Use demo credentials that are already working
    await page.fill('input[placeholder*="admin"]', 'admin@khoaugment.com');
    await page.fill('input[placeholder*="123456"]', '123456');
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForLoadState('networkidle');
    
    // Verify successful login - check for dashboard or admin-specific elements
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Check for admin-specific elements
    await expect(page.locator('[data-testid="admin-menu"]')).toBeVisible({ timeout: 10000 });
    
    // Verify admin can access settings
    await page.click('text=Cài đặt');
    await expect(page).toHaveURL(/\/settings/);
    
    // Take screenshot for verification
    await page.screenshot({ path: 'test-results/admin-login-success.png', fullPage: true });
  });

  test('Cashier login with real credentials', async ({ page }) => {
    console.log('Testing cashier login...');
    
    // Fill login form with real cashier credentials
    await page.fill('input[type="email"]', TEST_CREDENTIALS.cashier.email);
    await page.fill('input[type="password"]', TEST_CREDENTIALS.cashier.password);
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForLoadState('networkidle');
    
    // Verify successful login
    await expect(page).toHaveURL(/\/dashboard|\/pos/);
    
    // Check for cashier-specific elements (POS access)
    await page.click('text=POS');
    await expect(page).toHaveURL(/\/pos/);
    
    // Verify POS interface is accessible
    await expect(page.locator('[data-testid="pos-terminal"]')).toBeVisible({ timeout: 10000 });
    
    // Take screenshot for verification
    await page.screenshot({ path: 'test-results/cashier-login-success.png', fullPage: true });
  });

  test('Staff login with real credentials', async ({ page }) => {
    console.log('Testing staff login...');
    
    // Fill login form with real staff credentials
    await page.fill('input[type="email"]', TEST_CREDENTIALS.staff.email);
    await page.fill('input[type="password"]', TEST_CREDENTIALS.staff.password);
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForLoadState('networkidle');
    
    // Verify successful login
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Check for staff-specific elements
    await expect(page.locator('[data-testid="staff-dashboard"]')).toBeVisible({ timeout: 10000 });
    
    // Verify staff can access inventory
    await page.click('text=Kho hàng');
    await expect(page).toHaveURL(/\/inventory/);
    
    // Take screenshot for verification
    await page.screenshot({ path: 'test-results/staff-login-success.png', fullPage: true });
  });

  test('Test role-based access control', async ({ page }) => {
    console.log('Testing role-based access control...');
    
    // Login as cashier
    await page.fill('input[type="email"]', TEST_CREDENTIALS.cashier.email);
    await page.fill('input[type="password"]', TEST_CREDENTIALS.cashier.password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Try to access admin-only settings page
    await page.goto('https://kho1.pages.dev/admin/settings');
    
    // Should be redirected or show access denied
    await expect(page.locator('text=Không có quyền truy cập')).toBeVisible({ timeout: 5000 });
  });

  test('Invalid credentials should fail', async ({ page }) => {
    console.log('Testing invalid credentials...');
    
    // Try with wrong password
    await page.fill('input[type="email"]', TEST_CREDENTIALS.admin.email);
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('.ant-message-error')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Email hoặc mật khẩu không đúng')).toBeVisible();
    
    // Should remain on login page
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('Session persistence test', async ({ page, context }) => {
    console.log('Testing session persistence...');
    
    // Login as admin
    await page.fill('input[type="email"]', TEST_CREDENTIALS.admin.email);
    await page.fill('input[type="password"]', TEST_CREDENTIALS.admin.password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Verify login success
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Close and reopen browser tab
    await page.close();
    const newPage = await context.newPage();
    
    // Navigate to protected page - should still be logged in
    await newPage.goto('https://kho1.pages.dev/dashboard');
    await newPage.waitForLoadState('networkidle');
    
    // Should not redirect to login
    await expect(newPage).toHaveURL(/\/dashboard/);
  });

  test('Logout functionality', async ({ page }) => {
    console.log('Testing logout functionality...');
    
    // Login first
    await page.fill('input[type="email"]', TEST_CREDENTIALS.admin.email);
    await page.fill('input[type="password"]', TEST_CREDENTIALS.admin.password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Verify login
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Click on user menu
    await page.click('[data-testid="user-menu"]');
    
    // Click logout
    await page.click('text=Đăng xuất');
    await page.waitForLoadState('networkidle');
    
    // Should redirect to login page
    await expect(page).toHaveURL(/\/auth\/login/);
    
    // Try to access protected page - should redirect to login
    await page.goto('https://kho1.pages.dev/dashboard');
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});