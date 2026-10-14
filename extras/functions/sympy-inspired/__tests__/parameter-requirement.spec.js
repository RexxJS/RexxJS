/**
 * Tests for sympy function parameter requirements: a function called with
 * nothing to work on says so.
 *
 * The module exports SY_SYMBOL, SY_NUM and SY_DIFF. This spec used to test
 * SYMPY_SIMPLIFY, SYMPY_EXPAND and six more that the module never had, and
 * could not load (its paths were one level short), so until 2026-10-14
 * none of it had run.
 */

describe('sympy Function Parameter Requirements', () => {
  let interpreter;
  let parse;

  beforeEach(() => {
    const { Interpreter } = require('../../../../core/src/interpreter.js');
    ({ parse } = require('../../../../core/src/parser.js'));
    interpreter = new Interpreter();
    // The module's functions, as built-in functions: they take positional
    // arguments
    Object.assign(interpreter.builtInFunctions, require('../src/sympy-functions.js'));
  });

  test('SY_SYMBOL without parameters should throw clear error', async () => {
    await expect(interpreter.run(parse('result = SY_SYMBOL()'))).rejects.toThrow('Symbol name must be a non-empty string.');
  });

  test('SY_DIFF without parameters should throw clear error', async () => {
    await expect(interpreter.run(parse('result = SY_DIFF()'))).rejects.toThrow('Cannot convert');
  });

  test('SY_NUM without parameters is the number 0', async () => {
    await interpreter.run(parse('result = SY_NUM()'));
    expect(interpreter.getVariable('result')).toEqual({ value: 0 });
  });
});
