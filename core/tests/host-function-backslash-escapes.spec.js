/**
 * A string literal given to a host-supplied function (externalFunctions)
 * arrived with its backslashes decoded wrongly: "C:\\temp" came as C:\, a
 * tab, emp. Unquoting ran \n, \t, \r replaces before \\, so the second
 * backslash of a \\ started a \t. Now both unquoting sites decode in one
 * pass (escape-sequence-processor.js, which claims \\ first), the same
 * way a REXX built-in already saw the literal.
 */

const { Interpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

describe('backslash escapes in a literal given to a host function', () => {
  let interpreter;
  let said;
  let received;

  beforeEach(() => {
    said = [];
    received = [];
    interpreter = new Interpreter(null, { output: (line) => said.push(String(line)) });
    interpreter.externalFunctions.SETCELL = (ref, value) => { received.push(value); return value; };
  });

  const run = async (script) => {
    await interpreter.run(parse(script));
  };

  test('"C:\\\\temp" arrives as C:\\temp, no tab', async () => {
    await run('x = SETCELL("E1", "C:\\\\temp")');
    expect(received).toEqual(['C:\\temp']);
  });

  test('"a\\\\nb" arrives as a, backslash, n, b: no new line', async () => {
    await run('x = SETCELL("E1", "a\\\\nb")');
    expect(received).toEqual(['a\\nb']);
  });

  test('a lone \\t is still a tab, and \\n a new line', async () => {
    await run('x = SETCELL("E1", "a\\tb")');
    await run('x = SETCELL("E1", "a\\nb")');
    expect(received).toEqual(['a\tb', 'a\nb']);
  });

  test("a single-quoted literal has no escape sequences (as SAY has it)", async () => {
    await run("x = SETCELL('E1', 'a\\tb')");
    expect(received).toEqual(['a\\tb']);
  });

  test('a REXX built-in sees the same', async () => {
    await run('SAY LENGTH("C:\\\\temp")');
    await run('SAY LENGTH("a\\\\nb")');
    expect(said).toEqual(['7', '4']);
  });

});
