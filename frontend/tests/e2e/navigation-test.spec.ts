// Quick navigation test
import { test, expect } from '@playwright/test';

test('should test basic navigation', async ({ page }) => {
  // Go to the deployed site
  await page.goto('https://9c4ef69c.kho1.pages.dev');
  
  // Should redirect to login page
  await expect(page).toHaveURL(/.*auth\/login.*/, { timeout: 10000 });
  
  // Wait for login form
  await page.waitForSelector('form', { timeout: 10000 });
  
  // Fill login form - try different selectors
  const emailField = page.locator('input').first();
  await emailField.fill('admin@khoaugment.com');
  
  const passwordField = page.locator('input[type="password"]').or(page.locator('input').nth(1));
  await passwordField.fill('123456');
  
  // Click login button
  const loginButton = page.locator('button[type="submit"]').or(page.locator('button:has-text("Đăng nhập")'));
  await loginButton.click();
  
  // Wait for redirect to dashboard
  await page.waitForTimeout(5000);
  
  // Should be on dashboard
  await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 10000 });
  
  // Test navigation to POS
  const posMenuItem = page.locator('text=Bán hàng').or(page.locator('text=POS'));
  await posMenuItem.first().click();
  await page.waitForTimeout(2000);
  
  // Should navigate to POS
  await expect(page).toHaveURL(/.*pos.*/, { timeout: 5000 });
  
  // Test navigation to Products
  const productsMenuItem = page.locator('text=Sản phẩm').or(page.locator('text=Products'));
  await productsMenuItem.first().click();
  await page.waitForTimeout(2000);
  
  // Should navigate to Products
  await expect(page).toHaveURL(/.*products.*/, { timeout: 5000 });
});