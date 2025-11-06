const { test, expect } = require('@playwright/test');

test.describe('ELEMENT() Function - Phase 1: Basic Element Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the DOM stale test harness which has our DOM functions
    await page.goto('/tests/web/test-harness-dom-stale.html');
    
    // Wait for the page to load
    await page.waitForSelector('#output');
    await page.waitForSelector('#rexx-script');
  });

  test('ELEMENT() with operation="get" should get single element reference', async ({ page }) => {
    const script = `
-- Test ELEMENT() get operation function
LET button = ELEMENT(selector="button:first-child" operation="get")
SAY "Got button reference: " || button
SAY "Reference type: " || TYPEOF(button)
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Got button reference: dom_element_');
    expect(output).toContain('Reference type: string');
  });

  test('ELEMENT() with operation="all" should get array of element references', async ({ page }) => {
    const script = `
-- Test ELEMENT() get operation_ALL function
LET buttons = ELEMENT(selector=".test-collection button" operation="all")
SAY "Found " || buttons.length || " button references"
SAY "First button: " || ARRAY_GET(buttons, 1)
SAY "Second button: " || ARRAY_GET(buttons, 2)
SAY "Array type: " || TYPEOF(buttons)
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Found 5 button references');
    expect(output).toContain('First button: dom_element_');
    expect(output).toContain('Second button: dom_element_');
    expect(output).toContain('Array type: object');
  });

  test('ELEMENT() with operation="text" should get element text content', async ({ page }) => {
    const script = `
-- Test ELEMENT() text operation function
LET buttons = ELEMENT(selector=".test-collection button" operation="all")
LET firstButton = ARRAY_GET(buttons, 1)
LET text = ELEMENT(element=firstButton operation="text")
SAY "First button text: " || text

LET secondButton = ARRAY_GET(buttons, 2)
LET text2 = ELEMENT(element=secondButton operation="text")
SAY "Second button text: " || text2
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('First button text: Alpha');
    expect(output).toContain('Second button text: Beta');
  });

  test('ELEMENT() with operation="click" should click elements', async ({ page }) => {
    const script = `
-- Test ELEMENT() click operation function
LET buttons = ELEMENT(selector=".test-collection button" operation="all")
LET firstButton = ARRAY_GET(buttons, 1)
LET text = ELEMENT(element=firstButton operation="text")
SAY "Clicking button: " || text
LET result = ELEMENT(element=firstButton operation="click")
SAY "Click result: " || result
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Clicking button: Alpha');
    expect(output).toContain('Click result: true');
    
    // Check that the click was registered in the event log
    const eventLog = await page.textContent('#event-log');
    expect(eventLog).toContain('Alpha clicked');
  });

  test('ELEMENT() with operation="attribute" should get and set attributes should work', async ({ page }) => {
    const script = `
-- Test ELEMENT() attribute operation functions
LET button = ELEMENT(selector=".test-collection button:first-child" operation="get")
LET originalTitle = ELEMENT(element=button operation="attribute" arg3="title")
SAY "Original title: " || originalTitle

-- Set a new title
ELEMENT(element=button operation="attribute" arg3="title" arg4="Custom Title")
LET newTitle = ELEMENT(element=button operation="attribute" arg3="title")
SAY "New title: " || newTitle

-- Set a data attribute
ELEMENT(element=button operation="attribute" arg3="data-test" arg4="phase1-test")
LET dataAttr = ELEMENT(element=button operation="attribute" arg3="data-test")
SAY "Data attribute: " || dataAttr
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('New title: Custom Title');
    expect(output).toContain('Data attribute: phase1-test');
  });

  test('ELEMENT() with operation="style" should modify element styles', async ({ page }) => {
    const script = `
-- Test ELEMENT() style operation function
LET button = ELEMENT(selector=".test-collection button:first-child" operation="get")
SAY "Setting button style..."

-- Set background color
ELEMENT(element=button operation="style" arg3="backgroundColor" arg4="red")
SAY "Background color set to red"

-- Set border
ELEMENT(element=button operation="style" arg3="border" arg4="3px solid blue")
SAY "Border set to blue"

-- Set font weight
ELEMENT(element=button operation="style" arg3="fontWeight" arg4="bold")
SAY "Font weight set to bold"
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Background color set to red');
    expect(output).toContain('Border set to blue');
    expect(output).toContain('Font weight set to bold');
    
    // Verify the styles were actually applied
    const buttonStyle = await page.evaluate(() => {
      const button = document.querySelector('.test-collection button:first-child');
      return {
        backgroundColor: button.style.backgroundColor,
        border: button.style.border,
        fontWeight: button.style.fontWeight
      };
    });
    
    expect(buttonStyle.backgroundColor).toBe('red');
    expect(buttonStyle.border).toBe('3px solid blue');
    expect(buttonStyle.fontWeight).toBe('bold');
  });

  test('ELEMENT() with selector filter should find child elements', async ({ page }) => {
    const script = `
-- Test ELEMENT() selector filtering function
LET container = ELEMENT(selector=".test-collection" operation="get")
LET firstButton = ELEMENT(element=container selector="button:first-child" operation="children")
LET buttonText = ELEMENT(element=firstButton operation="text")
SAY "Found first button in container: " || buttonText

-- Query for a specific button
LET betaButton = ELEMENT(element=container selector="button:nth-child(2)" operation="children")
LET betaText = ELEMENT(element=betaButton operation="text")
SAY "Found second button: " || betaText
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Found first button in container: Alpha');
    expect(output).toContain('Found second button: Beta');
  });

  test('ELEMENT() with selector filter (all) should find all child elements', async ({ page }) => {
    const script = `
-- Test ELEMENT() selector filtering_ALL function
LET container = ELEMENT(selector=".test-collection" operation="get")
LET buttons = ELEMENT(element=container selector="button" operation="children")
SAY "Found " || buttons.length || " buttons in container"

-- Process all buttons found
DO i = 1 TO buttons.length
    LET button = ARRAY_GET(buttons, i)
    LET text = ELEMENT(element=button operation="text")
    SAY "Button " || i || ": " || text
END
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Found 5 buttons in container');
    expect(output).toContain('Button 1: Alpha');
    expect(output).toContain('Button 2: Beta');
    expect(output).toContain('Button 3: Gamma');
    expect(output).toContain('Button 4: Delta');
    expect(output).toContain('Button 5: Epsilon');
  });

  test('DO...OVER should work with ELEMENT() all operation results', async ({ page }) => {
    const script = `
-- Test DO...OVER with ELEMENT() element references
LET buttons = ELEMENT(selector=".test-collection button" operation="all")
SAY "Processing " || buttons.length || " buttons with DO...OVER"

DO button OVER buttons
    LET text = ELEMENT(element=button operation="text")
    SAY "Processing: " || text
    -- Click each button
    ELEMENT(element=button operation="click")
END

SAY "DO...OVER processing complete"
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(2000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Processing 5 buttons with DO...OVER');
    expect(output).toContain('Processing: Alpha');
    expect(output).toContain('Processing: Beta');
    expect(output).toContain('Processing: Gamma');
    expect(output).toContain('Processing: Delta');
    expect(output).toContain('Processing: Epsilon');
    expect(output).toContain('DO...OVER processing complete');
    
    // Verify all buttons were clicked
    const eventLog = await page.textContent('#event-log');
    expect(eventLog).toContain('Alpha clicked');
    expect(eventLog).toContain('Beta clicked');
    expect(eventLog).toContain('Gamma clicked');
    expect(eventLog).toContain('Delta clicked');
    expect(eventLog).toContain('Epsilon clicked');
  });

  test('Error handling for invalid selectors', async ({ page }) => {
    const script = `
-- Test error handling
SAY "Testing error handling..."

-- Try to get non-existent element
LET missing = ELEMENT(selector=".non-existent-element" operation="get")
SAY "This should not appear"
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Testing error handling');
    expect(output).toContain('Error');
    expect(output).not.toContain('This should not appear');
  });

  test('Error handling for invalid element references', async ({ page }) => {
    const script = `
-- Test error handling for invalid references
SAY "Testing invalid element reference..."

-- Try to use invalid element reference
LET text = ELEMENT(element="invalid_reference" operation="text")
SAY "This should not appear"
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Testing invalid element reference');
    expect(output).toContain('Error');
    expect(output).not.toContain('This should not appear');
  });

  test('Complex workflow with multiple DOM operations', async ({ page }) => {
    const script = `
-- Complex workflow test
SAY "Starting complex DOM workflow..."

-- Get all buttons and style them
LET buttons = ELEMENT(selector=".test-collection button" operation="all")
SAY "Found " || buttons.length || " buttons to process"

-- Style each button differently
DO i = 1 TO buttons.length
    LET button = ARRAY_GET(buttons, i)
    LET text = ELEMENT(element=button operation="text")
    
    -- Set different colors based on position
    IF i = 1 THEN
        ELEMENT(element=button operation="style" arg3="color" arg4="red")
    ELSEIF i = 2 THEN
        ELEMENT(element=button operation="style" arg3="color" arg4="green")
    ELSEIF i = 3 THEN
        ELEMENT(element=button operation="style" arg3="color" arg4="blue")
    ELSE
        ELEMENT(element=button operation="style" arg3="color" arg4="purple")
    ENDIF
    
    -- Set a data attribute
    ELEMENT(element=button operation="attribute" arg3="data-index" arg4=i)
    
    SAY "Styled button " || i || " (" || text || ")"
END

-- Get container and query it
LET container = ELEMENT(selector=".test-collection" operation="get")
LET queriedButtons = ELEMENT(element=container selector="button[data-index]" operation="children")
SAY "Found " || queriedButtons.length || " buttons with data-index attribute"

SAY "Complex workflow complete!"
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(2000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Starting complex DOM workflow');
    expect(output).toContain('Found 5 buttons to process');
    expect(output).toContain('Styled button 1 (Alpha)');
    expect(output).toContain('Styled button 2 (Beta)');
    expect(output).toContain('Found 5 buttons with data-index attribute');
    expect(output).toContain('Complex workflow complete!');
    
    // Verify the styles and attributes were applied
    const verification = await page.evaluate(() => {
      const buttons = document.querySelectorAll('.test-collection button');
      return Array.from(buttons).map((btn, i) => ({
        color: btn.style.color,
        dataIndex: btn.getAttribute('data-index')
      }));
    });
    
    expect(verification[0].color).toBe('red');
    expect(verification[0].dataIndex).toBe('1');
    expect(verification[1].color).toBe('green');
    expect(verification[1].dataIndex).toBe('2');
    expect(verification[2].color).toBe('blue');
    expect(verification[2].dataIndex).toBe('3');
  });
});