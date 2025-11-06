const { test, expect } = require('@playwright/test');

/**
 * Playwright Tests for RexxJS Demo Pages
 * Tests that each demo page:
 * 1. Loads without errors
 * 2. Executes the embedded REXX script
 * 3. Produces expected output content
 * 4. Does not show error styling
 */

/**
 * Helper to get the correct URL for a demo page
 * Uses the baseURL configured in playwright.config.js
 */
function getDemoPageUrl(pageName) {
  return `/core/src/repl/${pageName}`;
}

/**
 * Helper to wait for REXX output to appear
 */
async function waitForRexxOutput(page) {
  await page.waitForSelector('.rexx-output', { timeout: 15000 });
}

/**
 * Helper to extract all output text from the page
 */
async function getOutputText(page) {
  const outputs = await page.locator('.rexx-output').allTextContents();
  return outputs.join('\n');
}

/**
 * Helper to check if page has error output
 */
async function hasErrorOutput(page) {
  // Try to find error-styled elements
  const errorElements = await page.locator('[style*="dc3545"], [style*="f8d7da"]').count();
  return errorElements > 0;
}

// ============================================
// Variables and Assignment Demo
// ============================================
test.describe('RexxJS Demo: Variables and Assignment', () => {
  test('should load page and display output', async ({ page }) => {
    // Listen to console messages for debugging
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err));

    await page.goto(getDemoPageUrl('variables-and-assignment.html'));

    // Wait for output to appear
    await waitForRexxOutput(page);

    // Get the output text
    const output = await getOutputText(page);

    // Verify key expected outputs are present
    expect(output).toContain('Basic Assignment:');
    expect(output).toContain('name = Alice');
    expect(output).toContain('age = 30');
    expect(output).toContain('String Concatenation:');
    expect(output).toContain('fullName = John Smith');
    expect(output).toContain('Type Coercion:');

    // Should not have errors
    const hasErrors = await hasErrorOutput(page);
    expect(hasErrors).toBe(false);
  });

  test('should show variable updates correctly', async ({ page }) => {
    await page.goto(getDemoPageUrl('variables-and-assignment.html'));
    await waitForRexxOutput(page);

    const output = await getOutputText(page);
    expect(output).toContain('Variable Updates:');
    expect(output).toContain('ACTIVE'); // UPPER() result
  });
});

// ============================================
// Arithmetic Operations Demo
// ============================================
test.describe('RexxJS Demo: Arithmetic Operations', () => {
  test('should load and execute arithmetic operations', async ({ page }) => {
    await page.goto(getDemoPageUrl('arithmetic-operations.html'));
    await waitForRexxOutput(page);

    const output = await getOutputText(page);

    // Verify presence of expected outputs
    expect(output).toContain('Basic Arithmetic:');
    expect(output).toContain('Integer Functions:');
    expect(output).toContain('Mathematical Functions:');

    // Should not have errors
    const hasErrors = await hasErrorOutput(page);
    expect(hasErrors).toBe(false);
  });
});

// ============================================
// Number Formatting Demo
// ============================================
test.describe('RexxJS Demo: Number Formatting', () => {
  test('should load and format numbers correctly', async ({ page }) => {
    await page.goto(getDemoPageUrl('number-formatting.html'));
    await waitForRexxOutput(page);

    const output = await getOutputText(page);

    expect(output).toContain('Number Formatting');

    // Should not have errors
    const hasErrors = await hasErrorOutput(page);
    expect(hasErrors).toBe(false);
  });
});

// ============================================
// Type Checking Demo
// ============================================
test.describe('RexxJS Demo: Type Checking', () => {
  test('should load and perform type checking', async ({ page }) => {
    await page.goto(getDemoPageUrl('type-checking.html'));
    await waitForRexxOutput(page);

    const output = await getOutputText(page);

    expect(output).toBeTruthy();

    // Should not have errors
    const hasErrors = await hasErrorOutput(page);
    expect(hasErrors).toBe(false);
  });
});

// ============================================
// String Functions Demo
// ============================================
test.describe('RexxJS Demo: String Functions', () => {
  test('should load and demonstrate string functions', async ({ page }) => {
    await page.goto(getDemoPageUrl('string-functions.html'));
    await waitForRexxOutput(page);

    const output = await getOutputText(page);

    expect(output).toContain('LENGTH example:');
    expect(output).toContain('SUBSTR examples:');
    expect(output).toContain('UPPER and LOWER examples:');

    // Should not have errors
    const hasErrors = await hasErrorOutput(page);
    expect(hasErrors).toBe(false);
  });
});

// ============================================
// String Comparison Demo
// ============================================
test.describe('RexxJS Demo: String Comparison', () => {
  test('should load and perform string comparisons', async ({ page }) => {
    await page.goto(getDemoPageUrl('string-comparison.html'));
    await waitForRexxOutput(page);

    const output = await getOutputText(page);

    expect(output).toBeTruthy();

    // Should not have errors
    const hasErrors = await hasErrorOutput(page);
    expect(hasErrors).toBe(false);
  });
});

// ============================================
// String Parsing Demo
// ============================================
test.describe('RexxJS Demo: String Parsing', () => {
  test('should load and parse strings', async ({ page }) => {
    await page.goto(getDemoPageUrl('string-parsing.html'));
    await waitForRexxOutput(page);

    const output = await getOutputText(page);

    expect(output).toBeTruthy();

    // Should not have errors
    const hasErrors = await hasErrorOutput(page);
    expect(hasErrors).toBe(false);
  });
});

// ============================================
// Regular Expressions Demo
// ============================================
test.describe('RexxJS Demo: Regular Expressions', () => {
  test('should load and demonstrate regular expressions', async ({ page }) => {
    await page.goto(getDemoPageUrl('regular-expressions.html'));
    await waitForRexxOutput(page);

    const output = await getOutputText(page);

    expect(output).toBeTruthy();

    // Should not have errors
    const hasErrors = await hasErrorOutput(page);
    expect(hasErrors).toBe(false);
  });
});

// ============================================
// Advanced String Manipulation Demo
// ============================================
test.describe('RexxJS Demo: Advanced String Manipulation', () => {
  test('should load and demonstrate advanced string operations', async ({ page }) => {
    await page.goto(getDemoPageUrl('advanced-string-manipulation.html'));
    await waitForRexxOutput(page);

    const output = await getOutputText(page);

    expect(output).toBeTruthy();

    // Should not have errors
    const hasErrors = await hasErrorOutput(page);
    expect(hasErrors).toBe(false);
  });
});

// ============================================
// Conditionals and Loops Demo
// ============================================
test.describe('RexxJS Demo: Conditionals and Loops', () => {
  test('should load and demonstrate control flow', async ({ page }) => {
    await page.goto(getDemoPageUrl('conditionals-and-loops.html'));
    await waitForRexxOutput(page);

    const output = await getOutputText(page);

    // Just verify output was generated (specific text varies)
    expect(output.length).toBeGreaterThan(0);

    // Should not have errors
    const hasErrors = await hasErrorOutput(page);
    expect(hasErrors).toBe(false);
  });
});

// ============================================
// Logical Operators Demo
// ============================================
test.describe('RexxJS Demo: Logical Operators', () => {
  test('should load and demonstrate logical operations', async ({ page }) => {
    await page.goto(getDemoPageUrl('logical-operators.html'));
    await waitForRexxOutput(page);

    const output = await getOutputText(page);

    expect(output).toBeTruthy();

    // Should not have errors
    const hasErrors = await hasErrorOutput(page);
    expect(hasErrors).toBe(false);
  });
});

// ============================================
// Error Handling Demo
// ============================================
test.describe('RexxJS Demo: Error Handling', () => {
  test('should load and demonstrate error handling', async ({ page }) => {
    await page.goto(getDemoPageUrl('error-handling.html'));
    await waitForRexxOutput(page);

    const output = await getOutputText(page);

    expect(output).toBeTruthy();

    // Should not have errors
    const hasErrors = await hasErrorOutput(page);
    expect(hasErrors).toBe(false);
  });
});

// ============================================
// Procedures and Functions Demo
// ============================================
test.describe('RexxJS Demo: Procedures and Functions', () => {
  test('should load and demonstrate procedures', async ({ page }) => {
    await page.goto(getDemoPageUrl('procedures-and-functions.html'));
    await waitForRexxOutput(page);

    const output = await getOutputText(page);

    expect(output).toBeTruthy();

    // Should not have errors
    const hasErrors = await hasErrorOutput(page);
    expect(hasErrors).toBe(false);
  });
});

// ============================================
// Array and Lists Demo
// ============================================
test.describe('RexxJS Demo: Arrays and Lists', () => {
  test('should load and demonstrate array operations', async ({ page }) => {
    await page.goto(getDemoPageUrl('array-and-lists.html'));
    await waitForRexxOutput(page);

    const output = await getOutputText(page);

    expect(output).toBeTruthy();

    // Should not have errors
    const hasErrors = await hasErrorOutput(page);
    expect(hasErrors).toBe(false);
  });
});

// ============================================
// Date and Time Functions Demo
// ============================================
test.describe('RexxJS Demo: Date and Time Functions', () => {
  test('should load and demonstrate date/time operations', async ({ page }) => {
    await page.goto(getDemoPageUrl('date-and-time-functions.html'));
    await waitForRexxOutput(page);

    const output = await getOutputText(page);

    expect(output).toBeTruthy();

    // Should not have errors
    const hasErrors = await hasErrorOutput(page);
    expect(hasErrors).toBe(false);
  });
});

// ============================================
// Date/Time Demo (alternate) - SKIPPED
// ============================================
test.describe('RexxJS Demo: Date/Time (Alternate)', () => {
  test.skip('should load and demonstrate date/time', async ({ page }) => {
    // TODO: This page uses document.write directly without demo-executor
    // Needs manual refactor to use executeRexxDemo pattern
    await page.goto(getDemoPageUrl('date-time.html'));
    await waitForRexxOutput(page);

    const output = await getOutputText(page);
    expect(output.length).toBeGreaterThan(0);
  });
});

// ============================================
// Canned Scripts Demo - SKIPPED
// ============================================
test.describe('RexxJS Demo: Canned Scripts', () => {
  test.skip('should load and display canned scripts', async ({ page }) => {
    // TODO: This page is interactive with buttons, not auto-executing
    // Needs special test that clicks buttons to trigger script execution
    await page.goto(getDemoPageUrl('canned-scripts.html'));
    await waitForRexxOutput(page);

    const output = await getOutputText(page);
    expect(output.length).toBeGreaterThan(0);
  });
});

// ============================================
// Echo/Repeat Demo - SKIPPED
// ============================================
test.describe('RexxJS Demo: Echo/Repeat', () => {
  test('should load and demonstrate echo functionality from GitHub', async ({ page }) => {
    // Listen to console for debugging
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('console', msg => {
      if (msg.type() === 'error') console.error('PAGE ERROR:', msg.text());
    });

    await page.goto(getDemoPageUrl('repeat_back_to_me.html'));
    await waitForRexxOutput(page);

    const output = await getOutputText(page);
    expect(output.length).toBeGreaterThan(0);
  });

  test.skip('should load and demonstrate echo functionality from local server', async ({ page }) => {
    // TODO: Local HTTP URL loading needs script tag path handling or direct fetch
    // Currently tries /libs/http://localhost:8000/... which fails
    // Workaround: Use https:// URL for GitHub version instead
    // Listen to console for debugging
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('console', msg => {
      if (msg.type() === 'error') console.error('PAGE ERROR:', msg.text());
    });

    await page.goto(getDemoPageUrl('repeat_back_to_me_local.html'));
    await waitForRexxOutput(page);

    const output = await getOutputText(page);
    expect(output.length).toBeGreaterThan(0);
  });
});
