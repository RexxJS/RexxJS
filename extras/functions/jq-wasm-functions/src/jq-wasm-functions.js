/*!
 * rexxjs/jq-wasm-functions v1.0.0 | (c) 2025 RexxJS Project | MIT License
 * @rexxjs-meta=JQ_WASM_FUNCTIONS_META
 */
/**
 * jq WASM Functions Library - JSON query execution functions
 * Uses jq-wasm for portable, pure-JavaScript implementation
 *
 * Usage:
 *   REQUIRE "jq-wasm-functions"
 *   LET result = jqQuery('{"name": "RexxJS"}', '.name')
 *   SAY result  // "RexxJS"
 *
 * Available functions:
 *   jqQuery(data, query) - Execute jq query, return parsed result
 *   jqRaw(data, query) - Execute jq query with -r flag, return raw string
 *   jqKeys(data) - Get object keys
 *   jqValues(data) - Get object values
 *   jqLength(data) - Get array/object length
 *   jqType(data) - Get JSON type
 *
 * Note: Works in both Node.js and browser environments with jq-wasm
 * For better performance with system jq binary, use jq-functions (native) instead
 *
 * Copyright (c) 2025 RexxJS Project
 * Licensed under the MIT License
 */

// Import jq-wasm if available
let jq = null;
try {
  if (typeof require !== 'undefined') {
    try {
      jq = require('jq-wasm');
    } catch (requireError) {
      // Fallback: check if jq is available globally
      if (typeof global !== 'undefined' && global.jq) {
        jq = global.jq;
      }
    }
  } else if (typeof window !== 'undefined' && window.jq) {
    jq = window.jq;
  }
} catch (e) {
  // Will be loaded later
}

// jq WASM functions metadata
function JQ_WASM_FUNCTIONS_META() {
  // Check jq-wasm availability
  let jqAvailable = false;
  try {
    if (jq && typeof jq.json === 'function') {
      jqAvailable = true;
    }
  } catch (e) {
    // Not available
  }

  return {
    canonical: "org.rexxjs/jq-wasm-functions",
    type: 'functions-library',
    name: 'jq JSON Query Functions (WASM)',
    version: '1.0.0',
    description: 'JSON query execution functions using jq-wasm (portable, pure-JS)',
    provides: {
      functions: ['jqQuery', 'jqRaw', 'jqKeys', 'jqValues', 'jqLength', 'jqType']
    },
    dependencies: {
      'jq-wasm': '1.1.0-jq-1.8.1'
    },
    envVars: [],
    loaded: true,
    requirements: {
      environment: 'nodejs',
      modules: ['jq-wasm']
    },
    jqAvailable: jqAvailable
  };
}

/**
 * Execute jq query and return the result
 * @param {string|object} data - JSON data (string or object)
 * @param {string} query - jq query expression
 * @returns {any} Query result
 */
async function jqQuery(data, query) {
  if (!jq || typeof jq.json !== 'function') {
    throw new Error('jq-wasm not available. Please install jq-wasm: npm install jq-wasm');
  }

  try {
    // jq-wasm accepts objects, arrays, or JSON strings
    // Don't parse primitives - they need to stay as strings for jq-wasm
    const queryStr = String(query);

    // Execute jq query using jq-wasm (async)
    const result = await jq.json(data, queryStr);

    return result;
  } catch (error) {
    throw new Error(`jq query failed: ${error.message}`);
  }
}

/**
 * Execute jq query with raw output
 * @param {string|object} data - JSON data (string or object)
 * @param {string} query - jq query expression
 * @returns {string} Raw string result
 */
async function jqRaw(data, query) {
  if (!jq || typeof jq.raw !== 'function') {
    throw new Error('jq-wasm not available. Please install jq-wasm: npm install jq-wasm');
  }

  try {
    const queryStr = String(query);

    // Execute jq query with raw output using jq-wasm
    const result = await jq.raw(data, queryStr, ['-r']);

    if (result.stderr) {
      throw new Error(result.stderr);
    }

    return result.stdout.trim();
  } catch (error) {
    throw new Error(`jq query failed: ${error.message}`);
  }
}

/**
 * Get object keys
 * @param {string|object} data - JSON data (string or object)
 * @returns {string[]} Array of keys
 */
async function jqKeys(data) {
  return await jqQuery(data, 'keys');
}

/**
 * Get object values
 * @param {string|object} data - JSON data (string or object)
 * @returns {any[]} Array of values
 */
async function jqValues(data) {
  return await jqQuery(data, '[.[]]');
}

/**
 * Get array/object length
 * @param {string|object} data - JSON data (string or object)
 * @returns {number} Length
 */
async function jqLength(data) {
  return await jqQuery(data, 'length');
}

/**
 * Get JSON type
 * @param {string|object} data - JSON data (string or object)
 * @returns {string} Type (object, array, string, number, boolean, null)
 */
async function jqType(data) {
  return await jqQuery(data, 'type');
}

// Detection function for REQUIRE system
function JQ_WASM_FUNCTIONS_MAIN() {
  return {
    type: 'library_info',
    name: 'jq-wasm Functions',
    version: '1.0.0',
    loaded: true
  };
}

// Export functions to global scope
if (typeof window !== 'undefined') {
  // Browser environment
  window.JQ_WASM_FUNCTIONS_META = JQ_WASM_FUNCTIONS_META;
  window.JQ_WASM_FUNCTIONS_MAIN = JQ_WASM_FUNCTIONS_MAIN;
  window.jqQuery = jqQuery;
  window.jqRaw = jqRaw;
  window.jqKeys = jqKeys;
  window.jqValues = jqValues;
  window.jqLength = jqLength;
  window.jqType = jqType;
} else if (typeof global !== 'undefined') {
  // Node.js environment
  global.JQ_WASM_FUNCTIONS_META = JQ_WASM_FUNCTIONS_META;
  global.JQ_WASM_FUNCTIONS_MAIN = JQ_WASM_FUNCTIONS_MAIN;
  global.jqQuery = jqQuery;
  global.jqRaw = jqRaw;
  global.jqKeys = jqKeys;
  global.jqValues = jqValues;
  global.jqLength = jqLength;
  global.jqType = jqType;
}

// CommonJS export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    JQ_WASM_FUNCTIONS_META,
    JQ_WASM_FUNCTIONS_MAIN,
    jqQuery,
    jqRaw,
    jqKeys,
    jqValues,
    jqLength,
    jqType
  };
}
