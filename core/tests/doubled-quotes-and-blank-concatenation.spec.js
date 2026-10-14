/**
 * Two classic REXX string rules:
 *
 * - A doubled quote inside a string of the same quotes is one quote:
 *   'it''s' is it's, and "say ""hi""" is say "hi". RexxJS kept both quotes,
 *   so a command string could not hold a quote of its own kind
 *   ('SETCELL(''A1'')').
 * - Each side of || is a list of terms joined by blanks: SAY "(RC" RC || ")"
 *   is "(RC 2)". RexxJS printed such a side as its source text.
 *
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { Interpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

describe('doubled quotes and blank concatenation', () => {
  let said;
  let sent;
  let interpreter;

  beforeEach(() => {
    said = [];
    sent = [];
    const addressSender = {
      send: async (address, method, params) => { sent.push(params.command); return { success: true }; }
    };
    interpreter = new Interpreter(addressSender, { output: (text) => said.push(text) });
  });

  const run = async (code) => {
    await interpreter.run(parse(code), code);
    return said;
  };

  describe('a doubled quote is one quote', () => {
    it('in SAY, single and double quoted', async () => {
      expect(await run(`SAY 'it''s'\nSAY "say ""hi"""`)).toEqual(["it's", 'say "hi"']);
    });

    it('only the delimiter doubles: the other kind stays as it is', async () => {
      expect(await run(`SAY "it''s"\nSAY 'say ""hi""'`)).toEqual(["it''s", 'say ""hi""']);
    });

    it('in an assignment, with and without LET', async () => {
      await run(`LET a = 'it''s'\nb = "say ""hi"""`);
      expect(interpreter.getVariable('a')).toBe("it's");
      expect(interpreter.getVariable('b')).toBe('say "hi"');
    });

    it('in a concatenation', async () => {
      expect(await run(`SAY "x" || 'y''z'`)).toEqual(["xy'z"]);
    });

    it('as a function argument', async () => {
      await run(`LET n = LENGTH('a''b')\nLET u = UPPER("q""r")`);
      expect(interpreter.getVariable('n')).toBe(3);
      expect(interpreter.getVariable('u')).toBe('Q"R');
    });

    it('in a command string sent to an ADDRESS target', async () => {
      await run(`ADDRESS somewhere\n'SETCELL(''A1'', ''100'')'`);
      expect(sent).toEqual(["SETCELL('A1', '100')"]);
    });

    it('an empty string is still empty', async () => {
      await run(`LET e = ''\nLET f = ""`);
      expect(interpreter.getVariable('e')).toBe('');
      expect(interpreter.getVariable('f')).toBe('');
    });
  });

  describe('each side of || is terms joined by blanks', () => {
    it('a literal and a variable, then ||', async () => {
      expect(await run(`LET rc = 2\nSAY "(RC" rc || ")"`)).toEqual(['(RC 2)']);
    });

    it('on both sides', async () => {
      expect(await run(`LET a = 1\nLET b = 2\nSAY 'a is' a || ', b is' b`)).toEqual(['a is 1, b is 2']);
    });

    it('|| alone still joins with no blank', async () => {
      expect(await run(`LET a = 1\nSAY 'x' || a || 'y'`)).toEqual(['x1y']);
    });

    it('arithmetic on a side is still worked out', async () => {
      expect(await run(`LET a = 2\nSAY 'n=' || a + 3`)).toEqual(['n=5']);
    });
  });
});
