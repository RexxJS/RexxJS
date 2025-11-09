(function() {
'use strict';

/**
 * Expression and Value Resolution for REXX interpreter
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
 * Handles core expression evaluation, value resolution, and condition evaluation
 * 
 * This module provides browser/Node.js compatible evaluation functions
 * that work with the interpreter's variable resolution and function calling systems.
 */

/**
 * Resolve values from various sources (literals, variables, expressions)
 * @param {*} value - Value to resolve (can be string, number, object, etc.)
 * @param {Function} variableGetFn - Function to get variable values (variable name -> value)
 * @param {Function} variableHasFn - Function to check if variable exists (variable name -> boolean)
 * @param {Function} evaluateExpressionFn - Function to evaluate expression objects
 * @param {Function} interpolateStringFn - Function to interpolate string templates
 * @param {Function} executeFunctionCallFn - Function to execute function calls
 * @param {Function} isLikelyFunctionNameFn - Function to check if name looks like function
 * @returns {Promise<*>} Resolved value
 */
async function resolveValue(value, variableGetFn, variableHasFn, evaluateExpressionFn, interpolateStringFn, executeFunctionCallFn, isLikelyFunctionNameFn) {
  // Handle expression objects
  if (typeof value === 'object' && value !== null && value.type) {
    if (value.type === 'INTERPOLATED_STRING') {
      return await interpolateStringFn(value.template);
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
    if (value.type === 'LITERAL') {
      // Return literal value without variable resolution
      return value.value;
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
      // Process escape sequences
      unquoted = unquoted.replace(/\\n/g, '\n');
      unquoted = unquoted.replace(/\\t/g, '\t');
      unquoted = unquoted.replace(/\\r/g, '\r');
      unquoted = unquoted.replace(/\\\\/g, '\\');
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
    const parts = value.split('.');
    const varName = parts[0];

    // Check if this is a variable reference
    if (variableHasFn(varName)) {
      let result = variableGetFn(varName);

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
  // Always call variableGetFn for variable-like strings to support variableResolver callback
  if (typeof value === 'string' && value.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
    // Check if variable exists first (to distinguish undefined value from non-existent variable)
    if (variableHasFn(value)) {
      return variableGetFn(value); // Return actual value, even if it's undefined
    }
    // Variable doesn't exist - fall through to return as literal string
  }

  // Check if the value looks like a function call
  if (typeof value === 'string' && value.match(/^[a-zA-Z_][a-zA-Z0-9_]*\s*\(/)) {
    try {
      // Import parseFunctionCall from parser
      let parseFunctionCall;
      if (typeof require !== 'undefined' && typeof module !== 'undefined') {
        // Node.js environment
        parseFunctionCall = require('./parser').parseFunctionCall;
      } else if (typeof window !== 'undefined' && window.parseFunctionCall) {
        // Browser environment
        parseFunctionCall = window.parseFunctionCall;
      }

      if (parseFunctionCall) {
        const funcCall = parseFunctionCall(value);

        if (funcCall) {
          // Execute the function call
          return await executeFunctionCallFn(funcCall);
        }
      }
    } catch (error) {
      // If function call parsing/execution fails, continue to return as literal
    }
  }

  // Check for simple variable references (no dots, no parens)
  // Always call variableGetFn for variable-like strings to support variableResolver callback
  if (typeof value === 'string' && value.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
    const resolved = variableGetFn(value);
    if (resolved !== undefined) {
      return resolved;
    }
    // Variable not found and not resolved - fall through to return as literal
  }

  // Return value as-is if not a variable reference or function call
  return value;
}

/**
 * Evaluate expression objects (LITERAL, VARIABLE, BINARY_OP, etc.)
 * @param {Object} expr - Expression object with type and relevant properties
 * @param {Function} resolveValueFn - Function to resolve values
 * @param {Function} variableGetFn - Function to get variable values
 * @param {Function} variableHasFn - Function to check if variable exists
 * @param {Function} interpolateStringFn - Function to interpolate strings
 * @param {Function} evaluateConcatenationFn - Function to evaluate concatenations
 * @param {Function} executeFunctionCallFn - Function to execute function calls
 * @param {Function} isLikelyFunctionNameFn - Function to check function names
 * @param {Function} isBuiltinFunctionFn - Function to check if function is built-in
 * @param {Function} getBuiltinFunctionFn - Function to get built-in function
 * @param {Function} callConvertParamsToArgsFn - Function to convert params to args
 * @param {Function} isNumericStringFn - Function to check if string is numeric
 * @returns {Promise<*>} Evaluated expression result
 */
async function evaluateExpression(expr, resolveValueFn, variableGetFn, variableHasFn, interpolateStringFn, evaluateConcatenationFn, executeFunctionCallFn, isLikelyFunctionNameFn, isBuiltinFunctionFn, getBuiltinFunctionFn, callConvertParamsToArgsFn, isNumericStringFn, isOperationFn) {
  switch (expr.type) {
    case 'LITERAL':
      return expr.value;

    case 'ARRAY_LITERAL':
      // Handle both old style (with value) and new style (with elements)
      if (expr.value !== undefined) {
        return expr.value;
      } else if (expr.elements !== undefined) {
        // New style: evaluate each element
        const resolvedElements = [];
        for (const element of expr.elements) {
          resolvedElements.push(await resolveValueFn(element));
        }
        return resolvedElements;
      } else {
        return [];
      }

    case 'VARIABLE':
      const varName = expr.name || expr.value;
      
      // Special handling for REXX built-in variables - always check variables first
      const rexxSpecialVars = ['RC', 'ERRORTEXT', 'SIGL'];
      if (typeof varName === 'string' && rexxSpecialVars.includes(varName.toUpperCase())) {
        return await resolveValueFn(varName);
      }
      
      // Always check for variables first - this fixes loop variable resolution
      if (typeof varName === 'string' && variableHasFn(varName)) {
        return await resolveValueFn(varName);
      }
      
      // Only try function calls if it's not a defined variable and looks like a function
      if (typeof varName === 'string' && 
          varName.match(/^[a-zA-Z][a-zA-Z0-9_]*$/) &&
          isLikelyFunctionNameFn(varName)) {
        try {
          const functionCall = { command: varName, params: {} };
          return await executeFunctionCallFn(functionCall);
        } catch (e) {
          // If function call fails, fall back to resolveValue (treat as literal)
          return await resolveValueFn(varName);
        }
      }
      
      return await resolveValueFn(varName);
      
    case 'PIPE_OP':
      // Pipe operator: left |> right
      // Evaluates left side and passes it as first argument to right side function
      // Supports _ placeholder for explicit positioning
      const pipeValue = await evaluateExpression(expr.left, resolveValueFn, variableGetFn, variableHasFn, interpolateStringFn, evaluateConcatenationFn, executeFunctionCallFn, isLikelyFunctionNameFn, isBuiltinFunctionFn, getBuiltinFunctionFn, callConvertParamsToArgsFn, isNumericStringFn);

      // Right side should be a function call or function name
      if (expr.right.type === 'FUNCTION_CALL') {
        // Right side is already a function call
        const funcExpr = expr.right;
        const method = funcExpr.command.toUpperCase();

        if (isBuiltinFunctionFn(method)) {
          const resolvedParams = {};
          let hasPlaceholder = false;

          // Resolve parameters and check for placeholder
          for (const [key, value] of Object.entries(funcExpr.params)) {
            // Check if value is a placeholder
            if (typeof value === 'object' && value !== null && value.type === 'VARIABLE' && value.name === '_') {
              resolvedParams[key] = pipeValue;
              hasPlaceholder = true;
            } else if (typeof value === 'string' && value === '_') {
              resolvedParams[key] = pipeValue;
              hasPlaceholder = true;
            } else {
              resolvedParams[key] = await resolveValueFn(value);
            }
          }

          const builtInFunc = getBuiltinFunctionFn(method);

          if (hasPlaceholder) {
            // Placeholder found, args already have piped value in the right position
            const args = callConvertParamsToArgsFn(method, resolvedParams);
            return await builtInFunc(...args);
          } else {
            // No placeholder, prepend piped value as first argument (default behavior)
            // Build params with piped value, shifting any existing positional args
            const paramsWithPipedValue = { value: pipeValue };
            for (const [key, val] of Object.entries(resolvedParams)) {
              if (key === 'value') {
                // Shift existing 'value' to 'arg2'
                paramsWithPipedValue.arg2 = val;
              } else if (key.match(/^arg(\d+)$/)) {
                // Shift argN to arg(N+1)
                const num = parseInt(RegExp.$1);
                paramsWithPipedValue[`arg${num + 1}`] = val;
              } else {
                // Named parameter - keep as is
                paramsWithPipedValue[key] = val;
              }
            }
            const args = callConvertParamsToArgsFn(method, paramsWithPipedValue);
            return await builtInFunc(...args);
          }
        } else {
          // RPC function call - check for placeholder
          let hasPlaceholder = false;
          const modifiedParams = {};

          for (const [key, value] of Object.entries(funcExpr.params)) {
            if (typeof value === 'object' && value !== null && value.type === 'VARIABLE' && value.name === '_') {
              modifiedParams[key] = pipeValue;
              hasPlaceholder = true;
            } else if (typeof value === 'string' && value === '_') {
              modifiedParams[key] = pipeValue;
              hasPlaceholder = true;
            } else {
              modifiedParams[key] = value;
            }
          }

          if (hasPlaceholder) {
            const modifiedExpr = { ...funcExpr, params: modifiedParams };
            return await executeFunctionCallFn(modifiedExpr);
          } else {
            // No placeholder, prepend piped value
            const modifiedExpr = { ...funcExpr, params: { _0: pipeValue, ...funcExpr.params } };
            return await executeFunctionCallFn(modifiedExpr);
          }
        }
      } else if (expr.right.type === 'VARIABLE') {
        // Right side is just a function name (no arguments)
        const funcName = expr.right.name.toUpperCase();

        if (isBuiltinFunctionFn(funcName)) {
          const builtInFunc = getBuiltinFunctionFn(funcName);
          return await builtInFunc(pipeValue);
        } else {
          // RPC function call with just the piped value
          const funcExpr = { type: 'FUNCTION_CALL', command: funcName, params: { _0: pipeValue } };
          return await executeFunctionCallFn(funcExpr);
        }
      } else {
        throw new Error(`Pipe operator |> expects a function on the right side, but got ${expr.right.type}`);
      }

    case 'BINARY_OP':
      const leftValue = await evaluateExpression(expr.left, resolveValueFn, variableGetFn, variableHasFn, interpolateStringFn, evaluateConcatenationFn, executeFunctionCallFn, isLikelyFunctionNameFn, isBuiltinFunctionFn, getBuiltinFunctionFn, callConvertParamsToArgsFn, isNumericStringFn);
      const rightValue = await evaluateExpression(expr.right, resolveValueFn, variableGetFn, variableHasFn, interpolateStringFn, evaluateConcatenationFn, executeFunctionCallFn, isLikelyFunctionNameFn, isBuiltinFunctionFn, getBuiltinFunctionFn, callConvertParamsToArgsFn, isNumericStringFn);
      
      switch (expr.operator) {
        case '+':
          // In REXX, + always performs numeric addition (with automatic coercion of numeric strings)
          if (!isNumericStringFn(leftValue)) {
            throw new Error(`Non-numeric value in arithmetic: '${leftValue}' is not a valid number`);
          }
          if (!isNumericStringFn(rightValue)) {
            throw new Error(`Non-numeric value in arithmetic: '${rightValue}' is not a valid number`);
          }
          const leftNum = typeof leftValue === 'number' ? leftValue : parseFloat(leftValue);
          const rightNum = typeof rightValue === 'number' ? rightValue : parseFloat(rightValue);
          return leftNum + rightNum;
        case '-':
          if (!isNumericStringFn(leftValue)) {
            throw new Error(`Non-numeric value in arithmetic: '${leftValue}' is not a valid number`);
          }
          if (!isNumericStringFn(rightValue)) {
            throw new Error(`Non-numeric value in arithmetic: '${rightValue}' is not a valid number`);
          }
          return (typeof leftValue === 'number' ? leftValue : parseFloat(leftValue)) -
                 (typeof rightValue === 'number' ? rightValue : parseFloat(rightValue));
        case '*':
          if (!isNumericStringFn(leftValue)) {
            throw new Error(`Non-numeric value in arithmetic: '${leftValue}' is not a valid number`);
          }
          if (!isNumericStringFn(rightValue)) {
            throw new Error(`Non-numeric value in arithmetic: '${rightValue}' is not a valid number`);
          }
          return (typeof leftValue === 'number' ? leftValue : parseFloat(leftValue)) *
                 (typeof rightValue === 'number' ? rightValue : parseFloat(rightValue));
        case '/':
          if (!isNumericStringFn(leftValue)) {
            throw new Error(`Non-numeric value in arithmetic: '${leftValue}' is not a valid number`);
          }
          if (!isNumericStringFn(rightValue)) {
            throw new Error(`Non-numeric value in arithmetic: '${rightValue}' is not a valid number`);
          }
          const divisor = typeof rightValue === 'number' ? rightValue : parseFloat(rightValue);
          if (divisor === 0) {
            throw new Error('Division by zero');
          }
          return (typeof leftValue === 'number' ? leftValue : parseFloat(leftValue)) / divisor;
        case '//':
        case '%':
          if (!isNumericStringFn(leftValue)) {
            throw new Error(`Non-numeric value in arithmetic: '${leftValue}' is not a valid number`);
          }
          if (!isNumericStringFn(rightValue)) {
            throw new Error(`Non-numeric value in arithmetic: '${rightValue}' is not a valid number`);
          }
          const modDivisor = typeof rightValue === 'number' ? rightValue : parseFloat(rightValue);
          if (modDivisor === 0) {
            throw new Error('Division by zero in modulo operation');
          }
          return (typeof leftValue === 'number' ? leftValue : parseFloat(leftValue)) % modDivisor;
        case '**':
          if (!isNumericStringFn(leftValue)) {
            throw new Error(`Non-numeric value in arithmetic: '${leftValue}' is not a valid number`);
          }
          if (!isNumericStringFn(rightValue)) {
            throw new Error(`Non-numeric value in arithmetic: '${rightValue}' is not a valid number`);
          }
          return Math.pow(
            typeof leftValue === 'number' ? leftValue : parseFloat(leftValue),
            typeof rightValue === 'number' ? rightValue : parseFloat(rightValue)
          );
        default:
          throw new Error(`Unknown operator: ${expr.operator}`);
      }
      
    case 'INTERPOLATED_STRING':
      return interpolateStringFn(expr.template);
      
    case 'FUNCTION_CALL':
      // For expressions, we handle built-in functions synchronously
      const method = expr.command.toUpperCase();
      if (isBuiltinFunctionFn(method)) {
        const resolvedParams = {};
        for (const [key, value] of Object.entries(expr.params)) {
          resolvedParams[key] = await resolveValueFn(value);
        }
        const builtInFunc = getBuiltinFunctionFn(method);

        // DOM functions receive params object directly
        if (method.startsWith('DOM_')) {
          return await builtInFunc(resolvedParams);
        }

        // Check if this is an operation (uses named params) or a function (uses positional args)
        if (isOperationFn && isOperationFn(method)) {
          // Operations receive the params object directly (named parameters)
          return await builtInFunc(resolvedParams);
        }

        // Check if this function has been migrated to unified parameter model
        const converterName = `${method}_positional_args_to_named_param_map`;
        const sibling = getBuiltinFunctionFn(converterName);
        if (sibling) {
          // New unified param model - call converter to transform params to named map
          const namedParams = await sibling(...Object.values(resolvedParams));
          return await builtInFunc(namedParams);
        }

        // Function not yet migrated - temporarily use old positional argument conversion
        // This maintains backward compatibility until all functions are migrated
        const args = callConvertParamsToArgsFn(method, resolvedParams);
        return await builtInFunc(...args);
      } else {
        // Allow RPC function calls in expressions (like assignments)
        return await executeFunctionCallFn(expr);
      }
      
    case 'CONCATENATION':
      return await evaluateConcatenationFn(expr.value);

    case 'ARRAY_ACCESS':
      const array = await resolveValueFn(expr.variable);
      const index = await resolveValueFn(expr.index);

      if (Array.isArray(array)) {
        const numericIndex = Number(index);
        if (isNaN(numericIndex)) {
          throw new Error(`Array index must be a number, but got '${index}'`);
        }
        return array[numericIndex];
      } else if (typeof array === 'object' && array !== null) {
        return array[index];
      } else {
        throw new Error(`Variable '${expr.variable}' is not an array or object that can be accessed with brackets.`);
      }
      
    case 'HEREDOC_STRING':
      // Auto-parse JSON if delimiter contains 'json' (case-insensitive)
      if (expr.delimiter && expr.delimiter.toLowerCase().includes('json')) {
        const content = expr.content.trim();
        if (!content) {
          // NO FALLBACK - throw exception for empty content with JSON delimiter
          throw new Error(`Empty content in HEREDOC with JSON delimiter '${expr.delimiter}'`);
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
          throw new Error(`Content does not appear to be JSON but uses JSON delimiter '${expr.delimiter}'. Content must be valid JSON when using JSON delimiter.`);
        }
      }
      return expr.content;
      
    default:
      throw new Error(`Unknown expression type: ${expr.type}`);
  }
}

/**
 * Evaluate condition objects (COMPARISON, BOOLEAN)
 * @param {Object} condition - Condition object with type and relevant properties
 * @param {Function} resolveValueFn - Function to resolve values
 * @param {Function} compareValuesFn - Function to compare values
 * @param {Function} isTruthyFn - Function to check truthiness
 * @returns {Promise<boolean>} Condition evaluation result
 */
async function evaluateCondition(condition, resolveValueFn, compareValuesFn, isTruthyFn) {
  switch (condition.type) {
    case 'COMPARISON':
      const leftValue = await resolveValueFn(condition.left);
      const rightValue = await resolveValueFn(condition.right);

      switch (condition.operator) {
        case '>':
          return compareValuesFn(leftValue, rightValue) > 0;
        case '<':
          return compareValuesFn(leftValue, rightValue) < 0;
        case '>=':
          return compareValuesFn(leftValue, rightValue) >= 0;
        case '<=':
          return compareValuesFn(leftValue, rightValue) <= 0;
        case '=':
        case '==':
          return compareValuesFn(leftValue, rightValue) === 0;
        case '\\=':
        case '!=':
        case '<>':
        case '¬=':
        case '><':
          return compareValuesFn(leftValue, rightValue) !== 0;
        default:
          throw new Error(`Unknown comparison operator: ${condition.operator}`);
      }

    case 'BOOLEAN':
      const value = await resolveValueFn(condition.expression);
      return isTruthyFn(value);

    case 'LOGICAL_AND':
      // Evaluate all parts and return true only if all are true
      for (const part of condition.parts) {
        const partResult = await evaluateCondition(part, resolveValueFn, compareValuesFn, isTruthyFn);
        if (!partResult) {
          return false;
        }
      }
      return true;

    case 'LOGICAL_OR':
      // Evaluate all parts and return true if any is true
      for (const part of condition.parts) {
        const partResult = await evaluateCondition(part, resolveValueFn, compareValuesFn, isTruthyFn);
        if (partResult) {
          return true;
        }
      }
      return false;

    case 'LOGICAL_NOT':
      // Evaluate the operand and negate it
      const operandResult = await evaluateCondition(condition.operand, resolveValueFn, compareValuesFn, isTruthyFn);
      return !operandResult;

    default:
      throw new Error(`Unknown condition type: ${condition.type}`);
  }
}

// UMD pattern for both Node.js and browser compatibility
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = { 
        resolveValue,
        evaluateExpression,
        evaluateCondition
    };
} else if (typeof window !== 'undefined') {
    // Browser environment - register in registry to avoid conflicts
    if (!window.rexxModuleRegistry) {
        window.rexxModuleRegistry = new Map();
    }
    if (!window.rexxModuleRegistry.has('expressionValue')) {
        window.rexxModuleRegistry.set('expressionValue', {
            resolveValue,
            evaluateExpression,
            evaluateCondition
        });
    }
}

})(); // End IIFE