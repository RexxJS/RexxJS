/**
 * Tests for diff function parameter requirements
 */

// Get the absolute path to __dirname immediately
const path = require('path');
const TEST_DIR = __dirname;
const CORE_DIR = path.join(TEST_DIR, '..', '..', '..', '..', 'core');
const DIFF_DIR = path.join(TEST_DIR, '..');

describe('diff Function Parameter Requirements', () => {
  let interpreter;
  let parse;

  beforeEach(async () => {
    // Use CommonJS require() with pre-computed absolute paths
    const Interpreter = require(path.join(CORE_DIR, 'src/interpreter.js')).Interpreter;
    const { parse: parseFn } = require(path.join(CORE_DIR, 'src/parser.js'));

    parse = parseFn;
    interpreter = new Interpreter();

    // Load diff functions
    const diffFunctionModule = require(path.join(DIFF_DIR, 'src/diff-functions.js'));
    // Register all exported diff functions that actually exist in the module
    if (diffFunctionModule.DIFF) interpreter.operations.DIFF = diffFunctionModule.DIFF;
    if (diffFunctionModule.DIFF_APPLY) interpreter.operations.DIFF_APPLY = diffFunctionModule.DIFF_APPLY;
    if (diffFunctionModule.DIFF_PATCH) interpreter.operations.DIFF_PATCH = diffFunctionModule.DIFF_PATCH;
    if (diffFunctionModule.PATCH) interpreter.operations.PATCH = diffFunctionModule.PATCH;
    if (diffFunctionModule.PATCH_CHECK) interpreter.operations.PATCH_CHECK = diffFunctionModule.PATCH_CHECK;
    if (diffFunctionModule.PATCH_APPLY_MULTIPLE) interpreter.operations.PATCH_APPLY_MULTIPLE = diffFunctionModule.PATCH_APPLY_MULTIPLE;
    if (diffFunctionModule.PATCH_CREATE_REVERSE) interpreter.operations.PATCH_CREATE_REVERSE = diffFunctionModule.PATCH_CREATE_REVERSE;
  });

  test('DIFF without parameters should throw clear error', async () => {
    const script = `result = DIFF`;

    await expect(interpreter.run(parse(script))).rejects.toThrow();
  });

  test('DIFF_APPLY without parameters should throw clear error', async () => {
    const script = `result = DIFF_APPLY`;

    await expect(interpreter.run(parse(script))).rejects.toThrow();
  });

  test('DIFF_PATCH without parameters should throw clear error', async () => {
    const script = `result = DIFF_PATCH`;

    await expect(interpreter.run(parse(script))).rejects.toThrow();
  });

  test('PATCH without parameters should throw clear error', async () => {
    const script = `result = PATCH`;

    await expect(interpreter.run(parse(script))).rejects.toThrow();
  });

  test('PATCH_CHECK without parameters should throw clear error', async () => {
    const script = `result = PATCH_CHECK`;

    await expect(interpreter.run(parse(script))).rejects.toThrow();
  });

  test('PATCH_APPLY_MULTIPLE without parameters should throw clear error', async () => {
    const script = `result = PATCH_APPLY_MULTIPLE`;

    await expect(interpreter.run(parse(script))).rejects.toThrow();
  });

  test('PATCH_CREATE_REVERSE without parameters should throw clear error', async () => {
    const script = `result = PATCH_CREATE_REVERSE`;

    await expect(interpreter.run(parse(script))).rejects.toThrow();
  });
});