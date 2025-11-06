'use strict';

/**
 * Address handling functions for REXX interpreter
 *
 * This module provides browser/Node.js compatible functions for handling
 * ADDRESS operations including quoted strings, heredoc strings, and address target registration.
 */

/**
 * Register an ADDRESS target handler
 * @param {string} name - The address target name
 * @param {Object} target - The target handler object
 * @param {Object} interpreter - The interpreter context (`this`)
 */
function registerAddressTarget(name, target) {
  const key = String(name).toLowerCase();
  this.addressTargets.set(key, target);
}

/**
 * Execute a command on a remote HTTP ADDRESS endpoint
 * @param {Object} interpreter - The interpreter context
 * @param {string} commandString - The command to execute
 * @param {Object} remote - The remote endpoint config {url, authToken}
 * @param {Object} command - The command object for tracing
 */
async function executeRemoteCommand(interpreter, commandString, remote, command) {
  // Ensure fetch is available
  let fetchFn = typeof fetch !== 'undefined' ? fetch : null;
  if (!fetchFn && typeof require !== 'undefined') {
    try {
      fetchFn = require('node-fetch');
    } catch (e) {
      throw new Error('Remote ADDRESS requires node-fetch in Node.js: npm install node-fetch');
    }
  }

  if (!fetchFn) {
    throw new Error('Remote ADDRESS requires fetch API or node-fetch module');
  }

  // Send command as-is (already valid REXX syntax like: SETCELL("A1", "100"))
  const requestBody = {
    command: commandString.trim()
  };

  try {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (remote.authToken) {
      headers['Authorization'] = `Bearer ${remote.authToken}`;
    }

    const response = await fetchFn(remote.url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized - check authentication token');
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    // Extract value/error from consistent result structure
    const resultData = result.result || {};
    const hasError = !result.success || resultData.error;

    // Set REXX variables
    interpreter.variables.set('RC', hasError ? 1 : 0);
    interpreter.variables.set('RESULT', resultData.value !== undefined ? resultData.value : result);

    if (hasError) {
      const errorMsg = result.error || resultData.error || 'Unknown error';
      interpreter.variables.set('ERRORTEXT', errorMsg);
    }

    interpreter.addTraceOutput(`"${commandString}"`, 'address_remote', command.lineNumber || interpreter.currentLineNumber || null, result);
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.message.includes('fetch failed')) {
      throw new Error(`Connection refused to ${remote.url} - is the remote service running?`);
    }

    interpreter.variables.set('RC', 1);
    interpreter.variables.set('ERRORTEXT', error.message);
    throw error;
  }
}

/**
 * Execute a quoted string command with ADDRESS handling
 * @param {Object} command - The command object with value property
 * @param {Object} interpreter - The interpreter context (`this`)
 */
async function executeQuotedString(command) {
  const interpreter = this;
  const commandString = command.value;

  // Check if there's an active ADDRESS target
  if (interpreter.address && interpreter.address !== 'default') {
    // Check if this is a remote HTTP endpoint
    if (interpreter.addressRemoteEndpoints && interpreter.addressRemoteEndpoints[interpreter.address]) {
      const remote = interpreter.addressRemoteEndpoints[interpreter.address];
      return await executeRemoteCommand(interpreter, commandString, remote, command);
    }

    const addressTarget = interpreter.addressTargets.get(interpreter.address);
    
    if (addressTarget && addressTarget.handler) {
      let finalCommandString = commandString;

      // Conditionally interpolate based on library metadata
      if (addressTarget.metadata?.libraryMetadata?.interpreterHandlesInterpolation) {
        finalCommandString = await interpreter.interpolateString(commandString);
      }

      try {
        // Execute the command string via the ADDRESS target handler
        // Pass interpreter variables as context for variable resolution
        const context = Object.fromEntries(interpreter.variables);
        // Add matching pattern to context if available
        // Pass source context for error reporting
        const sourceContext = {
          lineNumber: interpreter.currentLineNumber || null,
          sourceLine: (interpreter.currentLineNumber && interpreter.sourceLines) ? (interpreter.sourceLines[interpreter.currentLineNumber - 1] || '') : '',
          sourceFilename: interpreter.sourceFilename || '',
          interpreter: interpreter,
          interpolation: interpreter.interpolation || null
        };
        const result = await addressTarget.handler(finalCommandString, context, sourceContext);
        
        // Set standard REXX variables for ADDRESS operations
        if (result && typeof result === 'object') {
          interpreter.variables.set('RC', result.success ? 0 : (result.errorCode || 1));
          // Only set RESULT if the ADDRESS target explicitly provides output
          // Don't overwrite RESULT for operations like EXPECTATIONS that shouldn't affect it
          if (interpreter.address !== 'expectations') {
            // Extract appropriate content for RESULT variable following REXX conventions
            let resultValue = result;
            if (result && typeof result === 'object') {
              // Prefer output, then message, then echo, then the whole object
              // Use !== undefined to handle empty strings correctly
              if (result.output !== undefined) {
                resultValue = result.output;
              } else if (result.message !== undefined) {
                resultValue = result.message;
              } else if (result.echo !== undefined) {
                resultValue = result.echo;
              }
            }
            interpreter.variables.set('RESULT', resultValue);
          }
          if (!result.success && result.errorMessage) {
            interpreter.variables.set('ERRORTEXT', result.errorMessage);
          }
          
          // Handle operation-specific result processing (can be overridden by subclasses)
          interpreter.handleOperationResult(result);
          
          // Set domain-specific variables requested by ADDRESS target
          if (result.rexxVariables && typeof result.rexxVariables === 'object') {
            for (const [varName, varValue] of Object.entries(result.rexxVariables)) {
              interpreter.variables.set(varName, varValue);
            }
          }
        } else {
          interpreter.variables.set('RC', 0);
          interpreter.variables.set('RESULT', result);
        }
        
        interpreter.addTraceOutput(`"${finalCommandString}"`, 'address_command', command.lineNumber || interpreter.currentLineNumber || null, result);
      } catch (error) {
        // Set error state
        interpreter.variables.set('RC', 1);
        interpreter.variables.set('ERRORTEXT', error.message);
        throw error;
      }
    } else {
      // No ADDRESS target handler, fall back to RPC
      try {
        const interpolated = await interpreter.interpolateString(commandString);
        // If no sender/handler is available in this environment, treat as echo to output
        let result;
        if (interpreter.addressSender && typeof interpreter.addressSender.send === 'function') {
          result = await interpreter.addressSender.send(interpreter.address, 'execute', { command: interpolated });
        } else {
          // Minimal local echo behavior helps tests without network/mock sender
          result = { success: true, output: interpolated };
        }
        interpreter.variables.set('RC', 0);
        interpreter.variables.set('RESULT', result);
        interpreter.addTraceOutput(`"${interpolated}"`, 'address_command', command.lineNumber || interpreter.currentLineNumber || null, result);
      } catch (error) {
        interpreter.variables.set('RC', 1);
        interpreter.variables.set('ERRORTEXT', error.message);
        throw error;
      }
    }
  } else {
    // No ADDRESS target set - perform string interpolation and output
    const interpolated = await interpreter.interpolateString(commandString);
    interpreter.outputHandler.output(interpolated);
  }
}

/**
 * Execute a heredoc string command with ADDRESS handling
 * @param {Object} command - The command object with value and delimiter properties
 * @param {Object} interpreter - The interpreter context (`this`)
 */
async function executeHeredocString(command) {
  const interpreter = this;
  const commandString = command.value;
  
  // Check if there's an active ADDRESS target
  if (interpreter.address && interpreter.address !== 'default') {
    const addressTarget = interpreter.addressTargets.get(interpreter.address);
    
    if (addressTarget && addressTarget.handler) {
      let finalCommandString = commandString;

      // Conditionally interpolate based on library metadata
      if (addressTarget.metadata?.libraryMetadata?.interpreterHandlesInterpolation) {
        finalCommandString = await interpreter.interpolateString(commandString);
      }

      try {
        // Execute the command string via the ADDRESS target handler
        // Pass interpreter variables as context for variable resolution
        const context = Object.fromEntries(interpreter.variables);
        // Add matching pattern to context if available
        // Pass source context for error reporting
    const sourceContext = {
      lineNumber: interpreter.currentLineNumber || null,
      sourceLine: (interpreter.currentLineNumber && interpreter.sourceLines) ? (interpreter.sourceLines[interpreter.currentLineNumber - 1] || '') : '',
      sourceFilename: interpreter.sourceFilename || '',
      interpreter: interpreter,
      interpolation: interpreter.interpolation || null
    };
        const result = await addressTarget.handler(finalCommandString, context, sourceContext);
        
        // Set standard REXX variables for ADDRESS operations
        if (result && typeof result === 'object') {
          interpreter.variables.set('RC', result.success ? 0 : (result.errorCode || 1));
          // Only set RESULT if the ADDRESS target explicitly provides output
          // Don't overwrite RESULT for operations like EXPECTATIONS that shouldn't affect it
          if (interpreter.address !== 'expectations') {
            // Extract appropriate content for RESULT variable following REXX conventions
            let resultValue = result;
            if (result && typeof result === 'object') {
              // Prefer output, then message, then echo, then the whole object
              // Use !== undefined to handle empty strings correctly
              if (result.output !== undefined) {
                resultValue = result.output;
              } else if (result.message !== undefined) {
                resultValue = result.message;
              } else if (result.echo !== undefined) {
                resultValue = result.echo;
              }
            }
            interpreter.variables.set('RESULT', resultValue);
          }
          if (!result.success && result.errorMessage) {
            interpreter.variables.set('ERRORTEXT', result.errorMessage);
          }
          
          // Handle operation-specific result processing (can be overridden by subclasses)
          interpreter.handleOperationResult(result);
          
          // Set domain-specific variables requested by ADDRESS target
          if (result.rexxVariables && typeof result.rexxVariables === 'object') {
            for (const [varName, varValue] of Object.entries(result.rexxVariables)) {
              interpreter.variables.set(varName, varValue);
            }
          }
        } else {
          interpreter.variables.set('RC', 0);
          interpreter.variables.set('RESULT', result);
        }
        
        interpreter.addTraceOutput(`<<${command.delimiter}`, 'address_heredoc', command.lineNumber || interpreter.currentLineNumber || null, result);
      } catch (error) {
        // Set error state
        interpreter.variables.set('RC', 1);
        interpreter.variables.set('ERRORTEXT', error.message);
        throw error;
      }
    } else {
      // No ADDRESS target handler, fall back to RPC
      try {
        const interpolated = await interpreter.interpolateString(commandString);
        let result;
        if (interpreter.addressSender && typeof interpreter.addressSender.send === 'function') {
          result = await interpreter.addressSender.send(interpreter.address, 'execute', { command: interpolated });
        } else {
          result = { success: true, output: interpolated };
        }
        interpreter.variables.set('RC', 0);
        interpreter.variables.set('RESULT', result);
        interpreter.addTraceOutput(`<<${command.delimiter}`, 'address_heredoc', command.lineNumber || interpreter.currentLineNumber || null, result);
      } catch (error) {
        interpreter.variables.set('RC', 1);
        interpreter.variables.set('ERRORTEXT', error.message);
        throw error;
      }
    }
  } else {
    // No ADDRESS target set - perform string interpolation and output
    const interpolated = await interpreter.interpolateString(commandString);
    interpreter.outputHandler.output(interpolated);
  }
}

// UMD pattern for both Node.js and browser compatibility
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = {
        registerAddressTarget,
        executeQuotedString,
        executeHeredocString
    };
} else if (typeof window !== 'undefined') {
    // Browser environment - register in registry to avoid conflicts
    if (!window.rexxModuleRegistry) {
        window.rexxModuleRegistry = new Map();
    }
    if (!window.rexxModuleRegistry.has('addressHandling')) {
        window.rexxModuleRegistry.set('addressHandling', {
            registerAddressTarget,
            executeQuotedString,
            executeHeredocString
        });
    }
}
