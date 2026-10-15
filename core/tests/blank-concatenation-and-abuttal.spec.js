/**
 * Blank concatenation and abuttal in an assignment and in an expression.
 * The rule followed is classic REXX's, as TRL (Cowlishaw, The REXX
 * Language, 2nd ed., section 6.1 "String concatenation") and the ooRexx
 * Reference (1.11.2.2 "String concatenation") give it:
 *
 * - Two terms with one or more blanks between them are concatenated with
 *   one blank between: v "text" is v's value, a blank, text.
 * - Two terms with nothing between them, one of them a quoted literal, are
 *   concatenated with nothing between (abuttal): v"text" and "a"'b'.
 * - || concatenates with nothing between, as before.
 * - Arithmetic binds tighter than any of the three: n + 1 "items" is the
 *   sum, a blank, items.
 * - "a""b" is not an abuttal: a doubled quote inside a literal of the same
 *   quotes is one quote (TRL 2.2), so it is the one literal a"b (see
 *   doubled-quotes-and-blank-concatenation.spec.js).
 *
 * SAY already joined blank-separated terms with a blank; an assignment
 * took v "text" as the literal text, and an expression could not read it.
 */

const { Interpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

describe('Blank concatenation and abuttal', () => {
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

  describe('in an assignment', () => {
    test("the task's cases: v = v \"text\" and v = v\"text\"", async () => {
      await run([
        'v = "a"',
        'v = v "text"',
        'SAY v',
        'w = "a"',
        'w = w"text"',
        'SAY w',
      ]);
      expect(said).toEqual(['a text', 'atext']);
    });

    test('two literals abutted, of different quotes', async () => {
      await run(['v = "a"\'b\'', 'SAY v']);
      expect(said).toEqual(['ab']);
    });

    test('a literal abutted on either side of a variable', async () => {
      await run(['v = "mid"', 'w = "<"v">"', 'SAY w']);
      expect(said).toEqual(['<mid>']);
    });

    test('literals around a variable, blank-separated', async () => {
      await run(['v = "a"', 'w = "<" v ">"', 'SAY w']);
      expect(said).toEqual(['< a >']);
    });

    test('two variables', async () => {
      await run(['a = 1', 'b = 2', 'c = a b', 'SAY c']);
      expect(said).toEqual(['1 2']);
    });

    test('with LET', async () => {
      await run(['LET v = "a"', 'LET w = v "b"', 'SAY w']);
      expect(said).toEqual(['a b']);
    });

    test('a function call then a literal', async () => {
      await run(['x = "abc"', 'y = LENGTH(x) "chars"', 'SAY y']);
      expect(said).toEqual(['3 chars']);
    });

    test('arithmetic binds tighter: n + 1 "items" is the sum then items', async () => {
      await run(['n = 5', 'y = n + 1 "items"', 'SAY y', 'z = "total:" n * 2', 'SAY z']);
      expect(said).toEqual(['6 items', 'total: 10']);
    });

    test('blank and || together', async () => {
      await run(['v = "a" || "b" "c"', 'SAY v', 'w = "a" "b" || "c"', 'SAY w']);
      expect(said).toEqual(['ab c', 'a bc']);
    });

    test("a doubled quote is still one quote, not an abuttal", async () => {
      await run(['v = "a""b"', 'SAY v', "w = 'it''s' \"ok\"", 'SAY w']);
      expect(said).toEqual(['a"b', "it's ok"]);
    });

    test('an escaped quote in a double-quoted literal does not end it', async () => {
      await run(['v = "He said \\"hi\\""', 'SAY v']);
      expect(said).toEqual(['He said "hi"']);
    });

    test('a built-up string across several assignments', async () => {
      await run([
        'line = ""',
        'DO i = 1 TO 3',
        '  line = line i',
        'END',
        'SAY STRIP(line)',
      ]);
      expect(said).toEqual(['1 2 3']);
    });
  });

  describe('in an expression', () => {
    test('RETURN of a concatenation', async () => {
      await run([
        'CALL GREET "Ann"',
        'SAY RESULT',
        'EXIT',
        'GREET:',
        '  PARSE ARG who',
        '  RETURN "hello" who"!"',
      ]);
      expect(said).toEqual(['hello Ann!']);
    });

    test('abutted, as the argument of a function', async () => {
      // A blank between terms inside a call's parentheses is another
      // matter: the argument scanner ends an argument there (TODO.md)
      await run(['a = "x"', 'SAY LENGTH(a"yz")', 'n = LENGTH(a"yz")', 'SAY n']);
      expect(said).toEqual(['3', '3']);
    });

    test('SAY abuts as an assignment does', async () => {
      await run(['v = "a"', 'SAY v"text"', 'SAY "<"v">" v']);
      expect(said).toEqual(['atext', '<a> a']);
    });
  });

  describe('what must keep working', () => {
    test('a call with named parameters is not a concatenation', async () => {
      await run(['LET r = REPEAT string="ab" count=2', 'SAY r']);
      expect(said).toEqual(['abab']);
    });

    test("RexxJS's call without parentheses is still a call, not a concatenation", async () => {
      await run(['s = "abc"', 'LET x = UPPER s', 'y = LENGTH s', 'SAY x y']);
      expect(said).toEqual(['ABC 3']);
    });

    test('but a variable of a function\'s name concatenates', async () => {
      await run(['LENGTH = "L"', 'x = LENGTH "is set"', 'SAY x']);
      expect(said).toEqual(['L is set']);
    });

    test('arithmetic alone is arithmetic', async () => {
      await run(['a = 3', 'b = 4', 'c = a + b', 'd = (a + b) * 2', 'e = a - 1', 'SAY c d e']);
      expect(said).toEqual(['7 14 2']);
    });

    test('a pipe is one expression', async () => {
      await run(['x = "ab" |> UPPER', 'SAY x']);
      expect(said).toEqual(['AB']);
    });

    test('an array literal with blanks is still an array', async () => {
      await run(['x = [1, 2, 3]', 'SAY ARRAY_LENGTH(x)']);
      expect(said).toEqual(['3']);
    });
  });

  describe('inside a PROCEDURE routine', () => {
    test('the classic forms work on the routine\'s own variables', async () => {
      await run([
        'v = "outer"',
        'CALL BUILD',
        'SAY RESULT',
        'SAY v',
        'EXIT',
        'BUILD: PROCEDURE',
        '  v = "in"',
        '  v = v "the" || "re"',
        '  RETURN v"!"',
      ]);
      expect(said).toEqual(['in there!', 'outer']);
    });
  });
});
