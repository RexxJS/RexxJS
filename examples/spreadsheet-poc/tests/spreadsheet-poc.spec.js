/**
 * Spreadsheet POC Playwright Tests
 *
 * Tests for the spreadsheet UI interactions and RexxJS integration.
 */

const { test, expect } = require('@playwright/test');

test.describe('Spreadsheet POC', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the spreadsheet
        await page.goto('/examples/spreadsheet-poc/index.html');

        // Wait for React to load and render
        await page.waitForSelector('.app:not(.loading)', { timeout: 10000 });

        // Wait for grid to be visible
        await page.waitForSelector('.grid');
    });

    test('should load and display the spreadsheet', async ({ page }) => {
        // Check header is visible
        const header = await page.textContent('h1');
        expect(header).toBe('RexxJS Spreadsheet POC');

        // Check grid is rendered
        const grid = await page.locator('.grid');
        await expect(grid).toBeVisible();

        // Check column headers
        const colA = await page.locator('.column-header').first();
        await expect(colA).toHaveText('A');
    });

    test('should handle sheet name in hash parameter', async ({ page }) => {
        // Navigate with custom sheet name
        await page.goto('/examples/spreadsheet-poc/index.html#TestSheet');
        await page.waitForSelector('.app:not(.loading)');

        // Check sheet name is displayed
        const sheetName = await page.textContent('.sheet-name');
        expect(sheetName).toContain('TestSheet');
    });

    test('should allow entering literal values in cells', async ({ page }) => {
        // Find cell A1 and double-click to edit
        const cellA1 = page.locator('.grid-row').nth(1).locator('.cell').first();
        await cellA1.dblclick();

        // Type a value
        await page.keyboard.type('42');
        await page.keyboard.press('Enter');

        // Wait a moment for update
        await page.waitForTimeout(200);

        // Verify cell shows the value
        const cellValue = await cellA1.textContent();
        expect(cellValue.trim()).toBe('42');
    });

    test('should evaluate simple formulas', async ({ page }) => {
        // Set value in A1
        const cellA1 = page.locator('.grid-row').nth(1).locator('.cell').first();
        await cellA1.dblclick();
        await page.keyboard.type('10');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(200);

        // Set value in A2
        const cellA2 = page.locator('.grid-row').nth(2).locator('.cell').first();
        await cellA2.dblclick();
        await page.keyboard.type('20');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(200);

        // Set formula in A3
        const cellA3 = page.locator('.grid-row').nth(3).locator('.cell').first();
        await cellA3.dblclick();
        await page.keyboard.type('=A1 + A2');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);

        // Verify result
        const cellValue = await cellA3.textContent();
        expect(cellValue.trim()).toBe('30');
    });

    test('should update formulas when dependencies change', async ({ page }) => {
        // Set A1 = 5
        const cellA1 = page.locator('.grid-row').nth(1).locator('.cell').first();
        await cellA1.dblclick();
        await page.keyboard.type('5');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(200);

        // Set A2 = A1 * 2
        const cellA2 = page.locator('.grid-row').nth(2).locator('.cell').first();
        await cellA2.dblclick();
        await page.keyboard.type('=A1 * 2');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);

        // Verify A2 = 10
        let cellValue = await cellA2.textContent();
        expect(cellValue.trim()).toBe('10');

        // Change A1 to 7
        await cellA1.dblclick();
        await page.keyboard.press('Control+A');
        await page.keyboard.type('7');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);

        // Verify A2 updated to 14
        cellValue = await cellA2.textContent();
        expect(cellValue.trim()).toBe('14');
    });

    test('should support RexxJS string functions', async ({ page }) => {
        // Set cell with UPPER function
        const cellB1 = page.locator('.grid-row').nth(1).locator('.cell').nth(1);
        await cellB1.dblclick();
        await page.keyboard.type('=UPPER("hello")');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);

        // Verify result
        const cellValue = await cellB1.textContent();
        expect(cellValue.trim()).toBe('HELLO');
    });

    test('should support function pipelines', async ({ page }) => {
        // Set cell with pipeline
        const cellC1 = page.locator('.grid-row').nth(1).locator('.cell').nth(2);
        await cellC1.dblclick();
        await page.keyboard.type('="hello" |> UPPER |> LENGTH');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);

        // Verify result (length of "HELLO" is 5)
        const cellValue = await cellC1.textContent();
        expect(cellValue.trim()).toBe('5');
    });

    test('should use formula bar for editing', async ({ page }) => {
        // Click on cell A1
        const cellA1 = page.locator('.grid-row').nth(1).locator('.cell').first();
        await cellA1.click();
        await page.waitForTimeout(100);

        // Check formula bar shows cell reference
        const cellRefLabel = await page.textContent('.cell-ref-label');
        expect(cellRefLabel).toContain('A1');

        // Type in formula bar
        const formulaInput = page.locator('.formula-input');
        await formulaInput.fill('99');
        await formulaInput.press('Enter');
        await page.waitForTimeout(200);

        // Verify cell updated
        const cellValue = await cellA1.textContent();
        expect(cellValue.trim()).toBe('99');
    });

    test('should show formula in title attribute', async ({ page }) => {
        // Set a formula
        const cellA1 = page.locator('.grid-row').nth(1).locator('.cell').first();
        await cellA1.dblclick();
        await page.keyboard.type('=10 + 20');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);

        // Check cell has formula class
        await expect(cellA1).toHaveClass(/formula/);

        // Check title attribute shows formula
        const title = await cellA1.getAttribute('title');
        expect(title).toContain('10 + 20');
    });

    test('should handle cell selection', async ({ page }) => {
        // Click on cell B2
        const cellB2 = page.locator('.grid-row').nth(2).locator('.cell').nth(1);
        await cellB2.click();
        await page.waitForTimeout(100);

        // Check cell is selected
        await expect(cellB2).toHaveClass(/selected/);

        // Check formula bar shows B2
        const cellRefLabel = await page.textContent('.cell-ref-label');
        expect(cellRefLabel).toContain('B2');

        // Click on different cell
        const cellC3 = page.locator('.grid-row').nth(3).locator('.cell').nth(2);
        await cellC3.click();
        await page.waitForTimeout(100);

        // Check B2 is no longer selected
        await expect(cellB2).not.toHaveClass(/selected/);

        // Check C3 is selected
        await expect(cellC3).toHaveClass(/selected/);

        // Check formula bar shows C3
        const newCellRefLabel = await page.textContent('.cell-ref-label');
        expect(newCellRefLabel).toContain('C3');
    });

    test('should display sample data on load', async ({ page }) => {
        // Check that sample data is loaded
        // A1 should be 10
        const cellA1 = page.locator('.grid-row').nth(1).locator('.cell').first();
        const a1Value = await cellA1.textContent();
        expect(a1Value.trim()).toBe('10');

        // A2 should be 20
        const cellA2 = page.locator('.grid-row').nth(2).locator('.cell').first();
        const a2Value = await cellA2.textContent();
        expect(a2Value.trim()).toBe('20');

        // A3 should be 30 (=A1 + A2)
        const cellA3 = page.locator('.grid-row').nth(3).locator('.cell').first();
        const a3Value = await cellA3.textContent();
        expect(a3Value.trim()).toBe('30');
    });

    test('should clear cells with empty input', async ({ page }) => {
        // Set a value
        const cellA1 = page.locator('.grid-row').nth(1).locator('.cell').first();
        await cellA1.dblclick();
        await page.keyboard.type('Test');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(200);

        // Verify value is set
        let cellValue = await cellA1.textContent();
        expect(cellValue.trim()).toBe('Test');

        // Clear the cell
        await cellA1.dblclick();
        await page.keyboard.press('Control+A');
        await page.keyboard.press('Backspace');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(200);

        // Verify cell is empty
        cellValue = await cellA1.textContent();
        expect(cellValue.trim()).toBe('');
    });
});
