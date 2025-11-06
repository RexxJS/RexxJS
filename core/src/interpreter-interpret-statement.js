'use strict';

/**
 * INTERPRET statement handler for REXX interpreter
 *
 * This module provides the executeInterpretStatement function for handling
 * REXX INTERPRET statements with various modes (classic, isolated, default).
 */

// Import dependencies
let RexxInterpreter, RexxError, interpolation;

if (typeof require !== 'undefined') {
  // Node.js environment - circular dependency handled at call time
  interpolation = require('./interpolation.js');
}

/**
 * Execute INTERPRET statement with various modes
 * @param {Object} interpreter - The interpreter instance (`this`)
 * @param {Object} command - The INTERPRET command object
 * @returns {Promise<void>}
 */
async function executeInterpretStatement(interpreter, command) {
  // Get RexxInterpreter constructor from interpreter (avoid circular dependency)
  RexxInterpreter = interpreter.constructor;

  // Get RexxError - either from interpreter constructor, window, or require it
  if (!RexxError) {
    if (typeof window !== 'undefined' && window.RexxError) {
      RexxError = window.RexxError;
    } else {
      const interpreterModule = require('./interpreter.js');
      RexxError = interpreterModule.RexxError;
    }
  }

  if (typeof window !== 'undefined' && !interpolation) {
    interpolation = window.InterpolationConfig;
  }

  // Check if INTERPRET is blocked
  if (interpreter.interpretBlocked) {
    throw new Error('INTERPRET is blocked by NO-INTERPRET directive');
  }

  // Push INTERPRET context onto execution stack
  const currentContext = interpreter.getCurrentExecutionContext();
  const interpretContext = interpreter.pushExecutionContext(
    'interpret',
    interpreter.currentLineNumber,
    interpreter.sourceLines && interpreter.currentLineNumber ? interpreter.sourceLines[interpreter.currentLineNumber - 1] || '' : '',
    interpreter.sourceFilename || '',
    { command }
  );

  let codeToExecute;
  let normalizedCode;

  try {
    // Evaluate the expression to get the code string
    if (typeof command.expression === 'string' && command.expression.includes('||')) {
      // Handle concatenation expressions
      codeToExecute = await interpreter.evaluateConcatenation(command.expression);
    } else {
      codeToExecute = await interpreter.resolveValue(command.expression);
    }

    normalizedCode = String(codeToExecute).replace(/\\n/g, '\n');

    // Import parser to compile the Rexx code
    const { parse } = require('./parser');
    const commands = parse(normalizedCode);

    if (command.mode === 'classic') {
      // Mode C: Full classic behavior - share all variables and context
      const subInterpreter = new RexxInterpreter(interpreter.addressSender, interpreter.outputHandler);
      subInterpreter.address = interpreter.address;
      subInterpreter.builtInFunctions = interpreter.builtInFunctions;
      subInterpreter.operations = interpreter.operations;
      subInterpreter.errorHandlers = new Map(interpreter.errorHandlers);
      subInterpreter.labels = new Map(interpreter.labels);
      subInterpreter.addressTargets = new Map(interpreter.addressTargets);
      subInterpreter.subroutines = new Map(interpreter.subroutines);

      // Share all variables
      for (const [key, value] of interpreter.variables) {
        subInterpreter.variables.set(key, value);
      }

      // Execute the code with its own source context
      await subInterpreter.run(commands, normalizedCode, `[interpreted from ${interpreter.sourceFilename || 'unknown'}:${interpretContext.lineNumber}]`);

      // Copy back all variables
      for (const [key, value] of subInterpreter.variables) {
        interpreter.variables.set(key, value);
      }

    } else if (command.mode === 'isolated') {
      // Mode B: Sandboxed scope - controlled variable sharing
      const subInterpreter = new RexxInterpreter(interpreter.addressSender, interpreter.outputHandler);
      subInterpreter.address = interpreter.address;
      subInterpreter.builtInFunctions = interpreter.builtInFunctions;
      subInterpreter.operations = interpreter.operations;
      subInterpreter.addressTargets = new Map(interpreter.addressTargets);
      subInterpreter.errorHandlers = new Map(interpreter.errorHandlers);
      subInterpreter.labels = new Map(interpreter.labels);
      subInterpreter.subroutines = new Map(interpreter.subroutines);

      // Handle IMPORT - share specific variables TO the isolated scope
      if (command.importVars && Array.isArray(command.importVars)) {
        for (const varName of command.importVars) {
          if (interpreter.variables.has(varName)) {
            subInterpreter.variables.set(varName, interpreter.variables.get(varName));
          }
        }
      }

      // Execute in isolation with its own source context
      await subInterpreter.run(commands, normalizedCode, `[interpreted from ${interpreter.sourceFilename || 'unknown'}:${interpretContext.lineNumber}]`);

      // Handle EXPORT - copy specific variables FROM the isolated scope
      if (command.exportVars && Array.isArray(command.exportVars)) {
        for (const varName of command.exportVars) {
          if (subInterpreter.variables.has(varName)) {
            interpreter.variables.set(varName, subInterpreter.variables.get(varName));
          }
        }
      }
    } else {
      // Default mode: Share variables and context like classic REXX INTERPRET
      const subInterpreter = new RexxInterpreter(interpreter.addressSender, interpreter.outputHandler);
      subInterpreter.address = interpreter.address;
      subInterpreter.builtInFunctions = interpreter.builtInFunctions;
      subInterpreter.operations = interpreter.operations;
      subInterpreter.errorHandlers = new Map(interpreter.errorHandlers);
      subInterpreter.labels = new Map(interpreter.labels);
      subInterpreter.addressTargets = new Map(interpreter.addressTargets);
      subInterpreter.subroutines = new Map(interpreter.subroutines);

      // Share all variables (classic Rexx behavior)
      for (const [key, value] of interpreter.variables) {
        subInterpreter.variables.set(key, value);
      }

      // Execute the interpreted code with its own source context
      await subInterpreter.run(commands, normalizedCode, `[interpreted from ${interpreter.sourceFilename || 'unknown'}:${interpretContext.lineNumber}]`);

      // Copy back all variables
      for (const [key, value] of subInterpreter.variables) {
        interpreter.variables.set(key, value);
      }
    }

    // Pop the INTERPRET context on successful completion
    interpreter.popExecutionContext();

  } catch (e) {
    // Get the INTERPRET context from the execution stack
    const interpretCtx = interpreter.getInterpretContext();
    const sourceContext = interpretCtx ? {
      lineNumber: interpretCtx.lineNumber,
      sourceLine: interpretCtx.sourceLine,
      sourceFilename: interpretCtx.sourceFilename,
      interpreter: interpreter,
      interpolation: interpolation
    } : null;

    // Pop the INTERPRET context on error
    interpreter.popExecutionContext();

    // Try to extract more context about what was being interpreted
    let detailedMessage = `INTERPRET failed: ${e.message}`;

    // Add information about what code was being interpreted
    if (typeof codeToExecute === 'string' && codeToExecute.trim()) {
      detailedMessage += `\nInterpreting code: "${codeToExecute.trim()}"`;

      // If it's a CALL statement, mention what's being called
      if (codeToExecute.trim().startsWith('CALL ')) {
        const callTarget = codeToExecute.trim().substring(5).trim();
        detailedMessage += `\nCalling subroutine: ${callTarget}`;
      }
    }

    // If this is a property access error, try to identify the variable
    if (e.message && e.message.includes("Cannot read properties of undefined")) {
      const propertyMatch = e.message.match(/Cannot read properties of undefined \(reading '(.+?)'\)/);
      if (propertyMatch) {
        detailedMessage += `\nTrying to access property '${propertyMatch[1]}' on undefined variable`;
      }
    }

    // Include stack trace from sub-interpreter if available
    if (e.stack) {
      const relevantStack = e.stack.split('\n').slice(0, 3).join('\n');
      detailedMessage += `\nSub-interpreter error: ${relevantStack}`;

      // Try to extract more context from the stack trace
      if (e.stack.includes('executeCall')) {
        detailedMessage += `\nLikely error in subroutine call execution`;
      }
      if (e.stack.includes('executeCommands')) {
        detailedMessage += `\nError during command execution (possibly accessing undefined commands array)`;
      }
    }

    // Add debug info showing execution stack context
    if (interpretCtx) {
      detailedMessage += `\nINTERPRET statement: line ${interpretCtx.lineNumber} ("${interpretCtx.sourceLine.trim()}")`;
    }

    const currentCtx = interpreter.getCurrentExecutionContext();
    if (currentCtx && currentCtx !== interpretCtx) {
      detailedMessage += `\nCurrent execution: line ${currentCtx.lineNumber} ("${currentCtx.sourceLine.trim()}")`;
    }

    // Show execution stack
    if (interpreter.executionStack.length > 0) {
      detailedMessage += `\nExecution stack (${interpreter.executionStack.length} levels):`;
      for (let i = interpreter.executionStack.length - 1; i >= 0; i--) {
        const ctx = interpreter.executionStack[i];
        detailedMessage += `\n  [${i}] ${ctx.type} at ${ctx.sourceFilename}:${ctx.lineNumber}`;
      }
    }

    // Show what we're trying to interpret
    if (normalizedCode) {
      detailedMessage += `\nCode being interpreted: "${normalizedCode}"`;
    }

    throw new RexxError(detailedMessage, 'INTERPRET', sourceContext);
  }
}

// Export functions
module.exports = {
  executeInterpretStatement
};

// Browser environment support
if (typeof window !== 'undefined') {
  if (!window.rexxModuleRegistry) {
    window.rexxModuleRegistry = new Map();
  }
  window.rexxModuleRegistry.set('interpretStatement', module.exports);
}
