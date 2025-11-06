const { test, expect } = require('@playwright/test');

test.describe('ELEMENT() Function - Phase 2: Navigation & Properties', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the DOM stale test harness which has our DOM functions
    await page.goto('/tests/web/test-harness-dom-stale.html');

    // Wait for the page to load
    await page.waitForSelector('#output');
    await page.waitForSelector('#rexx-script');
  });

  test('ELEMENT() with operation="parent" should get parent element', async ({ page }) => {
    const script = `
-- Test ELEMENT() parent operation
LET button = ELEMENT(selector=".test-collection button:first-child" operation="get")
LET parent = ELEMENT(element=button operation="parent")
SAY "Got parent reference: " || parent

-- Get parent properties
LET parentTag = ELEMENT(element=parent operation="tag")
LET parentClass = ELEMENT(element=parent operation="class")
SAY "Parent tag: " || parentTag
SAY "Parent class: " || parentClass
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Got parent reference: dom_element_');
    expect(output).toContain('Parent tag: DIV');
    expect(output).toContain('Parent class: test-collection');
  });

  test('ELEMENT() with operation="children" should get child elements', async ({ page }) => {
    const script = `
-- Test ELEMENT() children operation function
LET container = ELEMENT(selector=".test-collection" operation="get")
LET children = ELEMENT(element=container operation="children")
SAY "Found " || children.length || " children"

-- Test with selector filter
LET buttonChildren = ELEMENT(element=container selector="button" operation="children")
SAY "Found " || buttonChildren.length || " button children"

-- Check first child
LET firstChild = ARRAY_GET(children, 1)
LET childTag = ELEMENT(element=firstChild operation="tag")
SAY "First child tag: " || childTag
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Found 6 children'); // h4 + 5 buttons
    expect(output).toContain('Found 5 button children');
    expect(output).toContain('First child tag: H4');
  });

  test('ELEMENT() with operation="siblings" should get sibling elements', async ({ page }) => {
    const script = `
-- Test ELEMENT() siblings operation function
LET secondButton = ELEMENT(selector=".test-collection button:nth-child(3)" operation="get")
LET siblings = ELEMENT(element=secondButton operation="siblings")
SAY "Found " || siblings.length || " siblings"

-- Check sibling properties
DO i = 1 TO siblings.length
    LET sibling = ARRAY_GET(siblings, i)
    LET tag = ELEMENT(element=sibling operation="tag")
    IF tag = "BUTTON" THEN
        LET text = ELEMENT(element=sibling operation="text")
        SAY "Sibling button: " || text
    ELSE
        SAY "Sibling: " || tag
    ENDIF
END
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Found 5 siblings'); // h4 + 4 other buttons
    expect(output).toContain('Sibling button: Alpha');
    expect(output).toContain('Sibling button: Gamma');
    expect(output).toContain('Sibling: H4');
  });

  test('ELEMENT() with operation="next" and "prev" should work', async ({ page }) => {
    const script = `
-- Test ELEMENT() next and prev operations
LET secondButton = ELEMENT(selector=".test-collection button:nth-child(3)" operation="get")
LET buttonText = ELEMENT(element=secondButton
SAY "Current button: " || buttonText

-- Get next sibling
LET nextSibling = ELEMENT(element=secondButton operation="next")
LET nextText = ELEMENT(element=nextSibling operation="text")
SAY "Next sibling: " || nextText

-- Get previous sibling
LET prevSibling = ELEMENT(element=secondButton operation="prev")
LET prevTag = ELEMENT(element=prevSibling operation="tag")
IF prevTag = "BUTTON" THEN
    LET prevText = ELEMENT(element=prevSibling operation="text")
    SAY "Previous sibling: " || prevText
ELSE
    SAY "Previous sibling tag: " || prevTag
ENDIF
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Current button: Beta');
    expect(output).toContain('Next sibling: Gamma');
    expect(output).toContain('Previous sibling: Alpha');
  });

  test('ELEMENT() with operation="tag" should get element tag names', async ({ page }) => {
    const script = `
-- Test ELEMENT() tag operation function
LET buttons = ELEMENT(selector=".test-collection button" operation="all")
LET container = ELEMENT(selector=".test-collection" operation="get")
LET heading = ELEMENT(selector=".test-collection h4" operation="get")

LET buttonTag = ELEMENT(element=ARRAY_GET(buttons, 1) operation="tag")
LET containerTag = ELEMENT(element=container operation="tag")
LET headingTag = ELEMENT(element=heading operation="tag")

SAY "Button tag: " || buttonTag
SAY "Container tag: " || containerTag
SAY "Heading tag: " || headingTag
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Button tag: BUTTON');
    expect(output).toContain('Container tag: DIV');
    expect(output).toContain('Heading tag: H4');
  });

  test('ELEMENT() with operation="id" should get element IDs', async ({ page }) => {
    const script = `
-- Test ELEMENT() id operation function
LET form = ELEMENT(selector="form" operation="get")
LET formId = ELEMENT(element=form operation="id")
SAY "Form ID: " || formId

LET username = ELEMENT(selector="#username" operation="get")
LET usernameId = ELEMENT(element=username operation="id")
SAY "Username ID: " || usernameId

-- Test element without ID
LET button = ELEMENT(selector=".test-collection button:first-child" operation="get")
LET buttonId = ELEMENT(element=button operation="id")
SAY "Button ID: '" || buttonId || "'"
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Form ID: testForm');
    expect(output).toContain('Username ID: username');
    expect(output).toContain("Button ID: ''");
  });

  test('ELEMENT() with operation="class" and "classes" should work', async ({ page }) => {
    const script = `
-- Test ELEMENT() class operations
LET container = ELEMENT(selector=".test-collection" operation="get")
LET className = ELEMENT(element=container operation="class")
LET classes = ELEMENT(element=container operation="classes")

SAY "Class string: " || className
SAY "Number of classes: " || classes.length

DO i = 1 TO classes.length
    LET cls = ARRAY_GET(classes, i)
    SAY "Class " || i || ": " || cls
END
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Class string: test-collection');
    expect(output).toContain('Number of classes: 1');
    expect(output).toContain('Class 1: test-collection');
  });

  test('ELEMENT() with operation="visible" should detect element visibility', async ({ page }) => {
    const script = `
-- Test ELEMENT() visible operation function
LET button = ELEMENT(selector=".test-collection button:first-child" operation="get")
LET visible = ELEMENT(element=button operation="visible")
SAY "Button visible: " || visible

LET container = ELEMENT(selector=".test-collection" operation="get")
LET containerVisible = ELEMENT(element=container operation="visible")
SAY "Container visible: " || containerVisible
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Button visible: true');
    expect(output).toContain('Container visible: true');
  });

  test('ELEMENT() with operation="bounds" should get element dimensions', async ({ page }) => {
    const script = `
-- Test ELEMENT() bounds operation function
LET button = ELEMENT(selector=".test-collection button:first-child" operation="get")
LET bounds = ELEMENT(element=button operation="bounds")

SAY "Button bounds:"
SAY "  Width: " || bounds.width
SAY "  Height: " || bounds.height
SAY "  X: " || bounds.x
SAY "  Y: " || bounds.y
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Button bounds:');
    expect(output).toMatch(/Width: \d+/);
    expect(output).toMatch(/Height: \d+/);
    expect(output).toMatch(/X: \d+/);
    expect(output).toMatch(/Y: \d+/);
  });

  test('Complex navigation workflow', async ({ page }) => {
    const script = `
-- Complex navigation test
SAY "=== Complex Navigation Test ==="

-- Start with a button
LET thirdButton = ELEMENT(selector=".test-collection button:nth-child(4)" operation="get")
LET text = ELEMENT(element=thirdButton operation="text")
SAY "Starting with: " || text

-- Navigate to parent
LET parent = ELEMENT(element=thirdButton operation="parent")
LET parentTag = ELEMENT(element=parent operation="tag")
SAY "Parent is: " || parentTag

-- Get all children of parent
LET children = ELEMENT(element=parent selector="button" operation="children")
SAY "Parent has " || children.length || " button children"

-- Get siblings
LET siblings = ELEMENT(element=thirdButton operation="siblings")
SAY "Element has " || siblings.length || " siblings"

-- Navigate through siblings
LET prevSibling = ELEMENT(element=thirdButton operation="prev")
LET prevText = ELEMENT(element=prevSibling operation="text")
SAY "Previous sibling: " || prevText

LET nextSibling = ELEMENT(element=thirdButton operation="next")
LET nextText = ELEMENT(element=nextSibling operation="text")
SAY "Next sibling: " || nextText

SAY "=== Navigation complete ==="
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(2000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Starting with: Gamma');
    expect(output).toContain('Parent is: DIV');
    expect(output).toContain('Parent has 5 button children');
    expect(output).toContain('Previous sibling: Beta');
    expect(output).toContain('Next sibling: Delta');
    expect(output).toContain('Navigation complete');
  });

  test('Form navigation and property inspection', async ({ page }) => {
    const script = `
-- Form navigation test
SAY "=== Form Navigation Test ==="

LET form = ELEMENT(selector="#testForm" operation="get")
LET formTag = ELEMENT(element=form operation="tag")
LET formId = ELEMENT(element=form operation="id")
SAY "Form: " || formTag || " (ID: " || formId || ")"

-- Get form children
LET inputs = ELEMENT(element=form selector="input" operation="children")
SAY "Form has " || inputs.length || " input children"

-- Inspect each input
DO i = 1 TO inputs.length
    LET input = ARRAY_GET(inputs, i)
    LET inputId = ELEMENT(element=input operation="id")
    LET inputTag = ELEMENT(element=input operation="tag")
    SAY "Input " || i || ": " || inputTag || " (ID: " || inputId || ")"
END

-- Get submit button
LET submitBtn = ELEMENT(element=form selector="button" operation="children")
LET submitElement = ARRAY_GET(submitBtn, 1)
LET submitId = ELEMENT(element=submitElement operation="id")
LET submitText = ELEMENT(element=submitElement operation="text")
SAY "Submit button: " || submitText || " (ID: " || submitId || ")"

SAY "=== Form inspection complete ==="
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(2000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Form: FORM (ID: testForm)');
    expect(output).toContain('Form has 2 input children');
    expect(output).toContain('Input 1: INPUT (ID: username)');
    expect(output).toContain('Input 2: INPUT (ID: password)');
    expect(output).toContain('Submit button: Submit (ID: submitBtn)');
    expect(output).toContain('Form inspection complete');
  });

  test('Error handling for navigation functions', async ({ page }) => {
    const script = `
-- Test error handling for navigation
SAY "Testing navigation error handling..."

-- Try to get parent of body (should fail)
LET body = ELEMENT(selector="body" operation="get")
LET bodyParent = ELEMENT(element=body operation="parent")
SAY "This should not appear"
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Testing navigation error handling');
    expect(output).toContain('Error');
    expect(output).not.toContain('This should not appear');
  });
});