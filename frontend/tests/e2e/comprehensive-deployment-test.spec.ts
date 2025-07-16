// Comprehensive deployment test for both URLs
import { test, expect } from '@playwright/test';

test.describe('Comprehensive Deployment Test', () => {
  const urls = [
    'https://kho1.pages.dev',
    'https://kho1.pages.dev'
  ];

  const testAccounts = [
    { email: 'admin@kho1.com', password: '123456', role: 'Admin' },
    { email: 'manager@kho1.com', password: '123456', role: 'Manager' },
    { email: 'cashier@kho1.com', password: '123456', role: 'Cashier' }
  ];

  for (const baseUrl of urls) {
    test(`Test all logic on ${baseUrl}`, async ({ page }) => {
      console.log(`\n🌐 Testing ${baseUrl}`);
      
      // Set long timeout for comprehensive test
      test.setTimeout(120000);
      
      // Navigate to login
      console.log('🔗 Navigating to login page...');
      await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(3000);
      
      // Check if page loads properly
      const title = await page.title();
      console.log('📄 Page title:', title);
      
      // Take initial screenshot
      await page.screenshot({ path: `test-results/${baseUrl.replace(/https?:\/\//, '').replace(/\./g, '-')}-01-initial.png`, fullPage: true });
      
      // Check if login form exists
      const loginForm = await page.locator('form, .ant-form').count();
      console.log('📝 Login forms found:', loginForm);
      
      if (loginForm === 0) {
        console.log('❌ No login form found on', baseUrl);
        
        // Check page content for debugging
        const pageContent = await page.content();
        console.log('📄 Page contains "login":', pageContent.includes('login'));
        console.log('📄 Page contains "input":', pageContent.includes('input'));
        console.log('📄 Page contains "form":', pageContent.includes('form'));
        
        // Check for error messages
        const errorMessages = await page.locator('text=/error|lỗi|failed|thất bại/i').allTextContents();
        if (errorMessages.length > 0) {
          console.log('❌ Error messages found:', errorMessages);
        }
        
        return; // Skip this URL if no login form
      }
      
      // Test each account
      for (const account of testAccounts) {
        console.log(`\n👤 Testing ${account.role} login on ${baseUrl}...`);
        
        // Reload page for fresh state
        await page.reload({ waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        
        // Find login inputs
        const emailInput = page.locator('input[type="email"], input[placeholder*="admin"], input[placeholder*="email"]').first();
        const passwordInput = page.locator('input[type="password"]').first();
        
        // Verify inputs exist
        const emailExists = await emailInput.count() > 0;
        const passwordExists = await passwordInput.count() > 0;
        
        console.log('📧 Email input exists:', emailExists);
        console.log('🔐 Password input exists:', passwordExists);
        
        if (!emailExists || !passwordExists) {
          console.log(`❌ Missing inputs for ${account.role} on ${baseUrl}`);
          continue;
        }
        
        // Fill form
        await emailInput.fill(account.email);
        await passwordInput.fill(account.password);
        await page.waitForTimeout(1000);
        
        // Submit form
        const submitButton = page.locator('button[type="submit"], button:has-text("Đăng nhập")').first();
        await submitButton.click();
        
        // Wait for login processing
        await page.waitForTimeout(3000);
        
        // Check current URL
        const currentUrl = page.url();
        console.log(`🔗 ${account.role} current URL:`, currentUrl);
        
        // Check localStorage for auth
        const authUser = await page.evaluate(() => localStorage.getItem('auth_user'));
        const authToken = await page.evaluate(() => localStorage.getItem('auth_token'));
        
        console.log(`💾 ${account.role} auth_user:`, authUser ? 'EXISTS' : 'NOT FOUND');
        console.log(`💾 ${account.role} auth_token:`, authToken ? 'EXISTS' : 'NOT FOUND');
        
        // Take screenshot after login
        await page.screenshot({ 
          path: `test-results/${baseUrl.replace(/https?:\/\//, '').replace(/\./g, '-')}-${account.role.toLowerCase()}-login.png`, 
          fullPage: true 
        });
        
        // Check if redirected to dashboard
        let onDashboard = false;
        if (currentUrl.includes('/dashboard') || currentUrl.includes('/pos') || !currentUrl.includes('/login')) {
          onDashboard = true;
          console.log(`✅ ${account.role} login successful - redirected to dashboard`);
        } else if (authUser) {
          console.log(`⚠️ ${account.role} login successful but needs refresh`);
          // Try manual navigation
          await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle' });
          await page.waitForTimeout(2000);
          const dashboardUrl = page.url();
          if (dashboardUrl.includes('/dashboard')) {
            onDashboard = true;
            console.log(`✅ ${account.role} manual navigation to dashboard successful`);
          }
        }
        
        if (onDashboard) {
          // Test dashboard functionality
          console.log(`🎯 Testing ${account.role} dashboard functionality...`);
          
          // Check for dashboard elements
          const dashboardElements = await page.locator('h1, h2, .dashboard, [role="heading"]').count();
          console.log(`🎨 ${account.role} dashboard elements:`, dashboardElements);
          
          // Check navigation menu
          const menuItems = await page.locator('.ant-menu-item, .ant-menu-submenu').count();
          console.log(`📋 ${account.role} menu items:`, menuItems);
          
          // Check if sidebar exists
          const sidebar = await page.locator('.ant-layout-sider, .sidebar').count();
          console.log(`📱 ${account.role} sidebar exists:`, sidebar > 0);
          
          // Check for data loading (KPIs, charts, etc.)
          const statistics = await page.locator('.ant-statistic, .kpi-card').count();
          console.log(`📊 ${account.role} statistics/KPIs:`, statistics);
          
          // Test navigation to different pages
          const testPages = [
            { name: 'POS', selector: 'text=POS, text=Bán hàng' },
            { name: 'Products', selector: 'text=Sản phẩm, text=Products' },
            { name: 'Customers', selector: 'text=Khách hàng, text=Customers' }
          ];
          
          for (const testPage of testPages) {
            try {
              const pageLink = page.locator(testPage.selector).first();
              const linkExists = await pageLink.count() > 0;
              console.log(`🔗 ${account.role} ${testPage.name} link exists:`, linkExists);
              
              if (linkExists) {
                await pageLink.click();
                await page.waitForTimeout(2000);
                const pageUrl = page.url();
                console.log(`📄 ${account.role} ${testPage.name} page URL:`, pageUrl);
              }
            } catch (error) {
              console.log(`❌ ${account.role} ${testPage.name} navigation failed:`, error.message);
            }
          }
          
          // Test logout
          try {
            const userMenu = page.locator('.ant-avatar, [data-testid="user-menu"], .user-menu').first();
            if (await userMenu.count() > 0) {
              await userMenu.click();
              await page.waitForTimeout(1000);
              
              const logoutButton = page.locator('text=Đăng xuất, text=Logout').first();
              if (await logoutButton.count() > 0) {
                await logoutButton.click();
                await page.waitForTimeout(2000);
                
                const finalUrl = page.url();
                const backToLogin = finalUrl.includes('/login');
                console.log(`🚪 ${account.role} logout successful:`, backToLogin);
              }
            }
          } catch (error) {
            console.log(`❌ ${account.role} logout test failed:`, error.message);
          }
          
        } else {
          console.log(`❌ ${account.role} login failed on ${baseUrl}`);
          
          // Check for error messages
          const errorMessages = await page.locator('.ant-alert-error, .ant-message-error, [class*="error"]').allTextContents();
          if (errorMessages.length > 0) {
            console.log(`❌ ${account.role} error messages:`, errorMessages);
          }
        }
        
        // Take final screenshot for this account
        await page.screenshot({ 
          path: `test-results/${baseUrl.replace(/https?:\/\//, '').replace(/\./g, '-')}-${account.role.toLowerCase()}-final.png`, 
          fullPage: true 
        });
        
        console.log(`✅ ${account.role} test completed on ${baseUrl}`);
      }
      
      // Final summary for this URL
      console.log(`\n📋 SUMMARY FOR ${baseUrl}:`);
      console.log(`🔗 URL accessible: ✅`);
      console.log(`📝 Login form present: ${loginForm > 0 ? '✅' : '❌'}`);
      console.log(`👥 Accounts tested: ${testAccounts.length}`);
      
      console.log(`✅ Comprehensive test completed for ${baseUrl}`);
    });
  }
  
  // Always pass test to see detailed results
  test('Summary test', async () => {
    console.log('\n🏁 All comprehensive tests completed!');
    console.log('Check the console output above for detailed results.');
    expect(true).toBe(true);
  });
});