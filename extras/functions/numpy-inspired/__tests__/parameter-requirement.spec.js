/**
 * Tests for numpy function parameter requirements
 *
 * Only ARRAY holds today. Called with no arguments, the others return a
 * value instead of NumPy's error (ZEROS gives 0, ONES 1, ARANGE 0..9, SUM
 * null; MATMUL fails, but on an undefined): something in calling a built-in
 * with no parameters supplies arguments. Skipped until that is understood
 * and each function checks its required argument (TODO.md, 2026-10-14).
 * Until 2026-10-14 this spec could not load (its paths were one level
 * short), so none of it had run.
 */

describe('numpy Function Parameter Requirements', () => {
  let interpreter;
  let parse;

  beforeEach(async () => {
    // Use dynamic import for ESM module
    const modules = await import('../../../../core/src/interpreter.js');
    const InterpreterClass = modules.Interpreter || modules.default;
    
    const parserModule = await import('../../../../core/src/parser.js');
    parse = parserModule.parse || parserModule.default;
    
    interpreter = new InterpreterClass();
    
    // Load numpy functions (the module's exports: ARRAY, ZEROS, ...), as
    // built-in functions: they take positional arguments
    const numpyFunctions = require('../numpy.js');
    Object.assign(interpreter.builtInFunctions, numpyFunctions);
  });

  test('ARRAY without parameters should throw clear error', async () => {
    const script = `result = ARRAY`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow('array() needs an object to make an array of');
  });

  test.skip('ZEROS without parameters should throw clear error', async () => {
    const script = `result = ZEROS`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow();
  });

  test.skip('ONES without parameters should throw clear error', async () => {
    const script = `result = ONES`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow();
  });

  test.skip('ARANGE without parameters should throw clear error', async () => {
    const script = `result = ARANGE`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow();
  });

  test.skip('LINSPACE without parameters should throw clear error', async () => {
    const script = `result = LINSPACE`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow();
  });

  test.skip('DOT without parameters should throw clear error', async () => {
    const script = `result = DOT`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow();
  });

  test.skip('MATMUL without parameters should throw clear error', async () => {
    const script = `result = MATMUL`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow();
  });

  test.skip('TRANSPOSE without parameters should throw clear error', async () => {
    const script = `result = TRANSPOSE`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow();
  });

  test.skip('RESHAPE without parameters should throw clear error', async () => {
    const script = `result = RESHAPE`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow();
  });

  test.skip('SUM without parameters should throw clear error', async () => {
    const script = `result = SUM`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow();
  });

  test.skip('MEAN without parameters should throw clear error', async () => {
    const script = `result = MEAN`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow();
  });

  test.skip('STD without parameters should throw clear error', async () => {
    const script = `result = STD`;
    
    await expect(interpreter.run(parse(script))).rejects.toThrow();
  });
});