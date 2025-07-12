// E2E tests for authentication flow
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
  });

  test('should display login form', async ({ page }) => {
    await expect(page.locator('h3')).toContainText('Đăng nhập');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.ant-form-item-explain-error')).toContainText('Vui lòng nhập email!');
  });

  test('should show error for invalid email', async ({ page }) => {
    await page.fill('input[type="email"]', 'invalid-email');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.ant-form-item-explain-error')).toContainText('Email không hợp lệ!');
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.fill('input[type="email"]', 'admin@khoaugment.com');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h2')).toContainText('Tổng quan hệ thống');
  });

  test('should navigate to register page', async ({ page }) => {
    await page.click('text=Đăng ký ngay');
    
    await expect(page).toHaveURL('/auth/register');
    await expect(page.locator('h3')).toContainText('Đăng ký tài khoản');
  });

  test('should navigate to forgot password page', async ({ page }) => {
    await page.click('text=Quên mật khẩu?');
    
    await expect(page).toHaveURL('/auth/forgot-password');
  });

  test('should remember login checkbox work', async ({ page }) => {
    const checkbox = page.locator('input[type="checkbox"]');
    await expect(checkbox).toBeChecked(); // Should be checked by default
    
    await checkbox.uncheck();
    await expect(checkbox).not.toBeChecked();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.fill('input[type="email"]', 'admin@khoaugment.com');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/dashboard');
    
    // Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Đăng xuất');
    
    // Should redirect to login
    await expect(page).toHaveURL('/auth/login');
  });
});

test.describe('Registration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/register');
  });

  test('should display registration form', async ({ page }) => {
    await expect(page.locator('h3')).toContainText('Đăng ký tài khoản');
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
  });

  test('should validate password confirmation', async ({ page }) => {
    await page.fill('input[name="password"]', 'Password123');
    await page.fill('input[name="confirmPassword"]', 'DifferentPassword');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.ant-form-item-explain-error')).toContainText('Mật khẩu xác nhận không khớp');
  });

  test('should validate Vietnamese phone number', async ({ page }) => {
    await page.fill('input[name="phone"]', '123456789');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.ant-form-item-explain-error')).toContainText('Số điện thoại không hợp lệ');
  });

  test('should register with valid data', async ({ page }) => {
    await page.fill('input[name="name"]', 'Nguyễn Văn Test');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="phone"]', '0901234567');
    await page.fill('input[name="password"]', 'Password123');
    await page.fill('input[name="confirmPassword"]', 'Password123');
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard after successful registration
    await expect(page).toHaveURL('/dashboard');
  });
});
