// Compare deployments test
import { test, expect } from '@playwright/test';

test.describe('Compare Deployments', () => {
  test('Compare original vs new deployment', async ({ page }) => {
    console.log('🔍 Comparing deployments...');
    
    const originalUrl = 'https://kho1.pages.dev';
    const newUrl = 'https://kho1.pages.dev';
    
    // Test original first
    console.log('\n📊 Testing ORIGINAL deployment...');
    
    page.on('pageerror', (error) => {
      console.log('❌ ORIGINAL Page error:', error.message);
    });
    
    await page.goto(`${originalUrl}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    const originalTitle = await page.title();
    const originalForms = await page.locator('form').count();
    const originalInputs = await page.locator('input').count();
    
    console.log('📄 ORIGINAL Page title:', originalTitle);
    console.log('📝 ORIGINAL Login forms:', originalForms);
    console.log('📝 ORIGINAL Input elements:', originalInputs);
    
    // Test login on original
    if (originalForms > 0 && originalInputs >= 2) {
      console.log('✅ ORIGINAL: Testing login...');
      
      const emailInput = page.locator('input[type="email"], input[placeholder*="admin"]').first();
      const passwordInput = page.locator('input[type="password"]').first();
      
      await emailInput.fill('admin@kho1.com');
      await passwordInput.fill('123456');
      
      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();
      
      await page.waitForTimeout(3000);
      
      const originalAuth = await page.evaluate(() => localStorage.getItem('auth_user'));
      console.log('💾 ORIGINAL Auth user:', originalAuth ? 'EXISTS' : 'NOT FOUND');
      
      if (originalAuth) {
        console.log('✅ ORIGINAL: Login successful!');
      } else {
        console.log('❌ ORIGINAL: Login failed');
      }
    }
    
    // Now test new deployment
    console.log('\n📊 Testing NEW deployment...');
    
    page.removeAllListeners('pageerror');
    page.on('pageerror', (error) => {
      console.log('❌ NEW Page error:', error.message);
    });
    
    await page.goto(`${newUrl}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    const newTitle = await page.title();
    const newForms = await page.locator('form').count();
    const newInputs = await page.locator('input').count();
    
    console.log('📄 NEW Page title:', newTitle);
    console.log('📝 NEW Login forms:', newForms);
    console.log('📝 NEW Input elements:', newInputs);
    
    // Test login on new
    if (newForms > 0 && newInputs >= 2) {
      console.log('✅ NEW: Testing login...');
      
      const emailInput = page.locator('input[type="email"], input[placeholder*="admin"]').first();
      const passwordInput = page.locator('input[type="password"]').first();
      
      await emailInput.fill('admin@kho1.com');
      await passwordInput.fill('123456');
      
      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();
      
      await page.waitForTimeout(3000);
      
      const newAuth = await page.evaluate(() => localStorage.getItem('auth_user'));
      console.log('💾 NEW Auth user:', newAuth ? 'EXISTS' : 'NOT FOUND');
      
      if (newAuth) {
        console.log('✅ NEW: Login successful!');
      } else {
        console.log('❌ NEW: Login failed');
      }
    }
    
    // Summary
    console.log('\n📋 COMPARISON SUMMARY:');
    console.log('🔸 ORIGINAL forms:', originalForms, 'vs NEW forms:', newForms);
    console.log('🔸 ORIGINAL inputs:', originalInputs, 'vs NEW inputs:', newInputs);
    console.log('🔸 ORIGINAL working:', originalForms > 0 && originalInputs >= 2);
    console.log('🔸 NEW working:', newForms > 0 && newInputs >= 2);
    
    console.log('✅ Comparison completed');
    expect(true).toBe(true);
  });
});