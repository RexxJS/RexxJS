/**
 * Tests demonstrating interpreter parameter resolution bugs
 * These bugs affect function calls with named parameters when parameter names
 * conflict with variable names in scope.
 */

const { RexxInterpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

describe('Interpreter Parameter Resolution Bugs', () => {
  let interpreter;

  beforeEach(() => {
    const mockAddressSender = {
      send: jest.fn().mockResolvedValue({}),
    };
    interpreter = new RexxInterpreter(mockAddressSender);
  });

  describe('Bug #1: String parameter name conflicts with variable name', () => {
    it('WC with type="lines" when variable "lines" exists', async () => {
      // This demonstrates the bug where type="lines" gets resolved to the
      // variable lines (an array) instead of the string "lines"

      const script = `
        LET lines = ["line1", "line2", "line3"]
        LET result = WC(input=lines, type="lines")
      `;

      await interpreter.run(parse(script));
      const result = interpreter.getVariable('result');

      // Expected: result should be the number 3 (count of lines)
      // Actual bug: result is an object {lines: 3, words: 3, chars: 17}
      //   because type="lines" gets resolved to the array variable instead of string "lines"
      expect(typeof result).toBe('number');
      expect(result).toBe(3);
    });

    it('WC works when variable name does NOT conflict', async () => {
      // This test passes - no variable named "lines" conflicts with type="lines"

      const script = `
        LET myData = ["line1", "line2", "line3"]
        LET result = WC(input=myData, type="lines")
      `;

      await interpreter.run(parse(script));
      const result = interpreter.getVariable('result');

      // This should work correctly
      expect(result).toBe(3);
    });
  });

  describe('Bug #2: Array literal parameters get stringified', () => {
    it.skip('PASTE with array literal [a, b] gets stringified to "[a,b]"', async () => {
      // This demonstrates the bug where inputs=[a, b] becomes the string "[a,b]"
      // instead of an array containing variables a and b

      const script = `
        LET a = ["a1", "a2"]
        LET b = ["b1", "b2"]
        LET result = PASTE(inputs=[a, b])
      `;

      await interpreter.run(parse(script));
      const result = interpreter.getVariable('result');

      // Expected: result should be ['a1\tb1', 'a2\tb2']
      // Actual bug: result is "[a,b]" because the array literal gets stringified
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual(['a1\tb1', 'a2\tb2']);
    });
  });

  describe('Bug #3: Delimiter parameter resolution', () => {
    it('CUT with delimiter="," when variable "delimiter" might exist', async () => {
      const script = `
        LET data = ["a,b,c", "1,2,3"]
        LET result = CUT(input=data, fields="2", delimiter=",")
      `;

      await interpreter.run(parse(script));
      const result = interpreter.getVariable('result');

      // Expected: result should be ['b', '2'] using comma delimiter
      expect(result).toEqual(['b', '2']);
    });
  });

  describe('Bug #4: fields parameter as string literal', () => {
    it('CUT with fields="2" should pass string not number', async () => {
      const script = `
        LET data = ["a	b	c", "1	2	3"]
        LET result = CUT(input=data, fields="2")
      `;

      await interpreter.run(parse(script));
      const result = interpreter.getVariable('result');

      // Expected: result should be ['b', '2']
      expect(result).toEqual(['b', '2']);
    });

    it('CUT with fields="1,3" should extract multiple fields', async () => {
      const script = `
        LET data = ["a	b	c", "1	2	3"]
        LET result = CUT(input=data, fields="1,3")
      `;

      await interpreter.run(parse(script));
      const result = interpreter.getVariable('result');

      // Expected: result should be ['a\tc', '1\t3']
      expect(result).toEqual(['a\tc', '1\t3']);
    });
  });
});
