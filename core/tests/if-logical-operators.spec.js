/**
 * | and & in a condition: classic REXX's logical or and and (TRL 2.3, "Logical
 * (boolean)"), & binding tighter than |, each side a comparison of its own:
 *
 *     IF RESULT.san \= w | RESULT.by \= 'white' THEN ...
 *
 * RexxJS split a condition at its first comparison operator, so the above
 * compared RESULT.san with the whole rest ("w | RESULT.by \= 'white'") and
 * was true whatever the values. Found by the chess app's match script
 * (chaess TODO.md 6.1), checking a relayed move.
 */

const { Interpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

describe('| and & in IF, WHEN and DO WHILE conditions', () => {
  let said;
  let interpreter;
  beforeEach(() => {
    said = [];
    interpreter = new Interpreter(null, { output: (line) => said.push(String(line)) });
  });
  const run = async (lines) => {
    await interpreter.run(parse(lines.join('\n')));
    return said;
  };

  test('| : either comparison', async () => {
    expect(await run(["a = 'x'", "b = 'y'",
      "IF a \\= 'x' | b \\= 'y' THEN SAY 'one differs'", "ELSE SAY 'both as said'",
      "IF a \\= 'x' | b = 'y' THEN SAY 'one holds'", "ELSE SAY 'none'"])).toEqual(['both as said', 'one holds']);
  });

  test('& : both comparisons', async () => {
    expect(await run(['n = 3',
      'IF n > 1 & n < 5 THEN SAY "inside"', 'ELSE SAY "outside"',
      'IF n > 1 & n > 5 THEN SAY "inside"', 'ELSE SAY "outside"'])).toEqual(['inside', 'outside']);
  });

  test('& binds tighter than |, parentheses group', async () => {
    expect(await run(['a = 1', 'b = 0', 'c = 0',
      'IF a = 1 | b = 1 & c = 1 THEN SAY "yes"', 'ELSE SAY "no"',
      'IF (a = 1 | b = 1) & c = 1 THEN SAY "yes"', 'ELSE SAY "no"'])).toEqual(['yes', 'no']);
  });

  test('a | or & inside quotes, || and |> are not logical', async () => {
    expect(await run(["s = 'a|b'", "t = 'a' || 'b'",
      "IF s = 'a|b' THEN SAY 'quoted bar'",
      "IF t = 'ab' THEN SAY 'concatenated'"])).toEqual(['quoted bar', 'concatenated']);
  });

  test('DO WHILE with &', async () => {
    expect(await run(['i = 0', 'DO WHILE i < 10 & i \\= 3', '  i = i + 1', 'END', 'SAY i'])).toEqual(['3']);
  });
});
