(function() {
'use strict';

/**
 * Execution context management for REXX interpreter
 * Handles the execution stack for nested contexts (main, interpret, subroutine, etc.)
 * 
 * This module provides browser/Node.js compatible execution context functions
 * that can be used without external dependencies.
 */

/**
 * Create a new execution context object
 * @param {string} type - Context type ('main', 'interpret', 'subroutine', etc.)
 * @param {number} lineNumber - Current line number
 * @param {string} sourceLine - Source code line
 * @param {string} sourceFilename - Source filename
 * @param {Object} details - Additional context details
 * @returns {Object} New execution context
 */
function createExecutionContext(type, lineNumber, sourceLine, sourceFilename, details = {}) {
  return {
    type,
    lineNumber,
    sourceLine,
    sourceFilename,
    details,
    timestamp: Date.now()
  };
}

/**
 * Push a new execution context onto the stack
 * @param {Array} executionStack - The execution stack array
 * @param {string} type - Context type
 * @param {number} lineNumber - Current line number
 * @param {string} sourceLine - Source code line
 * @param {string} sourceFilename - Source filename
 * @param {Object} details - Additional context details
 * @returns {Object} The created context
 */
function pushExecutionContext(executionStack, type, lineNumber, sourceLine, sourceFilename, details = {}) {
  const context = createExecutionContext(type, lineNumber, sourceLine, sourceFilename, details);
  
  // console.log(`[DEBUG] Pushing ${type} context at line ${lineNumber}: "${sourceLine}" (stack will be depth: ${executionStack.length + 1})`);
  executionStack.push(context);
  
  return context;
}

/**
 * Pop the top execution context from the stack
 * @param {Array} executionStack - The execution stack array
 * @returns {Object|null} The popped context or null if stack was empty
 */
function popExecutionContext(executionStack) {
  const popped = executionStack.pop();
  // console.log(`[DEBUG] Popped ${popped ? popped.type : 'null'} context (stack now depth: ${executionStack.length})`);
  
  return popped || null;
}

/**
 * Get the current (top) execution context
 * @param {Array} executionStack - The execution stack array
 * @returns {Object|null} The current context or null if stack is empty
 */
function getCurrentExecutionContext(executionStack) {
  return executionStack[executionStack.length - 1] || null;
}

/**
 * Find the most recent INTERPRET context in the stack
 * @param {Array} executionStack - The execution stack array
 * @returns {Object|null} The most recent INTERPRET context or null if none found
 */
function getInterpretContext(executionStack) {
  // Find the most recent INTERPRET context in the stack
  for (let i = executionStack.length - 1; i >= 0; i--) {
    if (executionStack[i].type === 'interpret') {
      return executionStack[i];
    }
  }
  return null;
}

/**
 * Get the current line number from the execution context stack
 * @param {Array} executionStack - The execution stack array
 * @returns {number|null} Current line number or null if no context
 */
function getCurrentLineNumber(executionStack) {
  const currentContext = getCurrentExecutionContext(executionStack);
  return currentContext ? currentContext.lineNumber : null;
}

/**
 * Update the line number of the current execution context
 * @param {Array} executionStack - The execution stack array
 * @param {number} lineNumber - New line number
 * @param {string} sourceLine - New source line (optional)
 */
function updateCurrentContextLine(executionStack, lineNumber, sourceLine = '') {
  const currentContext = getCurrentExecutionContext(executionStack);
  if (currentContext) {
    currentContext.lineNumber = lineNumber;
    if (sourceLine) {
      currentContext.sourceLine = sourceLine;
    }
  }
}

// UMD pattern for both Node.js and browser compatibility
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = { 
        createExecutionContext,
        pushExecutionContext, 
        popExecutionContext, 
        getCurrentExecutionContext, 
        getInterpretContext,
        getCurrentLineNumber,
        updateCurrentContextLine
    };
} else if (typeof window !== 'undefined') {
    // Browser environment - register in registry to avoid conflicts
    if (!window.rexxModuleRegistry) {
        window.rexxModuleRegistry = new Map();
    }
    if (!window.rexxModuleRegistry.has('executionContext')) {
        window.rexxModuleRegistry.set('executionContext', {
            createExecutionContext,
            pushExecutionContext,
            popExecutionContext,
            getCurrentExecutionContext,
            getInterpretContext,
            getCurrentLineNumber,
            updateCurrentContextLine
        });
    }
}

})(); // End IIFE