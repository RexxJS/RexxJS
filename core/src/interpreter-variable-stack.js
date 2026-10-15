(function() {
'use strict';

/**
 * Variable and stack management for REXX interpreter
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * Handles variable resolution, interpolation, and stack operations (PUSH/PULL/QUEUE)
 * 
 * This module provides browser/Node.js compatible variable and stack functions
 * that work with the existing string interpolation utilities.
 */

// Import string processing utilities
// Node.js imports
let interpolateString;
if (typeof require !== 'undefined') {
  const stringProcessing = require('./interpreter-string-and-expression-processing.js');
  interpolateString = stringProcessing.interpolateString;
}

// escape-sequence-processor.js: one pass over a literal's escapes (Node by
// require; in a browser it registers itself on window)
const processEscapeSequences = (typeof require !== 'undefined' && typeof module !== 'undefined')
  ? require('./escape-sequence-processor.js').processEscapeSequences
  : window.processEscapeSequences;

/**
 * Resolve a value by checking variables, handling literals, and processing expressions
 * @param {*} value - Value to resolve (could be string, number, object, etc.)
 * @param {Map} variables - Variables map
 * @param {Function} evaluateExpressionFn - Function to evaluate expressions
 * @param {Function} variableResolver - Optional callback for resolving missing variables
 * @returns {*} Resolved value
 */
async function resolveVariableValue(value, variables, evaluateExpressionFn, variableResolver) {
  // Handle expression objects
  if (typeof value === 'object' && value !== null && value.type) {
    if (value.type === 'INTERPOLATED_STRING') {
      return await interpolateString(value.template, (varName) => resolveVariableValue(varName, variables, evaluateExpressionFn, variableResolver));
    }
    if (value.type === 'HEREDOC_STRING') {
      // Auto-parse JSON if delimiter contains 'json' (case-insensitive)
      if (value.delimiter && value.delimiter.toLowerCase().includes('json')) {
        const content = value.content.trim();
        if (!content) {
          // NO FALLBACK - throw exception for empty content with JSON delimiter
          throw new Error(`Empty content in HEREDOC with JSON delimiter '${value.delimiter}'`);
        }
        if ((content.startsWith('{') && content.endsWith('}')) ||
            (content.startsWith('[') && content.endsWith(']'))) {
          try {
            return JSON.parse(content);
          } catch (e) {
            // NO FALLBACK - throw exception when JSON parsing fails with JSON delimiter
            throw new Error(`Invalid JSON in HEREDOC with JSON delimiter: ${e.message}`);
          }
        } else {
          // NO FALLBACK - throw exception for non-JSON content with JSON delimiter
          throw new Error(`Content does not appear to be JSON but uses JSON delimiter '${value.delimiter}'. Content must be valid JSON when using JSON delimiter.`);
        }
      }
      return value.content;
    }
    return await evaluateExpressionFn(value);
  }
  
  // Handle numeric literals first
  if (typeof value === 'number') {
    return value;
  }
  
  // Handle quoted string literals - strip the quotes (including escaped quotes)
  if (typeof value === 'string') {
    if ((value.startsWith("'") && value.endsWith("'")) || 
        (value.startsWith('"') && value.endsWith('"'))) {
      let unquoted = value.substring(1, value.length - 1);
      // A double-quoted literal's escape sequences, in one pass that takes
      // \\ first (so the second backslash of a \\ never starts a \t):
      // escape-sequence-processor.js. A single-quoted literal has none, as
      // in SAY and evaluateConcatenation.
      if (value[0] === '"') {
        unquoted = processEscapeSequences(unquoted);
      }
      return unquoted;
    }
    // Handle escaped quotes
    if ((value.startsWith('\\"') && value.endsWith('\\"')) || 
        (value.startsWith("\\'") && value.endsWith("\\'"))) {
      return value.substring(2, value.length - 2);
    }
  }
  
  // Handle string literals that are actually numbers
  if (typeof value === 'string' && !isNaN(parseFloat(value)) && isFinite(value)) {
    return parseFloat(value);
  }
  
  // Handle simple array/object literals only - don't auto-parse complex JSON strings
  if (typeof value === 'string') {
    // Only parse empty arrays and objects, not complex JSON
    if (value === '[]') {
      return [];
    }
    if (value === '{}') {
      return {};
    }
  }
  
  // If value is a string that looks like a variable reference (e.g., "myVar.x")
  if (typeof value === 'string' && value.includes('.')) {
    if (variables.has(value)) {
      return variables.get(value);
    }
    const parts = derivedName(value, (n) => variables.has(n), (n) => variables.get(n)).split('.');
    const varName = parts[0];
    
    // Check if this is a variable reference
    if (variables.has(varName)) {
      let result = variables.get(varName);
      
      // Navigate through the property path
      for (let i = 1; i < parts.length; i++) {
        if (result && typeof result === 'object' && parts[i] in result) {
          result = result[parts[i]];
        } else {
          // If path doesn't exist, return original value
          return value;
        }
      }
      return result;
    }
  }
  
  // Check for simple variable references (no dots)
  if (typeof value === 'string' && variables.has(value)) {
    return variables.get(value);
  }

  // Check variableResolver callback for missing variables
  if (typeof value === 'string' && variableResolver && typeof variableResolver === 'function') {
    const resolved = variableResolver(value);
    if (resolved !== undefined) {
      return resolved;
    }
  }
  
  // Check if the value looks like a function call (for resolveValue legacy compatibility)
  if (typeof value === 'string' && value.match(/^[a-zA-Z_][a-zA-Z0-9_]*\s*\(/)) {
    // Return as-is for now - let calling code handle function call parsing
    // This maintains compatibility with the interpreter's function call resolution
    return value;
  }
  
  // Return the value as-is if no special handling applies
  return value;
}

/**
 * Interpolate a string template with variable values
 * @param {string} template - String template with {varName} placeholders
 * @param {Map} variables - Variables map
 * @param {Function} variableResolver - Optional callback for resolving missing variables
 * @returns {string} Interpolated string
 */
async function interpolateStringWithVars(template, variables, variableResolver) {
  let interpolateFn;
  if (typeof interpolateString !== 'undefined') {
    interpolateFn = interpolateString;
  } else if (typeof window !== 'undefined' && window.rexxModuleRegistry && window.rexxModuleRegistry.has('stringProcessing')) {
    interpolateFn = window.rexxModuleRegistry.get('stringProcessing').interpolateString;
  } else if (typeof window !== 'undefined' && window.interpolateString) {
    interpolateFn = window.interpolateString;
  }
  return await interpolateFn(template, (varName) => resolveVariableValue(varName, variables, null, variableResolver));
}

/**
 * A compound symbol's derived name (TRL 3.4): the stem, then each tail part
 * replaced by the value of the variable of that name when one is set. A
 * tail part that is a number, or an unset symbol, stays as it is. A name
 * with no tail, or one set as a whole (RUNTIME.TYPE), is returned as given.
 * @param {string} name - The symbol as written, e.g. list.i
 * @param {Function} has - name -> whether that variable is set
 * @param {Function} get - name -> that variable's value
 * @returns {string} The derived name, e.g. list.2
 */
function derivedName(name, has, get) {
  if (typeof name !== 'string' || !name.includes('.') || has(name)) return name;
  const parts = name.split('.');
  if (!/^[A-Za-z_]\w*$/.test(parts[0])) return name;
  const tail = parts.slice(1).map((part) =>
    /^[A-Za-z_]\w*$/.test(part) && has(part) ? String(get(part)) : part);
  return [parts[0], ...tail].join('.');
}

/**
 * Get variable value
 * @param {string} name - Variable name
 * @param {Map} variables - Variables map
 * @param {Function} variableResolver - Optional callback for resolving missing variables
 * @returns {*} Variable value or undefined
 */
function getVariable(name, variables, variableResolver) {
  // First check the variables map
  if (variables.has(name)) {
    return variables.get(name);
  }

  // If not found, try the variableResolver callback
  if (variableResolver && typeof variableResolver === 'function') {
    const resolved = variableResolver(name);
    if (resolved !== undefined) {
      return resolved;
    }
  }

  // Not found - return undefined
  return undefined;
}

/**
 * Set variable value
 * @param {string} name - Variable name
 * @param {*} value - Variable value
 * @param {Map} variables - Variables map
 */
function setVariable(name, value, variables) {
  variables.set(name, value);
}

/**
 * Push value onto stack (LIFO)
 * @param {*} value - Value to push
 * @param {Array} stack - Stack array
 * @returns {number} New stack length
 */
function stackPush(value, stack) {
  stack.push(String(value || ''));
  return stack.length;
}

/**
 * Pull value from stack (LIFO)
 * @param {Array} stack - Stack array
 * @returns {string} Popped value or empty string if stack is empty
 */
function stackPull(stack) {
  return stack.length > 0 ? stack.pop() : '';
}

/**
 * Queue value to bottom of stack (FIFO)
 * @param {*} value - Value to queue
 * @param {Array} stack - Stack array
 * @returns {number} New stack length
 */
function stackQueue(value, stack) {
  stack.unshift(String(value || ''));
  return stack.length;
}

/**
 * Get stack size
 * @param {Array} stack - Stack array
 * @returns {number} Stack size
 */
function stackSize(stack) {
  return stack.length;
}

/**
 * Peek at top of stack without removing
 * @param {Array} stack - Stack array
 * @returns {string} Top value or empty string if stack is empty
 */
function stackPeek(stack) {
  return stack.length > 0 ? stack[stack.length - 1] : '';
}

/**
 * Clear entire stack
 * @param {Array} stack - Stack array
 * @returns {number} Number of items that were cleared
 */
function stackClear(stack) {
  const count = stack.length;
  stack.length = 0; // Clear array efficiently
  return count;
}

/**
 * Execute PUSH statement - add to top of stack (LIFO)
 * @param {Object} command - PUSH command object
 * @param {Array} stack - Stack array
 * @param {Map} variables - Variables map
 * @param {Function} evaluateExpressionFn - Function to evaluate expressions
 */
async function executePush(command, stack, variables, evaluateExpressionFn) {
  let value;
  if (typeof command.value === 'string') {
    // Check if it's a quoted string
    if ((command.value.startsWith('"') && command.value.endsWith('"')) ||
        (command.value.startsWith("'") && command.value.endsWith("'"))) {
      value = command.value.slice(1, -1); // Remove quotes
    } else {
      // Handle variable references
      value = variables.get(command.value) || command.value;
    }
  } else {
    value = await evaluateExpressionFn(command.value);
  }
  
  stackPush(value, stack);
}

/**
 * Execute PULL statement - pull from top of stack into variable
 * @param {Object} command - PULL command object
 * @param {Array} stack - Stack array
 * @param {Map} variables - Variables map
 */
function executePull(command, stack, variables) {
  const value = stackPull(stack);
  variables.set(command.variable, value);
}

/**
 * Execute QUEUE statement - add to bottom of stack (FIFO)
 * @param {Object} command - QUEUE command object
 * @param {Array} stack - Stack array
 * @param {Map} variables - Variables map
 * @param {Function} evaluateExpressionFn - Function to evaluate expressions
 */
async function executeQueue(command, stack, variables, evaluateExpressionFn) {
  let value;
  if (typeof command.value === 'string') {
    // Check if it's a quoted string
    if ((command.value.startsWith('"') && command.value.endsWith('"')) ||
        (command.value.startsWith("'") && command.value.endsWith("'"))) {
      value = command.value.slice(1, -1); // Remove quotes
    } else {
      // Handle variable references
      value = variables.get(command.value) || command.value;
    }
  } else {
    value = await evaluateExpressionFn(command.value);
  }
  
  stackQueue(value, stack);
}

// UMD pattern for both Node.js and browser compatibility
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = { 
        derivedName,
        resolveVariableValue,
        interpolateStringWithVars,
        getVariable,
        setVariable,
        stackPush,
        stackPull,
        stackQueue,
        stackSize,
        stackPeek,
        stackClear,
        executePush,
        executePull,
        executeQueue
    };
} else if (typeof window !== 'undefined') {
    // Browser environment - register in registry to avoid conflicts
    if (!window.rexxModuleRegistry) {
        window.rexxModuleRegistry = new Map();
    }
    if (!window.rexxModuleRegistry.has('variableStack')) {
        window.rexxModuleRegistry.set('variableStack', {
            derivedName,
            resolveVariableValue,
            interpolateStringWithVars,
            getVariable,
            setVariable,
            stackPush,
            stackPull,
            stackQueue,
            stackSize,
            stackPeek,
            stackClear,
            executePush,
            executePull,
            executeQueue
        });
    }
}

})(); // End IIFE