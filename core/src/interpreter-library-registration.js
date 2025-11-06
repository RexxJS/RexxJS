'use strict';

/**
 * Library registration utilities for REXX interpreter
 *
 * This module provides browser/Node.js compatible functions for registering
 * library functions and operations with the interpreter.
 */

// Import utilities
let utils;
if (typeof require !== 'undefined') {
  utils = require('./utils.js');
}

/**
 * Register library functions and operations
 * @param {Object} interpreter - The interpreter instance (`this`)
 * @param {string} libraryName - The library name
 * @param {string|null} asClause - Optional AS clause for name transformation
 */
function registerLibraryFunctions(interpreter, libraryName, asClause = null) {

  // FIRST: Retrieve and store metadata if available
  // This must happen before getLibraryFunctionList so metadata is available for function discovery
  if (interpreter.libraryMetadataProviders && interpreter.libraryMetadataProviders.has(libraryName)) {
    const metadataFunctionName = interpreter.libraryMetadataProviders.get(libraryName);

    try {
      // Call the metadata provider function to get full metadata
      const metadataFunc = interpreter.getGlobalFunction(metadataFunctionName, libraryName);
      if (metadataFunc) {
        const metadata = metadataFunc();

        // Store metadata for later use by require system and function/operation discovery
        interpreter.libraryMetadata = interpreter.libraryMetadata || new Map();
        interpreter.libraryMetadata.set(libraryName, metadata);
      }
    } catch (error) {
      throw new Error(`Metadata provider function ${metadataFunctionName} failed: ${error.message}`);
    }
  }

  // Get list of functions that should be registered for this library
  // This now has access to metadata stored above
  const libraryFunctions = getLibraryFunctionList(interpreter, libraryName);

  for (const functionName of libraryFunctions) {
    // Get the function from global scope (with library context)
    const func = interpreter.getGlobalFunction(functionName, libraryName);
    if (func) {
      // Apply AS clause transformation if provided
      const registeredName = applyAsClauseToFunction(interpreter, functionName, asClause);

      // Register as external function (from REQUIRE'd library) with potentially modified name
      interpreter.externalFunctions[registeredName] = (...args) => {
        return func(...args);
      };
    }
  }

  // Register operations from this library (if any)
  const libraryOperations = getLibraryOperationList(interpreter, libraryName);

  for (const operationName of libraryOperations) {
    // Get the operation from global scope (with library context)
    const op = interpreter.getGlobalFunction(operationName, libraryName);
    if (op) {
      // Apply AS clause transformation if provided
      const registeredName = applyAsClauseToFunction(interpreter, operationName, asClause);

      // Register as operation (receives params object directly)
      interpreter.operations[registeredName] = (params) => {
        return op(params);
      };
    }
  }
}

/**
 * Apply AS clause transformation to function name
 * @param {Object} interpreter - The interpreter instance (`this`)
 * @param {string} functionName - The original function name
 * @param {string|null} asClause - Optional AS clause for transformation
 * @returns {string} Transformed function name
 */
function applyAsClauseToFunction(interpreter, functionName, asClause) {
  if (!asClause) {
    return functionName; // No transformation
  }

  // Check if AS clause contains regex pattern with capture group
  if (asClause.includes('(.*)')  ) {
    // Extract prefix from pattern: "math_(.*)" -> "math_"
    const prefix = asClause.replace('(.*)', '');
    return prefix + functionName;
  }

  // Simple prefix (no regex)
  if (!asClause.endsWith('_')) {
    asClause += '_'; // Auto-add underscore for readability
  }
  return asClause + functionName;
}

/**
 * Apply AS clause transformation to ADDRESS target
 * @param {Object} interpreter - The interpreter instance (`this`)
 * @param {string} originalTargetName - The original target name
 * @param {string|null} asClause - Optional AS clause for transformation
 * @param {Object} metadata - Library metadata
 * @returns {string} Transformed target name
 */
function applyAsClauseToAddressTarget(interpreter, originalTargetName, asClause, metadata) {
  if (!asClause) {
    return originalTargetName; // No transformation
  }

  // Validate: ADDRESS targets cannot use regex patterns
  if (asClause.includes('(.*)')) {
    throw new Error(`Cannot use regex patterns in AS clause for ADDRESS modules (${metadata.type})`);
  }

  // For ADDRESS targets, AS clause is the exact new name but converted to lowercase to match ADDRESS command convention
  return asClause.toLowerCase();
}

/**
 * Get list of functions exported by a library
 * @param {Object} interpreter - The interpreter instance (`this`)
 * @param {string} libraryName - The library name
 * @returns {Array<string>} List of function names
 */
function getLibraryFunctionList(interpreter, libraryName) {
  // Check library metadata first (from metadata provider function)
  const metadata = interpreter.libraryMetadata && interpreter.libraryMetadata.get(libraryName);
  if (metadata && metadata.functions) {
    // Handle both array format and object format
    if (Array.isArray(metadata.functions)) {
      return metadata.functions;
    } else if (typeof metadata.functions === 'object') {
      return Object.keys(metadata.functions);
    }
  }

  // Check the modern registry
  if (typeof window !== 'undefined' && window.REXX_FUNCTION_LIBS) {
    const found = window.REXX_FUNCTION_LIBS.find(lib =>
      lib.path === libraryName ||
      lib.name === libraryName ||
      lib.path.endsWith('/' + libraryName) ||
      libraryName.endsWith('/' + lib.name)
    );
    if (found && found.functions) {
      return Object.keys(found.functions);
    }
  }

  // Check if this is a built-in library first
  if (interpreter.isBuiltinLibrary(libraryName)) {
    return discoverBuiltinLibraryFunctions(interpreter, libraryName);
  }

  // Auto-discover functions for third-party libraries
  return interpreter.discoverLibraryFunctions(libraryName);
}

/**
 * Get list of operations exported by a library
 * @param {Object} interpreter - The interpreter instance (`this`)
 * @param {string} libraryName - The library name
 * @returns {Array<string>} List of operation names
 */
function getLibraryOperationList(interpreter, libraryName) {
  // Get operations from library metadata
  // Operations are discovered via the metadata provider function
  const metadata = interpreter.libraryMetadata && interpreter.libraryMetadata.get(libraryName);
  if (metadata && metadata.operations) {
    return Object.keys(metadata.operations);
  }
  return [];
}

/**
 * Discover built-in library functions
 * @param {Object} interpreter - The interpreter instance (`this`)
 * @param {string} libraryName - The library name
 * @returns {Array<string>} List of function names (empty for built-ins)
 */
function discoverBuiltinLibraryFunctions(interpreter, libraryName) {
  // For built-in libraries, we don't need to pre-enumerate functions
  // They will be discovered when the library is loaded
  // Return empty array - functions will be available after REQUIRE loads the library
  return [];
}

// Export functions
module.exports = {
  registerLibraryFunctions,
  applyAsClauseToFunction,
  applyAsClauseToAddressTarget,
  getLibraryFunctionList,
  getLibraryOperationList,
  discoverBuiltinLibraryFunctions
};

// Browser environment support
if (typeof window !== 'undefined') {
  if (!window.rexxModuleRegistry) {
    window.rexxModuleRegistry = new Map();
  }
  window.rexxModuleRegistry.set('libraryRegistration', module.exports);
}
