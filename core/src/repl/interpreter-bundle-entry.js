// Bundle entry point for webpack - requires all interpreter modules in order
// This creates a single self-contained bundle with all dependencies
// The modules use CommonJS/UMD and will register themselves globally

// Core parsing and utility modules
require('../function-parsing-strategies.js');
require('../parameter-converter.js');
require('../parser.js');
require('../utils.js');
require('../security.js');

// Interpreter core modules
require('../interpreter-string-and-expression-processing.js');
require('../interpreter-variable-stack.js');
require('../interpreter-evaluation-utilities.js');
require('../interpreter-execution-context.js');
require('../interpreter-control-flow.js');
require('../interpreter-expression-value-resolution.js');
require('../interpreter-dom-manager.js');
require('../interpreter-error-handling.js');
require('../interpreter-parse-subroutine.js');
require('../interpreter-trace-formatting.js');
require('../interpreter-library-management.js');
require('../interpreter-library-url.js');

// Function libraries
require('../string-processing.js');
require('../string-functions.js');
require('../json-functions.js');
require('../url-functions.js');
require('../math-functions.js');
require('../date-time-functions.js');
require('../array-functions.js');
require('../logic-functions.js');
require('../data-functions.js');
require('../validation-functions.js');
require('../cryptography-functions.js');
require('../shell-functions.js');
require('../dom-functions.js');

// Main interpreter - must be loaded last
require('../interpreter.js');

// Force global assignment for bundled version
// In webpack context, modules think they're in Node.js, so we need to force browser globals
if (typeof window !== 'undefined') {
    // Get the interpreter from the module system and force it global
    const interpreterModule = require('../interpreter.js');
    const RexxInterpreter = interpreterModule.RexxInterpreter || interpreterModule.Interpreter;
    const RexxInterpreterBuilder = interpreterModule.RexxInterpreterBuilder;

    // Force global assignment
    window.RexxInterpreter = RexxInterpreter;
    window.Interpreter = RexxInterpreter; // Legacy alias
    window.RexxInterpreterBuilder = RexxInterpreterBuilder;

    // Also ensure parse is available globally
    try {
        const parserModule = require('../parser.js');
        if (parserModule.parse) {
            window.parse = parserModule.parse;
        }
    } catch (e) {
        // parse might be already global from parser.js
    }

    // Force DOM functions to window (webpack context needs explicit assignment)
    try {
        const domModule = require('../dom-functions.js');
        if (domModule) {
            window.domFunctions = domModule.domFunctions || domModule;
            window.domFunctionsOnly = domModule.functions || {};
            window.domOperations = domModule.operations || {};
        }
    } catch (e) {
        console.warn('Could not load DOM functions:', e);
    }

    console.log('RexxJS bundle loaded - RexxInterpreter and RexxInterpreterBuilder available globally');
}