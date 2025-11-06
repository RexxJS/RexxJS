const { test, expect } = require('@playwright/test');

test.describe('Simple DOM Function Test', () => {
  test('Check basic DOM functions', async ({ page }) => {
    // Navigate to the DOM stale test harness
    await page.goto('/tests/web/test-harness-dom-stale.html');
    
    // Wait for the page to load
    await page.waitForSelector('#output');
    await page.waitForSelector('#rexx-script');

    const script = `
-- Simple test of DOM functions using unified ELEMENT() API
LET buttons = ELEMENT(selector=".test-collection button" operation="all")
SAY "Found " || buttons.length || " buttons"

LET firstButton = ARRAY_GET(buttons, 1)
SAY "First button reference: " || firstButton

LET text = ELEMENT(element=firstButton operation="text")
SAY "First button text: " || text
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    console.log('Script output:', output);
    
    expect(output).toContain('Found 5 buttons');
    expect(output).toContain('First button text: Alpha');
  });
});