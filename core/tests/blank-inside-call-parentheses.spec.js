/**
 * A blank between terms inside a call's parentheses is concatenation, as
 * it is outside them (TRL 6.1, "String concatenation"): LENGTH(a "yz") has
 * the one argument a's value, a blank, yz, and LENGTH(a"yz") (abuttal) the
 * one argument with nothing between. The rule, decided by TRL plus what the
 * suite pins:
 *
 * - Inside parentheses a comma separates arguments, and nothing else does.
 *   A blank between two terms concatenates them with one blank; a blank
 *   beside an operator (1 + 2) is the arithmetic, bound tighter.
 * - The same holds on every path a call is read by: as a statement's own
 *   expression (n = LENGTH(a "yz"), LET n = ...), in SAY, and inside an
 *   arithmetic expression (LENGTH(a "yz") + 1), whose space-stripping
 *   leaves a call's parentheses alone.
 * - RexxJS's call without parentheses (d = DATE 'S', x = UPPER s), which
 *   takes the rest of the line as the argument list, is kept; the suite
 *   pins no blank-separated multi-argument form of it (SUBSTR s 2 3), and
 *   none is introduced.
 *
 * Before: the positional-argument scanner ended an argument at a blank, so
 * SAY LENGTH(a "yz") was 1 (the "yz" dropped), and the arithmetic path's
 * removeSpacesExceptInQuotes made n = LENGTH(a "yz") the abuttal, 3.
 */

const { Interpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

describe('A blank inside a call\'s parentheses concatenates', () => {
  let interpreter;
  let said;

  beforeEach(() => {
    said = [];
    interpreter = new Interpreter(null, { output: (line) => said.push(String(line)) });
  });

  const run = async (lines) => {
    await interpreter.run(parse(lines.join('\n')));
    return said;
  };

  test("the task's case: n = LENGTH(a \"yz\") is 4 (TRL 6.1)", async () => {
    await run(['a = "x"', 'n = LENGTH(a "yz")', 'SAY n']);
    expect(said).toEqual(['4']);
  });

  test('with LET, in SAY, and inside an arithmetic expression', async () => {
    await run([
      'a = "x"',
      'LET n = LENGTH(a "yz")',
      'SAY n',
      'SAY LENGTH(a "yz")',
      'm = LENGTH(a "yz") + 1',
      'SAY m',
    ]);
    expect(said).toEqual(['4', '4', '5']);
  });

  test('abuttal inside the parentheses still concatenates with nothing between', async () => {
    await run(['a = "x"', 'SAY LENGTH(a"yz")', 'n = LENGTH(a"yz")', 'SAY n']);
    expect(said).toEqual(['3', '3']);
  });

  test('a comma still separates arguments; a blank-joined argument among them', async () => {
    await run([
      'a = "x"',
      'SAY SUBSTR(a "yz", 3)',
      'SAY WORDS(a "yz" "q")',
      'SAY SUBSTR("hello" "world", 1, 7)',
    ]);
    expect(said).toEqual(['yz', '3', 'hello w']);
  });

  test('a blank beside an operator is the arithmetic, bound tighter', async () => {
    await run([
      'SAY MAX(1 + 2, 2)',
      'SAY LENGTH(1 + 2 "ab")',
      'a = "x"',
      'SAY LENGTH(a || "yz")',
    ]);
    expect(said).toEqual(['3', '4', '3']);
  });

  test("RexxJS's call without parentheses is kept", async () => {
    await run(['d = DATE "S"', 'SAY LENGTH(d)', 's = "hello"', 'x = UPPER s', 'SAY x']);
    expect(said).toEqual(['8', 'HELLO']);
  });
});
