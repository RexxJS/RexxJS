/**
 * A DO loop's control variable after the loop ends: classic REXX leaves it
 * with the value that caused the loop to end (TRL 4.2, "Simple DO group"
 * and the controlled repetitive loop: the control variable is stepped,
 * then tested against the TO value, and the loop ends when it passes it).
 * After DO i = 1 TO 2 ... END, i is 3, and after DO i = 1 TO 6 BY 2, 7.
 *
 * - LEAVE ends the loop with the control variable as it was in that
 *   iteration (TRL 4.3.1): after LEAVE at i = 3, i is 3.
 * - RexxJS's own rule is kept: a value the variable had before the loop is
 *   put back after it (interpreter.spec.js pins it, "should preserve loop
 *   variable scope"). Classic REXX keeps the loop's value there; that
 *   difference is in TODO.md for a decision of its own.
 *
 * Before: the variable was left at the last value the body saw (2).
 */

const { Interpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

describe('The DO loop control variable after the loop ends', () => {
  let interpreter;
  let said;

  beforeEach(() => {
    said = [];
    interpreter = new Interpreter(null, { output: (line) => said.push(String(line)) });
  });

  const run = async (lines) => {
    await interpreter.run(parse(lines.join('\n')));
    return said;
  };

  test("the task's case: DO i = 1 TO 2 leaves i at 3 (TRL 4.2)", async () => {
    await run(['DO i = 1 TO 2', '  SAY i', 'END', 'SAY i']);
    expect(said).toEqual(['1', '2', '3']);
  });

  test('with a TO that is a variable: n + 1', async () => {
    await run(['n = 4', 'DO i = 1 TO n', 'END', 'SAY i']);
    expect(said).toEqual(['5']);
  });

  test('with BY: the first stepped value past the TO', async () => {
    await run(['DO i = 1 TO 6 BY 2', 'END', 'SAY i', 'DO j = 10 TO 1 BY -3', 'END', 'SAY j']);
    expect(said).toEqual(['7', '-2']);
  });

  test('LEAVE leaves the control variable as it was in that iteration', async () => {
    await run(['DO i = 1 TO 5', '  IF i = 3 THEN LEAVE', 'END', 'SAY i']);
    expect(said).toEqual(['3']);
  });

  test("a value the variable had before the loop is put back (RexxJS's rule, kept)", async () => {
    await run(['i = 99', 'DO i = 1 TO 2', 'END', 'SAY i']);
    expect(said).toEqual(['99']);
  });
});
