import { test, expect } from '@playwright/test';

test('Production deployment test', async ({ page }) => {
  // Test the production URL
  await page.goto('https://d1299d34.kho1.pages.dev');
  
  // Wait for React to load
  await page.waitForTimeout(3000);
  
  // Check if React app loaded by looking for the test content
  const hasReactContent = await page.locator('text=Test React App').isVisible();
  const hasTestButton = await page.locator('button:has-text("Test Button")').isVisible();
  const hasLoadingMessage = await page.locator('text=If you can see this, React is working!').isVisible();
  
  console.log('React content visible:', hasReactContent);
  console.log('Test button visible:', hasTestButton);
  console.log('Loading message visible:', hasLoadingMessage);
  
  // Check what's actually in the page
  const pageContent = await page.content();
  console.log('Page title:', await page.title());
  console.log('Page contains "root" div:', pageContent.includes('id="root"'));
  
  // Check for JavaScript errors
  const jsErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      jsErrors.push(message.text());
    }
  });
  
  // Take a screenshot for debugging
  await page.screenshot({ path: 'production-test.png', fullPage: true });
  
  if (jsErrors.length > 0) {
    console.log('JavaScript errors:', jsErrors);
  }
  
  // The test should fail if React doesn't load, but let's see what we get
  expect(hasReactContent || hasTestButton || hasLoadingMessage).toBeTruthy();
});