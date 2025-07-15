// Final comprehensive login test with correct selectors
import { test, expect } from '@playwright/test';

test.describe('Final Login Test', () => {
  test('Complete login flow with correct selectors', async ({ page }) => {
    console.log('Testing complete login flow...');
    
    // Navigate to login page
    await page.goto('https://kho1.pages.dev/login');
    await page.waitForLoadState('networkidle');
    
    // Verify we're on the login page
    await expect(page.locator('h3')).toContainText('Đăng nhập POS');
    
    // Fill the form using the correct selectors found in debug
    await page.locator('input[placeholder*="admin"]').fill('admin@khoaugment.com');
    await page.locator('input[type="password"]').fill('123456');
    
    // Take screenshot before submit
    await page.screenshot({ path: 'test-results/final-before-submit.png', fullPage: true });
    
    // Submit the form
    await page.locator('button[type="submit"]').click();
    
    // Wait for the 1-second login delay plus navigation
    await page.waitForTimeout(2000);
    
    // Wait for any potential navigation
    await page.waitForLoadState('networkidle');
    
    // Take screenshot after submit
    await page.screenshot({ path: 'test-results/final-after-submit.png', fullPage: true });
    
    const currentUrl = page.url();
    console.log('Final URL:', currentUrl);
    
    // Check if login was successful
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ LOGIN SUCCESS - Redirected to dashboard');
      
      // Verify dashboard content
      await expect(page.locator('h2')).toContainText('Tổng quan');
      
      // Check for KhoAugment POS title in sidebar
      await expect(page.locator('.ant-layout-sider h4')).toContainText('KhoAugment POS');
      
      // Verify user info is displayed
      const userAvatar = page.locator('.ant-avatar');
      await expect(userAvatar).toBeVisible();
      
      console.log('✅ All dashboard elements verified');
    } else {
      console.log('❌ LOGIN FAILED - Still on login page');
      
      // Check for error messages
      const errorMessages = await page.locator('.ant-alert-error').allTextContents();
      console.log('Error messages:', errorMessages);
      
      // This will make the test fail with useful info
      expect(currentUrl, `Login failed. Error messages: ${errorMessages.join(', ')}`).toContain('/dashboard');
    }
  });
  
  test('Test all demo accounts sequentially', async ({ page }) => {
    const accounts = [
      { email: 'admin@khoaugment.com', password: '123456', role: 'admin' },
      { email: 'manager@khoaugment.com', password: '123456', role: 'manager' },
      { email: 'cashier@khoaugment.com', password: '123456', role: 'cashier' }
    ];
    
    for (const account of accounts) {
      console.log(`\nTesting ${account.role} account...`);
      
      // Go to login page
      await page.goto('https://kho1.pages.dev/login');
      await page.waitForLoadState('networkidle');
      
      // Fill form
      await page.locator('input[placeholder*="admin"]').fill(account.email);
      await page.locator('input[type="password"]').fill(account.password);
      
      // Submit
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(2000);
      await page.waitForLoadState('networkidle');
      
      const currentUrl = page.url();
      
      if (currentUrl.includes('/dashboard')) {
        console.log(`✅ ${account.role} login successful`);
        
        // Take screenshot for verification
        await page.screenshot({ 
          path: `test-results/final-${account.role}-dashboard.png`, 
          fullPage: true 
        });
        
        // Verify dashboard is accessible
        await expect(page.locator('h2')).toContainText('Tổng quan');
        
      } else {
        console.log(`❌ ${account.role} login failed`);
        const errors = await page.locator('.ant-alert-error').allTextContents();
        console.log(`${account.role} errors:`, errors);
      }
    }
  });
  
  test('Test form validation', async ({ page }) => {
    console.log('Testing form validation...');
    
    await page.goto('https://kho1.pages.dev/login');
    await page.waitForLoadState('networkidle');
    
    // Test empty form submission
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1000);
    
    // Check for validation errors
    const validationErrors = await page.locator('.ant-form-item-explain-error').allTextContents();
    console.log('Validation errors for empty form:', validationErrors);
    
    expect(validationErrors.length).toBeGreaterThan(0);
    expect(validationErrors.join(' ')).toContain('email');
    
    // Test invalid email
    await page.locator('input[placeholder*="admin"]').fill('invalid-email');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(2000);
    
    // Should show error message for invalid login
    const loginError = await page.locator('.ant-alert-error').textContent();
    console.log('Invalid email error:', loginError);
    
    // Test wrong password
    await page.locator('input[placeholder*="admin"]').fill('admin@khoaugment.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(2000);
    
    const wrongPasswordError = await page.locator('.ant-alert-error').textContent();
    console.log('Wrong password error:', wrongPasswordError);
    
    expect(wrongPasswordError).toBeTruthy();
  });
});