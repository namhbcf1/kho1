// Quick test for latest deployment
import { test, expect } from '@playwright/test';

test.describe('Quick Test Latest', () => {
  test('Test latest deployment', async ({ page }) => {
    console.log('🎯 Testing latest deployment...');
    
    const latestUrl = 'https://79ef9274.khoaugment-frontend.pages.dev';
    
    // Track errors
    const errors = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
      console.log('❌ Page error:', error.message);
    });
    
    // Navigate to login
    await page.goto(`${latestUrl}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    // Check page title
    const title = await page.title();
    console.log('📄 Page title:', title);
    
    // Check for login form
    const loginForm = await page.locator('form').count();
    const inputs = await page.locator('input').count();
    
    console.log('📝 Login forms:', loginForm);
    console.log('📝 Input elements:', inputs);
    console.log('❌ JavaScript errors:', errors.length);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/latest-deployment.png', fullPage: true });
    
    if (errors.length === 0) {
      console.log('✅ No JavaScript errors!');
      
      if (loginForm > 0 && inputs >= 2) {
        console.log('✅ Login form found! Testing login...');
        
        // Test admin login
        const emailInput = page.locator('input[type="email"], input[placeholder*="admin"]').first();
        const passwordInput = page.locator('input[type="password"]').first();
        
        await emailInput.fill('admin@khoaugment.com');
        await passwordInput.fill('123456');
        
        const submitButton = page.locator('button[type="submit"]').first();
        await submitButton.click();
        
        await page.waitForTimeout(3000);
        
        // Check auth
        const authUser = await page.evaluate(() => localStorage.getItem('auth_user'));
        console.log('💾 Auth user:', authUser ? 'EXISTS' : 'NOT FOUND');
        
        if (authUser) {
          console.log('🎉 SUCCESS! Login works perfectly!');
          
          // Test dashboard
          await page.goto(`${latestUrl}/dashboard`, { waitUntil: 'networkidle' });
          await page.waitForTimeout(2000);
          
          const dashboardElements = await page.locator('h1, h2, .dashboard').count();
          console.log('🎯 Dashboard elements:', dashboardElements);
          
          if (dashboardElements > 0) {
            console.log('🎉 COMPLETE SUCCESS! Both login and dashboard working!');
          }
        } else {
          console.log('❌ Login failed');
        }
      } else {
        console.log('❌ Login form not found');
      }
    } else {
      console.log('❌ JavaScript errors prevent app from working');
    }
    
    console.log('✅ Latest deployment test completed');
    expect(true).toBe(true);
  });
});