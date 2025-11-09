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
let callbackEvaluation;
let functionExecution;
let commandAddressUtils;
let arrayFunctionsUtils;
let exitUnlessUtils;
let libraryRequireWrappersUtils;
let libraryMetadataUtils;
let libraryDiscoveryUtils;
let libraryFetchingUtils;
let libraryRegistrationUtils;
let interpretStatementUtils;
let processEscapeSequences;

if (typeof require !== 'undefined') {
  const escapeProcessor = require('./escape-sequence-processor.js');
  processEscapeSequences = escapeProcessor.processEscapeSequences;

  const stringProcessing = require('./interpreter-string-and-expression-processing.js');
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
  callbackEvaluation = require('./interpreter-callback-evaluation.js');
  functionExecution = require('./interpreter-function-execution.js');
  commandAddressUtils = require('./interpreter-command-address.js');
  arrayFunctionsUtils = require('./interpreter-array-functions.js');
  exitUnlessUtils = require('./interpreter-exit-unless.js');
  libraryRequireWrappersUtils = require('./interpreter-library-require-wrappers.js');
  libraryMetadataUtils = require('./interpreter-library-metadata.js');
  libraryDiscoveryUtils = require('./interpreter-library-discovery.js');
  libraryFetchingUtils = require('./interpreter-library-fetching.js');
  libraryRegistrationUtils = require('./interpreter-library-registration.js');
  interpretStatementUtils = require('./interpreter-interpret-statement.js');
} else {
  // Browser environment - pull from registry and setup window globals
  const registry = window.rexxModuleRegistry;

  // Escape sequence processor
  if (window.processEscapeSequences) {
    processEscapeSequences = window.processEscapeSequences;
  }

  // String processing functions
  if (registry.has('stringProcessing')) {
    const stringProcessing = registry.get('stringProcessing');
    parseQuotedParts = stringProcessing.parseQuotedParts;
    interpolateString = stringProcessing.interpolateString;
    evaluateConcatenation = stringProcessing.evaluateConcatenation;
    
    // Set up window globals for backward compatibility
    window.parseQuotedParts = parseQuotedParts;
    window.interpolateString = interpolateString;
    window.evaluateConcatenation = evaluateConcatenation;
  }
  
  // Evaluation utilities
  if (registry.has('evaluationUtils')) {
    const evaluationUtils = registry.get('evaluationUtils');
    compareValues = evaluationUtils.compareValues;
    isTruthy = evaluationUtils.isTruthy;
    isLikelyFunctionName = evaluationUtils.isLikelyFunctionName;
    isNumericString = evaluationUtils.isNumericString;
    basicBase64Encode = evaluationUtils.basicBase64Encode;
    basicBase64Decode = evaluationUtils.basicBase64Decode;
    
    // Set up window globals for backward compatibility
    window.compareValues = compareValues;
    window.isTruthy = isTruthy;
    window.isLikelyFunctionName = isLikelyFunctionName;
    window.isNumericString = isNumericString;
    window.basicBase64Encode = basicBase64Encode;
    window.basicBase64Decode = basicBase64Decode;
  }
  
  // Execution context utilities
  if (registry.has('executionContext')) {
    const executionContext = registry.get('executionContext');
    executionContextUtils = executionContext;
    
    // Set up window globals for backward compatibility
    Object.assign(window, executionContext);
  } else {
    executionContextUtils = {
      pushExecutionContext: window.pushExecutionContext,
      popExecutionContext: window.popExecutionContext,
      getCurrentExecutionContext: window.getCurrentExecutionContext,
      getInterpretContext: window.getInterpretContext,
      getCurrentLineNumber: window.getCurrentLineNumber,
      updateCurrentContextLine: window.updateCurrentContextLine
    };
  }
  
  // Variable stack utilities
  if (registry.has('variableStack')) {
    const variableStack = registry.get('variableStack');
    variableStackUtils = variableStack;
    
    // Set up window globals for backward compatibility
    Object.assign(window, variableStack);
  } else {
    variableStackUtils = {
      resolveVariableValue: window.resolveVariableValue,
      interpolateStringWithVars: window.interpolateStringWithVars,
      getVariable: window.getVariable,
      setVariable: window.setVariable,
      stackPush: window.stackPush,
      stackPull: window.stackPull,
      stackQueue: window.stackQueue,
      stackSize: window.stackSize,
      stackPeek: window.stackPeek,
      stackClear: window.stackClear,
      executePush: window.executePush,
      executePull: window.executePull,
      executeQueue: window.executeQueue
    };
  }
  
  // Control flow utilities
  if (registry.has('controlFlow')) {
    const controlFlow = registry.get('controlFlow');
    controlFlowUtils = controlFlow;
    
    // Set up window globals for backward compatibility
    Object.assign(window, controlFlow);
  } else {
    controlFlowUtils = {
      executeIfStatement: window.executeIfStatement,
      executeDoStatement: window.executeDoStatement,
      executeRangeLoop: window.executeRangeLoop,
      executeRangeLoopWithStep: window.executeRangeLoopWithStep,
      executeWhileLoop: window.executeWhileLoop,
      executeRepeatLoop: window.executeRepeatLoop,
      executeOverLoop: window.executeOverLoop,
      executeSelectStatement: window.executeSelectStatement
    };
  }
  
  // Error handling utilities
  if (registry.has('errorHandling')) {
    const errorHandling = registry.get('errorHandling');
    errorHandlingUtils = errorHandling;
    
    // Set up window globals for backward compatibility
    Object.assign(window, errorHandling);
  } else {
    errorHandlingUtils = {
      handleError: window.handleError,
      getCommandText: window.getCommandText,
      getCurrentFunctionName: window.getCurrentFunctionName,
      jumpToLabel: window.jumpToLabel,
      discoverLabels: window.discoverLabels,
      setupErrorHandler: window.setupErrorHandler,
      shouldHandleError: window.shouldHandleError
    };
  }
  
  // Parse subroutine utilities
  if (registry.has('parseSubroutine')) {
    const parseSubroutine = registry.get('parseSubroutine');
    parseSubroutineUtils = parseSubroutine;
    
    // Set up window globals for backward compatibility
    Object.assign(window, parseSubroutine);
  } else {
    parseSubroutineUtils = {
      executeParse: window.executeParse,
      parseTemplate: window.parseTemplate,
      discoverSubroutines: window.discoverSubroutines,
      executeCall: window.executeCall,
      isExternalScriptCall: window.isExternalScriptCall
    };
  }
  
  // Trace formatting utilities
  if (registry.has('traceFormatting')) {
    const traceFormatting = registry.get('traceFormatting');
    traceFormattingUtils = traceFormatting;
    
    // Set up window globals for backward compatibility
    Object.assign(window, traceFormatting);
  } else {
    traceFormattingUtils = {
      executeTrace: window.executeTrace,
      addTraceOutput: window.addTraceOutput,
      getTraceOutput: window.getTraceOutput,
      clearTraceOutput: window.clearTraceOutput,
      formatDate: window.formatDate,
      formatTime: window.formatTime,
      formatDateTime: window.formatDateTime,
      setNumericSetting: window.setNumericSetting
    };
  }
  
  libraryUrlUtils = {
    isLocalOrNpmModule: window.isLocalOrNpmModule,
    getLibraryType: window.getLibraryType,
    getLibraryRepository: window.getLibraryRepository,
    getLibraryTag: window.getLibraryTag,
    getLibraryPath: window.getLibraryPath,
    shouldUseGitHubRelease: window.shouldUseGitHubRelease,
    resolveGitHubRawUrl: window.resolveGitHubRawUrl,
    resolveWebLibraryUrl: window.resolveWebLibraryUrl,
    getLibrarySources: window.getLibrarySources,
    shouldTryCDN: window.shouldTryCDN,
    getCDNSources: window.getCDNSources,
    getGitHubReleaseSources: window.getGitHubReleaseSources
  };
  
  // Expression value utilities
  if (registry.has('expressionValue')) {
    const expressionValue = registry.get('expressionValue');
    expressionValueUtils = expressionValue;
    
    // Set up window globals for backward compatibility
    Object.assign(window, expressionValue);
  } else {
    expressionValueUtils = {
      resolveValue: window.resolveValue,
      evaluateExpression: window.evaluateExpression,
      evaluateCondition: window.evaluateCondition
    };
  }
  
  // DOM manager utilities
  if (registry.has('domManager')) {
    const domManager = registry.get('domManager');
    domManagerUtils = domManager;
    
    // Set up window globals for backward compatibility
    Object.assign(window, domManager);
  } else {
    domManagerUtils = {
      initializeDOMManager: window.initializeDOMManager,
      executeRetryOnStale: window.executeRetryOnStale,
      isDOMAvailable: window.isDOMAvailable,
      isDOMElementManagerAvailable: window.isDOMElementManagerAvailable
    };
  }
  
  libraryManagementUtils = {
    requireWithDependencies: window.requireWithDependencies,
    isLibraryLoaded: window.isLibraryLoaded,
    getDependencyInfo: window.getDependencyInfo,
    getLoadOrder: window.getLoadOrder,
    validateNoCycles: window.validateNoCycles,
    clearLibraryCache: window.clearLibraryCache,
    getCacheInfo: window.getCacheInfo,
    validateLoadingQueue: window.validateLoadingQueue,
    updateLoadingStatus: window.updateLoadingStatus
  };
  
  utils = {
    generateRequestId: window.generateRequestId,
    isBuiltinLibrary: window.isBuiltinLibrary,
    detectEnvironment: window.detectEnvironment
  };
  
  security = {
    createMissingFunctionError: window.createMissingFunctionError,
    assessRiskLevel: window.assessRiskLevel,
    getBlockedRepositories: window.getBlockedRepositories,
    validateGitHubLibrary: window.validateGitHubLibrary
  };
  
  // Security utilities
  if (registry.has('securityUtils')) {
    securityUtils = registry.get('securityUtils');
  } else {
    // Browser environment fallback for security utils
    securityUtils = {
      initializeSecurityHandlers: function() { return undefined; },
      checkLibraryPermissions: async function() { return true; },
      checkNodeJSPermissions: async function() { return true; },
      checkWebPermissions: async function() { return true; },
      checkControlBusPermissions: async function() { return true; },
      validateGitHubLibrary: async function() { return true; },
      getBlockedRepositories: function() { return []; },
      requestDirectorApproval: async function() { return true; },
      handleLibraryPermissionResponse: function() { },
      getLibraryMetadata: function() { return {}; },
      assessRiskLevel: function() { return 'low'; },
      setSecurityPolicy: function() { },
      executeLibraryCodeSandboxed: function() { },
      createSandbox: function() { return {}; },
      validateSandboxIntegrity: function() { }
    };
  }
  
  // Require system utilities
  if (registry.has('requireSystem')) {
    requireSystem = registry.get('requireSystem');
  } else {
    // Browser environment fallback for require system
    requireSystem = {
      requireWithDependencies: window.requireWithDependencies,
      loadSingleLibrary: window.loadSingleLibrary,
      requireNodeJS: window.requireNodeJS,
      requireRemoteLibrary: window.requireRemoteLibrary,
      isLocalOrNpmModule: window.isLocalOrNpmModule,
      isRegistryStyleLibrary: window.isRegistryStyleLibrary,
      requireRegistryStyleLibrary: window.requireRegistryStyleLibrary,
      parseRegistryLibraryName: window.parseRegistryLibraryName
    };
  }
  
  // String processing utilities
  if (registry.has('stringProcessingUtils')) {
    const stringProcessingUtils = registry.get('stringProcessingUtils');
    stringUtils = stringProcessingUtils;

    // Set up window globals for backward compatibility
    Object.assign(window, stringProcessingUtils);
  } else {
    stringUtils = {
      callConvertParamsToArgs: window.callConvertParamsToArgs,
      executeBrowserStringFunction: window.executeBrowserStringFunction
    };
  }

  // Interpolation utilities
  interpolation = window.InterpolationConfig;

  // Callback evaluation utilities
  if (registry.has('callbackEvaluation')) {
    const cbEval = registry.get('callbackEvaluation');
    callbackEvaluation = cbEval;

    // Set up window globals for backward compatibility
    window.evaluateRexxCallbackExpression = cbEval.evaluateRexxCallbackExpression;
    window.evaluateRexxExpressionPart = cbEval.evaluateRexxExpressionPart;
    window.parseSimpleArguments = cbEval.parseSimpleArguments;
  }

  // Function execution utilities
  if (registry.has('functionExecution')) {
    const funcExec = registry.get('functionExecution');
    functionExecution = funcExec;

    // Set up window globals for backward compatibility
    window.executeFunctionCall = funcExec.executeFunctionCall;
    window.checkFunctionRequiresParameters = funcExec.checkFunctionRequiresParameters;
  }

  // Command address utilities
  if (registry.has('commandAddress')) {
    commandAddressUtils = registry.get('commandAddress');
  }

  // Array functions utilities
  if (registry.has('arrayFunctions')) {
    arrayFunctionsUtils = registry.get('arrayFunctions');
  }

  // Exit unless utilities
  if (registry.has('exitUnless')) {
    exitUnlessUtils = registry.get('exitUnless');
  }

  // Library require wrappers utilities
  if (registry.has('libraryRequireWrappers')) {
    libraryRequireWrappersUtils = registry.get('libraryRequireWrappers');
  }

  // Library metadata utilities
  if (registry.has('libraryMetadata')) {
    libraryMetadataUtils = registry.get('libraryMetadata');
  }

  // Library discovery utilities
  if (registry.has('libraryDiscovery')) {
    libraryDiscoveryUtils = registry.get('libraryDiscovery');
  }

  // Library fetching utilities
  if (registry.has('libraryFetching')) {
    libraryFetchingUtils = registry.get('libraryFetching');
  }

  // Library registration utilities
  if (registry.has('libraryRegistration')) {
    libraryRegistrationUtils = registry.get('libraryRegistration');
  }

  // INTERPRET statement utilities
  if (registry.has('interpretStatement')) {
    interpretStatementUtils = registry.get('interpretStatement');
  }
}

/**
 * @fileoverview Browser-compatible Rexx interpreter - no Node.js dependencies
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

// RexxError class for non-assertion errors with source context
class RexxError extends Error {
  constructor(message, type = 'REXX', sourceContext = null) {
    super(message);
    this.name = 'RexxError';
    this.type = type;
    this.sourceContext = sourceContext;
    
    // Format the message with source context if available
    if (sourceContext && sourceContext.lineNumber && sourceContext.sourceLine) {
      const filename = sourceContext.sourceFilename || 'unknown';
      const contextLine = sourceContext.sourceLine.trim();
      this.message = `Rexx ${type}: ${contextLine} (${filename}: ${sourceContext.lineNumber})\n${message}`;
    }
  }
  
  // Provide a toJSON method to prevent circular references during serialization
  toJSON() {
    const result = {
      name: this.name,
      message: this.message,
      type: this.type,
      stack: this.stack
    };
    
    // Include sourceContext but remove any circular references
    if (this.sourceContext) {
      result.sourceContext = {
        lineNumber: this.sourceContext.lineNumber,
        sourceLine: this.sourceContext.sourceLine,
        sourceFilename: this.sourceContext.sourceFilename
        // Exclude interpreter and any other potentially circular references
      };
    }
    
    return result;
  }
}

class RexxInterpreterBuilder {
  constructor(addressSender) {
    this.addressSender = addressSender;
    this.options = {
      'dom-interop': true,
      'tracing': false,
      'numeric-digits': 9,
      'numeric-fuzz': 0,
      'numeric-form': 'SCIENTIFIC'
    };
    this.outputHandler = null;
  }
  
  withoutDomInterop() {
    this.options['dom-interop'] = false;
    return this;
  }
  
  withDomInterop(enabled = true) {
    this.options['dom-interop'] = enabled;
    return this;
  }
  
  withTracing(enabled = true) {
    this.options['tracing'] = enabled;
    return this;
  }

  withTraceToOutput(enabled = true) {
    this.options['trace-to-output'] = enabled;
    return this;
  }

  withTraceMode(mode = 'NORMAL') {
    this.options['trace-mode'] = mode;
    return this;
  }

  withOutputHandler(handler) {
    this.outputHandler = handler;
    return this;
  }
  
  withNumericPrecision(digits) {
    this.options['numeric-digits'] = digits;
    return this;
  }
  
  withNumericFuzz(fuzz) {
    this.options['numeric-fuzz'] = fuzz;
    return this;
  }
  
  withNumericForm(form) {
    this.options['numeric-form'] = form;
    return this;
  }
  
  build() {
    return new RexxInterpreter(this.addressSender, this.options, this.outputHandler);
  }
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
    
    // Bind thin wrapper method for extracted builtin functions
    const builtinFunctionsModule = require('./interpreter-builtin-functions');
    this.initializeBuiltInFunctions = builtinFunctionsModule.initializeBuiltInFunctions.bind(this);
    
    this.builtInFunctions = this.initializeBuiltInFunctions();

    // Register DOM operations for unified ELEMENT() API
    try {
      if (typeof require !== 'undefined') {
        const domFunctionsModule = require('./dom-functions');
        const domOperations = domFunctionsModule.operations || {};
        for (const [operationName, operationFunc] of Object.entries(domOperations)) {
          // Bind the operation to this interpreter context so 'this' is available
          this.operations[operationName] = operationFunc.bind(this);
        }
      }
    } catch (e) {
      // If DOM operations can't be loaded, continue without them (they may be loaded later)
    }

    // Collect function metadata from all function modules for namedParameters support
    this.functionMetadata = {};
    try {
      if (typeof require !== 'undefined') {
        const functionModules = [
          require('./dom-functions'),
          require('./string-functions'),
          require('./math-functions'),
          require('./array-functions'),
          require('./json-functions'),
          require('./date-time-functions'),
          require('./url-functions'),
          require('./regex-functions'),
          require('./validation-functions'),
          require('./file-functions'),
          require('./http-functions'),
          require('./statistics-functions'),
          require('./logic-functions'),
          require('./cryptography-functions'),
          require('./data-functions'),
          require('./probability-functions'),
          require('./random-functions'),
          require('./interpolation-functions')
        ];
        for (const mod of functionModules) {
          if (mod && mod.functionMetadata) {
            Object.assign(this.functionMetadata, mod.functionMetadata);
          }
        }
      }
    } catch (e) {
      // Metadata collection is optional - don't fail if modules can't be loaded
    }

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
    this.traceMode = this.options && this.options['trace-mode'] ? this.options['trace-mode'] : 'OFF'; // OFF, A, R, I, O, NORMAL
    this.traceOutput = []; // Store trace output
    
    // DOM Element Manager for stale element handling
    this.domManager = null; // Will be initialized when DOM functions are used
    
    // RETRY_ON_STALE state
    this.retryOnStaleActive = false;

    // Create thin wrapper methods for extracted error handling functions
    this.handleError = async (error, currentIndex) => {
      return await errorHandlingUtils.handleError(
        error,
        currentIndex,
        this.errorHandlers,
        this.currentCommands,
        this.variables,
        this, // Pass interpreter as context
        this.jumpToLabel.bind(this)
      );
    };

    this.createMissingFunctionError = (method) => {
      return errorHandlingUtils.createMissingFunctionError(method);
    };

    this.createErrorContext = (error, lineNumber, sourceLine, sourceFilename, variables) => {
      return errorHandlingUtils.createErrorContext(error, lineNumber, sourceLine, sourceFilename, variables);
    };

    this.captureErrorState = () => {
      return errorHandlingUtils.captureErrorState(this);
    };

    this.getCommandText = (command) => {
      return errorHandlingUtils.getCommandText(command);
    };

    this.getCurrentFunctionName = (command) => {
      return errorHandlingUtils.getCurrentFunctionName(command);
    };

    this.discoverLabels = (commands) => {
      return errorHandlingUtils.discoverLabels(commands, this.labels);
    };

    this.jumpToLabel = async (labelName) => {
      return await errorHandlingUtils.jumpToLabel(
        labelName,
        this.labels,
        this.currentCommands,
        this.executeCommand.bind(this),
        this.executeCommands.bind(this)
      );
    };

    // Bind thin wrapper methods for extracted address handling functions
    const addressHandlingModule = require('./interpreter-address-handling');
    this.registerAddressTarget = addressHandlingModule.registerAddressTarget.bind(this);
    this.executeQuotedString = addressHandlingModule.executeQuotedString.bind(this);
    this.executeHeredocString = addressHandlingModule.executeHeredocString.bind(this);
    
    // Source line tracking for error reporting
    this.sourceLines = []; // Store original source lines
    this.currentLineNumber = null; // Current executing line number (for backward compatibility)
    this.retryOnStaleTimeout = 10000;
    this.retryOnStalePreserved = new Map();
    
    // Execution context stack for proper nested execution tracking
    this.executionStack = [];

    // Scope registration for web environments (DOM element -> scope mapping)
    // When a RexxInterpreter is created, it can traverse parent DOM for 'RexxScript' class
    // to determine where to register its functions (window by default, or specific DOM element)
    this.scopeElement = this.findScopeElement(optionsOrHandler && optionsOrHandler.scopeElement);
    this.scopeRegistry = this.setupScopeRegistry();
  }

  /**
   * Find the DOM element where this interpreter's functions should be registered
   * Traverses parent DOM tree looking for 'RexxScript' class
   * Falls back to window if not in web environment or class not found
   */
  findScopeElement(explicitScopeElement) {
    // If scope explicitly provided in options, use that
    if (explicitScopeElement) {
      return explicitScopeElement;
    }

    // Only in web environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return null;
    }

    // Try to find closest element with 'RexxScript' class
    try {
      // If we're in an iframe, check the iframe element
      if (window.frameElement) {
        let element = window.frameElement;
        while (element) {
          if (element.classList && element.classList.contains('RexxScript')) {
            return element;
          }
          element = element.parentElement;
        }
      }

      // Check document root
      const root = document.documentElement;
      if (root && root.classList && root.classList.contains('RexxScript')) {
        return root;
      }
    } catch (e) {
      // Cross-origin or other access issues - fallback to window
    }

    return null; // Will default to window
  }

  /**
   * Setup scope registry for registering functions
   * Returns object with functions that register to either window or specific DOM element
   */
  setupScopeRegistry() {
    if (typeof window === 'undefined') {
      return null;
    }

    const self = this;
    const targetScope = this.scopeElement || window;

    return {
      // Register a function to the scope (either DOM element or window)
      registerFunction: function(name, func) {
        if (self.scopeElement) {
          // Store in DOM element's dataset
          if (!self.scopeElement.__rexxFunctions) {
            self.scopeElement.__rexxFunctions = {};
          }
          self.scopeElement.__rexxFunctions[name] = func;
        } else {
          // Store in window (legacy behavior)
          window[name] = func;
        }
      },

      // Get a function from the scope
      getFunction: function(name) {
        if (self.scopeElement && self.scopeElement.__rexxFunctions && self.scopeElement.__rexxFunctions[name]) {
          return self.scopeElement.__rexxFunctions[name];
        }
        return window[name] || null;
      },

      // Check if function exists
      hasFunction: function(name) {
        if (self.scopeElement && self.scopeElement.__rexxFunctions && self.scopeElement.__rexxFunctions[name]) {
          return true;
        }
        return typeof window[name] !== 'undefined';
      },

      // Register metadata
      registerMetadata: function(name, metadata) {
        if (self.scopeElement) {
          if (!self.scopeElement.__rexxMetadata) {
            self.scopeElement.__rexxMetadata = {};
          }
          self.scopeElement.__rexxMetadata[name] = metadata;
        } else {
          window[name] = metadata;
        }
      },

      // Get metadata
      getMetadata: function(name) {
        if (self.scopeElement && self.scopeElement.__rexxMetadata && self.scopeElement.__rexxMetadata[name]) {
          return self.scopeElement.__rexxMetadata[name];
        }
        return window[name] || null;
      }
    };
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

  // registerAddressTarget moved to interpreter-address-handling.js and bound in constructor
  
  getInterpretContext() {
    return executionContextUtils.getInterpretContext(this.executionStack);
  }
  
  // Static builder factory method
  static builder(rpcClient) {
    return new RexxInterpreterBuilder(rpcClient);
  }

  // Create interpreter-aware array functions that support pure-REXX callbacks
  createInterpreterAwareArrayFunctions(originalArrayFunctions) {
    return arrayFunctionsUtils.createInterpreterAwareArrayFunctions(originalArrayFunctions, this);
  }
  
  wrapDomFunctions(domFunctions) {
    const wrapped = {};
    for (const [name, func] of Object.entries(domFunctions)) {
      wrapped[name] = (...args) => {
        // Call the DOM function with the interpreter as context
        return func.call(this, ...args);
      };
  // Removed: initializeBuiltInFunctions - now bound to interpreter-builtin-functions module in constructor
    };

    return builtIns;
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
    return variableStackUtils.getVariable(name, this.variables, this.variableResolver);
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
      return await this.executeCommands(commands);
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

  /**
   * Run a REXX script stored in a script element by its ID
   * @param {string} scriptElementId - The ID of the script element containing REXX code
   * @returns {Promise} - Promise that resolves when script execution completes
   */
  async runScriptInId(scriptElementId) {
    if (typeof document === 'undefined') {
      throw new Error('runScriptInId() is only available in browser environments');
    }
    
    const scriptElement = document.getElementById(scriptElementId);
    if (!scriptElement) {
      throw new Error(`Script element with ID '${scriptElementId}' not found`);
    }
    
    const scriptText = scriptElement.textContent.trim();
    if (!scriptText) {
      throw new Error(`Script element '${scriptElementId}' contains no text content`);
    }
    
    // Parse and execute the REXX script
    const commands = parse(scriptText);
    return await this.run(commands, scriptText, `script#${scriptElementId}`);
  }

  // Removed: discoverLabels - now bound to errorHandlingUtils in constructor

  async executeCommands(commands, startIndex = 0) {
    let lastProcessedLine = 0; // Track the last processed source line number
    
    for (let i = startIndex; i < commands.length; i++) {
      const command = commands[i];
      const prevLine = this.currentLineNumber;
      
      
      // Track current line number for error reporting and push execution context
      if (command && command.lineNumber) {
        lastProcessedLine = command.lineNumber;
        
        // Update execution context if line number changes
        const currentCtx = this.getCurrentExecutionContext();
        if (!currentCtx || currentCtx.lineNumber !== command.lineNumber) {
          const sourceLine = this.sourceLines && command.lineNumber ? 
            this.sourceLines[command.lineNumber - 1] || '' : '';
          
          // Don't push a new context if we're just updating the same main execution
          if (!currentCtx || currentCtx.type === 'main') {
            if (currentCtx && currentCtx.type === 'main') {
              // Update existing main context
              currentCtx.lineNumber = command.lineNumber;
              currentCtx.sourceLine = sourceLine;
              this.currentLineNumber = command.lineNumber;
            } else {
              // Push new main context
              this.pushExecutionContext('main', command.lineNumber, sourceLine, this.sourceFilename || '');
            }
          } else {
            // We're in a subroutine or other context - still update currentLineNumber for error reporting
            this.currentLineNumber = command.lineNumber;
          }
        }
      }
      
      if (command.type === 'LABEL' && this.callStack.length === 0) {
        
        // Skip subroutine bodies during main execution  
        // Skip to the end of this subroutine
        i++; // Skip the label
        while (i < commands.length) {
          const cmd = commands[i];
          if (cmd.type === 'LABEL') {
            i--; // Back up one so the outer loop will process this label
            break;
          }
          if (cmd.type === 'RETURN') {
            break; // Include the RETURN but don't execute it
          }
          i++;
        }
        continue;
      }
      
      try {
        // Ensure currentLineNumber is available for downstream traces (ADDRESS, CALL, etc.)
        if (command && command.lineNumber) {
          this.currentLineNumber = command.lineNumber;
        }
        const result = await this.executeCommand(command);
        if (result && result.jump) {
          // Handle SIGNAL jumps
          return result;
        }
        if (result && result.terminated) {
          // Handle EXIT (always terminates) or RETURN (only terminates if not in subroutine)
          if (result.type === 'EXIT' || this.callStack.length === 0) {
            return result;
          }
          // If we're in a subroutine, RETURN should bubble up to executeCall
          if (result.type === 'RETURN') {
            return result;
          }
        }
        if (result && result.skipCommands) {
          // Handle LINES command skipping - skip the next N commands
          i += result.skipCommands;
        }
      } catch (error) {
        const handled = await this.handleError(error, i);
        if (handled && handled.jump) {
          return handled;
        } else if (!handled) {
          // Check if this is a DOM/REXX-recognizable error and we have error handlers configured
          if (errorHandlingUtils.shouldHandleError(error, this.errorHandlers)) {
            // This is a DOM/REXX error and we have error handlers - handle gracefully
            // The error variables (RC, ERRORTEXT, SIGL) have already been set by handleError
            // Include line information in error message
            const currentCommand = this.currentCommands[i];
            const lineInfo = currentCommand && currentCommand.lineNumber 
              ? `Error at line ${currentCommand.lineNumber}: ${this.getCommandText(currentCommand)}`
              : `Error in command ${i + 1}`;
            console.log(`${lineInfo}\n${error.message}`);
            return { 
              terminated: true, 
              error: true, 
              exitCode: this.variables.get('RC') || 1,
              message: this.variables.get('ERRORTEXT') || error.message
            };
          } else {
            // Add line information to error message before re-throwing
            const currentCommand = this.currentCommands[i];
            if (currentCommand && currentCommand.lineNumber) {
              const lineInfo = `Error at line ${currentCommand.lineNumber}: ${this.getCommandText(currentCommand)}`;
              error.message = `${lineInfo}\n${error.message}`;
            }
            // Mark error as unhandled by adding a flag, then re-throw
            error.rexxUnhandled = true;
            throw error;
          }
        }
        // If handled but no jump, continue execution
      } finally {
        // Restore previous currentLineNumber
        this.currentLineNumber = prevLine || null;
      }
    }
    
    
    return null;
  }


  // Browser-compatible string functions
  executeBrowserStringFunction(functionName, args) {
    return stringUtils.executeBrowserStringFunction(functionName, args);
  }

  async executeCommand(command) {
    // Add trace output for instruction execution, except for CALL where we emit
    // a canonical header separately with arg count.
    if (command.type !== 'CALL') {
      let traceMessage;
      if (command.lineNumber && this.sourceLines && this.sourceLines[command.lineNumber - 1]) {
        // Prefer originalLine if available to preserve quoting, else source text
        traceMessage = (command.originalLine || this.sourceLines[command.lineNumber - 1]).trim();
      } else {
        // Fallback: reconstruct faithfully for certain commands
        if (command.type === 'ADDRESS_WITH_STRING') {
          traceMessage = this.reconstructCommandAsLine(command).trim();
        } else {
          traceMessage = command.type;
        }
      }
      // Ensure a line number is present for forwarding. Prefer command.lineNumber,
      // otherwise fall back to currentLineNumber for ADDRESS_WITH_STRING.
      let ln = command.lineNumber;
      if ((!ln || ln === null) && command.type === 'ADDRESS_WITH_STRING') {
        ln = this.currentLineNumber || null;
      }
      this.addTraceOutput(traceMessage, 'instruction', ln);
    }
    
    switch (command.type) {
        case 'ADDRESS':
          commandAddressUtils.executeAddressCommand(command, this);
          break;

        case 'ADDRESS_REMOTE':
          commandAddressUtils.executeAddressRemoteCommand(command, this);
          break;

        case 'ADDRESS_WITH_STRING':
          await commandAddressUtils.executeAddressWithStringCommand(command, this);
          break;

        // ADDRESS_WITH_MATCHING case removed - use HEREDOC instead


        // ADDRESS_WITH_LINES case removed - use HEREDOC instead

        case 'SIGNAL':
          const signalResult = commandAddressUtils.executeSignalCommand(command, this, errorHandlingUtils);
          if (signalResult) return signalResult;
          break;

        case 'SIGNAL_JUMP':
          return commandAddressUtils.executeSignalJumpCommand(command, this);
          
        case 'LABEL':
          // Execute any command on the same line as the label
          if (command.statement) {
            return await this.executeCommand(command.statement);
          }
          break;
          
        case 'NUMERIC':
          // Evaluate the value expression to handle variables
          let evaluatedValue;
          if (typeof command.value === 'string') {
            // Handle simple string literals and variable references
            evaluatedValue = this.variables.get(command.value) || command.value;
          } else {
            evaluatedValue = this.evaluateExpression(command.value);
          }
          traceFormattingUtils.setNumericSetting(command.setting, evaluatedValue, this.numericSettings);
          break;
          
        case 'PARSE':
          await parseSubroutineUtils.executeParse(command, this.variables, this.evaluateExpression.bind(this), parseSubroutineUtils.parseTemplate, this.argv);
          break;
          
        case 'PUSH':
          this.executePush(command);
          break;
          
        case 'PULL':
          this.executePull(command);
          break;
          
        case 'QUEUE':
          this.executeQueue(command);
          break;
          
        case 'CALL':
          // Emit a single canonical CALL header with explicit arg count
          const argCount = Array.isArray(command.arguments) ? command.arguments.length : 0;
          const callNameForDisplay = command.displayName ? command.displayName : command.subroutine;
          this.addTraceOutput(`CALL ${callNameForDisplay} (${argCount} args)`, 'call', command.lineNumber);
          const callResult = await parseSubroutineUtils.executeCall(
            command,
            this.variables,
            this.subroutines,
            this.callStack,
            this.evaluateExpression.bind(this),
            this.pushExecutionContext.bind(this),
            this.popExecutionContext.bind(this),
            this.getCurrentExecutionContext.bind(this),
            this.executeCommands.bind(this),
            parseSubroutineUtils.isExternalScriptCall,
            this.executeExternalScript.bind(this),
            this.sourceFilename,
            this.returnValue,
            this.builtInFunctions,
            callConvertParamsToArgs,
            this.argv  // Pass argv array reference for efficient argument storage
          );
          if (callResult && callResult.terminated) {
            return callResult;
          }
          // Set RESULT variable if subroutine returned a value
          if (callResult && callResult.returnValue !== undefined) {
            this.variables.set('RESULT', callResult.returnValue);
          }
          break;
          
        case 'RETURN':
          return await this.executeReturn(command);
          
        case 'TRACE':
          this.traceMode = traceFormattingUtils.executeTrace(command, this.traceOutput, this.addTraceOutput.bind(this));
          break;
        
        case 'FUNCTION_CALL':
          await this.executeFunctionCall(command);
          break;

        case 'ASSIGNMENT':
          if (command.command) {
            // Check if it's a CALL command assignment
            if (command.command.type === 'CALL') {
              // Execute the CALL and get its return value
              const result = await parseSubroutineUtils.executeCall(
                command.command,
                this.variables,
                this.subroutines,
                this.callStack,
                this.evaluateExpression.bind(this),
                this.pushExecutionContext.bind(this),
                this.popExecutionContext.bind(this),
                this.getCurrentExecutionContext.bind(this),
                this.executeCommands.bind(this),
                parseSubroutineUtils.isExternalScriptCall,
                this.executeExternalScript.bind(this),
                this.sourceFilename,
                this.returnValue,
                this.builtInFunctions,
                callConvertParamsToArgs,
                this.argv  // Pass argv array reference for efficient argument storage
              );
              const variableName = await this.interpolateString(command.variable);
              
              // If the result is a return object, extract the value
              let value;
              if (result && result.type === 'RETURN' && result.value !== undefined) {
                value = result.value;
              } else if (result && typeof result === 'object' && result.success) {
                // Handle successful external script calls
                value = result.returnValue || null;
              } else {
                value = result;
              }
              
              this.variables.set(variableName, value);
              // Trace already shown at executeCommand level with full source line
            } else {
              // Function call assignment: LET var = functionCall
              const result = await this.executeFunctionCall(command.command);
              const variableName = await this.interpolateString(command.variable);
              this.variables.set(variableName, result);
              // Trace already shown at executeCommand level with full source line
            }
          } else if (command.expression) {
            // Expression assignment: LET var = expr
            let result;
            
            // Special case: RESULT() with no parameters should be treated as RESULT variable reference
            if (command.expression.type === 'FUNCTION_CALL' && 
                command.expression.command === 'RESULT' && 
                Object.keys(command.expression.params || {}).length === 0) {
              result = this.variables.get('RESULT');
            } 
            // Special case: ADDRESS method call - check if we're in ADDRESS context and expression is a simple variable
            else if (command.expression.type === 'VARIABLE' && 
                     this.address && this.address !== 'default') {
              const addressTarget = this.addressTargets.get(this.address);
              
              // If we have an ADDRESS target and the variable name matches a method
              if (addressTarget && addressTarget.handler &&
                  addressTarget.methods && addressTarget.methods.includes(command.expression.name.toLowerCase())) {
                
                try {
                  // Execute as ADDRESS method call with empty params (parameterless call)
                  const params = { params: '' };
                  const context = Object.fromEntries(this.variables);
                  const sourceContext = this.currentLineNumber ? {
                    lineNumber: this.currentLineNumber,
                    sourceLine: this.sourceLines[this.currentLineNumber - 1] || '',
                    sourceFilename: this.sourceFilename || '',
                    interpreter: this,
                    interpolation: interpolation
                  } : null;
                  
                  // Call the ADDRESS handler directly
                  result = await addressTarget.handler(command.expression.name, params, sourceContext);
                  
                  // Update standard REXX variables like RC
                  if (result && typeof result === 'object') {
                    this.variables.set('RC', result.success ? 0 : (result.errorCode || 1));
                    if (!result.success && result.errorMessage) {
                      this.variables.set('ERRORTEXT', result.errorMessage);
                    }
                  }
                } catch (error) {
                  // If ADDRESS method call fails, fall back to normal expression evaluation
                  result = await this.evaluateExpression(command.expression);
                }
              } else {
                // Not an ADDRESS method or no ADDRESS target, evaluate normally
                result = await this.evaluateExpression(command.expression);
              }
            } else {
              result = await this.evaluateExpression(command.expression);
            }
            
            const variableName = await this.interpolateString(command.variable);

            // Handle compound variable assignment (e.g., RESULT.message = value)
            if (variableName.includes('.')) {
              const parts = variableName.split('.');
              const rootVarName = parts[0];

              // Get or create root object
              let rootObject = this.variables.get(rootVarName);
              if (!rootObject || typeof rootObject !== 'object' || Array.isArray(rootObject)) {
                rootObject = {};
                this.variables.set(rootVarName, rootObject);
              }

              // Navigate to the parent object and set the final property
              let current = rootObject;
              for (let i = 1; i < parts.length - 1; i++) {
                if (!current[parts[i]] || typeof current[parts[i]] !== 'object' || Array.isArray(current[parts[i]])) {
                  current[parts[i]] = {};
                }
                current = current[parts[i]];
              }
              current[parts[parts.length - 1]] = result;
            } else {
              this.variables.set(variableName, result);
            }
            // Trace already shown at executeCommand level with full source line
          } else if (command.value !== undefined) {
            // Simple value assignment: LET var = value (resolve value in case it's a variable reference)
            let resolvedValue;
            
            // For quoted strings, don't resolve as expressions or function calls - keep as literal
            if (command.isQuotedString) {
              // Process escape sequences in quoted strings
              resolvedValue = processEscapeSequences ? processEscapeSequences(command.value) : command.value;
            } else {
              // Check if we're in an ADDRESS context and the value could be an ADDRESS method call
              if (this.address && this.address !== 'default' && typeof command.value === 'string') {
                const addressTarget = this.addressTargets.get(this.address);
                
                // If we have an ADDRESS target and the value looks like a method name
                if (addressTarget && addressTarget.handler && 
                    addressTarget.methods && addressTarget.methods.includes(command.value.toLowerCase())) {
                  
                  try {
                    // Execute as ADDRESS method call with empty params (parameterless call)
                    const params = { params: '' };
                    const context = Object.fromEntries(this.variables);
                    const sourceContext = this.currentLineNumber ? {
                      lineNumber: this.currentLineNumber,
                      sourceLine: this.sourceLines[this.currentLineNumber - 1] || '',
                      sourceFilename: this.sourceFilename || '',
                      interpreter: this,
                    interpolation: interpolation
                    } : null;
                    
                    // Call the ADDRESS handler directly
                    resolvedValue = await addressTarget.handler(command.value, params, sourceContext);
                    
                    // Update standard REXX variables like RC
                    if (resolvedValue && typeof resolvedValue === 'object') {
                      this.variables.set('RC', resolvedValue.success ? 0 : (resolvedValue.errorCode || 1));
                      if (!resolvedValue.success && resolvedValue.errorMessage) {
                        this.variables.set('ERRORTEXT', resolvedValue.errorMessage);
                      }
                    }
                  } catch (error) {
                    // If ADDRESS method call fails, fall back to normal variable resolution
                    resolvedValue = await this.resolveValue(command.value);
                  }
                } else {
                  // Not an ADDRESS method, resolve normally
                  resolvedValue = await this.resolveValue(command.value);
                }
              } else {
                // Not in ADDRESS context, resolve normally
                resolvedValue = await this.resolveValue(command.value);
              }
            }
            
            // Handle JSON parsing for object/array literals in LET assignments
            // Only parse JSON for unquoted values (not originally quoted strings)
            if (typeof resolvedValue === 'string' && !command.isQuotedString) {
              const trimmed = resolvedValue.trim();
              if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
                  (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
                try {
                  resolvedValue = JSON.parse(trimmed);
                } catch (e) {
                  // If JSON parsing fails, keep as string
                }
              }
            }
            
            const variableName = await this.interpolateString(command.variable);

            // Handle compound variable assignment (e.g., RESULT.message = value)
            if (variableName.includes('.')) {
              const parts = variableName.split('.');
              const rootVarName = parts[0];

              // Get or create root object
              let rootObject = this.variables.get(rootVarName);
              if (!rootObject || typeof rootObject !== 'object' || Array.isArray(rootObject)) {
                rootObject = {};
                this.variables.set(rootVarName, rootObject);
              }

              // Navigate to the parent object and set the final property
              let current = rootObject;
              for (let i = 1; i < parts.length - 1; i++) {
                if (!current[parts[i]] || typeof current[parts[i]] !== 'object' || Array.isArray(current[parts[i]])) {
                  current[parts[i]] = {};
                }
                current = current[parts[i]];
              }
              current[parts[parts.length - 1]] = resolvedValue;
            } else {
              this.variables.set(variableName, resolvedValue);
            }
            // Trace already shown at executeCommand level with full source line
          }
          break;
        
        case 'IF':
          const ifResult = await controlFlowUtils.executeIfStatement(command, this.evaluateCondition.bind(this), this.run.bind(this));
          if (ifResult && ifResult.terminated) {
            if (ifResult.type === 'RETURN') {
              // RETURN inside IF should bubble up to caller
              return ifResult;
            } else {
              // EXIT inside IF should be handled by throwing error
              const exitError = new Error(`Script terminated with EXIT ${ifResult.exitCode}`);
              exitError.isExit = true;
              exitError.exitCode = ifResult.exitCode;
              throw exitError;
            }
          }
          break;
        
        case 'DO':
          const doResult = await controlFlowUtils.executeDoStatement(command, this.resolveValue.bind(this), this.evaluateCondition.bind(this), this.run.bind(this), this.variables, {
            RexxError,
            currentLineNumber: this.currentLineNumber,
            sourceLines: this.sourceLines,
            sourceFilename: this.sourceFilename,
            interpreter: this,
                    interpolation: interpolation
          });
          if (doResult && doResult.terminated) {
            if (doResult.type === 'RETURN') {
              // RETURN inside DO should bubble up to caller
              return doResult;
            } else {
              // EXIT inside DO should be handled by throwing error
              const exitError = new Error(`Script terminated with EXIT ${doResult.exitCode}`);
              exitError.isExit = true;
              exitError.exitCode = doResult.exitCode;
              throw exitError;
            }
          }
          break;
        
        case 'SELECT':
          const selectResult = await controlFlowUtils.executeSelectStatement.call(this, command, this.evaluateCondition.bind(this), this.run.bind(this));
          if (selectResult && selectResult.terminated) {
            if (selectResult.type === 'RETURN') {
              // RETURN inside SELECT should bubble up to caller
              return selectResult;
            } else {
              // EXIT inside SELECT should be handled by throwing error
              const exitError = new Error(`Script terminated with EXIT ${selectResult.exitCode}`);
              exitError.isExit = true;
              exitError.exitCode = selectResult.exitCode;
              throw exitError;
            }
          }
          break;
        
        case 'EXIT':
          await this.executeExitStatement(command);
          break;

        case 'EXIT_UNLESS':
          await this.executeExitUnlessStatement(command);
          break;

        case 'SAY':
          await this.executeSayStatement(command);
          break;
        
        case 'INTERPRET_STATEMENT':
          await this.executeInterpretStatement(command);
          break;
          
        case 'NO_INTERPRET':
          this.interpretBlocked = true;
          break;
          
        case 'RETRY_ON_STALE':
          return await this.executeRetryOnStale(command);
          
        case 'QUOTED_STRING':
          await this.executeQuotedString(command);
          break;
          
        case 'HEREDOC_STRING':
          // If parser associated an address target, set it for this heredoc execution only
          if (command.addressTarget) {
            this.address = command.addressTarget.toLowerCase();
          }
          await this.executeHeredocString(command);
          break;

        default:
          break;
    }
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
      case 'ADDRESS_WITH_STRING':
        if (command.target && command.commandString !== undefined) {
          return `ADDRESS ${command.target} "${command.commandString}"`;
        }
        break;
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
    // Wrapper function that delegates to the extracted function execution module
    const context = {
      resolveValueFn: this.resolveValue.bind(this),
      callConvertParamsToArgsFn: callConvertParamsToArgs,
      checkFunctionRequiresParametersFn: (method) => this.checkFunctionRequiresParameters(method),
      createMissingFunctionErrorFn: this.createMissingFunctionError.bind(this),
      executeBrowserStringFunctionFn: this.executeBrowserStringFunction.bind(this),
      builtInFunctions: this.builtInFunctions,
      operations: this.operations,
      externalFunctions: this.externalFunctions,
      addressTargets: this.addressTargets,
      address: this.address,
      variables: this.variables,
      addressSender: this.addressSender,
      currentLineNumber: this.currentLineNumber,
      sourceLines: this.sourceLines,
      sourceFilename: this.sourceFilename,
      interpolation: interpolation,
      RexxError: RexxError,
      interpreterInstance: this,
      functionMetadata: this.functionMetadata || {}
    };
    return await functionExecution.executeFunctionCall(funcCall, context);
  }

  checkFunctionRequiresParameters(method) {
    // Wrapper function that delegates to the extracted function execution module
    const context = {
      builtInFunctions: this.builtInFunctions,
      operations: this.operations
    };
    return functionExecution.checkFunctionRequiresParameters(method, context);
  }

  // Removed: createMissingFunctionError - now bound to errorHandlingUtils in constructor

  async executeIfStatement(ifCommand) {
    return await controlFlowUtils.executeIfStatement(ifCommand, this.evaluateCondition.bind(this), this.run.bind(this));
  }

  async executeDoStatement(doCommand) {
    return await controlFlowUtils.executeDoStatement(doCommand, this.resolveValue.bind(this), this.evaluateCondition.bind(this), this.run.bind(this), this.variables, {
      RexxError,
      currentLineNumber: this.currentLineNumber,
      sourceLines: this.sourceLines,
      sourceFilename: this.sourceFilename,
      interpreter: this,
                    interpolation: interpolation
    });
  }

  async executeRangeLoop(loopSpec, bodyCommands) {
    return await controlFlowUtils.executeRangeLoop(loopSpec, bodyCommands, this.resolveValue.bind(this), this.run.bind(this), this.variables);
  }

  async executeRangeLoopWithStep(loopSpec, bodyCommands) {
    return await controlFlowUtils.executeRangeLoopWithStep(loopSpec, bodyCommands, this.resolveValue.bind(this), this.run.bind(this), this.variables);
  }
  
  // Legacy implementation preserved for reference
  async executeRangeLoopWithStepLegacy(loopSpec, bodyCommands) {
    const start = await this.resolveValue(loopSpec.start);
    const end = await this.resolveValue(loopSpec.end);
    const step = await this.resolveValue(loopSpec.step);
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
    const originalValue = this.variables.get(variable);
    
    try {
      if (stepNum > 0) {
        for (let i = startNum; i <= endNum; i += stepNum) {
          this.variables.set(variable, i);
          await this.run(bodyCommands);
        }
      } else {
        for (let i = startNum; i >= endNum; i += stepNum) {
          this.variables.set(variable, i);
          await this.run(bodyCommands);
        }
      }
    } finally {
      // In Rexx, DO loop variables persist after the loop completes
      // Only restore the original value if one existed before the loop
      if (originalValue !== undefined) {
        this.variables.set(variable, originalValue);
      }
      // If no original value existed, keep the loop variable with its final value
    }
  }

  async executeWhileLoop(loopSpec, bodyCommands) {
    return await controlFlowUtils.executeWhileLoop(loopSpec, bodyCommands, this.evaluateCondition.bind(this), this.run.bind(this));
  }
  
  // Legacy implementation preserved for reference
  async executeWhileLoopLegacy(loopSpec, bodyCommands) {
    const maxIterations = 10000; // Safety limit
    let iterations = 0;
    
    while (await this.evaluateCondition(loopSpec.condition)) {
      if (iterations++ > maxIterations) {
        throw new Error('DO WHILE loop exceeded maximum iterations (safety limit)');
      }
      
      await this.run(bodyCommands);
    }
  }

  async executeRepeatLoop(loopSpec, bodyCommands) {
    return await controlFlowUtils.executeRepeatLoop(loopSpec, bodyCommands, this.run.bind(this));
  }
  
  // Legacy implementation preserved for reference
  async executeRepeatLoopLegacy(loopSpec, bodyCommands) {
    const count = loopSpec.count;
    
    if (count < 0) {
      throw new Error('DO repeat count cannot be negative');
    }
    
    for (let i = 0; i < count; i++) {
      await this.run(bodyCommands);
    }
  }

  async executeOverLoop(loopSpec, bodyCommands) {
    return await controlFlowUtils.executeOverLoop(loopSpec, bodyCommands, this.resolveValue.bind(this), this.run.bind(this), this.variables);
  }
  
  // Legacy implementation preserved for reference
  async executeOverLoopLegacy(loopSpec, bodyCommands) {
    const variable = loopSpec.variable;
    const arrayValue = await this.resolveValue(loopSpec.array);
    
    // Handle null or undefined arrays
    if (arrayValue == null) {
      throw new Error('DO OVER: Array cannot be null or undefined');
    }
    
    // Handle strings (convert to character array)
    if (typeof arrayValue === 'string') {
      const chars = arrayValue.split('');
      
      // Store original variable value if it exists
      const originalValue = this.variables.get(variable);
      
      try {
        for (const char of chars) {
          this.variables.set(variable, char);
          await this.run(bodyCommands);
        }
      } finally {
        // Restore original variable value or remove if it didn't exist
        if (originalValue !== undefined) {
          this.variables.set(variable, originalValue);
        } else {
          this.variables.delete(variable);
        }
      }
      return;
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
    const originalValue = this.variables.get(variable);
    
    try {
      for (const item of itemsToIterate) {
        this.variables.set(variable, item);
        await this.run(bodyCommands);
      }
    } finally {
      // In REXX, loop variables typically persist after the loop
      // But we'll restore the original value if one existed before
      if (originalValue !== undefined) {
        this.variables.set(variable, originalValue);
      }
      // If no original value existed, keep the final loop value
    }
  }

  async executeSelectStatement(selectCommand) {
    return await controlFlowUtils.executeSelectStatement(selectCommand, this.evaluateCondition.bind(this), this.run.bind(this));
  }

  async executeSayStatement(sayCommand) {
    const expression = sayCommand.expression;
    
    // Check if the expression contains concatenation operators (||)
    if (expression.includes('||')) {
      // Handle as a concatenation expression
      const result = await this.evaluateConcatenation(expression);
      this.outputHandler.output(String(result));
      return;
    }
    
    // Parse the expression to handle multiple values and interpolation
    const outputParts = [];
    
    // Split on spaces but preserve quoted strings
    const parts = parseQuotedParts(expression);
    
    for (const part of parts) {
      if (part.startsWith('"') && part.endsWith('"')) {
        // Handle quoted string with potential interpolation
        let rawString = part.substring(1, part.length - 1);
        // Check for interpolation using current pattern
        let pattern;
        try {
          pattern = require('./interpolation').getCurrentPattern();
        } catch (error) {
          // Fallback to handlebars pattern
          pattern = { hasDelims: (str) => str.includes('{{') };
        }

        if (pattern.hasDelims(rawString)) {
          // Interpolated string
          const interpolated = await this.interpolateString(rawString);
          outputParts.push(interpolated);
        } else {
          // Simple string - apply escape sequence processor
          if (processEscapeSequences) {
            rawString = processEscapeSequences(rawString);
          }
          outputParts.push(rawString);
        }
      } else if (part.startsWith("'") && part.endsWith("'")) {
        // Single quoted string (no interpolation)
        outputParts.push(part.substring(1, part.length - 1));
      } else {
        // Variable reference or literal
        const resolved = await this.resolveValue(part);
        outputParts.push(String(resolved));
      }
    }
    
    // Join all parts with spaces and output
    const output = outputParts.join(' ');
    this.outputHandler.output(output);
  }

  // executeQuotedString moved to interpreter-address-handling.js and bound in constructor

  // executeHeredocString moved to interpreter-address-handling.js and bound in constructor

  async executeExitStatement(command) {
    // Evaluate exit code if provided
    let exitCode = 0;
    if (command.code !== undefined) {
      if (typeof command.code === 'object' && command.code !== null) {
        // It's an expression object, evaluate it
        exitCode = await this.evaluateExpression(command.code);
      } else {
        // It's a direct value
        exitCode = await this.resolveValue(command.code);
      }
    }

    // Convert to number if possible
    const numericCode = Number(exitCode);
    const finalCode = isNaN(numericCode) ? 0 : numericCode;

    // Create and throw special exit exception to terminate execution
    const exitError = new Error(`Script terminated with EXIT ${finalCode}`);
    exitError.isExit = true;
    exitError.exitCode = finalCode;
    throw exitError;
  }

  async executeExitUnlessStatement(command) {
    return await exitUnlessUtils.executeExitUnlessStatement(command, this);
  }

  parseConditionString(conditionStr) {
    return exitUnlessUtils.parseConditionString(conditionStr);
  }

  splitByLogicalOperator(str, operator) {
    return exitUnlessUtils.splitByLogicalOperator(str, operator);
  }

  async executeInterpretStatement(command) {
    return await interpretStatementUtils.executeInterpretStatement(this, command);
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
      // Use getVariable with variableResolver instead of raw Map.get
      (name) => variableStackUtils.getVariable(name, this.variables, this.variableResolver),
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
      // Use getVariable with variableResolver instead of raw Map.get
      (name) => variableStackUtils.getVariable(name, this.variables, this.variableResolver),
      this.variables.has.bind(this.variables),
      this.evaluateExpression.bind(this),
      this.interpolateString.bind(this),
      this.executeFunctionCall.bind(this),
      this.isLikelyFunctionName.bind(this)
    );
  }
  
  async evaluateConcatenation(expression) {
    // Use the extracted evaluateConcatenation function, passing resolveValue, evaluateExpression, and parseExpression
    // This allows proper evaluation of expressions like (a + b) in concatenation contexts
    const { parseExpression } = require('./parser');
    return await evaluateConcatenation(
      expression,
      (variableName) => this.resolveValue(variableName),
      async (exprStr) => {
        // Parse the string into an expression object, then evaluate it
        const parsed = parseExpression(exprStr);
        if (parsed) {
          return await this.evaluateExpression(parsed);
        } else {
          // If parsing fails, try resolving as a variable
          return await this.resolveValue(exprStr);
        }
      }
    );
  }
  
  async interpolateString(template) {
    // Use the extracted interpolateString function, passing variableStack resolver to avoid circular calls
    return await interpolateString(template, async (variableName) => {
      // Use variableStack's resolveVariableValue which handles complex paths without circular calls
      return await variableStackUtils.resolveVariableValue(variableName, this.variables, this.evaluateExpression.bind(this), this.variableResolver);
    });
  }

  async evaluateRexxCallbackExpression(expr) {
    // Wrapper function that delegates to the extracted callback evaluation module
    return await callbackEvaluation.evaluateRexxCallbackExpression(
      expr,
      (part) => this.evaluateRexxExpressionPart(part),
      isTruthy,
      compareValues
    );
  }

  async evaluateRexxExpressionPart(expr) {
    // Wrapper function that delegates to the extracted callback evaluation module
    const context = {
      variables: this.variables,
      builtInFunctions: this.builtInFunctions,
      operations: this.operations,
      parseSimpleArgsFn: (argsStr) => callbackEvaluation.parseSimpleArguments(argsStr),
      evaluatePartRecursiveFn: (part) => this.evaluateRexxExpressionPart(part),
      evaluateExpressionFn: this.evaluateExpression.bind(this)
    };
    return await callbackEvaluation.evaluateRexxExpressionPart(expr, context);
  }

  parseSimpleArguments(argsStr) {
    // Wrapper function that delegates to the extracted callback evaluation module
    return callbackEvaluation.parseSimpleArguments(argsStr);
  }
  
  // UUID/ID Generation helper methods
  

  // Removed: handleError - now bound to errorHandlingUtils.handleError in constructor

  // Removed: getCommandText - now bound to errorHandlingUtils in constructor

  // Removed: getCurrentFunctionName - now bound to errorHandlingUtils in constructor

  // Removed: jumpToLabel - now bound to errorHandlingUtils in constructor

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

    // Output trace to handler if trace-to-output is enabled, but only for
    // instruction-level events. Suppress lower-level ADDRESS internals.
    if (this.options['trace-to-output'] && this.outputHandler && this.traceMode !== 'OFF') {
      // Only forward user-visible types
      const userVisibleTypes = new Set(['instruction', 'call', 'trace']);
      if (!userVisibleTypes.has(type)) {
        return;
      }
      // Require a line number for user-facing stream
      if (lineNumber === null || lineNumber === undefined) {
        return;
      }
      const traceLine = `>> ${String(lineNumber)} ${message}`;
      this.outputHandler.output(traceLine);
    }
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
      this.executeCommands.bind(this)
    );
  }

  // Transitive dependency resolution
  
  async requireWithDependencies(libraryName, asClause = null) {
    const wrappers = libraryRequireWrappersUtils.createLibraryRequireWrappers(requireSystem, this, libraryManagementUtils, libraryUrlUtils);
    return await wrappers.requireWithDependencies(libraryName, asClause);
  }

  async loadSingleLibrary(libraryName) {
    const wrappers = libraryRequireWrappersUtils.createLibraryRequireWrappers(requireSystem, this, libraryManagementUtils, libraryUrlUtils);
    return await wrappers.loadSingleLibrary(libraryName);
  }

  async requireNodeJS(libraryName) {
    const wrappers = libraryRequireWrappersUtils.createLibraryRequireWrappers(requireSystem, this, libraryManagementUtils, libraryUrlUtils);
    return await wrappers.requireNodeJS(libraryName);
  }

  /**
   * Load library from remote Git platforms (GitHub, GitLab, Azure DevOps, etc.)
   * @param {string} libraryName - Library name or URL
   * @returns {Promise<boolean>} True if library loaded successfully
   */
  async requireRemoteLibrary(libraryName) {
    const wrappers = libraryRequireWrappersUtils.createLibraryRequireWrappers(requireSystem, this, libraryManagementUtils, libraryUrlUtils);
    return await wrappers.requireRemoteLibrary(libraryName);
  }

  isLocalOrNpmModule(libraryName) {
    const wrappers = libraryRequireWrappersUtils.createLibraryRequireWrappers(requireSystem, this, libraryManagementUtils, libraryUrlUtils);
    return wrappers.isLocalOrNpmModule(libraryName);
  }

  /**
   * Check if library name follows registry style (namespace/module@version)
   * @param {string} libraryName - Library name to check
   * @returns {boolean} True if registry style
   */
  isRegistryStyleLibrary(libraryName) {
    const wrappers = libraryRequireWrappersUtils.createLibraryRequireWrappers(requireSystem, this, libraryManagementUtils, libraryUrlUtils);
    return wrappers.isRegistryStyleLibrary(libraryName);
  }

  /**
   * Resolve library through registry system
   * @param {string} libraryName - Registry-style library name (namespace/module@version)
   * @returns {Promise<boolean>} True if library loaded successfully
   */
  async requireRegistryStyleLibrary(libraryName) {
    const wrappers = libraryRequireWrappersUtils.createLibraryRequireWrappers(requireSystem, this, libraryManagementUtils, libraryUrlUtils);
    return await wrappers.requireRegistryStyleLibrary(libraryName);
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
    const metadata = libraryMetadataUtils.createLibraryMetadataUtils(requireSystem, this);
    return await metadata.extractDependencies(libraryName);
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
    const metadata = libraryMetadataUtils.createLibraryMetadataUtils(requireSystem, this);
    return metadata.getLibraryDetectionFunction(libraryName);
  }

  extractMetadataFunctionName(libraryCode) {
    const metadata = libraryMetadataUtils.createLibraryMetadataUtils(requireSystem, this);
    return metadata.extractMetadataFunctionName(libraryCode);
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
            (metadata.type === 'address-target' || metadata.type === 'address-handler' || metadata.type === 'hybrid') &&
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
        // Only run this in Node.js environment (typeof module !== 'undefined' means we're in Node.js, not browser)
        if (typeof require !== 'undefined' && typeof module !== 'undefined' && !globalScope.require) {
          try {
            // Use Module.createRequire with a path that can find node_modules
            // Try parent directory first, then cwd
            // eslint-disable-next-line global-require
            const Module = require('module');
            // eslint-disable-next-line global-require
            const path = require('path');
            // eslint-disable-next-line global-require
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
          } catch (error) {
            // If Node.js specific code fails, fall back to eval
            eval(libraryCode);
          }
        } else {
          // If already set, no require available, or in browser, just eval
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

    // Handle direct HTTP/HTTPS URLs - try script tag first, fallback to fetch
    if (libraryName.startsWith('https://') || libraryName.startsWith('http://')) {
      return await this.loadHttpsLibraryAdaptive(libraryName);
    }

    // Handle local libraries via script tag
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

  async loadHttpsLibraryAdaptive(libraryName) {
    // First attempt: Try script tag approach (works with proper MIME types)
    try {
      return await this.loadHttpsLibraryViaScript(libraryName);
    } catch (scriptError) {
      console.log(`Script tag loading failed for ${libraryName}, trying fetch approach...`);
      
      // Second attempt: Fetch and evaluate (works around MIME type issues)
      try {
        return await this.loadHttpsLibraryViaFetch(libraryName);
      } catch (fetchError) {
        throw new Error(`Failed to load ${libraryName}: Script approach failed (${scriptError.message}), Fetch approach failed (${fetchError.message})`);
      }
    }
  }

  async loadHttpsLibraryViaScript(libraryName) {
    // First fetch the code to extract the metadata function name
    const response = await fetch(libraryName);
    if (!response.ok) {
      throw new Error(`Script tag loading failed - fetch for metadata failed: HTTP ${response.status}`);
    }
    const libraryCode = await response.text();
    const metadataFunctionName = this.extractMetadataFunctionName(libraryCode);

    if (metadataFunctionName) {
      // Register the detection function for this HTTP/HTTPS URL
      const globalScope = typeof window !== 'undefined' ? window : global;
      if (!globalScope.LIBRARY_DETECTION_REGISTRY) {
        globalScope.LIBRARY_DETECTION_REGISTRY = new Map();
      }
      globalScope.LIBRARY_DETECTION_REGISTRY.set(libraryName, metadataFunctionName);
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = libraryName;

      script.onload = () => {
        // Give the library a moment to register itself globally
        setTimeout(() => {
          if (this.isLibraryLoaded(libraryName)) {
            // Register the metadata provider for this library
            if (metadataFunctionName) {
              this.libraryMetadataProviders = this.libraryMetadataProviders || new Map();
              this.libraryMetadataProviders.set(libraryName, metadataFunctionName);
            }

            // Register loaded functions as built-ins
            this.registerLibraryFunctions(libraryName);
            console.log(`✓ Loaded ${libraryName} via script tag`);
            resolve(true);
          } else {
            reject(new Error(`Library loaded but detection function not found`));
          }
        }, 10);
      };

      script.onerror = () => {
        reject(new Error(`Script tag loading failed`));
      };

      document.head.appendChild(script);
    });
  }

  async loadHttpsLibraryViaFetch(libraryName) {
    const response = await fetch(libraryName);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const libraryCode = await response.text();

    // Execute the library code
    const func = new Function(libraryCode);
    func();

    // Give the library a moment to register itself globally
    await new Promise(resolve => setTimeout(resolve, 10));

    // Extract metadata function name from the fetched code to properly detect the library
    const metadataFunctionName = this.extractMetadataFunctionName(libraryCode);
    if (metadataFunctionName) {
      // Register the detection function for this HTTP/HTTPS URL in the global registry
      const globalScope = typeof window !== 'undefined' ? window : global;
      if (!globalScope.LIBRARY_DETECTION_REGISTRY) {
        globalScope.LIBRARY_DETECTION_REGISTRY = new Map();
      }
      globalScope.LIBRARY_DETECTION_REGISTRY.set(libraryName, metadataFunctionName);
    }

    if (this.isLibraryLoaded(libraryName)) {
      // Register the metadata provider for this library
      if (metadataFunctionName) {
        this.libraryMetadataProviders = this.libraryMetadataProviders || new Map();
        this.libraryMetadataProviders.set(libraryName, metadataFunctionName);
      }

      // Register loaded functions as built-ins
      this.registerLibraryFunctions(libraryName);

      // Detect and register ADDRESS handlers from the library
      this.detectAndRegisterAddressTargets(libraryName);

      console.log(`✓ Loaded ${libraryName} via fetch`);
      return true;
    } else {
      throw new Error(`Library loaded but detection function not found`);
    }
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
    return await libraryFetchingUtils.fetchLibraryCode(this, libraryName);
  }

  getLibrarySources(libraryName) {
    return libraryFetchingUtils.getLibrarySources(this, libraryName);
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
    return await libraryFetchingUtils.fetchFromReleaseWithFallbacks(this, libraryName);
  }

  async fetchFromZipRelease(zipUrl, libName) {
    return await libraryFetchingUtils.fetchFromZipRelease(this, zipUrl, libName);
  }

  async fetchFromUrl(url) {
    return await libraryFetchingUtils.fetchFromUrl(this, url);
  }

  async waitForLibraryResponse(requestId) {
    return await libraryFetchingUtils.waitForLibraryResponse(this, requestId);
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
    return libraryRegistrationUtils.registerLibraryFunctions(this, libraryName, asClause);
  }

  applyAsClauseToFunction(functionName, asClause) {
    return libraryRegistrationUtils.applyAsClauseToFunction(this, functionName, asClause);
  }

  applyAsClauseToAddressTarget(originalTargetName, asClause, metadata) {
    return libraryRegistrationUtils.applyAsClauseToAddressTarget(this, originalTargetName, asClause, metadata);
  }

  getLibraryFunctionList(libraryName) {
    return libraryRegistrationUtils.getLibraryFunctionList(this, libraryName);
  }

  getLibraryOperationList(libraryName) {
    return libraryRegistrationUtils.getLibraryOperationList(this, libraryName);
  }

  isBuiltinLibrary(libraryName) {
    return utils.isBuiltinLibrary(libraryName);
  }

  discoverBuiltinLibraryFunctions(libraryName) {
    return libraryRegistrationUtils.discoverBuiltinLibraryFunctions(this, libraryName);
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
    return libraryDiscoveryUtils.discoverLibraryFunctions(this, libraryName);
  }

  getThirdPartyNamespace(libName) {
    return libraryDiscoveryUtils.getThirdPartyNamespace(this, libName);
  }

  extractFunctionsFromNamespace(namespaceName) {
    return libraryDiscoveryUtils.extractFunctionsFromNamespace(this, namespaceName);
  }

  extractGlobalFunctions(libraryName) {
    return libraryDiscoveryUtils.extractGlobalFunctions(this, libraryName);
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
  module.exports = {
    Interpreter: RexxInterpreter,
    RexxInterpreter,
    RexxInterpreterBuilder,
    RexxError
  };
} else {
  // Browser environment - attach to window
  window.Interpreter = RexxInterpreter;
  window.RexxInterpreter = RexxInterpreter;
  window.RexxInterpreterBuilder = RexxInterpreterBuilder;
  window.RexxError = RexxError;
}
