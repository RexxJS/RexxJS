/**
 * Tests for jq function parameter requirements
 * Tests that jq functions properly require their parameters
 */

describe('jq Function Parameter Requirements', () => {
  let interpreter;
  let parse;

  beforeEach(async () => {
    // Use dynamic import for ESM module
    const modules = await import('../../../../core/src/interpreter.js');
    const InterpreterClass = modules.Interpreter || modules.default;

    const parserModule = await import('../../../../core/src/parser.js');
    parse = parserModule.parse || parserModule.default;

    interpreter = new InterpreterClass();
  });

  test('jqQuery without parameters should throw clear error', async () => {
    // jqQuery requires at least one parameter (data)
    const script = `
      REQUIRE "jq-functions"
      LET result = jqQuery
    `;

    await expect(interpreter.run(parse(script))).rejects.toThrow();
  });

  test('jqRaw without parameters should throw clear error', async () => {
    // jqRaw requires at least one parameter (data)
    const script = `
      REQUIRE "jq-functions"
      LET result = jqRaw
    `;

    await expect(interpreter.run(parse(script))).rejects.toThrow();
  });

  test('jqKeys without parameters should throw clear error', async () => {
    // jqKeys requires one parameter (data)
    const script = `
      REQUIRE "jq-functions"
      LET result = jqKeys
    `;

    await expect(interpreter.run(parse(script))).rejects.toThrow();
  });

  test('jqValues without parameters should throw clear error', async () => {
    // jqValues requires one parameter (data)
    const script = `
      REQUIRE "jq-functions"
      LET result = jqValues
    `;

    await expect(interpreter.run(parse(script))).rejects.toThrow();
  });

  test('jqLength without parameters should throw clear error', async () => {
    // jqLength requires one parameter (data)
    const script = `
      REQUIRE "jq-functions"
      LET result = jqLength
    `;

    await expect(interpreter.run(parse(script))).rejects.toThrow();
  });

  test('jqType without parameters should throw clear error', async () => {
    // jqType requires one parameter (data)
    const script = `
      REQUIRE "jq-functions"
      LET result = jqType
    `;

    await expect(interpreter.run(parse(script))).rejects.toThrow();
  });
});