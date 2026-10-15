/**
 * PROCEDURE (TODO.md, "PROCEDURE is ignored: a routine's variables are its
 * caller's"). The rule followed is classic REXX's, as TRL (Cowlishaw, The
 * REXX Language, 2nd ed., section 3 "PROCEDURE") and the ooRexx Reference
 * (2.21 "PROCEDURE") give it:
 *
 * - PROCEDURE, as the first instruction of a routine reached by CALL, starts
 *   a new generation of variables: every variable known to the caller is
 *   hidden, and the routine's ARG and assignments go to its own generation.
 * - RETURN ends the generation: the caller's variables come back as they
 *   were, and what the routine set is gone.
 * - PROCEDURE EXPOSE name... shares the named variables with the caller: the
 *   routine reads and changes the caller's own. A name ending in a period
 *   (stem.) exposes every compound variable of that stem.
 * - Each CALL is its own generation, so a routine that calls itself, or
 *   another PROCEDURE routine, keeps its variables through the inner call.
 * - A routine without PROCEDURE shares its caller's variables, as before.
 * - PROCEDURE anywhere but as the first instruction of a CALLed routine is
 *   an error (TRL error 17, "Unexpected PROCEDURE").
 *
 * An unset variable's value is its name as typed here (not uppercased as
 * classic REXX would), which the hidden-variable tests rely on.
 */

const { Interpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

describe('PROCEDURE', () => {
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

  test("the TODO entry's recursive factorial gives 120", async () => {
    await run([
      'CALL FACT 5',
      'SAY RESULT',
      'EXIT',
      'FACT: PROCEDURE',
      '  ARG n',
      '  IF n <= 1 THEN RETURN 1',
      '  CALL FACT n - 1',
      '  RETURN n * RESULT',
    ]);
    expect(said).toEqual(['120']);
  });

  test("the caller's variables are hidden, and come back on RETURN", async () => {
    await run([
      'x = "outer"',
      'y = "kept"',
      'CALL SHOW',
      'SAY x y',
      'EXIT',
      'SHOW: PROCEDURE',
      '  SAY x',
      '  x = "inner"',
      '  z = "new"',
      '  SAY x z',
      '  RETURN',
    ]);
    expect(said).toEqual(['x', 'inner new', 'outer kept']);
    expect(interpreter.variables.has('z')).toBe(false);
  });

  test('ARG sets variables of the routine, not of the caller', async () => {
    await run([
      'n = 7',
      'CALL TWICE 4',
      'SAY n RESULT',
      'EXIT',
      'TWICE: PROCEDURE',
      '  ARG n',
      '  RETURN n * 2',
    ]);
    expect(said).toEqual(['7 8']);
  });

  test('RESULT is set from the RETURN value in the caller', async () => {
    await run([
      'CALL ANSWER',
      'SAY RESULT',
      'EXIT',
      'ANSWER: PROCEDURE',
      '  RETURN 42',
    ]);
    expect(said).toEqual(['42']);
  });

  test('EXPOSE shares a named variable, and only that one', async () => {
    await run([
      'total = 10',
      'other = "mine"',
      'CALL ADD 5',
      'SAY total other',
      'EXIT',
      'ADD: PROCEDURE EXPOSE total',
      '  ARG amount',
      '  SAY other',
      '  total = total + amount',
      '  other = "changed"',
      '  RETURN',
    ]);
    expect(said).toEqual(['other', '15 mine']);
  });

  test('EXPOSE of several names, and of a variable the caller has not set yet', async () => {
    await run([
      'a = 1',
      'CALL SETBOTH',
      'SAY a b',
      'EXIT',
      'SETBOTH: PROCEDURE EXPOSE a b',
      '  a = a + 1',
      '  b = "made here"',
      '  RETURN',
    ]);
    expect(said).toEqual(['2 made here']);
  });

  test('EXPOSE stem. shares every compound variable of the stem', async () => {
    await run([
      'list.1 = "one"',
      'list.0 = 1',
      'CALL APPEND "two"',
      'SAY list.0 list.1 list.2',
      'EXIT',
      'APPEND: PROCEDURE EXPOSE list.',
      '  ARG item',
      '  list.0 = list.0 + 1',
      '  list.2 = item',
      '  RETURN',
    ]);
    expect(said).toEqual(['2 one two']);
  });

  test('a stem not exposed is hidden, and the routine\'s own is gone after RETURN', async () => {
    await run([
      'data.1 = "caller"',
      'CALL LOOK',
      'SAY data.1',
      'EXIT',
      'LOOK: PROCEDURE',
      '  SAY data.1',
      '  data.1 = "routine"',
      '  RETURN',
    ]);
    expect(said).toEqual(['data.1', 'caller']);
  });

  test('nested CALLs each have a generation of their own', async () => {
    await run([
      'v = "main"',
      'CALL OUTER',
      'SAY v',
      'EXIT',
      'OUTER: PROCEDURE',
      '  v = "outer"',
      '  CALL INNER',
      '  SAY v RESULT',
      '  RETURN',
      'INNER: PROCEDURE',
      '  SAY v',
      '  v = "inner"',
      '  RETURN v',
    ]);
    expect(said).toEqual(['v', 'outer inner', 'main']);
  });

  test('a PROCEDURE routine calling one without PROCEDURE shares its own generation with it', async () => {
    await run([
      'v = "main"',
      'CALL OUTER',
      'SAY v',
      'EXIT',
      'OUTER: PROCEDURE',
      '  v = "outer"',
      '  CALL PLAIN',
      '  SAY v',
      '  RETURN',
      'PLAIN:',
      '  v = v || " changed by plain"',
      '  RETURN',
    ]);
    expect(said).toEqual(['outer changed by plain', 'main']);
  });

  test('PROCEDURE on the line after the label is the same as on it', async () => {
    await run([
      'n = 7',
      'CALL TWICE 4',
      'SAY n RESULT',
      'EXIT',
      'TWICE:',
      '  PROCEDURE',
      '  ARG n',
      '  RETURN n * 2',
    ]);
    expect(said).toEqual(['7 8']);
  });

  test("the caller's variables are restored when the routine fails", async () => {
    let failure;
    try {
      await run([
        'x = "outer"',
        'CALL BOOM',
        'EXIT',
        'BOOM: PROCEDURE',
        '  x = "inner"',
        '  CALL NOSUCH',
        '  RETURN',
      ]);
    } catch (e) {
      failure = e;
    }
    expect(failure && failure.message).toMatch(/NOSUCH/);
    expect(interpreter.variables.get('x')).toBe('outer');
  });

  // The main program stops at its first label here, so falling into a
  // routine does not arise; jumping into one does.
  test('SIGNALling into a PROCEDURE routine instead of CALLing it is an error', async () => {
    await expect(run([
      'SAY "before"',
      'SIGNAL ROUTINE',
      'ROUTINE: PROCEDURE',
      '  SAY "never"',
      '  RETURN',
    ])).rejects.toThrow(/Unexpected PROCEDURE/);
    expect(said).toEqual(['before']);
  });

  describe('a routine without PROCEDURE, as before', () => {
    test('sees and changes the caller\'s variables', async () => {
      await run([
        'x = "outer"',
        'CALL CHANGE',
        'SAY x y',
        'EXIT',
        'CHANGE:',
        '  SAY x',
        '  x = "changed"',
        '  y = "added"',
        '  RETURN',
      ]);
      expect(said).toEqual(['outer', 'changed added']);
    });

    test('its ARG sets the caller\'s variable', async () => {
      await run([
        'n = 7',
        'CALL TAKE 4',
        'SAY n',
        'EXIT',
        'TAKE:',
        '  ARG n',
        '  RETURN',
      ]);
      expect(said).toEqual(['4']);
    });
  });
});
