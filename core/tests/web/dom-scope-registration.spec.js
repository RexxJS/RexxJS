/**
 * DOM Scoped REXX Interpreter Registration Tests
 *
 * Tests the ability for REXX interpreters to register functions in DOM element scopes
 * rather than only in the global window object. This allows multiple independent
 * REXX scripts on the same page to have isolated function registrations.
 *
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { test, expect } = require('@playwright/test');

test.describe('DOM Scoped REXX Interpreter Registration', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to the test harness
    await page.goto('/tests/web/test-harness-dom-scoped-rexx.html');

    // Wait for interpreters to initialize
    await expect(page.locator('#status1')).toContainText('Ready', { timeout: 10000 });
    await expect(page.locator('#status2')).toContainText('Ready', { timeout: 10000 });
    await expect(page.locator('#status3')).toContainText('Ready', { timeout: 10000 });
  });

  test('should create three interpreters with different scope configurations', async ({ page }) => {
    // Verify all three status elements show "Ready"
    await expect(page.locator('#status1')).toContainText('Ready');
    await expect(page.locator('#status2')).toContainText('Ready');
    await expect(page.locator('#status3')).toContainText('Ready');

    // Verify each status has the correct scope type indicator
    await expect(page.locator('#status1')).toContainText('Isolated Scope');
    await expect(page.locator('#status2')).toContainText('Isolated Scope');
    await expect(page.locator('#status3')).toContainText('Window Scope');
  });

  test('should allow Script 1 to run and produce isolated scope output', async ({ page }) => {
    // Click the "Run Script 1" button
    await page.locator('#script1-container button').first().click();

    // Wait for status to show completion
    await expect(page.locator('#status1')).toContainText('Completed', { timeout: 5000 });

    // Verify output contains expected text
    await expect(page.locator('#output1')).toContainText('Hello from Script 1', { timeout: 5000 });
  });

  test('should allow Script 2 to run and produce isolated scope output', async ({ page }) => {
    // Click the "Run Script 2" button
    await page.locator('#script2-container button').first().click();

    // Wait for status to show completion
    await expect(page.locator('#status2')).toContainText('Completed', { timeout: 5000 });

    // Verify output contains expected text
    await expect(page.locator('#output2')).toContainText('Hello from Script 2', { timeout: 5000 });
  });

  test('should allow Script 3 to run and produce window scope output', async ({ page }) => {
    // Click the "Run Script 3" button - it's in a different container
    await page.locator('button:has-text("Run Script 3")').click();

    // Wait for status to show completion
    await expect(page.locator('#status3')).toContainText('Completed', { timeout: 5000 });

    // Verify output contains expected text
    await expect(page.locator('#output3')).toContainText('Hello from Script 3', { timeout: 5000 });
  });

  test('should maintain separate scopes for Script 1 and Script 2 when both run', async ({ page }) => {
    // Run both scripts
    await page.locator('#script1-container button').first().click();
    await page.locator('#script2-container button').first().click();

    // Wait for both to complete
    await expect(page.locator('#status1')).toContainText('Completed', { timeout: 5000 });
    await expect(page.locator('#status2')).toContainText('Completed', { timeout: 5000 });

    // Verify both produced output
    await expect(page.locator('#output1')).toContainText('Hello from Script 1');
    await expect(page.locator('#output2')).toContainText('Hello from Script 2');

    // Verify outputs are in their respective containers
    const output1Text = await page.locator('#output1').textContent();
    const output2Text = await page.locator('#output2').textContent();

    // Script 1's output should NOT contain Script 2's greeting
    expect(output1Text).not.toContain('Hello from Script 2');

    // Script 2's output should NOT contain Script 1's greeting
    expect(output2Text).not.toContain('Hello from Script 1');
  });

  test('should demonstrate INTERPRET_JS can verify scope isolation', async ({ page }) => {
    // Run all tests button
    await page.locator('button:has-text("Run All Tests")').click();

    // Wait for tests to complete and check for scope isolation verification
    await expect(page.locator('#test-results')).toContainText('Script 1 scope isolation verified', { timeout: 10000 });
    await expect(page.locator('#test-results')).toContainText('Script 2 scope isolation verified', { timeout: 10000 });
  });

  test('should have all test results pass', async ({ page }) => {
    // Click "Run All Tests"
    await page.locator('button:has-text("Run All Tests")').click();

    // Wait for test results to appear
    await expect(page.locator('#test-results')).toContainText('Interpreters initialized', { timeout: 10000 });

    // Check that no tests failed
    const failedTests = await page.locator('.test-result-item.fail').count();
    expect(failedTests).toBe(0);

    // Check for specific passing tests
    await expect(page.locator('#test-results')).toContainText('Interpreters initialized', { timeout: 5000 });
    await expect(page.locator('#test-results')).toContainText('Script 1 has isolated scope', { timeout: 5000 });
    await expect(page.locator('#test-results')).toContainText('Script 2 has isolated scope', { timeout: 5000 });
    await expect(page.locator('#test-results')).toContainText('Script 3 uses window scope', { timeout: 5000 });
  });

  test('should verify scope registries are separate', async ({ page }) => {
    // Run all tests
    await page.locator('button:has-text("Run All Tests")').click();

    // Wait for the specific test result
    await expect(page.locator('#test-results')).toContainText(
      'Interpreters have isolated scope registries',
      { timeout: 10000 }
    );

    // Check that it passed
    const registryTest = page.locator('#test-results').locator('.test-result-item.pass').filter({
      hasText: 'Interpreters have isolated scope registries'
    });

    await expect(registryTest).toBeVisible();
  });

  test('should handle sequential script execution without interference', async ({ page }) => {
    // Clear previous test results
    await page.locator('button:has-text("Clear Results")').click();

    // Run Script 1
    await page.locator('#script1-container button').first().click();
    await expect(page.locator('#status1')).toContainText('Completed', { timeout: 5000 });

    // Verify Script 1 output
    let output1 = await page.locator('#output1').textContent();
    expect(output1).toContain('Hello from Script 1');
    const script1Output = output1;

    // Run Script 2
    await page.locator('#script2-container button').first().click();
    await expect(page.locator('#status2')).toContainText('Completed', { timeout: 5000 });

    // Verify Script 2 output
    let output2 = await page.locator('#output2').textContent();
    expect(output2).toContain('Hello from Script 2');

    // Verify Script 1 output hasn't been modified
    output1 = await page.locator('#output1').textContent();
    expect(output1).toBe(script1Output);

    // Run Script 3
    await page.locator('button:has-text("Run Script 3")').click();
    await expect(page.locator('#status3')).toContainText('Completed', { timeout: 5000 });

    // Verify all three outputs are still distinct
    await expect(page.locator('#output1')).toContainText('Hello from Script 1');
    await expect(page.locator('#output2')).toContainText('Hello from Script 2');
    await expect(page.locator('#output3')).toContainText('Hello from Script 3');
  });

  test('should verify function availability per scope', async ({ page }) => {
    // Run all automated tests which verify scope function isolation
    await page.locator('button:has-text("Run All Tests")').click();

    // Wait for test results
    await expect(page.locator('#test-results')).toContainText('Global window functions available', { timeout: 10000 });

    // The test should pass (at least one global function exists)
    const globalFuncTest = page.locator('.test-result-item.pass').filter({
      hasText: 'Global window functions available'
    });

    await expect(globalFuncTest).toBeVisible();
  });

  test('should execute INTERPRET_JS code within proper scope context', async ({ page }) => {
    // Run Script 1 which uses INTERPRET_JS
    await page.locator('#script1-container button').first().click();
    await expect(page.locator('#status1')).toContainText('Completed', { timeout: 5000 });

    // Run Script 2 which uses INTERPRET_JS
    await page.locator('#script2-container button').first().click();
    await expect(page.locator('#status2')).toContainText('Completed', { timeout: 5000 });

    // Check that both scripts could execute INTERPRET_JS successfully
    // (output would show if there were JavaScript errors)
    const output1 = await page.locator('#output1').textContent();
    const output2 = await page.locator('#output2').textContent();

    // Neither should contain error messages
    expect(output1).not.toContain('ERROR');
    expect(output2).not.toContain('ERROR');
  });

  test('should demonstrate RexxScript class detection in container', async ({ page }) => {
    // Check that Script 1 and Script 2 containers have the RexxScript class
    const script1Container = page.locator('#script1-container');
    const script2Container = page.locator('#script2-container');

    // Both should have RexxScript class
    const script1Class = await script1Container.getAttribute('class');
    const script2Class = await script2Container.getAttribute('class');

    expect(script1Class).toContain('RexxScript');
    expect(script2Class).toContain('RexxScript');

    // Run all tests to verify scope detection
    await page.locator('button:has-text("Run All Tests")').click();

    // The tests should confirm scope detection worked
    await expect(page.locator('#test-results')).toContainText('Script 1 has isolated scope', { timeout: 10000 });
    await expect(page.locator('#test-results')).toContainText('Script 2 has isolated scope', { timeout: 10000 });
  });

});
