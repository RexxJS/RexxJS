/**
 * SAY LENGTH(a || b) said 2 while SAY LENGTH(a||b) said 4: parseFunctionCall
 * ended a positional argument at the first blank outside quotes and
 * parentheses, so the argument was a, and " || b" was dropped. The same
 * cut took MAX(5 + 3, 2) to MAX(5). A blank now ends an argument only
 * when neither what came before nor what follows is a binary operator.
 */

const { Interpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

describe('a function call whose argument has blanks around an operator', () => {
  let interpreter;
  let said;

  beforeEach(() => {
    said = [];
    interpreter = new Interpreter(null, { output: (line) => said.push(String(line)) });
  });

  const run = async (script) => {
    await interpreter.run(parse(script));
    return said;
  };

  test('SAY LENGTH(a || b) and SAY LENGTH(a||b) both say 4', async () => {
    await run('a = "ab"\nb = "cd"\nSAY LENGTH(a || b)\nSAY LENGTH(a||b)');
    expect(said).toEqual(['4', '4']);
  });

  test('SAY "a" LENGTH(x || y) "b" keeps its spacing', async () => {
    await run('x = "ab"\ny = "cd"\nSAY "a" LENGTH(x || y) "b"');
    expect(said).toEqual(['a 4 b']);
  });

  test('an arithmetic argument with blanks: MAX(5 + 3, 2)', async () => {
    await run('SAY MAX(5 + 3, 2)');
    expect(said).toEqual(['8']);
  });

  test('a comparison argument with blanks, and a literal holding a blank', async () => {
    await run('n = 5\nSAY WORD("one two three", n - 3)');
    expect(said).toEqual(['two']);
  });

  test('in a LET, too', async () => {
    await run('a = "ab"\nb = "cd"\nLET n = LENGTH(a || b)\nSAY n');
    expect(said).toEqual(['4']);
  });

  describe('still', () => {
    test('a quoted literal holding a blank and an operator is one argument', async () => {
      await run('SAY LENGTH("a + b")');
      expect(said).toEqual(['5']);
    });

    test('a comma-separated call', async () => {
      await run('SAY SUBSTR("hello world", 7, 5)');
      expect(said).toEqual(['world']);
    });
  });
});
