#!/usr/bin/env node
'use strict';

/**
 * @fileoverview Node.js Terminal REPL for RexxJS
 *
 * Interactive REPL for executing REXX commands in a terminal environment.
 * This provides a command-line interface similar to the web REPL but without
 * DOM dependencies and WASM requirements.
 *
 * Features:
 * - Interactive command execution
 * - Command history (up/down arrows)
 * - REQUIRE support using fetch API
 * - Works in pkg executables without npm
 * - No DOM interop
 *
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const readline = require('readline');
const path = require('path');

// Deterministic path resolution for pkg support
const isPkg = typeof process.pkg !== 'undefined';
const requirePath = isPkg
  ? (mod) => path.join(__dirname, mod)
  : (mod) => './' + mod;

const { parse } = require(requirePath('parser'));
const { RexxInterpreter } = require(requirePath('interpreter'));

/**
 * Colors for terminal output
 */
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

/**
 * Format colored output
 */
function colorize(text, color) {
  return `${color}${text}${colors.reset}`;
}

/**
 * Node.js REPL class
 */
class RexxNodeREPL {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.interpreter = null;
    this.commandHistory = [];
    this.historyIndex = -1;
    this.multilineBuffer = [];
    this.inMultilineMode = false;

    // Create readline interface
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: this.getPrompt(),
      historySize: 100,
      terminal: true,
    });

    // Setup history navigation
    this.setupHistoryNavigation();

    // Handle SIGINT (Ctrl+C)
    this.rl.on('SIGINT', () => {
      if (this.inMultilineMode) {
        this.inMultilineMode = false;
        this.multilineBuffer = [];
        console.log('\n' + colorize('Multiline input cancelled', colors.yellow));
        this.rl.setPrompt(this.getPrompt());
        this.rl.prompt();
      } else {
        console.log('\n' + colorize('Use .exit or Ctrl+D to exit', colors.dim));
        this.rl.prompt();
      }
    });

    // Handle line input
    this.rl.on('line', async (line) => {
      await this.handleLine(line);
    });

    // Handle close
    this.rl.on('close', () => {
      console.log('\n' + colorize('Goodbye!', colors.cyan));
      process.exit(0);
    });
  }

  /**
   * Get the prompt string based on mode
   */
  getPrompt() {
    if (this.inMultilineMode) {
      return colorize('...> ', colors.dim);
    }
    return colorize('rexx> ', colors.green);
  }

  /**
   * Setup arrow key history navigation
   */
  setupHistoryNavigation() {
    // Note: readline module handles history automatically with up/down arrows
    // We just need to maintain our commandHistory for reference
  }

  /**
   * Display welcome banner
   */
  showWelcome() {
    console.log(colorize('╔════════════════════════════════════════════════╗', colors.cyan));
    console.log(colorize('║       RexxJS Terminal REPL (Node.js)           ║', colors.cyan));
    console.log(colorize('║                                                ║', colors.cyan));
    console.log(colorize('║  Type REXX commands and press Enter            ║', colors.cyan));
    console.log(colorize('║  Special commands:                             ║', colors.cyan));
    console.log(colorize('║    .help    - Show help                        ║', colors.cyan));
    console.log(colorize('║    .exit    - Exit REPL                        ║', colors.cyan));
    console.log(colorize('║    .clear   - Clear screen                     ║', colors.cyan));
    console.log(colorize('║    .reset   - Reset interpreter                ║', colors.cyan));
    console.log(colorize('║    .vars    - Show variables                   ║', colors.cyan));
    console.log(colorize('║                                                ║', colors.cyan));
    console.log(colorize('║  Use Ctrl+C to cancel, Ctrl+D to exit          ║', colors.cyan));
    console.log(colorize('╚════════════════════════════════════════════════╝', colors.cyan));
    console.log('');
  }

  /**
   * Handle a line of input
   */
  async handleLine(line) {
    const trimmed = line.trim();

    // Handle special commands
    if (trimmed.startsWith('.')) {
      this.handleSpecialCommand(trimmed);
      this.rl.prompt();
      return;
    }

    // Handle empty lines
    if (!trimmed) {
      this.rl.prompt();
      return;
    }

    // Check for multiline continuation
    if (this.needsMoreInput(trimmed)) {
      this.inMultilineMode = true;
      this.multilineBuffer.push(line);
      this.rl.setPrompt(this.getPrompt());
      this.rl.prompt();
      return;
    }

    // Build complete command
    let command;
    if (this.inMultilineMode) {
      this.multilineBuffer.push(line);
      command = this.multilineBuffer.join('\n');
      this.multilineBuffer = [];
      this.inMultilineMode = false;
      this.rl.setPrompt(this.getPrompt());
    } else {
      command = line;
    }

    // Add to history
    if (command.trim()) {
      this.commandHistory.push(command);
    }

    // Execute command
    await this.executeCommand(command);

    this.rl.prompt();
  }

  /**
   * Check if input needs more lines (multiline detection)
   */
  needsMoreInput(line) {
    // Simple heuristic: if line ends with certain keywords, expect continuation
    const continuationKeywords = ['THEN', 'DO', 'ELSE'];
    const upper = line.toUpperCase().trim();

    for (const keyword of continuationKeywords) {
      if (upper.endsWith(keyword)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Handle special REPL commands
   */
  handleSpecialCommand(command) {
    const cmd = command.toLowerCase();

    switch (cmd) {
      case '.help':
        this.showHelp();
        break;

      case '.exit':
      case '.quit':
        console.log(colorize('Goodbye!', colors.cyan));
        process.exit(0);
        break;

      case '.clear':
        console.clear();
        this.showWelcome();
        break;

      case '.reset':
        this.interpreter = null;
        console.log(colorize('Interpreter reset', colors.yellow));
        break;

      case '.vars':
        this.showVariables();
        break;

      default:
        console.log(colorize(`Unknown command: ${command}`, colors.red));
        console.log(colorize('Type .help for available commands', colors.dim));
    }
  }

  /**
   * Show help information
   */
  showHelp() {
    console.log('');
    console.log(colorize('RexxJS Terminal REPL - Help', colors.bright));
    console.log(colorize('═══════════════════════════════', colors.dim));
    console.log('');
    console.log(colorize('REXX Commands:', colors.yellow));
    console.log('  SAY "Hello"              - Print output');
    console.log('  x = 42                   - Assign variable');
    console.log('  REQUIRE "module"         - Load library');
    console.log('  IF x > 10 THEN SAY "Big" - Conditional');
    console.log('');
    console.log(colorize('Special Commands:', colors.yellow));
    console.log('  .help      - Show this help');
    console.log('  .exit      - Exit REPL');
    console.log('  .clear     - Clear screen');
    console.log('  .reset     - Reset interpreter state');
    console.log('  .vars      - Show current variables');
    console.log('');
    console.log(colorize('Examples:', colors.yellow));
    console.log('  rexx> SAY "Hello, World!"');
    console.log('  rexx> x = 1 + 2 + 3');
    console.log('  rexx> SAY x');
    console.log('  rexx> REQUIRE "registry:org.rexxjs/r-graphics-functions"');
    console.log('');
  }

  /**
   * Show current variables
   */
  showVariables() {
    if (!this.interpreter) {
      console.log(colorize('No interpreter instance yet', colors.yellow));
      return;
    }

    const vars = this.interpreter.variables;
    if (!vars || vars.size === 0) {
      console.log(colorize('No variables defined', colors.dim));
      return;
    }

    console.log('');
    console.log(colorize('Current Variables:', colors.yellow));
    console.log(colorize('═════════════════', colors.dim));

    // Convert Map to sorted entries
    const entries = Array.from(vars.entries()).sort((a, b) => a[0].localeCompare(b[0]));

    for (const [name, value] of entries) {
      // Format value for display
      let displayValue = value;
      if (typeof value === 'string') {
        displayValue = `"${value}"`;
      } else if (typeof value === 'object') {
        displayValue = JSON.stringify(value);
      }

      console.log(`  ${colorize(name, colors.cyan)} = ${displayValue}`);
    }
    console.log('');
  }

  /**
   * Execute a REXX command
   */
  async executeCommand(command) {
    if (!command.trim()) return;

    try {
      // Create or reuse interpreter instance
      if (!this.interpreter) {
        this.interpreter = new RexxInterpreter(null, {
          output: (text) => {
            // Output from SAY statements
            console.log(text);
          }
        });

        if (this.verbose) {
          console.log(colorize('[Interpreter created]', colors.dim));
        }
      }

      // Parse and execute command
      // Pass a sourceFilename based on CWD to enable relative path resolution
      const commands = parse(command);
      const sourceFilename = path.join(process.cwd(), '<repl>');
      await this.interpreter.run(commands, null, sourceFilename);

    } catch (error) {
      // Display error
      console.log(colorize(`Error: ${error.message}`, colors.red));

      if (this.verbose && error.stack) {
        console.log(colorize('Stack trace:', colors.dim));
        console.log(colorize(error.stack, colors.dim));
      }
    }
  }

  /**
   * Start the REPL
   */
  start() {
    this.showWelcome();
    this.rl.prompt();
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  const options = {
    verbose: args.includes('--verbose') || args.includes('-v'),
  };

  // Show help if requested
  if (args.includes('--help') || args.includes('-h')) {
    console.log('RexxJS Terminal REPL - Node.js Interactive Shell');
    console.log('');
    console.log('Usage: rexx-repl [options]');
    console.log('');
    console.log('Options:');
    console.log('  --help, -h      Show this help message');
    console.log('  --verbose, -v   Show verbose output');
    console.log('');
    console.log('Examples:');
    console.log('  rexx-repl                Start interactive REPL');
    console.log('  rexx-repl --verbose      Start with verbose mode');
    console.log('');
    return;
  }

  // Create and start REPL
  const repl = new RexxNodeREPL(options);
  repl.start();
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = { RexxNodeREPL };
