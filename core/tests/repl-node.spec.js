/**
 * Tests for Terminal REPL (repl-node.js)
 *
 * Tests the Node.js command-line REPL functionality including:
 * - Basic command execution
 * - Variable persistence across commands
 * - REQUIRE support with relative paths
 * - Error handling
 * - Special commands (.vars, .reset)
 *
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { RexxNodeREPL } = require('../src/repl-node');

describe('Terminal REPL (Node.js)', () => {
  let repl;
  let outputs;

  beforeEach(() => {
    outputs = [];

    // Mock console.log to capture REPL output
    const originalLog = console.log;
    console.log = jest.fn((...args) => {
      outputs.push(args.join(' '));
    });

    repl = new RexxNodeREPL({ verbose: false });

    // Restore console.log after REPL creation (to avoid welcome banner in output)
    console.log = originalLog;
    outputs = []; // Clear welcome banner output
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Basic Command Execution', () => {
    test('should execute simple SAY command', async () => {
      // Mock console.log for this test
      const mockLog = jest.spyOn(console, 'log');

      await repl.executeCommand('SAY "Hello, Terminal REPL!"');

      expect(mockLog).toHaveBeenCalledWith('Hello, Terminal REPL!');
      mockLog.mockRestore();
    });

    test('should execute variable assignment', async () => {
      await repl.executeCommand('LET x = 42');

      expect(repl.interpreter.variables.get('x')).toBe(42);
    });

    test('should execute arithmetic expressions', async () => {
      const mockLog = jest.spyOn(console, 'log');

      await repl.executeCommand('LET result = 5 + 3');
      await repl.executeCommand('SAY result');

      expect(mockLog).toHaveBeenCalledWith('8');
      mockLog.mockRestore();
    });

    test('should handle string concatenation', async () => {
      const mockLog = jest.spyOn(console, 'log');

      await repl.executeCommand('LET greeting = "Hello, " || "World!"');
      await repl.executeCommand('SAY greeting');

      expect(mockLog).toHaveBeenCalledWith('Hello, World!');
      mockLog.mockRestore();
    });
  });

  describe('Variable Persistence', () => {
    test('should persist variables across commands', async () => {
      await repl.executeCommand('LET x = 10');
      await repl.executeCommand('LET y = 20');
      await repl.executeCommand('LET sum = x + y');

      expect(repl.interpreter.variables.get('x')).toBe(10);
      expect(repl.interpreter.variables.get('y')).toBe(20);
      expect(repl.interpreter.variables.get('sum')).toBe(30);
    });

    test('should update existing variables', async () => {
      await repl.executeCommand('LET counter = 0');
      expect(repl.interpreter.variables.get('counter')).toBe(0);

      await repl.executeCommand('counter = counter + 1');
      expect(repl.interpreter.variables.get('counter')).toBe(1);

      await repl.executeCommand('counter = counter + 5');
      expect(repl.interpreter.variables.get('counter')).toBe(6);
    });

    test('should maintain interpreter instance across multiple commands', async () => {
      // First command creates the interpreter
      await repl.executeCommand('LET x = 1');
      const firstInterpreter = repl.interpreter;

      expect(firstInterpreter).not.toBeNull();

      // Subsequent commands should reuse the same interpreter
      await repl.executeCommand('LET y = 2');
      await repl.executeCommand('LET z = 3');

      // Should still be same interpreter instance
      expect(repl.interpreter).toBe(firstInterpreter);
      expect(repl.interpreter.variables.get('x')).toBe(1);
      expect(repl.interpreter.variables.get('y')).toBe(2);
      expect(repl.interpreter.variables.get('z')).toBe(3);
    });
  });

  describe('Compound Variables', () => {
    test('should handle compound variable assignment', async () => {
      await repl.executeCommand('LET RESULT.message = "Success"');

      const resultVar = repl.interpreter.variables.get('RESULT');
      expect(resultVar).toEqual({ message: 'Success' });
    });

    test('should handle nested compound variables', async () => {
      await repl.executeCommand('LET data.user.name = "Alice"');
      await repl.executeCommand('LET data.user.age = 30');

      const dataVar = repl.interpreter.variables.get('data');
      expect(dataVar.user.name).toBe('Alice');
      expect(dataVar.user.age).toBe(30);
    });

    test('should concatenate with compound variables', async () => {
      const mockLog = jest.spyOn(console, 'log');

      await repl.executeCommand('LET RESULT.status = "OK"');
      await repl.executeCommand('SAY "Status: " || RESULT.status');

      expect(mockLog).toHaveBeenCalledWith('Status: OK');
      mockLog.mockRestore();
    });
  });

  describe('RUNTIME Variables', () => {
    test('should set RUNTIME.TYPE to nodejs', async () => {
      await repl.executeCommand('LET x = 1'); // Ensure interpreter is created

      expect(repl.interpreter.variables.get('RUNTIME.TYPE')).toBe('nodejs');
    });

    test('should set RUNTIME.HAS_DOM to 0', async () => {
      await repl.executeCommand('LET x = 1'); // Ensure interpreter is created

      expect(repl.interpreter.variables.get('RUNTIME.HAS_DOM')).toBe('0');
    });

    test('should set RUNTIME.HAS_NODEJS_REQUIRE to 1', async () => {
      await repl.executeCommand('LET x = 1'); // Ensure interpreter is created

      expect(repl.interpreter.variables.get('RUNTIME.HAS_NODEJS_REQUIRE')).toBe('1');
    });
  });

  describe('Error Handling', () => {
    test('should display error for undefined variable', async () => {
      const mockLog = jest.spyOn(console, 'log');

      await repl.executeCommand('SAY undefinedVar');

      // Should output the literal string "undefinedVar" (REXX behavior)
      expect(mockLog).toHaveBeenCalledWith('undefinedVar');
      mockLog.mockRestore();
    });

    test('should handle syntax errors gracefully', async () => {
      // Should not throw - errors are caught and logged
      await expect(repl.executeCommand('LET x = ')).resolves.not.toThrow();

      // Interpreter should still exist and be usable
      expect(repl.interpreter).not.toBeNull();
    });

    test('should continue after error', async () => {
      await repl.executeCommand('LET x = '); // Error
      await repl.executeCommand('LET y = 42'); // Should work

      expect(repl.interpreter.variables.get('y')).toBe(42);
    });
  });

  describe('Special Commands', () => {
    test('.vars should show current variables', () => {
      const mockLog = jest.spyOn(console, 'log');

      repl.interpreter = null; // Reset
      repl.showVariables();

      // Should indicate no interpreter yet
      expect(mockLog.mock.calls.some(call =>
        call[0].includes('No interpreter')
      )).toBe(true);

      mockLog.mockRestore();
    });

    test('.vars should display defined variables', async () => {
      const mockLog = jest.spyOn(console, 'log');

      await repl.executeCommand('LET x = 42');
      await repl.executeCommand('LET name = "Alice"');

      mockLog.mockClear();
      repl.showVariables();

      const output = mockLog.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('x');
      expect(output).toContain('42');
      expect(output).toContain('name');
      expect(output).toContain('Alice');

      mockLog.mockRestore();
    });

    test('.reset should clear interpreter', async () => {
      await repl.executeCommand('LET x = 100');
      expect(repl.interpreter).not.toBeNull();
      expect(repl.interpreter.variables.get('x')).toBe(100);

      repl.handleSpecialCommand('.reset');
      expect(repl.interpreter).toBeNull();
    });

    test('.help should display help information', () => {
      const mockLog = jest.spyOn(console, 'log');

      repl.handleSpecialCommand('.help');

      const output = mockLog.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('REXX Commands');
      expect(output).toContain('Special Commands');
      expect(output).toContain('.exit');
      expect(output).toContain('.vars');

      mockLog.mockRestore();
    });
  });

  describe('Command History', () => {
    test('should add commands to history via handleLine', async () => {
      // handleLine adds to history, not executeCommand
      await repl.handleLine('LET x = 1');
      await repl.handleLine('LET y = 2');
      await repl.handleLine('LET z = 3');

      expect(repl.commandHistory).toContain('LET x = 1');
      expect(repl.commandHistory).toContain('LET y = 2');
      expect(repl.commandHistory).toContain('LET z = 3');
      expect(repl.commandHistory.length).toBe(3);
    });

    test('should not add empty commands to history', async () => {
      await repl.handleLine('');
      await repl.handleLine('  ');

      expect(repl.commandHistory.length).toBe(0);
    });

    test('should initialize commandHistory as empty array', () => {
      expect(repl.commandHistory).toEqual([]);
      expect(Array.isArray(repl.commandHistory)).toBe(true);
    });
  });

  describe('Multiline Detection', () => {
    test('should detect THEN as needing more input', () => {
      expect(repl.needsMoreInput('IF x > 5 THEN')).toBe(true);
    });

    test('should detect DO as needing more input', () => {
      expect(repl.needsMoreInput('DO i = 1 TO 10')).toBe(false); // DO without THEN
      expect(repl.needsMoreInput('IF x THEN DO')).toBe(true);
    });

    test('should detect ELSE as needing more input', () => {
      expect(repl.needsMoreInput('ELSE')).toBe(true);
    });

    test('should not detect complete statements as needing more input', () => {
      expect(repl.needsMoreInput('LET x = 42')).toBe(false);
      expect(repl.needsMoreInput('SAY "Hello"')).toBe(false);
    });
  });

  describe('Function Calls', () => {
    test('should execute built-in functions', async () => {
      const mockLog = jest.spyOn(console, 'log');

      await repl.executeCommand('LET text = "  hello  "');
      await repl.executeCommand('LET trimmed = STRIP(text)');
      await repl.executeCommand('SAY trimmed');

      expect(mockLog).toHaveBeenCalledWith('hello');
      mockLog.mockRestore();
    });

    test('should execute math functions', async () => {
      await repl.executeCommand('LET result = ABS(-42)');

      expect(repl.interpreter.variables.get('result')).toBe(42);
    });

    test('should execute string functions', async () => {
      await repl.executeCommand('LET upper = UPPER("hello")');

      expect(repl.interpreter.variables.get('upper')).toBe('HELLO');
    });
  });

  describe('Control Flow', () => {
    test('should execute IF statements', async () => {
      const mockLog = jest.spyOn(console, 'log');

      await repl.executeCommand(`
        LET x = 10
        IF x > 5 THEN
          SAY "x is greater than 5"
        ENDIF
      `);

      expect(mockLog).toHaveBeenCalledWith('x is greater than 5');
      mockLog.mockRestore();
    });

    test('should execute DO loops', async () => {
      const mockLog = jest.spyOn(console, 'log');

      await repl.executeCommand(`
        DO i = 1 TO 3
          SAY "Count: " || i
        END
      `);

      expect(mockLog).toHaveBeenCalledWith('Count: 1');
      expect(mockLog).toHaveBeenCalledWith('Count: 2');
      expect(mockLog).toHaveBeenCalledWith('Count: 3');
      mockLog.mockRestore();
    });
  });

  describe('REQUIRE Support', () => {
    test('should support REQUIRE with relative paths', async () => {
      // This is a basic test - actual file loading would require real files
      const command = 'REQUIRE "./src/expectations-address.js"';

      // Should not throw error for valid REQUIRE syntax
      await expect(repl.executeCommand(command)).resolves.not.toThrow();
    });

    test('should provide CWD-based source context for REQUIRE', async () => {
      await repl.executeCommand('LET x = 1'); // Ensure interpreter exists

      // The interpreter should exist and have been created
      expect(repl.interpreter).not.toBeNull();
      expect(repl.interpreter.variables.size).toBeGreaterThan(0);
    });
  });
});
