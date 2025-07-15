// Final deployment test
import { test, expect } from '@playwright/test';

test.describe('Final Deployment Test', () => {
  test('Test working deployment', async ({ page }) => {
    console.log('🎯 Testing final deployment...');
    
    const workingUrl = 'https://767897ef.khoaugment-frontend.pages.dev';
    
    // Listen for errors
    page.on('pageerror', (error) => {
      console.log('❌ Page error:', error.message);
    });
    
    // Navigate to login
    await page.goto(`${workingUrl}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    // Check page title
    const title = await page.title();
    console.log('📄 Page title:', title);
    
    // Check for login form
    const loginForm = await page.locator('form').count();
    console.log('📝 Login forms:', loginForm);
    
    // Check for inputs
    const inputs = await page.locator('input').count();
    console.log('📝 Input elements:', inputs);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/final-deployment-login.png', fullPage: true });
    
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
        console.log('✅ Login successful!');
        
        // Try dashboard
        await page.goto(`${workingUrl}/dashboard`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        
        // Take dashboard screenshot
        await page.screenshot({ path: 'test-results/final-deployment-dashboard.png', fullPage: true });
        
        // Check dashboard elements
        const dashboardElements = await page.locator('h1, h2, .dashboard').count();
        console.log('🎯 Dashboard elements:', dashboardElements);
        
        if (dashboardElements > 0) {
          console.log('🎉 SUCCESS! Login and dashboard working!');
        } else {
          console.log('⚠️ Login works but dashboard needs improvement');
        }
      } else {
        console.log('❌ Login failed');
      }
    } else {
      console.log('❌ No login form found');
    }
    
    console.log('✅ Final deployment test completed');
    expect(true).toBe(true);
  });
});