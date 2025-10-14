// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './',
  
  /* Maximum time one test can run for */
  timeout: 60 * 1000,
  
  expect: {
    timeout: 30000
  },

  /* Run tests in files in parallel */
  /* Disable parallel execution when SLOWMO is set for better visibility */
  fullyParallel: !process.env.SLOWMO,
  workers: process.env.SLOWMO ? 1 : undefined,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Reporter to use */
  reporter: 'html',

  /* Shared settings for all the projects below */
  use: {
    /* Base URL for navigation */
    baseURL: 'https://repl.rexxjs.org',

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    
    /* Add slowMo delay between actions when SLOWMO env var is set */
    /* Usage: SLOWMO=1000 npx playwright test --headed */
    launchOptions: {
      slowMo: parseInt(process.env.SLOWMO || '0', 10),
    }
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});