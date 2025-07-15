// Debug deployment test
import { test, expect } from '@playwright/test';

test.describe('Debug Deployment Test', () => {
  test('Debug deployment issues', async ({ page }) => {
    console.log('🔍 Debugging deployment issues...');
    
    const newUrl = 'https://1ef1c9ee.khoaugment-frontend.pages.dev';
    
    // Listen for console logs and errors
    page.on('console', (msg) => {
      console.log('📊 Console:', msg.type(), msg.text());
    });
    
    page.on('pageerror', (error) => {
      console.log('❌ Page error:', error.message);
    });
    
    page.on('response', (response) => {
      if (!response.ok()) {
        console.log('❌ Failed request:', response.url(), response.status());
      }
    });
    
    // Navigate to login
    console.log('🌐 Navigating to login page...');
    await page.goto(`${newUrl}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(5000);
    
    // Check page title
    const title = await page.title();
    console.log('📄 Page title:', title);
    
    // Check if React app is loaded
    const reactRoot = await page.locator('#root').count();
    console.log('⚛️ React root element:', reactRoot);
    
    // Check if any scripts loaded
    const scripts = await page.locator('script').count();
    console.log('📜 Scripts found:', scripts);
    
    // Check page content
    const pageContent = await page.textContent('body');
    console.log('📄 Page has content:', pageContent && pageContent.length > 100);
    
    // Check for specific text
    const hasLoginText = pageContent?.includes('Đăng nhập') || pageContent?.includes('login');
    console.log('🔐 Has login text:', hasLoginText);
    
    // Check for form elements
    const inputs = await page.locator('input').count();
    const buttons = await page.locator('button').count();
    const forms = await page.locator('form').count();
    
    console.log('📝 Input elements:', inputs);
    console.log('🔘 Button elements:', buttons);
    console.log('📋 Form elements:', forms);
    
    // Check if it's showing loading or error
    const loadingText = pageContent?.includes('loading') || pageContent?.includes('đang tải');
    const errorText = pageContent?.includes('error') || pageContent?.includes('lỗi');
    
    console.log('⏳ Has loading text:', loadingText);
    console.log('❌ Has error text:', errorText);
    
    // Take full page screenshot
    await page.screenshot({ path: 'test-results/debug-deployment-full.png', fullPage: true });
    
    // Check if it's just blank
    const bodyInnerHTML = await page.locator('body').innerHTML();
    console.log('📄 Body HTML length:', bodyInnerHTML.length);
    
    // Check network tab for failed resources
    const resources = await page.evaluate(() => {
      const entries = performance.getEntriesByType('resource');
      return entries.map(entry => ({
        name: entry.name,
        status: entry.responseStatus || 'unknown'
      }));
    });
    
    console.log('🌐 Resources loaded:', resources.length);
    
    // Check for specific failed resources
    const failedResources = resources.filter(r => r.status >= 400);
    if (failedResources.length > 0) {
      console.log('❌ Failed resources:', failedResources);
    }
    
    console.log('✅ Debug test completed');
    expect(true).toBe(true);
  });
});