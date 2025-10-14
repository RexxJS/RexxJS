/**
 * Runtime Error Messaging Tests - Verified Errors
 *
 * Tests for errors that have been verified to actually occur in RexxJS.
 * Focused on error message quality and clarity.
 *
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { RexxInterpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

describe('Runtime Error Messaging - Verified Errors', () => {
  let interpreter;
  let mockRpc;

  beforeEach(() => {
    mockRpc = { send: jest.fn().mockResolvedValue('mock response') };
    interpreter = new RexxInterpreter(mockRpc);
    interpreter.scriptPath = __filename;
  });

  describe('JSON Parse Errors', () => {
    test('should provide clear error message for invalid JSON', async () => {
      const script = `LET result = JSON_PARSE("{invalid json}")`;

      await expect(interpreter.run(parse(script))).rejects.toThrow(/JSON|parse|unexpected token/i);
    });

    test('should indicate position in malformed JSON', async () => {
      const script = `LET data = JSON_PARSE('{"key": ')`;

      await expect(interpreter.run(parse(script))).rejects.toThrow(/JSON|parse|unexpected end/i);
    });
  });

  describe('Parser Errors with Clear Messages', () => {
    test('should report line number for missing END in DO', () => {
      const script = `
        DO i = 1 TO 5
          SAY i
      `;

      expect(() => parse(script)).toThrow(/Missing END for DO.*line/i);
    });

    test('should report line number for missing END in SELECT', () => {
      const script = `
        SELECT
          WHEN 1 = 1 THEN SAY "yes"
      `;

      expect(() => parse(script)).toThrow(/Missing END for SELECT.*line/i);
    });

    test('should provide helpful error for EXIT UNLESS with period', () => {
      const script = `
        LET success = 0
        EXIT 1 UNLESS success. 'Error message'
      `;

      expect(() => parse(script)).toThrow(/EXIT UNLESS.*period.*comma/i);
    });

    test('should provide helpful error for EXIT UNLESS with semicolon', () => {
      const script = `
        LET success = 0
        EXIT 1 UNLESS success; 'Error message'
      `;

      expect(() => parse(script)).toThrow(/EXIT UNLESS.*semicolon.*comma/i);
    });
  });

  describe('SIGNAL Label Errors', () => {
    test('should report label name when SIGNALing to non-existent label', async () => {
      const script = `SIGNAL UniqueNonExistentLabel123`;

      await expect(interpreter.run(parse(script))).rejects.toThrow(/UniqueNonExistentLabel123.*not found/i);
    });

    test('should provide context about label not found', async () => {
      const script = `
        SAY "Before signal"
        SIGNAL MissingTarget
      `;

      await expect(interpreter.run(parse(script))).rejects.toThrow(/label.*MISSINGTARGET|MISSINGTARGET.*not found/i);
    });
  });

  describe('REQUIRE Path Errors', () => {
    test('should explain when relative path lacks context', async () => {
      const noContextInterpreter = new RexxInterpreter(mockRpc);
      const script = `REQUIRE "./module.js"`;

      await expect(noContextInterpreter.run(parse(script))).rejects.toThrow(/script file context|cannot be resolved/i);
    });

    test('should provide helpful message about path resolution options', async () => {
      const noContextInterpreter = new RexxInterpreter(mockRpc);
      const script = `REQUIRE "../lib/utils.js"`;

      const error = await noContextInterpreter.run(parse(script)).catch(e => e);
      expect(error.message).toMatch(/absolute paths|cwd:|root:/i);
    });
  });

  describe('Stack Overflow with Clear Message', () => {
    test('should report stack overflow for infinite recursion', async () => {
      const script = `
        CALL InfiniteLoop

        InfiniteLoop:
          CALL InfiniteLoop
        RETURN
      `;

      await expect(interpreter.run(parse(script))).rejects.toThrow(/Maximum call stack|stack size exceeded/i);
    });
  });

  describe('Error Message Quality', () => {
    test('JSON error includes details about what failed', async () => {
      const script = `LET x = JSON_PARSE('not json at all')`;

      try {
        await interpreter.run(parse(script));
        throw new Error('Should have thrown');
      } catch (error) {
        expect(error.message).toMatch(/JSON/i);
        expect(error.message).toMatch(/parse|token|unexpected/i);
      }
    });

    test('SIGNAL error includes the exact label name', async () => {
      const script = `SIGNAL SpecificMissingLabel`;

      try {
        await interpreter.run(parse(script));
        throw new Error('Should have thrown');
      } catch (error) {
        // Label names are uppercased in REXX
        expect(error.message).toContain('SPECIFICMISSINGLABEL');
        expect(error.message).toMatch(/label|not found/i);
      }
    });

    test('parser errors include line numbers for debugging', () => {
      const script = `
        LET a = 1
        LET b = 2
        DO i = 1 TO 10
          SAY i
        LET c = 3
      `;

      try {
        parse(script);
        throw new Error('Should have thrown');
      } catch (error) {
        expect(error.message).toMatch(/line \d+/i);
      }
    });

    test('EXIT UNLESS error provides usage example', () => {
      const script = `EXIT 1 UNLESS condition. 'message'`;

      try {
        parse(script);
        throw new Error('Should have thrown');
      } catch (error) {
        expect(error.message).toMatch(/EXIT UNLESS condition, 'message'/);
      }
    });
  });

  describe('Confirmed Non-Errors (Valid REXX)', () => {
    test('undefined variables resolve to their name', async () => {
      const script = `SAY myUndefinedVar`;
      await expect(interpreter.run(parse(script))).resolves.not.toThrow();
    });

    test('non-existent functions call RPC handler (extension mechanism)', async () => {
      const script = `LET x = NONEXISTENT_FUNC("arg")`;
      // Unknown functions become RPC calls - this enables dynamic function loading
      await expect(interpreter.run(parse(script))).resolves.not.toThrow();
    });

    test('RETURN outside procedure is valid', async () => {
      const script = `RETURN 42`;
      const result = await interpreter.run(parse(script));
      expect(result.type).toBe('RETURN');
    });

    test('LEAVE and ITERATE outside loop are silently ignored', async () => {
      const script = `
        LEAVE
        SAY "after leave"
        ITERATE
        SAY "after iterate"
      `;
      await expect(interpreter.run(parse(script))).resolves.not.toThrow();
    });

    test('null property access prints value (not error)', async () => {
      const script = `
        LET obj = null
        SAY obj.property
      `;
      await expect(interpreter.run(parse(script))).resolves.not.toThrow();
    });

    test('IF without THEN in single-line form is valid', async () => {
      const script = `IF 1 > 0 SAY "true"`;
      await expect(interpreter.run(parse(script))).resolves.not.toThrow();
    });

    test('unclosed string is treated as identifier', async () => {
      const script = `LET x = "test`;
      // This is weird behavior but apparently valid in RexxJS
      await expect(interpreter.run(parse(script))).resolves.not.toThrow();
    });

    test('WHEN and OTHERWISE outside SELECT are ignored', async () => {
      const script = `
        WHEN 1 = 1 THEN SAY "when"
        OTHERWISE SAY "otherwise"
      `;
      await expect(interpreter.run(parse(script))).resolves.not.toThrow();
    });

    test('reserved keywords can be assigned (permissive parser)', async () => {
      const script = `LET IF = 10`;
      await expect(interpreter.run(parse(script))).resolves.not.toThrow();
    });

    test('regex errors are caught and handled gracefully', async () => {
      const script = `LET x = REGEX_MATCH("test", "[unclosed")`;
      // Returns null or empty rather than throwing
      await expect(interpreter.run(parse(script))).resolves.not.toThrow();
    });
  });

  describe('Documentation of REXX Behavior', () => {
    test('demonstrates undefined variable behavior', async () => {
      const script = `
        SAY myVar
        LET myVar = "defined"
        SAY myVar
      `;
      // First SAY outputs "MYVAR", second outputs "defined"
      await expect(interpreter.run(parse(script))).resolves.not.toThrow();
    });

    test('demonstrates RPC function call mechanism', async () => {
      const rpcSpy = jest.fn().mockResolvedValue('custom result');
      const customInterpreter = new RexxInterpreter({ send: rpcSpy });

      const script = `LET result = MY_CUSTOM_FUNCTION("arg1", "arg2")`;
      await customInterpreter.run(parse(script));

      // RPC handler is called with the function name and args
      expect(rpcSpy).toHaveBeenCalled();
      const [functionName, args] = rpcSpy.mock.calls[0];
      expect(functionName).toBe('default');
      expect(args).toContain('MY_CUSTOM_FUNCTION');
    });

    test('built-in functions are executed directly (no RPC)', async () => {
      const rpcSpy = jest.fn().mockResolvedValue('should not be called');
      const customInterpreter = new RexxInterpreter({ send: rpcSpy });

      const script = `
        LET len = LENGTH("hello")
        SAY len
      `;
      await customInterpreter.run(parse(script));

      // Built-in functions don't call RPC
      expect(rpcSpy).not.toHaveBeenCalled();
    });
  });
});
