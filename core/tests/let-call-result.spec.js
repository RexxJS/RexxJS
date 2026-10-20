/**
 * LET r = CALL f ... takes the routine's RETURN value, as a plain CALL
 * followed by RESULT does (TRL: a routine's RETURN value is in RESULT).
 *
 * Before: r was the call's bookkeeping object ({ terminated, returnValue }),
 * which prints as [object Object]; only an external script's result (an
 * object with `success`) was unwrapped.
 */

const { Interpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

describe('LET var = CALL routine', () => {
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

  const double = ['f:', 'PARSE ARG x', 'RETURN x * 2'];

  test('gives the same value as CALL then RESULT', async () => {
    await run(['CALL f 3', 'SAY RESULT', 'LET r = CALL f 3', 'SAY r', 'EXIT', ...double]);
    expect(said).toEqual(['6', '6']);
  });

  test('a string RETURN, and the variable is not an object', async () => {
    await run(['LET r = CALL g', 'SAY r', 'EXIT', 'g:', 'RETURN "hello"']);
    expect(said).toEqual(['hello']);
    expect(typeof interpreter.variables.get('r')).toBe('string');
  });

  test('a routine with PROCEDURE', async () => {
    await run(['LET r = CALL h 4', 'SAY r', 'EXIT', 'h: PROCEDURE', 'PARSE ARG x', 'RETURN x + 1']);
    expect(said).toEqual(['5']);
  });
});
