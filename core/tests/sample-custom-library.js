'use strict';

/**
 * Sample Custom Library
 *
 * This demonstrates how to create a REXX library with exported metadata
 * so that functions can be automatically discovered by FUNCTIONS() and INFO()
 * after being loaded via REQUIRE.
 *
 * Export your metadata in one of these ways:
 * - __metadata__ property (recommended for ES modules)
 * - metadata property (common)
 * - _metadata property (alternative)
 *
 * The registerModuleMetadata() function will look for any of these.
 */

// ============================================================================
// Sample Functions
// ============================================================================

/**
 * Greeting function
 */
function GREET(name) {
  return `Hello, ${name}!`;
}

/**
 * Custom calculator
 */
function CALCULATE(operation, a, b) {
  switch (operation) {
    case 'add': return a + b;
    case 'subtract': return a - b;
    case 'multiply': return a * b;
    case 'divide': return b !== 0 ? a / b : 'Error: division by zero';
    default: return 'Unknown operation';
  }
}

/**
 * Text processor
 */
function PROCESS_TEXT(text, operation) {
  switch (operation) {
    case 'uppercase': return text.toUpperCase();
    case 'lowercase': return text.toLowerCase();
    case 'reverse': return text.split('').reverse().join('');
    case 'wordcount': return text.split(/\s+/).filter(w => w.length > 0).length;
    default: return text;
  }
}

/**
 * Data analyzer
 */
function ANALYZE(data) {
  if (!Array.isArray(data) || data.length === 0) {
    return { count: 0, sum: 0, average: 0, min: null, max: null };
  }

  const numbers = data.filter(n => typeof n === 'number');
  const sum = numbers.reduce((a, b) => a + b, 0);

  return {
    count: numbers.length,
    sum: sum,
    average: numbers.length > 0 ? sum / numbers.length : 0,
    min: Math.min(...numbers),
    max: Math.max(...numbers)
  };
}

// ============================================================================
// Metadata Export Pattern
// ============================================================================

/**
 * Metadata for all functions in this library
 * This allows FUNCTIONS() and INFO() to discover these functions
 * after being loaded via REQUIRE
 */
const __metadata__ = {
  GREET: {
    module: 'sample-custom-library.js',
    category: 'Custom',
    description: 'Generate personalized greeting',
    parameters: ['name'],
    returns: 'string',
    examples: ['GREET("Alice") => "Hello, Alice!"']
  },
  CALCULATE: {
    module: 'sample-custom-library.js',
    category: 'Custom',
    description: 'Perform arithmetic operations',
    parameters: ['operation', 'a', 'b'],
    returns: 'number|string',
    examples: [
      'CALCULATE("add", 2, 3) => 5',
      'CALCULATE("multiply", 4, 5) => 20'
    ]
  },
  PROCESS_TEXT: {
    module: 'sample-custom-library.js',
    category: 'Custom',
    description: 'Process text with various operations',
    parameters: ['text', 'operation'],
    returns: 'string|number',
    examples: [
      'PROCESS_TEXT("hello", "uppercase") => "HELLO"',
      'PROCESS_TEXT("hello world test", "wordcount") => 3'
    ]
  },
  ANALYZE: {
    module: 'sample-custom-library.js',
    category: 'Custom',
    description: 'Analyze array of numbers',
    parameters: ['data'],
    returns: 'object',
    examples: ['ANALYZE([1, 2, 3, 4, 5]) => {count: 5, sum: 15, average: 3, min: 1, max: 5}']
  }
};

// ============================================================================
// Exports
// ============================================================================

// Export functions and metadata for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    GREET,
    CALCULATE,
    PROCESS_TEXT,
    ANALYZE,
    __metadata__
  };
}

// Export to global scope for browser/eval contexts
if (typeof window !== 'undefined') {
  window.GREET = GREET;
  window.CALCULATE = CALCULATE;
  window.PROCESS_TEXT = PROCESS_TEXT;
  window.ANALYZE = ANALYZE;
  window.sample_custom_library_metadata = __metadata__;
}
