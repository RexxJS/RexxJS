/**
 * Variable Resolver (var_missing) Test
 *
 * Tests the variableResolver callback feature that allows lazy variable resolution.
 * This is used by the spreadsheet to resolve cell references (Apple, B2, etc.) on-demand
 * without pre-injecting all possible cell values into the interpreter scope.
 *
 * The variableResolver callback is invoked when a variable is not found in the
 * interpreter's variable map, providing a chance to resolve it externally.
 */

const { Interpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

describe('Variable Resolver (var_missing) Feature', () => {
  let interpreter;
  let outputLines;

  beforeEach(() => {
    outputLines = [];

    const mockAddressSender = {
      send: async () => { throw new Error('Not used in this test'); }
    };

    const outputHandler = {
      writeLine: (line) => outputLines.push(line),
      output: (text) => outputLines.push(text)
    };

    interpreter = new Interpreter(mockAddressSender, outputHandler);
  });

  test('should resolve undefined variables via variableResolver callback', async () => {
    // Simulate external data source (e.g., spreadsheet, database)
    const externalData = {
      'Apple': 100,
      'Orange': 200,
      'Pomegranate': 'Hello'
    };

    // Set up variableResolver to resolve missing variables from external source
    interpreter.variableResolver = (name) => {
      if (externalData.hasOwnProperty(name)) {
        return externalData[name];
      }
      return undefined;
    };

    // Test direct variable access
    const code1 = parse('SAY Apple');
    await interpreter.run(code1);
    expect(outputLines[0]).toBe('100');

    outputLines = [];
    const code2 = parse('SAY Pomegranate');
    await interpreter.run(code2);
    expect(outputLines[0]).toBe('Hello');
  });

  test('should use variableResolver in arithmetic expressions', async () => {
    const externalData = {
      'Apple': 100,
      'Orange': 200
    };

    interpreter.variableResolver = (name) => {
      if (externalData.hasOwnProperty(name)) {
        return externalData[name];
      }
      return undefined;
    };

    const code = parse('result = Apple + Orange');
    await interpreter.run(code);

    expect(interpreter.getVariable('result')).toBe(300);
  });

  test('should use variableResolver with builtin functions', async () => {
    const externalData = {
      'Pomegranate': 'hello world'
    };

    interpreter.variableResolver = (name) => {
      if (externalData.hasOwnProperty(name)) {
        return externalData[name];
      }
      return undefined;
    };

    const code = parse('result = UPPER(Pomegranate)');
    await interpreter.run(code);

    expect(interpreter.getVariable('result')).toBe('HELLO WORLD');
  });

  test('should use variableResolver in pipe operations', async () => {
    const externalData = {
      'Pomegranate': 'Hello World'
    };

    interpreter.variableResolver = (name) => {
      if (externalData.hasOwnProperty(name)) {
        return externalData[name];
      }
      return undefined;
    };

    const code = parse('result = Pomegranate |> LOWER');
    await interpreter.run(code);

    expect(interpreter.getVariable('result')).toBe('hello world');
  });

  test('should prioritize interpreter variables over variableResolver', async () => {
    // Set Apple in interpreter scope (exact case match)
    interpreter.variables.set('Apple', 999);

    // Set up variableResolver that would return different value
    interpreter.variableResolver = (name) => {
      if (name === 'Apple') {
        return 100;
      }
      return undefined;
    };

    const code = parse('SAY Apple');
    await interpreter.run(code);

    // Should use interpreter variable, not variableResolver
    expect(outputLines[0]).toBe('999');
  });

  test('should work without variableResolver (backward compatibility)', async () => {
    // No variableResolver set - define variable normally (exact case match)
    interpreter.variables.set('Apple', 100);

    const code = parse('result = Apple + 50');
    await interpreter.run(code);

    expect(interpreter.getVariable('result')).toBe(150);
  });

  test('should return undefined for missing variables when no variableResolver', async () => {
    // No variableResolver, no variable set

    const code = parse('SAY UNDEFINED_VAR');
    await interpreter.run(code);

    // REXX returns the variable name as-is when undefined
    expect(outputLines[0]).toBe('UNDEFINED_VAR');
  });

  test('should handle variableResolver returning undefined', async () => {
    interpreter.variableResolver = (name) => {
      // Always return undefined
      return undefined;
    };

    const code = parse('SAY MISSING_VAR');
    await interpreter.run(code);

    // Should fall back to REXX default behavior (return variable name)
    expect(outputLines[0]).toBe('MISSING_VAR');
  });

  test('should work with complex expressions using multiple resolved variables', async () => {
    const cells = {
      'Apple': 10,
      'Orange': 20,
      'Pear': 30,
      'Kiwi': 5
    };

    interpreter.variableResolver = (name) => {
      if (cells.hasOwnProperty(name)) {
        return cells[name];
      }
      return undefined;
    };

    const code = parse('result = (Apple + Orange + Pear) * Kiwi');
    await interpreter.run(code);

    expect(interpreter.getVariable('result')).toBe(300); // (10 + 20 + 30) * 5
  });

  test('should handle variableResolver with string concatenation', async () => {
    const cells = {
      'Apple': 'Hello',
      'Orange': 'World'
    };

    interpreter.variableResolver = (name) => {
      if (cells.hasOwnProperty(name)) {
        return cells[name];
      }
      return undefined;
    };

    const code = parse('LET result = Apple || " " || Orange');
    await interpreter.run(code);

    expect(interpreter.getVariable('result')).toBe('Hello World');
  });

  test('should use variableResolver in conditional expressions', async () => {
    const cells = {
      'Apple': 100,
      'Orange': 50
    };

    interpreter.variableResolver = (name) => {
      if (cells.hasOwnProperty(name)) {
        return cells[name];
      }
      return undefined;
    };

    const code = parse(`IF Apple > Orange THEN
  result = "greater"
ELSE
  result = "less"
ENDIF`);
    await interpreter.run(code);

    expect(interpreter.getVariable('result')).toBe('greater');
  });

  test('should NOT cache resolved variables across calls', async () => {
    let callCount = 0;
    const cells = {
      'Apple': 100
    };

    interpreter.variableResolver = (name) => {
      if (name === 'Apple') {
        callCount++;
        return cells[name];
      }
      return undefined;
    };

    // Access Apple twice
    const code = parse('x = Apple\ny = Apple');
    await interpreter.run(code);

    // variableResolver should be called twice (no caching)
    expect(callCount).toBe(2);
    expect(interpreter.getVariable('x')).toBe(100);
    expect(interpreter.getVariable('y')).toBe(100);
  });
});
