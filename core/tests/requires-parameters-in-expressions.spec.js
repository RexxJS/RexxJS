/**
 * A function that declares it needs parameters, called with none inside an
 * expression (LET x = F(), x = F), says "F function requires parameters",
 * as a call statement already did; a function with no such declaration
 * still runs with none.
 *
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { Interpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

describe('requiresParameters in expressions', () => {
  let interpreter;

  beforeEach(() => {
    interpreter = new Interpreter();
    const needs = (a) => `got ${a}`;
    needs.requiresParameters = true;
    const described = (a, b) => `got ${a} ${b}`;
    described.parameterMetadata = [{ name: 'a', optional: false }, { name: 'b', optional: true }];
    const optional = (a) => `got ${a}`;
    optional.parameterMetadata = [{ name: 'a', optional: true }];
    const plain = () => 'nothing needed';
    Object.assign(interpreter.builtInFunctions, { NEEDS: needs, DESCRIBED: described, OPTIONAL: optional, PLAIN: plain });
  });

  const run = (code) => interpreter.run(parse(code));

  it('requiresParameters, called with none', async () => {
    await expect(run('LET x = NEEDS()')).rejects.toThrow('NEEDS function requires parameters');
    await expect(run('x = NEEDS')).rejects.toThrow('NEEDS function requires parameters');
  });

  it('a required parameter in its metadata, called with none', async () => {
    await expect(run('LET x = DESCRIBED()')).rejects.toThrow('DESCRIBED function requires parameters');
  });

  it('given its parameters, it runs', async () => {
    await run('LET x = NEEDS(5)\nLET y = DESCRIBED(1, 2)');
    expect(interpreter.getVariable('x')).toBe('got 5');
    expect(interpreter.getVariable('y')).toBe('got 1 2');
  });

  it('only optional parameters, or no declaration: runs with none', async () => {
    await run('LET x = OPTIONAL()\nLET y = PLAIN()');
    expect(interpreter.getVariable('x')).toBe('got undefined');
    expect(interpreter.getVariable('y')).toBe('nothing needed');
  });
});
