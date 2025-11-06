/**
 * Document Write Styled Output Handler - Old school direct page output for RexxJS with styling
 * Uses document.write() style direct HTML injection for SAY output with prettification
 * Includes exception trapping and display in the page
 *
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */
class DocumentWriteStyledOutputHandler {
  /**
   * @param {boolean} [includeTimestamp=false] - Whether to include timestamps
   * @param {string} [cssClass='rexx-output'] - CSS class for output elements
   * @param {string|null} [containerId='rexx-output-container'] - ID of container element for output, or null for document.write mode
   * @param {Function} [exceptionHandler=null] - Optional handler for exceptions, receives (exception, text)
   */
  constructor(includeTimestamp = false, cssClass = 'rexx-output', containerId = 'rexx-output-container', exceptionHandler = null) {
    this.includeTimestamp = includeTimestamp;
    this.cssClass = cssClass;
    this.containerId = containerId;
    this.outputCount = 0;
    this.documentWriteWarningShown = false; // Track if we've shown the warning
    this.exceptionHandler = exceptionHandler;
    this.exceptionCount = 0;
  }

  /**
   * Output text directly to the page using document.write style
   * @param {string} text - The text to output
   */
  output(text) {
    // Create output element and append to document body
    this.writeToPage(text);
  }

  /**
   * Output an exception/error to the page
   * @param {Error|string} exception - The exception or error message
   * @param {string} [context=''] - Optional context about where the error occurred
   */
  outputException(exception, context = '') {
    const errorText = exception instanceof Error ? exception.message : String(exception);
    const fullMessage = context ? `${context}: ${errorText}` : errorText;

    if (this.exceptionHandler) {
      this.exceptionHandler(exception, fullMessage);
    }

    this.writeToPage(fullMessage, true);
  }

  /**
   * Write text directly to the page by creating and appending elements
   * @param {string} text - The text to write
   * @param {boolean} [isError=false] - Whether this is an error message
   */
  writeToPage(text, isError = false) {
    this.outputCount++;

    // Create a div element for this output
    const outputDiv = document.createElement('div');
    outputDiv.className = this.cssClass;
    outputDiv.id = `rexx-output-${this.outputCount}`;

    // Format the text content
    let content = text;
    if (this.includeTimestamp) {
      const timestamp = new Date().toLocaleTimeString();
      content = `[${timestamp}] ${text}`;
    }

    // Detect if this is a REXX trace line (starts with >>)
    const isRexxTraceLine = /^\s*>>/.test(content);

    // Add some basic styling - different colors based on type
    let borderColor, backgroundColor, textColor;

    if (isError) {
      borderColor = '#dc3545';  // Red for errors
      backgroundColor = '#f8d7da';
      textColor = '#721c24';
    } else if (isRexxTraceLine) {
      borderColor = '#0d47a1';  // Dark blue for REXX commands
      backgroundColor = '#e3f2fd';
      textColor = '#0d47a1';
    } else {
      borderColor = '#28a745';  // Green for output
      backgroundColor = '#f8f9fa';
      textColor = 'inherit';
    }

    outputDiv.textContent = content;

    outputDiv.style.cssText = `
      background: ${backgroundColor};
      border-left: 4px solid ${borderColor};
      padding: 8px 12px;
      margin: 4px 0;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      white-space: pre-wrap;
      border-radius: 3px;
      color: ${textColor};
    `;

    // Use document.write if containerId is null, otherwise try to append to container
    if (this.containerId === null) {
      // Show warning only once
      if (!this.documentWriteWarningShown) {
        console.log("Some SAY output was placed in the page using document.write() but there is no guarantee that is visible, and if you can't see it check with page inspector and likely scroll toward the bottom");
        this.documentWriteWarningShown = true;
      }

      // Old-school document.write when no container available
      const displayContent = this.includeTimestamp ?
        `[${new Date().toLocaleTimeString()}] ${text}` : text;

      let borderCol, bgCol, txtCol;
      if (isError) {
        borderCol = '#dc3545';
        bgCol = '#f8d7da';
        txtCol = '#721c24';
      } else if (isRexxTraceLine) {
        borderCol = '#0d47a1';
        bgCol = '#e3f2fd';
        txtCol = '#0d47a1';
      } else {
        borderCol = '#28a745';
        bgCol = '#f8f9fa';
        txtCol = 'inherit';
      }

      document.write(`<div style="background: ${bgCol}; border-left: 4px solid ${borderCol}; padding: 8px 12px; margin: 4px 0; font-family: 'Courier New', monospace; font-size: 14px; white-space: pre-wrap; border-radius: 3px; color: ${txtCol};">${displayContent}</div>`);
      return;
    }

    // Try to append to the specified container
    const container = document.getElementById(this.containerId);
    if (!container) {
      throw new Error(`Container element with ID '${this.containerId}' not found`);
    }
    container.appendChild(outputDiv);

    // Auto-scroll to show the new output
    outputDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /**
   * Clear all output from the page
   */
  clear() {
    if (this.containerId === null) {
      throw new Error('Cannot clear output in document.write mode');
    }
    const container = document.getElementById(this.containerId);
    if (!container) {
      throw new Error(`Container element with ID '${this.containerId}' not found`);
    }
    const outputs = container.querySelectorAll(`.${this.cssClass}`);
    outputs.forEach(element => element.remove());
    this.outputCount = 0;
  }
}

// Export for browser
if (typeof window !== 'undefined') {
  window.DocumentWriteStyledOutputHandler = DocumentWriteStyledOutputHandler;
}

// Also support Node.js for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DocumentWriteStyledOutputHandler };
}