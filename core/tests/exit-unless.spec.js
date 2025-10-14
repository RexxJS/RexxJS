/**
 * EXIT UNLESS Statement Tests
 *
 * Tests the EXIT UNLESS conditional exit statement with various condition types:
 * - Boolean values (true/false)
 * - Comparison operators (=, <>, <, >, <=, >=)
 * - Logical operators (NOT, AND, OR)
 * - Numeric comparisons
 * - String comparisons
 * - Variable existence checks
 * - Compound conditions
 *
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { TestRexxInterpreter } = require('../src/test-interpreter');
const { parse } = require('../src/parser');

describe('EXIT UNLESS Statement', () => {
  let interpreter;

  beforeEach(() => {
    interpreter = new TestRexxInterpreter({}, {}, {});
  });

  const run = async (code) => {
    const cmds = parse(code);
    return await interpreter.run(cmds, code);
  };

  describe('Boolean Conditions', () => {
    it('should exit when condition is false', async () => {
      const code = `
        EXIT 1 UNLESS false, "Should exit"
        LET reached = "yes"
      `;

      const result = await run(code);

      expect(result.terminated).toBe(true);
      expect(result.exitCode).toBe(1);
      expect(interpreter.variables.get('reached')).toBeUndefined();
    });

    it('should not exit when condition is true', async () => {
      const code = `
        EXIT 1 UNLESS true, "Should not exit"
        LET reached = "yes"
      `;

      const result = await run(code);

      // When not exiting, result should be null/undefined (normal execution)
      expect(result).toBeNull();
      expect(interpreter.variables.get('reached')).toBe('yes');
    });

    it('should exit when variable is false', async () => {
      const code = `
        LET success = false
        EXIT 1 UNLESS success, "Operation failed"
        LET reached = "yes"
      `;

      const result = await run(code);

      expect(result.terminated).toBe(true);
      expect(result.exitCode).toBe(1);
    });

    it('should not exit when variable is true', async () => {
      const code = `
        LET success = true
        EXIT 1 UNLESS success, "Operation failed"
        LET reached = "yes"
      `;

      const result = await run(code);

      expect(result).toBeNull();
      expect(interpreter.variables.get('reached')).toBe('yes');
    });
  });

  describe('Comparison Operators', () => {
    it('should exit when equality check fails', async () => {
      const code = `
        LET status = 500
        EXIT 1 UNLESS status = 200, "Status not 200: " || status
        LET reached = "yes"
      `;

      const result = await run(code);

      expect(result.terminated).toBe(true);
      expect(result.exitCode).toBe(1);
    });

    it('should not exit when equality check passes', async () => {
      const code = `
        LET status = 200
        EXIT 1 UNLESS status = 200, "Status not 200"
        LET reached = "yes"
      `;

      const result = await run(code);

      expect(result).toBeNull();
      expect(interpreter.variables.get('reached')).toBe('yes');
    });

    it('should handle inequality operator (<>)', async () => {
      const code = `
        LET error = "FAIL"
        EXIT 1 UNLESS error <> "OK", "Unexpected OK status"
        LET reached = "yes"
      `;

      const result = await run(code);

      expect(result).toBeNull();
      expect(interpreter.variables.get('reached')).toBe('yes');
    });

    it('should handle greater than (>)', async () => {
      const code = `
        LET count = 5
        EXIT 1 UNLESS count > 0, "Count must be positive"
        LET reached = "yes"
      `;

      const result = await run(code);

      expect(result).toBeNull();
      expect(interpreter.variables.get('reached')).toBe('yes');
    });

    it('should handle less than (<)', async () => {
      const code = `
        LET age = 15
        EXIT 1 UNLESS age < 18, "Must be under 18"
        LET reached = "yes"
      `;

      const result = await run(code);

      expect(result).toBeNull();
      expect(interpreter.variables.get('reached')).toBe('yes');
    });

    it('should handle greater than or equal (>=)', async () => {
      const code = `
        LET score = 100
        EXIT 1 UNLESS score >= 100, "Score must be at least 100"
        LET reached = "yes"
      `;

      const result = await run(code);

      expect(result).toBeNull();
      expect(interpreter.variables.get('reached')).toBe('yes');
    });

    it('should handle less than or equal (<=)', async () => {
      const code = `
        LET temp = 25
        EXIT 1 UNLESS temp <= 30, "Temperature too high"
        LET reached = "yes"
      `;

      const result = await run(code);

      expect(result).toBeNull();
      expect(interpreter.variables.get('reached')).toBe('yes');
    });
  });

  describe('Logical Operators', () => {
    it('should handle NOT operator', async () => {
      const code = `
        LET failed = false
        EXIT 1 UNLESS NOT failed, "Operation failed"
        LET reached = "yes"
      `;

      const result = await run(code);

      expect(result).toBeNull();
      expect(interpreter.variables.get('reached')).toBe('yes');
    });

    it('should exit with NOT operator when condition is true', async () => {
      const code = `
        LET success = true
        EXIT 1 UNLESS NOT success, "Should exit"
        LET reached = "yes"
      `;

      const result = await run(code);

      expect(result.terminated).toBe(true);
      expect(result.exitCode).toBe(1);
    });

    it('should handle AND operator', async () => {
      const code = `
        LET auth = true
        LET valid = true
        EXIT 1 UNLESS auth AND valid, "Authentication or validation failed"
        LET reached = "yes"
      `;

      const result = await run(code);

      expect(result).toBeNull();
      expect(interpreter.variables.get('reached')).toBe('yes');
    });

    it('should exit with AND when one condition fails', async () => {
      const code = `
        LET auth = true
        LET valid = false
        EXIT 1 UNLESS auth AND valid, "Validation failed"
        LET reached = "yes"
      `;

      const result = await run(code);

      expect(result.terminated).toBe(true);
      expect(result.exitCode).toBe(1);
    });

    it('should handle OR operator', async () => {
      const code = `
        LET hasA = false
        LET hasB = true
        EXIT 1 UNLESS hasA OR hasB, "Must have A or B"
        LET reached = "yes"
      `;

      const result = await run(code);

      expect(result).toBeNull();
      expect(interpreter.variables.get('reached')).toBe('yes');
    });

    it('should exit with OR when both conditions fail', async () => {
      const code = `
        LET hasA = false
        LET hasB = false
        EXIT 1 UNLESS hasA OR hasB, "Neither A nor B found"
        LET reached = "yes"
      `;

      const result = await run(code);

      expect(result.terminated).toBe(true);
      expect(result.exitCode).toBe(1);
    });
  });

  describe('String Comparisons', () => {
    it('should handle string equality', async () => {
      const code = `
        LET name = "Alice"
        EXIT 1 UNLESS name = "Alice", "Name mismatch"
        LET reached = "yes"
      `;

      const result = await run(code);

      expect(result).toBeNull();
      expect(interpreter.variables.get('reached')).toBe('yes');
    });

    it('should exit on string inequality', async () => {
      const code = `
        LET expected = "SUCCESS"
        LET actual = "FAILURE"
        EXIT 1 UNLESS actual = expected, "Status mismatch: got " || actual
        LET reached = "yes"
      `;

      const result = await run(code);

      expect(result.terminated).toBe(true);
      expect(result.exitCode).toBe(1);
    });
  });

  describe('Numeric Comparisons', () => {
    it('should handle numeric zero as false', async () => {
      const code = `
        LET result = 0
        EXIT 1 UNLESS result, "Result is zero/false"
        LET reached = "yes"
      `;

      const result = await run(code);

      expect(result.terminated).toBe(true);
      expect(result.exitCode).toBe(1);
    });

    it('should handle non-zero numeric as true', async () => {
      const code = `
        LET result = 42
        EXIT 1 UNLESS result, "Result is zero/false"
        LET reached = "yes"
      `;

      const result = await run(code);

      expect(result).toBeNull();
      expect(interpreter.variables.get('reached')).toBe('yes');
    });

    it('should compare numeric values', async () => {
      const code = `
        LET count = 10
        LET minimum = 5
        EXIT 1 UNLESS count > minimum, "Count below minimum"
        LET reached = "yes"
      `;

      const result = await run(code);

      expect(result).toBeNull();
      expect(interpreter.variables.get('reached')).toBe('yes');
    });
  });

  describe('Compound Conditions', () => {
    it('should handle complex condition with multiple operators', async () => {
      const code = `
        LET status = 200
        LET hasData = true
        LET count = 10
        EXIT 1 UNLESS (status = 200) AND hasData AND (count > 0), "Request validation failed"
        LET reached = "yes"
      `;

      const result = await run(code);

      expect(result).toBeNull();
      expect(interpreter.variables.get('reached')).toBe('yes');
    });

    it('should exit on complex condition failure', async () => {
      const code = `
        LET status = 200
        LET hasData = false
        LET count = 10
        EXIT 1 UNLESS (status = 200) AND hasData AND (count > 0), "Data missing"
        LET reached = "yes"
      `;

      const result = await run(code);

      expect(result.terminated).toBe(true);
      expect(result.exitCode).toBe(1);
    });
  });

  describe('Real-World Use Cases', () => {
    it('should validate RESULT.success pattern', async () => {
      const code = `
        LET RESULT.success = false
        LET RESULT.error = "Connection failed"
        EXIT 1 UNLESS RESULT.success, "Operation failed: " || RESULT.error
        LET reached = "yes"
      `;

      const result = await run(code);

      expect(result.terminated).toBe(true);
      expect(result.exitCode).toBe(1);
    });

    it('should validate exitCode pattern', async () => {
      const code = `
        LET RESULT.exitCode = 0
        EXIT 1 UNLESS RESULT.exitCode = 0, "Command failed with code: " || RESULT.exitCode
        LET reached = "yes"
      `;

      const result = await run(code);

      expect(result).toBeNull();
      expect(interpreter.variables.get('reached')).toBe('yes');
    });

    it('should validate HTTP status pattern', async () => {
      const code = `
        LET response.ok = true
        LET response.status = 200
        EXIT 1 UNLESS response.ok, "HTTP request failed: " || response.status
        LET reached = "yes"
      `;

      const result = await run(code);

      expect(result).toBeNull();
      expect(interpreter.variables.get('reached')).toBe('yes');
    });
  });

  describe('Exit Codes', () => {
    it('should support different exit codes', async () => {
      const code = `
        EXIT 127 UNLESS false, "Command not found"
      `;

      const result = await run(code);

      expect(result.terminated).toBe(true);
      expect(result.exitCode).toBe(127);
    });

    it('should default to exit code 0 if not specified', async () => {
      const code = `
        EXIT UNLESS false, "Condition failed"
      `;

      const result = await run(code);

      expect(result.terminated).toBe(true);
      expect(result.exitCode).toBe(0);
    });
  });

  describe('Message Formatting', () => {
    it('should support message with string concatenation', async () => {
      const code = `
        LET error = "timeout"
        EXIT 1 UNLESS false, "Failed due to: " || error
      `;

      const result = await run(code);

      expect(result.terminated).toBe(true);
      expect(result.exitCode).toBe(1);
    });

    it('should support message with variables', async () => {
      const code = `
        LET expected = 200
        LET actual = 404
        EXIT 1 UNLESS actual = expected, "Expected " || expected || " but got " || actual
      `;

      const result = await run(code);

      expect(result.terminated).toBe(true);
      expect(result.exitCode).toBe(1);
    });
  });
});
