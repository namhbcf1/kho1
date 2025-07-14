// Dashboard navigation and functionality tests
import { test, expect } from '@playwright/test';

// Helper function to login
async function login(page: any) {
  await page.goto('/auth/login');
  await page.waitForLoadState('networkidle');
  
  // Wait for login form to be visible
  await page.waitForSelector('form[name="login"]', { timeout: 10000 });
  
  // Fill email field using different selector strategies
  const emailInput = page.locator('input[name="email"]').or(page.locator('form input').first());
  await emailInput.waitFor({ timeout: 10000 });
  await emailInput.fill('admin@khoaugment.com');
  
  // Fill password field
  const passwordInput = page.locator('input[type="password"]').or(page.locator('form input').nth(1));
  await passwordInput.waitFor({ timeout: 10000 });
  await passwordInput.fill('123456');
  
  // Click login button
  const loginButton = page.locator('button[type="submit"]').or(page.locator('button:has-text("Đăng nhập")'));
  await loginButton.click();
  await page.waitForTimeout(5000); // Wait for authentication and redirect
}

test.describe('Dashboard Navigation Tests', () => {
  test('should login and access dashboard', async ({ page }) => {
    await login(page);
    
    // Should be redirected to dashboard
    await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 10000 });
    
    // Check for dashboard content
    await expect(page.locator('h1, h2, h3').filter({ hasText: /dashboard|tổng quan|bảng điều khiển/i })).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to POS page', async ({ page }) => {
    await login(page);
    
    // Wait for dashboard to load
    await page.waitForURL(/.*dashboard.*/, { timeout: 10000 });
    
    // Look for POS navigation link
    const posLink = page.locator('a[href="/pos"]').or(
      page.locator('a:has-text("POS")').or(
        page.locator('a:has-text("Bán hàng")').or(
          page.locator('a:has-text("Terminal")')
        )
      )
    );
    
    await posLink.first().click();
    await page.waitForTimeout(3000);
    
    // Should navigate to POS page
    await expect(page).toHaveURL(/.*pos.*/, { timeout: 10000 });
    
    // Check for POS content
    const posContent = page.locator('h1, h2, h3').filter({ hasText: /pos|bán hàng|terminal/i });
    await expect(posContent).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to Products page', async ({ page }) => {
    await login(page);
    await page.waitForURL(/.*dashboard.*/, { timeout: 10000 });
    
    // Look for Products navigation link
    const productsLink = page.locator('a[href="/products"]').or(
      page.locator('a:has-text("Products")').or(
        page.locator('a:has-text("Sản phẩm")').or(
          page.locator('a:has-text("Quản lý sản phẩm")')
        )
      )
    );
    
    await productsLink.first().click();
    await page.waitForTimeout(3000);
    
    // Should navigate to Products page
    await expect(page).toHaveURL(/.*products.*/, { timeout: 10000 });
    
    // Check for Products content
    const productsContent = page.locator('h1, h2, h3').filter({ hasText: /products|sản phẩm|quản lý sản phẩm/i });
    await expect(productsContent).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to Customers page', async ({ page }) => {
    await login(page);
    await page.waitForURL(/.*dashboard.*/, { timeout: 10000 });
    
    // Look for Customers navigation link
    const customersLink = page.locator('a[href="/customers"]').or(
      page.locator('a:has-text("Customers")').or(
        page.locator('a:has-text("Khách hàng")').or(
          page.locator('a:has-text("Quản lý khách hàng")')
        )
      )
    );
    
    await customersLink.first().click();
    await page.waitForTimeout(3000);
    
    // Should navigate to Customers page
    await expect(page).toHaveURL(/.*customers.*/, { timeout: 10000 });
    
    // Check for Customers content
    const customersContent = page.locator('h1, h2, h3').filter({ hasText: /customers|khách hàng|quản lý khách hàng/i });
    await expect(customersContent).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to Orders page', async ({ page }) => {
    await login(page);
    await page.waitForURL(/.*dashboard.*/, { timeout: 10000 });
    
    // Look for Orders navigation link
    const ordersLink = page.locator('a[href="/orders"]').or(
      page.locator('a:has-text("Orders")').or(
        page.locator('a:has-text("Đơn hàng")').or(
          page.locator('a:has-text("Quản lý đơn hàng")')
        )
      )
    );
    
    await ordersLink.first().click();
    await page.waitForTimeout(3000);
    
    // Should navigate to Orders page
    await expect(page).toHaveURL(/.*orders.*/, { timeout: 10000 });
    
    // Check for Orders content
    const ordersContent = page.locator('h1, h2, h3').filter({ hasText: /orders|đơn hàng|quản lý đơn hàng/i });
    await expect(ordersContent).toBeVisible({ timeout: 10000 });
  });

  test('should display sidebar navigation menu', async ({ page }) => {
    await login(page);
    await page.waitForURL(/.*dashboard.*/, { timeout: 10000 });
    
    // Check for sidebar navigation
    const sidebar = page.locator('.ant-layout-sider').or(
      page.locator('[class*="sidebar"]').or(
        page.locator('nav').or(
          page.locator('[role="navigation"]')
        )
      )
    );
    
    await expect(sidebar).toBeVisible({ timeout: 10000 });
    
    // Check for navigation menu items
    const menuItems = [
      'Dashboard',
      'Tổng quan', 
      'POS',
      'Bán hàng',
      'Products',
      'Sản phẩm',
      'Customers',
      'Khách hàng',
      'Orders',
      'Đơn hàng'
    ];
    
    let foundItems = 0;
    for (const item of menuItems) {
      const menuItem = page.locator(`text=${item}`).or(page.locator(`[title="${item}"]`));
      if (await menuItem.count() > 0) {
        foundItems++;
      }
    }
    
    // Should find at least some navigation items
    expect(foundItems).toBeGreaterThan(2);
  });

  test('should display dashboard statistics cards', async ({ page }) => {
    await login(page);
    await page.waitForURL(/.*dashboard.*/, { timeout: 10000 });
    
    // Check for statistics cards
    const statsCards = page.locator('.ant-card').or(
      page.locator('[class*="card"]').or(
        page.locator('[class*="statistic"]')
      )
    );
    
    await expect(statsCards.first()).toBeVisible({ timeout: 10000 });
    
    // Should have multiple cards
    const cardCount = await statsCards.count();
    expect(cardCount).toBeGreaterThan(0);
  });

  test('should test POS functionality', async ({ page }) => {
    await login(page);
    
    // Navigate to POS
    await page.goto('/pos');
    await page.waitForLoadState('networkidle');
    
    // Check for POS components
    const productGrid = page.locator('[class*="product"]').or(
      page.locator('[class*="grid"]').or(
        page.locator('button:has-text("Thêm")')
      )
    );
    
    // Check for shopping cart
    const shoppingCart = page.locator('[class*="cart"]').or(
      page.locator('text=Giỏ hàng').or(
        page.locator('text=Shopping Cart')
      )
    );
    
    // At least one of these should be visible
    const posComponentVisible = await productGrid.count() > 0 || await shoppingCart.count() > 0;
    expect(posComponentVisible).toBeTruthy();
  });

  test('should test Products page functionality', async ({ page }) => {
    await login(page);
    
    // Navigate to Products
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    
    // Check for products table or list
    const productsTable = page.locator('.ant-table').or(
      page.locator('table').or(
        page.locator('[class*="product"]')
      )
    );
    
    await expect(productsTable.first()).toBeVisible({ timeout: 10000 });
    
    // Check for add product button
    const addButton = page.locator('button:has-text("Thêm")').or(
      page.locator('button:has-text("Add")').or(
        page.locator('[class*="add"]')
      )
    );
    
    // Should be able to add products
    const addButtonVisible = await addButton.count() > 0;
    expect(addButtonVisible).toBeTruthy();
  });
});