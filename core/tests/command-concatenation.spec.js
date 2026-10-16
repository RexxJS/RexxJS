/**
 * A command built by concatenation: classic REXX evaluates a command
 * clause as an expression and sends its value to the ADDRESS environment
 * (TRL 2.3, "Commands"), so a command put together from literals and
 * variables goes as the value it comes to:
 *
 *     'black MOVESAN("' || w || '")'     || concatenation
 *     'black MOVESAN("'w'")'             abuttal
 *     'say' word                          a blank between terms
 *
 * RexxJS sent the first two as their source text, quotes and bars and all,
 * and dropped the third. A single literal ('get-board', 'it''s') goes as
 * before. Found by the chess app's match script (chaess TODO.md 6.1), which
 * relays each move one app makes to the other.
 */

const { Interpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

describe('a command clause built by concatenation is sent as its value', () => {
  let interpreter;
  let sent;

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
    await interpreter.run(parse(['ADDRESS REC', ...lines].join('\n')));
    return sent;
  };

  test('|| concatenation', async () => {
    expect(await run(["w = 'e4'", `'black MOVESAN("' || w || '")'`])).toEqual(['black MOVESAN("e4")']);
  });

  test('abuttal', async () => {
    expect(await run(["w = 'Nf3'", `'black MOVESAN("'w'")'`])).toEqual(['black MOVESAN("Nf3")']);
  });

  test('a blank between a literal and a variable', async () => {
    expect(await run(["n = 3", "'level' n"])).toEqual(['level 3']);
  });

  test('a number built in, RC and RESULT set from the answer', async () => {
    await run(['lv = 2', "'white SETAIDIFFICULTY(' || lv || ')'"]);
    expect(sent).toEqual(['white SETAIDIFFICULTY(2)']);
    expect(interpreter.variables.get('RC')).toBe(0);
    expect(interpreter.variables.get('RESULT')).toBe('done');
  });

  test('a single literal goes as it is, a doubled quote made one', async () => {
    expect(await run(["'get-board'", `'MOVE("e2", "e4")'`, "'it''s'"])).toEqual(['get-board', 'MOVE("e2", "e4")', "it's"]);
  });
});
