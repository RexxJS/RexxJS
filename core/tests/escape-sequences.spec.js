/**
 * Escape Sequence Tests
 * Tests for JavaScript-style escape sequences in REXX strings
 *
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { parse } = require('../src/parser');
const { RexxInterpreter } = require('../src/interpreter');

describe('Escape Sequences in REXX Strings', () => {
  let interpreter;

  beforeEach(() => {
    interpreter = new RexxInterpreter();
  });

  describe('Basic Escape Sequences', () => {
    it('should handle newline escape sequence \\n', async () => {
      // Create script with escaped newline
      const script = 'LET text = "line1\\nline2"\nSAY text';

      const output = [];
      interpreter.outputHandler = { output: (text) => output.push(text) };

      await interpreter.run(parse(script));

      const result = output.join('');
      expect(result).toContain('line1');
      expect(result).toContain('line2');
    });

    it('should handle tab escape sequence \\t', async () => {
      const script = 'LET text = "col1\\tcol2"\nSAY text';

      const output = [];
      interpreter.outputHandler = { output: (text) => output.push(text) };

      await interpreter.run(parse(script));

      const result = output.join('');
      expect(result).toContain('col1\tcol2');
    });

    it('should handle carriage return escape sequence \\r', async () => {
      const script = 'LET text = "before\\rafter"\nSAY text';

      const output = [];
      interpreter.outputHandler = { output: (text) => output.push(text) };

      await interpreter.run(parse(script));

      const result = output.join('');
      expect(result).toContain('before\rafter');
    });

    it('should handle backspace escape sequence \\b', async () => {
      const script = 'LET text = "text\\bspace"\nSAY text';

      const output = [];
      interpreter.outputHandler = { output: (text) => output.push(text) };

      await interpreter.run(parse(script));

      const result = output.join('');
      expect(result).toContain('text\bspace');
    });

    it('should handle form feed escape sequence \\f', async () => {
      const script = 'LET text = "page1\\fpage2"\nSAY text';

      const output = [];
      interpreter.outputHandler = { output: (text) => output.push(text) };

      await interpreter.run(parse(script));

      const result = output.join('');
      expect(result).toContain('page1\fpage2');
    });

    it('should handle vertical tab escape sequence \\v', async () => {
      const script = 'LET text = "line1\\vline2"\nSAY text';

      const output = [];
      interpreter.outputHandler = { output: (text) => output.push(text) };

      await interpreter.run(parse(script));

      const result = output.join('');
      expect(result).toContain('line1\vline2');
    });
  });

  describe('Quote Escape Sequences', () => {
    it('should handle escaped double quotes', async () => {
      const script = 'LET text = "He said \\"hello\\""\nSAY text';

      const output = [];
      interpreter.outputHandler = { output: (text) => output.push(text) };

      await interpreter.run(parse(script));

      const result = output.join('');
      expect(result).toContain('He said "hello"');
    });

    it('should handle escaped single quotes', async () => {
      const script = "LET text = 'It\\'s working'\nSAY text";

      const output = [];
      interpreter.outputHandler = { output: (text) => output.push(text) };

      await interpreter.run(parse(script));

      const result = output.join('');
      expect(result).toContain("It's working");
    });
  });

  describe('Other Escape Sequences', () => {
    it('should handle escaped backslash', async () => {
      const script = 'LET path = "C:\\\\Users\\\\Admin"\nSAY path';

      const output = [];
      interpreter.outputHandler = { output: (text) => output.push(text) };

      await interpreter.run(parse(script));

      const result = output.join('');
      expect(result).toContain('C:\\Users\\Admin');
    });

    it('should handle null character', async () => {
      const script = 'LET text = "before\\0after"\nSAY LENGTH(text)';

      const output = [];
      interpreter.outputHandler = { output: (text) => output.push(text) };

      await interpreter.run(parse(script));

      const result = output.join('');
      // "before" (6) + null (1) + "after" (5) = 12
      expect(result).toContain('12');
    });
  });

  describe('Multiple Escape Sequences', () => {
    it('should handle multiple different escape sequences in one string', async () => {
      const script = 'LET text = "Line1\\nTab\\there\\rReturn\\\\"\nSAY LENGTH(text)';

      const output = [];
      interpreter.outputHandler = { output: (text) => output.push(text) };

      await interpreter.run(parse(script));

      // "Line1" (5) + \n (1) + "Tab" (3) + \t (1) + "here" (4) + \r (1) + "Return" (6) + \\ (1) = 22
      const result = output.join('');
      expect(result).toContain('22');
    });

    it('should handle escape sequences in function parameters', async () => {
      const script = 'LET result = SUBSTR("hello\\nworld", 1, 5)\nSAY result';

      const output = [];
      interpreter.outputHandler = { output: (text) => output.push(text) };

      await interpreter.run(parse(script));

      const result = output.join('');
      expect(result).toContain('hello');
    });
  });

  describe('SAY Output with Escape Sequences', () => {
    it('should output multi-line text using SAY with newline', async () => {
      const script = 'SAY "Line1\\nLine2\\nLine3"';

      const output = [];
      interpreter.outputHandler = { output: (text) => output.push(text) };

      await interpreter.run(parse(script));

      const result = output.join('');
      expect(result).toContain('Line1');
      expect(result).toContain('Line2');
      expect(result).toContain('Line3');
    });

    it('should handle SAY with concatenation and escape sequences', async () => {
      const script = 'LET msg1 = "Hello\\nWorld"\nSAY msg1';

      const output = [];
      interpreter.outputHandler = { output: (text) => output.push(text) };

      await interpreter.run(parse(script));

      const result = output.join('');
      expect(result).toContain('Hello');
      expect(result).toContain('World');
    });
  });

  describe('Escape Sequence Edge Cases', () => {
    it('should handle consecutive escape sequences', async () => {
      const script = 'LET text = "\\n\\n\\n"\nSAY LENGTH(text)';

      const output = [];
      interpreter.outputHandler = { output: (text) => output.push(text) };

      await interpreter.run(parse(script));

      // Three newlines = 3 characters
      const result = output.join('');
      expect(result).toContain('3');
    });

    it('should handle escaped characters at string boundaries', async () => {
      const script = 'LET text1 = "\\n"\nLET text2 = "\\t"\nSAY LENGTH(text1) || " " || LENGTH(text2)';

      const output = [];
      interpreter.outputHandler = { output: (text) => output.push(text) };

      await interpreter.run(parse(script));

      // Each should be 1 character
      const result = output.join('');
      expect(result).toContain('1 1');
    });
  });

  describe('Escape Sequences in Different Contexts', () => {
    it('should handle escape sequences in function calls', async () => {
      const script = 'LET text = UPPER("hello\\nworld")\nSAY LENGTH(text)';

      const output = [];
      interpreter.outputHandler = { output: (text) => output.push(text) };

      await interpreter.run(parse(script));

      // "HELLO" (5) + \n (1) + "WORLD" (5) = 11
      const result = output.join('');
      expect(result).toContain('11');
    });

    it('should handle escape sequences in conditionals', async () => {
      const script = 'LET text1 = "hello\\nworld"\nLET text2 = "hello\\nworld"\nIF text1 = text2 THEN\nSAY "Match"\nELSE\nSAY "NoMatch"\nENDIF';

      const output = [];
      interpreter.outputHandler = { output: (text) => output.push(text) };

      await interpreter.run(parse(script));

      const result = output.join('');
      expect(result).toContain('Match');
    });
  });

  describe('Unicode Escape Sequences', () => {
    it('should handle 4-digit Unicode escape \\uXXXX', async () => {
      const script = 'LET text = "Hello \\u0041 World"\nSAY text';

      const output = [];
      interpreter.outputHandler = { output: (text) => output.push(text) };

      await interpreter.run(parse(script));

      const result = output.join('');
      expect(result).toContain('Hello A World');
    });

    it('should handle 4-digit Unicode escape for emoji (BMP)', async () => {
      const script = 'LET text = "Smiley \\u263A"\nSAY text';

      const output = [];
      interpreter.outputHandler = { output: (text) => output.push(text) };

      await interpreter.run(parse(script));

      const result = output.join('');
      expect(result).toContain('Smiley ☺');
    });

    it('should handle 8-digit Unicode escape \\uXXXXXXXX for code points > U+FFFF', async () => {
      const script = 'LET text = "Emoji \\u0001F600 Face"\nSAY text';

      const output = [];
      interpreter.outputHandler = { output: (text) => output.push(text) };

      await interpreter.run(parse(script));

      const result = output.join('');
      expect(result).toContain('Emoji 😀 Face');
    });

    it('should handle multiple Unicode escapes in one string', async () => {
      const script = 'LET text = "A\\u0041B\\u0042C\\u0043"\nSAY text';

      const output = [];
      interpreter.outputHandler = { output: (text) => output.push(text) };

      await interpreter.run(parse(script));

      const result = output.join('');
      expect(result).toContain('AABBCC');
    });

    it('should handle Unicode escapes with mixed escape sequences', async () => {
      const script = 'LET text = "Line1\\n\\u0041Line2"\nSAY LENGTH(text)';

      const output = [];
      interpreter.outputHandler = { output: (text) => output.push(text) };

      await interpreter.run(parse(script));

      // "Line1" (5) + \n (1) + "A" (1) + "Line2" (5) = 12
      const result = output.join('');
      expect(result).toContain('12');
    });

    it('should handle Unicode null character \\u0000', async () => {
      const script = 'LET text = "before\\u0000after"\nSAY LENGTH(text)';

      const output = [];
      interpreter.outputHandler = { output: (text) => output.push(text) };

      await interpreter.run(parse(script));

      // "before" (6) + null (1) + "after" (5) = 12
      const result = output.join('');
      expect(result).toContain('12');
    });

    it('should handle Unicode escapes in function calls', async () => {
      const script = 'LET text = "\\u0041pple"\nLET result = UPPER(text)\nSAY result';

      const output = [];
      interpreter.outputHandler = { output: (text) => output.push(text) };

      await interpreter.run(parse(script));

      const result = output.join('');
      expect(result).toContain('APPLE');
    });

    it('should handle invalid Unicode escape (non-hex characters)', async () => {
      const script = 'LET text = "Invalid \\uGGGG escape"\nSAY text';

      const output = [];
      interpreter.outputHandler = { output: (text) => output.push(text) };

      await interpreter.run(parse(script));

      // Invalid Unicode escape should keep \u as-is
      const result = output.join('');
      expect(result).toContain('Invalid \\u');
    });

    it('should handle incomplete Unicode escape sequences', async () => {
      const script = 'LET text = "Short \\u12"\nSAY LENGTH(text)';

      const output = [];
      interpreter.outputHandler = { output: (text) => output.push(text) };

      await interpreter.run(parse(script));

      // "Short " (6) + \u12 (4 chars) = 10
      const result = output.join('');
      expect(result).toContain('10');
    });

    it('should handle Unicode escape for mathematical symbols', async () => {
      const script = 'LET text = "\\u00B1 \\u00D7 \\u00F7"\nSAY text';

      const output = [];
      interpreter.outputHandler = { output: (text) => output.push(text) };

      await interpreter.run(parse(script));

      const result = output.join('');
      expect(result).toContain('± × ÷');
    });

    it('should handle Unicode escape for Greek letters', async () => {
      const script = 'LET text = "Alpha \\u03B1 Beta \\u03B2"\nSAY text';

      const output = [];
      interpreter.outputHandler = { output: (text) => output.push(text) };

      await interpreter.run(parse(script));

      const result = output.join('');
      expect(result).toContain('Alpha α Beta β');
    });
  });

  describe('SAY Output with Unicode Escape Sequences', () => {
    it('should output Unicode directly in SAY with 4-digit escape', async () => {
      const script = 'SAY "Unicode: \\u0041\\u0042\\u0043"';

      const output = [];
      interpreter.outputHandler = { output: (text) => output.push(text) };

      await interpreter.run(parse(script));

      const result = output.join('');
      expect(result).toContain('Unicode: ABC');
    });

    it('should output emoji directly in SAY with 8-digit escape', async () => {
      const script = 'SAY "Emojis: \\u0001F600 \\u0001F608 \\u0001F60D"';

      const output = [];
      interpreter.outputHandler = { output: (text) => output.push(text) };

      await interpreter.run(parse(script));

      const result = output.join('');
      expect(result).toContain('Emojis: 😀 😈 😍');
    });

    it('should output Unicode with multiple newlines in SAY', async () => {
      const script = 'SAY "Line1 \\u0041\\nLine2 \\u0042\\nLine3 \\u0043"';

      const output = [];
      interpreter.outputHandler = { output: (text) => output.push(text) };

      await interpreter.run(parse(script));

      const result = output.join('');
      expect(result).toContain('Line1 A');
      expect(result).toContain('Line2 B');
      expect(result).toContain('Line3 C');
    });

    it('should output mathematical symbols via SAY with Unicode', async () => {
      const script = 'SAY "Math: \\u00B1 \\u00D7 \\u00F7 \\u2248 \\u2260"';

      const output = [];
      interpreter.outputHandler = { output: (text) => output.push(text) };

      await interpreter.run(parse(script));

      const result = output.join('');
      expect(result).toContain('Math: ± × ÷ ≈ ≠');
    });

    it('should output multi-line Unicode with SAY and concatenation', async () => {
      const script = 'LET line1 = "Title \\u0041\\n"\nLET line2 = "Subtitle \\u0042"\nSAY line1 || line2';

      const output = [];
      interpreter.outputHandler = { output: (text) => output.push(text) };

      await interpreter.run(parse(script));

      const result = output.join('');
      expect(result).toContain('Title A');
      expect(result).toContain('Subtitle B');
    });
  });
});
