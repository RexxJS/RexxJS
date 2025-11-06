/**
 * Shared REXX Demo Executor - Common execution logic for all demo pages
 * Handles script execution, error handling, and output display
 *
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

/**
 * Execute a REXX script from an element ID with comprehensive error handling
 * @param {string} scriptId - The ID of the element containing the REXX script
 * @param {Object} options - Configuration options
 * @param {DocumentWriteStyledOutputHandler} [options.outputHandler] - Custom output handler
 * @param {string} [options.containerId='rexx-output-container'] - Container element ID for output
 * @param {string} [options.traceMode='NORMAL'] - Trace mode for execution
 * @param {boolean} [options.traceToOutput=true] - Whether to show trace in output
 * @returns {Promise<void>}
 */
async function executeRexxDemo(scriptId, options = {}) {
  const {
    outputHandler = null,
    containerId = 'rexx-output-container',
    traceMode = 'NORMAL',
    traceToOutput = true
  } = options;

  // Create default output handler if not provided
  let handler = outputHandler;
  if (!handler) {
    // Ensure container exists or create it
    let container = document.getElementById(containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      // Find output-section or body and insert before
      const outputSection = document.querySelector('.output-section');
      if (outputSection) {
        outputSection.appendChild(container);
      } else {
        document.body.appendChild(container);
      }
    }

    handler = new DocumentWriteStyledOutputHandler(
      false,            // No timestamps
      'rexx-output',    // CSS class
      containerId,      // Use container with proper ID
      (exception, message) => {
        console.error('REXX Demo Error:', exception);
      }
    );
  }

  try {
    // Validate script element exists
    const scriptElement = document.getElementById(scriptId);
    if (!scriptElement) {
      throw new Error(`Script element with ID '${scriptId}' not found`);
    }

    // Validate RexxInterpreterBuilder is available
    if (typeof RexxInterpreterBuilder === 'undefined') {
      throw new Error('RexxInterpreterBuilder not found. Ensure the REXX bundle is loaded.');
    }

    // Create interpreter with the output handler
    const interpreter = new RexxInterpreterBuilder(null)
      .withOutputHandler({
        output: (text) => {
          handler.output(text);
        }
      })
      .withTraceMode(traceMode)
      .withTraceToOutput(traceToOutput)
      .build();

    // Execute the REXX script
    await interpreter.runScriptInId(scriptId);

  } catch (error) {
    // Display the error in the page with styling
    if (handler) {
      handler.outputException(error, 'Script Error');
    }
    console.error('Demo execution failed:', error);
    throw error; // Re-throw for testing/debugging purposes
  }
}

/**
 * Extract expected output patterns from a demo page for testing
 * @param {Document} doc - The document to search (usually document or page.content)
 * @returns {string[]} Array of text content from all output elements
 */
function extractDemoOutput(doc) {
  const outputs = [];
  const outputElements = doc.querySelectorAll('.rexx-output');

  outputElements.forEach(element => {
    const text = element.textContent.trim();
    if (text) {
      outputs.push(text);
    }
  });

  return outputs;
}

/**
 * Get all output as a single concatenated string
 * @param {Document} doc - The document to search
 * @returns {string} All output text concatenated
 */
function getDemoOutputText(doc) {
  return extractDemoOutput(doc).join('\n');
}

/**
 * Check if output contains expected text (case-sensitive by default)
 * @param {Document} doc - The document to search
 * @param {string} expectedText - The text to search for
 * @param {Object} options - Search options
 * @param {boolean} [options.caseInsensitive=false] - Whether to ignore case
 * @returns {boolean} True if text is found in output
 */
function demoOutputContains(doc, expectedText, options = {}) {
  const { caseInsensitive = false } = options;
  const outputText = getDemoOutputText(doc);

  if (caseInsensitive) {
    return outputText.toLowerCase().includes(expectedText.toLowerCase());
  }

  return outputText.includes(expectedText);
}

/**
 * Check if any output element has an error style (red border/background)
 * @param {Document} doc - The document to search
 * @returns {boolean} True if error elements are present
 */
function demoHasErrors(doc) {
  const outputElements = doc.querySelectorAll('.rexx-output');

  for (const element of outputElements) {
    const style = window.getComputedStyle(element);
    // Check for error styling (red colors)
    if (style.borderLeftColor.includes('220, 53, 69') || // #dc3545 in RGB
        style.backgroundColor.includes('248, 215, 218')) { // #f8d7da in RGB
      return true;
    }

    // Also check inline style as fallback
    const inlineStyle = element.getAttribute('style') || '';
    if (inlineStyle.includes('#dc3545') || inlineStyle.includes('#f8d7da')) {
      return true;
    }
  }

  return false;
}

// Export for browsers and Node.js
if (typeof window !== 'undefined') {
  window.executeRexxDemo = executeRexxDemo;
  window.extractDemoOutput = extractDemoOutput;
  window.getDemoOutputText = getDemoOutputText;
  window.demoOutputContains = demoOutputContains;
  window.demoHasErrors = demoHasErrors;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    executeRexxDemo,
    extractDemoOutput,
    getDemoOutputText,
    demoOutputContains,
    demoHasErrors
  };
}
