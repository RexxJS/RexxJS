(function() {
'use strict';

/**
 * ADDRESS command handling for REXX interpreter
 *
 * This module provides browser/Node.js compatible functions for managing
 * and executing commands sent to different ADDRESS targets.
 */

// Placeholder for dependencies

/**
 * Executes a quoted string command directed to the current ADDRESS target.
 * @param {object} command - The command object.
 * @param {object} context - The interpreter context (`this`).
 */
async function executeQuotedString(command) {
    const commandString = command.value;

    // Check if there's an active ADDRESS target
    if (this.address && this.address !== 'default') {
      const addressTarget = this.addressTargets.get(this.address);

      if (addressTarget && addressTarget.handler) {
        let finalCommandString = commandString;

        // Conditionally interpolate based on library metadata
        if (addressTarget.metadata?.libraryMetadata?.interpreterHandlesInterpolation) {
          finalCommandString = await this.interpolateString(commandString);
        }

        try {
          // Execute the command string via the ADDRESS target handler
          // Pass interpreter variables as context for variable resolution
          const context = Object.fromEntries(this.variables);
          // Add matching pattern to context if available
          // Pass source context for error reporting
          const sourceContext = this.currentLineNumber ? {
            lineNumber: this.currentLineNumber,
            sourceLine: this.sourceLines[this.currentLineNumber - 1] || '',
            sourceFilename: this.sourceFilename || '',
            interpreter: this,
                    interpolation: interpolation
          } : null;
          const result = await addressTarget.handler(finalCommandString, context, sourceContext);

          // Set standard REXX variables for ADDRESS operations
          if (result && typeof result === 'object') {
            this.variables.set('RC', result.success ? 0 : (result.errorCode || 1));
            // Only set RESULT if the ADDRESS target explicitly provides output
            // Don't overwrite RESULT for operations like EXPECTATIONS that shouldn't affect it
            if (this.address !== 'expectations') {
              this.variables.set('RESULT', result);
            }
            if (!result.success && result.errorMessage) {
              this.variables.set('ERRORTEXT', result.errorMessage);
            }

            // Handle operation-specific result processing (can be overridden by subclasses)
            this.handleOperationResult(result);

            // Set domain-specific variables requested by ADDRESS target
            if (result.rexxVariables && typeof result.rexxVariables === 'object') {
              for (const [varName, varValue] of Object.entries(result.rexxVariables)) {
                this.variables.set(varName, varValue);
              }
            }
          } else {
            this.variables.set('RC', 0);
            this.variables.set('RESULT', result);
          }

          this.addTraceOutput(`"${finalCommandString}"`, 'address_command', null, result);
        } catch (error) {
          // Set error state
          this.variables.set('RC', 1);
          this.variables.set('ERRORTEXT', error.message);
          throw error;
        }
      } else {
        // No ADDRESS target handler, fall back to RPC
        try {
          const interpolated = await this.interpolateString(commandString);
          const result = await this.addressSender.send(this.address, 'execute', { command: interpolated });
          this.variables.set('RC', 0);
          this.variables.set('RESULT', result);
          this.addTraceOutput(`"${interpolated}"`, 'address_command', null, result);
        } catch (error) {
          this.variables.set('RC', 1);
          this.variables.set('ERRORTEXT', error.message);
          throw error;
        }
      }
    } else {
      // No ADDRESS target set - perform string interpolation and output
      const interpolated = await this.interpolateString(commandString);
      this.outputHandler.output(interpolated);
    }
}

/**
 * Executes a heredoc string command directed to the current ADDRESS target.
 * @param {object} command - The command object.
 * @param {object} context - The interpreter context (`this`).
 */
async function executeHeredocString(command) {
    const commandString = command.value;

    // Check if there's an active ADDRESS target
    if (this.address && this.address !== 'default') {
      const addressTarget = this.addressTargets.get(this.address);

      if (addressTarget && addressTarget.handler) {
        let finalCommandString = commandString;

        // Conditionally interpolate based on library metadata
        if (addressTarget.metadata?.libraryMetadata?.interpreterHandlesInterpolation) {
          finalCommandString = await this.interpolateString(commandString);
        }

        try {
          // Execute the command string via the ADDRESS target handler
          // Pass interpreter variables as context for variable resolution
          const context = Object.fromEntries(this.variables);
          // Add matching pattern to context if available
          // Pass source context for error reporting
          const sourceContext = this.currentLineNumber ? {
            lineNumber: this.currentLineNumber,
            sourceLine: this.sourceLines[this.currentLineNumber - 1] || '',
            sourceFilename: this.sourceFilename || '',
            interpreter: this,
                    interpolation: interpolation
          } : null;
          const result = await addressTarget.handler(finalCommandString, context, sourceContext);

          // Set standard REXX variables for ADDRESS operations
          if (result && typeof result === 'object') {
            this.variables.set('RC', result.success ? 0 : (result.errorCode || 1));
            // Only set RESULT if the ADDRESS target explicitly provides output
            // Don't overwrite RESULT for operations like EXPECTATIONS that shouldn't affect it
            if (this.address !== 'expectations') {
              this.variables.set('RESULT', result);
            }
            if (!result.success && result.errorMessage) {
              this.variables.set('ERRORTEXT', result.errorMessage);
            }

            // Handle operation-specific result processing (can be overridden by subclasses)
            this.handleOperationResult(result);

            // Set domain-specific variables requested by ADDRESS target
            if (result.rexxVariables && typeof result.rexxVariables === 'object') {
              for (const [varName, varValue] of Object.entries(result.rexxVariables)) {
                this.variables.set(varName, varValue);
              }
            }
          } else {
            this.variables.set('RC', 0);
            this.variables.set('RESULT', result);
          }

          this.addTraceOutput(`<<${command.delimiter}`, 'address_heredoc', null, result);
        } catch (error) {
          // Set error state
          this.variables.set('RC', 1);
          this.variables.set('ERRORTEXT', error.message);
          throw error;
        }
      } else {
        // No ADDRESS target handler, fall back to RPC
        try {
          const interpolated = await this.interpolateString(commandString);
          const result = await this.addressSender.send(this.address, 'execute', { command: interpolated });
          this.variables.set('RC', 0);
          this.variables.set('RESULT', result);
          this.addTraceOutput(`<<${command.delimiter}`, 'address_heredoc', null, result);
        } catch (error) {
          this.variables.set('RC', 1);
          this.variables.set('ERRORTEXT', error.message);
          throw error;
        }
      }
    } else {
      // No ADDRESS target set - perform string interpolation and output
      const interpolated = await this.interpolateString(commandString);
      this.outputHandler.output(interpolated);
    }
}

/**
 * Registers a new ADDRESS target handler.
 * @param {string} name - The name of the address target.
 * @param {object} target - The target object containing the handler.
 * @param {object} context - The interpreter context (`this`).
 */
function registerAddressTarget(name, target) {
    this.addressTargets.set(name, target);
}


// UMD pattern for both Node.js and browser compatibility
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = {
        executeQuotedString,
        executeHeredocString,
        registerAddressTarget
    };
} else if (typeof window !== 'undefined') {
    // Browser environment - register in registry to avoid conflicts
    if (!window.rexxModuleRegistry) {
        window.rexxModuleRegistry = new Map();
    }
    if (!window.rexxModuleRegistry.has('addressHandling')) {
        window.rexxModuleRegistry.set('addressHandling', {
            executeQuotedString,
            executeHeredocString,
            registerAddressTarget
        });
    }
}

})(); // End IIFE
