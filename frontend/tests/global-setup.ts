// Global setup for Playwright tests
import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('Starting global setup...');

  // Launch browser for setup
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Setup test data
    await setupTestData(page);
    
    // Setup authentication tokens
    await setupAuthTokens(page);
    
    // Clear any existing data
    await clearTestData(page);
    
    console.log('Global setup completed successfully');
  } catch (error) {
    console.error('Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

async function setupTestData(page: any) {
  // Create test users
  const testUsers = [
    {
      email: 'admin@khoaugment.com',
      password: '123456',
      name: 'Admin User',
      role: 'admin',
    },
    {
      email: 'manager@khoaugment.com',
      password: '123456',
      name: 'Manager User',
      role: 'manager',
    },
    {
      email: 'cashier@khoaugment.com',
      password: '123456',
      name: 'Cashier User',
      role: 'cashier',
    },
  ];

  // Create test products
  const testProducts = [
    {
      name: 'Cà phê đen',
      price: 25000,
      category: 'Đồ uống',
      stock: 100,
      barcode: '1234567890123',
    },
    {
      name: 'Bánh mì thịt',
      price: 20000,
      category: 'Thức ăn',
      stock: 50,
      barcode: '1234567890124',
    },
    {
      name: 'Nước cam',
      price: 15000,
      category: 'Đồ uống',
      stock: 75,
      barcode: '1234567890125',
    },
  ];

  // Create test customers
  const testCustomers = [
    {
      name: 'Nguyễn Văn A',
      email: 'customer1@example.com',
      phone: '0901234567',
      loyaltyPoints: 1000,
    },
    {
      name: 'Trần Thị B',
      email: 'customer2@example.com',
      phone: '0901234568',
      loyaltyPoints: 500,
    },
  ];

  // Store test data in global state or database
  (global as any).testData = {
    users: testUsers,
    products: testProducts,
    customers: testCustomers,
  };
}

async function setupAuthTokens(page: any) {
  // Generate authentication tokens for test users
  const authTokens: Record<string, string> = {};

  const testUsers = (global as any).testData.users;
  
  for (const user of testUsers) {
    // Mock login to get token
    const token = `test-token-${user.role}-${Date.now()}`;
    authTokens[user.email] = token;
  }

  (global as any).authTokens = authTokens;
}

async function clearTestData(page: any) {
  // Clear any existing test data from previous runs
  try {
    // Clear localStorage
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Clear IndexedDB
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        const deleteReq = indexedDB.deleteDatabase('khoaugment-test');
        deleteReq.onsuccess = () => resolve();
        deleteReq.onerror = () => resolve(); // Continue even if deletion fails
      });
    });

    console.log('Test data cleared successfully');
  } catch (error) {
    console.warn('Failed to clear test data:', error);
  }
}

export default globalSetup;
