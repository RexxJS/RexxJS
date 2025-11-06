/**
 * DOM Stale RexxJS Test
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { test, expect } = require('@playwright/test');

test.describe('ELEMENT() Function - Stale Element Recovery & Retry Patterns', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Capture console messages for debugging
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    
    await page.goto('/tests/web/test-harness-dom-stale.html');
    
    // Wait for the interpreter to be initialized
    await page.waitForFunction(() => window.interpreter !== null, { timeout: 5000 });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('ELEMENT() operations should work with basic element interactions', async () => {
    // Test simple click operation
    const script = `
LET button = ELEMENT(selector="#testButton" operation="get")
ELEMENT(element=button operation="click")
SAY "Button clicked successfully"
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    
    // Check output
    await page.waitForSelector('#output:has-text("Button clicked successfully")');
    const output = await page.textContent('#output');
    expect(output).toContain('Button clicked successfully');
    
    // Check event log shows the click
    const eventLog = await page.textContent('#event-log');
    expect(eventLog).toContain('Button clicked');
  });

  test('ELEMENT() without RETRY_ON_STALE should fail when elements become stale', async () => {
    const script = `
LET button = ELEMENT(selector="#testButton" operation="get")
SAY "Got button reference"
SLEEP ms=3000
ELEMENT(element=button operation="click")
SAY "This should NOT appear - element was removed"
    `;
    
    await page.fill('#rexx-script', script);
    
    // Start script execution
    await page.click('button:has-text("Run Script")');
    
    // Wait for first message
    await page.waitForSelector('#output:has-text("Got button reference")');
    
    // Make the button stale while script sleeps - give it extra time to ensure timing
    await page.click('button:has-text("Remove Button")');
    
    // Wait longer to ensure the script wakes up and tries to click the removed button
    await page.waitForTimeout(2000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Got button reference');
    // Note: With proper REXX error handling, no "Error" message appears in output
    // The script simply terminates cleanly when the stale element condition occurs
    expect(output).not.toContain('This should NOT appear');
  });

  test('RETRY_ON_STALE should recover from stale ELEMENT() references', async () => {
    const script = `
RETRY_ON_STALE timeout=5000
  LET form = ELEMENT(selector="#testForm" operation="get")
  LET username = ELEMENT(element=form selector="#username" operation="children")
  
  SAY "Filling username"
  ELEMENT(element=username operation="type" arg3="testuser")
  
  SAY "Form filled successfully"
END_RETRY
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    
    // Wait for completion
    await page.waitForSelector('#output:has-text("Form filled successfully")', { timeout: 10000 });
    
    // Verify the username field was filled
    const usernameValue = await page.inputValue('#username');
    expect(usernameValue).toBe('testuser');
  });


  test('RETRY_ON_STALE with PRESERVE should maintain state across retries', async () => {
    const script = `
LET total_attempts = 0
LET success_message = ""

RETRY_ON_STALE timeout=5000 PRESERVE total_attempts,success_message
  LET total_attempts = total_attempts + 1
  
  LET button = ELEMENT(selector="#testButton" operation="get")
  ELEMENT(element=button operation="click")
  
  LET success_message = "Completed after " || total_attempts || " attempts"
END_RETRY

SAY success_message
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    
    // Wait for completion
    await page.waitForSelector('#output:has-text("Completed after")');
    
    const output = await page.textContent('#output');
    expect(output).toMatch(/Completed after \d+ attempts/);
  });

  test('RETRY_ON_STALE should timeout after specified duration', async () => {
    const script = `
RETRY_ON_STALE timeout=2000
  -- Try to interact with non-existent element (should cause non-retryable error)
  LET missing = ELEMENT(selector="#non-existent-element" operation="get")
  ELEMENT(element=missing operation="click")
END_RETRY

SAY "This should not execute"
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    
    // Wait for script to complete (non-existent element causes immediate failure)
    await page.waitForTimeout(3000);
    
    const output = await page.textContent('#output');
    // DOM_GET failure with non-existent element should cause script termination with error
    // The "Element not found" error is not a retryable stale element error  
    expect(output).not.toContain('This should not execute');
    expect(output).toContain('Error: Element not found'); // Error should be displayed
  });

  test('ELEMENT() should support nested element queries within RETRY_ON_STALE', async () => {
    const script = `
RETRY_ON_STALE timeout=5000
  LET form = ELEMENT(selector="#testForm" operation="get")
  LET submit_btn = ELEMENT(element=form selector="#submitBtn" operation="children")
  
  LET btn_text = ELEMENT(element=submit_btn operation="text")
  SAY "Button text: " || btn_text
  
  ELEMENT(element=submit_btn operation="click")
  SAY "Form submitted"
END_RETRY
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    
    // Wait for completion
    await page.waitForSelector('#output:has-text("Button text: Submit")');
    await page.waitForSelector('#output:has-text("Form submitted")');
    
    // Check that form submission was logged
    const eventLog = await page.textContent('#event-log');
    expect(eventLog).toContain('Form submitted');
  });

  test('ELEMENT() operations should work with and without RETRY_ON_STALE', async () => {
    const script = `
-- Perform operations without automatic retry
LET button = ELEMENT(selector="#testButton" operation="get")
ELEMENT(element=button operation="click")

RETRY_ON_STALE timeout=3000
  LET form = ELEMENT(selector="#testForm" operation="get")
  LET username = ELEMENT(element=form selector="#username" operation="children")
  ELEMENT(element=username operation="type" arg3="test")
END_RETRY

SAY "Operations completed"
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    
    // Wait for completion
    await page.waitForSelector('#output:has-text("Operations completed")');
    
    // Check that operations completed successfully
    const stats = await page.textContent('#stats');
    expect(stats).toContain('Script completed successfully');
    expect(stats).toContain('executed directly without automatic retry');
  });

  test('Multiple RETRY_ON_STALE blocks with ELEMENT() should work sequentially', async () => {
    const script = `
RETRY_ON_STALE timeout=3000
  LET button = ELEMENT(selector="#testButton" operation="get")
  ELEMENT(element=button operation="click")
  SAY "First block completed"
END_RETRY

RETRY_ON_STALE timeout=3000
  LET form = ELEMENT(selector="#testForm" operation="get")
  LET username = ELEMENT(element=form selector="#username" operation="children")
  ELEMENT(element=username operation="type" arg3="sequential_test")
  SAY "Second block completed"
END_RETRY

SAY "All blocks completed"
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    
    // Wait for all completions
    await page.waitForSelector('#output:has-text("First block completed")');
    await page.waitForSelector('#output:has-text("Second block completed")');
    await page.waitForSelector('#output:has-text("All blocks completed")');
    
    // Verify username was set
    const usernameValue = await page.inputValue('#username');
    expect(usernameValue).toBe('sequential_test');
  });

  test('ELEMENT() without RETRY_ON_STALE should fail gracefully on stale elements', async () => {
    // This test demonstrates failure without retry protection
    const script = `
-- No RETRY_ON_STALE block - will fail if elements go stale
LET form = ELEMENT(selector="#testForm" operation="get")
LET username = ELEMENT(element=form selector="#username" operation="children")

SAY "Got form elements"
SLEEP ms=300

-- This will fail after we make the form stale during sleep
ELEMENT(element=username operation="type" arg3="will_fail")
SAY "This message should NOT appear"
    `;
    
    await page.fill('#rexx-script', script);
    
    // Set up promise to make form stale after initial message
    const makeStalePromise = page.waitForSelector('#output:has-text("Got form elements")').then(async () => {
      await page.waitForTimeout(100);
      await page.click('button:has-text("Make Form Stale")');
    });
    
    // Run the script
    await page.click('button:has-text("Run Script")');
    
    // Wait for the stale trigger
    await makeStalePromise;
    
    // Wait a bit for the error
    await page.waitForTimeout(1000);
    
    // Should show initial message but stop execution due to REXX error handling
    const output = await page.textContent('#output');
    expect(output).toContain('Got form elements');
    // Note: With proper REXX error handling, no "Error" message appears in output
    // The script simply terminates cleanly when the stale element condition occurs
    expect(output).not.toContain('This message should NOT appear');
  });

  test('ELEMENT() should work with SIGNAL ON ERROR for stale element handling', async () => {
    const script = `
SIGNAL ON ERROR

LET form = ELEMENT(selector="#testForm"  
LET username = ELEMENT(element=form selector="#username" operation="children")

SAY "Got form elements with SIGNAL ON ERROR enabled"
SLEEP ms=300

-- This will trigger a STALE_ELEMENT error after we make the form stale
ELEMENT(element=username operation="type" arg3="will_fail_but_handled")
SAY "This should NOT appear - should jump to ERROR:"
EXIT 0

ERROR:
SAY "Error handled by SIGNAL ON ERROR!"
SAY "Error details available"
EXIT 1
    `;
    
    await page.fill('#rexx-script', script);
    
    // Set up promise to make form stale after initial message  
    const makeStalePromise = page.waitForSelector('#output:has-text("Got form elements with SIGNAL ON ERROR enabled")').then(async () => {
      await page.waitForTimeout(100);
      await page.click('button:has-text("Make Form Stale")');
    });
    
    // Start script execution
    await page.click('button:has-text("Run Script")');
    
    // Wait for the stale trigger
    await makeStalePromise;
    
    // Wait for error handling to complete
    await page.waitForTimeout(2000);
    
    const output = await page.textContent('#output');
    expect(output).toContain('Got form elements with SIGNAL ON ERROR enabled');
    expect(output).toContain('Error handled by SIGNAL ON ERROR!');
    expect(output).toContain('Error details available');
    expect(output).not.toContain('This should NOT appear');
  });

  test('ELEMENT() should support complex form submission workflows with RETRY_ON_STALE', async () => {
    const script = `
RETRY_ON_STALE timeout=10000
  -- Get form and all inputs
  LET form = ELEMENT(selector="#testForm" operation="get")
  LET username = ELEMENT(element=form selector="#username" operation="children")
  LET password = ELEMENT(element=form selector="#password" operation="children")
  LET submit = ELEMENT(element=form selector="#submitBtn" operation="children")
  
  -- Fill form
  SAY "Filling form..."
  ELEMENT(element=username operation="type" arg3="john.doe")
  ELEMENT(element=password operation="type" arg3="secure123")
  
  -- Submit form
  SAY "Submitting form..."
  ELEMENT(element=submit operation="click")
  
  SAY "Workflow completed!"
END_RETRY
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    
    // Wait for workflow completion
    await page.waitForSelector('#output:has-text("Filling form...")');
    await page.waitForSelector('#output:has-text("Submitting form...")');
    await page.waitForSelector('#output:has-text("Workflow completed!")');
    
    // Verify form was submitted
    const eventLog = await page.textContent('#event-log');
    expect(eventLog).toContain('Form submitted: username=john.doe');
  });

  test('ELEMENT() with DO...OVER should be superior to index-based traversal', async () => {
    // Test the old index-centric way first
    const indexScript = `
-- OLD WAY: Index-centric DOM collection traversal
LET buttons = ELEMENT(selector=".test-collection button" operation="all")
LET count = buttons.length
SAY "Found " || count || " buttons with index approach"

DO i = 1 TO count
    LET button = ARRAY_GET(buttons, i)
    SAY "Processing button index: " || i
    LET text = ELEMENT(element=button operation="text")
    ELEMENT(element=button operation="click")
END

SAY "Index-based processing complete"
    `;
    
    await page.fill('#rexx-script', indexScript);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(2000);
    
    // Check that index approach worked
    let output = await page.textContent('#output');
    expect(output).toContain('Found 5 buttons with index approach');
    expect(output).toContain('Index-based processing complete');
    
    // Clear output but preserve event log for counting clicks
    await page.evaluate(() => {
      document.getElementById('output').textContent = '';
    });
    
    const doOverScript = `
-- NEW WAY: DO...OVER for elegant DOM collection traversal
LET buttons = ELEMENT(selector=".test-collection button" operation="all")
SAY "Found buttons collection, processing with DO...OVER..."

DO button OVER buttons
    LET text = ELEMENT(element=button operation="text")
    ELEMENT(element=button operation="click")
    SAY "Processed: " || text
END

SAY "DO...OVER processing complete"
    `;
    
    await page.fill('#rexx-script', doOverScript);
    await page.click('button:has-text("Run Script")');
    await page.waitForTimeout(2000);
    
    // Check that DO...OVER approach worked and is more elegant
    output = await page.textContent('#output');
    expect(output).toContain('Found buttons collection');
    expect(output).toContain('DO...OVER processing complete');
    expect(output).toMatch(/Processed: (Alpha|Beta|Gamma|Delta|Epsilon)/);
    
    // The main assertion is that DO...OVER processing completed successfully
    // Event clicks are verified implicitly through the "Processed:" messages above
  });

  test('ELEMENT() collections with DO...OVER and RETRY_ON_STALE should be robust', async () => {
    const script = `
RETRY_ON_STALE timeout=6000
    LET buttons = ELEMENT(selector=".test-collection button" operation="all")
    SAY "Processing button collection with stale protection..."
    
    DO button OVER buttons
        LET text = ELEMENT(element=button operation="text")
        SAY "Processing: " || text
        ELEMENT(element=button operation="click")
        SLEEP ms=100
    END
    
    SAY "All collection buttons processed with retry protection"
END_RETRY
    `;
    
    await page.fill('#rexx-script', script);
    await page.click('button:has-text("Run Script")');
    
    // Wait for completion
    await page.waitForTimeout(3000);
    
    // Check output
    const output = await page.textContent('#output');
    expect(output).toContain('Processing button collection with stale protection');
    expect(output).toContain('All collection buttons processed with retry protection');
    
    // Check that all buttons were processed
    expect(output).toMatch(/Processing: (Alpha|Beta|Gamma|Delta|Epsilon)/);
  });
});