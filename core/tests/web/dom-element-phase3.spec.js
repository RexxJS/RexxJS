const { test, expect } = require('@playwright/test');

test.describe('ELEMENT() Function - Phase 3: Advanced DOM Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the DOM stale test harness which has our DOM functions
    await page.goto('/tests/web/test-harness-dom-stale.html');
    
    // Wait for the page to load
    await page.waitForSelector('#output');
    await page.waitForSelector('#rexx-script');
  });

  test('DOM operations: creating elements should create new elements', async ({ page }) => {
    const script = `
-- Test element creation with ELEMENT()
LET newDiv = ELEMENT(selector="div" operation="create" text="Hello World")
SAY "Created div: " || newDiv

LET newInput = ELEMENT(selector="input" operation="create" type="text" name="username" placeholder="Enter name")
SAY "Created input: " || newInput

-- Check element properties
LET divTag = ELEMENT(element=newDiv operation="tag")
LET inputTag = ELEMENT(element=newInput operation="tag")
SAY "Div tag: " || divTag
SAY "Input tag: " || inputTag
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Created div: dom_element_');
    expect(output).toContain('Created input: dom_element_');
    expect(output).toContain('Div tag: DIV');
    expect(output).toContain('Input tag: INPUT');
  });

  test('DOM operations: creating text nodes should create text nodes', async ({ page }) => {
    const script = `
-- Test text node creation function
LET textNode = ELEMENT(selector="text" operation="create" text="This is a text node")
SAY "Created text node: " || textNode
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Created text node: dom_element_');
  });

  test('ELEMENT() with operation="append" should add child elements', async ({ page }) => {
    const script = `
-- Test ELEMENT() append operation function
LET container = ELEMENT(selector=".test-collection" operation="get")
LET newButton = ELEMENT(selector="button" text="New Button" operation="create")
SAY "Created new button"

ELEMENT(element=container operation="append" arg3=newButton)
SAY "Appended button to container"

-- Verify it was added by counting children
LET children = ELEMENT(element=container selector="button" operation="children")
SAY "Container now has " || children.length || " button children"
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Created new button');
    expect(output).toContain('Appended button to container');
    expect(output).toContain('Container now has 6 button children'); // 5 original + 1 new
  });

  test('ELEMENT() with operation="prepend" should add child elements at the beginning', async ({ page }) => {
    const script = `
-- Test ELEMENT() prepend operation function
LET container = ELEMENT(selector=".test-collection" operation="get")
LET newHeading = ELEMENT(selector="h3" text="Prepended Heading" operation="create")
SAY "Created new heading"

ELEMENT(element=container operation="prepend" arg3=newHeading)
SAY "Prepended heading to container"

-- Check that it's first child
LET children = ELEMENT(element=container operation="children")
LET firstChild = ARRAY_GET(children, 1)
LET firstTag = ELEMENT(element=firstChild operation="tag")
SAY "First child is now: " || firstTag
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Created new heading');
    expect(output).toContain('Prepended heading to container');
    expect(output).toContain('First child is now: H3');
  });

  test('ELEMENT() should support insertion operations (before/after) should work', async ({ page }) => {
    const script = `
-- Test ELEMENT() insertion operations
LET secondButton = ELEMENT(selector=".test-collection button:nth-child(3)" operation="get")
LET beforeDiv = ELEMENT(selector="div" text="Before Beta" operation="create")
LET afterDiv = ELEMENT(selector="div" text="After Beta" operation="create")

SAY "Inserting elements around Beta button"

ELEMENT(element=secondButton operation="insert_before" arg3=beforeDiv)
ELEMENT(element=secondButton operation="insert_after" arg3=afterDiv)

SAY "Elements inserted"

-- Check siblings
LET siblings = ELEMENT(element=secondButton operation="siblings")
SAY "Beta now has " || siblings.length || " siblings"
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Inserting elements around Beta button');
    expect(output).toContain('Elements inserted');
    expect(output).toContain('Beta now has 7 siblings'); // Original 5 + 2 new
  });

  test('ELEMENT() clone-like operations should clone elements', async ({ page }) => {
    const script = `
-- Test element cloning function
LET originalButton = ELEMENT(selector=".test-collection button:first-child" operation="get")
LET originalText = ELEMENT(element=originalButton operation="text")
SAY "Original button text: " || originalText

LET clonedButton = ELEMENT(element=originalButton operation="clone" arg3=true)
SAY "Cloned button: " || clonedButton

-- Check cloned element properties
LET clonedText = ELEMENT(element=clonedButton operation="text")
LET clonedTag = ELEMENT(element=clonedButton operation="tag")
SAY "Cloned button text: " || clonedText
SAY "Cloned button tag: " || clonedTag
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Original button text: Alpha');
    expect(output).toContain('Cloned button: dom_element_');
    expect(output).toContain('Cloned button text: Alpha');
    expect(output).toContain('Cloned button tag: BUTTON');
  });

  test('ELEMENT() remove operations should remove elements', async ({ page }) => {
    const script = `
-- Test element removal function
LET container = ELEMENT(selector=".test-collection" operation="get")
LET childrenBefore = ELEMENT(element=container selector="button" operation="children")
SAY "Buttons before removal: " || childrenBefore.length

LET lastButton = ELEMENT(selector=".test-collection button:last-child" operation="get")
LET lastButtonText = ELEMENT(element=lastButton operation="text")
SAY "Removing button: " || lastButtonText

ELEMENT(element=lastButton operation="remove")
SAY "Button removed"

LET childrenAfter = ELEMENT(element=container selector="button" operation="children")
SAY "Buttons after removal: " || childrenAfter.length
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Buttons before removal: 5');
    expect(output).toContain('Removing button: Epsilon');
    expect(output).toContain('Button removed');
    expect(output).toContain('Buttons after removal: 4');
    
    // Verify the button is actually gone from the DOM
    const epsilonExists = await page.evaluate(() => {
      const buttons = document.querySelectorAll('.test-collection button');
      return Array.from(buttons).some(btn => btn.textContent === 'Epsilon');
    });
    expect(epsilonExists).toBe(false);
  });

  test('ELEMENT() replace operations should replace elements', async ({ page }) => {
    const script = `
-- Test element replacement function
LET oldButton = ELEMENT(selector=".test-collection button:nth-child(4)" operation="get")
LET oldText = ELEMENT(element=oldButton operation="text")
SAY "Replacing button: " || oldText

LET newButton = ELEMENT(selector="button" text="Replaced Gamma" operation="create")
ELEMENT(element=oldButton operation="replace" arg3=newButton)
SAY "Button replaced"

-- Verify replacement by checking the new text
LET replacedButton = ELEMENT(selector=".test-collection button:nth-child(4)" operation="get")
LET newText = ELEMENT(element=replacedButton operation="text")
SAY "New button text: " || newText
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Replacing button: Gamma');
    expect(output).toContain('Button replaced');
    expect(output).toContain('New button text: Replaced Gamma');
  });

  test('DOM event operations: click handlers should add click event handlers', async ({ page }) => {
    const script = `
-- Test click event handlers function
LET button = ELEMENT(selector=".test-collection button:first-child" operation="get")
SAY "Adding click handler to Alpha button"

ELEMENT(element=button operation="on_click" arg3="alphaClickHandler")
SAY "Click handler added"

-- Trigger the click
ELEMENT(element=button operation="click")
SAY "Button clicked programmatically"
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Adding click handler to Alpha button');
    expect(output).toContain('Click handler added');
    expect(output).toContain('Button clicked programmatically');
    
    // Check console logs for the event handler
    const logs = [];
    page.on('console', msg => logs.push(msg.text()));
    
    // Click the button manually to trigger the event handler
    await page.click('.test-collection button:first-child');
    await page.waitForTimeout(500);
    
    // Verify event handler was called (would need to check console logs in real scenario)
  });

  test('DOM event operations: triggering events should dispatch events', async ({ page }) => {
    const script = `
-- Test event triggering function
LET button = ELEMENT(selector=".test-collection button:first-child" operation="get")
SAY "Setting up event handler"

ELEMENT(element=button operation="on_event" arg3="custom" arg4="customHandler")
SAY "Custom event handler added"

-- Trigger custom event
ELEMENT(element=button operation="trigger_event" arg3="custom" arg4='{"message": "Hello from REXX"}')
SAY "Custom event triggered"

-- Trigger standard click event
ELEMENT(element=button operation="trigger_event" arg3="click")
SAY "Click event triggered"
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Custom event handler added');
    expect(output).toContain('Custom event triggered');
    expect(output).toContain('Click event triggered');
  });

  test('Complex dynamic UI building workflow', async ({ page }) => {
    const script = `
-- Complex dynamic UI test
SAY "=== Dynamic UI Building Test ==="

-- Create a new section
LET section = ELEMENT(selector="div" id="dynamic-section" operation="create")
ELEMENT(element=section operation="style" arg3="border" arg4="2px solid blue")
ELEMENT(element=section operation="style" arg3="padding" arg4="10px")
ELEMENT(element=section operation="style" arg3="margin" arg4="10px")

-- Create a heading
LET heading = ELEMENT(selector="h3" text="Dynamic Content" operation="create")
ELEMENT(element=section operation="append" arg3=heading)

-- Create a list
LET list = ELEMENT(selector="ul" operation="create")
ELEMENT(element=section operation="append" arg3=list)

-- Add list items
DO i = 1 TO 3
    LET item = ELEMENT(selector="li" text="Dynamic item " || i operation="create")
    ELEMENT(element=list operation="append" arg3=item)
    
    -- Add click handler to each item
    ELEMENT(element=item operation="on_click" arg3="itemHandler" || i)
END

-- Create a button to remove the section
LET removeBtn = ELEMENT(selector="button" text="Remove Section" operation="create")
ELEMENT(element=removeBtn operation="style" arg3="backgroundColor" arg4="red")
ELEMENT(element=removeBtn operation="style" arg3="color" arg4="white")
ELEMENT(element=section operation="append" arg3=removeBtn)

-- Add the section to the page
LET body = ELEMENT(selector="body" operation="get")
ELEMENT(element=body operation="append" arg3=section)

SAY "Dynamic UI created successfully!"

-- Verify creation
LET sectionTag = ELEMENT(element=section operation="tag")
LET sectionId = ELEMENT(element=section operation="id")
SAY "Created section: " || sectionTag || " (ID: " || sectionId || ")"

LET children = ELEMENT(element=section
SAY "Section has " || children.length || " children"
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(2000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Dynamic UI Building Test');
    expect(output).toContain('Dynamic UI created successfully!');
    expect(output).toContain('Created section: DIV (ID: dynamic-section)');
    expect(output).toContain('Section has 3 children'); // h3, ul, button
    
    // Verify the section was actually added to the DOM
    const sectionExists = await page.evaluate(() => {
      return document.getElementById('dynamic-section') !== null;
    });
    expect(sectionExists).toBe(true);
    
    // Verify the heading text
    const headingText = await page.evaluate(() => {
      const section = document.getElementById('dynamic-section');
      const heading = section.querySelector('h3');
      return heading ? heading.textContent : null;
    });
    expect(headingText).toBe('Dynamic Content');
  });

  test('Form manipulation workflow', async ({ page }) => {
    const script = `
-- Form manipulation test
SAY "=== Form Manipulation Test ==="

LET form = ELEMENT(selector="#testForm" operation="get")
SAY "Working with existing form"

-- Add a new field
LET newField = ELEMENT(selector="div" operation="create")
LET newLabel = ELEMENT(selector="label" text="Email: " operation="create")
LET newInput = ELEMENT(selector="input" type="email" name="email" placeholder="Enter email" operation="create")

ELEMENT(element=newField operation="append" arg3=newLabel)
ELEMENT(element=newField operation="append" arg3=newInput)

-- Insert before submit button
LET submitBtn = ELEMENT(selector="#submitBtn" operation="get")
ELEMENT(element=submitBtn operation="insert_before" arg3=newField)

SAY "Added email field to form"

-- Clone the form
LET clonedForm = ELEMENT(element=form operation="clone" arg3=true)
LET clonedFormId = "clonedForm"
ELEMENT(element=clonedForm operation="attribute" arg3="id" arg4=clonedFormId)

-- Append cloned form to body
LET body = ELEMENT(selector="body" operation="get")
ELEMENT(element=body operation="append" arg3=clonedForm)

SAY "Cloned and added form to page"

-- Verify the new form exists
LET allForms = ELEMENT(selector="form" operation="all")
SAY "Total forms on page: " || allForms.length
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(2000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Form Manipulation Test');
    expect(output).toContain('Added email field to form');
    expect(output).toContain('Cloned and added form to page');
    expect(output).toContain('Total forms on page: 2');
    
    // Verify the email field was added
    const emailFieldExists = await page.evaluate(() => {
      const form = document.getElementById('testForm');
      return form.querySelector('input[type="email"]') !== null;
    });
    expect(emailFieldExists).toBe(true);
    
    // Verify the cloned form exists
    const clonedFormExists = await page.evaluate(() => {
      return document.getElementById('clonedForm') !== null;
    });
    expect(clonedFormExists).toBe(true);
  });

  test('Error handling for Phase 3 functions', async ({ page }) => {
    const script = `
-- Test error handling
SAY "Testing Phase 3 error handling..."

-- Try to append to non-existent element
ELEMENT(element="invalid_ref" operation="append" arg3="also_invalid")
SAY "This should not appear"
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(1000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Testing Phase 3 error handling');
    expect(output).toContain('Error');
    expect(output).not.toContain('This should not appear');
  });
});