import { test, expect, type Page } from '@playwright/test';

const BASE_URL = 'https://kho1.pages.dev';

// Admin credentials - cần phải tạo tài khoản admin trước
const adminCredentials = {
  email: 'admin@khoaugment.com',
  password: 'AdminPass123!',
  name: 'Administrator'
};

test.describe('Admin Full Functionality Test', () => {
  let page: Page;
  let isLoggedIn = false;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Navigate to the site
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Attempt automatic login
    if (!isLoggedIn) {
      await attemptLogin();
    }
  });

  test.afterEach(async () => {
    await page.close();
  });

  // Function to attempt login
  async function attemptLogin() {
    try {
      console.log('Attempting to login...');
      
      // Wait a bit for page to fully load
      await page.waitForTimeout(2000);
      
      // Take screenshot to see current state
      await page.screenshot({ path: 'test-results/before-login.png', fullPage: true });
      
      // Try different login form selectors
      const possibleSelectors = [
        'input[type="email"]',
        'input[placeholder*="email"]',
        'input[name="email"]',
        'input[name="username"]',
        '#email',
        '.ant-input[placeholder*="email"]'
      ];
      
      let emailInput = null;
      for (const selector of possibleSelectors) {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          emailInput = element;
          console.log(`Found email input with selector: ${selector}`);
          break;
        }
      }
      
      const possiblePasswordSelectors = [
        'input[type="password"]',
        'input[placeholder*="password"]',
        'input[name="password"]',
        '#password',
        '.ant-input[type="password"]'
      ];
      
      let passwordInput = null;
      for (const selector of possiblePasswordSelectors) {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          passwordInput = element;
          console.log(`Found password input with selector: ${selector}`);
          break;
        }
      }
      
      if (emailInput && passwordInput) {
        await emailInput.fill(adminCredentials.email);
        await passwordInput.fill(adminCredentials.password);
        
        // Find submit button
        const possibleSubmitSelectors = [
          'button[type="submit"]',
          'button:has-text("Đăng nhập")',
          'button:has-text("Login")',
          '.ant-btn-primary',
          'form button',
          'input[type="submit"]'
        ];
        
        let submitButton = null;
        for (const selector of possibleSubmitSelectors) {
          const element = page.locator(selector).first();
          if (await element.isVisible({ timeout: 2000 })) {
            submitButton = element;
            console.log(`Found submit button with selector: ${selector}`);
            break;
          }
        }
        
        if (submitButton) {
          await submitButton.click();
          
          // Wait for navigation or dashboard to load
          await page.waitForTimeout(3000);
          await page.waitForLoadState('networkidle');
          
          // Check if we're now on dashboard or logged in
          const isDashboard = await page.locator('.dashboard, .ant-layout-content, .main-content').isVisible({ timeout: 5000 });
          
          if (isDashboard) {
            isLoggedIn = true;
            console.log('Login successful!');
          } else {
            console.log('Login may have failed or redirected elsewhere');
          }
          
          // Take screenshot after login attempt
          await page.screenshot({ path: 'test-results/after-login.png', fullPage: true });
        } else {
          console.log('No submit button found');
        }
      } else {
        console.log('Login form not found or not visible');
        console.log(`Email input found: ${!!emailInput}`);
        console.log(`Password input found: ${!!passwordInput}`);
        
        // Check if we're already logged in
        const isDashboard = await page.locator('.dashboard, .ant-layout-content, .main-content').isVisible({ timeout: 2000 });
        if (isDashboard) {
          isLoggedIn = true;
          console.log('Already logged in!');
        }
      }
    } catch (error) {
      console.log('Login attempt failed:', error);
      await page.screenshot({ path: 'test-results/login-error.png', fullPage: true });
    }
  }

  test('should load homepage and identify UI structure', async () => {
    console.log('Current URL:', page.url());
    
    // Take full page screenshot
    await page.screenshot({ path: 'test-results/homepage-full.png', fullPage: true });
    
    // Check page title
    const title = await page.title();
    console.log('Page title:', title);
    expect(title).toBeTruthy();
    
    // Check for any visible text content
    const bodyText = await page.locator('body').textContent();
    console.log('Page contains text:', bodyText ? bodyText.substring(0, 200) + '...' : 'No text found');
    
    // Check for common UI frameworks
    const hasAntd = await page.locator('.ant-btn, .ant-layout, .ant-menu').count();
    const hasReact = await page.evaluate(() => window.React !== undefined);
    
    console.log('Ant Design components found:', hasAntd);
    console.log('React detected:', hasReact);
    
    // List all buttons on page
    const buttons = await page.locator('button').all();
    console.log(`Found ${buttons.length} buttons on page`);
    
    for (let i = 0; i < Math.min(buttons.length, 5); i++) {
      const buttonText = await buttons[i].textContent();
      console.log(`Button ${i + 1}: "${buttonText}"`);
    }
    
    // List all input fields
    const inputs = await page.locator('input').all();
    console.log(`Found ${inputs.length} input fields on page`);
    
    for (let i = 0; i < Math.min(inputs.length, 5); i++) {
      const inputType = await inputs[i].getAttribute('type');
      const inputPlaceholder = await inputs[i].getAttribute('placeholder');
      const inputName = await inputs[i].getAttribute('name');
      console.log(`Input ${i + 1}: type="${inputType}", placeholder="${inputPlaceholder}", name="${inputName}"`);
    }
  });

  test('should analyze navigation structure', async () => {
    // Look for navigation menus
    const navElements = await page.locator('nav, .navigation, .menu, .ant-menu, .sidebar').all();
    console.log(`Found ${navElements.length} navigation elements`);
    
    // Look for links
    const links = await page.locator('a').all();
    console.log(`Found ${links.length} links on page`);
    
    for (let i = 0; i < Math.min(links.length, 10); i++) {
      const linkText = await links[i].textContent();
      const linkHref = await links[i].getAttribute('href');
      console.log(`Link ${i + 1}: "${linkText}" -> ${linkHref}`);
    }
  });

  test('should test dashboard functionality if logged in', async () => {
    const isDashboard = await page.locator('.dashboard, .ant-layout-content, .main-content').isVisible({ timeout: 5000 });
    
    if (isDashboard) {
      console.log('Dashboard detected, testing functionality...');
      
      // Take screenshot of dashboard
      await page.screenshot({ path: 'test-results/dashboard.png', fullPage: true });
      
      // Look for cards/metrics
      const cards = await page.locator('.ant-card, .card, .metric, .stat').count();
      console.log(`Found ${cards} dashboard cards/metrics`);
      
      // Look for charts
      const charts = await page.locator('.recharts-wrapper, .chart, canvas').count();
      console.log(`Found ${charts} charts`);
      
      // Test navigation menu items
      const menuItems = await page.locator('.ant-menu-item, .menu-item, nav a').all();
      console.log(`Found ${menuItems.length} menu items`);
      
      for (let i = 0; i < Math.min(menuItems.length, 5); i++) {
        const itemText = await menuItems[i].textContent();
        console.log(`Menu item ${i + 1}: "${itemText}"`);
        
        try {
          await menuItems[i].click();
          await page.waitForTimeout(2000);
          await page.waitForLoadState('networkidle');
          
          const currentUrl = page.url();
          console.log(`Navigated to: ${currentUrl}`);
          
          // Take screenshot of new page
          await page.screenshot({ path: `test-results/nav-${i + 1}.png`, fullPage: true });
          
        } catch (error) {
          console.log(`Failed to click menu item ${i + 1}:`, error);
        }
      }
    } else {
      console.log('Not on dashboard, current page state:');
      const pageContent = await page.locator('body').textContent();
      console.log(pageContent?.substring(0, 300) + '...');
    }
  });

  test('should test POS functionality', async () => {
    // Try to navigate to POS
    const posSelectors = [
      'a:has-text("POS")',
      'a:has-text("Bán hàng")',
      'a:has-text("Point of Sale")',
      '[href*="pos"]',
      '.ant-menu-item:has-text("POS")',
      '.ant-menu-item:has-text("Bán hàng")'
    ];
    
    let posFound = false;
    for (const selector of posSelectors) {
      const posLink = page.locator(selector).first();
      if (await posLink.isVisible({ timeout: 2000 })) {
        console.log(`Found POS link with selector: ${selector}`);
        await posLink.click();
        await page.waitForTimeout(2000);
        await page.waitForLoadState('networkidle');
        posFound = true;
        break;
      }
    }
    
    if (posFound) {
      console.log('POS page loaded, testing functionality...');
      await page.screenshot({ path: 'test-results/pos-page.png', fullPage: true });
      
      // Look for POS components
      const productGrid = await page.locator('.product-grid, .products, .pos-products').count();
      const cart = await page.locator('.cart, .order, .checkout').count();
      const calculator = await page.locator('.calculator, .numeric-pad, .keypad').count();
      
      console.log(`POS components - Products: ${productGrid}, Cart: ${cart}, Calculator: ${calculator}`);
    } else {
      console.log('POS page not found');
    }
  });

  test('should test product management', async () => {
    // Try to navigate to products
    const productSelectors = [
      'a:has-text("Sản phẩm")',
      'a:has-text("Products")',
      'a:has-text("Kho")',
      '[href*="product"]',
      '.ant-menu-item:has-text("Sản phẩm")'
    ];
    
    let productFound = false;
    for (const selector of productSelectors) {
      const productLink = page.locator(selector).first();
      if (await productLink.isVisible({ timeout: 2000 })) {
        console.log(`Found products link with selector: ${selector}`);
        await productLink.click();
        await page.waitForTimeout(2000);
        await page.waitForLoadState('networkidle');
        productFound = true;
        break;
      }
    }
    
    if (productFound) {
      console.log('Products page loaded, testing functionality...');
      await page.screenshot({ path: 'test-results/products-page.png', fullPage: true });
      
      // Look for product list/table
      const productTable = await page.locator('.ant-table, table, .product-list').count();
      const addButton = await page.locator('button:has-text("Thêm"), button:has-text("Add"), .add-product').count();
      const searchBox = await page.locator('input[placeholder*="tìm"], input[placeholder*="search"]').count();
      
      console.log(`Product components - Table: ${productTable}, Add button: ${addButton}, Search: ${searchBox}`);
      
      // Test add product if button exists
      const addBtn = page.locator('button:has-text("Thêm"), button:has-text("Add")').first();
      if (await addBtn.isVisible({ timeout: 2000 })) {
        await addBtn.click();
        await page.waitForTimeout(1000);
        
        // Check for modal or form
        const modal = await page.locator('.ant-modal, .modal, .form').isVisible({ timeout: 2000 });
        console.log(`Add product modal opened: ${modal}`);
        
        if (modal) {
          await page.screenshot({ path: 'test-results/add-product-modal.png', fullPage: true });
        }
      }
    } else {
      console.log('Products page not found');
    }
  });

  test('should test responsive design', async () => {
    console.log('Testing responsive design...');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/mobile-view.png', fullPage: true });
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/tablet-view.png', fullPage: true });
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/desktop-view.png', fullPage: true });
    
    console.log('Responsive design tests completed');
  });

  test('should check for errors and performance', async () => {
    console.log('Checking for console errors...');
    
    // Listen for console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Reload page to catch any errors
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    console.log(`Found ${errors.length} console errors:`);
    errors.forEach((error, index) => {
      console.log(`Error ${index + 1}: ${error}`);
    });
    
    // Check for failed network requests
    const responses: any[] = [];
    page.on('response', response => {
      if (response.status() >= 400) {
        responses.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    console.log(`Found ${responses.length} failed network requests:`);
    responses.forEach((response, index) => {
      console.log(`Failed request ${index + 1}: ${response.status} ${response.statusText} - ${response.url}`);
    });
  });
});