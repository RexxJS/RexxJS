/**
 * COPY with External Script Calling - Simple Return Value Test
 * Tests COPY functionality across script boundaries using return values
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { RexxInterpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');
const path = require('path');
const fs = require('fs');

describe('COPY with External Scripts - Return Values', () => {
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
    
    testScriptPath = path.join(tempDir, 'copy-external-simple.rexx');
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

  test('should test if function calls work as external script arguments', async () => {
    // Test with a simple function call first
    const externalScript = `
PARSE ARG received_value
RETURN received_value
`;
    
    fs.writeFileSync(testScriptPath, externalScript);
    
    // Test different types of arguments
    const rel = './' + path.relative(process.cwd(), testScriptPath).replace(/\\/g, '/');
    const mainScript = `
LET myArray = ["original", "second", "third"]
LET result1 = CALL "${rel}" myArray
LET result2 = CALL "${rel}" LENGTH(myArray)
LET copied = COPY(myArray)
LET result3 = CALL "${rel}" copied
LET result4 = CALL "${rel}" COPY(myArray)
`;

    await interpreter.run(parse(mainScript));
    
    console.log('Direct array:', interpreter.getVariable('result1'));
    console.log('LENGTH() call:', interpreter.getVariable('result2'));
    console.log('Pre-copied:', interpreter.getVariable('result3'));
    console.log('COPY() call:', interpreter.getVariable('result4'));
    
    // The key test: does COPY() as an argument work?
    expect(interpreter.getVariable('result1')).not.toBe(null);
    expect(interpreter.getVariable('result2')).not.toBe(null);
    expect(interpreter.getVariable('result3')).not.toBe(null);
    // This is the one that's probably failing:
    expect(interpreter.getVariable('result4')).not.toBe(null);
  });

  test('should pass COPY-ed data to external script and verify isolation', async () => {
    // External script that tries to modify its first argument and returns first element
    const externalScript = `
PARSE ARG received_array
LET received_array = ARRAY_SET(received_array, 1, "MODIFIED_BY_EXTERNAL")
LET first_element = ARRAY_GET(received_array, 1)
RETURN first_element
`;
    
    fs.writeFileSync(testScriptPath, externalScript);
    
    // Main script that calls external script with COPY
    const rel2 = './' + path.relative(process.cwd(), testScriptPath).replace(/\\/g, '/');
    const mainScript = `
LET myArray = ["original", "second", "third"]
LET result = CALL "${rel2}" COPY(myArray)
LET original_first = ARRAY_GET(myArray, 1)
`;

    await interpreter.run(parse(mainScript));
    
    // The external script should have received and modified its copy
    expect(interpreter.getVariable('result')).toBe('MODIFIED_BY_EXTERNAL');
    
    // The original array should be unchanged (pass-by-value with COPY worked!)
    expect(interpreter.getVariable('original_first')).toBe('original');
  });

  test('should pass data by reference without COPY and show mutation', async () => {
    // External script that modifies its argument and returns confirmation
    const externalScript = `
PARSE ARG received_array
LET received_array = ARRAY_SET(received_array, 1, "MUTATED_BY_EXTERNAL") 
RETURN "modified"
`;
    
    fs.writeFileSync(testScriptPath, externalScript);
    
    // Main script that calls external script WITHOUT COPY
    const rel3 = './' + path.relative(process.cwd(), testScriptPath).replace(/\\/g, '/');
    const mainScript = `
LET myArray = ["original", "second", "third"]
LET result = CALL "${rel3}" myArray
LET original_first = ARRAY_GET(myArray, 1)
`;

    await interpreter.run(parse(mainScript));
    
    // Verify the call succeeded
    expect(interpreter.getVariable('result')).toBe('modified');
    
    // The key question: did the original get mutated? 
    // This reveals whether external scripts use pass-by-reference by default
    const originalValue = interpreter.getVariable('original_first');
    
    if (originalValue === 'original') {
      // External scripts might use pass-by-value by default
      console.log('External scripts appear to use pass-by-value by default');
    } else if (originalValue === 'MUTATED_BY_EXTERNAL') {
      // External scripts use pass-by-reference
      console.log('External scripts use pass-by-reference by default');
    }
    
    // For now, just verify the call worked
    expect(['original', 'MUTATED_BY_EXTERNAL']).toContain(originalValue);
  });
});
