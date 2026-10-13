/**
 * Expressions as function arguments: MAX(B + 1, 2).
 *
 * Bug: a function's arguments were kept as text and resolved as a literal,
 * a number or a name, so an argument with an operator was never worked
 * out: MAX(B + 1, 2) came to 2, ABS(B - 3000) to 0, and an external
 * function was handed the text "B<0". An argument that is an expression is
 * now parsed as one, and evaluated before the call.
 */

const { Interpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

describe('Expressions as function arguments', () => {
  let interpreter;

  beforeEach(() => {
    interpreter = new Interpreter(null, { output: () => {} });
    interpreter.externalFunctions.ARGS_OF = (...args) => JSON.stringify(args);
  });

  const value = async (setup, expr) => {
    await interpreter.run(parse(`${setup}\nLET X = ${expr}`));
    return interpreter.getVariable('X');
  };

  test('arithmetic in a built-in function\'s arguments', async () => {
    expect(await value('LET B = 2500', 'MAX(B + 1, 2)')).toBe(2501);
    expect(await value('LET B = 2500', 'ABS(B - 3000)')).toBe(500);
    expect(await value('LET B = 2', 'MIN(B * 3, 10, B ** 3)')).toBe(6);
  });

  test('an external function is given values, not text', async () => {
    expect(await value('LET B = 2500', 'ARGS_OF(B < 0, B + 1, "B + 1")')).toBe('[0,2501,"B + 1"]');
  });

  test('concatenation and pipes as arguments', async () => {
    expect(await value('LET S = "ab"', 'LENGTH(S || "cd")')).toBe(4);
    expect(await value('LET S = "ab"', 'ARGS_OF(S |> UPPER)')).toBe('["AB"]');
  });

  test('plain arguments are as before', async () => {
    expect(await value('LET B = 3', 'ARGS_OF(B, 4, "x", ABS(-2))')).toBe('[3,4,"x",2]');
  });
});
