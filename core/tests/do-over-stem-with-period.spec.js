/**
 * DO v OVER stem. (the stem written with its trailing period, as classic
 * REXX names a stem: TRL 3.4, "a stem is a symbol ending in a period")
 * walks the stem's values, as DO v OVER stem (without the period) already
 * does. The period names the stem; it is not part of a text to walk.
 *
 * Before: stem. was read as the unset symbol STEM., and DO OVER walked the
 * characters of that text: S, T, E, M and the period.
 */

const { Interpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

describe('DO v OVER stem. walks the stem', () => {
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

  test("the task's case: the stem's values, not the characters of STEM.", async () => {
    await run(['stem.1 = "a"', 'stem.2 = "b"', 'DO v OVER stem.', '  SAY v', 'END']);
    expect(said).toEqual(['a', 'b']);
  });

  test('the same values as DO v OVER stem, a tail substituted in assignment', async () => {
    await run([
      'i = 1', 'list.i = "x"', 'i = 2', 'list.i = "y"',
      'DO v OVER list.', '  SAY v', 'END',
      'DO v OVER list', '  SAY v', 'END',
    ]);
    expect(said).toEqual(['x', 'y', 'x', 'y']);
  });

  test('LEAVE inside it', async () => {
    await run(['s.1 = "a"', 's.2 = "b"', 's.3 = "c"', 'DO v OVER s.', '  IF v = "b" THEN LEAVE', '  SAY v', 'END']);
    expect(said).toEqual(['a']);
  });
});
