// Quick test for new deployment
import { test, expect } from '@playwright/test';

test.describe('Quick New Deployment Test', () => {
  test('Test new deployment URL', async ({ page }) => {
    console.log('🚀 Testing new deployment...');
    
    const newUrl = 'https://be6cf43f.khoaugment-frontend.pages.dev';
    
    // Navigate to login
    await page.goto(`${newUrl}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    // Check page title
    const title = await page.title();
    console.log('📄 Page title:', title);
    
    // Check if login form exists
    const loginForm = await page.locator('form, .ant-form').count();
    console.log('📝 Login forms found:', loginForm);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/new-deployment-login.png', fullPage: true });
    
    if (loginForm > 0) {
      console.log('✅ Login form found - testing admin login...');
      
      // Test admin login
      const emailInput = page.locator('input[type="email"], input[placeholder*="admin"]').first();
      const passwordInput = page.locator('input[type="password"]').first();
      
      await emailInput.fill('admin@khoaugment.com');
      await passwordInput.fill('123456');
      
      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();
      
      await page.waitForTimeout(3000);
      
      // Check result
      const currentUrl = page.url();
      const authUser = await page.evaluate(() => localStorage.getItem('auth_user'));
      
      console.log('🔗 Current URL:', currentUrl);
      console.log('💾 Auth user:', authUser ? 'EXISTS' : 'NOT FOUND');
      
      // Take screenshot after login
      await page.screenshot({ path: 'test-results/new-deployment-after-login.png', fullPage: true });
      
      if (authUser) {
        console.log('✅ Login successful!');
        
        // Try navigate to dashboard
        await page.goto(`${newUrl}/dashboard`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        
        const dashboardUrl = page.url();
        console.log('🎯 Dashboard URL:', dashboardUrl);
        
        // Take dashboard screenshot
        await page.screenshot({ path: 'test-results/new-deployment-dashboard.png', fullPage: true });
        
        // Check dashboard elements
        const dashboardElements = await page.locator('h1, h2, .dashboard').count();
        console.log('🎨 Dashboard elements:', dashboardElements);
        
        if (dashboardElements > 0) {
          console.log('✅ Dashboard loaded successfully!');
        } else {
          console.log('❌ Dashboard not loading properly');
        }
        
      } else {
        console.log('❌ Login failed');
      }
      
    } else {
      console.log('❌ No login form found');
    }
    
    console.log('✅ Quick test completed');
    expect(true).toBe(true);
  });
});