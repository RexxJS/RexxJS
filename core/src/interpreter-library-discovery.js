'use strict';

/**
 * Library function discovery utilities for REXX interpreter
 *
 * This module provides browser/Node.js compatible functions for discovering
 * functions exported by loaded libraries.
 */

/**
 * Discover library functions using multiple strategies
 * @param {Object} interpreter - The interpreter instance (`this`)
 * @param {string} libraryName - The library name
 * @returns {Array<string>} List of discovered function names
 */
function discoverLibraryFunctions(interpreter, libraryName) {
  // First try namespace approach (clean, modern)
  const namespaceFunctions = extractFunctionsFromNamespace(interpreter, libraryName);
  if (namespaceFunctions.length > 0) {
    return namespaceFunctions;
  }

  // Try the computed namespace (e.g., "./tests/test-libs/discworld-science.js" -> "discworld_science")
  const libNamespace = interpreter.getLibraryNamespace(libraryName);
  const libNamespaceFunctions = extractFunctionsFromNamespace(interpreter, libNamespace);
  if (libNamespaceFunctions.length > 0) {
    return libNamespaceFunctions;
  }

  // For module-style libraries, check the extracted lib name namespace
  const libraryType = interpreter.getLibraryType(libraryName);
  if (libraryType === 'module') {
    const libName = libraryName.split('/').pop();
    const moduleNamespaceFunctions = extractFunctionsFromNamespace(interpreter, libName);
    if (moduleNamespaceFunctions.length > 0) {
      return moduleNamespaceFunctions;
    }
  }

  // Try global scope extraction (fallback for older libraries)
  const globalFunctions = extractGlobalFunctions(interpreter, libraryName);
  if (globalFunctions.length > 0) {
    return globalFunctions;
  }

  // Final fallback: just the detection function
  const detectionFunction = interpreter.getLibraryDetectionFunction(libraryName);
  return [detectionFunction];
}

/**
 * Get third-party namespace for a library
 * @param {Object} interpreter - The interpreter instance (`this`)
 * @param {string} libName - The library name
 * @returns {string} The namespace name
 */
function getThirdPartyNamespace(interpreter, libName) {
  // Use library name directly as namespace
  // "my-rexx-lib" -> "my-rexx-lib"
  return libName;
}

/**
 * Extract functions from a named namespace
 * @param {Object} interpreter - The interpreter instance (`this`)
 * @param {string} namespaceName - The namespace to search
 * @returns {Array<string>} List of function names found
 */
function extractFunctionsFromNamespace(interpreter, namespaceName) {
  const functions = [];
  let namespaceObj = null;

  if (typeof window !== 'undefined' && window[namespaceName]) {
    namespaceObj = window[namespaceName];
  } else if (typeof global !== 'undefined' && global[namespaceName]) {
    namespaceObj = global[namespaceName];
  }

  if (namespaceObj && typeof namespaceObj === 'object') {
    for (const key in namespaceObj) {
      if (typeof namespaceObj[key] === 'function') {
        functions.push(key);
      }
    }
  }

  return functions;
}

/**
 * Extract functions from global scope (legacy libraries)
 * @param {Object} interpreter - The interpreter instance (`this`)
 * @param {string} libraryName - The library name
 * @returns {Array<string>} List of function names found
 */
function extractGlobalFunctions(interpreter, libraryName) {
  // For legacy libraries that put functions directly in global scope
  const functions = [];
  const globalScope = (typeof window !== 'undefined') ? window : global;

  // Get the detection function as a starting point
  const detectionFunction = interpreter.getLibraryDetectionFunction(libraryName);

  if (globalScope && globalScope[detectionFunction] && typeof globalScope[detectionFunction] === 'function') {
    functions.push(detectionFunction);

    // First, try to get function list from library metadata
    try {
      const metadata = globalScope[detectionFunction]();
      // Check for functions list in metadata (supports two formats)
      const functionsList = (metadata && metadata.provides && metadata.provides.functions) ||
                           (metadata && metadata.functions);

      if (functionsList && Array.isArray(functionsList)) {
        for (const funcName of functionsList) {
          if (globalScope[funcName] && typeof globalScope[funcName] === 'function') {
            functions.push(funcName);
          }
        }
        return functions; // Return early if metadata-driven discovery worked
      }
    } catch (error) {
      // If detection function fails, continue with prefix-based discovery
    }

    // For R libraries, look for other functions with similar prefixes
    if (libraryName.includes('r-') || libraryName.includes('R_')) {
      const prefix = detectionFunction.split('_')[0] + '_'; // e.g., "R_"

      for (const key in globalScope) {
        if (key !== detectionFunction &&
            key.startsWith(prefix) &&
            typeof globalScope[key] === 'function') {
          functions.push(key);
        }
      }
    }

    // For other libraries, look for common patterns
    else {
      // Look for functions that might be related to this library
      const libPrefixes = [
        libraryName.toUpperCase().replace(/[^A-Z0-9]/g, '_'),
        libraryName.replace(/[^a-zA-Z0-9]/g, '_'),
      ];

      for (const key in globalScope) {
        if (key !== detectionFunction && typeof globalScope[key] === 'function') {
          for (const prefix of libPrefixes) {
            if (key.startsWith(prefix)) {
              functions.push(key);
              break;
            }
          }
        }
      }
    }
  }

  return functions;
}

// Export functions
module.exports = {
  discoverLibraryFunctions,
  getThirdPartyNamespace,
  extractFunctionsFromNamespace,
  extractGlobalFunctions
};

// Browser environment support
if (typeof window !== 'undefined') {
  if (!window.rexxModuleRegistry) {
    window.rexxModuleRegistry = new Map();
  }
  window.rexxModuleRegistry.set('libraryDiscovery', module.exports);
}
