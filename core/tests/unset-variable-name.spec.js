/**
 * An unset variable's value is its name in uppercase. The rule followed is
 * classic REXX's, as TRL (Cowlishaw, The REXX Language, 2nd ed., section
 * 3.1 "Symbols": "If a symbol has not been assigned a value, its value is
 * the characters of the symbol itself, translated to uppercase") and the
 * ooRexx Reference (1.11.1 "Constant symbols", 1.11.2 "Simple symbols")
 * give it:
 *
 * - SAY foo, with foo never assigned, says FOO; x = foo sets x to FOO.
 * - A compound symbol's derived name is uppercased the same way: with
 *   nothing in list.2, SAY list.2 says LIST.2, and with i = 2, SAY list.i
 *   says LIST.2 too (TRL 3.4).
 * - A set variable's value is its value, in whatever case.
 * - The rule holds in an expression, a concatenation, a SAY, an
 *   assignment and a comparison alike: x = active then IF x = active is
 *   true, both sides being ACTIVE.
 *
 * RexxJS gave the name as typed (foo). The rule applies where a symbol is
 * read as a variable; a bare word given as an ADDRESS command's or a call's
 * named parameter (command=pwd) is RexxJS's own form and is left as is.
 */

const { Interpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

describe('An unset variable is its name in uppercase', () => {
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

  test("the task's case: SAY foo gives FOO", async () => {
    await run(['SAY foo']);
    expect(said).toEqual(['FOO']);
  });

  test('in an assignment', async () => {
    await run(['x = foo', 'SAY x', 'LET y = bar', 'SAY y']);
    expect(said).toEqual(['FOO', 'BAR']);
  });

  test('in a SAY of several words', async () => {
    await run(['SAY foo bar']);
    expect(said).toEqual(['FOO BAR']);
  });

  test('in a concatenation, blank and ||', async () => {
    await run(['x = "<" foo ">"', 'SAY x', 'y = foo || "!"', 'SAY y']);
    expect(said).toEqual(['< FOO >', 'FOO!']);
  });

  test('a compound symbol: its derived name, uppercased', async () => {
    await run(['SAY list.2', 'i = 2', 'SAY list.i', 'list.1 = "one"', 'SAY list.3']);
    expect(said).toEqual(['LIST.2', 'LIST.2', 'LIST.3']);
  });

  test('a set variable keeps its value and its case', async () => {
    await run(['foo = "mixed Case"', 'SAY foo', 'SAY foo bar']);
    expect(said).toEqual(['mixed Case', 'mixed Case BAR']);
  });

  test('in a comparison: x = active then IF x = active is true', async () => {
    await run([
      'x = active',
      'IF x = active THEN SAY "same"',
      'ELSE SAY "different"',
      'IF x = "ACTIVE" THEN SAY "upper"',
      'ELSE SAY "not upper"',
    ]);
    expect(said).toEqual(['same', 'upper']);
  });

  test("inside a PROCEDURE routine the caller's hidden variable is its uppercase name", async () => {
    await run([
      'x = "outer"',
      'CALL LOOK',
      'SAY x',
      'EXIT',
      'LOOK: PROCEDURE',
      '  SAY x',
      '  y = x "seen"',
      '  SAY y',
      '  RETURN',
    ]);
    expect(said).toEqual(['X', 'X seen', 'outer']);
  });

  test('a loop variable, set by the loop, is not affected', async () => {
    await run(['DO i = 1 TO 2', '  SAY i', 'END']);
    expect(said).toEqual(['1', '2']);
  });

  test("a call's named parameter given as a bare word is RexxJS's own form, left as is", async () => {
    await run(['LET r = REPEAT string=ab count=2', 'SAY r']);
    expect(said).toEqual(['abab']);
  });
});
