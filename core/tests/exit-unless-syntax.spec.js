/**
 * EXIT UNLESS Syntax Error Tests
 *
 * Tests for common syntax errors in EXIT UNLESS statements that can cause
 * silent script termination without proper error messages.
 *
 * Background: EXIT UNLESS uses comma to separate the condition from the message:
 *   ✅ CORRECT:   EXIT 1 UNLESS condition, 'error message'
 *   ❌ INCORRECT: EXIT 1 UNLESS condition. 'error message'
 *
 * The period (.) is a stem variable accessor, not a statement separator.
 * Using period instead of comma can cause the interpreter to silently exit
 * without displaying the error message.
 */

const { RexxInterpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

describe('EXIT UNLESS Syntax Errors', () => {
  let interpreter;
  let consoleSpy;

  beforeEach(() => {
    const mockRpc = { send: jest.fn().mockResolvedValue('mock response') };
    interpreter = new RexxInterpreter(mockRpc);
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    if (consoleSpy) consoleSpy.mockRestore();
  });

  describe('Correct EXIT UNLESS syntax with comma', () => {
    test('should exit with message when condition is false', async () => {
      const script = `
LET success = 0
EXIT 1 UNLESS success, 'Operation failed'
SAY "This should not print"
      `;

      // The script should exit with code 1
      const result = await interpreter.run(parse(script));

      // Verify the script terminated with exit code 1
      expect(result).toBeDefined();
      expect(result.terminated).toBe(true);
      expect(result.exitCode).toBe(1);

      // Verify the exit message was shown
      const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('Operation failed');
      expect(output).not.toContain('This should not print');
    });

    test('should continue execution when condition is true', async () => {
      const script = `
LET success = 1
EXIT 1 UNLESS success, 'Operation failed'
SAY "Success! Continuing..."
      `;

      await interpreter.run(parse(script));

      const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).not.toContain('Operation failed');
      expect(output).toContain('Success! Continuing...');
    });

    test('should work with RESULT object property check', async () => {
      const script = `
LET RESULT = {"success": 1}
EXIT 1 UNLESS RESULT.success, 'Docker operation failed'
SAY "Docker operation succeeded"
      `;

      const result = await interpreter.run(parse(script));

      // Should NOT exit since RESULT.success is 1 (truthy)
      expect(!result || !result.terminated).toBe(true);

      const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).not.toContain('Docker operation failed');
      expect(output).toContain('Docker operation succeeded');
    });

    test('should show error message when RESULT.success is false', async () => {
      const script = `
LET RESULT = {"success": 0}
EXIT 1 UNLESS RESULT.success, 'Docker operation failed'
SAY "This should not print"
      `;

      const result = await interpreter.run(parse(script));

      expect(result).toBeDefined();
      expect(result.terminated).toBe(true);
      expect(result.exitCode).toBe(1);

      const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('Docker operation failed');
      expect(output).not.toContain('This should not print');
    });
  });

  describe('INCORRECT EXIT UNLESS syntax with period (syntax error)', () => {
    test('period instead of comma should produce clear error message', async () => {
      const script = `
LET RESULT = {success: 0}
EXIT 1 UNLESS RESULT.success. 'Error deploying rexx exe'
SAY "This should not print"
      `;

      // The interpreter should detect this syntax error and provide a meaningful error message
      let errorThrown = false;
      let errorMessage = '';

      try {
        await interpreter.run(parse(script));
      } catch (error) {
        errorThrown = true;
        errorMessage = error.message;
      }

      // A clear error should be thrown about the syntax error
      expect(errorThrown).toBe(true);
      expect(errorMessage).toMatch(/unexpected period|period|syntax error|comma expected|EXIT UNLESS/i);
    });

    test('period syntax error should give helpful error before any execution', async () => {
      const script = `
SAY "Starting deployment..."
LET RESULT = {success: 0}
EXIT 1 UNLESS RESULT.success. 'Deployment failed'
SAY "This line should never execute"
      `;

      let errorThrown = false;
      let errorMessage = '';

      try {
        await interpreter.run(parse(script));
      } catch (error) {
        errorThrown = true;
        errorMessage = error.message;
      }

      // Should detect the syntax error and provide helpful message
      expect(errorThrown).toBe(true);
      expect(errorMessage).toMatch(/unexpected period|syntax error|comma expected|EXIT UNLESS.*period/i);

      // Script should fail during parsing/early execution, so "Starting deployment" may or may not appear
      // The key is that a clear error is thrown, not silent failure
    });
  });

  describe('EXIT UNLESS with various separators', () => {
    test('comma is the correct separator', async () => {
      const script = `
LET value = 0
EXIT 1 UNLESS value, 'Value is false'
SAY "Not reached"
      `;

      const result = await interpreter.run(parse(script));

      expect(result).toBeDefined();
      expect(result.terminated).toBe(true);

      const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('Value is false');
    });

    test('semicolon separator should give helpful error message', async () => {
      const script = `
LET value = 0
EXIT 1 UNLESS value; 'Value is false'
SAY "Not reached"
      `;

      // Semicolon is a statement separator, not valid in EXIT UNLESS
      // Should provide a clear error message
      let errorThrown = false;
      let errorMessage = '';

      try {
        await interpreter.run(parse(script));
      } catch (error) {
        errorThrown = true;
        errorMessage = error.message;
      }

      // Should detect invalid EXIT UNLESS syntax
      expect(errorThrown).toBe(true);
      expect(errorMessage).toMatch(/EXIT UNLESS|syntax error|comma expected|semicolon/i);
    });
  });

  describe('Complex EXIT UNLESS scenarios from real code', () => {
    test('Docker binary deployment scenario (from test-docker-complete.rexx)', async () => {
      // Simulates the actual bug found in test-docker-complete.rexx line 39
      const script = `
SAY "[6.5/15] Deploying static RexxJS binary to Alpine..."
LET RESULT = {"success": 0, "error": "Binary not found"}
EXIT 1 UNLESS RESULT.success, 'Error deploying rexx exe'
SAY "[6.6/15] Testing static binary..."
      `;

      const result = await interpreter.run(parse(script));

      expect(result).toBeDefined();
      expect(result.terminated).toBe(true);
      expect(result.exitCode).toBe(1);

      const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('[6.5/15] Deploying static RexxJS binary to Alpine...');
      expect(output).toContain('Error deploying rexx exe');
      expect(output).not.toContain('[6.6/15] Testing static binary...');
    });

    test('Multiple EXIT UNLESS with object property checks', async () => {
      const script = `
LET step1 = {"success": 1}
EXIT 1 UNLESS step1.success, 'Step 1 failed'
SAY "Step 1 passed"

LET step2 = {"success": 0}
EXIT 1 UNLESS step2.success, 'Step 2 failed'
SAY "Step 2 passed"
      `;

      const result = await interpreter.run(parse(script));

      expect(result).toBeDefined();
      expect(result.terminated).toBe(true);
      expect(result.exitCode).toBe(1);

      const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('Step 1 passed');
      expect(output).toContain('Step 2 failed');
      expect(output).not.toContain('Step 2 passed');
    });

    test('EXIT UNLESS with interpolated error messages', async () => {
      const script = `
LET containerName = "test-container"
LET RESULT = {"success": 0}
EXIT 1 UNLESS RESULT.success, "Failed to deploy to {{containerName}}"
SAY "Deployment succeeded"
      `;

      const result = await interpreter.run(parse(script));

      expect(result).toBeDefined();
      expect(result.terminated).toBe(true);
      expect(result.exitCode).toBe(1);

      const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('Failed to deploy to test-container');
      expect(output).not.toContain('Deployment succeeded');
    });
  });

  describe('Error message formatting', () => {
    test('single-quoted error messages', async () => {
      const script = `
LET value = 0
EXIT 1 UNLESS value, 'Single quoted error'
      `;

      const result = await interpreter.run(parse(script));

      expect(result).toBeDefined();
      expect(result.terminated).toBe(true);

      const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('Single quoted error');
    });

    test('double-quoted error messages with interpolation', async () => {
      const script = `
LET operation = "deployment"
LET value = 0
EXIT 1 UNLESS value, "Double quoted {{operation}} error"
      `;

      const result = await interpreter.run(parse(script));

      expect(result).toBeDefined();
      expect(result.terminated).toBe(true);

      const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('Double quoted deployment error');
    });

    test('error messages with complex expressions', async () => {
      const script = `
LET value = 0
LET prefix = "ERROR: "
EXIT 1 UNLESS value, prefix || "Operation failed"
      `;

      const result = await interpreter.run(parse(script));

      expect(result).toBeDefined();
      expect(result.terminated).toBe(true);

      const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('ERROR: Operation failed');
    });
  });
});
