/**
 * Rexx-A-Sketch Tests
 * Tests for the Etch-A-Sketch example powered by RexxJS
 *
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { test, expect } = require('@playwright/test');

test.describe('Rexx-A-Sketch', () => {
  test('should load the page and display all elements', async ({ page }) => {
    await page.goto('/examples/rexx-a-sketch/');

    // Check that main elements are visible
    await expect(page.locator('.brand')).toContainText('REXX-A-SKETCH');
    await expect(page.locator('#canvas')).toBeVisible();
    await expect(page.locator('#left-dial')).toBeVisible();
    await expect(page.locator('#right-dial')).toBeVisible();
    await expect(page.locator('#shake')).toBeVisible();
    await expect(page.locator('#auto-draw')).toBeVisible();
  });

  test('should execute MOVE_TO command', async ({ page }) => {
    await page.goto('/examples/rexx-a-sketch/');

    // Clear the textarea and add a simple script
    await page.fill('#script', `
CLEAR
MOVE_TO x=100 y=100
SAY "Test complete"
    `);

    // Execute the script
    await page.click('.execute-button');

    // Wait for execution
    await page.waitForTimeout(500);

    // Check that the log contains expected messages
    const logText = await page.textContent('#log');
    expect(logText).toContain('Canvas cleared');
    expect(logText).toContain('Moved to (100, 100)');
    expect(logText).toContain('Test complete');
  });

  test('should execute MOVE_BY command', async ({ page }) => {
    await page.goto('/examples/rexx-a-sketch/');

    await page.fill('#script', `
CLEAR
MOVE_BY dx=50 dy=30
SAY "Movement complete"
    `);

    await page.click('.execute-button');
    await page.waitForTimeout(500);

    const logText = await page.textContent('#log');
    expect(logText).toContain('Moved to');
    expect(logText).toContain('Movement complete');
  });

  test('should draw a square', async ({ page }) => {
    await page.goto('/examples/rexx-a-sketch/');

    // Load the square example
    await page.click('.example-button:has-text("Square")');
    await page.waitForTimeout(200);

    // Execute the script
    await page.click('.execute-button');
    await page.waitForTimeout(1000);

    const logText = await page.textContent('#log');
    expect(logText).toContain('Canvas cleared');
    expect(logText).toContain('Square complete');
  });

  test('should draw a hexagonal pencil (Toy Story moment)', async ({ page }) => {
    await page.goto('/examples/rexx-a-sketch/');

    // Click the "Draw Pencil!" button
    await page.click('#auto-draw');

    // Wait for the drawing to complete
    await page.waitForTimeout(2000);

    const logText = await page.textContent('#log');
    expect(logText).toContain('Drawing Hexagonal Pencil');
    expect(logText).toContain('Hey, Etch. Draw!');
    expect(logText).toContain('Fastest knobs in the west');
    expect(logText).toContain('Canvas cleared');
  });

  test('should clear canvas with shake button', async ({ page }) => {
    await page.goto('/examples/rexx-a-sketch/');

    // Draw something first
    await page.fill('#script', `
MOVE_BY dx=50 dy=50
MOVE_BY dx=-50 dy=50
    `);
    await page.click('.execute-button');
    await page.waitForTimeout(500);

    // Click shake button
    await page.click('#shake');
    await page.waitForTimeout(600);

    const logText = await page.textContent('#log');
    expect(logText).toContain('Canvas cleared');
  });

  test('should handle GET_POSITION command', async ({ page }) => {
    await page.goto('/examples/rexx-a-sketch/');

    await page.fill('#script', `
CLEAR
MOVE_TO x=150 y=200
LET pos = GET_POSITION()
SAY "Position retrieved"
    `);

    await page.click('.execute-button');
    await page.waitForTimeout(500);

    const logText = await page.textContent('#log');
    expect(logText).toContain('Moved to (150, 200)');
    expect(logText).toContain('Position retrieved');
  });

  test('should handle PEN_UP and PEN_DOWN commands', async ({ page }) => {
    await page.goto('/examples/rexx-a-sketch/');

    await page.fill('#script', `
CLEAR
PEN_UP
MOVE_BY dx=50 dy=0
PEN_DOWN
MOVE_BY dx=50 dy=0
SAY "Pen control complete"
    `);

    await page.click('.execute-button');
    await page.waitForTimeout(500);

    const logText = await page.textContent('#log');
    expect(logText).toContain('Pen up');
    expect(logText).toContain('Pen down');
    expect(logText).toContain('Pen control complete');
  });

  test('should handle complex drawing with loops', async ({ page }) => {
    await page.goto('/examples/rexx-a-sketch/');

    await page.fill('#script', `
CLEAR
MOVE_TO x=300 y=225

LET i = 1
DO WHILE i <= 4
    MOVE_BY dx=50 dy=0
    MOVE_BY dx=0 dy=50
    LET i = i + 1
END

SAY "Loop drawing complete"
    `);

    await page.click('.execute-button');
    await page.waitForTimeout(1000);

    const logText = await page.textContent('#log');
    expect(logText).toContain('Canvas cleared');
    expect(logText).toContain('Loop drawing complete');
  });

  test('should load different example scripts', async ({ page }) => {
    await page.goto('/examples/rexx-a-sketch/');

    // Test pencil example
    await page.click('.example-button:has-text("Pencil")');
    await page.waitForTimeout(200);
    let scriptText = await page.inputValue('#script');
    expect(scriptText).toContain('hexagonal pencil');

    // Test square example
    await page.click('.example-button:has-text("Square")');
    await page.waitForTimeout(200);
    scriptText = await page.inputValue('#script');
    expect(scriptText).toContain('square');

    // Test spiral example
    await page.click('.example-button:has-text("Spiral")');
    await page.waitForTimeout(200);
    scriptText = await page.inputValue('#script');
    expect(scriptText).toContain('spiral');
  });

  test('should handle script errors gracefully', async ({ page }) => {
    await page.goto('/examples/rexx-a-sketch/');

    await page.fill('#script', `
INVALID_COMMAND x=100
    `);

    await page.click('.execute-button');
    await page.waitForTimeout(500);

    const logText = await page.textContent('#log');
    expect(logText).toContain('ERROR');
  });

  test('should execute multiple commands in sequence', async ({ page }) => {
    await page.goto('/examples/rexx-a-sketch/');

    await page.fill('#script', `
CLEAR
MOVE_TO x=200 y=200
MOVE_BY dx=100 dy=0
MOVE_BY dx=0 dy=100
MOVE_BY dx=-100 dy=0
MOVE_BY dx=0 dy=-100
SAY "Rectangle complete"
    `);

    await page.click('.execute-button');
    await page.waitForTimeout(1000);

    const logText = await page.textContent('#log');
    expect(logText).toContain('Canvas cleared');
    expect(logText).toContain('Moved to (200, 200)');
    expect(logText).toContain('Rectangle complete');
  });

  test('should verify canvas has correct dimensions', async ({ page }) => {
    await page.goto('/examples/rexx-a-sketch/');

    const canvas = page.locator('#canvas');
    const width = await canvas.getAttribute('width');
    const height = await canvas.getAttribute('height');

    expect(width).toBe('600');
    expect(height).toBe('450');
  });
});
