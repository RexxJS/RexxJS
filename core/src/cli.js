#!/usr/bin/env node
'use strict';

/**
 * @fileoverview Node.js CLI wrapper for running REXX scripts
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

const fs = require('fs');
const path = require('path');

// Deterministic path resolution based on execution mode
// - nodejs: relative paths from current file location
// - pkg: absolute paths from cli.js location in snapshot
const isPkg = typeof process.pkg !== 'undefined';
const requirePath = isPkg
  ? (mod) => path.join(__dirname, 'src', mod)
  : (mod) => './' + mod;

const { executeScript } = require(requirePath('executor'));
const { ADDRESS_EXPECTATIONS_HANDLER } = require(requirePath('expectations-address.js'));
const { NodeOutputHandler } = require(requirePath('output/node-output-handler.js'));

// Address sender for CLI execution
class CLIAddressSender {
  constructor(outputHandler) {
    this.outputHandler = outputHandler;
    // ADDRESS handlers should be loaded via REQUIRE statements in user scripts
    // e.g., REQUIRE "registry:org.rexxjs/ssh-address"
  }
  
  async send(address, command, params = {}) {
    // Handle expectation commands
    if (address.toUpperCase() === 'EXPECTATIONS') {
      const result = await ADDRESS_EXPECTATIONS_HANDLER(command, params);
      if (!result.success) {
        // Throw an error to be caught by the main try...catch block
        throw new Error(result.error);
      }
      return result;
    }

    // Special case: ignore common 'default' ADDRESS calls from script parsing
    if (address === 'default') {
      return { status: 'ignored', result: 'Default ADDRESS call ignored' };
    }

    // ADDRESS handlers should be registered via REQUIRE statements in user scripts
    // e.g., REQUIRE "registry:org.rexxjs/ssh-address"
    // The interpreter's ADDRESS system will route to registered handlers

    // In CLI mode, missing ADDRESS handlers should be an error
    const error = new Error(`ADDRESS handler '${address}' not found. No external services available in CLI mode.`);
    error.address = address;
    error.command = command;
    error.params = params;
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const isTestRunner = process.env.REXXJS_TEST_RUNNER === 'true';

  // Delegate immediately to test runner if in test mode
  if (isTestRunner) {
    const { main: runTests } = require(requirePath('test-runner-cli.js'));
    return runTests();
  }

  // Check for --stdin flag
  const stdinMode = args.includes('--stdin');

  // Regular script mode continues below
  if (args.length === 0 && !stdinMode) {
    console.error('Usage: node cli.js <script.rexx> [options]');
    console.error('       node cli.js --stdin [options]');
    console.error('');
    console.error('Options:');
    console.error('  --help, -h    Show this help message');
    console.error('  --verbose, -v Show verbose output');
    console.error('  --stdin       Read script from standard input');
    console.error('');
    console.error('Examples:');
    console.error('  node cli.js tests/scripts/simple-command.rexx');
    console.error('  node cli.js my-script.rexx --verbose');
    process.exit(1);
  }

  if (args.includes('--help') || args.includes('-h')) {
    console.log('RexxJS REXX Script Runner - Node.js CLI');
    console.log('');
    console.log('This tool runs REXX scripts locally using the RexxJS interpreter.');
    console.log('Note: External services (DOM, file system, etc.) are mocked for local execution.');
    console.log('');
    console.log('Usage: node cli.js <script.rexx> [options]');
    console.log('       node cli.js --stdin [options]');
    console.log('');
    console.log('Options:');
    console.log('  --help, -h    Show this help message');
    console.log('  --verbose, -v Show verbose output');
    console.log('  --stdin       Read script from standard input');
    console.log('');
    console.log('Examples:');
    console.log('  node cli.js tests/scripts/simple-command.rexx');
    console.log('  node cli.js my-script.rexx --verbose');
    console.log('  echo "SAY \'Hello\'" | node cli.js --stdin');
    console.log('  cat script.rexx | ssh vm "rexx --stdin"');
    return;
  }

  const verbose = args.includes('--verbose') || args.includes('-v');
  let scriptPath = null;
  let scriptContent = null;

  // Handle --stdin mode
  if (stdinMode) {
    if (verbose) {
      console.log('Reading REXX script from stdin...');
    }

    // Read from stdin
    scriptContent = await new Promise((resolve, reject) => {
      const chunks = [];
      process.stdin.on('data', chunk => chunks.push(chunk));
      process.stdin.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      process.stdin.on('error', reject);
    });

    scriptPath = '<stdin>'; // Placeholder for error messages
  } else {
    scriptPath = path.resolve(args[0]);

    if (!fs.existsSync(scriptPath)) {
      console.error(`Error: Script file not found: ${scriptPath}`);
      process.exit(1);
    }
  }

  // Regular script execution mode
  // Collect KEY=VALUE pairs after the script path for interpolation context
  const cliVars = new Map();
  const startIndex = stdinMode ? 0 : 1; // Skip first arg if not stdin mode
  for (let i = startIndex; i < args.length; i++) {
    const a = args[i];
    if (a === '--verbose' || a === '-v' || a === '--stdin') continue;
    const eq = a.indexOf('=');
    if (eq > 0) {
      const key = a.slice(0, eq);
      const value = a.slice(eq + 1);
      cliVars.set(key, value);
    }
  }

  try {
    if (verbose && !stdinMode) {
      console.log(`Reading REXX script: ${scriptPath}`);
    }

    // Read script content if not already read from stdin
    if (!scriptContent) {
      scriptContent = fs.readFileSync(scriptPath, 'utf8');
    }

    if (verbose) {
      console.log('Script content:');
      console.log('----------------------------------------');
      console.log(scriptContent);
      console.log('----------------------------------------');
      console.log('Executing...');
      console.log('');
    }

    const outputHandler = new NodeOutputHandler();
    const addressSender = new CLIAddressSender(outputHandler);
    // Attach variables for ADDRESS handlers to interpolate {KEY}
    addressSender.variables = cliVars;

    // Positional args for PARSE ARG: everything after script path that is not KEY=VALUE
    const positional = [];
    for (let i = startIndex; i < args.length; i++) {
      const a = args[i];
      if (a === '--verbose' || a === '-v' || a === '--stdin') continue;
      if (a.includes('=')) continue; // skip KEY=VALUE pairs
      positional.push(a);
    }

    const interpreter = await executeScript(scriptContent, addressSender, positional, scriptPath, outputHandler);
    // The script's EXIT code is the process's (set, not process.exit(), so
    // pending output is written first)
    process.exitCode = interpreter.exitCode;

    if (verbose) {
      console.log('');
      console.log('Execution completed successfully!');
      console.log('Final variables:', interpreter.variables);
    }

  } catch (error) {
    console.error('Error executing script:', error.message);
    if (verbose) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Handle uncaught exceptions gracefully
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = { main };
