/**
 * Interpret Tests
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

/* eslint-env jest */
'use strict';

const { Interpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

describe('INTERPRET Function', () => {
  let interpreter;

  beforeEach(() => {
    // Mock Address Sender for testing
    const mockRpcClient = {
      send: jest.fn().mockResolvedValue('mock response')
    };
    interpreter = new Interpreter(mockRpcClient);
  });

  describe('Basic INTERPRET functionality', () => {
    test('should execute simple Rexx code', async () => {
      const commands = parse('LET result = INTERPRET string="LET x = 42"');
      await interpreter.run(commands);
      
      expect(interpreter.variables.get('result')).toBe(true);
      expect(interpreter.variables.get('x')).toBe(42);
    });

    test('should execute multiple commands', async () => {
      const rexxCode = 'LET a = 10\\nLET b = 20\\nLET sum = a + b';
      const commands = parse(`LET result = INTERPRET string="${rexxCode}"`);
      await interpreter.run(commands);
      
      expect(interpreter.variables.get('result')).toBe(true);
      expect(interpreter.variables.get('a')).toBe(10);
      expect(interpreter.variables.get('b')).toBe(20);
      expect(interpreter.variables.get('sum')).toBe(30);
    });

    test('should handle string functions in interpreted code', async () => {
      const rexxCode = 'LET greeting = "hello"\\nLET upper_greeting = UPPER string=greeting';
      const commands = parse(`LET result = INTERPRET string="${rexxCode}"`);
      await interpreter.run(commands);
      
      expect(interpreter.variables.get('result')).toBe(true);
      expect(interpreter.variables.get('greeting')).toBe('hello');
      expect(interpreter.variables.get('upper_greeting')).toBe('HELLO');
    });

    test('should throw error for invalid Rexx code', async () => {
      const commands = parse('LET result = INTERPRET string="LET = invalid syntax"');
      
      await expect(interpreter.run(commands)).rejects.toThrow();
    });
  });

  describe('Variable sharing (default behavior)', () => {
    test('should share all variables by default', async () => {
      // Set up initial variables
      interpreter.variables.set('initial', 'value');
      interpreter.variables.set('number', 100);
      
      const rexxCode = 'LET new_var = "created"\\nLET modified = number * 2\\nLET accessed = initial';
      const commands = parse(`LET result = INTERPRET string="${rexxCode}"`);
      await interpreter.run(commands);
      
      // Check that interpreted code could access existing variables
      expect(interpreter.variables.get('accessed')).toBe('value');
      expect(interpreter.variables.get('modified')).toBe(200);
      
      // Check that new variables are available in parent scope
      expect(interpreter.variables.get('new_var')).toBe('created');
      expect(interpreter.variables.get('result')).toBe(true);
    });

    test('should modify existing variables from interpreted code', async () => {
      interpreter.variables.set('counter', 5);
      
      const rexxCode = 'LET counter = counter + 1';
      const commands = parse(`LET result = INTERPRET string="${rexxCode}"`);
      await interpreter.run(commands);
      
      expect(interpreter.variables.get('counter')).toBe(6);
      expect(interpreter.variables.get('result')).toBe(true);
    });
  });

  describe('Variable whitelisting', () => {
    test('should only share whitelisted variables', async () => {
      // Set up initial variables
      interpreter.variables.set('allowed', 'accessible');
      interpreter.variables.set('secret', 'hidden');
      interpreter.variables.set('number', 42);
      
      const options = JSON.stringify({
        shareVars: true,
        allowedVars: ['allowed', 'number', 'result_allowed', 'result_number', 'result_secret']
      });
      
      const rexxCode = 'LET result_allowed = allowed\\nLET result_number = number\\nLET result_secret = secret';
      const commands = parse(`LET result = INTERPRET string="${rexxCode}" options='${options}'`);
      await interpreter.run(commands);
      
      // Should be able to access whitelisted variables
      expect(interpreter.variables.get('result_allowed')).toBe('accessible');
      expect(interpreter.variables.get('result_number')).toBe(42);
      
      // Should not be able to access non-whitelisted variables (would be empty string)
      expect(interpreter.variables.get('result_secret')).toBe('SECRET'); // an unset symbol's uppercase name, since secret var not available
    });

    test('should only copy back whitelisted variables', async () => {
      const options = JSON.stringify({
        shareVars: true,
        allowedVars: ['allowed_out']
      });
      
      const rexxCode = 'LET allowed_out = should_be_copied\\nLET blocked_out = should_not_be_copied';
      const commands = parse(`LET result = INTERPRET string="${rexxCode}" options='${options}'`);
      await interpreter.run(commands);
      
      // Whitelisted variable should be copied back
      expect(interpreter.variables.get('allowed_out')).toBe('SHOULD_BE_COPIED');
      
      // Non-whitelisted variable should not be copied back
      expect(interpreter.variables.get('blocked_out')).toBeUndefined();
      
      expect(interpreter.variables.get('result')).toBe(true);
    });

    test('should handle empty whitelist', async () => {
      interpreter.variables.set('existing', 'value');
      
      const options = JSON.stringify({
        shareVars: true,
        allowedVars: []
      });
      
      const rexxCode = 'LET new_var = created\\nLET accessed = existing';
      const commands = parse(`LET result = INTERPRET string="${rexxCode}" options='${options}'`);
      await interpreter.run(commands);
      
      // No variables should be shared or copied back
      expect(interpreter.variables.get('accessed')).toBeUndefined(); // not copied back due to empty whitelist
      expect(interpreter.variables.get('new_var')).toBeUndefined();
      expect(interpreter.variables.get('result')).toBe(true);
    });
  });

  describe('Variable isolation', () => {
    test('should not share variables when shareVars is false', async () => {
      interpreter.variables.set('existing', 'value');
      
      const options = JSON.stringify({
        shareVars: false
      });
      
      const rexxCode = 'LET isolated = created\\nLET accessed = existing';
      const commands = parse(`LET result = INTERPRET string="${rexxCode}" options='${options}'`);
      await interpreter.run(commands);
      
      // Variables should not be shared
      expect(interpreter.variables.get('accessed')).toBeUndefined(); // not copied back when shareVars is false
      expect(interpreter.variables.get('isolated')).toBeUndefined();
      expect(interpreter.variables.get('result')).toBe(true);
    });
  });

  describe('ADDRESS context sharing', () => {
    test('should share ADDRESS context with interpreted code', async () => {
      // Set up ADDRESS in main interpreter
      const addressCommands = parse('ADDRESS calculator');
      await interpreter.run(addressCommands);
      
      expect(interpreter.address).toBe('calculator');
      
      // INTERPRET should inherit the address
      const rexxCode = 'press button=5';
      const commands = parse(`LET result = INTERPRET string="${rexxCode}"`);
      await interpreter.run(commands);
      
      // Should have called RPC with calculator namespace
      expect(interpreter.addressSender.send).toHaveBeenCalledWith('calculator', 'press', { button: 5 });
      expect(interpreter.variables.get('result')).toBe(true);
    });
  });

  describe('Complex INTERPRET scenarios', () => {
    test('should handle nested function calls in interpreted code', async () => {
      const rexxCode = 'LET text = hello_world\\nLET substring = SUBSTR string=text start=7 length=5\\nLET result = UPPER string=substring';
      const commands = parse(`LET success = INTERPRET string="${rexxCode}"`);
      await interpreter.run(commands);
      
      expect(interpreter.variables.get('text')).toBe('HELLO_WORLD');
      expect(interpreter.variables.get('substring')).toBe('WORLD');
      expect(interpreter.variables.get('result')).toBe('WORLD');
      expect(interpreter.variables.get('success')).toBe(true);
    });

    test('should handle assignment from interpreted code results', async () => {
      const rexxCode = 'LET computed = 5 * 10';
      const commands = parse(`
        LET success = INTERPRET string="${rexxCode}"
        LET doubled = computed * 2
      `);
      await interpreter.run(commands);
      
      expect(interpreter.variables.get('computed')).toBe(50);
      expect(interpreter.variables.get('doubled')).toBe(100);
      expect(interpreter.variables.get('success')).toBe(true);
    });

    test('should handle JSON manipulation in interpreted code', async () => {
      // Set up JSON data in parent scope
      interpreter.variables.set('jsonData', JSON.stringify({name: 'John', age: 30}));
      
      const rexxCode = 'LET data = JSON_PARSE text=jsonData\\nLET name = ARRAY_GET array=data key=name';
      const commands = parse(`LET success = INTERPRET string="${rexxCode}"`);
      await interpreter.run(commands);
      
      expect(interpreter.variables.get('name')).toBe('John');
      expect(interpreter.variables.get('success')).toBe(true);
    });

    test('should handle multiple INTERPRET calls', async () => {
      // First INTERPRET
      const commands1 = parse('LET result1 = INTERPRET string="LET stage1 = first"');
      await interpreter.run(commands1);

      // Second INTERPRET that uses result from first
      const commands2 = parse('LET result2 = INTERPRET string="LET stage2 = stage1 || _second"');
      await interpreter.run(commands2);

      expect(interpreter.variables.get('stage1')).toBe('FIRST');
      expect(interpreter.variables.get('stage2')).toBe('FIRST_SECOND');
      expect(interpreter.variables.get('result1')).toBe(true);
      expect(interpreter.variables.get('result2')).toBe(true);
    });
  });

  describe('Error handling in INTERPRET', () => {
    test('should propagate parsing errors', async () => {
      const commands = parse('LET result = INTERPRET string="LET = invalid syntax"');
      
      await expect(interpreter.run(commands)).rejects.toThrow(/INTERPRET failed/);
    });

    test('should propagate runtime errors', async () => {
      // Configure mock to throw error for nonexistent function
      const mockRpcClient = {
        send: jest.fn().mockImplementation((namespace, method, params) => {
          if (method === 'NONEXISTENT_FUNCTION') {
            throw new Error('Function not found: NONEXISTENT_FUNCTION');
          }
          return 'mock response';
        })
      };
      const testInterpreter = new Interpreter(mockRpcClient);
      
      const rexxCode = 'LET result = NONEXISTENT_FUNCTION param="value"';
      const commands = parse(`LET success = INTERPRET string="${rexxCode}"`);
      
      await expect(testInterpreter.run(commands)).rejects.toThrow();
    });

    test('should handle invalid options gracefully', async () => {
      const commands = parse('LET result = INTERPRET string="LET x = 1" options="invalid json"');
      
      await expect(interpreter.run(commands)).rejects.toThrow(/INTERPRET failed/);
    });
  });

  describe('Performance and edge cases', () => {
    test('should handle empty interpreted code', async () => {
      const commands = parse('LET result = INTERPRET string=""');
      await interpreter.run(commands);
      
      expect(interpreter.variables.get('result')).toBe(true);
    });

    test('should handle comments in interpreted code', async () => {
      const rexxCode = '-- This is a comment\\nLET value = 42\\n-- Another comment';
      const commands = parse(`LET result = INTERPRET string="${rexxCode}"`);
      await interpreter.run(commands);
      
      expect(interpreter.variables.get('value')).toBe(42);
      expect(interpreter.variables.get('result')).toBe(true);
    });

    test('should handle large interpreted code blocks', async () => {
      // Generate a larger block of code
      const lines = [];
      for (let i = 0; i < 50; i++) {
        lines.push(`LET var${i} = ${i * 2}`);
      }
      const rexxCode = lines.join('\\n');
      
      const commands = parse(`LET result = INTERPRET string="${rexxCode}"`);
      await interpreter.run(commands);
      
      // Check a few variables were set correctly
      expect(interpreter.variables.get('var0')).toBe(0);
      expect(interpreter.variables.get('var10')).toBe(20);
      expect(interpreter.variables.get('var49')).toBe(98);
      expect(interpreter.variables.get('result')).toBe(true);
    });
  });

  describe('Integration with built-in functions', () => {
    test('should work with all major function categories', async () => {
      const rexxCode = `
        LET str_result = UPPER string="hello"
        LET math_result = MAX values=10,20,5
        LET array_data = JSON_PARSE text='[1,2,3]'
        LET array_len = ARRAY_LENGTH array=array_data
        LET date_info = DATE_PARSE dateString="2023-12-25"
        LET timestamp = NOW
      `.replace(/\n\s+/g, '\\n');
      
      const commands = parse(`LET success = INTERPRET string="${rexxCode}"`);
      await interpreter.run(commands);
      
      expect(interpreter.variables.get('str_result')).toBe('HELLO');
      expect(interpreter.variables.get('math_result')).toBe(20);
      expect(interpreter.variables.get('array_len')).toBe(3);
      expect(interpreter.variables.get('timestamp')).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(interpreter.variables.get('success')).toBe(true);
    });
  });
});