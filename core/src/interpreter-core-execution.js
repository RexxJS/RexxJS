'use strict';

const controlFlowUtils = require('./interpreter-control-flow.js');
const errorHandlingUtils = require('./interpreter-error-handling.js');
const parseSubroutineUtils = require('./interpreter-parse-subroutine.js');
const traceFormattingUtils = require('./interpreter-trace-formatting.js');
const addressHandlingUtils = require('./interpreter-address-handling.js');
const operations = require('./interpreter-operations.js');
const { callConvertParamsToArgs } = require('./string-processing.js');
const interpolation = require('./interpolation.js');

async function executeCommands(interpreter, commands, startIndex = 0) {
  let lastProcessedLine = 0; // Track the last processed source line number

  for (let i = startIndex; i < commands.length; i++) {
    const command = commands[i];

    // Track current line number for error reporting and push execution context
    if (command && command.lineNumber) {
      lastProcessedLine = command.lineNumber;

      // Update execution context if line number changes
      const currentCtx = interpreter.getCurrentExecutionContext();
      if (!currentCtx || currentCtx.lineNumber !== command.lineNumber) {
        const sourceLine = interpreter.sourceLines && command.lineNumber ?
          interpreter.sourceLines[command.lineNumber - 1] || '' : '';

        // Don't push a new context if we're just updating the same main execution
        if (!currentCtx || currentCtx.type === 'main') {
          if (currentCtx && currentCtx.type === 'main') {
            // Update existing main context
            currentCtx.lineNumber = command.lineNumber;
            currentCtx.sourceLine = sourceLine;
            interpreter.currentLineNumber = command.lineNumber;
          } else {
            // Push new main context
            interpreter.pushExecutionContext('main', command.lineNumber, sourceLine, interpreter.sourceFilename || '');
          }
        } else {
          // We're in a subroutine or other context - still update currentLineNumber for error reporting
          interpreter.currentLineNumber = command.lineNumber;
        }
      }
    }

    if (command.type === 'LABEL' && interpreter.callStack.length === 0) {

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
      const result = await executeCommand(interpreter, command);
      if (result && result.jump) {
        // Handle SIGNAL jumps
        return result;
      }
      if (result && result.terminated) {
        // Handle EXIT (always terminates) or RETURN (only terminates if not in subroutine)
        if (result.type === 'EXIT' || interpreter.callStack.length === 0) {
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
      const handled = await interpreter.handleError(error, i);
      if (handled && handled.jump) {
        return handled;
      } else if (!handled) {
        // Check if this is a DOM/REXX-recognizable error and we have error handlers configured
        if (errorHandlingUtils.shouldHandleError(error, interpreter.errorHandlers)) {
          // This is a DOM/REXX error and we have error handlers - handle gracefully
          // The error variables (RC, ERRORTEXT, SIGL) have already been set by handleError
          // Include line information in error message
          const currentCommand = interpreter.currentCommands[i];
          const lineInfo = currentCommand && currentCommand.lineNumber
            ? `Error at line ${currentCommand.lineNumber}: ${interpreter.getCommandText(currentCommand)}`
            : `Error in command ${i + 1}`;
          console.log(`${lineInfo}\n${error.message}`);
          return {
            terminated: true,
            error: true,
            exitCode: interpreter.variables.get('RC') || 1,
            message: interpreter.variables.get('ERRORTEXT') || error.message
          };
        } else {
          // Add line information to error message before re-throwing
          const currentCommand = interpreter.currentCommands[i];
          if (currentCommand && currentCommand.lineNumber) {
            const lineInfo = `Error at line ${currentCommand.lineNumber}: ${interpreter.getCommandText(currentCommand)}`;
            error.message = `${lineInfo}\n${error.message}`;
          }
          // Mark error as unhandled by adding a flag, then re-throw
          error.rexxUnhandled = true;
          throw error;
        }
      }
      // If handled but no jump, continue execution
    }
  }


  return null;
}

async function executeCommand(interpreter, command) {
  // Add trace output for instruction execution
  interpreter.addTraceOutput(`${command.type}`, 'instruction');

  switch (command.type) {
      case 'ADDRESS':
        interpreter.address = command.target.toLowerCase();
        // Clear lines state when switching to default
        if (interpreter.address === 'default') {
          interpreter.addressLinesCount = 0;
          interpreter.addressLinesBuffer = [];
          interpreter.addressLinesStartLine = 0;
        }
        break;

      case 'ADDRESS_WITH_STRING':
        // Set the address target and execute the command string immediately
        interpreter.address = command.target.toLowerCase();
        await addressHandlingUtils.executeQuotedString.call(interpreter, { type: 'QUOTED_STRING', value: command.commandString });
        break;

      case 'SIGNAL':
        if (command.action === 'ON' || command.action === 'OFF') {
          errorHandlingUtils.setupErrorHandler(command.condition, command.action, command.label, interpreter.errorHandlers);
        } else if (command.label) {
          // Basic SIGNAL jump
          return interpreter.jumpToLabel(command.label);
        }
        break;

      case 'SIGNAL_JUMP':
        return interpreter.jumpToLabel(command.label);

      case 'LABEL':
        // Execute any command on the same line as the label
        if (command.statement) {
          return await executeCommand(interpreter, command.statement);
        }
        break;

      case 'NUMERIC':
        // Evaluate the value expression to handle variables
        let evaluatedValue;
        if (typeof command.value === 'string') {
          // Handle simple string literals and variable references
          evaluatedValue = interpreter.variables.get(command.value) || command.value;
        } else {
          evaluatedValue = interpreter.evaluateExpression(command.value);
        }
        traceFormattingUtils.setNumericSetting(command.setting, evaluatedValue, interpreter.numericSettings);
        break;

      case 'PARSE':
        await parseSubroutineUtils.executeParse(command, interpreter.variables, interpreter.evaluateExpression.bind(interpreter), parseSubroutineUtils.parseTemplate, interpreter.argv);
        break;

      case 'PUSH':
        interpreter.executePush(command);
        break;

      case 'PULL':
        interpreter.executePull(command);
        break;

      case 'QUEUE':
        interpreter.executeQueue(command);
        break;

      case 'CALL':
        interpreter.addTraceOutput(`CALL ${command.subroutine} (${command.arguments.length} args)`, 'call');
        const callResult = await parseSubroutineUtils.executeCall(
          command,
          interpreter.variables,
          interpreter.subroutines,
          interpreter.callStack,
          interpreter.evaluateExpression.bind(interpreter),
          interpreter.pushExecutionContext.bind(interpreter),
          interpreter.popExecutionContext.bind(interpreter),
          interpreter.getCurrentExecutionContext.bind(interpreter),
          executeCommands.bind(null, interpreter),
          parseSubroutineUtils.isExternalScriptCall,
          interpreter.executeExternalScript.bind(interpreter),
          interpreter.sourceFilename,
          interpreter.returnValue,
          interpreter.builtInFunctions,
          callConvertParamsToArgs,
          interpreter.argv
        );
        if (callResult && callResult.terminated) {
          return callResult;
        }
        // Set RESULT variable if subroutine returned a value
        if (callResult && callResult.returnValue !== undefined) {
          interpreter.variables.set('RESULT', callResult.returnValue);
        }
        break;

      case 'RETURN':
        return await interpreter.executeReturn(command);

      case 'TRACE':
        interpreter.traceMode = traceFormattingUtils.executeTrace(command, interpreter.traceOutput, interpreter.addTraceOutput.bind(interpreter));
        break;

      case 'FUNCTION_CALL':
        await interpreter.executeFunctionCall(command);
        break;

      case 'ASSIGNMENT':
        if (command.command) {
          // Check if it's a CALL command assignment
          if (command.command.type === 'CALL') {
            // Execute the CALL and get its return value
            const result = await parseSubroutineUtils.executeCall(
              command.command,
              interpreter.variables,
              interpreter.subroutines,
              interpreter.callStack,
              interpreter.evaluateExpression.bind(interpreter),
              interpreter.pushExecutionContext.bind(interpreter),
              interpreter.popExecutionContext.bind(interpreter),
              interpreter.getCurrentExecutionContext.bind(interpreter),
              executeCommands.bind(null, interpreter),
              parseSubroutineUtils.isExternalScriptCall,
              interpreter.executeExternalScript.bind(interpreter),
              interpreter.sourceFilename,
              interpreter.returnValue,
              interpreter.builtInFunctions,
              callConvertParamsToArgs,
              interpreter.argv
            );
            const variableName = await interpreter.interpolateString(command.variable);

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

            interpreter.variables.set(variableName, value);
            interpreter.addTraceOutput(`LET ${variableName} = CALL ${command.command.subroutine}`, 'assignment', null, value);
          } else {
            // Function call assignment: LET var = functionCall
            const result = await interpreter.executeFunctionCall(command.command);
            const variableName = await interpreter.interpolateString(command.variable);
            interpreter.variables.set(variableName, result);
            interpreter.addTraceOutput(`LET ${variableName} = ${command.command.command}()`, 'assignment', null, result);
          }
        } else if (command.expression) {
          // Expression assignment: LET var = expr
          let result;

          // Special case: RESULT() with no parameters should be treated as RESULT variable reference
          if (command.expression.type === 'FUNCTION_CALL' &&
              command.expression.command === 'RESULT' &&
              Object.keys(command.expression.params || {}).length === 0) {
            result = interpreter.variables.get('RESULT');
          }
          // Special case: ADDRESS method call - check if we're in ADDRESS context and expression is a simple variable
          else if (command.expression.type === 'VARIABLE' &&
                   interpreter.address && interpreter.address !== 'default') {
            const addressTarget = interpreter.addressTargets.get(interpreter.address);

            // If we have an ADDRESS target and the variable name matches a method
            if (addressTarget && addressTarget.handler &&
                addressTarget.methods && addressTarget.methods.includes(command.expression.name.toLowerCase())) {

              try {
                // Execute as ADDRESS method call with empty params (parameterless call)
                const params = { params: '' };
                const context = Object.fromEntries(interpreter.variables);
                const sourceContext = interpreter.currentLineNumber ? {
                  lineNumber: interpreter.currentLineNumber,
                  sourceLine: interpreter.sourceLines[interpreter.currentLineNumber - 1] || '',
                  sourceFilename: interpreter.sourceFilename || '',
                  interpreter: interpreter,
                  interpolation: interpolation
                } : null;

                // Call the ADDRESS handler directly
                result = await addressTarget.handler(command.expression.name, params, sourceContext);

                // Update standard REXX variables like RC
                if (result && typeof result === 'object') {
                  interpreter.variables.set('RC', result.success ? 0 : (result.errorCode || 1));
                  if (!result.success && result.errorMessage) {
                    interpreter.variables.set('ERRORTEXT', result.errorMessage);
                  }
                }
              } catch (error) {
                // If ADDRESS method call fails, fall back to normal expression evaluation
                result = await interpreter.evaluateExpression(command.expression);
              }
            } else {
              // Not an ADDRESS method or no ADDRESS target, evaluate normally
              result = await interpreter.evaluateExpression(command.expression);
            }
          } else {
            result = await interpreter.evaluateExpression(command.expression);
          }

          const variableName = await interpreter.interpolateString(command.variable);
          interpreter.variables.set(variableName, result);
          interpreter.addTraceOutput(`LET ${variableName} = expression`, 'assignment', null, result);
        } else if (command.value !== undefined) {
          // Simple value assignment: LET var = value (resolve value in case it's a variable reference)
          let resolvedValue;

          // For quoted strings, don't resolve as expressions or function calls - keep as literal
          if (command.isQuotedString) {
            resolvedValue = command.value;
          } else {
            // Check if we're in an ADDRESS context and the value could be an ADDRESS method call
            if (interpreter.address && interpreter.address !== 'default' && typeof command.value === 'string') {
              const addressTarget = interpreter.addressTargets.get(interpreter.address);

              // If we have an ADDRESS target and the value looks like a method name
              if (addressTarget && addressTarget.handler &&
                  addressTarget.methods && addressTarget.methods.includes(command.value.toLowerCase())) {

                try {
                  // Execute as ADDRESS method call with empty params (parameterless call)
                  const params = { params: '' };
                  const context = Object.fromEntries(interpreter.variables);
                  const sourceContext = interpreter.currentLineNumber ? {
                    lineNumber: interpreter.currentLineNumber,
                    sourceLine: interpreter.sourceLines[interpreter.currentLineNumber - 1] || '',
                    sourceFilename: interpreter.sourceFilename || '',
                    interpreter: interpreter,
                  interpolation: interpolation
                  } : null;

                  // Call the ADDRESS handler directly
                  resolvedValue = await addressTarget.handler(command.value, params, sourceContext);

                  // Update standard REXX variables like RC
                  if (resolvedValue && typeof resolvedValue === 'object') {
                    interpreter.variables.set('RC', resolvedValue.success ? 0 : (resolvedValue.errorCode || 1));
                    if (!resolvedValue.success && resolvedValue.errorMessage) {
                      interpreter.variables.set('ERRORTEXT', resolvedValue.errorMessage);
                    }
                  }
                } catch (error) {
                  // If ADDRESS method call fails, fall back to normal variable resolution
                  resolvedValue = await interpreter.resolveValue(command.value);
                }
              } else {
                // Not an ADDRESS method, resolve normally
                resolvedValue = await interpreter.resolveValue(command.value);
              }
            } else {
              // Not in ADDRESS context, resolve normally
              resolvedValue = await interpreter.resolveValue(command.value);
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

          const variableName = await interpreter.interpolateString(command.variable);
          interpreter.variables.set(variableName, resolvedValue);
          interpreter.addTraceOutput(`LET ${variableName} = "${resolvedValue}"`, 'assignment', null, resolvedValue);
        }
        break;

      case 'IF':
        const ifResult = await controlFlowUtils.executeIfStatement(command, interpreter.evaluateCondition.bind(interpreter), interpreter.run.bind(interpreter));
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
        const doResult = await controlFlowUtils.executeDoStatement(command, interpreter.resolveValue.bind(interpreter), interpreter.evaluateCondition.bind(interpreter), interpreter.run.bind(interpreter), interpreter.variables, {
          RexxError,
          currentLineNumber: interpreter.currentLineNumber,
          sourceLines: interpreter.sourceLines,
          sourceFilename: interpreter.sourceFilename,
          interpreter: interpreter,
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
        const selectResult = await controlFlowUtils.executeSelectStatement(command, interpreter.evaluateCondition.bind(interpreter), interpreter.run.bind(interpreter));
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
        await operations.executeExitStatement.call(interpreter, command);
        break;

      case 'SAY':
        await operations.executeSayStatement.call(interpreter, command);
        break;

      case 'INTERPRET_STATEMENT':
        await operations.executeInterpretStatement.call(interpreter, command);
        break;

      case 'NO_INTERPRET':
        interpreter.interpretBlocked = true;
        break;

      case 'RETRY_ON_STALE':
        return await interpreter.executeRetryOnStale(command);

      case 'QUOTED_STRING':
        await addressHandlingUtils.executeQuotedString.call(interpreter, command);
        break;

      case 'HEREDOC_STRING':
        await addressHandlingUtils.executeHeredocString.call(interpreter, command);
        break;

      default:
        break;
  }
}

module.exports = {
  executeCommands,
  executeCommand
};
