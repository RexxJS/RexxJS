const { test, expect } = require('@playwright/test');

/**
 * Playwright Snapshot Tests for RexxJS Demo Pages
 *
 * Uses snapshot testing to verify complete output of each demo page.
 * Snapshots capture the full REXX execution trace and output.
 *
 * When output changes intentionally:
 * - Run with --update-snapshots flag: npx playwright test --update-snapshots
 * - Review changes in git before committing
 */

function getDemoPageUrl(pageName) {
  return `/core/src/repl/${pageName}`;
}

async function waitForRexxOutput(page) {
  await page.waitForSelector('.rexx-output', { timeout: 15000 });
}

async function getOutputText(page) {
  const outputs = await page.locator('.rexx-output').allTextContents();
  return outputs.join('\n');
}

async function getDemoPageSnapshot(pageName) {
  return test.step(`Snapshot: ${pageName}`, async () => {
    const testPage = test.browser?.newContext?.().newPage;
    // This will be created by Playwright's context
  });
}

const DEMO_PAGES = [
  { name: 'variables-and-assignment.html', title: 'Variables and Assignment' },
  { name: 'arithmetic-operations.html', title: 'Arithmetic Operations' },
  { name: 'number-formatting.html', title: 'Number Formatting' },
  { name: 'type-checking.html', title: 'Type Checking' },
  { name: 'string-functions.html', title: 'String Functions' },
  { name: 'string-comparison.html', title: 'String Comparison' },
  { name: 'string-parsing.html', title: 'String Parsing' },
  { name: 'regular-expressions.html', title: 'Regular Expressions' },
  { name: 'advanced-string-manipulation.html', title: 'Advanced String Manipulation' },
  { name: 'conditionals-and-loops.html', title: 'Conditionals and Loops' },
  { name: 'logical-operators.html', title: 'Logical Operators' },
  { name: 'error-handling.html', title: 'Error Handling' },
  { name: 'procedures-and-functions.html', title: 'Procedures and Functions' },
  { name: 'array-and-lists.html', title: 'Arrays and Lists' },
  { name: 'pipe-operator.html', title: 'Pipe Operator' },
  { name: 'functional-programming.html', title: 'Functional Programming' },
  { name: 'date-and-time-functions.html', title: 'Date and Time Functions', variableData: true },
  { name: 'do-over-loops.html', title: 'DO OVER Loops' },
  { name: 'select-statement.html', title: 'SELECT Statement' },
  { name: 'nested-loops.html', title: 'Nested Loops' },
  { name: 'comparison-operators.html', title: 'Comparison Operators' },
  { name: 'string-escape-sequences.html', title: 'String Escape Sequences' },
];

/**
 * Normalize output for comparison by replacing variable numeric data with placeholders
 * Handles: dates, times, timestamps, and other numeric values that change between runs
 */
function normalizeOutputForSnapshot(text) {
  if (!text) return text;

  // Replace various date/time formats with placeholders to handle non-deterministic data
  let normalized = text;

  // Milliseconds/microseconds like "43262727000" (11+ digits) - do this FIRST
  normalized = normalized.replace(/\b(\d{11,})\b/g, 'SSSSSSSSSS');

  // Base date numbers like "45582" (days since epoch) - 5 digit numbers starting with 3-4
  normalized = normalized.replace(/\b(4\d{4}|3\d{4})\b/g, 'DDDDD');

  // Times like "43262" (seconds since midnight) - remaining 5 digit numbers
  normalized = normalized.replace(/\b(\d{5})\b/g, 'SSSSS');

  // UTC dates like "181025" (YYMMDD) - 6 digit numbers
  normalized = normalized.replace(/\b(\d{6})\b/g, 'YYMMDD');

  // ISO dates like "20251018" (YYYYMMDD) - 8 digit numbers starting with 20xx or 201x
  normalized = normalized.replace(/\b(202\d{5}|201\d{5})\b/g, 'YYYYMMDD');

  // DD/MM/YY format like "18/10/25" - date format with slashes
  normalized = normalized.replace(/\b(\d{2}\/\d{2}\/\d{2})\b/g, 'DD/MM/YY');

  // 3-digit milliseconds like "272" or "742" - remaining 3 digit numbers
  normalized = normalized.replace(/\b(\d{3})\b/g, 'MMM');

  // Document dimensions like "1920x1080" or "800x600"
  normalized = normalized.replace(/\b(\d{3,5})x(\d{3,5})\b/g, 'WIDTHxHEIGHT');

  return normalized;
}

test.describe('RexxJS Demo Pages - Snapshot Tests', () => {
  DEMO_PAGES.forEach(({ name, title, variableData }) => {
    test(`${title} - snapshot`, async ({ page }) => {
      // Navigate to page
      await page.goto(getDemoPageUrl(name));

      // Wait for output to appear
      await waitForRexxOutput(page);

      // Get the full output
      let output = await getOutputText(page);

      // For pages with variable data (dates/times), normalize the numeric values
      if (variableData) {
        output = normalizeOutputForSnapshot(output);
      }

      // Snapshot test: single comparison against expected output
      expect(output).toMatchSnapshot(`${name}.txt`);
    });
  });
});
