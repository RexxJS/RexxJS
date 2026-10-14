/**
 * Standard Rexx's IF ... THEN ... ELSE, ';' as a clause separator, and an
 * IF() function that works out only the value it gives.
 *
 * Bugs:
 * - `IF c THEN instr` with `ELSE instr` on the next line failed ("Function
 *   ELSE is not available"); after IF ... THEN DO ... END, ELSE could only
 *   start a DO block or an IF.
 * - `IF c THEN LET r = 1; ELSE LET r = 2` set r to the text
 *   "1; ELSE LET r = 2": ';' was not a clause separator.
 * - IF(cond, a, b) worked out both a and b, so a function that calls itself
 *   in a branch never stopped: IF(n < 2, 1, n * FACT(n - 1)).
 * RexxJS's own IF ... THEN / ELSE / ENDIF block form is unchanged.
 */

const { Interpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

describe('IF ... THEN ... ELSE, clauses split by ;, and a lazy IF()', () => {
  let interpreter;
  let said;

  beforeEach(() => {
    said = [];
    interpreter = new Interpreter(null, { output: (line) => said.push(String(line)) });
  });

  const run = async (script, vars = {}) => {
    for (const [k, v] of Object.entries(vars)) interpreter.variables.set(k, v);
    await interpreter.run(parse(script));
    return said;
  };

  describe('ELSE after a one-line IF', () => {
    test('ELSE and an instruction on the next line, either way', async () => {
      expect(await run('IF n < 2 THEN SAY "small"\nELSE SAY "large"', { n: 5 })).toEqual(['large']);
      said.length = 0;
      expect(await run('IF n < 2 THEN SAY "small"\nELSE SAY "large"', { n: 1 })).toEqual(['small']);
    });

    test('ELSE DO ... END', async () => {
      expect(await run('IF n < 2 THEN SAY "small"\nELSE DO\n  SAY "large"\n  SAY n\nEND', { n: 5 })).toEqual(['large', '5']);
    });

    test('ELSE IF chains', async () => {
      const script = 'IF n < 2 THEN SAY "small"\nELSE IF n < 10 THEN SAY "medium"\nELSE SAY "large"';
      for (const [n, want] of [[1, 'small'], [5, 'medium'], [50, 'large']]) {
        said.length = 0;
        expect(await run(script, { n })).toEqual([want]);
      }
    });

    test('after IF ... THEN DO ... END, ELSE and one instruction', async () => {
      expect(await run('IF n < 2 THEN DO\n  SAY "small"\nEND\nELSE SAY "large"', { n: 5 })).toEqual(['large']);
    });

    test('the statement after it still runs', async () => {
      expect(await run('IF n < 2 THEN SAY "small"\nELSE SAY "large"\nSAY "done"', { n: 1 })).toEqual(['small', 'done']);
    });

    test('a bare ELSE still belongs to the IF ... ENDIF block form', async () => {
      const script = 'IF a THEN\n  IF b THEN SAY "both"\nELSE\n  SAY "not a"\nENDIF';
      expect(await run(script, { a: 0, b: 1 })).toEqual(['not a']);
    });
  });

  describe("';' ends a clause", () => {
    test('several clauses on a line, and a trailing ;', async () => {
      await run('LET a = 1; LET b = a + 1;');
      expect([interpreter.getVariable('a'), interpreter.getVariable('b')]).toEqual([1, 2]);
    });

    test('IF ... THEN ...; ELSE ... on one line', async () => {
      await run('IF n < 2 THEN LET r = "small"; ELSE LET r = "large"', { n: 5 });
      expect(interpreter.getVariable('r')).toBe('large');
    });

    test('IF ... THEN DO; ...; END; ELSE DO; ...; END on one line', async () => {
      await run('IF n < 2 THEN DO; LET r = 1; END; ELSE DO; LET r = n * 2; END', { n: 5 });
      expect(interpreter.getVariable('r')).toBe(10);
    });

    test('not in a string, or in brackets', async () => {
      await run('LET s = "a;b"; LET t = LENGTH("x;y")');
      expect([interpreter.getVariable('s'), interpreter.getVariable('t')]).toEqual(['a;b', 3]);
    });

    test("EXIT UNLESS's mistyped comma still says so", () => {
      expect(() => parse("EXIT 1 UNLESS ok; 'message'")).toThrow(/semicolon/i);
    });
  });

  describe('IF() works out only the value it gives', () => {
    let calls;
    beforeEach(() => {
      calls = 0;
      interpreter.externalFunctions.COUNTED = (x) => { calls++; return x; };
    });

    test('the branch not taken is not worked out', async () => {
      await run('LET a = IF(1, "yes", COUNTED("no")); LET b = IF(0, COUNTED("yes"), "no")');
      expect([interpreter.getVariable('a'), interpreter.getVariable('b'), calls]).toEqual(['yes', 'no', 0]);
    });

    test('the branch taken is, once', async () => {
      await run('LET a = IF(n > 2, COUNTED("big"), "small")', { n: 5 });
      expect([interpreter.getVariable('a'), calls]).toEqual(['big', 1]);
    });

    test('so a function that calls itself in a branch stops', async () => {
      // FACT as an external function whose body is a RexxJS expression.
      interpreter.externalFunctions.FACT = async (n) => {
        const inner = new Interpreter(null, { output: () => {} });
        inner.externalFunctions.FACT = interpreter.externalFunctions.FACT;
        inner.variables.set('n', n);
        await inner.run(parse('LET r = IF(n < 2, 1, n * FACT(n - 1))'));
        return inner.getVariable('r');
      };
      await run('LET f = FACT(6)');
      expect(interpreter.getVariable('f')).toBe(720);
    });
  });
});
