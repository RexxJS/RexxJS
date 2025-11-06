/**
 * RIGHT Function Padding Bug Tests
 * Tests for the RIGHT function with zero-padding issue from the web demo
 *
 * Bug: RIGHT(5, 5, "0") should return "00005" but returns "    5"
 *
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { parse } = require('../src/parser');
const { RexxInterpreter } = require('../src/interpreter');

describe('RIGHT Function Padding Bug', () => {
  let interpreter;

  beforeEach(() => {
    interpreter = new RexxInterpreter();
  });

  it('should pad with zeros when RIGHT called with 0 as third parameter', async () => {
    const script = `
      LET id = 5
      LET paddedID = RIGHT(id, 5, "0")
      SAY paddedID
    `;

    const output = [];
    interpreter.outputHandler = { output: (text) => output.push(text) };

    await interpreter.run(parse(script));

    // The output should show "00005"
    expect(output.join('')).toContain('00005');
  });

  it('should reproduce the exact bug from number-formatting.html demo', async () => {
    const script = `
      LET id = 5
      LET paddedID = RIGHT(id, 5, "0")
      SAY "  Padded to 5 digits: " || paddedID
    `;

    const output = [];
    interpreter.outputHandler = { output: (text) => output.push(text) };

    await interpreter.run(parse(script));

    const result = output.join('');
    console.log('Output:', result);

    // Should show "00005", not "    5"
    expect(result).toContain('00005');
    expect(result).not.toContain('    5'); // 4 spaces followed by 5
  });

  it('should handle multiple RIGHT calls with zero padding', async () => {
    const script = `
      LET num1 = 123
      LET num2 = 5
      LET padded1 = RIGHT(num1, 6, "0")
      LET padded2 = RIGHT(num2, 6, "0")
      SAY padded1
      SAY padded2
    `;

    const output = [];
    interpreter.outputHandler = { output: (text) => output.push(text) };

    await interpreter.run(parse(script));

    const result = output.join('');
    console.log('Output:', result);

    // Both should have zero padding
    expect(result).toContain('000123');
    expect(result).toContain('000005');
  });

  it('should pad with spaces by default (without third parameter)', async () => {
    const script = `
      LET num = 5
      LET padded = RIGHT(num, 5)
      SAY "|" || padded || "|"
    `;

    const output = [];
    interpreter.outputHandler = { output: (text) => output.push(text) };

    await interpreter.run(parse(script));

    const result = output.join('');
    console.log('Output:', result);

    // Should pad with spaces
    expect(result).toContain('|    5|');
  });

  it('should handle RIGHT with string input and zero padding', async () => {
    const script = `
      LET str = "42"
      LET padded = RIGHT(str, 4, "0")
      SAY padded
    `;

    const output = [];
    interpreter.outputHandler = { output: (text) => output.push(text) };

    await interpreter.run(parse(script));

    const result = output.join('');
    console.log('Output:', result);

    expect(result).toContain('0042');
  });
});
