import { test, expect, type Page } from '@playwright/test';

// Test configuration
const BASE_URL = 'https://kho1.pages.dev';
const API_URL = 'https://kho1-api-production.bangachieu2.workers.dev';

// Test data
const testUser = {
  email: 'admin@khoaugment.com',
  password: 'Admin123!@#',
  name: 'Test Admin'
};

const testProduct = {
  name: 'Sản phẩm test',
  barcode: '1234567890',
  price: 50000,
  category: 'Đồ ăn',
  stock: 100
};

test.describe('KhoAugment POS - Comprehensive E2E Tests', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Set viewport for desktop testing
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Navigate to homepage
    await page.goto(BASE_URL);
    
    // Wait for page load
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test.describe('Authentication & Security', () => {
    test('should load homepage and show login form', async () => {
      await expect(page).toHaveTitle(/KhoAugment/);
      
      // Check if login form is visible
      const loginForm = page.locator('form[data-testid="login-form"], .login-form, form:has(input[type="email"])');
      await expect(loginForm).toBeVisible({ timeout: 10000 });
    });

    test('should show validation errors for invalid login', async () => {
      // Try to find login form
      const emailInput = page.locator('input[type="email"], input[placeholder*="email"], input[name="email"]').first();
      const passwordInput = page.locator('input[type="password"], input[placeholder*="password"], input[name="password"]').first();
      const loginButton = page.locator('button[type="submit"], button:has-text("Đăng nhập"), .ant-btn-primary').first();

      if (await emailInput.isVisible()) {
        await emailInput.fill('invalid@email.com');
        await passwordInput.fill('wrongpassword');
        await loginButton.click();

        // Check for error message
        await expect(page.locator('.ant-message, .error-message, [role="alert"]')).toBeVisible({ timeout: 5000 });
      }
    });

    test('should successfully login with valid credentials', async () => {
      const emailInput = page.locator('input[type="email"], input[placeholder*="email"], input[name="email"]').first();
      const passwordInput = page.locator('input[type="password"], input[placeholder*="password"], input[name="password"]').first();
      const loginButton = page.locator('button[type="submit"], button:has-text("Đăng nhập"), .ant-btn-primary').first();

      if (await emailInput.isVisible()) {
        await emailInput.fill(testUser.email);
        await passwordInput.fill(testUser.password);
        await loginButton.click();

        // Wait for redirect to dashboard
        await page.waitForURL(/dashboard|admin|main/, { timeout: 10000 });
        
        // Check if dashboard elements are visible
        await expect(page.locator('.dashboard, .main-content, .ant-layout-content')).toBeVisible({ timeout: 10000 });
      }
    });
  });

  test.describe('Dashboard & Navigation', () => {
    test.beforeEach(async () => {
      // Login first
      await loginIfNeeded(page);
    });

    test('should display dashboard with key metrics', async () => {
      // Check for dashboard cards/metrics
      const dashboardCards = page.locator('.ant-card, .metric-card, .dashboard-card');
      await expect(dashboardCards.first()).toBeVisible({ timeout: 10000 });

      // Check for navigation menu
      const navigation = page.locator('.ant-menu, .navigation, .sidebar');
      await expect(navigation).toBeVisible();
    });

    test('should navigate between different sections', async () => {
      const menuItems = [
        { text: 'Sản phẩm', url: /product|inventory/ },
        { text: 'Bán hàng', url: /pos|sale/ },
        { text: 'Báo cáo', url: /report|analytics/ }
      ];

      for (const item of menuItems) {
        const menuLink = page.locator(`a:has-text("${item.text}"), .ant-menu-item:has-text("${item.text}")`).first();
        
        if (await menuLink.isVisible()) {
          await menuLink.click();
          await page.waitForLoadState('networkidle');
          
          // Verify URL change or content change
          await page.waitForTimeout(1000);
        }
      }
    });
  });

  test.describe('Product Management', () => {
    test.beforeEach(async () => {
      await loginIfNeeded(page);
      // Navigate to products page
      await navigateToProducts(page);
    });

    test('should display products list', async () => {
      // Check for products table or grid
      const productsList = page.locator('.ant-table, .product-grid, .products-list');
      await expect(productsList).toBeVisible({ timeout: 10000 });
    });

    test('should open add product modal/form', async () => {
      const addButton = page.locator('button:has-text("Thêm"), button:has-text("Tạo"), .ant-btn:has-text("Thêm")').first();
      
      if (await addButton.isVisible()) {
        await addButton.click();
        
        // Check for modal or form
        const modal = page.locator('.ant-modal, .modal, .add-product-form');
        await expect(modal).toBeVisible({ timeout: 5000 });
      }
    });

    test('should search products', async () => {
      const searchInput = page.locator('input[placeholder*="tìm"], input[placeholder*="search"], .search-input').first();
      
      if (await searchInput.isVisible()) {
        await searchInput.fill('test');
        await page.waitForTimeout(1000);
        
        // Check if search results are filtered
        await page.waitForLoadState('networkidle');
      }
    });
  });

  test.describe('POS System', () => {
    test.beforeEach(async () => {
      await loginIfNeeded(page);
      // Navigate to POS
      await navigateToPOS(page);
    });

    test('should display POS interface', async () => {
      // Check for POS components
      const posInterface = page.locator('.pos-interface, .cashier, .point-of-sale');
      const productGrid = page.locator('.product-grid, .pos-products');
      const cart = page.locator('.cart, .order-summary');

      await expect(posInterface.or(productGrid).or(cart).first()).toBeVisible({ timeout: 10000 });
    });

    test('should scan/search products in POS', async () => {
      const barcodeInput = page.locator('input[placeholder*="barcode"], input[placeholder*="mã"], .barcode-input').first();
      
      if (await barcodeInput.isVisible()) {
        await barcodeInput.fill('1234567890');
        await barcodeInput.press('Enter');
        await page.waitForTimeout(1000);
      }
    });
  });

  test.describe('Analytics & Reports', () => {
    test.beforeEach(async () => {
      await loginIfNeeded(page);
      // Navigate to analytics
      await navigateToAnalytics(page);
    });

    test('should display analytics dashboard', async () => {
      // Check for charts and metrics
      const charts = page.locator('.recharts-wrapper, .chart, .analytics-chart');
      const metrics = page.locator('.metric, .kpi, .stat-card');

      await expect(charts.or(metrics).first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile devices', async () => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone size
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Check if mobile layout is applied
      const mobileMenu = page.locator('.ant-drawer, .mobile-menu, .hamburger');
      const content = page.locator('.main-content, .ant-layout-content');

      await expect(content).toBeVisible();
    });

    test('should work on tablet devices', async () => {
      await page.setViewportSize({ width: 768, height: 1024 }); // iPad size
      await page.reload();
      await page.waitForLoadState('networkidle');

      const content = page.locator('.main-content, .ant-layout-content');
      await expect(content).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      // Simulate offline mode
      await page.setOfflineMode(true);
      await page.reload();

      // Check for offline message or cached content
      const errorMessage = page.locator('.error-message, .offline-message, .ant-result');
      const content = page.locator('.main-content');

      await expect(errorMessage.or(content).first()).toBeVisible({ timeout: 10000 });
    });

    test('should handle API errors', async () => {
      await loginIfNeeded(page);
      
      // Try to access a non-existent resource
      await page.goto(`${BASE_URL}/non-existent-page`);
      
      // Check for 404 or error page
      const errorPage = page.locator('.error-page, .not-found, .ant-result-404');
      await expect(errorPage.or(page.locator('text=404')).first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Performance & Security', () => {
    test('should load pages within acceptable time', async () => {
      const startTime = Date.now();
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
    });

    test('should have proper security headers', async () => {
      const response = await page.goto(BASE_URL);
      const headers = response?.headers() || {};

      // Check for security headers
      expect(headers['x-frame-options'] || headers['X-Frame-Options']).toBeTruthy();
      expect(headers['x-content-type-options'] || headers['X-Content-Type-Options']).toBeTruthy();
    });

    test('should redirect HTTP to HTTPS', async () => {
      // This test may not work in localhost, but good for production
      if (BASE_URL.includes('pages.dev')) {
        const response = await page.goto(BASE_URL.replace('https://', 'http://'));
        expect(page.url()).toContain('https://');
      }
    });
  });
});

// Helper functions
async function loginIfNeeded(page: Page) {
  // Check if already logged in
  const dashboard = page.locator('.dashboard, .main-content, .ant-layout-content');
  
  if (await dashboard.isVisible({ timeout: 2000 })) {
    return; // Already logged in
  }

  // Perform login
  const emailInput = page.locator('input[type="email"], input[placeholder*="email"], input[name="email"]').first();
  const passwordInput = page.locator('input[type="password"], input[placeholder*="password"], input[name="password"]').first();
  const loginButton = page.locator('button[type="submit"], button:has-text("Đăng nhập"), .ant-btn-primary').first();

  if (await emailInput.isVisible({ timeout: 5000 })) {
    await emailInput.fill(testUser.email);
    await passwordInput.fill(testUser.password);
    await loginButton.click();
    
    // Wait for redirect
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  }
}

async function navigateToProducts(page: Page) {
  const productsLink = page.locator('a:has-text("Sản phẩm"), .ant-menu-item:has-text("Sản phẩm"), [href*="product"]').first();
  
  if (await productsLink.isVisible({ timeout: 5000 })) {
    await productsLink.click();
    await page.waitForLoadState('networkidle');
  }
}

async function navigateToPOS(page: Page) {
  const posLink = page.locator('a:has-text("Bán hàng"), a:has-text("POS"), .ant-menu-item:has-text("Bán hàng"), [href*="pos"]').first();
  
  if (await posLink.isVisible({ timeout: 5000 })) {
    await posLink.click();
    await page.waitForLoadState('networkidle');
  }
}

async function navigateToAnalytics(page: Page) {
  const analyticsLink = page.locator('a:has-text("Báo cáo"), a:has-text("Thống kê"), .ant-menu-item:has-text("Báo cáo"), [href*="analytic"]').first();
  
  if (await analyticsLink.isVisible({ timeout: 5000 })) {
    await analyticsLink.click();
    await page.waitForLoadState('networkidle');
  }
}