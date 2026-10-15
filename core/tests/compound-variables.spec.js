/**
 * Compound variables: the tail is substituted. The rule followed is classic
 * REXX's, as TRL (Cowlishaw, The REXX Language, 2nd ed., section 3.4
 * "Compound symbols") and the ooRexx Reference (1.11.3 "Compound symbols")
 * give it:
 *
 * - A compound symbol is a stem (a name and a period) followed by a tail of
 *   one or more symbols or numbers, separated by periods.
 * - Its derived name is the stem followed by each tail part's value: a tail
 *   part that is a set variable is replaced by that variable's value, so
 *   with i = 2, list.i names LIST.2, and list.i and list.2 are the same
 *   variable. A tail part that is a number, or a variable that has not been
 *   set, stays as it is.
 * - Each tail part is substituted on its own: list.i.j is the stem with the
 *   value of i, then the value of j.
 * - stem.0, with the count, is the usual way to say how many a stem holds.
 *
 * RexxJS keeps a stem's compound variables in one root entry (list holds
 * list.2); only the tail's resolution changes here. Variable names are
 * case-sensitive in RexxJS, so an unset tail symbol stays as typed (where
 * classic REXX would uppercase it), which keeps result.message = x and
 * SAY result.message naming the same variable.
 */

const { Interpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

describe('Compound variables', () => {
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

  test("the task's case: with i = 2, list.i = x sets LIST.2", async () => {
    await run([
      'i = 2',
      'list.i = "x"',
      'SAY list.i',
      'SAY list.2',
    ]);
    expect(said).toEqual(['x', 'x']);
    expect(interpreter.variables.get('list')).toEqual({ 2: 'x' });
  });

  test('a value set by number is read back by variable', async () => {
    await run([
      'list.2 = "x"',
      'i = 2',
      'SAY list.i',
    ]);
    expect(said).toEqual(['x']);
  });

  test('each part of a longer tail is substituted on its own', async () => {
    await run([
      'i = 2',
      'j = 3',
      'list.i.j = "y"',
      'SAY list.2.3',
      'SAY list.i.3',
      'SAY list.2.j',
    ]);
    expect(said).toEqual(['y', 'y', 'y']);
  });

  test('stem.0 holds the count, and DO i = 1 TO stem.0 reads stem.i', async () => {
    await run([
      'a.1 = "p"',
      'a.2 = "q"',
      'a.0 = 2',
      'DO i = 1 TO a.0',
      '  SAY a.i',
      'END',
    ]);
    expect(said).toEqual(['p', 'q']);
  });

  test('a tail that is a set variable is substituted in an expression too', async () => {
    await run([
      'n.1 = 10',
      'n.2 = 20',
      'k = 1',
      'x = n.k + n.2',
      'SAY x',
    ]);
    expect(said).toEqual(['30']);
  });

  test('an unset tail symbol is its own name', async () => {
    await run([
      'result.message = "done"',
      'SAY result.message',
    ]);
    expect(said).toEqual(['done']);
    expect(interpreter.variables.get('result')).toEqual({ message: 'done' });
  });

  test('the tail is substituted in a {{compound}} interpolation', async () => {
    await run([
      'i = 2',
      'list.i = "x"',
      'SAY "got {{list.i}}"',
    ]);
    expect(said).toEqual(['got x']);
  });

  test('DO OVER a stem still walks its values', async () => {
    await run([
      'i = 1',
      'list.i = "a"',
      'i = 2',
      'list.i = "b"',
      'DO v OVER list',
      '  SAY v',
      'END',
    ]);
    expect(said).toEqual(['a', 'b']);
  });

  test('inside a PROCEDURE routine the tail is the routine\'s own variable', async () => {
    await run([
      'i = 1',
      'CALL FILL',
      'SAY i',
      'EXIT',
      'FILL: PROCEDURE',
      '  i = 2',
      '  cell.i = "two"',
      '  SAY cell.2',
      '  RETURN',
    ]);
    expect(said).toEqual(['two', '1']);
  });
});
