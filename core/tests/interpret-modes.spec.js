/**
 * Interpret Modes Tests
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

/* eslint-env jest */
'use strict';

const { Interpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

describe('INTERPRET Statement Modes', () => {
  let interpreter;

  beforeEach(() => {
    const mockRpcClient = {
      send: jest.fn().mockResolvedValue('mock response')
    };
    interpreter = new Interpreter(mockRpcClient);
  });

  describe('Classic INTERPRET statement (Mode C)', () => {
    test('should execute with full variable sharing', async () => {
      // Set up initial variables
      interpreter.variables.set('baseValue', 100);
      interpreter.variables.set('multiplier', 2);
      
      // Use classic INTERPRET statement syntax
      const commands = parse(`
        LET codeString = "LET result = baseValue * multiplier"
        INTERPRET codeString
      `);
      
      await interpreter.run(commands);
      
      expect(interpreter.variables.get('result')).toBe(200);
      expect(interpreter.variables.get('codeString')).toBe('LET result = baseValue * multiplier');
    });

    test('should share all variables bidirectionally', async () => {
      interpreter.variables.set('original', 'value');
      
      const commands = parse(`
        LET code = "LET modified = original || "" changed""\\nLET new_var = ""created"""
        INTERPRET code
      `);
      
      await interpreter.run(commands);
      
      expect(interpreter.variables.get('modified')).toBe('value changed');
      expect(interpreter.variables.get('new_var')).toBe('created');
    });

    test('should work with string literals directly', async () => {
      const commands = parse(`
        INTERPRET "LET direct = 42"
      `);
      
      await interpreter.run(commands);
      
      expect(interpreter.variables.get('direct')).toBe(42);
    });

    test('should handle multiline code', async () => {
      const commands = parse(`
        LET multiCode = "LET a = 10\\nLET b = 20\\nLET sum = a + b"
        INTERPRET multiCode
      `);
      
      await interpreter.run(commands);
      
      expect(interpreter.variables.get('a')).toBe(10);
      expect(interpreter.variables.get('b')).toBe(20);
      expect(interpreter.variables.get('sum')).toBe(30);
    });
  });

  describe('INTERPRET WITH ISOLATED (Mode B)', () => {
    test('should execute in sandboxed scope', async () => {
      interpreter.variables.set('secret', 'confidential');
      interpreter.variables.set('public', 'accessible');
      
      const commands = parse(`
        LET isolatedCode = "LET isolated_var = \\"created\\"\\nLET leaked = secret"
        INTERPRET isolatedCode WITH ISOLATED
      `);
      
      await interpreter.run(commands);
      
      // Variables created in isolation should not leak out
      expect(interpreter.variables.get('isolated_var')).toBeUndefined();
      expect(interpreter.variables.get('leaked')).toBeUndefined();
      
      // Original variables should remain unchanged
      expect(interpreter.variables.get('secret')).toBe('confidential');
      expect(interpreter.variables.get('public')).toBe('accessible');
    });

    test('should not access parent variables', async () => {
      interpreter.variables.set('parent_var', 'parent_value');
      
      const commands = parse(`
        LET isolatedCode = "LET result = parent_var"
        INTERPRET isolatedCode WITH ISOLATED
      `);
      
      await interpreter.run(commands);
      
      // The isolated code should treat parent_var as a literal since no access
      expect(interpreter.variables.get('result')).toBeUndefined();
    });

    test('should work with built-in functions', async () => {
      const commands = parse(`
        INTERPRET "LET upper_result = UPPER string=\\"hello\\"" WITH ISOLATED
      `);
      
      await interpreter.run(commands);
      
      // Built-in functions work, but result doesn't leak out
      expect(interpreter.variables.get('upper_result')).toBeUndefined();
    });
  });

  describe('INTERPRET WITH ISOLATED (multiple variables)', () => {
    test('should import multiple variables to isolated scope', async () => {
      // Set up parent variables
      interpreter.variables.set('input1', 10);
      interpreter.variables.set('input2', 20);
      interpreter.variables.set('input3', 30);
      interpreter.variables.set('secret', 'protected');
      
      const commands = parse(`
        LET code = "LET sum = input1 + input2 + input3\\nLET product = input1 * input2\\nLET leaked = secret"
        INTERPRET code WITH ISOLATED (input1 input2 input3)
      `);
      
      await interpreter.run(commands);
      
      // Variables created in isolation should not leak out
      expect(interpreter.variables.get('sum')).toBeUndefined();
      expect(interpreter.variables.get('product')).toBeUndefined();
      expect(interpreter.variables.get('leaked')).toBeUndefined();
      
      // Original variables should remain unchanged
      expect(interpreter.variables.get('input1')).toBe(10);
      expect(interpreter.variables.get('input2')).toBe(20);
      expect(interpreter.variables.get('input3')).toBe(30);
      expect(interpreter.variables.get('secret')).toBe('protected');
    });

    test('should export multiple variables from isolated scope', async () => {
      const commands = parse(`
        LET code = "LET result1 = 42\\nLET result2 = computed\\nLET result3 = 3.14\\nLET hidden = secret"
        INTERPRET code WITH ISOLATED EXPORT(result1 result2 result3)
      `);
      
      await interpreter.run(commands);
      
      expect(interpreter.variables.get('result1')).toBe(42);
      expect(interpreter.variables.get('result2')).toBe('COMPUTED');
      expect(interpreter.variables.get('result3')).toBe(3.14);
      expect(interpreter.variables.get('hidden')).toBeUndefined();
    });

    test('should combine import and export', async () => {
      // Set up input data
      interpreter.variables.set('multiplier', 5);
      interpreter.variables.set('base', 10);
      interpreter.variables.set('offset', 2);
      
      const commands = parse(`
        LET computation = "LET result = (base + offset) * multiplier\\nLET sum = base + offset\\nLET debug = base || _plus_ || offset || _equals_ || sum"
        INTERPRET computation WITH ISOLATED (base offset multiplier) EXPORT(result debug)
      `);
      
      await interpreter.run(commands);
      
      expect(interpreter.variables.get('result')).toBe(60); // (10 + 2) * 5
      expect(interpreter.variables.get('debug')).toBe('10_PLUS_2_EQUALS_12');
      
      // Original variables unchanged
      expect(interpreter.variables.get('multiplier')).toBe(5);
      expect(interpreter.variables.get('base')).toBe(10);
      expect(interpreter.variables.get('offset')).toBe(2);
    });

    test('should handle non-existent import variables gracefully', async () => {
      interpreter.variables.set('existing', 'value');
      
      const commands = parse(`
        LET code = "LET result = existing || _with_ || nonexistent"
        INTERPRET code WITH ISOLATED (existing nonexistent) EXPORT(result)
      `);
      
      await interpreter.run(commands);
      
      // nonexistent, not available for import, is an unset symbol: its uppercase name
      expect(interpreter.variables.get('result')).toBe('value_WITH_NONEXISTENT');
    });

    test('should handle non-existent export variables gracefully', async () => {
      const commands = parse(`
        LET code = "LET created = actual"
        INTERPRET code WITH ISOLATED EXPORT(created nonexistent)
      `);
      
      await interpreter.run(commands);
      
      expect(interpreter.variables.get('created')).toBe('ACTUAL');
      expect(interpreter.variables.get('nonexistent')).toBeUndefined();
    });

    test('should support complex data types in import/export', async () => {
      // Set up complex data
      const jsonData = JSON.stringify([{name: 'John', age: 30}, {name: 'Jane', age: 25}]);
      interpreter.variables.set('users', JSON.parse(jsonData));
      interpreter.variables.set('filterAge', 26);
      
      const commands = parse(`
        LET processing = "LET filtered = []\\nLET count = ARRAY_LENGTH array=users\\nDO i = 1 TO count\\n  LET user = ARRAY_GET array=users index=i\\n  LET age = ARRAY_GET array=user key=\\"age\\"\\n  IF age >= filterAge THEN\\n    LET filtered = ARRAY_PUSH array=filtered item=user\\n  ENDIF\\nEND\\nLET resultCount = ARRAY_LENGTH array=filtered"
        INTERPRET processing WITH ISOLATED (users filterAge) EXPORT(filtered resultCount)
      `);
      
      await interpreter.run(commands);
      
      const filtered = interpreter.variables.get('filtered');
      const resultCount = interpreter.variables.get('resultCount');
      
      
      expect(Array.isArray(filtered)).toBe(true);
      expect(resultCount).toBe(1);
      expect(filtered[0].name).toBe('John');
      expect(filtered[0].age).toBe(30);
    });
  });

  describe('INTERPRET WITH ISOLATED EXPORT', () => {
    test('should export single variable', async () => {
      const commands = parse(`
        LET code = "LET exported = this_should_be_visible\\nLET hidden = this_should_not"
        INTERPRET code WITH ISOLATED EXPORT(exported)
      `);
      
      await interpreter.run(commands);
      
      expect(interpreter.variables.get('exported')).toBe('THIS_SHOULD_BE_VISIBLE');
      expect(interpreter.variables.get('hidden')).toBeUndefined();
    });

    test('should export computed results', async () => {
      const commands = parse(`
        LET computation = "LET x = 5\\nLET y = 10\\nLET product = x * y"
        INTERPRET computation WITH ISOLATED EXPORT(product)
      `);
      
      await interpreter.run(commands);
      
      expect(interpreter.variables.get('product')).toBe(50);
      expect(interpreter.variables.get('x')).toBeUndefined();
      expect(interpreter.variables.get('y')).toBeUndefined();
    });

    test('should handle non-existent export variable gracefully', async () => {
      const commands = parse(`
        LET code = "LET some_var = \\"value\\""
        INTERPRET code WITH ISOLATED EXPORT(nonexistent)
      `);
      
      await interpreter.run(commands);
      
      expect(interpreter.variables.get('nonexistent')).toBeUndefined();
      expect(interpreter.variables.get('some_var')).toBeUndefined();
    });

    test('should export with complex data types', async () => {
      // Set up JSON data externally to avoid quote escaping issues
      interpreter.variables.set('jsonText', JSON.stringify(['a', 'b', 'c']));
      
      const commands = parse(`
        LET jsonCode = "LET data = JSON_PARSE text=jsonText\\nLET exported_data = data"
        INTERPRET jsonCode WITH ISOLATED (jsonText) EXPORT(exported_data)
      `);
      
      await interpreter.run(commands);
      
      const exported = interpreter.variables.get('exported_data');
      expect(Array.isArray(exported)).toBe(true);
      expect(exported.length).toBe(3);
      expect(exported[0]).toBe('a');
    });
  });

  describe('NO-INTERPRET directive', () => {
    test('should block INTERPRET function calls', async () => {
      const commands = parse(`
        NO-INTERPRET
        LET result = INTERPRET string="LET x = 42"
      `);
      
      await expect(interpreter.run(commands)).rejects.toThrow(/INTERPRET is blocked/);
    });

    test('should block INTERPRET statements', async () => {
      const commands = parse(`
        NO_INTERPRET
        INTERPRET "LET blocked = true"
      `);
      
      await expect(interpreter.run(commands)).rejects.toThrow(/INTERPRET is blocked/);
    });

    test('should block both underscore and hyphen variants', async () => {
      // Test hyphen variant
      let commands = parse(`
        NO-INTERPRET
        INTERPRET "LET test1 = 1"
      `);
      
      await expect(interpreter.run(commands)).rejects.toThrow(/INTERPRET is blocked/);
      
      // Reset interpreter
      interpreter.interpretBlocked = false;
      
      // Test underscore variant
      commands = parse(`
        NO_INTERPRET
        INTERPRET "LET test2 = 2"
      `);
      
      await expect(interpreter.run(commands)).rejects.toThrow(/INTERPRET is blocked/);
    });

    test('should persist for entire script execution', async () => {
      const commands = parse(`
        LET before = INTERPRET string="LET works = true"
        NO-INTERPRET
        LET after = INTERPRET string="LET blocked = true"
      `);
      
      // First INTERPRET should work, second should be blocked
      await expect(interpreter.run(commands)).rejects.toThrow(/INTERPRET is blocked/);
      
      // But the first one should have succeeded
      expect(interpreter.variables.get('works')).toBe(true);
      expect(interpreter.variables.get('before')).toBe(true);
    });
  });

  describe('Address context sharing', () => {
    test('should share ADDRESS context in classic mode', async () => {
      const commands = parse(`
        ADDRESS calculator
        INTERPRET "press button=5"
      `);
      
      await interpreter.run(commands);
      
      expect(interpreter.addressSender.send).toHaveBeenCalledWith('calculator', 'press', { button: 5 });
    });

    test('should share ADDRESS context in isolated mode', async () => {
      const commands = parse(`
        ADDRESS kitchen
        INTERPRET "checkStock item=chicken" WITH ISOLATED
      `);
      
      await interpreter.run(commands);
      
      expect(interpreter.addressSender.send).toHaveBeenCalledWith('kitchen', 'checkStock', { item: 'chicken' });
    });
  });

  describe('Error handling', () => {
    test('should propagate parsing errors in classic mode', async () => {
      const commands = parse(`
        INTERPRET "LET = invalid syntax"
      `);
      
      await expect(interpreter.run(commands)).rejects.toThrow(/INTERPRET failed/);
    });

    test('should propagate runtime errors in isolated mode', async () => {
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
      
      const commands = parse(`
        INTERPRET "LET result = NONEXISTENT_FUNCTION()" WITH ISOLATED
      `);
      
      await expect(testInterpreter.run(commands)).rejects.toThrow(/INTERPRET failed/);
    });

    test('should provide detailed error messages', async () => {
      const commands = parse(`
        LET badCode = "LET = invalid syntax"
        INTERPRET badCode
      `);
      
      await expect(interpreter.run(commands)).rejects.toThrow(/INTERPRET failed:/);
    });
  });

  describe('Complex integration scenarios', () => {
    test('should handle nested classic and isolated modes', async () => {
      interpreter.variables.set('base', 10);
      
      const commands = parse(`
        LET outerCode = "LET shared = base * 2\\nINTERPRET \\"LET isolated = 99\\" WITH ISOLATED\\nLET final = shared + 5"
        INTERPRET outerCode
      `);
      
      await interpreter.run(commands);
      
      expect(interpreter.variables.get('shared')).toBe(20);
      expect(interpreter.variables.get('final')).toBe(25);
      expect(interpreter.variables.get('isolated')).toBeUndefined(); // Isolated doesn't leak
    });

    test('should work with dynamic code generation', async () => {
      const commands = parse(`
        LET varName = "dynamic_result"
        LET varValue = "computed_value"
        LET generatedCode = "LET " || varName || " = " || varValue
        INTERPRET generatedCode
      `);
      
      await interpreter.run(commands);
      
      expect(interpreter.variables.get('dynamic_result')).toBe('COMPUTED_VALUE');
    });

    test('should support export with dynamic variable names', async () => {
      const commands = parse(`
        LET exportVar = "result"
        LET code = "LET result = 42\\nLET other = 24"
        INTERPRET code WITH ISOLATED EXPORT(result)
      `);
      
      await interpreter.run(commands);
      
      expect(interpreter.variables.get('result')).toBe(42);
      expect(interpreter.variables.get('other')).toBeUndefined();
    });
  });
});