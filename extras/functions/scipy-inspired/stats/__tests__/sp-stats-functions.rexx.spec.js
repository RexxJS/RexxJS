const path = require('path');

// Import the Rexx interpreter from core
const { RexxInterpreter } = require('../../../../../core/src/interpreter');
const { parse } = require('../../../../../core/src/parser');

// Import the function module for direct registration  
const spStatsFunctions = require('../src/sp-stats-functions');

describe('SciPy Stats Functions - Rexx Integration Tests', () => {
  let interpreter;
  
  beforeEach(() => {
    interpreter = new RexxInterpreter(null, {
      output: (text) => {}, // Silent for tests
      loadPaths: [path.join(__dirname, '../../../../core/src')]
    });
    
    // Register SciPy Stats functions directly with the interpreter
    // This verifies that functions are properly "hooked up" for REXX use
    Object.keys(spStatsFunctions).forEach(funcName => {
      interpreter.builtInFunctions[funcName] = spStatsFunctions[funcName];
    });
  });

  test('should handle SP_STATS_FUNCTIONS_MAIN detection function', async () => {
    const rexxCode = `
      LET result = SP_STATS_FUNCTIONS_MAIN
      SAY "Detection function result: " || result.loaded
    `;
    
    const commands = parse(rexxCode);
    await interpreter.run(commands);
    
    const result = interpreter.variables.get('result');
    expect(result).toBeDefined();
    expect(result.type).toBe('library_info');
    expect(result.name).toBe('SciPy Stats Functions');
    expect(result.loaded).toBe(true);
  });

  test('should register norm distribution object', () => {
    // Test that norm object is properly registered with interpreter
    expect(interpreter.builtInFunctions.norm).toBeDefined();
    expect(typeof interpreter.builtInFunctions.norm.pdf).toBe('function');
    expect(typeof interpreter.builtInFunctions.norm.cdf).toBe('function');
    expect(typeof interpreter.builtInFunctions.norm.ppf).toBe('function');
  });

  test('should register sp_describe statistical function', () => {
    // Test that sp_describe function is properly registered with interpreter
    expect(interpreter.builtInFunctions.sp_describe).toBeDefined();
    expect(typeof interpreter.builtInFunctions.sp_describe).toBe('function');
    
    // Test function execution directly
    const testData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const result = interpreter.builtInFunctions.sp_describe(testData);
    expect(result.nobs).toBe(10);
    expect(result.mean).toBeCloseTo(5.5);
    expect(Array.isArray(result.minmax)).toBe(true);
    expect(result.minmax[0]).toBe(1);
    expect(result.minmax[1]).toBe(10);
  });
});