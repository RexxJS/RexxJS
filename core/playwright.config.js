// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests/web',
  
  // TODO: merge not done cos spreadsheet stuff should not be in core/
  // testMatch: ['**/multi-instance-scripting.spec.js', '**/dom-*.spec.js', '**/stale-element.spec.js', '**/streaming-control.spec.js', '**/checkpoint-simple.spec.js', '**/spreadsheet-poc.spec.js'],
  
  testMatch: ['**/multi-instance-scripting.spec.js', '**/dom-*.spec.js', '**/stale-element.spec.js', '**/streaming-control.spec.js', '**/checkpoint-simple.spec.js', '**/repl-demo-pages*.spec.js'],
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'playwright-results/results.json' }]
  ],
  /* Global timeout for each test - prevents CI from hanging */
  timeout: 30000,
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:8000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Capture video for failed tests */
    video: 'on-first-retry',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
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

  /* Use existing Python simple server on port 8000 */
  webServer: null,
});