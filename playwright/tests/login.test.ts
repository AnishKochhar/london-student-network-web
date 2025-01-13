import { test, expect, chromium, Browser, Page } from '@playwright/test';

test.describe('Login Flow', () => {
  let browser: Browser;  // Define browser as a Browser type
  let page: Page;        // Define page as a Page type

  test.beforeAll(async () => {
    browser = await chromium.launch(); // Launch the browser
    page = await browser.newPage(); // Create a new page
  });

  test.afterAll(async () => {
    await browser.close(); // Close the browser after the tests
  });

  test('should login with valid credentials', async () => {
    await page.goto('http://localhost:3000/login'); // Navigate to the login page
    await page.fill('input[name="email"]', 'test@example.com'); // Fill in the email
    await page.fill('input[name="password"]', 'password123'); // Fill in the password
    await page.click('button[type="submit"]'); // Click the submit button
    const loggedIn = await page.isVisible('text=Welcome'); // Check if "Welcome" is visible
    expect(loggedIn).toBe(true); // Assert the result
  });
});
