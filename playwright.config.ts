import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './playwright/tests', // directory for your test files
  timeout: 30000, // Test timeout, in ms
  expect: {
    timeout: 10000, // Expect timeout, in ms
  },
  use: {
    // Global settings to be used in every test
    headless: true, // Whether tests should run in headless mode (without UI)
    browserName: 'chromium', // Browser to run tests on (chromium, firefox, webkit)
    video: 'retain-on-failure', // Record videos only for failed tests
    trace: 'retain-on-failure', // Trace is captured for debugging failures
    screenshot: 'only-on-failure', // Capture screenshots only for failures
  },
  projects: [
    {
      name: 'Desktop Chromium',
      use: {
        ...devices['Desktop Chrome'], // Use Chrome device emulation
      },
    },
    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 12'], // Use iPhone 12 device emulation
      },
    },
  ],
});
