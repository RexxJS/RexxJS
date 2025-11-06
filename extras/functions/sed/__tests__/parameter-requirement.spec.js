/**
 * Tests for sed function parameter requirements
 */

// Get the absolute path to __dirname immediately
const path = require('path');
const TEST_DIR = __dirname;
const CORE_DIR = path.join(TEST_DIR, '..', '..', '..', '..', 'core');
const SED_DIR = path.join(TEST_DIR, '..');

describe('sed Function Parameter Requirements', () => {
  let interpreter;
  let parse;

  beforeEach(async () => {
    // Use CommonJS require() with pre-computed absolute paths
    const Interpreter = require(path.join(CORE_DIR, 'src/interpreter.js')).Interpreter;
    const { parse: parseFn } = require(path.join(CORE_DIR, 'src/parser.js'));

    parse = parseFn;
    interpreter = new Interpreter();

    // Load sed functions
    const sedFunctionModule = require(path.join(SED_DIR, 'src/sed-functions.js'));
    // Register all exported sed functions that actually exist in the module
    if (sedFunctionModule.SED) interpreter.operations.SED = sedFunctionModule.SED;
    if (sedFunctionModule.SED_SUBSTITUTE) interpreter.operations.SED_SUBSTITUTE = sedFunctionModule.SED_SUBSTITUTE;
  });

  test('SED without parameters should throw clear error', async () => {
    const script = `result = SED`;

    await expect(interpreter.run(parse(script))).rejects.toThrow();
  });

  test('SED_SUBSTITUTE without parameters should throw clear error', async () => {
    const script = `result = SED_SUBSTITUTE`;

    await expect(interpreter.run(parse(script))).rejects.toThrow();
  });
});
