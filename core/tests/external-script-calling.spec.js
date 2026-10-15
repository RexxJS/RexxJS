/**
 * External Script Calling Tests
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { RexxInterpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');
const fs = require('fs');
const path = require('path');

describe('External REXX Script Calling', () => {
  let interpreter;
  let mockRpc;
  let tempDir;
  let testScriptPath;

  beforeEach(() => {
    mockRpc = {
      send: jest.fn().mockResolvedValue('mock response')
    };
    interpreter = new RexxInterpreter(mockRpc);
    
    // Create temporary directory for test scripts
    tempDir = path.join(__dirname, 'temp-scripts');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    
    testScriptPath = path.join(tempDir, 'external-script-calling.rexx');
  });

  afterEach(() => {
    // Clean up temporary files
    if (fs.existsSync(testScriptPath)) {
      fs.unlinkSync(testScriptPath);
    }
    if (fs.existsSync(tempDir)) {
      try {
        fs.rmdirSync(tempDir);
      } catch (e) {
        // Directory might not be empty, ignore
      }
    }
  });

  test('should detect external script calls correctly', () => {
    // Test the detection logic - only relative paths starting with ./ or ../ are external
    expect(interpreter.isExternalScriptCall('test.rexx')).toBe(false);
    expect(interpreter.isExternalScriptCall('path/to/script.rexx')).toBe(false);
    expect(interpreter.isExternalScriptCall('./relative/script.rexx')).toBe(true);
    expect(interpreter.isExternalScriptCall('../parent/script.rexx')).toBe(true);
    expect(interpreter.isExternalScriptCall('RegularSubroutine')).toBe(false);
    expect(interpreter.isExternalScriptCall('UPPERCASE_SUB')).toBe(false);
  });

  test('should call external script without arguments', async () => {
    // Create a simple external script
    const externalScript = `
      SAY "External script executed"
      LET result = 42
      RETURN result
    `;
    
    fs.writeFileSync(testScriptPath, externalScript);
    
    // Main script that calls the external one
    const rel = './' + path.relative(process.cwd(), testScriptPath).replace(/\\/g, '/');
    const mainScript = `
      LET external_result = CALL "${rel}"
    `;

    await interpreter.run(parse(mainScript));
    
    expect(interpreter.getVariable('external_result')).toBe(42);
  });

  test('should call external script with single argument', async () => {
    // Create external script that uses ARG.1
    const externalScript = `
      PARSE ARG input_value
      LET doubled = input_value * 2
      RETURN doubled
    `;
    
    fs.writeFileSync(testScriptPath, externalScript);
    
    // Main script that calls external with argument
    const rel2 = './' + path.relative(process.cwd(), testScriptPath).replace(/\\/g, '/');
    const mainScript = `
      LET input = 15
      LET result = CALL "${rel2}" input
    `;

    await interpreter.run(parse(mainScript));
    
    expect(interpreter.getVariable('result')).toBe(30);
  });

  test('should call external script with multiple arguments', async () => {
    // Create external script that uses multiple arguments
    const externalScript = `
      PARSE ARG first second third
      LET sum = first + second + third
      RETURN sum
    `;
    
    fs.writeFileSync(testScriptPath, externalScript);
    
    // Main script that calls external with multiple arguments
    const rel3 = './' + path.relative(process.cwd(), testScriptPath).replace(/\\/g, '/');
    const mainScript = `
      LET a = 10
      LET b = 20
      LET c = 30
      LET total = CALL "${rel3}" a b c
    `;

    await interpreter.run(parse(mainScript));
    
    expect(interpreter.getVariable('total')).toBe(60);
  });

  test('should handle variable scoping isolation', async () => {
    // Create external script that sets its own variables
    const externalScript = `
      LET local_var = "external value"
      LET shared_name = "from external"
      RETURN "external done"
    `;
    
    fs.writeFileSync(testScriptPath, externalScript);
    
    // Main script with same variable names
    const rel4 = './' + path.relative(process.cwd(), testScriptPath).replace(/\\/g, '/');
    const mainScript = `
      LET local_var = "main value"
      LET shared_name = "from main"
      LET result = CALL "${rel4}"
      -- Variables should remain unchanged in main script
    `;

    await interpreter.run(parse(mainScript));
    
    // Main script variables should be unchanged
    expect(interpreter.getVariable('local_var')).toBe('main value');
    expect(interpreter.getVariable('shared_name')).toBe('from main');
    expect(interpreter.getVariable('result')).toBe('external done');
  });

  test('should handle external script that calls another external script', async () => {
    // Create second external script first (needed for path reference)
    const secondScriptPath = path.join(tempDir, 'second.rexx');
    
    // Create first external script
    const firstScriptPath = path.join(tempDir, 'first.rexx');
    const secondRel = './' + path.relative(process.cwd(), secondScriptPath).replace(/\\/g, '/');
    const firstScript = `
      PARSE ARG value
      LET intermediate = value * 2
      LET final_result = CALL "${secondRel}" intermediate
      RETURN final_result
    `;
    const secondScript = `
      PARSE ARG input
      LET output = input + 5
      RETURN output
    `;
    
    fs.writeFileSync(firstScriptPath, firstScript);
    fs.writeFileSync(secondScriptPath, secondScript);
    
    // Main script
    const firstRel = './' + path.relative(process.cwd(), firstScriptPath).replace(/\\/g, '/');
    const mainScript = `
      LET initial = 10
      LET result = CALL "${firstRel}" initial
    `;

    await interpreter.run(parse(mainScript));
    
    // Should be (10 * 2) + 5 = 25
    expect(interpreter.getVariable('result')).toBe(25);
    
    // Clean up additional files
    fs.unlinkSync(firstScriptPath);
    fs.unlinkSync(secondScriptPath);
  });

  test('should handle missing external script gracefully', async () => {
    const nonExistentPath = path.join(tempDir, 'missing.rexx');
    
    const missingRel = './' + path.relative(process.cwd(), nonExistentPath).replace(/\\/g, '/');
    const mainScript = `
      LET result = CALL "${missingRel}"
    `;

    // Should throw an error when trying to call non-existent script
    await expect(interpreter.run(parse(mainScript))).rejects.toThrow();
  });

  test('should handle external script with REXX file extension', async () => {
    const scriptWithExt = path.join(tempDir, 'test.rexx');
    const externalScript = `
      LET message = "Script with .rexx extension"
      RETURN message
    `;
    
    fs.writeFileSync(scriptWithExt, externalScript);
    
    const extRel = './' + path.relative(process.cwd(), scriptWithExt).replace(/\\/g, '/');
    const mainScript = `
      LET result = CALL "${extRel}"
    `;

    await interpreter.run(parse(mainScript));
    
    expect(interpreter.getVariable('result')).toBe('Script with .rexx extension');
    
    // Clean up
    fs.unlinkSync(scriptWithExt);
  });

  test('should handle relative path external scripts', async () => {
    const relativeScript = './tests/temp-scripts/relative.rexx';
    const absolutePath = path.join(tempDir, 'relative.rexx');
    
    const externalScript = `
      LET relative_result = "Called via relative path"
      RETURN relative_result
    `;
    
    fs.writeFileSync(absolutePath, externalScript);
    
    const mainScript = `
      LET result = CALL "${relativeScript}"
    `;

    await interpreter.run(parse(mainScript));
    
    expect(interpreter.getVariable('result')).toBe('Called via relative path');
    
    // Clean up
    fs.unlinkSync(absolutePath);
  });

  test('should preserve ARG parsing in external scripts', async () => {
    // Create external script that uses complex ARG parsing
    const externalScript = `
      PARSE ARG first . second third .
      LET parsed_result = first || "-" || second || "-" || third
      RETURN parsed_result
    `;
    
    fs.writeFileSync(testScriptPath, externalScript);
    
    // Main script with multiple arguments including spaces
    const parseRel = './' + path.relative(process.cwd(), testScriptPath).replace(/\\/g, '/');
    const mainScript = `
      LET result = CALL "${parseRel}" "hello world" ignored "test value" "extra ignored"
    `;

    await interpreter.run(parse(mainScript));
    
    expect(interpreter.getVariable('result')).toBe('hello world-test value-extra ignored');
  });
});
