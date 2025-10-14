(function() {
'use strict';

/**
 * Built-in function initialization for REXX interpreter
 *
 * This module provides browser/Node.js compatible functions for initializing
 * the built-in functions available in the REXX interpreter.
 */

// Placeholder for dependencies, will be filled in later
// const someDependency = require('./some-dependency.js');

  // Create interpreter-aware array functions that support pure-REXX callbacks
  function createInterpreterAwareArrayFunctions(originalArrayFunctions) {
    const interpreterContext = this;

    return {
      ...originalArrayFunctions,
      'ARRAY_FILTER': async (array, filterExpression) => {
        try {
          let arr = Array.isArray(array) ? array : JSON.parse(String(array));

          // Simple filter for non-null/undefined/empty values if no filterExpression
          if (!filterExpression) {
            return arr.filter(item => item != null && item !== '');
          }

          const expr = String(filterExpression).trim();

          // Check for arrow function syntax (param => body)
          const arrowMatch = expr.match(/^(\w+)\s*=>\s*(.+)$/);
          if (arrowMatch) {
            const body = arrowMatch[2];

            // Check if this is a JS callback (has dot notation like .includes, .length, etc.)
            // JS callbacks should be handled by the original implementation
            const hasJSSyntax = /\.\w+/.test(body); // dot notation like item.includes

            if (hasJSSyntax) {
              // Let the original implementation handle JS callbacks
              return originalArrayFunctions.ARRAY_FILTER(array, filterExpression);
            }

            // Handle as REXX lambda
            const paramName = arrowMatch[1];
            const filteredResults = [];
            for (const item of arr) {
              try {
                // Save current param variable if it exists
                const originalParam = interpreterContext.variables.get(paramName);
                interpreterContext.variables.set(paramName, item);

                // Evaluate the arrow function body
                let result = await interpreterContext.evaluateRexxCallbackExpression(body);

                // Restore original param variable
                if (originalParam !== undefined) {
                  interpreterContext.variables.set(paramName, originalParam);
                } else {
                  interpreterContext.variables.delete(paramName);
                }

                // Add item to results if condition is true
                if (!!result) {
                  filteredResults.push(item);
                }
              } catch (e) {
                console.debug('Arrow function evaluation failed:', e.message);
                // Don't add item to results if evaluation failed
              }
            }
            return filteredResults;
          }

          // Check for pure-REXX callback syntax
          // Must NOT have JS syntax (=>, &&, ||, ===, !==) and MUST have REXX function calls or REXX operators
          const hasJSLogicalOps = expr.includes('&&') || expr.includes('||') || expr.includes('===') || expr.includes('!==');
          const hasRexxFunctions = expr.includes('pos(') || expr.includes('length(') ||
                                   expr.includes('upper(') || expr.includes('lower(') ||
                                   expr.includes('substr(') || expr.includes('word(');
          const hasRexxLogicalOps = (expr.includes(' & ') && !expr.includes('&&')) ||
                                   (expr.includes(' | ') && !expr.includes('||'));

          const isRexxCallback = !expr.includes('=>') &&
                                !expr.startsWith('function') &&
                                !hasJSLogicalOps &&
                                (hasRexxFunctions || hasRexxLogicalOps);

          if (isRexxCallback) {
            // Pure-REXX callback evaluation using a simpler approach
            const filteredResults = [];
            for (const item of arr) {
              try {
                // Save current item variable if it exists
                const originalItem = interpreterContext.variables.get('item');
                interpreterContext.variables.set('item', item);

                // Evaluate the REXX expression by treating it as a mini REXX script
                let result = await interpreterContext.evaluateRexxCallbackExpression(expr);

                // Restore original item variable
                if (originalItem !== undefined) {
                  interpreterContext.variables.set('item', originalItem);
                } else {
                  interpreterContext.variables.delete('item');
                }

                // Add item to results if condition is true
                if (!!result) {
                  filteredResults.push(item);
                }
              } catch (e) {
                console.debug('REXX callback evaluation failed:', e.message);
                // Don't add item to results if evaluation failed
              }
            }
            return filteredResults;
          }

          // Fall back to original ARRAY_FILTER implementation for JS callbacks and object expressions
          return originalArrayFunctions.ARRAY_FILTER(array, filterExpression);
        } catch (e) {
          return [];
        }
      },

      'ARRAY_FIND': async (array, searchProperty, searchValue) => {
        try {
          // Ensure we have the right data types
          let arr = Array.isArray(array) ? array : JSON.parse(String(array));

          // Call original implementation with proper parameter resolution
          return originalArrayFunctions.ARRAY_FIND(arr, searchProperty, searchValue);
        } catch (e) {
          return null;
        }
      },

      'ARRAY_MAP': async (array, mapExpression) => {
        try {
          // Ensure we have the right data types
          let arr = Array.isArray(array) ? array : JSON.parse(String(array));

          // Simple identity mapping if no mapExpression
          if (!mapExpression) {
            return [...arr];
          }

          const expr = String(mapExpression).trim();

          // Check for arrow function syntax (param => body)
          const arrowMatch = expr.match(/^(\w+)\s*=>\s*(.+)$/);
          if (arrowMatch) {
            const body = arrowMatch[2];

            // Check if this is a JS callback (has dot notation like .includes, .length, etc.)
            // JS callbacks should be handled by the original implementation
            const hasJSSyntax = /\.\w+/.test(body); // dot notation like item.includes

            if (hasJSSyntax) {
              // Let the original implementation handle JS callbacks
              return originalArrayFunctions.ARRAY_MAP(array, mapExpression);
            }

            // Handle as REXX lambda
            const paramName = arrowMatch[1];
            const mappedResults = [];
            for (const item of arr) {
              try {
                // Save current param variable if it exists
                const originalParam = interpreterContext.variables.get(paramName);
                interpreterContext.variables.set(paramName, item);

                // Evaluate the arrow function body
                let result = await interpreterContext.evaluateRexxCallbackExpression(body);

                // Restore original param variable
                if (originalParam !== undefined) {
                  interpreterContext.variables.set(paramName, originalParam);
                } else {
                  interpreterContext.variables.delete(paramName);
                }

                mappedResults.push(result);
              } catch (e) {
                console.debug('Arrow function evaluation failed:', e.message);
                // On error, push original item
                mappedResults.push(item);
              }
            }
            return mappedResults;
          }

          // Fall back to original ARRAY_MAP implementation
          return originalArrayFunctions.ARRAY_MAP(arr, mapExpression);
        } catch (e) {
          return [];
        }
      },

      // Aliases for pipe-friendly syntax (must use interpreterAwareArrayFunctions)
      'MAP': async function(...args) {
        const funcs = interpreterContext.createInterpreterAwareArrayFunctions(originalArrayFunctions);
        return funcs.ARRAY_MAP(...args);
      },

      'FILTER': async function(...args) {
        const funcs = interpreterContext.createInterpreterAwareArrayFunctions(originalArrayFunctions);
        return funcs.ARRAY_FILTER(...args);
      }
    };
  }

  function wrapDomFunctions(domFunctions) {
    const wrapped = {};
    for (const [name, func] of Object.entries(domFunctions)) {
      wrapped[name] = (...args) => {
        // Call the DOM function with the interpreter as context
        return func.call(this, ...args);
      };
    }
    return wrapped;
  }

  function initializeBuiltInFunctions() {
    // Import external function modules
    let importedStringFunctions = {};
    let importedMathFunctions = {};
    let importedJsonFunctions = {};
    let importedArrayFunctions = {};
    let importedDateTimeFunctions = {};
    let importedUrlFunctions = {};
    let importedRandomFunctions = {};
    let importedRegexFunctions = {};
    let importedValidationFunctions = {};
    let importedFileFunctions = {};
    let importedPathFunctions = {};
    let importedHttpFunctions = {};
    let importedStatisticsFunctions = {};
    let importedLogicFunctions = {};
    let importedCryptoFunctions = {};
    let importedDomFunctions = {};
    let importedDomOperations = {};
    let importedDataFunctions = {};
    let importedProbabilityFunctions = {};
    let importedShellFunctions = {};
    // R functions, DIFF, SED, and other @extras functions - use REQUIRE statements to load them
    try {
      if (typeof require !== 'undefined') {
        // command line mode (NodeJs) is allowed to use require() but the two web modes are not.
        // All these are co-located with interpreter.js in the main RexxJS project, we should
        // auto-load them if so (provisional decision).
        const { stringFunctions } = require('./string-functions');
        const { mathFunctions } = require('./math-functions');
        const { jsonFunctions } = require('./json-functions');
        const { arrayFunctions } = require('./array-functions');
        const { dateTimeFunctions } = require('./date-time-functions');
        const { urlFunctions } = require('./url-functions');
        const { randomFunctions } = require('./random-functions');
        const { regexFunctions } = require('./regex-functions');
        const { validationFunctions } = require('./validation-functions');
        const { fileFunctions } = require('./file-functions');
        const { pathFunctions } = require('./path-functions');
        const { httpFunctions } = require('./http-functions');
        // Excel functions are loaded via REQUIRE statement in REXX scripts
        // e.g., REQUIRE "../extras/functions/excel/excel-functions"
        const { statisticsFunctions } = require('./statistics-functions');
        const { logicFunctions } = require('./logic-functions');
        const { cryptoFunctions } = require('./cryptography-functions');
        const { domFunctions, functions: domFunctionsOnly, operations: domOperations } = require('./dom-functions');
        const { dataFunctions } = require('./data-functions');
        const { probabilityFunctions } = require('./probability-functions');
        const shellFunctions = require('./shell-functions');

        // R functions, DIFF, SED are now available via REQUIRE statements in user scripts
        // e.g., REQUIRE "r-inspired/math-stats" to load R math functions
        importedStringFunctions = stringFunctions;
        importedMathFunctions = mathFunctions;
        importedJsonFunctions = jsonFunctions;
        importedArrayFunctions = arrayFunctions;
        importedDateTimeFunctions = dateTimeFunctions;
        importedUrlFunctions = urlFunctions;
        importedRandomFunctions = randomFunctions;
        importedRegexFunctions = regexFunctions;
        importedValidationFunctions = validationFunctions;
        importedFileFunctions = fileFunctions;
        importedPathFunctions = pathFunctions;
        importedHttpFunctions = httpFunctions;
        importedStatisticsFunctions = statisticsFunctions;
        importedLogicFunctions = logicFunctions;
        importedCryptoFunctions = cryptoFunctions;
        importedDomFunctions = domFunctionsOnly || domFunctions;  // Prefer split version, fall back to combined
        importedDomOperations = domOperations || {};
        importedDataFunctions = dataFunctions;
        importedProbabilityFunctions = probabilityFunctions;
        importedShellFunctions = shellFunctions;
        // R functions removed - use REQUIRE statements to load them
      } else if (typeof window !== 'undefined') {
        // Browser environment
        importedStringFunctions = window.stringFunctions || {};
        importedMathFunctions = window.mathFunctions || {};
        importedJsonFunctions = window.jsonFunctions || {};
        importedArrayFunctions = window.arrayFunctions || {};
        importedDateTimeFunctions = window.dateTimeFunctions || {};
        importedUrlFunctions = window.urlFunctions || {};
        importedRandomFunctions = window.randomFunctions || {};
        importedRegexFunctions = window.regexFunctions || {};
        importedValidationFunctions = window.validationFunctions || {};
        importedFileFunctions = window.fileFunctions || {};
        importedPathFunctions = window.pathFunctions || {};
        importedHttpFunctions = window.httpFunctions || {};
        importedStatisticsFunctions = window.statisticsFunctions || {};
        importedLogicFunctions = window.logicFunctions || {};
        importedCryptoFunctions = window.cryptoFunctions || {};
        importedDomFunctions = window.domFunctionsOnly || window.domFunctions || {};
        importedDomOperations = window.domOperations || {};
        importedDataFunctions = window.dataFunctions || {};
        importedProbabilityFunctions = window.probabilityFunctions || {};
        // R functions removed - use REQUIRE statements to load them
      }
    } catch (e) {
      console.warn('Could not import external functions:', e.message);
    }

    // Create interpreter-aware array functions for pure-REXX callback support
    const interpreterAwareArrayFunctions = createInterpreterAwareArrayFunctions.call(this, importedArrayFunctions);

    // Create interpreter-aware PATH_RESOLVE that uses the current script path
    const interpreterAwarePathFunctions = {
      'PATH_RESOLVE': (pathStr, contextScriptPath) => {
        // Use provided context path, or fall back to interpreter's script path
        const scriptPath = contextScriptPath || this.scriptPath || null;
        return importedPathFunctions['PATH_RESOLVE'](pathStr, scriptPath);
      }
    };

    // Create interpreter-aware FILE functions that automatically resolve paths
    const interpreterAwareFileFunctions = {};
    const fileFunctionsToWrap = [
      'FILE_READ', 'FILE_WRITE', 'FILE_APPEND', 'FILE_COPY', 'FILE_MOVE',
      'FILE_DELETE', 'FILE_EXISTS', 'FILE_SIZE', 'FILE_LIST', 'FILE_BACKUP'
    ];

    for (const funcName of fileFunctionsToWrap) {
      if (importedFileFunctions[funcName]) {
        const originalFunc = importedFileFunctions[funcName];

        interpreterAwareFileFunctions[funcName] = async (...args) => {
          // Resolve path arguments (first argument is always a path, some functions have 2 paths)
          const resolvedArgs = [...args];

          // Helper to check if a path needs resolution
          // Only resolve root: and cwd: prefixes for FILE_* functions
          // Let ./  and ../ be handled by file-functions.js as before
          const needsResolution = (path) => {
            if (typeof path !== 'string') return false;
            return path.startsWith('root:') || path.startsWith('cwd:');
          };

          // Resolve first path argument
          if (args.length > 0 && needsResolution(args[0])) {
            try {
              const { resolvePath } = require('./path-resolver');
              resolvedArgs[0] = resolvePath(args[0], this.scriptPath);
            } catch (error) {
              throw new Error(`${funcName} path resolution failed: ${error.message}`);
            }
          }

          // For FILE_COPY and FILE_MOVE, also resolve second path (destination)
          if ((funcName === 'FILE_COPY' || funcName === 'FILE_MOVE') && args.length > 1 && needsResolution(args[1])) {
            try {
              const { resolvePath } = require('./path-resolver');
              resolvedArgs[1] = resolvePath(args[1], this.scriptPath);
            } catch (error) {
              throw new Error(`${funcName} destination path resolution failed: ${error.message}`);
            }
          }

          return await originalFunc(...resolvedArgs);
        };
      }
    }

    // Note: DOM functions/operations are NOT added to built-in registries
    // They route through ADDRESS/RPC system for proper environment handling:
    // - Node.js tests: Mock RPC intercepts
    // - Browser: Real DOM manager
    // - Node.js production: "Not supported" stub
    // The split into importedDomFunctions/importedDomOperations is kept for semantic clarity

    return {
      // Import external functions
      ...importedStringFunctions,
      ...importedMathFunctions,
      ...importedJsonFunctions,
      ...interpreterAwareArrayFunctions,
      ...importedDateTimeFunctions,
      ...importedUrlFunctions,
      ...importedRandomFunctions,
      ...importedRegexFunctions,
      ...importedValidationFunctions,
      ...interpreterAwareFileFunctions,
      ...interpreterAwarePathFunctions,
      ...importedHttpFunctions,
      ...importedStatisticsFunctions,
      ...importedLogicFunctions,
      ...importedCryptoFunctions,
      // DOM functions/operations intentionally NOT included - they route through ADDRESS/RPC
      ...importedDataFunctions,
      ...importedProbabilityFunctions,
      ...importedShellFunctions,  // Shell functions last, includes Node.js FILE_EXISTS override
      // R functions, DIFF, SED - use REQUIRE statements to load them

      // Debug function for JavaScript introspection
      'JS_SHOW': (value) => {
        const output = [];
        output.push('=== JS_SHOW Debug Output ===');

        // Basic type info
        output.push(`Type: ${typeof value}`);
        output.push(`Constructor: ${value?.constructor?.name || 'N/A'}`);
        output.push(`String representation: ${String(value)}`);

        // JSON representation (if possible)
        try {
          output.push(`JSON: ${JSON.stringify(value, null, 2)}`);
        } catch (e) {
          output.push(`JSON: [Cannot stringify: ${e.message}]`);
        }

        // Object properties (if it's an object)
        if (typeof value === 'object' && value !== null) {
          output.push('Properties:');
          try {
            const keys = Object.keys(value);
            if (keys.length === 0) {
              output.push('  [No enumerable properties]');
            } else {
              keys.slice(0, 20).forEach(key => { // Limit to first 20 properties
                try {
                  const propValue = value[key];
                  const propType = typeof propValue;
                  output.push(`  ${key}: (${propType}) ${String(propValue).slice(0, 100)}`);
                } catch (e) {
                  output.push(`  ${key}: [Error accessing: ${e.message}]`);
                }
              });
              if (keys.length > 20) {
                output.push(`  ... and ${keys.length - 20} more properties`);
              }
            }
          } catch (e) {
            output.push(`  [Error getting properties: ${e.message}]`);
          }

          // Prototype chain
          try {
            const proto = Object.getPrototypeOf(value);
            output.push(`Prototype: ${proto?.constructor?.name || 'N/A'}`);
          } catch (e) {
            output.push(`Prototype: [Error: ${e.message}]`);
          }
        }

        // Array-like info
        if (value && typeof value.length !== 'undefined') {
          output.push(`Length: ${value.length}`);
          if (Array.isArray(value) || value.length < 10) {
            output.push('Array-like contents:');
            for (let i = 0; i < Math.min(value.length, 10); i++) {
              try {
                output.push(`  [${i}]: ${String(value[i]).slice(0, 100)}`);
              } catch (e) {
                output.push(`  [${i}]: [Error: ${e.message}]`);
              }
            }
            if (value.length > 10) {
              output.push(`  ... and ${value.length - 10} more items`);
            }
          }
        }

        // Function info
        if (typeof value === 'function') {
          output.push(`Function name: ${value.name || '[anonymous]'}`);
          output.push(`Function length (arity): ${value.length}`);
          const funcStr = value.toString();
          output.push(`Function source: ${funcStr.slice(0, 200)}${funcStr.length > 200 ? '...' : ''}`);
        }

        output.push('=== End JS_SHOW ===');

        // Console output for immediate visibility
        console.log(output.join('\n'));

        // Return the formatted output as a string for REXX
        return output.join('\n');
      },

      'TYPEOF': (value) => {
        return typeof value;
      },

      // Environment variable access
      'GETENV': (varName) => {
        // Access OS environment variables from process.env
        // Returns empty string if not found (REXX convention)
        if (typeof process !== 'undefined' && process.env) {
          return process.env[varName] || '';
        }
        // In browser environment, no process.env access
        return '';
      },

      // String functions

      // Math functions

      // Modern Date/Time functions with timezone and format support

      // Date arithmetic functions


      // JSON Functions

      // Array/Object Access Functions


      // URL/Web Functions



      'BASE64_ENCODE': (string) => {
        try {
          // In browser environment, use btoa; in Node.js, use Buffer
          if (typeof btoa !== 'undefined') {
            return btoa(string);
          } else if (typeof Buffer !== 'undefined') {
            return Buffer.from(string, 'utf8').toString('base64');
          } else {
            // Fallback - basic base64 implementation
            return basicBase64Encode(string);
          }
        } catch (e) {
          return '';
        }
      },

      'BASE64_DECODE': (string) => {
        try {
          // In browser environment, use atob; in Node.js, use Buffer
          if (typeof atob !== 'undefined') {
            return atob(string);
          } else if (typeof Buffer !== 'undefined') {
            return Buffer.from(string, 'base64').toString('utf8');
          } else {
            // Fallback - basic base64 implementation
            return basicBase64Decode(string);
          }
        } catch (e) {
          return '';
        }
      },

      // UUID/ID Generation Functions





      // Enhanced String Functions








      // Array/Collection Functions













      // File System Functions (Browser-compatible with localStorage fallback)

      // Validation Functions

      // Math/Calculation Functions

      // Date/Time Functions
      // Duplicate NOW removed - using the version at line 61






      // Statistical Functions

      // Lookup Functions



      // Error Context Functions - Available only within error handlers after SIGNAL ON ERROR
      'ERROR_LINE': () => {
        return this.errorContext?.line || 0;
      },

      'ERROR_MESSAGE': () => {
        return this.errorContext?.message || '';
      },

      'ERROR_STACK': () => {
        return this.errorContext?.stack || '';
      },

      'ERROR_FUNCTION': () => {
        return this.errorContext?.functionName || 'Unknown';
      },

      'ERROR_COMMAND': () => {
        return this.errorContext?.commandText || '';
      },

      'ERROR_VARIABLES': () => {
        if (!this.errorContext?.variables) {
          return '{}';
        }

        const vars = {};
        for (const [key, value] of this.errorContext.variables) {
          vars[key] = value;
        }
        return JSON.stringify(vars);
      },

      'ERROR_TIMESTAMP': () => {
        return this.errorContext?.timestamp || '';
      },

      'ERROR_DETAILS': () => {
        if (!this.errorContext) {
          return '{}';
        }

        return JSON.stringify({
          line: this.errorContext.line,
          message: this.errorContext.message,
          function: this.errorContext.functionName,
          command: this.errorContext.commandText,
          timestamp: this.errorContext.timestamp,
          hasStack: !!this.errorContext.stack
        });
      },

      // Dynamic Rexx execution
      'INTERPRET': async (rexxCode, options = {}) => {
        // Check if INTERPRET is blocked by NO-INTERPRET
        if (this.interpretBlocked) {
          throw new Error('INTERPRET is blocked by NO-INTERPRET directive');
        }

        try {
          // Parse options
          const opts = typeof options === 'string' ? JSON.parse(options) : options;
          const shareVars = opts.shareVars !== false; // Default to true for compatibility
          const allowedVars = opts.allowedVars || null; // null means all vars

          // Convert escaped newlines to actual newlines
          const normalizedCode = String(rexxCode).replace(/\\n/g, '\n');

          // Import parser to compile the Rexx code
          const { parse } = require('./parser');
          const commands = parse(normalizedCode);

          // Create new interpreter instance for isolated execution
          const subInterpreter = new RexxInterpreter(this.addressSender, this.outputHandler);

          // Share the same address context
          subInterpreter.address = this.address;

          // Share the same built-in functions, operations, and error handling state
          subInterpreter.builtInFunctions = this.builtInFunctions;
          subInterpreter.operations = this.operations;
          subInterpreter.errorHandlers = new Map(this.errorHandlers);
          subInterpreter.labels = new Map(this.labels);
          subInterpreter.subroutines = new Map(this.subroutines);

          // Handle variable sharing
          if (shareVars) {
            if (allowedVars === null) {
              // Share all variables (classic Rexx behavior)
              for (const [key, value] of this.variables) {
                subInterpreter.variables.set(key, value);
              }
            } else if (Array.isArray(allowedVars)) {
              // Share only whitelisted variables
              for (const varName of allowedVars) {
                if (this.variables.has(varName)) {
                  subInterpreter.variables.set(varName, this.variables.get(varName));
                }
              }
            }
          }

          // Execute the interpreted code
          await subInterpreter.run(commands);

          // Copy back variables from sub-interpreter if sharing enabled
          if (shareVars) {
            if (allowedVars === null) {
              // Copy back all variables
              for (const [key, value] of subInterpreter.variables) {
                this.variables.set(key, value);
              }
            } else if (Array.isArray(allowedVars)) {
              // Copy back only whitelisted variables (strict whitelist mode)
              for (const varName of allowedVars) {
                if (subInterpreter.variables.has(varName)) {
                  this.variables.set(varName, subInterpreter.variables.get(varName));
                }
              }
            }
          }

          // Return success indicator
          return true;
        } catch (e) {
          throw new Error(`INTERPRET failed: ${e.message}`);
        }
      },

      // JavaScript execution - executes JS code in browser context
      'INTERPRET_JS': (jsCode, type = 'auto') => {
        if (typeof jsCode !== 'string') {
          throw new Error('INTERPRET_JS requires a string parameter');
        }

        // Check if INTERPRET is blocked by NO-INTERPRET
        if (this.interpretBlocked) {
          throw new Error('INTERPRET_JS is blocked by NO-INTERPRET directive');
        }

        try {
          // Create variable context from Rexx variables
          const context = Object.fromEntries(this.variables);

          // Get variable names and values for the function parameters
          // Filter out invalid variable names and convert values safely
          const varNames = [];
          const varValues = [];

          for (const [name, value] of Object.entries(context)) {
            // Only include valid JavaScript identifier names
            if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name)) {
              varNames.push(name);
              varValues.push(value);
            }
          }

          let result;
          const execType = (typeof type === 'string' ? type : 'auto').toLowerCase();

          switch (execType) {
            case 'expression':
              // Force expression mode - always wrap with return
              const exprFunc = new Function(...varNames, `return (${jsCode})`);
              result = exprFunc.call(this, ...varValues);
              break;

            case 'statement':
              // Force statement mode - execute as-is
              const stmtFunc = new Function(...varNames, jsCode);
              result = stmtFunc.call(this, ...varValues);
              break;

            case 'auto':
            default:
              // Try expression first, fall back to statement
              try {
                const func = new Function(...varNames, `return (${jsCode})`);
                result = func.call(this, ...varValues);
              } catch (e) {
                // If expression fails, try as function body (for statements)
                try {
                  const func = new Function(...varNames, jsCode);
                  result = func.call(this, ...varValues);
                } catch (e2) {
                  // If both fail, throw the expression error (more informative)
                  throw e;
                }
              }
              break;
          }

          return result !== undefined ? result : null;
        } catch (e) {
          throw new Error(`INTERPRET_JS failed: ${e.message}`);
        }
      },

      // Streaming control function for remote procedure control
      'CHECKPOINT': (...params) => {
        // If we have at least 2 parameters, set a variable with the first param as name
        if (params.length >= 2) {
          const variableName = String(params[0]);
          const variableValue = String(params[1]);
          this.variables.set(variableName, variableValue);
        }

        // Send progress update with parameters to streaming controller
        const progressData = {
          type: 'rexx-progress',
          timestamp: Date.now(),
          variables: Object.fromEntries(this.variables),
          params: params,
          line: this.currentLineNumber || 0
        };

        // If we have a streaming callback, use it (for streaming execution mode)
        if (this.streamingProgressCallback) {
          this.streamingProgressCallback(progressData);
        } else if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
          // Default: send to parent window for cross-iframe communication
          window.parent.postMessage(progressData, '*');
        }

        // For now, return a default continue response synchronously
        // The real streaming control will be handled by the worker's override
        return {
          action: 'continue',
          message: 'Default continue response',
          timestamp: Date.now()
        };
      },

      // Graphics display command
      'SHOW': (value) => {
        // Check if value has an error (handle error case first)
        if (value && typeof value === 'object' && value.error) {
          return `Graphics error: ${value.error}`;
        }

        // Check if value is a valid graphics object
        if (value && typeof value === 'object' && value.type &&
            ['hist', 'scatter', 'boxplot', 'barplot', 'pie', 'qqplot', 'density', 'heatmap', 'contour', 'pairs'].includes(value.type)) {

          // Emit graphics event for display systems to handle
          if (this.options && this.options.onGraphics) {
            this.options.onGraphics(value);
          }

          // Also emit as custom event in browser
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('rexx-graphics', {
              detail: {
                plotData: value,
                command: 'SHOW'
              }
            }));
          }

          return `Displayed ${value.type} plot`;
        } else {
          return `SHOW: Not a graphics object (type: ${typeof value})`;
        }
      },

      // Library loading and dependency management
      'REQUIRE': async (libraryName, asClause = null) => {
        if (typeof libraryName !== 'string') {
          throw new Error('REQUIRE requires a string library name');
        }

        // Strip surrounding quotes if present (handles both single and double quotes)
        let cleanLibraryName = libraryName.replace(/^['"]|['"]$/g, '');
        let cleanAsClause = null;

        if (asClause !== null) {
          if (typeof asClause !== 'string') {
            throw new Error('AS clause must be a string');
          }
          cleanAsClause = asClause.replace(/^['"]|['"]$/g, '');
        }

        // Resolve path using path-resolver for local file paths
        // Only resolve if it looks like a file path (not a registry/npm module name)
        if (cleanLibraryName.startsWith('./') ||
            cleanLibraryName.startsWith('../') ||
            cleanLibraryName.startsWith('root:') ||
            cleanLibraryName.startsWith('cwd:') ||
            cleanLibraryName.startsWith('/') ||
            /^[A-Za-z]:[\\/]/.test(cleanLibraryName)) {
          // Use PATH_RESOLVE to get absolute path
          try {
            const { resolvePath } = require('./path-resolver');
            cleanLibraryName = resolvePath(cleanLibraryName, this.scriptPath);
          } catch (error) {
            throw new Error(`REQUIRE path resolution failed: ${error.message}`);
          }
        }

        return await this.requireWithDependencies(cleanLibraryName, cleanAsClause);
      },

      // Stack Operations (PUSH/PULL/QUEUE functions)
      'STACK_PUSH': (value) => {
        return variableStackUtils.stackPush(value, this.stack);
      },

      'STACK_PULL': () => {
        return variableStackUtils.stackPull(this.stack);
      },

      'STACK_QUEUE': (value) => {
        return variableStackUtils.stackQueue(value, this.stack);
      },

      'STACK_SIZE': () => {
        return variableStackUtils.stackSize(this.stack);
      },

      'STACK_PEEK': () => {
        return variableStackUtils.stackPeek(this.stack);
      },

      'STACK_CLEAR': () => {
        return variableStackUtils.stackClear(this.stack);
      },

      // Reflection functions
      'SUBROUTINES': (pattern = null) => {
        const allSubroutines = Array.from(this.subroutines.keys());
        const patternStr = (pattern === null || pattern === undefined) ? null : String(pattern).trim();

        const results = allSubroutines
            .map(name => name.trim().toUpperCase())
            .filter(name => {
              if (name.length === 0) return false;
              if (patternStr === null || patternStr === '') return true;

              // Check if pattern contains regex metacharacters
              const regexChars = /[.*+?^${}()|[\]\\]/;
              if (regexChars.test(patternStr)) {
                // Treat as regex pattern (case-insensitive)
                try {
                  const regex = new RegExp(patternStr, 'i');
                  return regex.test(name);
                } catch (e) {
                  // If regex is invalid, fall back to substring matching
                  return name.includes(patternStr.toUpperCase());
                }
              } else {
                // Simple substring matching (original behavior)
                return name.includes(patternStr.toUpperCase());
              }
            });
        return results;
      },

      // ARG function - Classic REXX argument access
      // Usage:
      //   ARG()     - returns the count of arguments
      //   ARG(n)    - returns the nth argument (empty string if not found)
      //   ARG(n, 'E') - returns 1 if nth argument exists, 0 otherwise
      //   ARG(n, 'O') - returns 1 if nth argument was omitted, 0 otherwise
      'ARG': (index = null, option = null) => {
        // ARG() with no arguments returns argument count
        if (index === null || index === undefined) {
          return this.argv.length;
        }

        // Convert index to number (1-based indexing)
        const n = typeof index === 'number' ? index : parseInt(String(index), 10);

        if (isNaN(n) || n < 1) {
          throw new Error(`ARG: Invalid argument index '${index}' (must be positive integer)`);
        }

        // Get the argument value from argv array (convert 1-based to 0-based)
        const argValue = this.argv[n - 1];

        // ARG(n) - return argument value (empty string if not found)
        if (option === null || option === undefined) {
          return argValue !== undefined ? argValue : '';
        }

        // ARG(n, option) - check existence or omission
        const optionStr = String(option).trim().toUpperCase();

        if (optionStr === 'E') {
          // 'E' option: returns 1 if argument exists, 0 otherwise
          return argValue !== undefined ? 1 : 0;
        } else if (optionStr === 'O') {
          // 'O' option: returns 1 if argument was omitted (exists but empty), 0 otherwise
          // In REXX, an omitted argument is one that exists in position but has no value
          // For now, we consider an argument omitted if it's an empty string
          if (argValue === undefined) {
            return 0; // Argument doesn't exist at all
          }
          return argValue === '' ? 1 : 0;
        } else {
          throw new Error(`ARG: Invalid option '${option}' (must be 'E' or 'O')`);
        }
      },

    };
  }


// UMD pattern for both Node.js and browser compatibility
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = {
        initializeBuiltInFunctions,
        createInterpreterAwareArrayFunctions,
        wrapDomFunctions
    };
} else if (typeof window !== 'undefined') {
    // Browser environment - register in registry to avoid conflicts
    if (!window.rexxModuleRegistry) {
        window.rexxModuleRegistry = new Map();
    }
    if (!window.rexxModuleRegistry.has('builtinFunctions')) {
        window.rexxModuleRegistry.set('builtinFunctions', {
            initializeBuiltInFunctions,
            createInterpreterAwareArrayFunctions,
            wrapDomFunctions
        });
    }
}

})(); // End IIFE
