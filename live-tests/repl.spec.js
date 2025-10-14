const { test, expect } = require('playwright/test');

test('basic navigation test', async ({ page }) => {
  await page.goto('https://repl.rexxjs.org/repl/');
  await expect(page).toHaveTitle('REXX Web REPL');
});

test('loads the REXX interpreter', async ({ page }) => {
  await page.goto('https://repl.rexxjs.org/repl/');
  await page.getByRole('button', { name: 'Load REXX Interpreter' }).click();
  await expect(page.locator('#repl-input')).toBeVisible();
});

test('executes a simple REXX command', async ({ page }) => {
  await page.goto('https://repl.rexxjs.org/repl/');
  await page.getByRole('button', { name: 'Load REXX Interpreter' }).click();
  await expect(page.locator('#repl-input')).toBeVisible();

  await page.locator('#repl-input').fill('SAY "Hello, World!"');
  await page.locator('#repl-input').press('Enter');

  const outputLocator = page.locator('#repl-history .repl-output').last();
  await expect(outputLocator).toHaveText('Hello, World!');
});

test('runs a demo script', async ({ page }) => {
  await page.goto('https://repl.rexxjs.org/repl/');
  await page.getByRole('button', { name: 'Load REXX Interpreter' }).click();
  await expect(page.locator('#repl-input')).toBeVisible();

  await page.locator('#demo-select').selectOption('basic');
  await page.locator('#run-demo-btn').click();

  const successMessage = page.locator('#repl-history').getByText(/✅ Demo completed!/);
  await expect(successMessage).toBeVisible({ timeout: 20000 });
});

test('runs R histogram demo successfully', async ({ page }) => {
  await page.goto('https://repl.rexxjs.org/repl/');
  await page.getByRole('button', { name: 'Load REXX Interpreter' }).click();
  await expect(page.locator('#repl-input')).toBeVisible();

  // Run the histogram demo which includes R-graphics functions
  await page.locator('#demo-select').selectOption('histogram');
  await page.locator('#run-demo-btn').click();

  // Wait for the demo to complete
  const successMessage = page.locator('#repl-history').getByText(/✅ Demo completed!/);
  await expect(successMessage).toBeVisible({ timeout: 25000 });

  // Verify the histogram creation message appears
  const histogramMessage = page.locator('#repl-history .repl-output').getByText(/Histogram created/);
  await expect(histogramMessage.first()).toBeVisible();
  
  // Verify that R-graphics library was loaded (should see library loading messages)
  const libraryMessage = page.locator('#repl-history .repl-output').getByText(/Loading R-inspired/);
  await expect(libraryMessage.first()).toBeVisible();
  
  // Check that histogram data was processed
  const histogramInfo = page.locator('#repl-history .repl-output').getByText(/Histogram type/);
  await expect(histogramInfo.first()).toBeVisible();
});

test('verifies REPL graphics UI and controls', async ({ page }) => {
  await page.goto('https://repl.rexxjs.org/repl/');
  await page.getByRole('button', { name: 'Load REXX Interpreter' }).click();
  await expect(page.locator('#repl-input')).toBeVisible();

  // Verify the graphics render system UI is present and functional
  const autoRenderCheckbox = page.locator('#auto-render-checkbox');
  await expect(autoRenderCheckbox).toBeVisible();
  await expect(autoRenderCheckbox).toBeChecked();

  const manualRenderBtn = page.locator('#manual-render-btn');
  await expect(manualRenderBtn).toBeVisible();
  await expect(manualRenderBtn).toBeDisabled();

  // Test auto-render toggle functionality
  await autoRenderCheckbox.uncheck();
  await page.waitForTimeout(500);
  
  // Verify the checkbox state changed and a message appeared
  await expect(autoRenderCheckbox).not.toBeChecked();
  const disabledMessage = page.locator('#repl-history').getByText(/Auto-rendering disabled/);
  await expect(disabledMessage).toBeVisible();

  // Turn auto-render back on
  await autoRenderCheckbox.check();
  await page.waitForTimeout(500);
  
  await expect(autoRenderCheckbox).toBeChecked();
  const enabledMessage = page.locator('#repl-history').getByText(/Auto-rendering enabled/);
  await expect(enabledMessage).toBeVisible();

  // Verify the graphics control UI is fully functional  
  await expect(autoRenderCheckbox).toBeVisible();
  await expect(manualRenderBtn).toBeVisible();
  
  // Test that the Clear Output button works with graphics controls
  await page.getByRole('button', { name: 'Clear Output' }).click();
  await page.waitForTimeout(500);
  
  // Verify REPL was cleared
  const clearedMessage = page.locator('#repl-history').getByText('REPL cleared');
  await expect(clearedMessage).toBeVisible();
});
