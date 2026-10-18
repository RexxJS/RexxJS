/**
 * ADDRESS env <expression>: classic REXX (TRL 2.3) evaluates the clause
 * and sends its value, so a command held in a variable, or put together by
 * concatenation, is sent as the string it comes to:
 *
 *     ADDRESS SHEET cmd                        a variable
 *     ADDRESS SHEET 'cell.get ' || ref         a concatenation
 *     ADDRESS SHEET 'level' n                  terms joined by a blank
 *
 * RexxJS set the environment and never sent the clause. Found by
 * spraedsheet's CLI (`sheet run`).
 */
const { Interpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

describe('ADDRESS env <expression> sends the expression\'s value', () => {
  let sent;
  let interpreter;

  beforeEach(() => {
    sent = [];
    interpreter = new Interpreter(null, { output: () => {} });
    interpreter.addressTargets.set('rec', {
      handler: async (command) => { sent.push(command); return { success: true, output: 'done' }; },
      methods: {},
      metadata: {},
    });
  });

  const run = async (lines) => {
    await interpreter.run(parse(lines.join('\n')));
    return sent;
  };

  test('a variable holding the command', async () => {
    expect(await run(["cmd = 'cell.get A1'", 'ADDRESS REC cmd'])).toEqual(['cell.get A1']);
  });

  test('a variable leaves the environment set for the commands after it', async () => {
    expect(await run(["cmd = 'one'", 'ADDRESS REC cmd', "'two'"])).toEqual(['one', 'two']);
  });

  test('a concatenation', async () => {
    expect(await run(["ref = 'B2'", "ADDRESS REC 'cell.get ' || ref"])).toEqual(['cell.get B2']);
  });

  test('terms joined by a blank', async () => {
    expect(await run(["n = 3", "ADDRESS REC 'level' n"])).toEqual(['level 3']);
  });

  test('ADDRESS env alone still only sets the environment', async () => {
    expect(await run(['ADDRESS REC'])).toEqual([]);
    expect(interpreter.address).toBe('rec');
  });
});
