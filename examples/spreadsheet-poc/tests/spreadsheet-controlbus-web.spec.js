/**
 * Spreadsheet Control Bus - Web Mode Tests
 *
 * Tests for remote control of spreadsheet via postMessage (iframe communication)
 */

const { test, expect } = require('@playwright/test');

test.describe('Spreadsheet Control Bus - Web Mode', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to control bus demo page
        await page.goto('/examples/spreadsheet-poc/spreadsheet-controlbus-demo.html');

        // Wait for iframe to load
        await page.waitForTimeout(3000); // Give iframe time to fully initialize
    });

    test('should load control bus demo page', async ({ page }) => {
        const title = await page.textContent('h1');
        expect(title).toContain('Control Bus Demo');

        const statusBadge = await page.locator('#status');
        await expect(statusBadge).toBeVisible();
    });

    test('should establish connection with spreadsheet iframe', async ({ page }) => {
        // Wait for status to change to connected
        await page.waitForFunction(() => {
            const status = document.getElementById('status');
            return status && status.textContent === 'Connected';
        }, { timeout: 10000 });

        const statusText = await page.textContent('#status');
        expect(statusText).toBe('Connected');
    });

    test('should execute setCell command', async ({ page }) => {
        // Wait for connection
        await page.waitForTimeout(3000);

        // Set a simple script that sets a cell value
        await page.fill('#rexxScript', `
ADDRESS spreadsheet
"setCell" ref="A1" content="TestValue"
        `.trim());

        // Run the script
        await page.click('button:has-text("Run Script")');

        // Wait for execution
        await page.waitForTimeout(1000);

        // Check output contains success
        const output = await page.textContent('#output');
        expect(output).toContain('setCell');

        // Verify the cell was set in the iframe
        const frame = page.frameLocator('#spreadsheetFrame');
        const cellA1 = frame.locator('.grid-row').nth(1).locator('.cell').first();
        await expect(cellA1).toHaveText(/TestValue/);
    });

    test('should execute getCellValue command', async ({ page }) => {
        await page.waitForTimeout(3000);

        // Script to set a value and then get it
        await page.fill('#rexxScript', `
ADDRESS spreadsheet
"setCell" ref="B2" content="42"
LET result = "getCellValue" ref="B2"
SAY "Value is: " || result.value
        `.trim());

        await page.click('button:has-text("Run Script")');
        await page.waitForTimeout(1000);

        // Check output shows the value
        const output = await page.textContent('#output');
        expect(output).toContain('Value is: 42');
    });

    test('should execute formula and get result', async ({ page }) => {
        await page.waitForTimeout(3000);

        // Script with formula
        await page.fill('#rexxScript', `
ADDRESS spreadsheet
"setCell" ref="A1" content="10"
"setCell" ref="A2" content="20"
"setCell" ref="A3" content="=A1+A2"
LET result = "getCellValue" ref="A3"
SAY "Sum is: " || result.value
        `.trim());

        await page.click('button:has-text("Run Script")');
        await page.waitForTimeout(1500);

        // Check output
        const output = await page.textContent('#output');
        expect(output).toContain('Sum is: 30');
    });

    test('should load example scripts', async ({ page }) => {
        await page.waitForTimeout(3000);

        // Click the "Calculate Sum" example button
        await page.click('button:has-text("Calculate Sum")');

        // Verify the script was loaded
        const scriptContent = await page.inputValue('#rexxScript');
        expect(scriptContent).toContain('SUM_RANGE');
    });

    test('should export spreadsheet data', async ({ page }) => {
        await page.waitForTimeout(3000);

        // Run export example
        await page.click('button:has-text("Export Data")');
        await page.click('button:has-text("Run Script")');

        await page.waitForTimeout(1500);

        // Check output contains export data
        const output = await page.textContent('#output');
        expect(output).toContain('Exported');
        expect(output).toContain('Cells:');
    });

    test('should handle errors gracefully', async ({ page }) => {
        await page.waitForTimeout(3000);

        // Script with invalid command
        await page.fill('#rexxScript', `
ADDRESS spreadsheet
"invalidCommand" ref="A1"
        `.trim());

        await page.click('button:has-text("Run Script")');
        await page.waitForTimeout(1000);

        // Check output shows error
        const output = await page.textContent('#output');
        expect(output).toContain('Error');
    });

    test('should clear output', async ({ page }) => {
        await page.waitForTimeout(3000);

        // Run a simple script first
        await page.fill('#rexxScript', `SAY "Test"`);
        await page.click('button:has-text("Run Script")');
        await page.waitForTimeout(500);

        // Click clear
        await page.click('button:has-text("Clear Output")');

        // Check output was cleared
        const output = await page.textContent('#output');
        expect(output).toContain('Output cleared');
        expect(output).not.toContain('Test');
    });
});
