/**
 * CALL of a built-in function worked its arguments out its own way: a
 * quoted literal had its quotes stripped but its escapes left (CALL LENGTH
 * "C:\\temp" set RESULT 10, counting the backslash twice and the quotes),
 * an expression (n + 1) was not worked out, and a variable's value was
 * looked up as variables.get(x) || x, taking 0 for "no such variable".
 * Its arguments now go through resolveCallArgument, as a host function's
 * (33438b2) and a routine's own do.
 */

const { Interpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

describe('CALL of a built-in function: its arguments', () => {
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

  test('CALL LENGTH "C:\\\\temp" sets RESULT 7', async () => {
    await run('CALL LENGTH "C:\\\\temp"\nSAY RESULT');
    expect(said).toEqual(['7']);
  });

  test('a single-quoted literal has no escapes', async () => {
    await run("CALL LENGTH 'C:\\\\temp'\nSAY RESULT");
    expect(said).toEqual(['8']);
  });

  test('an expression argument: CALL LENGTH n + 1', async () => {
    await run('n = 9\nCALL LENGTH n + 1\nSAY RESULT');
    expect(said).toEqual(['2']);
  });

  test('expression arguments among others, comma-separated', async () => {
    await run('s = "hello world"\nn = 2\nCALL SUBSTR s, n + 5, 5\nSAY RESULT');
    expect(said).toEqual(['world']);
  });

  test('a variable holding 0 arrives as 0', async () => {
    await run('z = 0\nCALL MAX z, -1\nSAY RESULT');
    expect(said).toEqual(['0']);
  });

  test('a variable holding the empty string arrives empty', async () => {
    await run('e = ""\nCALL LENGTH e\nSAY RESULT');
    expect(said).toEqual(['0']);
  });

  test('blank-separated arguments still each arrive', async () => {
    await run('CALL SUBSTR "hello world" 7 5\nSAY RESULT');
    expect(said).toEqual(['world']);
  });
});
