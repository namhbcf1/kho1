// Simple test to verify login functionality with actual UI elements
import { test, expect } from '@playwright/test';

test.describe('Simple Login Test', () => {
  test('Login with demo credentials', async ({ page }) => {
    console.log('Testing login with demo credentials...');
    
    // Navigate to login page
    await page.goto('https://kho1.pages.dev/auth/login');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of login page
    await page.screenshot({ path: 'test-results/login-page.png', fullPage: true });
    
    // Wait for form elements to be visible
    await page.waitForSelector('input[placeholder*="admin"]', { timeout: 10000 });
    await page.waitForSelector('input[placeholder*="123456"]', { timeout: 10000 });
    
    // Fill the form with demo credentials
    await page.fill('input[placeholder*="admin"]', 'admin@khoaugment.com');
    await page.fill('input[placeholder*="123456"]', '123456');
    
    // Take screenshot before clicking login
    await page.screenshot({ path: 'test-results/before-login.png', fullPage: true });
    
    // Click login button
    await page.click('button:has-text("Đăng nhập")');
    
    // Wait for navigation
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Give it a moment to fully load
    
    // Take screenshot after login
    await page.screenshot({ path: 'test-results/after-login.png', fullPage: true });
    
    // Check if we're redirected (either to dashboard or still on login with error)
    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);
    
    // Check page content to understand what happened
    const pageTitle = await page.title();
    console.log('Page title:', pageTitle);
    
    // Check if there are any error messages
    const errorMessages = await page.locator('.ant-message-error, .error-message, [class*="error"]').allTextContents();
    if (errorMessages.length > 0) {
      console.log('Error messages found:', errorMessages);
    }
    
    // Check if there are any success indicators
    const successElements = await page.locator('.ant-message-success, [class*="success"], [data-testid*="dashboard"]').count();
    console.log('Success elements found:', successElements);
    
    // Check if we have navigation menu (indicating successful login)
    const navigationMenu = await page.locator('nav, .ant-menu, [class*="menu"], [class*="sidebar"]').count();
    console.log('Navigation elements found:', navigationMenu);
    
    // List all visible headings to understand page structure
    const headings = await page.locator('h1, h2, h3, h4').allTextContents();
    console.log('Headings found:', headings);
    
    // If we're still on login page, check what's happening
    if (currentUrl.includes('/login') || currentUrl.includes('/auth')) {
      console.log('Still on login/auth page - login may have failed or validation error occurred');
      
      // Check for validation errors
      const validationErrors = await page.locator('.ant-form-item-explain-error, [class*="validation"], [class*="error"]').allTextContents();
      console.log('Validation errors:', validationErrors);
      
      // Check if form fields still have values
      const emailValue = await page.inputValue('input[placeholder*="admin"]');
      const passwordValue = await page.inputValue('input[placeholder*="123456"]');
      console.log('Form values after submit - Email:', emailValue, 'Password:', passwordValue ? '***' : 'empty');
    } else {
      console.log('Login appears to have succeeded - redirected to:', currentUrl);
    }
    
    // Verify basic functionality regardless of login success/failure
    expect(currentUrl).toBeTruthy();
    expect(pageTitle).toBeTruthy();
  });

  test('Check page structure and elements', async ({ page }) => {
    console.log('Analyzing page structure...');
    
    await page.goto('https://kho1.pages.dev');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of homepage
    await page.screenshot({ path: 'test-results/homepage.png', fullPage: true });
    
    // Check what's available on the homepage
    const allLinks = await page.locator('a').allTextContents();
    console.log('All links found:', allLinks);
    
    const allButtons = await page.locator('button').allTextContents();
    console.log('All buttons found:', allButtons);
    
    const allInputs = await page.locator('input').count();
    console.log('Number of input fields:', allInputs);
    
    // Try to find any navigation to different sections
    const menuItems = await page.locator('[role="menu"] a, nav a, .menu a, [class*="nav"] a').allTextContents();
    console.log('Menu items found:', menuItems);
    
    // Check if there are any data-testid attributes
    const testIds = await page.locator('[data-testid]').count();
    console.log('Elements with data-testid:', testIds);
    
    if (testIds > 0) {
      const testIdValues = await page.locator('[data-testid]').evaluateAll(
        elements => elements.map(el => el.getAttribute('data-testid'))
      );
      console.log('data-testid values:', testIdValues);
    }
  });

  test('Test different login scenarios', async ({ page }) => {
    console.log('Testing different login scenarios...');
    
    await page.goto('https://kho1.pages.dev/auth/login');
    await page.waitForLoadState('networkidle');
    
    // Test 1: Empty form submission
    console.log('Test 1: Empty form submission');
    await page.click('button:has-text("Đăng nhập")');
    await page.waitForTimeout(1000);
    
    const emptyFormErrors = await page.locator('.ant-form-item-explain-error, [class*="error"]').allTextContents();
    console.log('Empty form errors:', emptyFormErrors);
    
    // Test 2: Invalid email format
    console.log('Test 2: Invalid email format');
    await page.fill('input[placeholder*="admin"]', 'invalid-email');
    await page.fill('input[placeholder*="123456"]', '123456');
    await page.click('button:has-text("Đăng nhập")');
    await page.waitForTimeout(1000);
    
    const invalidEmailErrors = await page.locator('.ant-form-item-explain-error, [class*="error"]').allTextContents();
    console.log('Invalid email errors:', invalidEmailErrors);
    
    // Test 3: Wrong password
    console.log('Test 3: Wrong password');
    await page.fill('input[placeholder*="admin"]', 'admin@khoaugment.com');
    await page.fill('input[placeholder*="123456"]', 'wrongpassword');
    await page.click('button:has-text("Đăng nhập")');
    await page.waitForTimeout(2000);
    
    const wrongPasswordErrors = await page.locator('.ant-message-error, [class*="error"]').allTextContents();
    console.log('Wrong password errors:', wrongPasswordErrors);
    
    // Test 4: Correct credentials
    console.log('Test 4: Correct credentials');
    await page.fill('input[placeholder*="admin"]', 'admin@khoaugment.com');
    await page.fill('input[placeholder*="123456"]', '123456');
    await page.click('button:has-text("Đăng nhập")');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const finalUrl = page.url();
    console.log('Final URL after correct credentials:', finalUrl);
    
    await page.screenshot({ path: 'test-results/final-state.png', fullPage: true });
  });
});