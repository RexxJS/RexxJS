/**
 * Spreadsheet Loader - Web Mode Tests
 *
 * Tests for loading spreadsheet data from URLs via hash parameter
 */

const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Spreadsheet Loader - Web Mode', () => {
    test('should load spreadsheet from relative URL via hash parameter', async ({ page }) => {
        // Navigate with load parameter pointing to sample file
        await page.goto('/examples/spreadsheet-poc/index.html#load=sample-budget.json');

        // Wait for app to load
        await page.waitForSelector('.app:not(.loading)', { timeout: 10000 });

        // Check that sample data was loaded
        const sheetName = await page.textContent('.sheet-name');
        expect(sheetName).toContain('Sample Budget');

        // Check that cells were populated
        const cellA1 = await page.locator('.grid-row').nth(1).locator('.cell').first();
        const a1Value = await cellA1.textContent();
        expect(a1Value.trim()).toBe('Item');

        // Check that formula cells were evaluated
        const cellC2 = await page.locator('.grid-row').nth(2).locator('.cell').nth(2);
        const c2Value = await cellC2.textContent();
        // C2 should have value 96 (B2 * TAX_RATE = 1200 * 0.08)
        expect(c2Value.trim()).toBe('96');
    });

    test('should handle setup script from loaded file', async ({ page }) => {
        // Navigate with load parameter
        await page.goto('/examples/spreadsheet-poc/index.html#load=sample-budget.json');
        await page.waitForSelector('.app:not(.loading)', { timeout: 10000 });

        // The sample file has a setup script that defines TAX_RATE
        // We can verify it worked by checking that formulas using TAX_RATE evaluated correctly

        const cellC2 = await page.locator('.grid-row').nth(2).locator('.cell').nth(2);
        const c2Value = await cellC2.textContent();
        expect(c2Value.trim()).toBe('96'); // 1200 * 0.08

        const cellC3 = await page.locator('.grid-row').nth(3).locator('.cell').nth(2);
        const c3Value = await cellC3.textContent();
        expect(c3Value.trim()).toBe('2'); // 25 * 0.08
    });

    test('should show error for missing file', async ({ page }) => {
        // Navigate with load parameter pointing to non-existent file
        await page.goto('/examples/spreadsheet-poc/index.html#load=does-not-exist.json');

        // Wait for error state
        await page.waitForSelector('.error-message', { timeout: 10000 });

        // Check error message is displayed
        const errorMsg = await page.textContent('.error-message');
        expect(errorMsg).toContain('Failed to load spreadsheet');
    });

    test('should load normally without load parameter', async ({ page }) => {
        // Navigate with just a sheet name
        await page.goto('/examples/spreadsheet-poc/index.html#MySheet');

        await page.waitForSelector('.app:not(.loading)', { timeout: 10000 });

        // Check sheet name
        const sheetName = await page.textContent('.sheet-name');
        expect(sheetName).toContain('MySheet');

        // Check that sample data was loaded (default behavior)
        const cellA1 = await page.locator('.grid-row').nth(1).locator('.cell').first();
        const a1Value = await cellA1.textContent();
        expect(a1Value.trim()).toBe('10'); // Default sample data
    });

    test('should handle formulas in loaded data', async ({ page }) => {
        await page.goto('/examples/spreadsheet-poc/index.html#load=sample-budget.json');
        await page.waitForSelector('.app:not(.loading)', { timeout: 10000 });

        // Check D2 = B2 + C2 = 1200 + 96 = 1296
        const cellD2 = await page.locator('.grid-row').nth(2).locator('.cell').nth(3);
        const d2Value = await cellD2.textContent();
        expect(d2Value.trim()).toBe('1296');

        // Check totals row (B6 = SUM_RANGE("B2:B4"))
        const cellB6 = await page.locator('.grid-row').nth(6).locator('.cell').nth(1);
        const b6Value = await cellB6.textContent();
        expect(b6Value.trim()).toBe('1300'); // 1200 + 25 + 75
    });

    test('should preserve cell metadata from loaded file', async ({ page }) => {
        await page.goto('/examples/spreadsheet-poc/index.html#load=sample-budget.json');
        await page.waitForSelector('.app:not(.loading)', { timeout: 10000 });

        // Cells with comments should have the commented class
        // Check if A1 has a comment (shown in title)
        const cellA1 = await page.locator('.grid-row').nth(1).locator('.cell').first();
        const title = await cellA1.getAttribute('title');
        expect(title).toContain('Item name');
    });
});
