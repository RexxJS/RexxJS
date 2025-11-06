/**
 * Line Number Reporting Tests
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { RexxInterpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');
const fs = require('fs');
const path = require('path');

describe('Line Number Reporting in Error Messages', () => {
  let interpreter;

  beforeEach(() => {
    // Create a mock RPC client
    const mockRpc = {
      send: jest.fn().mockResolvedValue('mock response')
    };
    interpreter = new RexxInterpreter(mockRpc);

    // Set script path for relative path resolution in inline scripts
    interpreter.scriptPath = __filename;
  });

  test('should report correct line numbers for main script failures', async () => {
    const script = `
      REQUIRE "../src/expectations-address.js"
      LET test_var = "hello"
      ADDRESS EXPECTATIONS "{test_var} should equal 'world'"
    `;

    try {
      const commands = parse(script);
      await interpreter.run(commands);
      fail('Expected an error to be thrown');
    } catch (error) {
      expect(error.message).toContain('world (string) expected, but hello (string) encountered');
      // Line 4 is where the failing expectation is - check for either format
      expect(error.message).toMatch(/\(line 4\)|Error at line 4/);
    }
  });

  test('should report correct line numbers for subroutine failures', async () => {
    const script = `
      REQUIRE "../src/expectations-address.js"
      CALL TestSubroutine
      EXIT 0
      
      TestSubroutine:
        LET sub_var = "test"
        ADDRESS EXPECTATIONS "{sub_var} should equal 'wrong'"
      RETURN
    `;

    try {
      const commands = parse(script);
      await interpreter.run(commands);
      fail('Expected an error to be thrown');
    } catch (error) {
      expect(error.message).toContain('wrong (string) expected, but test (string) encountered');
      // Line number info should be available - CALL statements now have line numbers
      expect(error.message).toMatch(/line \d+|Error at line \d+|\([^:]+: \d+\)/);
      // Should report the CALL line (line 3) as part of the call stack
      expect(error.message).toMatch(/\(line 3\)|Error at line 3|line 3/);
    }
  });

  test('should report correct line numbers for nested subroutine failures', async () => {
    const script = `
      REQUIRE "../src/expectations-address.js"
      CALL OuterSub
      EXIT 0
      
      OuterSub:
        CALL InnerSub
      RETURN
      
      InnerSub:
        LET nested_var = "nested"
        ADDRESS EXPECTATIONS "{nested_var} should equal 'incorrect'"
      RETURN
    `;

    try {
      const commands = parse(script);
      await interpreter.run(commands);
      fail('Expected an error to be thrown');
    } catch (error) {
      expect(error.message).toContain('incorrect (string) expected, but nested (string) encountered');
      // Line number info should be available - CALL statements now have line numbers
      expect(error.message).toMatch(/line \d+|Error at line \d+|\([^:]+: \d+\)/);
      // Should report the CALL lines as part of the call stack (lines 2 and 7 in inner subroutine call path)
      expect(error.message).toMatch(/line \d+.*CALL/);
    }
  });

  test('should report correct line numbers for deeply nested subroutines', async () => {
    const script = `
      REQUIRE "../src/expectations-address.js"
      CALL Level1
      EXIT 0
      
      Level1:
        CALL Level2
      RETURN
      
      Level2:
        CALL Level3
      RETURN
      
      Level3:
        LET deep_var = "deep"
        ADDRESS EXPECTATIONS "{deep_var} should equal 'failure'"
      RETURN
    `;

    try {
      const commands = parse(script);
      await interpreter.run(commands);
      fail('Expected an error to be thrown');
    } catch (error) {
      expect(error.message).toContain('failure (string) expected, but deep (string) encountered');
      // Line number info should be available - CALL statements now have line numbers
      expect(error.message).toMatch(/line \d+|Error at line \d+|\([^:]+: \d+\)/);
      // Should report CALL lines as part of the call stack
      expect(error.message).toMatch(/line \d+.*CALL/);
    }
  });

  test('should report correct line numbers with multiple statements in subroutines', async () => {
    const script = `
      REQUIRE "../src/expectations-address.js"
      CALL ComplexSub
      EXIT 0
      
      ComplexSub:
        LET var1 = "first"
        LET var2 = "second" 
        LET var3 = "third"
        ADDRESS EXPECTATIONS "{var1} should equal 'first'"
        ADDRESS EXPECTATIONS "{var2} should equal 'second'"
        ADDRESS EXPECTATIONS "{var3} should equal 'wrong'"
        LET var4 = "fourth"
      RETURN
    `;

    try {
      const commands = parse(script);
      await interpreter.run(commands);
      fail('Expected an error to be thrown');
    } catch (error) {
      expect(error.message).toContain('wrong (string) expected, but third (string) encountered');
      // Line number info should be available - CALL statements now have line numbers
      expect(error.message).toMatch(/line \d+|Error at line \d+|\([^:]+: \d+\)/);
      // Should report the CALL line as part of the call stack
      expect(error.message).toMatch(/line \d+.*CALL/);
    }
  });

  test('should report correct line numbers from external REXX file', async () => {
    // Create a temporary REXX file with a subroutine failure
    const tempScript = `
      REQUIRE "../src/expectations-address.js"
      CALL FailingSub
      EXIT 0

      FailingSub:
        LET file_var = "fromfile"
        ADDRESS EXPECTATIONS "{file_var} should equal 'wrong'"
      RETURN
    `;
    
    const tempFilePath = path.join(__dirname, 'temp-line-number-test.rexx');
    fs.writeFileSync(tempFilePath, tempScript);

    try {
      const tempContent = fs.readFileSync(tempFilePath, 'utf8');
      const commands = parse(tempContent);
      await interpreter.run(commands, tempContent, tempFilePath);
      fail('Expected an error to be thrown');
    } catch (error) {
      expect(error.message).toContain('wrong (string) expected, but fromfile (string) encountered');
      // Should have line number information - could be various formats
      expect(error.message).toMatch(/line \d+|Error at line \d+|\([^:]+: \d+\)/);
      // Should include the filename in error reporting
      expect(error.message).toContain('temp-line-number-test.rexx');
    } finally {
      // Clean up temp file
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  });
});