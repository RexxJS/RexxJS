/**
 * REXX Function Call Execution
 *
 * Handles execution of all types of function calls including:
 * - Built-in REXX functions
 * - Operations
 * - External functions from REQUIRE'd libraries
 * - RPC calls to ADDRESS handlers
 *
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

(function() {
'use strict';

/**
 * Execute a function call with proper dispatch to built-in functions, operations, or RPC
 *
 * @param {Object} funcCall - The function call object with command and params
 * @param {Object} context - Context object with interpreter state and utilities
 * @returns {Promise<*>} The function result
 */
async function executeFunctionCall(funcCall, context) {
  const {
    resolveValueFn,
    callConvertParamsToArgsFn,
    checkFunctionRequiresParametersFn,
    createMissingFunctionErrorFn,
    executeBrowserStringFunctionFn,
    builtInFunctions,
    operations,
    externalFunctions,
    addressTargets,
    address,
    variables,
    addressSender,
    currentLineNumber,
    sourceLines,
    sourceFilename,
    interpolation,
    RexxError
  } = context;

  const method = funcCall.command.toUpperCase();

  // Check for functions that require parameters but were called without any
  const hasNoParams = Object.keys(funcCall.params || {}).length === 0;
  if (hasNoParams && checkFunctionRequiresParametersFn(method)) {
    throw new Error(`${funcCall.command} function requires parameters`);
  }

  // Special handling for REXX built-in variables that might be parsed as function calls
  const rexxSpecialVars = ['RC', 'ERRORTEXT', 'SIGL'];
  if (rexxSpecialVars.includes(method)) {
    return variables.get(method) || method; // Return variable value or variable name if not set
  }

  // Special handling for REQUIRE to avoid circular reference in operations registry
  // REQUIRE is handled separately because it captures 'this' and would create circular refs
  if (method === 'REQUIRE') {
    const resolvedParams = {};
    for (const [key, value] of Object.entries(funcCall.params || {})) {
      // asClause should not be resolved - it's a literal pattern string
      if (key === 'asClause') {
        resolvedParams[key] = value;
      } else {
        const resolved = await resolveValueFn(value);
        resolvedParams[key] = resolved;
      }
    }

    const libraryName = resolvedParams.value || resolvedParams.libraryName;
    const asClause = resolvedParams.asClause || null;
    return await builtInFunctions['REQUIRE'](libraryName, asClause);
  }

  // Check if this is a built-in REXX function FIRST
  // Built-in functions like LENGTH, SUBSTR, POS should ALWAYS work regardless of ADDRESS context
  if (builtInFunctions[method]) {
    // Built-in functions can have both positional and named parameters
    const resolvedParams = {};

    // Debug logging for DOM functions
    if (method.startsWith('DOM_')) {
      console.log(`Executing ${method} with params:`, funcCall.params);
    }

    for (const [key, value] of Object.entries(funcCall.params || {})) {
      const resolved = await resolveValueFn(value);
      resolvedParams[key] = resolved;
      if (method.startsWith('DOM_')) {
        console.log(`  Resolved ${key}: ${value} -> ${resolved}`);
      }
    }

    // For built-in functions, handle differently based on function type
    const builtInFunc = builtInFunctions[method];

    // DOM functions receive params object directly
    if (method.startsWith('DOM_')) {
      console.log(`${method} calling with params object:`, resolvedParams);
      return await builtInFunc(resolvedParams);
    }

    // Check if this function has been migrated to unified parameter model
    const converterName = `${method}_positional_args_to_named_param_map`;
    if (builtInFunctions[converterName]) {
      // New unified param model - call converter to transform params to named map
      const converter = builtInFunctions[converterName];
      const namedParams = await converter(...Object.values(resolvedParams));
      return await builtInFunc(namedParams);
    }

    // Function not yet migrated - temporarily use old positional argument conversion
    // This maintains backward compatibility until all functions are migrated
    const args = callConvertParamsToArgsFn(method, resolvedParams);
    return await builtInFunc(...args);
  }

  // Check if this is a built-in operation
  // Operations receive named params directly (not converted to positional args)
  // Check both original case and uppercase (like externalFunctions)
  if (operations[funcCall.command] || operations[method]) {
    const resolvedParams = {};

    for (const [key, value] of Object.entries(funcCall.params || {})) {
      // asClause should not be resolved - it's a literal pattern string
      if (key === 'asClause') {
        resolvedParams[key] = value;
      } else {
        const resolved = await resolveValueFn(value);
        resolvedParams[key] = resolved;
      }
    }

    const operation = operations[funcCall.command] || operations[method];

    // Pass params object directly - operations use named parameters
    return await operation(resolvedParams);
  }

  // Check if this is an external function from REQUIRE'd library (case-sensitive check first, then uppercase)
  if (externalFunctions[funcCall.command] || externalFunctions[method]) {
    const resolvedParams = {};
    for (const [key, value] of Object.entries(funcCall.params || {})) {
      resolvedParams[key] = await resolveValueFn(value);
    }

    const externalFunc = externalFunctions[funcCall.command] || externalFunctions[method];
    const args = callConvertParamsToArgsFn(funcCall.command, resolvedParams);

    return await externalFunc(...args);
  }

  // Check if current ADDRESS target has a handler for custom methods
  // This allows ADDRESS targets to define their own methods while still preserving built-in functions
  if (address !== 'default') {
    const addressTarget = addressTargets.get(address);
    if (addressTarget && addressTarget.handler) {
      const resolvedParams = {};
      for (const [key, value] of Object.entries(funcCall.params || {})) {
        resolvedParams[key] = await resolveValueFn(value);
      }
      const result = await addressTarget.handler(funcCall.command, resolvedParams);
      return result;
    }
  }

  // Try browser-compatible string functions before missing function check
  const resolvedParams = {};
  for (const [key, value] of Object.entries(funcCall.params || {})) {
    resolvedParams[key] = await resolveValueFn(value);
  }
  const args = Object.values(resolvedParams);

  const browserResult = executeBrowserStringFunctionFn(method, args);
  if (browserResult !== null) {
    return browserResult;
  }

  // Not a built-in function, proceed with RPC call
  if (!addressSender) {
    const sourceContext = currentLineNumber ? {
      lineNumber: currentLineNumber,
      sourceLine: sourceLines[currentLineNumber - 1] || '',
      sourceFilename: sourceFilename || '',
      interpreter: context.interpreterInstance,
      interpolation: interpolation
    } : null;

    // Enhanced error message with categorization and documentation links
    const errorMessage = createMissingFunctionErrorFn(method);
    throw new RexxError(errorMessage, 'FUNCTION', sourceContext);
  }

  // resolvedParams already computed above for browser functions

  // Fall back to Address Sender for unregistered ADDRESS targets
  const namespace = address;
  const rpcMethod = funcCall.command;

  return await addressSender.send(namespace, rpcMethod, resolvedParams);
}

/**
 * Check if a function requires parameters
 *
 * @param {string} method - The function name (uppercase)
 * @param {Object} context - Context with function registries
 * @returns {boolean} True if function requires parameters
 */
function checkFunctionRequiresParameters(method, context) {
  const { builtInFunctions, operations } = context;

  // Check function metadata for parameter requirements
  const func = builtInFunctions[method] || operations[method];
  if (func) {
    // Check if function has metadata declaring parameter requirements
    if (func.requiresParameters === true) {
      return true;
    }
    if (func.requiresParameters === false) {
      return false;
    }
    // Check if function has parameterMetadata
    if (func.parameterMetadata && func.parameterMetadata.length > 0) {
      // If function has parameter metadata, it likely requires parameters
      const requiredParams = func.parameterMetadata.filter(p => !p.optional);
      return requiredParams.length > 0;
    }
  }

  // Pattern-based checks for known function types
  // DOM functions always require parameters
  if (method.startsWith('DOM_')) {
    return true;
  }

  // Functions that are known to not require parameters
  const parameterlessFunction = ['TODAY', 'EXCEL_NOW', 'NOW', 'RANDOM', 'UUID', 'RC', 'ERRORTEXT', 'SIGL'].includes(method);
  if (parameterlessFunction) {
    return false;
  }

  // If function exists but no metadata, assume it needs parameters (safer default)
  if (func) {
    return true;
  }

  // Function not found - let normal flow handle it
  return false;
}

// UMD pattern for both Node.js and browser compatibility
if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment
  module.exports = {
    executeFunctionCall,
    checkFunctionRequiresParameters
  };
} else if (typeof window !== 'undefined') {
  // Browser environment - register in registry to avoid conflicts
  if (!window.rexxModuleRegistry) {
    window.rexxModuleRegistry = new Map();
  }
  if (!window.rexxModuleRegistry.has('functionExecution')) {
    window.rexxModuleRegistry.set('functionExecution', {
      executeFunctionCall,
      checkFunctionRequiresParameters
    });
  }
}

})(); // End IIFE
