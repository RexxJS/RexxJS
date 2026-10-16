/**
 * IF ... THEN with the instruction it governs on the next line, ELSE with
 * its instruction on the next line, and THEN on a line of its own after
 * the condition: classic REXX's IF (TRL 4.1 "IF": THEN and ELSE may each
 * be followed by a line end, the instruction after it being the one
 * governed; THEN may begin a clause of its own after the expression's).
 *
 * The rule, beside RexxJS's own block form (IF ... THEN, the instructions,
 * an optional bare ELSE, ENDIF), which the suite pins and which stays:
 *
 * - IF ... THEN at a line's end is the block form when an ENDIF closes it,
 *   paired as brackets are, the nearest unclosed IF ... THEN first; an
 *   ENDIF inside a DO ... END belongs inside that block.
 * - Otherwise the one instruction after THEN is the one governed: a
 *   statement, a DO ... END block, or another IF. The same for a bare
 *   ELSE after it; a bare ELSE that is an ENDIF block's own branch
 *   separator stays that block's.
 * - IF condition, then a clause starting THEN, is one IF ... THEN.
 *
 * Asked for by the chess app: chaess/asks/rexxjs-if-then-next-line.md
 * (its CHESS_COMMANDS.md example 3). Before: "Missing ENDIF for IF
 * statement".
 */

const { Interpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

describe('IF ... THEN and ELSE with the instruction on the next line', () => {
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

  test("the ask's case: THEN and ELSE each followed by a line end", async () => {
    for (const rc of [0, 4]) {
      said.length = 0;
      await run([
        `RC = ${rc}`,
        'IF RC = 0 THEN',
        '    SAY "legal"',
        'ELSE',
        '    SAY "illegal:" RC',
        'SAY "after"',
      ]);
      expect(said).toEqual(rc === 0 ? ['legal', 'after'] : ['illegal: 4', 'after']);
    }
  });

  test('THEN with its instruction on the next line, no ELSE: only that one instruction is governed', async () => {
    await run(['x = 2', 'IF x = 1 THEN', '  SAY "one"', 'SAY "always"']);
    expect(said).toEqual(['always']);
  });

  test('THEN on a line of its own after the condition', async () => {
    await run([
      'x = 1',
      'IF x = 1',
      'THEN',
      '  SAY "yes"',
      'ELSE',
      '  SAY "no"',
      'IF x = 2',
      '  THEN SAY "two"',
      '  ELSE SAY "not two"',
    ]);
    expect(said).toEqual(['yes', 'not two']);
  });

  test('a one-line IF ... THEN instruction, then ELSE with its instruction on the next line', async () => {
    await run(['x = 3', 'IF x = 1 THEN SAY "one"', 'ELSE', '  SAY "other"']);
    expect(said).toEqual(['other']);
  });

  test('the instruction on the next line is a DO ... END block or another IF', async () => {
    await run([
      'x = 1', 'y = 2',
      'IF x = 1 THEN',
      '  DO',
      '    SAY "a"',
      '    SAY "b"',
      '  END',
      'ELSE',
      '  SAY "c"',
      'IF x = 1 THEN',
      '  IF y = 1 THEN',
      '    SAY "both"',
      '  ELSE',
      '    SAY "x only"',
    ]);
    expect(said).toEqual(['a', 'b', 'x only']);
  });

  test('ELSE then DO ... END on the next lines, and a bare ELSE after THEN DO ... END', async () => {
    await run([
      'x = 2',
      'IF x = 1 THEN',
      '  SAY "a"',
      'ELSE',
      '  DO',
      '    SAY "b"',
      '    SAY "c"',
      '  END',
      'IF x = 1 THEN DO',
      '  SAY "d"',
      'END',
      'ELSE',
      '  SAY "e"',
      'SAY "f"',
    ]);
    expect(said).toEqual(['b', 'c', 'e', 'f']);
  });

  test('inside a loop and a routine', async () => {
    await run([
      'DO i = 1 TO 3',
      '  IF i = 2 THEN',
      '    SAY "two"',
      '  ELSE',
      '    SAY i',
      'END',
      'CALL CHECK 5',
      'EXIT',
      'CHECK:',
      '  PARSE ARG n',
      '  IF n > 3 THEN',
      '    SAY "big"',
      '  RETURN',
    ]);
    expect(said).toEqual(['1', 'two', '3', 'big']);
  });

  test("RexxJS's ENDIF block form is kept, a bare ELSE its own branch", async () => {
    await run([
      'x = 2',
      'IF x = 1 THEN',
      '  SAY "one"',
      '  SAY "still one"',
      'ELSE',
      '  IF x = 2 THEN SAY "two"',
      '  SAY "not one"',
      'ENDIF',
      'IF x = 2 THEN',
      '  IF x > 1 THEN SAY "big"',
      'ELSE',
      '  SAY "small"',
      'ENDIF',
    ]);
    expect(said).toEqual(['two', 'not one', 'big']);
  });

  test('an IF ... THEN with no instruction after it is an error', () => {
    expect(() => parse('IF 1 = 1 THEN')).toThrow(/line 1/);
  });
});
