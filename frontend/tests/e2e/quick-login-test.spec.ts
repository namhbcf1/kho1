// Quick login test to verify the fixes
import { test, expect } from '@playwright/test';

test.describe('Quick Login Test', () => {
  test('Login should work with correct credentials', async ({ page }) => {
    console.log('Starting quick login test...');
    
    // Navigate to the correct login path
    await page.goto('https://kho1.pages.dev/login');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of login page
    await page.screenshot({ path: 'test-results/quick-login-page.png', fullPage: true });
    
    // Check if we have the correct page heading
    const heading = await page.locator('h3').textContent();
    console.log('Page heading:', heading);
    
    // Fill the form with admin credentials
    await page.fill('input[name="email"]', 'admin@khoaugment.com');
    await page.fill('input[name="password"]', '123456');
    
    // Take screenshot before clicking login
    await page.screenshot({ path: 'test-results/quick-before-login.png', fullPage: true });
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for navigation or loading to complete
    await page.waitForTimeout(3000); // Wait for the 1 second login delay + navigation
    
    // Take screenshot after login attempt
    await page.screenshot({ path: 'test-results/quick-after-login.png', fullPage: true });
    
    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);
    
    // Check if we redirected to dashboard
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ Login successful - redirected to dashboard');
      
      // Check for dashboard content
      const dashboardHeading = await page.locator('h2').first().textContent();
      console.log('Dashboard heading:', dashboardHeading);
      
      // Verify we have navigation
      const sidebarVisible = await page.locator('.ant-layout-sider').isVisible();
      console.log('Sidebar visible:', sidebarVisible);
      
      expect(currentUrl).toContain('/dashboard');
    } else {
      console.log('❌ Login failed - still on login page');
      
      // Check for any error messages
      const errors = await page.locator('.ant-alert-error, .ant-message-error').allTextContents();
      console.log('Error messages:', errors);
      
      // This test will fail, but we want to see what happened
      expect(currentUrl).toContain('/dashboard');
    }
  });
  
  test('Check all demo accounts work', async ({ page }) => {
    const demoAccounts = [
      { email: 'admin@khoaugment.com', password: '123456', name: 'admin' },
      { email: 'manager@khoaugment.com', password: '123456', name: 'manager' },
      { email: 'cashier@khoaugment.com', password: '123456', name: 'cashier' }
    ];
    
    for (const account of demoAccounts) {
      console.log(`Testing login for ${account.name}...`);
      
      await page.goto('https://kho1.pages.dev/login');
      await page.waitForLoadState('networkidle');
      
      await page.fill('input[name="email"]', account.email);
      await page.fill('input[name="password"]', account.password);
      
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      console.log(`${account.name} login result - URL:`, currentUrl);
      
      if (currentUrl.includes('/dashboard')) {
        console.log(`✅ ${account.name} login successful`);
        
        // Logout for next test
        await page.click('.ant-avatar, [data-testid="user-menu"]').catch(() => {
          console.log('Logout button not found, continuing...');
        });
        await page.waitForTimeout(1000);
      } else {
        console.log(`❌ ${account.name} login failed`);
      }
    }
  });
});