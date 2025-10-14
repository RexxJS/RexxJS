'use strict';

const { parseQuotedParts, interpolateString, evaluateConcatenation } = require('./interpreter-string-and-expression-processing.js');

async function executeSayStatement(command) {
  const expression = command.expression;

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
      const rawString = part.substring(1, part.length - 1);
      if (rawString.match(/\{[a-zA-Z_][a-zA-Z0-9_.]*\}/)) {
        // Interpolated string
        const interpolated = await this.interpolateString(rawString);
        outputParts.push(interpolated);
      } else {
        // Simple string
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

async function executeExitStatement(command) {
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

async function executeInterpretStatement(command) {
  // Check if INTERPRET is blocked
  if (this.interpretBlocked) {
    throw new Error('INTERPRET is blocked by NO-INTERPRET directive');
  }

  // Push INTERPRET context onto execution stack
  const currentContext = this.getCurrentExecutionContext();
  const interpretContext = this.pushExecutionContext(
    'interpret',
    this.currentLineNumber,
    this.sourceLines && this.currentLineNumber ? this.sourceLines[this.currentLineNumber - 1] || '' : '',
    this.sourceFilename || '',
    { command }
  );

  let codeToExecute;
  let normalizedCode;

  try {
    // Evaluate the expression to get the code string
    if (typeof command.expression === 'string' && command.expression.includes('||')) {
      // Handle concatenation expressions
      codeToExecute = await this.evaluateConcatenation(command.expression);
    } else {
      codeToExecute = await this.resolveValue(command.expression);
    }

    normalizedCode = String(codeToExecute).replace(/\\n/g, '\n');

    // Import parser to compile the Rexx code
    const { parse } = require('./parser');
    const { RexxInterpreter } = require('./interpreter');
    const commands = parse(normalizedCode);

    if (command.mode === 'classic') {
      // Mode C: Full classic behavior - share all variables and context
      const subInterpreter = new RexxInterpreter(this.addressSender, this.outputHandler);
      subInterpreter.address = this.address;
      subInterpreter.builtInFunctions = this.builtInFunctions;
      subInterpreter.operations = this.operations;
      subInterpreter.errorHandlers = new Map(this.errorHandlers);
      subInterpreter.labels = new Map(this.labels);
      subInterpreter.addressTargets = new Map(this.addressTargets);
      subInterpreter.subroutines = new Map(this.subroutines);


      // Share all variables
      for (const [key, value] of this.variables) {
        subInterpreter.variables.set(key, value);
      }

      // Execute the code with its own source context
      await subInterpreter.run(commands, normalizedCode, `[interpreted from ${this.sourceFilename || 'unknown'}:${interpretContext.lineNumber}]`);

      // Copy back all variables
      for (const [key, value] of subInterpreter.variables) {
        this.variables.set(key, value);
      }

    } else if (command.mode === 'isolated') {
      // Mode B: Sandboxed scope - controlled variable sharing
      const subInterpreter = new RexxInterpreter(this.addressSender, this.outputHandler);
      subInterpreter.address = this.address;
      subInterpreter.builtInFunctions = this.builtInFunctions;
      subInterpreter.operations = this.operations;
      subInterpreter.addressTargets = new Map(this.addressTargets);
      subInterpreter.errorHandlers = new Map(this.errorHandlers);
      subInterpreter.labels = new Map(this.labels);
      subInterpreter.subroutines = new Map(this.subroutines);

      // Handle IMPORT - share specific variables TO the isolated scope
      if (command.importVars && Array.isArray(command.importVars)) {
        for (const varName of command.importVars) {
          if (this.variables.has(varName)) {
            subInterpreter.variables.set(varName, this.variables.get(varName));
          }
        }
      }

      // Execute in isolation with its own source context
      await subInterpreter.run(commands, normalizedCode, `[interpreted from ${this.sourceFilename || 'unknown'}:${interpretContext.lineNumber}]`);

      // Handle EXPORT - copy specific variables FROM the isolated scope
      if (command.exportVars && Array.isArray(command.exportVars)) {
        for (const varName of command.exportVars) {
          if (subInterpreter.variables.has(varName)) {
            this.variables.set(varName, subInterpreter.variables.get(varName));
          }
        }
      }
    } else {
      // Default mode: Share variables and context like classic REXX INTERPRET
      const subInterpreter = new RexxInterpreter(this.addressSender, this.outputHandler);
      subInterpreter.address = this.address;
      subInterpreter.builtInFunctions = this.builtInFunctions;
      subInterpreter.operations = this.operations;
      subInterpreter.errorHandlers = new Map(this.errorHandlers);
      subInterpreter.labels = new Map(this.labels);
      subInterpreter.addressTargets = new Map(this.addressTargets);
      subInterpreter.subroutines = new Map(this.subroutines);


      // Share all variables (classic Rexx behavior)
      for (const [key, value] of this.variables) {
        subInterpreter.variables.set(key, value);
      }

      // Execute the interpreted code with its own source context
      await subInterpreter.run(commands, normalizedCode, `[interpreted from ${this.sourceFilename || 'unknown'}:${interpretContext.lineNumber}]`);

      // Copy back all variables
      for (const [key, value] of subInterpreter.variables) {
        this.variables.set(key, value);
      }
    }

    // Pop the INTERPRET context on successful completion
    this.popExecutionContext();

  } catch (e) {
    // Get the INTERPRET context from the execution stack
    const interpretCtx = this.getInterpretContext();
    const sourceContext = interpretCtx ? {
      lineNumber: interpretCtx.lineNumber,
      sourceLine: interpretCtx.sourceLine,
      sourceFilename: interpretCtx.sourceFilename,
      interpreter: this,
                    interpolation: interpolation
    } : null;

    // Pop the INTERPRET context on error
    this.popExecutionContext();

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

    const currentCtx = this.getCurrentExecutionContext();
    if (currentCtx && currentCtx !== interpretCtx) {
      detailedMessage += `\nCurrent execution: line ${currentCtx.lineNumber} ("${currentCtx.sourceLine.trim()}")`;
    }

    // Show execution stack
    if (this.executionStack.length > 0) {
      detailedMessage += `\nExecution stack (${this.executionStack.length} levels):`;
      for (let i = this.executionStack.length - 1; i >= 0; i--) {
        const ctx = this.executionStack[i];
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


module.exports = {
  executeSayStatement,
  executeExitStatement,
  executeInterpretStatement
};
