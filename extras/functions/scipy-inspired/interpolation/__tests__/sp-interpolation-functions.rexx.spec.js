const path = require('path');

// Import the Rexx interpreter from core
const { RexxInterpreter } = require('../../../../../core/src/interpreter');
const { parse } = require('../../../../../core/src/parser');

// Import the function module for direct registration  
const spInterpolationFunctions = require('../index');

describe('SciPy Interpolation Functions - Rexx Integration Tests', () => {
  let interpreter;
  
  beforeEach(() => {
    interpreter = new RexxInterpreter(null, {
      output: (text) => {}, // Silent for tests
      loadPaths: [path.join(__dirname, '../../../../core/src')]
    });
    
    // Register SciPy Interpolation functions directly with the interpreter
    // This verifies that functions are properly "hooked up" for REXX use
    Object.keys(spInterpolationFunctions).forEach(funcName => {
      interpreter.builtInFunctions[funcName] = spInterpolationFunctions[funcName];
    });
  });

  test('should handle SCIPY_INTERPOLATION_MAIN detection function', async () => {
    const rexxCode = `
      LET result = SCIPY_INTERPOLATION_MAIN
      SAY "Detection function result: " || result.loaded
    `;
    
    const commands = parse(rexxCode);
    await interpreter.run(commands);
    
    const result = interpreter.variables.get('result');
    expect(result).toBeDefined();
    expect(result.type).toBe('function-library');
    expect(result.name).toBe('SciPy Interpolation Functions');
    expect(result.provides).toBeDefined();
    expect(result.provides.functions).toBeDefined();
    expect(Array.isArray(result.provides.functions)).toBe(true);
  });

  test('should handle INTERP1D linear interpolation through Rexx interpreter', async () => {
    const rexxCode = `
      LET x = "[1, 2, 3, 4, 5]"
      LET y = "[2, 4, 1, 3, 5]"
      LET options = '{"kind": "linear"}'
      LET result = INTERP1D x=x y=y options=options
      SAY "INTERP1D result type: " || result.type
    `;
    
    const commands = parse(rexxCode);
    await interpreter.run(commands);
    
    const result = interpreter.variables.get('result');
    expect(result).toBeDefined();
    expect(result.type).toBe('interp1d');
    expect(result.kind).toBe('linear');
    expect(Array.isArray(result.x)).toBe(true);
    expect(Array.isArray(result.y)).toBe(true);
  });

  test('should handle INTERP1D cubic interpolation through Rexx interpreter', async () => {
    const rexxCode = `
      LET x = "[1, 2, 3, 4, 5]"
      LET y = "[1, 4, 9, 16, 25]"
      LET options = '{"kind": "cubic"}'
      LET result = INTERP1D x=x y=y options=options
      SAY "Cubic interpolation result: " || result.type
    `;
    
    const commands = parse(rexxCode);
    await interpreter.run(commands);
    
    const result = interpreter.variables.get('result');
    expect(result).toBeDefined();
    expect(result.type).toBe('interp1d');
    expect(result.kind).toBe('cubic');
  });

  test('should handle PCHIP interpolation through Rexx interpreter', async () => {
    const rexxCode = `
      LET x = "[0, 1, 2, 3, 4]"
      LET y = "[0, 1, 0, 1, 0]"
      LET result = PCHIP x=x y=y
      SAY "PCHIP result: " || result.type
    `;
    
    const commands = parse(rexxCode);
    await interpreter.run(commands);
    
    const result = interpreter.variables.get('result');
    expect(result).toBeDefined();
    expect(result.type).toBe('pchip');
    expect(Array.isArray(result.x)).toBe(true);
    expect(Array.isArray(result.y)).toBe(true);
    expect(Array.isArray(result.derivatives)).toBe(true);
  });

  test('should handle SPLREP B-spline preparation through Rexx interpreter', async () => {
    const rexxCode = `
      LET x = "[0, 1, 2, 3, 4]"
      LET y = "[0, 1, 4, 9, 16]"
      LET result = SPLREP x=x y=y
      SAY "SPLREP result: " || result.type
    `;
    
    const commands = parse(rexxCode);
    await interpreter.run(commands);
    
    const result = interpreter.variables.get('result');
    expect(result).toBeDefined();
    expect(result.type).toBe('splrep');
    expect(Array.isArray(result.t)).toBe(true); // knot vector
    expect(Array.isArray(result.c)).toBe(true); // coefficients
    expect(typeof result.k).toBe('number'); // degree
  });

  test('should handle RBF interpolation through Rexx interpreter', async () => {
    const rexxCode = `
      LET x = "[0, 1, 2]"
      LET d = "[0, 1, 0]"
      LET options = '{"function": "multiquadric"}'
      LET result = RBF x=x d=d options=options
      SAY "RBF result: " || result.type
    `;
    
    const commands = parse(rexxCode);
    await interpreter.run(commands);
    
    const result = interpreter.variables.get('result');
    expect(result).toBeDefined();
    expect(result.type).toBe('rbf');
    expect(result.function).toBe('multiquadric');
    expect(Array.isArray(result.x)).toBe(true);
    expect(Array.isArray(result.d)).toBe(true);
  });
});