/**
 * Three things a REXX writer expects, found running whole programs in the
 * sae spreadsheet over its control bus:
 * - CALL of a function the host supplies (externalFunctions) said
 *   "Subroutine 'SETCELL' not found", though SETCELL(...) worked.
 * - DO FOREVER was "Invalid DO loop specification: FOREVER".
 * - LEAVE was read as a function call ("Function LEAVE is not available",
 *   or a DO WHILE 1 ran to its safety limit). ITERATE likewise.
 */

const { Interpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

describe('CALL of a host function, DO FOREVER, LEAVE and ITERATE', () => {
  let interpreter;
  let said;
  let calls;

  beforeEach(() => {
    said = [];
    calls = [];
    interpreter = new Interpreter(null, { output: (line) => said.push(String(line)) });
    interpreter.externalFunctions.SETCELL = (ref, value) => { calls.push([ref, value]); return `${ref}=${value}`; };
  });

  const run = async (script) => {
    await interpreter.run(parse(script));
    return said;
  };

  describe('CALL reaches a host function', () => {
    test('CALL SETCELL "B1", "x" calls it and sets RESULT to its value', async () => {
      await run('CALL SETCELL "B1", "x"\nSAY RESULT');
      expect(calls).toEqual([['B1', 'x']]);
      expect(said).toEqual(['B1=x']);
    });

    test('a variable and an expression as arguments', async () => {
      await run('ref = "C2"\nn = 4\nCALL SETCELL ref, n + 1\nSAY RESULT');
      expect(calls).toEqual([['C2', 5]]);
      expect(said).toEqual(['C2=5']);
    });

    test('a literal with backslashes arrives as a built-in sees it', async () => {
      await run('CALL SETCELL "E1", "C:\\\\temp"');
      expect(calls).toEqual([['E1', 'C:\\temp']]);
    });

    test('a routine of the program\'s own still wins over a host function of the same name', async () => {
      await run('CALL SETCELL "B1", "x"\nSAY RESULT\nEXIT\nSETCELL:\n  SAY "mine"\n  RETURN 7');
      expect(calls).toEqual([]);
      expect(said).toEqual(['mine', '7']);
    });

    test('an unknown name is still an error', async () => {
      await expect(run('CALL NOSUCH 1')).rejects.toThrow("Subroutine 'NOSUCH' not found");
    });
  });

  describe('DO FOREVER', () => {
    test('runs until LEAVE', async () => {
      await run('n = 0\nDO FOREVER\n  n = n + 1\n  IF n = 3 THEN LEAVE\nEND\nSAY n');
      expect(said).toEqual(['3']);
    });

    test('RETURN leaves it, in a routine', async () => {
      await run('CALL COUNT\nSAY RESULT\nEXIT\nCOUNT:\n  n = 0\n  DO FOREVER\n    n = n + 1\n    IF n = 5 THEN RETURN n\n  END');
      expect(said).toEqual(['5']);
    });

    test('EXIT leaves it', async () => {
      await run('n = 0\nDO FOREVER\n  n = n + 1\n  IF n = 2 THEN EXIT\nEND\nSAY "not here"');
      expect(said).toEqual([]);
      expect(interpreter.variables.get('n')).toBe(2);
    });

    test('is subject to the iteration safety limit', async () => {
      await expect(run('DO FOREVER\n  n = 1\nEND')).rejects.toThrow(/safety limit/);
    });
  });

  describe('LEAVE', () => {
    test('leaves a DO WHILE', async () => {
      await run('n = 0\nDO WHILE 1\n  n = n + 1\n  IF n = 3 THEN LEAVE\nEND\nSAY n');
      expect(said).toEqual(['3']);
    });

    test('leaves a DO i = 1 TO n', async () => {
      await run('DO i = 1 TO 10\n  IF i = 4 THEN LEAVE\n  SAY i\nEND\nSAY "after" i');
      expect(said).toEqual(['1', '2', '3', 'after 4']);
    });

    test('leaves a DO UNTIL, a DO n, and a DO x OVER list', async () => {
      await run('n = 0\nDO UNTIL n > 100\n  n = n + 1\n  IF n = 2 THEN LEAVE\nEND\nSAY n');
      await run('k = 0\nDO 10\n  k = k + 1\n  IF k = 3 THEN LEAVE\nEND\nSAY k');
      await run('LET list = ["a", "b", "c"]\nDO x OVER list\n  IF x = "b" THEN LEAVE\n  SAY x\nEND');
      expect(said).toEqual(['2', '3', 'a']);
    });

    test('leaves only the innermost loop', async () => {
      await run('DO i = 1 TO 3\n  DO j = 1 TO 3\n    IF j = 2 THEN LEAVE\n    SAY i || "." || j\n  END\nEND');
      expect(said).toEqual(['1.1', '2.1', '3.1']);
    });

    test('from inside a DO block and a SELECT in the loop', async () => {
      await run('n = 0\nDO WHILE 1\n  n = n + 1\n  IF n > 2 THEN DO\n    SAY "leaving"\n    LEAVE\n  END\nEND\nSAY n');
      await run('m = 0\nDO FOREVER\n  m = m + 1\n  SELECT\n    WHEN m = 4 THEN LEAVE\n    OTHERWISE SAY m\n  END\nEND\nSAY m');
      expect(said).toEqual(['leaving', '3', '1', '2', '3', '4']);
    });

    test('the statements after it in the body do not run', async () => {
      await run('DO i = 1 TO 2\n  LEAVE\n  SAY "not here"\nEND\nSAY "done"');
      expect(said).toEqual(['done']);
    });
  });

  describe('ITERATE', () => {
    test('goes to the next iteration of a DO i = 1 TO n', async () => {
      await run('DO i = 1 TO 4\n  IF i = 2 THEN ITERATE\n  SAY i\nEND');
      expect(said).toEqual(['1', '3', '4']);
    });

    test('of a DO WHILE, re-testing the condition', async () => {
      await run('n = 0\nDO WHILE n < 4\n  n = n + 1\n  IF n = 2 THEN ITERATE\n  SAY n\nEND');
      expect(said).toEqual(['1', '3', '4']);
    });

    test('of a DO FOREVER', async () => {
      await run('n = 0\nDO FOREVER\n  n = n + 1\n  IF n < 3 THEN ITERATE\n  SAY n\n  LEAVE\nEND');
      expect(said).toEqual(['3']);
    });
  });
});
