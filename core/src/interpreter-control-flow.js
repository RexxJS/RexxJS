(function() {
'use strict';

/**
 * Control flow execution for REXX interpreter
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
 * Handles IF/THEN/ELSE, DO loops, SELECT/WHEN statements and related control structures
 * 
 * This module provides browser/Node.js compatible control flow functions
 * that work with the interpreter's evaluation and execution methods.
 */

/**
 * Execute IF/THEN/ELSE statement
 * @param {Object} ifCommand - IF command object with condition, thenCommands, elseCommands
 * @param {Function} evaluateConditionFn - Function to evaluate conditions
 * @param {Function} runCommandsFn - Function to execute command lists
 * @returns {Object|null} Result object if terminated, null otherwise
 */
async function executeIfStatement(ifCommand, evaluateConditionFn, runCommandsFn) {
  const conditionResult = await evaluateConditionFn(ifCommand.condition);
  
  if (conditionResult) {
    // Execute THEN branch
    const result = await runCommandsFn(ifCommand.thenCommands);
    if (result && result.terminated) {
      return result;
    }
  } else {
    // Execute ELSE branch (if it exists)
    if (ifCommand.elseCommands.length > 0) {
      const result = await runCommandsFn(ifCommand.elseCommands);
      if (result && result.terminated) {
        return result;
      }
    }
  }
  return null;
}

/**
 * Execute DO statement dispatcher
 * @param {Object} doCommand - DO command object with loopSpec and bodyCommands
 * @param {Function} resolveValueFn - Function to resolve values
 * @param {Function} evaluateConditionFn - Function to evaluate conditions
 * @param {Function} runCommandsFn - Function to execute command lists
 * @param {Map} variables - Variables map
 * @param {Object} errorContext - Error context for RexxError creation
 * @returns {Object|null} Result object if terminated, null otherwise
 */
async function executeDoStatement(doCommand, resolveValueFn, evaluateConditionFn, runCommandsFn, variables, errorContext) {
  const loopSpec = doCommand.loopSpec;
  
  switch (loopSpec.type) {
    case 'RANGE':
      return await executeRangeLoop(loopSpec, doCommand.bodyCommands, resolveValueFn, runCommandsFn, variables);
      
    case 'RANGE_WITH_STEP':
      return await executeRangeLoopWithStep(loopSpec, doCommand.bodyCommands, resolveValueFn, runCommandsFn, variables);
      
    case 'WHILE':
      return await executeWhileLoop(loopSpec, doCommand.bodyCommands, evaluateConditionFn, runCommandsFn);

    case 'UNTIL':
      return await executeUntilLoop(loopSpec, doCommand.bodyCommands, evaluateConditionFn, runCommandsFn);

    case 'REPEAT':
      return await executeRepeatLoop(loopSpec, doCommand.bodyCommands, runCommandsFn);
      
    case 'OVER':
      return await executeOverLoop(loopSpec, doCommand.bodyCommands, resolveValueFn, runCommandsFn, variables);
      
    case 'INFINITE':
      const RexxError = errorContext.RexxError;
      const sourceContext1 = errorContext.currentLineNumber ? {
        lineNumber: errorContext.currentLineNumber,
        sourceLine: errorContext.sourceLines[errorContext.currentLineNumber - 1] || '',
        sourceFilename: errorContext.sourceFilename || '',
        interpreter: errorContext.interpreter
      } : null;
      throw new RexxError('Infinite loops are not supported for safety reasons', 'LOOP', sourceContext1);
      
    default:
      const RexxError2 = errorContext.RexxError;
      const sourceContext2 = errorContext.currentLineNumber ? {
        lineNumber: errorContext.currentLineNumber,
        sourceLine: errorContext.sourceLines[errorContext.currentLineNumber - 1] || '',
        sourceFilename: errorContext.sourceFilename || '',
        interpreter: errorContext.interpreter
      } : null;
      throw new RexxError2(`Unknown loop type: ${loopSpec.type}`, 'LOOP', sourceContext2);
  }
}

/**
 * Execute range loop (DO i = start TO end)
 * @param {Object} loopSpec - Loop specification with start, end, variable
 * @param {Array} bodyCommands - Commands to execute in loop body
 * @param {Function} resolveValueFn - Function to resolve values
 * @param {Function} runCommandsFn - Function to execute command lists
 * @param {Map} variables - Variables map
 * @returns {Object|null} Result object if terminated, null otherwise
 */
async function executeRangeLoop(loopSpec, bodyCommands, resolveValueFn, runCommandsFn, variables) {
  const start = await resolveValueFn(loopSpec.start);
  const end = await resolveValueFn(loopSpec.end);
  const variable = loopSpec.variable;
  
  const startNum = parseInt(start);
  const endNum = parseInt(end);
  
  if (isNaN(startNum) || isNaN(endNum)) {
    throw new Error(`Invalid range values in DO loop: ${start} TO ${end}`);
  }
  
  const step = startNum <= endNum ? 1 : -1;
  
  // Store original value if variable already exists
  const originalValue = variables.get(variable);
  
  try {
    if (step > 0) {
      for (let i = startNum; i <= endNum; i += step) {
        variables.set(variable, i);
        const result = await runCommandsFn(bodyCommands);
        if (result && result.terminated) {
          return result;
        }
      }
    } else {
      for (let i = startNum; i >= endNum; i += step) {
        variables.set(variable, i);
        const result = await runCommandsFn(bodyCommands);
        if (result && result.terminated) {
          return result;
        }
      }
    }
  } finally {
    // In Rexx, DO loop variables persist after the loop completes
    // Only restore the original value if one existed before the loop
    if (originalValue !== undefined) {
      variables.set(variable, originalValue);
    }
    // If no original value existed, keep the loop variable with its final value
  }
  
  return null;
}

/**
 * Execute range loop with step (DO i = start TO end BY step)
 * @param {Object} loopSpec - Loop specification with start, end, step, variable
 * @param {Array} bodyCommands - Commands to execute in loop body
 * @param {Function} resolveValueFn - Function to resolve values
 * @param {Function} runCommandsFn - Function to execute command lists
 * @param {Map} variables - Variables map
 * @returns {Object|null} Result object if terminated, null otherwise
 */
async function executeRangeLoopWithStep(loopSpec, bodyCommands, resolveValueFn, runCommandsFn, variables) {
  const start = await resolveValueFn(loopSpec.start);
  const end = await resolveValueFn(loopSpec.end);
  const step = await resolveValueFn(loopSpec.step);
  const variable = loopSpec.variable;
  
  const startNum = parseInt(start);
  const endNum = parseInt(end);
  const stepNum = parseInt(step);
  
  if (isNaN(startNum) || isNaN(endNum) || isNaN(stepNum)) {
    throw new Error(`Invalid range values in DO loop: ${start} TO ${end} BY ${step}`);
  }
  
  if (stepNum === 0) {
    throw new Error('DO loop step cannot be zero');
  }
  
  // Store original value if variable already exists
  const originalValue = variables.get(variable);
  
  try {
    if (stepNum > 0) {
      for (let i = startNum; i <= endNum; i += stepNum) {
        variables.set(variable, i);
        const result = await runCommandsFn(bodyCommands);
        if (result && result.terminated) {
          return result;
        }
      }
    } else {
      for (let i = startNum; i >= endNum; i += stepNum) {
        variables.set(variable, i);
        const result = await runCommandsFn(bodyCommands);
        if (result && result.terminated) {
          return result;
        }
      }
    }
  } finally {
    // In Rexx, DO loop variables persist after the loop completes
    // Only restore the original value if one existed before the loop
    if (originalValue !== undefined) {
      variables.set(variable, originalValue);
    }
    // If no original value existed, keep the loop variable with its final value
  }
  
  return null;
}

/**
 * Execute WHILE loop (DO WHILE condition)
 * @param {Object} loopSpec - Loop specification with condition
 * @param {Array} bodyCommands - Commands to execute in loop body
 * @param {Function} evaluateConditionFn - Function to evaluate conditions
 * @param {Function} runCommandsFn - Function to execute command lists
 * @returns {Object|null} Result object if terminated, null otherwise
 */
async function executeWhileLoop(loopSpec, bodyCommands, evaluateConditionFn, runCommandsFn) {
  const maxIterations = 10000; // Safety limit
  let iterations = 0;

  while (await evaluateConditionFn(loopSpec.condition)) {
    if (iterations++ > maxIterations) {
      throw new Error('DO WHILE loop exceeded maximum iterations (safety limit)');
    }

    const result = await runCommandsFn(bodyCommands);
    if (result && result.terminated) {
      return result;
    }
  }

  return null;
}

/**
 * Execute UNTIL loop (DO UNTIL condition - loops UNTIL condition becomes true)
 * @param {Object} loopSpec - Loop specification with condition
 * @param {Array} bodyCommands - Commands to execute in loop body
 * @param {Function} evaluateConditionFn - Function to evaluate conditions
 * @param {Function} runCommandsFn - Function to execute command lists
 * @returns {Object|null} Result object if terminated, null otherwise
 */
async function executeUntilLoop(loopSpec, bodyCommands, evaluateConditionFn, runCommandsFn) {
  const maxIterations = 10000; // Safety limit
  let iterations = 0;

  // Loop UNTIL condition becomes true (opposite of WHILE)
  while (!(await evaluateConditionFn(loopSpec.condition))) {
    if (iterations++ > maxIterations) {
      throw new Error('DO UNTIL loop exceeded maximum iterations (safety limit)');
    }

    const result = await runCommandsFn(bodyCommands);
    if (result && result.terminated) {
      return result;
    }
  }

  return null;
}

/**
 * Execute REPEAT loop (DO count times)
 * @param {Object} loopSpec - Loop specification with count
 * @param {Array} bodyCommands - Commands to execute in loop body
 * @param {Function} runCommandsFn - Function to execute command lists
 * @returns {Object|null} Result object if terminated, null otherwise
 */
async function executeRepeatLoop(loopSpec, bodyCommands, runCommandsFn) {
  const count = loopSpec.count;
  
  if (count < 0) {
    throw new Error('DO repeat count cannot be negative');
  }
  
  for (let i = 0; i < count; i++) {
    const result = await runCommandsFn(bodyCommands);
    if (result && result.terminated) {
      return result;
    }
  }
  
  return null;
}

/**
 * Execute OVER loop (DO var OVER array)
 * @param {Object} loopSpec - Loop specification with variable and array
 * @param {Array} bodyCommands - Commands to execute in loop body
 * @param {Function} resolveValueFn - Function to resolve values
 * @param {Function} runCommandsFn - Function to execute command lists
 * @param {Map} variables - Variables map
 * @returns {Object|null} Result object if terminated, null otherwise
 */
async function executeOverLoop(loopSpec, bodyCommands, resolveValueFn, runCommandsFn, variables) {
  const variable = loopSpec.variable;
  const arrayValue = await resolveValueFn(loopSpec.array);
  
  // Handle null or undefined arrays
  if (arrayValue == null) {
    throw new Error('DO OVER: Array cannot be null or undefined');
  }
  
  // Enhanced Array.isArray() guard with better error message
  if (typeof arrayValue === 'object' && arrayValue !== null && !Array.isArray(arrayValue) && arrayValue.length === undefined && Object.keys(arrayValue).length === 0) {
    throw new Error(`DO OVER: Expected array or iterable object, but got empty object ${JSON.stringify(arrayValue)}`);
  }
  
  // Handle strings (convert to character array)
  if (typeof arrayValue === 'string') {
    const chars = arrayValue.split('');
    
    // Store original variable value if it exists
    const originalValue = variables.get(variable);
    
    try {
      for (const char of chars) {
        variables.set(variable, char);
        const result = await runCommandsFn(bodyCommands);
        if (result && result.terminated) {
          return result;
        }
      }
    } finally {
      // Restore original variable value or remove if it didn't exist
      if (originalValue !== undefined) {
        variables.set(variable, originalValue);
      } else {
        variables.delete(variable);
      }
    }
    return null;
  }
  
  // Handle arrays (both JavaScript arrays and array-like objects)
  let itemsToIterate = [];
  
  if (Array.isArray(arrayValue)) {
    itemsToIterate = arrayValue;
  } else if (typeof arrayValue === 'object' && arrayValue.length !== undefined) {
    // Array-like object (has length property)
    // Check if it's 1-indexed (like DOM_GET_ALL result) or 0-indexed
    const hasZeroIndex = arrayValue.hasOwnProperty('0') || arrayValue.hasOwnProperty(0);
    const hasOneIndex = arrayValue.hasOwnProperty('1') || arrayValue.hasOwnProperty(1);
    
    if (hasOneIndex && !hasZeroIndex) {
      // 1-indexed array-like object (e.g., from DOM_GET_ALL)
      for (let i = 1; i <= arrayValue.length; i++) {
        itemsToIterate.push(arrayValue[i]);
      }
    } else {
      // 0-indexed array-like object (standard JavaScript arrays)
      for (let i = 0; i < arrayValue.length; i++) {
        itemsToIterate.push(arrayValue[i]);
      }
    }
  } else if (typeof arrayValue === 'object') {
    // Regular object - iterate over values
    itemsToIterate = Object.values(arrayValue);
  } else {
    // Single value - treat as array with one element
    itemsToIterate = [arrayValue];
  }
  
  // Store original variable value if it exists
  const originalValue = variables.get(variable);
  
  try {
    for (const item of itemsToIterate) {
      variables.set(variable, item);
      const result = await runCommandsFn(bodyCommands);
      if (result && result.terminated) {
        return result;
      }
    }
  } finally {
    // In REXX, loop variables typically persist after the loop
    // But we'll restore the original value if one existed before
    if (originalValue !== undefined) {
      variables.set(variable, originalValue);
    }
    // If no original value existed, keep the final loop value
  }
  
  return null;
}

/**
 * Execute SELECT/WHEN/OTHERWISE statement
 * @param {Object} selectCommand - SELECT command with whenClauses and otherwiseCommands
 * @param {Function} evaluateConditionFn - Function to evaluate conditions
 * @param {Function} runCommandsFn - Function to execute command lists
 * @returns {Object|null} Result object if terminated, null otherwise
 */
async function executeSelectStatement(selectCommand, evaluateConditionFn, runCommandsFn) {
  // Evaluate each WHEN clause in order until one matches
  for (const whenClause of selectCommand.whenClauses) {
    const conditionResult = await evaluateConditionFn(whenClause.condition);
    
    if (conditionResult) {
      // Trace entering this WHEN branch if interpreter context available via 'this'
      try {
        if (this && typeof this.addTraceOutput === 'function') {
          const ln = whenClause.lineNumber || null;
          // Prefer original source line if available
          let msg = 'WHEN';
          if (ln && this.sourceLines && this.sourceLines[ln - 1]) {
            msg = this.sourceLines[ln - 1].trim();
          }
          this.addTraceOutput(msg, 'instruction', ln);
        }
      } catch (e) { /* no-op */ }
      // Execute this WHEN clause in-place and stop (no fall-through)
      if (this && Array.isArray(whenClause.commands)) {
        for (let i = 0; i < whenClause.commands.length; i++) {
          const result = await this.executeCommand(whenClause.commands[i]);
          if (result && result.terminated) {
            return result;
          }
          if (result && result.jump) {
            return result;
          }
          if (result && result.skipCommands) {
            i += result.skipCommands;
          }
        }
      } else {
        // Fallback to provided runner if context not bound (shouldn't happen in interpreter usage)
        const result = await runCommandsFn(whenClause.commands);
        if (result && result.terminated) return result;
      }
      return null; // Exit SELECT after executing a WHEN clause
    }
  }
  
  // If no WHEN clause matched, execute OTHERWISE if it exists
  if (selectCommand.otherwiseCommands.length > 0) {
    // Trace OTHERWISE selection if we have context
    try {
      if (this && typeof this.addTraceOutput === 'function') {
        // Use OTHERWISE header line number captured by parser
        const ln = selectCommand.otherwiseLineNumber || null;
        let msg = 'OTHERWISE';
        if (ln && this.sourceLines && this.sourceLines[ln - 1]) {
          // If source has the OTHERWISE line, use it verbatim
          const src = this.sourceLines[ln - 1].trim();
          if (/^OTHERWISE/i.test(src)) msg = src; else msg = 'OTHERWISE';
        }
        this.addTraceOutput(msg, 'instruction', ln);
      }
    } catch (e) { /* no-op */ }
    if (this && Array.isArray(selectCommand.otherwiseCommands)) {
      for (let i = 0; i < selectCommand.otherwiseCommands.length; i++) {
        const result = await this.executeCommand(selectCommand.otherwiseCommands[i]);
        if (result && result.terminated) {
          return result;
        }
        if (result && result.jump) {
          return result;
        }
        if (result && result.skipCommands) {
          i += result.skipCommands;
        }
      }
    } else {
      const result = await runCommandsFn(selectCommand.otherwiseCommands);
      if (result && result.terminated) return result;
    }
  }
  
  return null;
}

// UMD pattern for both Node.js and browser compatibility
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = {
        executeIfStatement,
        executeDoStatement,
        executeRangeLoop,
        executeRangeLoopWithStep,
        executeWhileLoop,
        executeUntilLoop,
        executeRepeatLoop,
        executeOverLoop,
        executeSelectStatement
    };
} else if (typeof window !== 'undefined') {
    // Browser environment - register in registry to avoid conflicts
    if (!window.rexxModuleRegistry) {
        window.rexxModuleRegistry = new Map();
    }
    if (!window.rexxModuleRegistry.has('controlFlow')) {
        window.rexxModuleRegistry.set('controlFlow', {
            executeIfStatement,
            executeDoStatement,
            executeRangeLoop,
            executeRangeLoopWithStep,
            executeWhileLoop,
            executeUntilLoop,
            executeRepeatLoop,
            executeOverLoop,
            executeSelectStatement
        });
    }
}

})(); // End IIFE
