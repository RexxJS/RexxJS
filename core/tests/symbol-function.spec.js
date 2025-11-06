/**
 * SYMBOL Function Tests
 * Tests for the SYMBOL function that checks variable definition status
 *
 * Bug: SYMBOL('varName') was not available in the web demo (type-checking.html)
 *
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { parse } = require('../src/parser');
const { RexxInterpreter } = require('../src/interpreter');

describe('SYMBOL Function', () => {
  let interpreter;

  beforeEach(() => {
    interpreter = new RexxInterpreter();
  });

  it('should return VAR for defined variables', async () => {
    const script = `
      LET defined = "I exist"
      LET result = SYMBOL('defined')
      SAY result
    `;

    const output = [];
    interpreter.outputHandler = { output: (text) => output.push(text) };

    await interpreter.run(parse(script));

    const result = output.join('');
    expect(result).toContain('VAR');
  });

  it('should return LIT for undefined variables', async () => {
    const script = `
      LET result = SYMBOL('undefined')
      SAY result
    `;

    const output = [];
    interpreter.outputHandler = { output: (text) => output.push(text) };

    await interpreter.run(parse(script));

    const result = output.join('');
    expect(result).toContain('LIT');
  });

  it('should return BAD for invalid variable names', async () => {
    const script = `
      LET result = SYMBOL('123invalid')
      SAY result
    `;

    const output = [];
    interpreter.outputHandler = { output: (text) => output.push(text) };

    await interpreter.run(parse(script));

    const result = output.join('');
    expect(result).toContain('BAD');
  });

  it('should work with IF statements for optional parameter checking', async () => {
    const script = `
      LET optional = "value"
      IF SYMBOL('optional') = 'VAR' THEN
        SAY "optional is defined"
      ELSE
        SAY "optional is not defined"
      ENDIF

      IF SYMBOL('missing') = 'LIT' THEN
        SAY "missing is not defined"
      ELSE
        SAY "missing is defined"
      ENDIF
    `;

    const output = [];
    interpreter.outputHandler = { output: (text) => output.push(text) };

    await interpreter.run(parse(script));

    const result = output.join('');
    expect(result).toContain('optional is defined');
    expect(result).toContain('missing is not defined');
  });

  it('should handle procedure parameter checking', async () => {
    const script = `
      CALL myProc "required"
      EXIT

      myProc: PROCEDURE
        ARG first
        IF SYMBOL('optional') = 'VAR' THEN
          SAY "optional parameter provided: " || optional
        ELSE
          SAY "optional parameter not provided"
        ENDIF
        RETURN
    `;

    const output = [];
    interpreter.outputHandler = { output: (text) => output.push(text) };

    await interpreter.run(parse(script));

    const result = output.join('');
    expect(result).toContain('optional parameter not provided');
  });

  it('should return VAR after variable assignment', async () => {
    const script = `
      LET before = SYMBOL('x')
      SAY "Before assignment: " || before
      LET x = 10
      LET after = SYMBOL('x')
      SAY "After assignment: " || after
    `;

    const output = [];
    interpreter.outputHandler = { output: (text) => output.push(text) };

    await interpreter.run(parse(script));

    const result = output.join('');
    expect(result).toContain('Before assignment: LIT');
    expect(result).toContain('After assignment: VAR');
  });

  it('should allow valid variable names with underscores and periods', async () => {
    const script = `
      LET _var = "value1"
      LET var.name = "value2"
      LET my_var_2 = "value3"

      SAY SYMBOL('_var')
      SAY SYMBOL('var.name')
      SAY SYMBOL('my_var_2')
    `;

    const output = [];
    interpreter.outputHandler = { output: (text) => output.push(text) };

    await interpreter.run(parse(script));

    const result = output.join('');
    const lines = result.split('\n').filter(l => l.trim());

    // Find the last 3 SYMBOL results
    const symbolResults = lines.slice(-3);
    expect(symbolResults.join('')).toContain('VAR');
  });

  it('should work in conditionals within loops', async () => {
    const script = `
      DO i = 1 TO 3
        IF SYMBOL('counter') = 'LIT' THEN
          LET counter = 0
        ENDIF
        LET counter = counter + i
      END
      SAY "Counter: " || counter
    `;

    const output = [];
    interpreter.outputHandler = { output: (text) => output.push(text) };

    await interpreter.run(parse(script));

    const result = output.join('');
    expect(result).toContain('Counter: 6');  // 1+2+3
  });
});
