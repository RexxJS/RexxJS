/**
 * CALL arguments: classic REXX (TRL 2.3.5) evaluates each comma-separated
 * argument of CALL as an expression, so a name in the first position is a
 * variable (not a function call), and a concatenation or a nested call
 * among them is worked out before the routine sees it.
 */
const { Interpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

describe('CALL arguments are expressions', () => {
  const run = async (lines) => {
    const seen = [];
    const interpreter = new Interpreter(null, { output: (s) => seen.push(s) });
    await interpreter.run(parse(lines.join('\n')));
    return seen;
  };
  const show = ['show: PROCEDURE', 'PARSE ARG p, q', "SAY '[' || p || '][' || q || ']'", 'RETURN'];

  test('a variable in the first position', async () => {
    expect(await run(["a = 'v'", 'CALL show a, 2', 'EXIT', ...show])).toEqual(['[v][2]']);
  });

  test('a concatenation in the first position', async () => {
    expect(await run(["CALL show 'a' || 'b', 'c'", 'EXIT', ...show])).toEqual(['[ab][c]']);
  });

  test('a concatenation in a later position', async () => {
    expect(await run(["CALL show 'a', 'b' || 'c'", 'EXIT', ...show])).toEqual(['[a][bc]']);
  });

  test('a nested call among the arguments', async () => {
    expect(await run(["CALL show 'a', LENGTH('xyz') + 1", 'EXIT', ...show])).toEqual(['[a][4]']);
    expect(await run(["CALL show UPPER('q'), LENGTH('xy')", 'EXIT', ...show])).toEqual(['[Q][2]']);
  });

  test('abuttal and blank concatenation', async () => {
    expect(await run(["a = 'v'", "CALL show a 'w', a'x'", 'EXIT', ...show])).toEqual(['[v w][vx]']);
  });

  test('a variable named like a built-in function is still a variable', async () => {
    expect(await run(["length = 'v'", "left = 'w'", 'CALL show length, left', 'EXIT', ...show])).toEqual(['[v][w]']);
  });

  test('the first argument is an expression too', async () => {
    expect(await run(['n = 5', 'CALL show n - 1, n * 2', 'EXIT', ...show])).toEqual(['[4][10]']);
    expect(await run(["CALL show LENGTH('abc') || 'x', 1", 'EXIT', ...show])).toEqual(['[3x][1]']);
  });
});
