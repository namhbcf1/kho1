// Debug login test to understand the issue
import { test, expect } from '@playwright/test';

test('Debug login form elements', async ({ page }) => {
  console.log('Debugging login form...');
  
  await page.goto('https://kho1.pages.dev/login');
  await page.waitForLoadState('networkidle');
  
  // Check page content
  const title = await page.title();
  console.log('Page title:', title);
  
  const heading = await page.locator('h3').textContent().catch(() => 'Not found');
  console.log('Heading:', heading);
  
  // Check all input elements
  const inputs = await page.locator('input').count();
  console.log('Number of input elements:', inputs);
  
  // Get input details
  for (let i = 0; i < inputs; i++) {
    const input = page.locator('input').nth(i);
    const type = await input.getAttribute('type');
    const name = await input.getAttribute('name');
    const placeholder = await input.getAttribute('placeholder');
    const id = await input.getAttribute('id');
    console.log(`Input ${i}: type=${type}, name=${name}, placeholder=${placeholder}, id=${id}`);
  }
  
  // Check if there are any form elements
  const forms = await page.locator('form').count();
  console.log('Number of forms:', forms);
  
  // Check buttons
  const buttons = await page.locator('button').count();
  console.log('Number of buttons:', buttons);
  
  for (let i = 0; i < buttons; i++) {
    const button = page.locator('button').nth(i);
    const text = await button.textContent();
    const type = await button.getAttribute('type');
    console.log(`Button ${i}: text="${text}", type=${type}`);
  }
  
  // Try to find email input with different selectors
  const emailSelectors = [
    'input[name="email"]',
    'input[type="email"]',
    'input[placeholder*="admin"]',
    '.ant-input',
    '[id*="email"]'
  ];
  
  for (const selector of emailSelectors) {
    const exists = await page.locator(selector).count();
    console.log(`Selector "${selector}": ${exists} elements found`);
  }
  
  // Take a screenshot for visual debugging
  await page.screenshot({ path: 'test-results/debug-login-form.png', fullPage: true });
  
  // Try to fill the form using the most likely working selector
  const emailInput = page.locator('input').first();
  const passwordInput = page.locator('input').nth(1);
  
  if (await emailInput.isVisible()) {
    console.log('Attempting to fill email input...');
    await emailInput.fill('admin@khoaugment.com');
    console.log('Email filled successfully');
    
    if (await passwordInput.isVisible()) {
      console.log('Attempting to fill password input...');
      await passwordInput.fill('123456');
      console.log('Password filled successfully');
      
      // Try to submit
      const submitButton = page.locator('button[type="submit"]');
      if (await submitButton.isVisible()) {
        console.log('Clicking submit button...');
        await submitButton.click();
        
        // Wait for response
        await page.waitForTimeout(3000);
        
        const newUrl = page.url();
        console.log('URL after submit:', newUrl);
        
        await page.screenshot({ path: 'test-results/debug-after-submit.png', fullPage: true });
      }
    }
  }
  
  // This test always passes, it's just for debugging
  expect(true).toBe(true);
});