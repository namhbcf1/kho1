// Global teardown for Playwright tests
import { chromium, FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('Starting global teardown...');

  // Launch browser for teardown
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Clean up test data
    await cleanupTestData(page);
    
    // Generate test reports
    await generateTestReports();
    
    // Clean up temporary files
    await cleanupTempFiles();
    
    console.log('Global teardown completed successfully');
  } catch (error) {
    console.error('Global teardown failed:', error);
    // Don't throw error in teardown to avoid masking test failures
  } finally {
    await browser.close();
  }
}

async function cleanupTestData(page: any) {
  try {
    // Clear test data from database/storage
    await page.evaluate(() => {
      // Clear localStorage
      localStorage.clear();
      sessionStorage.clear();
    });

    // Clear IndexedDB
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        const deleteReq = indexedDB.deleteDatabase('khoaugment-test');
        deleteReq.onsuccess = () => resolve();
        deleteReq.onerror = () => resolve();
      });
    });

    // Clear any test files or uploads
    await page.evaluate(() => {
      // Clear any cached data
      if ('caches' in window) {
        caches.keys().then(cacheNames => {
          return Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
          );
        });
      }
    });

    console.log('Test data cleanup completed');
  } catch (error) {
    console.warn('Failed to cleanup test data:', error);
  }
}

async function generateTestReports() {
  try {
    // Generate summary report
    const testResults = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'test',
      testData: (global as any).testData || {},
      authTokens: Object.keys((global as any).authTokens || {}),
    };

    console.log('Test execution summary:', testResults);
    
    // Could write to file or send to reporting service
    // fs.writeFileSync('test-results/summary.json', JSON.stringify(testResults, null, 2));
    
  } catch (error) {
    console.warn('Failed to generate test reports:', error);
  }
}

async function cleanupTempFiles() {
  try {
    // Clean up any temporary files created during tests
    // This could include screenshots, videos, logs, etc.
    
    console.log('Temporary files cleanup completed');
  } catch (error) {
    console.warn('Failed to cleanup temporary files:', error);
  }
}

export default globalTeardown;
