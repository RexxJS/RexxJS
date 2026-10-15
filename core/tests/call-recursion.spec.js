/**
 * A routine that CALLs itself (TODO.md, "Recursion through CALL never
 * stops"), found making IF() lazy for sae's spreadsheet. Two bugs, each
 * its own:
 * - CALL DOWN n - 1 passed 3 every time: with no commas the arguments were
 *   split at blanks, so n, - and 1 were three arguments, and the routine's
 *   own ARG took the first.
 * - CALL DOWN m with m holding 0 arrived as the text m: the argument lookup
 *   took a falsy value for "no such variable".
 */

const { Interpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

describe('a routine that CALLs itself', () => {
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

  test('the TODO entry: CALL DOWN n - 1 counts down and stops', async () => {
    await run([
      'CALL DOWN 3',
      'SAY "done"',
      'EXIT',
      'DOWN: PROCEDURE',
      '  ARG n',
      '  SAY n',
      '  IF n > 0 THEN CALL DOWN n - 1',
      '  RETURN 0',
    ].join('\n'));
    expect(said).toEqual(['3', '2', '1', '0', 'done']);
  });

  test('a variable holding 0 arrives as 0, not as its name', async () => {
    await run([
      'CALL DOWN 3',
      'SAY "done"',
      'EXIT',
      'DOWN: PROCEDURE',
      '  ARG n',
      '  SAY n',
      '  LET m = n - 1',
      '  IF n > 0 THEN CALL DOWN m',
      '  RETURN 0',
    ].join('\n'));
    expect(said).toEqual(['3', '2', '1', '0', 'done']);
  });

  // The usual factorial (CALL FACT n - 1 ... RETURN n * RESULT) is in
  // procedure.spec.js: it needs PROCEDURE's own variables per call.

  test('an expression argument alongside a plain one, comma-separated', async () => {
    await run([
      'n = 4',
      'CALL SHOW n + 1, "x"',
      'EXIT',
      'SHOW:',
      '  ARG a, b',
      '  SAY a b',
      '  RETURN',
    ].join('\n'));
    expect(said).toEqual(['5 x']);
  });

  describe('still works', () => {
    test('a routine called once', async () => {
      await run('CALL GREET "world"\nSAY "after"\nEXIT\nGREET:\n  ARG who\n  SAY "hello" who\n  RETURN');
      expect(said).toEqual(['hello world', 'after']);
    });

    test('a routine calling another', async () => {
      await run([
        'CALL OUTER 2',
        'SAY "after"',
        'EXIT',
        'OUTER:',
        '  ARG x',
        '  CALL INNER x',
        '  SAY "outer" RESULT',
        '  RETURN',
        'INNER:',
        '  ARG y',
        '  RETURN y * 10',
      ].join('\n'));
      expect(said).toEqual(['outer 20', 'after']);
    });

    test('blank-separated plain arguments are still each an argument', async () => {
      await run('CALL PAIR 1 2\nEXIT\nPAIR:\n  ARG a, b\n  SAY a "and" b\n  RETURN');
      expect(said).toEqual(['1 and 2']);
    });

    test('a negative number is an argument, not an operator', async () => {
      await run('CALL PAIR -5 2\nEXIT\nPAIR:\n  ARG a, b\n  SAY a "and" b\n  RETURN');
      expect(said).toEqual(['-5 and 2']);
    });
  });
});
