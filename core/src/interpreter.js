/* eslint-env browser */
'use strict';

// Global registry for safe module loading in browser environment
if (typeof window !== 'undefined' && !window.rexxModuleRegistry) {
  window.rexxModuleRegistry = new Map();
}

// Conditional loading for Node.js/browser compatibility
let parseQuotedParts, interpolateString, evaluateConcatenation;
let compareValues, isTruthy, isLikelyFunctionName, isNumericString, basicBase64Encode, basicBase64Decode;
let executionContextUtils;
let variableStackUtils;
let controlFlowUtils;
let errorHandlingUtils;
let parseSubroutineUtils;
let traceFormattingUtils;
let libraryUrlUtils;
let expressionValueUtils;
let domManagerUtils;
let libraryManagementUtils;
let requireSystem;
let utils;
let security;
let securityUtils;
let stringUtils;
let pathResolver;
let interpolation;
let builtinFunctionsUtils;
let addressHandlingUtils;
const { executeCommands } = require('./interpreter-core-execution.js');
const { RexxError } = require('./interpreter-error.js');
const RexxInterpreterBuilder = require('./interpreter-builder.js');


if (typeof require !== 'undefined') {
  const stringProcessing = require('./interpreter-string-and-expression-processing.js');
  builtinFunctionsUtils = require('./interpreter-builtin-functions.js');
  addressHandlingUtils = require('./interpreter-address-handling.js');
  parseQuotedParts = stringProcessing.parseQuotedParts;
  interpolateString = stringProcessing.interpolateString;
  evaluateConcatenation = stringProcessing.evaluateConcatenation;
  
  const evaluationUtils = require('./interpreter-evaluation-utilities.js');
  compareValues = evaluationUtils.compareValues;
  isTruthy = evaluationUtils.isTruthy;
  isLikelyFunctionName = evaluationUtils.isLikelyFunctionName;
  isNumericString = evaluationUtils.isNumericString;
  basicBase64Encode = evaluationUtils.basicBase64Encode;
  basicBase64Decode = evaluationUtils.basicBase64Decode;
  
  executionContextUtils = require('./interpreter-execution-context.js');
  variableStackUtils = require('./interpreter-variable-stack.js');
  controlFlowUtils = require('./interpreter-control-flow.js');
  errorHandlingUtils = require('./interpreter-error-handling.js');
  parseSubroutineUtils = require('./interpreter-parse-subroutine.js');
  traceFormattingUtils = require('./interpreter-trace-formatting.js');
  libraryUrlUtils = require('./interpreter-library-url.js');
  expressionValueUtils = require('./interpreter-expression-value-resolution.js');
  domManagerUtils = require('./interpreter-dom-manager.js');
  libraryManagementUtils = require('./interpreter-library-management.js');
  requireSystem = require('./require-system.js');
  utils = require('./utils.js');
  security = require('./security.js');
  securityUtils = require('./interpreter-security.js');
  stringUtils = require('./string-processing.js');
  pathResolver = require('./path-resolver.js');
  interpolation = require('./interpolation.js');
} else {
  // ... browser environment setup
}

/**
 * @fileoverview Browser-compatible Rexx interpreter - no Node.js dependencies
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

// Global registry for library detection functions
const LIBRARY_DETECTION_REGISTRY = new Map();

// Self-registration function for libraries
function registerLibraryDetectionFunction(libraryName, detectionFunctionName) {
  LIBRARY_DETECTION_REGISTRY.set(libraryName, detectionFunctionName);
}

// Make registration function and registry globally available
if (typeof window !== 'undefined') {
  window.LIBRARY_DETECTION_REGISTRY = LIBRARY_DETECTION_REGISTRY;
  window.registerLibraryDetectionFunction = registerLibraryDetectionFunction;
} else if (typeof global !== 'undefined') {
  global.LIBRARY_DETECTION_REGISTRY = LIBRARY_DETECTION_REGISTRY;
  global.registerLibraryDetectionFunction = registerLibraryDetectionFunction;
}

// Import parameter converter
function callConvertParamsToArgs(functionName, params) {
  return stringUtils.callConvertParamsToArgs(functionName, params);
}

class RexxInterpreter {
  constructor(addressSender, optionsOrHandler = null, explicitOutputHandler = null) {
    this.addressSender = addressSender;
    
    // Handle different constructor signatures for backwards compatibility
    let outputHandler = null;
    let options = {};
    
    if (explicitOutputHandler !== null) {
      // New internal constructor: (rpcClient, options, outputHandler)
      options = optionsOrHandler || {};
      outputHandler = explicitOutputHandler;
    } else if (optionsOrHandler && typeof optionsOrHandler === 'object') {
      // Legacy: Check if it has output handler-like properties vs option-like properties
      if (typeof optionsOrHandler.output === 'function' || 
          typeof optionsOrHandler.handleOutput === 'function' ||
          typeof optionsOrHandler.log === 'function') {
        // This is an output handler
        outputHandler = optionsOrHandler;
      } else {
        // This is an options object
        options = optionsOrHandler;
        outputHandler = null;
      }
    } else if (typeof optionsOrHandler === 'function') {
      // Legacy: function passed as outputHandler
      outputHandler = optionsOrHandler;
    }
    
    // Store options for use throughout the interpreter
    this.options = {
      'dom-interop': true,
      'tracing': false,
      'numeric-digits': 9,
      'numeric-fuzz': 0,
      'numeric-form': 'SCIENTIFIC',
      ...options
    };
    
    // Set up output handler (defaults to simple console.log)
    if (outputHandler) {
      this.outputHandler = outputHandler;
    } else {
      // Default inline output handler with standard interface
      this.outputHandler = {
        write: (text) => process.stdout ? process.stdout.write(text) : console.log(text),
        writeLine: (text) => console.log(text),
        writeError: (text) => console.error(text),
        output: (text) => console.log(text) // Legacy compatibility
      };
    }
    
    this.address = 'default';  // Default namespace
    this.variables = new Map();
    this.argv = []; // Command-line arguments as array (cleaner than ARG.1, ARG.2, etc.)
    this.operations = {}; // Operations (side-effecting actions, separate from pure functions) - MUST initialize before initializeBuiltInFunctions
    this.builtInFunctions = builtinFunctionsUtils.initializeBuiltInFunctions.call(this);

    // NOTE: REQUIRE is NOT added to operations to avoid circular reference during Jest serialization
    // It's handled as a special case in executeFunctionCall before checking operations

    this.externalFunctions = {}; // Functions from REQUIRE'd libraries

    // Initialize scriptPath for path resolution
    // Will be set to actual script path when run() is called with a sourceFilename
    this.scriptPath = pathResolver ? pathResolver.NO_SCRIPT_PATH : '<inline>';

    // Detect and expose execution environment globally
    this.detectAndExposeEnvironment();
    
    // ADDRESS LINES functionality  
    this.addressLinesCount = 0;
    this.addressLinesBuffer = [];
    this.addressLinesStartLine = 0;
    
    // ADDRESS target registry for REQUIRE'd service libraries
    this.addressTargets = new Map(); // targetName -> { handler: function, methods: object, metadata: object }
    
    // Library cache for Node.js environment
    this.libraryCache = new Map(); // libraryName -> { loaded: boolean, code: string, timestamp: number }
    
    // Dependency tracking
    this.dependencyGraph = new Map(); // libraryName -> { dependencies: [], dependents: [], loading: boolean }
    this.loadingQueue = new Set(); // Currently loading libraries to prevent infinite loops
    
    // Security and permissions
    this.securityPolicy = 'default'; // Security policy: strict, moderate, default, permissive
    this.approvedLibraries = new Set(); // Session-approved libraries for control-bus mode
    this.pendingPermissionRequests = new Map(); // requestId -> { resolve, reject, timeoutId }
    
    // Error handling state
    this.errorHandlers = new Map(); // condition -> {label, enabled}
    this.labels = new Map(); // label name -> command index
    this.currentCommands = []; // Currently executing commands
    this.executionStack = []; // For nested execution contexts
    
    // INTERPRET control
    this.interpretBlocked = false; // NO-INTERPRET flag
    
    // NUMERIC settings - use values from options
    this.numericSettings = {
      digits: this.options['numeric-digits'] || 9,      // Default precision
      fuzz: this.options['numeric-fuzz'] || 0,        // Digits ignored in arithmetic comparisons  
      form: this.options['numeric-form'] || 'SCIENTIFIC'  // SCIENTIFIC or ENGINEERING
    };
    
    // Initialize DOM Element Manager
    this.domManager = null;
    
    // Only initialize DOM manager if dom-interop is not explicitly disabled
    if (this.options['dom-interop'] !== false) {
      this.initializeDOMManager();
    }
    
    // Initialize security message handlers
    this.initializeSecurityHandlers();
    
    // Stack for PUSH/PULL/QUEUE operations
    this.stack = [];
    
    // Subroutine support
    this.subroutines = new Map(); // name -> {commands, parameters}
    this.callStack = []; // For nested subroutine calls
    this.returnValue = null; // Value returned from subroutine
    
    // TRACE support
    this.traceMode = 'OFF'; // OFF, A, R, I, O, NORMAL
    this.traceOutput = []; // Store trace output
    
    // DOM Element Manager for stale element handling
    this.domManager = null; // Will be initialized when DOM functions are used
    
    // RETRY_ON_STALE state
    this.retryOnStaleActive = false;
    
    // Source line tracking for error reporting
    this.sourceLines = []; // Store original source lines
    this.currentLineNumber = null; // Current executing line number (for backward compatibility)
    this.retryOnStaleTimeout = 10000;
    this.retryOnStalePreserved = new Map();
    
    // Execution context stack for proper nested execution tracking
    this.executionStack = [];
  }
  
  // Execution context stack management
  pushExecutionContext(type, lineNumber, sourceLine, sourceFilename, details = {}) {
    const context = executionContextUtils.pushExecutionContext(
      this.executionStack, type, lineNumber, sourceLine, sourceFilename, details
    );
    
    // Update current line number for backward compatibility
    this.currentLineNumber = lineNumber;
    return context;
  }
  
  popExecutionContext() {
    const popped = executionContextUtils.popExecutionContext(this.executionStack);
    
    // Update current line number from the new top of stack (or null if empty)
    this.currentLineNumber = executionContextUtils.getCurrentLineNumber(this.executionStack);
    
    return popped;
  }
  
  getCurrentExecutionContext() {
    return executionContextUtils.getCurrentExecutionContext(this.executionStack);
  }

  // Handle operation-specific result processing (override in subclasses for test-specific logic)
  handleOperationResult(result) {
    // Default implementation: no special handling
    // Subclasses like TestRexxInterpreter can override this for test-specific behavior
    return;
  }

  registerAddressTarget(name, target) {
    addressHandlingUtils.registerAddressTarget.call(this, name, target);
  }
  
  getInterpretContext() {
    return executionContextUtils.getInterpretContext(this.executionStack);
  }
  
  // Static builder factory method
  static builder(rpcClient) {
    return new RexxInterpreterBuilder(rpcClient);
  }

  // Helper methods for date/time formatting
  formatDate(date, timezone = 'UTC', format = 'YYYY-MM-DD') {
    return traceFormattingUtils.formatDate(date, timezone, format);
  }
  
  formatTime(date, timezone = 'UTC', format = 'HH:MM:SS') {
    return traceFormattingUtils.formatTime(date, timezone, format);
  }
  
  formatDateTime(date, timezone = 'UTC', format = 'ISO') {
    return traceFormattingUtils.formatDateTime(date, timezone, format);
  }

  getVariable(name) {
    return variableStackUtils.getVariable(name, this.variables);
  }

  isExternalScriptCall(subroutineName) {
    return parseSubroutineUtils.isExternalScriptCall(subroutineName);
  }

  async run(commands, sourceText = '', sourceFilename = '') {
    // Store commands and discover labels and subroutines
    this.currentCommands = commands;
    errorHandlingUtils.discoverLabels(commands, this.labels);
    parseSubroutineUtils.discoverSubroutines(commands, this.subroutines);

    // Store source lines and filename for error reporting
    if (sourceText) {
      this.sourceLines = sourceText.replace(/\r\n/g, '\n').split('\n');
    }
    // Only set sourceFilename if it's provided and we don't already have one
    if (sourceFilename && !this.sourceFilename) {
      this.sourceFilename = sourceFilename;
    }

    // Set scriptPath for path resolution in PATH_RESOLVE and FILE_* functions
    // Override NO_SCRIPT_PATH default if actual source file is provided
    if (sourceFilename) {
      this.scriptPath = sourceFilename;
    }
    
    try {
      return await executeCommands(this, commands);
    } catch (error) {
      // Handle EXIT statement termination
      if (error.isExit) {
        return { exitCode: error.exitCode, terminated: true };
      }
      
      // Only handle error at this level if it wasn't already handled at command level
      if (error.rexxUnhandled) {
        throw error; // Re-throw unhandled errors
      }
      // This shouldn't normally happen since errors should be caught at command level
      return await this.handleError(error);
    }
  }

  discoverLabels(commands) {
    errorHandlingUtils.discoverLabels(commands, this.labels);
  }


  // Browser-compatible string functions
  executeBrowserStringFunction(functionName, args) {
    return stringUtils.executeBrowserStringFunction(functionName, args);
  }

  reconstructCommandAsLine(command) {
    // Try to get the original line from source text using line number
    if (command.lineNumber && this.sourceLines && this.sourceLines[command.lineNumber - 1]) {
      return this.sourceLines[command.lineNumber - 1];
    }
    
    // Use the preserved original line if available (fallback)
    if (command.originalLine) {
      return command.originalLine;
    }
    
    // Last resort: reconstruct from command properties
    switch (command.type) {
      case 'ASSIGNMENT':
        if (command.expression && typeof command.expression === 'string') {
          return command.expression;
        }
        // Reconstruct standard LET assignment
        if (command.variable && command.value !== undefined) {
          if (command.isQuotedString) {
            return `LET ${command.variable} = "${command.value}"`;
          } else if (typeof command.value === 'string') {
            return `LET ${command.variable} = ${command.value}`;
          } else {
            return `LET ${command.variable} = ${JSON.stringify(command.value)}`;
          }
        }
        break;
      case 'FUNCTION_CALL':
        if (command.originalExpression) {
          return command.originalExpression;
        }
        break;
      default:
        if (command.value) {
          return command.value;
        }
        if (command.expression) {
          return command.expression;
        }
        break;
    }
    
    return '';
  }

  async executeFunctionCall(funcCall) {
    const method = funcCall.command.toUpperCase();

    // Check for functions that require parameters but were called without any
    const hasNoParams = Object.keys(funcCall.params || {}).length === 0;
    if (hasNoParams && this.checkFunctionRequiresParameters(method)) {
      throw new Error(`${funcCall.command} function requires parameters`);
    }

    // Special handling for REXX built-in variables that might be parsed as function calls
    const rexxSpecialVars = ['RC', 'ERRORTEXT', 'SIGL'];
    if (rexxSpecialVars.includes(method)) {
      return this.variables.get(method) || method; // Return variable value or variable name if not set
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
          const resolved = await this.resolveValue(value);
          resolvedParams[key] = resolved;
        }
      }

      const libraryName = resolvedParams.value || resolvedParams.libraryName;
      const asClause = resolvedParams.asClause || null;
      return await this.builtInFunctions['REQUIRE'](libraryName, asClause);
    }

    // Check if this is a built-in REXX function FIRST
    // Built-in functions like LENGTH, SUBSTR, POS should ALWAYS work regardless of ADDRESS context
    if (this.builtInFunctions[method]) {
      // Built-in functions can have both positional and named parameters
      const resolvedParams = {};

      // Debug logging for DOM functions
      if (method.startsWith('DOM_')) {
        console.log(`Executing ${method} with params:`, funcCall.params);
      }

      for (const [key, value] of Object.entries(funcCall.params || {})) {
        const resolved = await this.resolveValue(value);
        resolvedParams[key] = resolved;
        if (method.startsWith('DOM_')) {
          console.log(`  Resolved ${key}: ${value} -> ${resolved}`);
        }
      }

      // For built-in functions, convert named parameters to positional arguments
      const builtInFunc = this.builtInFunctions[method];
      const args = callConvertParamsToArgs(method, resolvedParams);

      if (method.startsWith('DOM_')) {
        console.log(`${method} converted args:`, args);
      }

      return await builtInFunc(...args);
    }

    // Check if this is a built-in operation
    // Operations receive named params directly (not converted to positional args)
    // Check both original case and uppercase (like externalFunctions)
    if (this.operations[funcCall.command] || this.operations[method]) {
      const resolvedParams = {};

      for (const [key, value] of Object.entries(funcCall.params || {})) {
        // asClause should not be resolved - it's a literal pattern string
        if (key === 'asClause') {
          resolvedParams[key] = value;
        } else {
          const resolved = await this.resolveValue(value);
          resolvedParams[key] = resolved;
        }
      }

      const operation = this.operations[funcCall.command] || this.operations[method];

      // Pass params object directly - operations use named parameters
      return await operation(resolvedParams);
    }

    // Check if this is an external function from REQUIRE'd library (case-sensitive check first, then uppercase)
    if (this.externalFunctions[funcCall.command] || this.externalFunctions[method]) {
      const resolvedParams = {};
      for (const [key, value] of Object.entries(funcCall.params || {})) {
        resolvedParams[key] = await this.resolveValue(value);
      }

      const externalFunc = this.externalFunctions[funcCall.command] || this.externalFunctions[method];
      const args = callConvertParamsToArgs(funcCall.command, resolvedParams);

      return await externalFunc(...args);
    }

    // Check if current ADDRESS target has a handler for custom methods
    // This allows ADDRESS targets to define their own methods while still preserving built-in functions
    if (this.address !== 'default') {
      const addressTarget = this.addressTargets.get(this.address);
      if (addressTarget && addressTarget.handler) {
        const resolvedParams = {};
        for (const [key, value] of Object.entries(funcCall.params || {})) {
          resolvedParams[key] = await this.resolveValue(value);
        }
        const result = await addressTarget.handler(funcCall.command, resolvedParams);
        return result;
      }
    }

    // Try browser-compatible string functions before missing function check
    const resolvedParams = {};
    for (const [key, value] of Object.entries(funcCall.params || {})) {
      resolvedParams[key] = await this.resolveValue(value);
    }
    const args = Object.values(resolvedParams);

    const browserResult = this.executeBrowserStringFunction(method, args);
    if (browserResult !== null) {
      return browserResult;
    }
    
    // Not a built-in function, proceed with RPC call
    if (!this.addressSender) {
      const sourceContext = this.currentLineNumber ? {
        lineNumber: this.currentLineNumber,
        sourceLine: this.sourceLines[this.currentLineNumber - 1] || '',
        sourceFilename: this.sourceFilename || '',
        interpreter: this,
                    interpolation: interpolation
      } : null;
      
      // Enhanced error message with categorization and documentation links
      const errorMessage = this.createMissingFunctionError(method);
      throw new RexxError(errorMessage, 'FUNCTION', sourceContext);
    }
    
    // resolvedParams already computed above for browser functions
    
    // Fall back to Address Sender for unregistered ADDRESS targets
    const namespace = this.address;
    const rpcMethod = funcCall.command;
    
    return await this.addressSender.send(namespace, rpcMethod, resolvedParams);
  }

  checkFunctionRequiresParameters(method) {
    // Check function metadata for parameter requirements
    const func = this.builtInFunctions[method] || this.operations[method];
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

  createMissingFunctionError(method) {
    return security.createMissingFunctionError(method);
  }

  async evaluateCondition(condition) {
    return await expressionValueUtils.evaluateCondition(
      condition,
      this.resolveValue.bind(this),
      compareValues,
      isTruthy
    );
  }

  isLikelyFunctionName(name) {
    // Check if it's a built-in function or operation
    if (this.builtInFunctions[name.toUpperCase()]) {
      return true;
    }
    if (this.operations[name.toUpperCase()]) {
      return true;
    }
    
    // Delegate to imported function for pattern matching
    return isLikelyFunctionName(name);
  }

  async evaluateExpression(expr) {
    return await expressionValueUtils.evaluateExpression(
      expr,
      this.resolveValue.bind(this),
      this.variables.get.bind(this.variables),
      this.variables.has.bind(this.variables),
      this.interpolateString.bind(this),
      this.evaluateConcatenation.bind(this),
      this.executeFunctionCall.bind(this),
      this.isLikelyFunctionName.bind(this),
      (method) => !!(this.builtInFunctions[method] || this.operations[method]),
      (method) => this.builtInFunctions[method] || this.operations[method],
      callConvertParamsToArgs,
      isNumericString,
      (method) => !!this.operations[method]  // isOperationFn - check if it's in operations registry
    );
  }

  async resolveValue(value) {
    return await expressionValueUtils.resolveValue(
      value,
      this.variables.get.bind(this.variables),
      this.variables.has.bind(this.variables),
      this.evaluateExpression.bind(this),
      this.interpolateString.bind(this),
      this.executeFunctionCall.bind(this),
      this.isLikelyFunctionName.bind(this)
    );
  }
  
  async evaluateConcatenation(expression) {
    // Use the extracted evaluateConcatenation function, passing this.resolveValue as the resolver
    return await evaluateConcatenation(expression, (variableName) => this.resolveValue(variableName));
  }
  
  async interpolateString(template) {
    // Use the extracted interpolateString function, passing variableStack resolver to avoid circular calls
    return await interpolateString(template, async (variableName) => {
      // Use variableStack's resolveVariableValue which handles complex paths without circular calls
      return await variableStackUtils.resolveVariableValue(variableName, this.variables, this.evaluateExpression.bind(this));
    });
  }

  async evaluateRexxCallbackExpression(expr) {
    // Simple REXX expression evaluator for callback expressions
    // Supports concatenation (||), logical operators & (AND), | (OR), and comparison operators

    // Handle concatenation operator (||) - must check before logical OR
    if (expr.includes('||')) {
      const parts = expr.split('||');
      let result = '';
      for (const part of parts) {
        const partResult = await this.evaluateRexxExpressionPart(part.trim());
        result += String(partResult);
      }
      return result;
    }

    // Handle logical AND (&)
    if (expr.includes(' & ')) {
      const parts = expr.split(' & ');
      let result = true;
      for (const part of parts) {
        const partResult = await this.evaluateRexxCallbackExpression(part.trim());
        if (!isTruthy(partResult)) {
          result = false;
          break;
        }
      }
      return result;
    }
    
    // Handle logical OR (|)
    if (expr.includes(' | ')) {
      const parts = expr.split(' | ');
      let result = false;
      for (const part of parts) {
        const partResult = await this.evaluateRexxCallbackExpression(part.trim());
        if (isTruthy(partResult)) {
          result = true;
          break;
        }
      }
      return result;
    }
    
    // Handle comparison operators (with or without spaces)
    // Try operators in order of length to match longest first (e.g., >= before >)
    const comparisonRegexes = [
      { regex: /(.+?)\s*>=\s*(.+)/, op: '>=' },
      { regex: /(.+?)\s*<=\s*(.+)/, op: '<=' },
      { regex: /(.+?)\s*!=\s*(.+)/, op: '!=' },
      { regex: /(.+?)\s*==\s*(.+)/, op: '==' },
      { regex: /(.+?)\s*<>\s*(.+)/, op: '<>' },
      { regex: /(.+?)\s*¬=\s*(.+)/, op: '¬=' },
      { regex: /(.+?)\s*><\s*(.+)/, op: '><' },
      { regex: /(.+?)\s*>\s*(.+)/, op: '>' },
      { regex: /(.+?)\s*<\s*(.+)/, op: '<' },
      { regex: /(.+?)\s*=\s*(.+)/, op: '=' }
    ];

    for (const {regex, op} of comparisonRegexes) {
      const match = expr.match(regex);
      if (match) {
        const leftVal = await this.evaluateRexxExpressionPart(match[1].trim());
        const rightVal = await this.evaluateRexxExpressionPart(match[2].trim());

        switch (op) {
          case '>=':
            return compareValues(leftVal, rightVal) >= 0;
          case '<=':
            return compareValues(leftVal, rightVal) <= 0;
          case '>':
            return compareValues(leftVal, rightVal) > 0;
          case '<':
            return compareValues(leftVal, rightVal) < 0;
          case '=':
          case '==':
            return compareValues(leftVal, rightVal) === 0;
          case '!=':
          case '<>':
          case '¬=':
          case '><':
            return compareValues(leftVal, rightVal) !== 0;
        }
      }
    }
    
    // Simple expression - evaluate as single part
    return await this.evaluateRexxExpressionPart(expr);
  }

  async evaluateRexxExpressionPart(expr) {
    // Evaluate a single part of a REXX expression (function call, variable, literal, arithmetic)
    const trimmed = expr.trim();

    // Check if it contains arithmetic operators (*, /, %, +, -, **)
    const hasArithmetic = /[\+\-\*\/%]/.test(trimmed) && !trimmed.match(/^['"].*['"]$/);
    if (hasArithmetic) {
      // Try to evaluate as arithmetic expression using the full expression evaluator
      try {
        const {parseExpression} = require('./parser');
        const parsedExpr = parseExpression(trimmed);
        if (parsedExpr) {
          return await this.evaluateExpression(parsedExpr);
        }
      } catch (e) {
        // If parsing fails, continue with simple evaluation
      }
    }

    // Check if it's a function call with parentheses (handle nested parentheses)
    const funcNameMatch = trimmed.match(/^([a-zA-Z_]\w*)\s*\(/);
    if (funcNameMatch) {
      const funcName = funcNameMatch[1].toUpperCase();
      const startIdx = funcNameMatch[0].length - 1; // Index of opening (

      // Find matching closing parenthesis
      let parenCount = 0;
      let endIdx = -1;
      let inQuotes = false;
      let quoteChar = '';

      for (let i = startIdx; i < trimmed.length; i++) {
        const char = trimmed[i];

        if (!inQuotes && (char === '"' || char === "'")) {
          inQuotes = true;
          quoteChar = char;
        } else if (inQuotes && char === quoteChar) {
          inQuotes = false;
        } else if (!inQuotes && char === '(') {
          parenCount++;
        } else if (!inQuotes && char === ')') {
          parenCount--;
          if (parenCount === 0) {
            endIdx = i;
            break;
          }
        }
      }

      if (endIdx !== -1 && endIdx === trimmed.length - 1) {
        // Valid function call
        const argsStr = trimmed.substring(startIdx + 1, endIdx);

        // Parse arguments
        const args = [];
        if (argsStr.trim()) {
          // Simple argument parsing - split by comma but handle quoted strings and nested parens
          const argParts = this.parseSimpleArguments(argsStr);
          for (const argPart of argParts) {
            const argValue = await this.evaluateRexxExpressionPart(argPart.trim());
            args.push(argValue);
          }
        }

        // Execute built-in function or operation
        if (this.builtInFunctions[funcName]) {
          const func = this.builtInFunctions[funcName];
          return await func(...args);
        }
        if (this.operations[funcName]) {
          const operation = this.operations[funcName];
          return await operation(...args);
        }
      }
    }

    // Check if it's a quoted string
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
      return trimmed.substring(1, trimmed.length - 1);
    }

    // Check if it's a number
    if (!isNaN(parseFloat(trimmed)) && isFinite(trimmed)) {
      return parseFloat(trimmed);
    }

    // Check if it's a variable
    if (this.variables.has(trimmed)) {
      return this.variables.get(trimmed);
    }

    // Return as literal string
    return trimmed;
  }

  parseSimpleArguments(argsStr) {
    // Argument parser that handles comma-separated values with quoted strings and nested parentheses
    const args = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = null;
    let parenDepth = 0;

    for (let i = 0; i < argsStr.length; i++) {
      const char = argsStr[i];

      if (!inQuotes && (char === '"' || char === "'")) {
        inQuotes = true;
        quoteChar = char;
        current += char;
      } else if (inQuotes && char === quoteChar) {
        inQuotes = false;
        quoteChar = null;
        current += char;
      } else if (!inQuotes && char === '(') {
        parenDepth++;
        current += char;
      } else if (!inQuotes && char === ')') {
        parenDepth--;
        current += char;
      } else if (!inQuotes && char === ',' && parenDepth === 0) {
        // Only split on comma if not inside parentheses
        args.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    if (current.trim()) {
      args.push(current.trim());
    }

    return args;
  }
  
  // UUID/ID Generation helper methods
  

  async handleError(error, currentIndex) {
    return await errorHandlingUtils.handleError(
      error,
      currentIndex,
      this.errorHandlers,
      this.currentCommands,
      this.variables,
      this, // Pass interpreter as context
      this.jumpToLabel.bind(this)
    );
  }

  getCommandText(command) {
    return errorHandlingUtils.getCommandText(command);
  }

  getCurrentFunctionName(command) {
    return errorHandlingUtils.getCurrentFunctionName(command);
  }

  async jumpToLabel(labelName) {
    return await errorHandlingUtils.jumpToLabel(
      labelName,
      this.labels,
      this.currentCommands,
      executeCommand.bind(null, this),
      executeCommands.bind(null, this)
    );
  }

  setNumericSetting(setting, value) {
    return traceFormattingUtils.setNumericSetting(setting, value, this.numericSettings);
  }

  // Execute PUSH statement - add to top of stack (LIFO)
  async executePush(command) {
    await variableStackUtils.executePush(command, this.stack, this.variables, this.evaluateExpression.bind(this));
  }

  // Execute PULL statement - remove from top of stack (LIFO)
  executePull(command) {
    variableStackUtils.executePull(command, this.stack, this.variables);
  }

  // Execute QUEUE statement - add to bottom of stack (FIFO)
  async executeQueue(command) {
    await variableStackUtils.executeQueue(command, this.stack, this.variables, this.evaluateExpression.bind(this));
  }



  // Execute RETURN statement
  async executeReturn(command) {
    let returnValue = '';
    
    if (command.value) {
      // Use resolveValue to handle all types of value resolution consistently
      returnValue = await this.resolveValue(command.value);
    }
    
    this.returnValue = returnValue;
    
    return {
      type: 'RETURN',
      value: returnValue,
      terminated: true
    };
  }

  // Execute TRACE statement
  executeTrace(command) {
    this.traceMode = traceFormattingUtils.executeTrace(command, this.traceOutput, this.addTraceOutput.bind(this));
  }

  // Add trace output based on current mode
  addTraceOutput(message, type = 'instruction', lineNumber = null, result = null) {
    traceFormattingUtils.addTraceOutput(message, type, lineNumber, result, this.traceMode, this.traceOutput);
  }

  // Get trace output as formatted strings
  getTraceOutput() {
    return traceFormattingUtils.getTraceOutput(this.traceOutput);
  }

  // Clear trace output
  clearTraceOutput() {
    return traceFormattingUtils.clearTraceOutput(this.traceOutput);
  }

  
  // Initialize DOM Element Manager if in browser environment
  initializeDOMManager() {
    // Only initialize once
    if (this.domManager) {
      return;
    }
    
    domManagerUtils.initializeDOMManager((manager) => {
      this.domManager = manager;
    });
  }
  
  // Execute RETRY_ON_STALE blocks with automatic retry on stale elements
  async executeRetryOnStale(command) {
    return await domManagerUtils.executeRetryOnStale(
      command,
      this.variables.get.bind(this.variables),
      this.variables.set.bind(this.variables),
      this.variables.has.bind(this.variables),
      executeCommands.bind(null, this)
    );
  }

  // Transitive dependency resolution
  
  async requireWithDependencies(libraryName, asClause = null) {
    const ctx = {
      libraryManagementUtils,
      loadingQueue: this.loadingQueue,
      checkLibraryPermissions: this.checkLibraryPermissions.bind(this),
      isLibraryLoaded: this.isLibraryLoaded.bind(this),
      detectAndRegisterAddressTargets: (libName, asClause) => this.detectAndRegisterAddressTargets(libName, asClause),
      extractDependencies: this.extractDependencies.bind(this),
      dependencyGraph: this.dependencyGraph,
      registerLibraryFunctions: (libName, asClause) => this.registerLibraryFunctions(libName, asClause),
      requireRegistryLibrary: this.requireRegistryLibrary.bind(this),
      isRemoteOrchestrated: this.isRemoteOrchestrated.bind(this),
      isBuiltinLibrary: this.isBuiltinLibrary.bind(this),
      requireViaCheckpoint: this.requireViaCheckpoint.bind(this),
      detectEnvironment: this.detectEnvironment.bind(this),
      requireWebStandalone: this.requireWebStandalone.bind(this),
      requireControlBus: this.requireControlBus.bind(this),
      requireNodeJS: this.requireNodeJS.bind(this),
      requireNodeJSModule: this.requireNodeJSModule.bind(this),
      loadAndExecuteLibrary: this.loadAndExecuteLibrary.bind(this),
      libraryUrlUtils,
      lookupPublisherRegistry: this.lookupPublisherRegistry.bind(this),
      lookupModuleInRegistry: this.lookupModuleInRegistry.bind(this),
      loadLibraryFromUrl: this.loadLibraryFromUrl.bind(this),
      isLocalOrNpmModule: this.isLocalOrNpmModule.bind(this),
      isRegistryStyleLibrary: this.isRegistryStyleLibrary.bind(this),
      requireRegistryStyleLibrary: this.requireRegistryStyleLibrary.bind(this),
      requireRemoteLibrary: this.requireRemoteLibrary.bind(this)
    };
    return await requireSystem.requireWithDependencies(libraryName, asClause, ctx);
  }

  async loadSingleLibrary(libraryName) {
    const ctx = {
      requireRegistryLibrary: this.requireRegistryLibrary.bind(this),
      isRemoteOrchestrated: this.isRemoteOrchestrated.bind(this),
      isBuiltinLibrary: this.isBuiltinLibrary.bind(this),
      requireViaCheckpoint: this.requireViaCheckpoint.bind(this),
      detectEnvironment: this.detectEnvironment.bind(this),
      requireWebStandalone: this.requireWebStandalone.bind(this),
      requireControlBus: this.requireControlBus.bind(this),
      requireNodeJS: this.requireNodeJS.bind(this),
      requireNodeJSModule: this.requireNodeJSModule.bind(this),
      loadAndExecuteLibrary: this.loadAndExecuteLibrary.bind(this),
      libraryUrlUtils,
      lookupPublisherRegistry: this.lookupPublisherRegistry.bind(this),
      lookupModuleInRegistry: this.lookupModuleInRegistry.bind(this),
      loadLibraryFromUrl: this.loadLibraryFromUrl.bind(this)
    };
    return await requireSystem.loadSingleLibrary(libraryName, ctx);
  }

  async requireNodeJS(libraryName) {
    const ctx = {
      requireNodeJSModule: this.requireNodeJSModule.bind(this),
      loadAndExecuteLibrary: this.loadAndExecuteLibrary.bind(this),
      libraryUrlUtils,
      lookupPublisherRegistry: this.lookupPublisherRegistry.bind(this),
      lookupModuleInRegistry: this.lookupModuleInRegistry.bind(this),
      loadLibraryFromUrl: this.loadLibraryFromUrl.bind(this),
      detectEnvironment: this.detectEnvironment.bind(this),
      isBuiltinLibrary: this.isBuiltinLibrary.bind(this),
      isLocalOrNpmModule: this.isLocalOrNpmModule.bind(this),
      isRegistryStyleLibrary: this.isRegistryStyleLibrary.bind(this),
      requireRegistryStyleLibrary: this.requireRegistryStyleLibrary.bind(this),
      requireRemoteLibrary: this.requireRemoteLibrary.bind(this)
    };
    return await requireSystem.requireNodeJS(libraryName, ctx);
  }

  /**
   * Load library from remote Git platforms (GitHub, GitLab, Azure DevOps, etc.)
   * @param {string} libraryName - Library name or URL
   * @returns {Promise<boolean>} True if library loaded successfully
   */
  async requireRemoteLibrary(libraryName) {
    const ctx = {
      loadAndExecuteLibrary: this.loadAndExecuteLibrary.bind(this)
    };
    return await requireSystem.requireRemoteLibrary(libraryName, ctx);
  }

  isLocalOrNpmModule(libraryName) {
    const ctx = {
      libraryUrlUtils
    };
    return requireSystem.isLocalOrNpmModule(libraryName, ctx);
  }

  /**
   * Check if library name follows registry style (namespace/module@version)
   * @param {string} libraryName - Library name to check
   * @returns {boolean} True if registry style
   */
  isRegistryStyleLibrary(libraryName) {
    return requireSystem.isRegistryStyleLibrary(libraryName);
  }

  /**
   * Resolve library through registry system
   * @param {string} libraryName - Registry-style library name (namespace/module@version)
   * @returns {Promise<boolean>} True if library loaded successfully
   */
  async requireRegistryStyleLibrary(libraryName) {
    const ctx = {
      lookupPublisherRegistry: this.lookupPublisherRegistry.bind(this),
      lookupModuleInRegistry: this.lookupModuleInRegistry.bind(this),
      loadLibraryFromUrl: this.loadLibraryFromUrl.bind(this),
      detectEnvironment: this.detectEnvironment.bind(this),
      loadAndExecuteLibrary: this.loadAndExecuteLibrary.bind(this),
      requireRemoteLibrary: this.requireRemoteLibrary.bind(this)
    };
    return await requireSystem.requireRegistryStyleLibrary(libraryName, ctx);
  }

  /**
   * Parse registry library name into components
   * @param {string} libraryName - Library name like "namespace/module@version"
   * @returns {Object} Parsed components {namespace, module, version}
   */
  parseRegistryLibraryName(libraryName) {
    return requireSystem.parseRegistryLibraryName(libraryName);
  }

  /**
   * Look up publisher registry URL
   * @param {string} namespace - Publisher namespace
   * @returns {Promise<string>} Registry URL for the publisher
   */
  async lookupPublisherRegistry(namespace) {
    const publisherRegistryUrl = 'https://rexxjs.org/.list-of-public-lib-publishers.txt';
    
    try {
      // Fetch publisher registry
      const response = await fetch(publisherRegistryUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch publisher registry: ${response.status}`);
      }
      
      const registryText = await response.text();
      const lines = registryText.split('\n').filter(line => line.trim() && !line.startsWith('#'));
      
      // Parse CSV: namespace,registry_url
      for (const line of lines) {
        const [lineNamespace, registryUrl] = line.split(',').map(s => s.trim());
        if (lineNamespace === namespace) {
          return registryUrl;
        }
      }
      
      throw new Error(`Namespace '${namespace}' not found in publisher registry`);
      
    } catch (error) {
      throw new Error(`Publisher registry lookup failed: ${error.message}`);
    }
  }

  /**
   * Look up module URL in publisher's registry
   * @param {string} registryUrl - Publisher's registry URL
   * @param {string} module - Module name
   * @param {string} version - Version tag
   * @returns {Promise<string>} Final download URL for the module
   */
  async lookupModuleInRegistry(registryUrl, module, version) {
    try {
      // Fetch module registry
      const response = await fetch(registryUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch module registry: ${response.status}`);
      }
      
      const registryText = await response.text();
      const lines = registryText.split('\n').filter(line => line.trim() && !line.startsWith('#'));
      
      // Parse CSV: module_name,type,url_template
      for (const line of lines) {
        const [moduleName, moduleType, urlTemplate] = line.split(',').map(s => s.trim());
        if (moduleName === module) {
          // Substitute {tag} in URL template
          const finalUrl = urlTemplate.replace('{tag}', version);
          return finalUrl;
        }
      }
      
      throw new Error(`Module '${module}' not found in registry`);
      
    } catch (error) {
      throw new Error(`Module registry lookup failed: ${error.message}`);
    }
  }

  async requireNodeJSModule(libraryName) {
    return await requireSystem.requireNodeJSModule(libraryName, this);
  }


  async requireGitHubLibrary(libraryName) {
    // Use the existing GitHub-based loading logic
    const libraryCode = await this.fetchLibraryCode(libraryName);
    
    // Store in cache
    this.libraryCache.set(libraryName, {
      code: libraryCode,
      loaded: true,
      timestamp: Date.now()
    });
    
    // Execute the code
    await this.executeLibraryCode(libraryCode, libraryName);
    
    // Register functions
    this.registerLibraryFunctions(libraryName);
    
    console.log(`✓ ${libraryName} loaded from local, GitHub or other`);
    return true;
  }

  async extractDependencies(libraryName) {
    return await requireSystem.extractDependencies(libraryName, this);
  }

  parseCommentMetadata(sourceCode) {
    // Parse @REXX_LIBRARY_METADATA comment blocks
    const metadataRegex = /@REXX_LIBRARY_METADATA[\s\S]*?(?=\*\/|\*\s*@|\*\s*Copyright|\*\s*$)/;
    const match = sourceCode.match(metadataRegex);
    
    if (!match) return null;
    
    const metadataBlock = match[0];
    const metadata = {};
    
    // Parse individual metadata fields
    const fields = {
      name: /@name:\s*(.+)$/m,
      version: /@version:\s*(.+)$/m,
      description: /@description:\s*(.+)$/m,
      type: /@type:\s*(.+)$/m,
      detection_function: /@detection_function:\s*(.+)$/m,
      functions: /@functions:\s*(.+)$/m,
      dependencies: /@dependencies:\s*(.+)$/m
    };
    
    for (const [key, regex] of Object.entries(fields)) {
      const fieldMatch = metadataBlock.match(regex);
      if (fieldMatch) {
        let value = fieldMatch[1].trim();
        
        // Parse arrays (comma-separated values)
        if (key === 'functions' || key === 'dependencies') {
          value = value === '[]' ? [] : value.split(',').map(s => s.trim()).filter(s => s);
        }
        
        metadata[key] = value;
      }
    }
    
    return Object.keys(metadata).length > 0 ? metadata : null;
  }

  // REQUIRE system helper methods
  
  isLibraryLoaded(libraryName) {
    // Check the modern registry first
    if (typeof window !== 'undefined' && window.REXX_FUNCTION_LIBS) {
      const found = window.REXX_FUNCTION_LIBS.find(lib => 
        lib.path === libraryName || 
        lib.name === libraryName ||
        lib.path.endsWith('/' + libraryName) ||
        libraryName.endsWith('/' + lib.name)
      );
      if (found) {
        return true;
      }
    }
    
    const detectionFunction = this.getLibraryDetectionFunction(libraryName);
    
    // Check cache first in Node.js environment (but don't return false if not cached)
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
      const cached = this.libraryCache.get(libraryName);
      if (cached && cached.loaded) {
        return true;
      }
      // Continue to function-based detection if not in cache
    }
    
    let globalScope;
    if (typeof window !== 'undefined') {
      globalScope = window;
    } else if (typeof global !== 'undefined') {
      globalScope = global;
    } else {
      return false;
    }
    
    // Check for built-in R libraries first (namespaced or global)
    // Extract basename for pattern matching: "../src/r-graphics-functions.js" -> "r-graphics-functions"
    const basename = libraryName.split('/').pop().replace(/\.(js|rexx)$/, '');
    if (basename.startsWith('r-') && basename.endsWith('-functions')) {
      const namespaceName = this.getLibraryNamespace(basename);
      
      // Check if detection function is in namespace object
      if (typeof globalScope[namespaceName] === 'object' && 
          typeof globalScope[namespaceName][detectionFunction] === 'function') {
        return true;
      }
      
      // Also check if detection function is directly on global scope (fallback)
      if (typeof globalScope[detectionFunction] === 'function') {
        return true;
      }
      
      return false;
    }
    
    // Check for external libraries (detection function on global scope)
    if (typeof globalScope[detectionFunction] === 'function') {
      try {
        // Try calling the detection function to verify it works
        const result = globalScope[detectionFunction]();
        
        // Handle new metadata format (object with type/loaded info)
        if (typeof result === 'object' && result !== null) {
          return result.loaded === true || result.type !== undefined;
        }
      } catch (error) {
        // Detection function exists but failed to execute
        return false;
      }
    }
    
    
    // If no detection function found, library is not loaded
    return false;
  }

  getLibraryNamespace(libraryName) {
    // Generate namespace from library name
    // Extract base name: "./tests/mock-address.js" -> "mock-address"
    const basename = libraryName.split('/').pop().replace(/\.(js|rexx)$/, '');
    // Convert to valid identifier: "mock-address" -> "mock_address"
    const namespace = basename.replace(/[^a-zA-Z0-9_]/g, '_');
    return namespace;
  }

  getLibraryDetectionFunction(libraryName) {
    return requireSystem.getLibraryDetectionFunction(libraryName);
  }

  extractMetadataFunctionName(libraryCode) {
    return requireSystem.extractMetadataFunctionName(libraryCode);
  }

  detectAndRegisterAddressTargets(libraryName, asClause = null) {
    // Look for ADDRESS target registration in loaded library
    let globalScope;
    if (typeof window !== 'undefined') {
      globalScope = window;
    } else if (typeof global !== 'undefined') {
      globalScope = global;
    } else {
      return; // No global scope available
    }
    
    // PRIORITY 1: Check library metadata for declared ADDRESS targets
    const detectionFunction = this.getLibraryDetectionFunction(libraryName);
    if (globalScope[detectionFunction] && typeof globalScope[detectionFunction] === 'function') {
      try {
        const metadata = globalScope[detectionFunction]();
        if (metadata && typeof metadata === 'object' && 
            (metadata.type === 'address-target' || metadata.type === 'hybrid') &&
            metadata.provides && metadata.provides.addressTarget) {
          
          const originalTargetName = metadata.provides.addressTarget;
          // Apply AS clause transformation for ADDRESS target
          const targetName = this.applyAsClauseToAddressTarget(originalTargetName, asClause, metadata);
          const handlerFunctionName = `ADDRESS_${originalTargetName.toUpperCase()}_HANDLER`;
          const methodsObjectName = `ADDRESS_${originalTargetName.toUpperCase()}_METHODS`;
          
          const handlerFunction = globalScope[handlerFunctionName];
          const methodsObject = globalScope[methodsObjectName] || {};
          
          if (typeof handlerFunction === 'function') {
            this.addressTargets.set(targetName, {
              handler: handlerFunction,
              methods: Object.keys(methodsObject),
              metadata: {
                libraryName: libraryName,
                libraryMetadata: metadata,
                exportName: handlerFunctionName
              }
            });
            
            return; // Successfully registered via metadata, no need for pattern detection
          }
        }
      } catch (error) {
        console.warn(`Failed to read metadata from ${libraryName}:`, error.message);
        // Continue to pattern-based detection
      }
    }
    
    // PRIORITY 2: Fallback to pattern-based detection for backward compatibility
    for (const exportName in globalScope) {
      if (exportName.startsWith('ADDRESS_') && exportName.endsWith('_HANDLER')) {
        // Extract target name: ADDRESS_CALCULATOR_HANDLER -> calculator
        const targetName = exportName.slice(8, -8).toLowerCase();
        const handlerFunction = globalScope[exportName];
        const methodsObjectName = `ADDRESS_${exportName.slice(8, -8)}_METHODS`;
        const methodsObject = globalScope[methodsObjectName] || {};
        
        if (typeof handlerFunction === 'function') {
          this.addressTargets.set(targetName, {
            handler: handlerFunction,
            methods: Object.keys(methodsObject),
            metadata: {
              libraryName: libraryName,
              exportName: exportName
            }
          });
          
        }
      }
    }
  }

  detectEnvironment() {
    return utils.detectEnvironment();
  }

  // SCRO: Remote REQUIRE functionality using CHECKPOINT communication
  isRemoteOrchestrated() {
    // Check if we're in a remote orchestrated context
    // This is indicated by specific environment variables or context flags
    return (
      // Check for SCRO_REMOTE environment variable
      (typeof process !== 'undefined' && process.env && process.env.SCRO_REMOTE === 'true') ||
      // Check for remote orchestration context variable
      this.variables.has('SCRO_REMOTE') ||
      // Check for CHECKPOINT callback indicating remote orchestration
      (this.streamingProgressCallback && this.variables.has('SCRO_ORCHESTRATION_ID'))
    );
  }

  isBuiltinLibrary(libraryName) {
    // Built-in libraries that should never be requested remotely
    const builtinLibraries = [
      'string-functions', 'math-functions', 'json-functions', 'array-functions',
      'date-time-functions', 'url-functions', 'random-functions', 'regex-functions',
      'validation-functions', 'file-functions', 'statistics-functions', 'logic-functions',
      'cryptography-functions', 'dom-functions', 'data-functions', 'probability-functions'
    ];
    
    // Check for built-in libraries
    if (builtinLibraries.includes(libraryName)) {
      return true;
    }
    
    // Check for local file paths (relative paths)
    if (libraryName.startsWith('./') || libraryName.startsWith('../')) {
      return true;
    }
    
    return false;
  }

  async requireViaCheckpoint(libraryName) {
    // Send REQUIRE request via CHECKPOINT communication channel
    const requireId = `require_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Send CHECKPOINT request for library
    const requestData = {
      type: 'require_request',
      libraryName: libraryName,
      requireId: requireId,
      timestamp: Date.now()
    };
    
    // Use CHECKPOINT to request the library from orchestrator
    const checkpointResult = this.sendCheckpointMessage('require_request', requestData);
    
    // Wait for library response via CHECKPOINT
    const libraryResponse = await this.waitForCheckpointResponse(requireId, 30000); // 30 second timeout
    
    if (!libraryResponse || !libraryResponse.success) {
      throw new Error(`Remote REQUIRE failed for ${libraryName}: ${libraryResponse?.error || 'timeout'}`);
    }
    
    // Execute the library code received from orchestrator
    await this.executeRemoteLibraryCode(libraryName, libraryResponse.libraryCode);
    
    return true;
  }

  sendCheckpointMessage(type, data) {
    // Send message via existing CHECKPOINT mechanism
    const messageData = {
      type: 'rexx-require',
      subtype: type,
      timestamp: Date.now(),
      data: data,
      line: this.currentLineNumber || 0
    };
    
    // Use existing CHECKPOINT communication channels
    if (this.streamingProgressCallback) {
      this.streamingProgressCallback(messageData);
    } else if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
      window.parent.postMessage(messageData, '*');
    }
    
    return messageData;
  }

  async waitForCheckpointResponse(requireId, timeoutMs = 30000) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanup();
        resolve({ success: false, error: 'timeout' });
      }, timeoutMs);
      
      const messageHandler = (event) => {
        if (event.data && 
            event.data.type === 'rexx-require-response' && 
            event.data.requireId === requireId) {
          cleanup();
          resolve(event.data);
        }
      };
      
      const cleanup = () => {
        clearTimeout(timeout);
        if (typeof window !== 'undefined') {
          window.removeEventListener('message', messageHandler);
        }
      };
      
      // Check if we have any communication channels available
      const hasWindowChannel = typeof window !== 'undefined' && window.parent && window.parent !== window;
      const hasStreamingChannel = this.streamingProgressCallback != null;
      
      if (!hasWindowChannel && !hasStreamingChannel) {
        cleanup();
        resolve({ success: false, error: 'no_communication_channel' });
        return;
      }
      
      // Listen for response via window messaging
      if (hasWindowChannel) {
        window.addEventListener('message', messageHandler);
      }
      
      // For streaming callback, we need a different mechanism
      // For now, just rely on timeout since full orchestration setup isn't implemented
    });
  }

  async executeRemoteLibraryCode(libraryName, libraryCode) {
    // Execute the library code received from the orchestrator
    const env = this.detectEnvironment();
    
    try {
      if (env === 'nodejs') {
        // Use VM for safe execution in Node.js
        const vm = require('vm');
        const context = {
          module: { exports: {} },
          exports: {},
          require: require,
          console: console,
          Buffer: Buffer,
          process: process,
          global: global,
          __dirname: __dirname,
          __filename: __filename
        };
        
        vm.createContext(context);
        vm.runInContext(libraryCode, context);
        
        // Register any exported functions
        this.registerRemoteLibraryExports(libraryName, context.module.exports);
        
      } else {
        // Browser environment - use eval with isolated scope
        const context = {
          window: typeof window !== 'undefined' ? window : {},
          document: typeof document !== 'undefined' ? document : {},
          console: console
        };
        
        // Create isolated execution context
        const wrappedCode = `
          (function(window, document, console) {
            ${libraryCode}
          })(context.window, context.document, context.console);
        `;
        
        eval(wrappedCode);
        
        // Register any global exports that were created
        this.registerRemoteLibraryExports(libraryName, context.window);
      }
      
      // Cache as loaded
      this.libraryCache.set(libraryName, { loaded: true, code: libraryCode });
      
    } catch (error) {
      throw new Error(`Failed to execute remote library ${libraryName}: ${error.message}`);
    }
  }

  registerRemoteLibraryExports(libraryName, exports) {
    // Register functions and ADDRESS handlers from remotely loaded library
    if (exports && typeof exports === 'object') {
      // Initialize functions registry if not already done
      if (!this.functions) {
        this.functions = {};
      }
      
      // Register regular functions
      for (const [name, func] of Object.entries(exports)) {
        if (typeof func === 'function' && !name.startsWith('_')) {
          this.functions[name] = func;
          // Also add to built-in functions for global access
          if (this.builtInFunctions && typeof this.builtInFunctions === 'object') {
            this.builtInFunctions[name] = func;
          }
        }
      }
      
      // Detect and register ADDRESS targets
      this.detectAndRegisterAddressTargets(libraryName);
    }
  }

  async loadAndExecuteLibrary(libraryName) {
    // Check cache first
    const cached = this.libraryCache.get(libraryName);
    if (cached && cached.loaded) {
      console.log(`✓ Using cached ${libraryName}`);
      return true;
    }
    
    // Dynamic import for Node.js environment
    try {
      const vm = require('vm');
      const https = require('https');
      
      let libraryCode;
      
      // Use cached code if available but not yet loaded
      if (cached && cached.code) {
        libraryCode = cached.code;
        console.log(`✓ Using cached code for ${libraryName}`);
      } else {
        // Handle local files first (relative paths starting with ./ or ../)
        if (libraryName.startsWith('./') || libraryName.startsWith('../')) {
          try {
            const path = require('path');
            const fs = require('fs');
            
            // Resolve the file path
            const filePath = path.resolve(libraryName);
            //console.log(`Loading local file: ${filePath}`);
            
            // Read the file content
            libraryCode = fs.readFileSync(filePath, 'utf8');
          } catch (error) {
            throw new Error(`Failed to load local file ${libraryName}: ${error.message}`);
          }
        }
        // Handle built-in libraries
        else if (this.isBuiltinLibrary(libraryName)) {
          libraryCode = await this.loadBuiltinLibrary(libraryName);
        } 
        // Handle remote libraries
        else {
          libraryCode = await this.fetchLibraryCode(libraryName);
        }
        
        // Cache the code
        this.libraryCache.set(libraryName, {
          loaded: false,
          code: libraryCode,
          timestamp: Date.now()
        });
      }
      
      // Execute in a controlled context with proper global access
      const contextGlobals = {
        global: global,
        require: require,
        console: console,
        Buffer: Buffer,
        process: process,
        // Provide window as undefined for Node.js
        window: undefined
      };
      
      // Merge context with current global
      const context = Object.assign({}, global, contextGlobals);
      vm.createContext(context);
      vm.runInContext(libraryCode, context);
      
      // Copy any new globals back to the main global and window (if available)
      Object.keys(context).forEach(key => {
        if (key !== 'global' && key !== 'require' && key !== 'console' && 
            key !== 'Buffer' && key !== 'process' && key !== 'window' &&
            typeof context[key] === 'function') {
          
          // Always update global with the function from context
          global[key] = context[key];
          
          // Also set on window if it exists (Jest environment)
          if (typeof window !== 'undefined') {
            window[key] = context[key];
          }
        }
      });
      
      if (!this.isLibraryLoaded(libraryName)) {
        throw new Error(`Library ${libraryName} loaded but detection function not found`);
      }
      
      // Mark as loaded in cache
      const cacheEntry = this.libraryCache.get(libraryName) || {};
      cacheEntry.loaded = true;
      cacheEntry.timestamp = Date.now();
      this.libraryCache.set(libraryName, cacheEntry);
      
      // Register loaded functions as built-ins
      this.registerLibraryFunctions(libraryName);
      
      console.log(`✓ Loaded ${libraryName} from local, GitHub, or other`);
      return true;
      
    } catch (error) {
      throw new Error(`Failed to load ${libraryName} in Node.js: ${error.message}`);
    }
  }

  async requireRegistryLibrary(namespacedLibrary) {
    return await requireSystem.requireRegistryLibrary(namespacedLibrary, this);
  }

  async loadLibraryFromUrl(url, libraryName) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch library from ${url}: ${response.status} ${response.statusText}`);
      }

      const libraryCode = await response.text();

      // Execute the library code in global scope
      if (url.endsWith('.bundle.js')) {
        // Webpack bundle - use Function constructor
        const globalScope = typeof global !== 'undefined' ? global : window;
        const executeInGlobalScope = new Function('global', 'window', libraryCode);
        executeInGlobalScope(globalScope, globalScope);
      } else {
        // Unbundled module - temporarily make require global, then eval
        const globalScope = typeof global !== 'undefined' ? global : window;

        // Create a require that can load from real filesystem (outside pkg snapshot)
        // Set it globally and keep it - don't restore it
        if (typeof require !== 'undefined' && !globalScope.require) {
          // Use Module.createRequire with a path that can find node_modules
          // Try parent directory first, then cwd
          const Module = require('module');
          const path = require('path');
          const fs = require('fs');

          let requirePath = process.cwd();
          // Check if node_modules exists in parent directory
          const parentNodeModules = path.join(requirePath, '..', 'node_modules');
          if (fs.existsSync(parentNodeModules)) {
            requirePath = path.join(requirePath, '..');
          }

          const realFsRequire = Module.createRequire(path.join(requirePath, 'package.json'));

          // Set global.require so functions can access it
          globalScope.require = realFsRequire;

          // Use Function constructor with require parameter to give eval'd code access
          const func = new Function('require', 'module', 'exports', `
            ${libraryCode}
          `);

          // Call with our real filesystem require
          const mockModule = { exports: {} };
          func(realFsRequire, mockModule, mockModule.exports);

          // Make exports globally available
          if (mockModule.exports && typeof mockModule.exports === 'object') {
            for (const [key, value] of Object.entries(mockModule.exports)) {
              if (key && key !== 'undefined' && value !== undefined) {
                globalScope[key] = value;
              }
            }
          }
        } else {
          // If already set or no require available, just eval
          eval(libraryCode);
        }
      }

      // Detect and register ADDRESS handlers
      this.detectAndRegisterAddressTargets(libraryName);

      // Register the library functions
      this.registerLibraryFunctions(libraryName);

      // Register the detection function for dependency extraction
      // Extract metadata function name from the loaded code
      const metadataFunctionName = this.extractMetadataFunctionName(libraryCode);
      if (metadataFunctionName) {
        registerLibraryDetectionFunction(libraryName, metadataFunctionName);
        console.log(`✓ Registered detection function ${metadataFunctionName} for ${libraryName}`);
      }

      console.log(`✓ Loaded registry library: ${libraryName}`);
      return true;

    } catch (error) {
      throw new Error(`Failed to load registry library ${libraryName}: ${error.message}`);
    }
  }

  async requireWebStandalone(libraryName) {
    // Check if it's a registry-style library (namespace/module@version)
    if (this.isRegistryStyleLibrary(libraryName)) {
      return await this.requireRegistryStyleLibrary(libraryName);
    }
    
    const scriptUrl = this.resolveWebLibraryUrl(libraryName);
    
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = scriptUrl;
      
      script.onload = () => {
        // Give the library a moment to register itself globally
        setTimeout(() => {
          if (this.isLibraryLoaded(libraryName)) {
            // Register loaded functions as built-ins
            this.registerLibraryFunctions(libraryName);
            console.log(`✓ Loaded ${libraryName} from ${scriptUrl}`);
            resolve(true);
          } else {
            reject(new Error(`Library loaded but detection function not found`));
          }
        }, 10); // Small delay to allow library registration
      };
      
      script.onerror = () => {
        reject(new Error(`Failed to load library from ${scriptUrl}`));
      };
      
      document.head.appendChild(script);
    });
  }

  async requireControlBus(libraryName) {
    const requestId = this.generateRequestId();
    
    // Worker requests library from director
    const request = {
      type: 'library-request',
      library: libraryName,
      timestamp: Date.now(),
      requestId: requestId
    };
    
    // Send request to director
    window.parent.postMessage(request, '*');
    
    // Wait for director response
    const response = await this.waitForLibraryResponse(requestId);
    
    if (response.approved) {
      if (response.libraryCode) {
        // Director provided the library code directly
        await this.executeLibraryCode(response.libraryCode, libraryName);
      } else if (response.libraryUrl) {
        // Director provided URL to load from
        await this.loadLibraryFromUrl(response.libraryUrl, libraryName);
      }
      
      // Register loaded functions as built-ins
      this.registerLibraryFunctions(libraryName);
      
      console.log(`✓ Loaded ${libraryName} via control bus`);
      return true;
      
    } else {
      throw new Error(`Library request denied: ${response.reason || 'Permission denied'}`);
    }
  }

  resolveGitHubRawUrl(libraryName) {
    return libraryUrlUtils.resolveGitHubRawUrl(libraryName, this.isBuiltinLibrary.bind(this));
  }

  shouldUseGitHubRelease(libraryName, tag) {
    return libraryUrlUtils.shouldUseGitHubRelease(libraryName, tag);
  }

  async resolveGitHubReleaseUrl(libraryName, libraryRepo, tag) {
    // GitHub releases URL format
    const libName = libraryName.split('/').pop().split('@')[0]; // Extract library name without version
    
    // Try different common release asset naming patterns in order of preference
    const assetPatterns = [
      `${libName}.js`,           // simple-lib.js (preferred)
      `${libName}.min.js`,       // simple-lib.min.js
      `${libName}-${tag}.js`,    // simple-lib-v1.2.3.js
      `dist/${libName}.js`,      // dist/simple-lib.js (if GitHub auto-extracts)
      `lib/${libName}.js`,       // lib/simple-lib.js
      `bundle.js`,               // Generic bundle
      `index.js`,                // Generic entry point
      `${libName}-bundle.js`     // Bundled version
    ];
    
    // Try to find which asset exists
    for (const assetName of assetPatterns) {
      const url = `https://github.com/${libraryRepo}/releases/download/${tag}/${assetName}`;
      
      // For now, return first pattern (in production, we'd check if URL exists)
      // TODO: Add HEAD request to check if asset exists before trying to download
      return url;
    }
    
    // Fallback: try the raw file approach instead of releases
    console.warn(`No suitable release asset found for ${libraryName}@${tag}, falling back to raw file`);
    return `https://raw.githubusercontent.com/${libraryRepo}/${tag}/dist/${libName}.js`;
  }

  getLibraryType(libraryName) {
    return libraryUrlUtils.getLibraryType(libraryName, this.isBuiltinLibrary.bind(this));
  }

  getLibraryRepository(libraryName) {
    return libraryUrlUtils.getLibraryRepository(libraryName, this.isBuiltinLibrary.bind(this));
  }

  getLibraryTag(libraryName) {
    return libraryUrlUtils.getLibraryTag(libraryName, this.isBuiltinLibrary.bind(this));
  }

  getLibraryPath(libraryName) {
    return libraryUrlUtils.getLibraryPath(libraryName, this.isBuiltinLibrary.bind(this));
  }

  resolveWebLibraryUrl(libraryName) {
    return libraryUrlUtils.resolveWebLibraryUrl(libraryName);
  }

  async fetchLibraryCode(libraryName) {
    // Try multiple sources in order of preference
    const sources = this.getLibrarySources(libraryName);
    
    for (const source of sources) {
      try {
        console.log(`Trying ${source.type}: ${source.url}`);
        return await this.fetchFromUrl(source.url);
      } catch (error) {
        console.warn(`${source.type} failed for ${libraryName}: ${error.message}`);
        // Continue to next source
      }
    }
    
    throw new Error(`All sources failed for ${libraryName}`);
  }

  getLibrarySources(libraryName) {
    return libraryUrlUtils.getLibrarySources(libraryName, this.isBuiltinLibrary.bind(this));
  }

  shouldTryCDN(libraryName) {
    return libraryUrlUtils.shouldTryCDN(libraryName, this.isBuiltinLibrary.bind(this));
  }

  getCDNSources(libraryName, libName, tag) {
    return libraryUrlUtils.getCDNSources(libraryName, libName, tag, this.isBuiltinLibrary.bind(this));
  }

  getGitHubReleaseSources(libraryName, libName, tag) {
    return libraryUrlUtils.getGitHubReleaseSources(libraryName, libName, tag, this.isBuiltinLibrary.bind(this));
  }

  async fetchFromReleaseWithFallbacks(libraryName) {
    const libraryRepo = this.getLibraryRepository(libraryName);
    const tag = this.getLibraryTag(libraryName);
    const libName = libraryName.split('/').pop().split('@')[0];
    
    // Strategy 1: Try common individual file patterns
    const filePatterns = [
      `${libName}.js`,
      `${libName}.min.js`, 
      `${libName}-${tag}.js`,
      `bundle.js`,
      `index.js`
    ];
    
    for (const filename of filePatterns) {
      try {
        const url = `https://github.com/${libraryRepo}/releases/download/${tag}/${filename}`;
        console.log(`Trying release asset: ${filename}`);
        return await this.fetchFromUrl(url);
      } catch (error) {
        // Continue to next pattern
      }
    }
    
    // Strategy 2: Try common zip patterns and extract
    const zipPatterns = [
      'dist.zip',
      `${libName}.zip`,
      `${libName}-${tag}.zip`,
      'release.zip'
    ];
    
    for (const zipName of zipPatterns) {
      try {
        const zipUrl = `https://github.com/${libraryRepo}/releases/download/${tag}/${zipName}`;
        console.log(`Trying ZIP release asset: ${zipName}`);
        return await this.fetchFromZipRelease(zipUrl, libName);
      } catch (error) {
        // Continue to next pattern
      }
    }
    
    // Strategy 3: Fallback to raw file at the release tag
    console.log(`All release strategies failed, falling back to raw file at tag ${tag}`);
    const fallbackUrl = `https://raw.githubusercontent.com/${libraryRepo}/${tag}/dist/${libName}.js`;
    return await this.fetchFromUrl(fallbackUrl);
  }

  async fetchFromZipRelease(zipUrl, libName) {
    // This would require a ZIP extraction library in Node.js
    // For now, throw an error indicating ZIP support needed
    throw new Error(`ZIP release extraction not yet implemented for ${zipUrl}`);
    
    // TODO: Implement ZIP extraction
    // const zip = await this.fetchFromUrl(zipUrl);
    // const jsContent = extractJavaScriptFromZip(zip, libName);
    // return jsContent;
  }

  async fetchFromUrl(url) {
    if (typeof window !== 'undefined') {
      // Browser environment
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.text();
    } else {
      // Node.js environment
      const https = require('https');
      return new Promise((resolve, reject) => {
        https.get(url, (res) => {
          let data = '';
          res.on('data', (chunk) => data += chunk);
          res.on('end', () => {
            if (res.statusCode === 200) {
              resolve(data);
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
            }
          });
        }).on('error', reject);
      });
    }
  }

  async waitForLibraryResponse(requestId) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error('Library request timeout (30s)'));
      }, 30000);
      
      const handler = (event) => {
        if (event.data.type === 'library-response' && 
            event.data.requestId === requestId) {
          cleanup();
          resolve(event.data);
        }
      };
      
      const cleanup = () => {
        clearTimeout(timeout);
        window.removeEventListener('message', handler);
      };
      
      window.addEventListener('message', handler);
    });
  }

  async executeLibraryCode(libraryCode, libraryName) {
    try {
      // Execute in current context
      const func = new Function(libraryCode);
      func();
      
      // Verify loading succeeded - use new @rexxjs-meta pattern
      const extractedFunctionName = this.extractMetadataFunctionName(libraryCode);
      const detectionFunction = extractedFunctionName || this.getLibraryDetectionFunction(libraryName);
      
      const globalScope = typeof window !== 'undefined' ? window : global;
      if (!globalScope[detectionFunction] || typeof globalScope[detectionFunction] !== 'function') {
        console.log(`Looking for detection function: ${detectionFunction}`);
        console.log(`Available global functions:`, Object.keys(globalScope).filter(k => k.includes('META') || k.includes('MAIN')));
        throw new Error(`Library executed but detection function not found: ${detectionFunction}`);
      }
      
      // Register library functions with the interpreter
      this.registerLibraryFunctions(libraryName);
    } catch (error) {
      throw new Error(`Failed to execute library code: ${error.message}`);
    }
  }

  generateRequestId() {
    return utils.generateRequestId();
  }

  registerLibraryFunctions(libraryName, asClause = null) {

    // FIRST: Retrieve and store metadata if available
    // This must happen before getLibraryFunctionList so metadata is available for function discovery
    if (this.libraryMetadataProviders && this.libraryMetadataProviders.has(libraryName)) {
      const metadataFunctionName = this.libraryMetadataProviders.get(libraryName);

      try {
        // Call the metadata provider function to get full metadata
        const metadataFunc = this.getGlobalFunction(metadataFunctionName, libraryName);
        if (metadataFunc) {
          const metadata = metadataFunc();

          // Store metadata for later use by require system and function/operation discovery
          this.libraryMetadata = this.libraryMetadata || new Map();
          this.libraryMetadata.set(libraryName, metadata);
        }
      } catch (error) {
        throw new Error(`Metadata provider function ${metadataFunctionName} failed: ${error.message}`);
      }
    }

    // Get list of functions that should be registered for this library
    // This now has access to metadata stored above
    const libraryFunctions = this.getLibraryFunctionList(libraryName);

    for (const functionName of libraryFunctions) {
      // Get the function from global scope (with library context)
      const func = this.getGlobalFunction(functionName, libraryName);
      if (func) {
        // Apply AS clause transformation if provided
        const registeredName = this.applyAsClauseToFunction(functionName, asClause);

        // Register as external function (from REQUIRE'd library) with potentially modified name
        this.externalFunctions[registeredName] = (...args) => {
          return func(...args);
        };
      }
    }

    // Register operations from this library (if any)
    const libraryOperations = this.getLibraryOperationList(libraryName);

    for (const operationName of libraryOperations) {
      // Get the operation from global scope (with library context)
      const op = this.getGlobalFunction(operationName, libraryName);
      if (op) {
        // Apply AS clause transformation if provided
        const registeredName = this.applyAsClauseToFunction(operationName, asClause);

        // Register as operation (receives params object directly)
        this.operations[registeredName] = (params) => {
          return op(params);
        };
      }
    }
  }

  applyAsClauseToFunction(functionName, asClause) {
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

  applyAsClauseToAddressTarget(originalTargetName, asClause, metadata) {
    if (!asClause) {
      return originalTargetName; // No transformation
    }

    // Validate: ADDRESS targets cannot use regex patterns
    if (asClause.includes('(.*)')) {
      throw new Error(`Cannot use regex patterns in AS clause for ADDRESS modules (${metadata.type})`);
    }

    // For ADDRESS targets, AS clause is the exact new name
    return asClause;
  }

  getLibraryFunctionList(libraryName) {
    // Check library metadata first (from metadata provider function)
    const metadata = this.libraryMetadata && this.libraryMetadata.get(libraryName);
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
    if (this.isBuiltinLibrary(libraryName)) {
      return this.discoverBuiltinLibraryFunctions(libraryName);
    }

    // Auto-discover functions for third-party libraries
    return this.discoverLibraryFunctions(libraryName);
  }

  getLibraryOperationList(libraryName) {
    // Get operations from library metadata
    // Operations are discovered via the metadata provider function
    const metadata = this.libraryMetadata && this.libraryMetadata.get(libraryName);
    if (metadata && metadata.operations) {
      return Object.keys(metadata.operations);
    }
    return [];
  }

  isBuiltinLibrary(libraryName) {
    return utils.isBuiltinLibrary(libraryName);
  }

  discoverBuiltinLibraryFunctions(libraryName) {
    // For built-in libraries, we don't need to pre-enumerate functions
    // They will be discovered when the library is loaded
    // Return empty array - functions will be available after REQUIRE loads the library
    return [];
  }

  async loadBuiltinLibrary(libraryName) {
    // Load built-in library from local src/ directory
    try {
      const fs = require('fs');
      const path = require('path');
      
      // Construct path to built-in library file
      const libraryPath = path.join(__dirname, `${libraryName}.js`);
      
      if (!fs.existsSync(libraryPath)) {
        throw new Error(`Built-in library file not found: ${libraryPath}`);
      }
      
      const libraryCode = fs.readFileSync(libraryPath, 'utf8');
      console.log(`✓ Loaded built-in library ${libraryName} from ${libraryPath}`);
      
      return libraryCode;
      
    } catch (error) {
      throw new Error(`Failed to load built-in library ${libraryName}: ${error.message}`);
    }
  }

  discoverLibraryFunctions(libraryName) {
    // First try namespace approach (clean, modern)
    const namespaceFunctions = this.extractFunctionsFromNamespace(libraryName);
    if (namespaceFunctions.length > 0) {
      return namespaceFunctions;
    }

    // Try the computed namespace (e.g., "./tests/test-libs/discworld-science.js" -> "discworld_science")
    const libNamespace = this.getLibraryNamespace(libraryName);
    const libNamespaceFunctions = this.extractFunctionsFromNamespace(libNamespace);
    if (libNamespaceFunctions.length > 0) {
      return libNamespaceFunctions;
    }

    // For module-style libraries, check the extracted lib name namespace
    const libraryType = this.getLibraryType(libraryName);
    if (libraryType === 'module') {
      const libName = libraryName.split('/').pop();
      const moduleNamespaceFunctions = this.extractFunctionsFromNamespace(libName);
      if (moduleNamespaceFunctions.length > 0) {
        return moduleNamespaceFunctions;
      }
    }

    // Try global scope extraction (fallback for older libraries)
    const globalFunctions = this.extractGlobalFunctions(libraryName);
    if (globalFunctions.length > 0) {
      return globalFunctions;
    }

    // Final fallback: just the detection function
    const detectionFunction = this.getLibraryDetectionFunction(libraryName);
    return [detectionFunction];
  }

  getThirdPartyNamespace(libName) {
    // Use library name directly as namespace
    // "my-rexx-lib" -> "my-rexx-lib"
    return libName;
  }

  extractFunctionsFromNamespace(namespaceName) {
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

  extractGlobalFunctions(libraryName) {
    // For legacy libraries that put functions directly in global scope
    const functions = [];
    const globalScope = (typeof window !== 'undefined') ? window : global;
    
    // Get the detection function as a starting point
    const detectionFunction = this.getLibraryDetectionFunction(libraryName);
    
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

  // Dependency management utilities
  
  getDependencyInfo() {
    return libraryManagementUtils.getDependencyInfo(this.dependencyGraph);
  }

  getLoadOrder() {
    return libraryManagementUtils.getLoadOrder(this.dependencyGraph);
  }

  validateNoCycles() {
    return libraryManagementUtils.validateNoCycles(this.dependencyGraph);
  }

  // Library cache management
  clearLibraryCache(libraryName = null) {
    if (libraryName) {
      this.libraryCache.delete(libraryName);
      console.log(`✓ Cleared cache for ${libraryName}`);
    } else {
      this.libraryCache.clear();
      console.log('✓ Cleared all library cache');
    }
  }

  getCacheInfo() {
    const info = {};
    for (const [libraryName, cacheEntry] of this.libraryCache.entries()) {
      info[libraryName] = {
        loaded: cacheEntry.loaded,
        codeSize: cacheEntry.code ? cacheEntry.code.length : 0,
        timestamp: new Date(cacheEntry.timestamp).toISOString()
      };
    }
    return info;
  }

  getGlobalFunction(functionName, libraryName = null) {
    // Check the modern registry first
    if (libraryName && typeof window !== 'undefined' && window.REXX_FUNCTION_LIBS) {
      const found = window.REXX_FUNCTION_LIBS.find(lib => 
        lib.path === libraryName || 
        lib.name === libraryName ||
        lib.path.endsWith('/' + libraryName) ||
        libraryName.endsWith('/' + lib.name)
      );
      if (found && found.functions && found.functions[functionName]) {
        return found.functions[functionName];
      }
    }
    
    // Check namespaced libraries first
    if (libraryName) {
      const libraryType = this.getLibraryType(libraryName);
      let namespaceName;
      
      if (libraryType === 'builtin') {
        namespaceName = this.getLibraryNamespace(libraryName);
      } else if (libraryType === 'module' || libraryType === 'simple-third-party') {
        const libName = libraryName.split('/').pop();
        namespaceName = this.getThirdPartyNamespace(libName);
      }
      
      if (namespaceName) {
        if (typeof window !== 'undefined' && window[namespaceName]) {
          return window[namespaceName][functionName];
        } else if (typeof global !== 'undefined' && global[namespaceName]) {
          return global[namespaceName][functionName];
        }
      }
    }
    
    // Check global scope for legacy libraries
    if (typeof window !== 'undefined') {
      return window[functionName];
    } else if (typeof global !== 'undefined') {
      return global[functionName];
    }
    return undefined;
  }

  // Security and Permission Control Methods

  initializeSecurityHandlers() {
    return securityUtils.initializeSecurityHandlers.call(this);
  }

  async checkLibraryPermissions(libraryName) {
    return await securityUtils.checkLibraryPermissions.call(this, libraryName);
  }

  async checkNodeJSPermissions(libraryName, libraryType) {
    return await securityUtils.checkNodeJSPermissions.call(this, libraryName, libraryType);
  }

  async checkWebPermissions(libraryName, libraryType) {
    return await securityUtils.checkWebPermissions.call(this, libraryName, libraryType);
  }

  async checkControlBusPermissions(libraryName, libraryType) {
    return await securityUtils.checkControlBusPermissions.call(this, libraryName, libraryType);
  }

  async validateGitHubLibrary(libraryName) {
    return await securityUtils.validateGitHubLibrary.call(this, libraryName);
  }

  getBlockedRepositories() {
    return securityUtils.getBlockedRepositories.call(this);
  }

  async requestDirectorApproval(libraryName) {
    return await securityUtils.requestDirectorApproval.call(this, libraryName);
  }

  handleLibraryPermissionResponse(response) {
    return securityUtils.handleLibraryPermissionResponse.call(this, response);
  }

  getLibraryMetadata(libraryName) {
    return securityUtils.getLibraryMetadata.call(this, libraryName);
  }

  assessRiskLevel(libraryName) {
    return securityUtils.assessRiskLevel.call(this, libraryName);
  }

  setSecurityPolicy(policy) {
    return securityUtils.setSecurityPolicy.call(this, policy);
  }

  executeLibraryCodeSandboxed(libraryCode, libraryName) {
    return securityUtils.executeLibraryCodeSandboxed.call(this, libraryCode, libraryName);
  }

  createSandbox(libraryName) {
    return securityUtils.createSandbox.call(this, libraryName);
  }

  validateSandboxIntegrity(sandbox, libraryName) {
    return securityUtils.validateSandboxIntegrity.call(this, sandbox, libraryName);
  }

  // External REXX script calling support

  async executeExternalScript(scriptPath, args) {
    const fs = require('fs');
    const path = require('path');
    const { parse } = require('./parser');

    try {
      // Resolve the script path
      let resolvedPath = scriptPath;
      if (!path.isAbsolute(scriptPath)) {
        resolvedPath = path.resolve(process.cwd(), scriptPath);
      }

      // Check if file exists
      if (!fs.existsSync(resolvedPath)) {
        throw new Error(`External REXX script not found: ${resolvedPath}`);
      }

      // Read the external script
      const scriptContent = fs.readFileSync(resolvedPath, 'utf8');

      // Parse the external script
      const commands = parse(scriptContent);

      // Create a new interpreter instance for the external script
      const externalInterpreter = new RexxInterpreter(this.addressSender);

      // Copy relevant configuration from parent interpreter
      externalInterpreter.traceEnabled = this.traceEnabled;
      externalInterpreter.variables.set('__PARENT_SCRIPT__', true);

      // Pass arguments to the external script
      // Note: args are already evaluated by the caller (interpreter-parse-subroutine.js)
      externalInterpreter.argv = args;

      // Execute the external script
      const result = await externalInterpreter.run(commands);

      // Handle return values from external script
      if (result && result.type === 'RETURN') {
        return { success: true, type: 'EXTERNAL_SCRIPT_COMPLETE', returnValue: result.value };
      }

      // Return success indicator with null value
      return { success: true, type: 'EXTERNAL_SCRIPT_COMPLETE', returnValue: null };

    } catch (error) {
      throw new Error(`Error executing external REXX script '${scriptPath}': ${error.message}`);
    }
  }

  detectAndExposeEnvironment() {
    const env = {
      type: 'unknown',
      nodeVersion: null,
      isPkg: false,
      hasNodeJsRequire: false,
      hasWindow: false,
      hasDOM: false
    };

    // Detect Node.js
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
      env.type = 'nodejs';
      env.nodeVersion = process.versions.node;
      
      // Detect pkg environment
      if (typeof process.pkg !== 'undefined' || process.versions.pkg) {
        env.type = 'pkg';
        env.isPkg = true;
      }
    }
    
    // Detect browser
    else if (typeof window !== 'undefined') {
      env.type = 'browser';
      env.hasWindow = true;
      
      // Detect DOM availability
      if (typeof document !== 'undefined') {
        env.hasDOM = true;
      }
    }
    
    // Check for Node.js require() availability (not REXX REQUIRE)
    env.hasNodeJsRequire = typeof require !== 'undefined';
    
    // Expose globally for all libraries to use
    const globalScope = typeof window !== 'undefined' ? window : global;
    globalScope.REXX_ENVIRONMENT = env;
    
    // Also set as interpreter variable for REXX scripts
    this.variables.set('RUNTIME.TYPE', env.type);
    this.variables.set('RUNTIME.NODE_VERSION', env.nodeVersion || '');
    this.variables.set('RUNTIME.IS_PKG', env.isPkg ? '1' : '0');
    this.variables.set('RUNTIME.HAS_NODEJS_REQUIRE', env.hasNodeJsRequire ? '1' : '0');
    this.variables.set('RUNTIME.HAS_WINDOW', env.hasWindow ? '1' : '0');
    this.variables.set('RUNTIME.HAS_DOM', env.hasDOM ? '1' : '0');
  }

}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RexxInterpreter };
} else {
  // Browser environment - attach to window
  window.RexxInterpreter = RexxInterpreter;
}
