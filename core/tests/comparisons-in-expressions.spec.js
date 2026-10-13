/**
 * Comparisons in an expression: LET X = B > 500.
 *
 * Bug: the comparison operators were known to IF, DO WHILE/UNTIL and SELECT
 * (parseCondition) but not to expressions, so `LET X = B > 500` read B as
 * a function call ("Function B is not available") and `LET X = (B > 500)`
 * came to B's own value. A comparison is now an operator like the others,
 * the loosest of them (after arithmetic and |>), and comes to 1 or 0, as
 * Rexx's comparisons do.
 */

const { Interpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

describe('Comparisons in expressions', () => {
  let interpreter;

  beforeEach(() => {
    interpreter = new Interpreter(null, { output: () => {} });
  });

  const value = async (setup, expr) => {
    await interpreter.run(parse(`${setup}\nLET X = ${expr}`));
    return interpreter.getVariable('X');
  };

  test('a number against a number', async () => {
    expect(await value('LET B = 1200', 'B > 500')).toBe(1);
    expect(await value('LET B = 1200', 'B < 500')).toBe(0);
    expect(await value('LET B = 1200', 'B >= 1200')).toBe(1);
    expect(await value('LET B = 1200', 'B <= 1199')).toBe(0);
  });

  test('equal and not equal, in each of Rexx\'s spellings', async () => {
    expect(await value('LET B = 3', 'B = 3')).toBe(1);
    expect(await value('LET B = 3', 'B = 3.0')).toBe(1);
    for (const op of ['\\=', '<>', '><', '!=', '¬=']) {
      expect(await value('LET B = 3', `B ${op} 3`)).toBe(0);
      expect(await value('LET B = 3', `B ${op} 4`)).toBe(1);
    }
  });

  test('strict equality compares the strings exactly', async () => {
    expect(await value('LET B = "5"', 'B == "5"')).toBe(1);
    expect(await value('LET B = "5"', 'B == "5.0"')).toBe(0);
    expect(await value('LET B = "5"', 'B \\== "5.0"')).toBe(1);
  });

  test('strings compare as strings', async () => {
    expect(await value('LET A = "apple"', 'A < "banana"')).toBe(1);
    expect(await value('LET A = "apple"', 'A = "apple"')).toBe(1);
  });

  test('arithmetic binds tighter than a comparison', async () => {
    expect(await value('LET A = 2', 'A + 1 > 2 * A')).toBe(0);
    expect(await value('LET A = 2', 'A * 3 = 6')).toBe(1);
  });

  test('in parentheses it is still a comparison, not its left side', async () => {
    expect(await value('LET B = 1200', '(B > 500)')).toBe(1);
    expect(await value('LET B = 1200', '(B > 500) + (B > 1000)')).toBe(2);
  });

  test('a function call on either side', async () => {
    expect(await value('LET S = "hello"', 'LENGTH(S) > 3')).toBe(1);
    expect(await value('LET S = "hello"', '3 >= LENGTH(S)')).toBe(0);
  });

  test('a comparison inside a quoted string is just text', async () => {
    expect(await value('', '"a > b"')).toBe('a > b');
  });
});
