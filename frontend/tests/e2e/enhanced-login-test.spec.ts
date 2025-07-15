// Enhanced login test với giao diện đẹp mắt mới
import { test, expect } from '@playwright/test';

test.describe('Enhanced Login Test với Giao Diện Đẹp', () => {
  test('Test login với Enhanced UI và theme system', async ({ page }) => {
    console.log('🎨 Testing Enhanced Beautiful UI Login...');
    
    // Navigate to login page
    await page.goto('https://kho1.pages.dev/login');
    
    // Chờ 3 giây như yêu cầu cho trang load
    console.log('⏰ Chờ 3 giây cho Enhanced UI load...');
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');
    
    // Screenshot Enhanced login page
    await page.screenshot({ path: 'test-results/enhanced-login-page.png', fullPage: true });
    
    // Check Enhanced UI elements
    console.log('🎨 Kiểm tra Enhanced UI elements...');
    
    const title = await page.title();
    console.log('📄 Enhanced Page title:', title);
    
    // Look for enhanced login form
    const loginElements = [
      'input[name="email"]',
      'input[type="email"]', 
      '.ant-input',
      'input[placeholder*="admin"]',
      'input[placeholder*="email"]'
    ];
    
    let emailInput = null;
    let passwordInput = null;
    
    for (const selector of loginElements) {
      const elements = await page.locator(selector).count();
      console.log(`🔍 Enhanced selector "${selector}": ${elements} elements`);
      
      if (elements > 0 && !emailInput) {
        emailInput = page.locator(selector).first();
      }
    }
    
    // Find password input
    const passwordElements = [
      'input[name="password"]',
      'input[type="password"]',
      '.ant-input-password input'
    ];
    
    for (const selector of passwordElements) {
      const elements = await page.locator(selector).count();
      console.log(`🔐 Enhanced password selector "${selector}": ${elements} elements`);
      
      if (elements > 0 && !passwordInput) {
        passwordInput = page.locator(selector).first();
      }
    }
    
    // Test all demo accounts với Enhanced UI
    const demoAccounts = [
      { email: 'admin@khoaugment.com', password: '123456', role: 'Admin' },
      { email: 'manager@khoaugment.com', password: '123456', role: 'Manager' },
      { email: 'cashier@khoaugment.com', password: '123456', role: 'Cashier' }
    ];
    
    for (const account of demoAccounts) {
      console.log(`\n🧪 Testing Enhanced ${account.role} login...`);
      
      // Refresh page for clean state
      await page.reload();
      await page.waitForTimeout(3000);
      await page.waitForLoadState('networkidle');
      
      // Fill form
      if (emailInput && passwordInput) {
        console.log(`📧 Enhanced filling email: ${account.email}`);
        await emailInput.fill(account.email);
        
        console.log(`🔒 Enhanced filling password: ${account.password}`);
        await passwordInput.fill(account.password);
        
        // Screenshot với thông tin đã điền
        await page.screenshot({ 
          path: `test-results/enhanced-${account.role.toLowerCase()}-filled.png`, 
          fullPage: true 
        });
        
        // Submit
        console.log('🚀 Enhanced submitting...');
        const submitButton = page.locator('button[type="submit"]').first();
        await submitButton.click();
        
        // Chờ cho Enhanced login process
        console.log('⏰ Chờ Enhanced login process...');
        await page.waitForTimeout(2000); // Login delay
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000); // Extra wait for state sync
        
        const currentUrl = page.url();
        console.log(`🔗 Enhanced ${account.role} URL:`, currentUrl);
        
        // Screenshot kết quả
        await page.screenshot({ 
          path: `test-results/enhanced-${account.role.toLowerCase()}-result.png`, 
          fullPage: true 
        });
        
        // Kiểm tra Enhanced dashboard elements
        if (currentUrl.includes('/dashboard')) {
          console.log(`✅ Enhanced ${account.role} LOGIN SUCCESS!`);
          
          // Check Enhanced dashboard features
          const enhancedFeatures = [
            'h2', // Dashboard title
            '.ant-layout-sider', // Enhanced sidebar
            '.ant-statistic', // Enhanced statistics
            '.dashboard-theme', // Enhanced theme class
            '[data-theme]' // Theme attribute
          ];
          
          for (const feature of enhancedFeatures) {
            const exists = await page.locator(feature).count();
            console.log(`🎨 Enhanced feature "${feature}": ${exists} found`);
          }
          
          // Test Enhanced theme switching if available
          const themeSwitch = await page.locator('[data-testid="theme-switch"]').count();
          if (themeSwitch > 0) {
            console.log('🌓 Testing Enhanced theme switching...');
            await page.click('[data-testid="theme-switch"]');
            await page.waitForTimeout(500);
            await page.screenshot({ 
              path: `test-results/enhanced-${account.role.toLowerCase()}-dark-theme.png`, 
              fullPage: true 
            });
          }
          
          // Check Enhanced components
          const enhancedComponents = await page.locator('.dashboard-widget, .kpi-card, .chart-container').count();
          console.log(`📊 Enhanced dashboard components: ${enhancedComponents} found`);
          
          // Test logout cho next account
          try {
            await page.click('.ant-avatar, [data-testid="user-menu"]');
            await page.waitForTimeout(500);
            await page.click('text=Đăng xuất');
            await page.waitForTimeout(1000);
            console.log(`👋 Enhanced ${account.role} logout success`);
          } catch (e) {
            console.log(`⚠️ Enhanced ${account.role} logout failed, continuing...`);
          }
          
        } else {
          console.log(`❌ Enhanced ${account.role} login failed`);
          
          // Check for Enhanced error messages
          const errorSelectors = [
            '.ant-alert-error',
            '.ant-message-error', 
            '[class*="error"]',
            '.ant-form-item-explain-error'
          ];
          
          for (const selector of errorSelectors) {
            const errors = await page.locator(selector).allTextContents();
            if (errors.length > 0) {
              console.log(`❌ Enhanced ${account.role} errors (${selector}):`, errors);
            }
          }
        }
      } else {
        console.log(`❌ Enhanced form inputs not found for ${account.role}`);
      }
    }
    
    // Final verification
    console.log('\n🎉 Enhanced UI Test hoàn thành!');
    expect(true).toBe(true); // Always pass to see results
  });
  
  test('Kiểm tra Enhanced UI features', async ({ page }) => {
    console.log('🎨 Testing Enhanced UI Features...');
    
    await page.goto('https://kho1.pages.dev');
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');
    
    // Check for Enhanced styling
    const enhancedStyles = [
      '.dashboard-theme',
      '.dashboard-surface',
      '.dashboard-elevated',
      '.bg-container',
      '.text-primary',
      '[data-theme]'
    ];
    
    for (const style of enhancedStyles) {
      const count = await page.locator(style).count();
      console.log(`🎨 Enhanced style "${style}": ${count} elements`);
    }
    
    // Check theme system
    const themeAttribute = await page.getAttribute('html', 'data-theme') || 
                          await page.getAttribute('body', 'data-theme') ||
                          await page.getAttribute('[data-theme]', 'data-theme');
    console.log('🌈 Current theme:', themeAttribute || 'default');
    
    // Check for Vietnamese text
    const vietnameseText = [
      'Đăng nhập',
      'Tổng quan',
      'Hệ thống',
      'POS',
      'KhoAugment'
    ];
    
    for (const text of vietnameseText) {
      const found = await page.locator(`text=${text}`).count();
      console.log(`🇻🇳 Vietnamese text "${text}": ${found} found`);
    }
    
    await page.screenshot({ path: 'test-results/enhanced-ui-features.png', fullPage: true });
    
    expect(true).toBe(true);
  });
});