/**
 * ADDRESS env "...": in a quoted string "" is one " and '' is one ' (TRL
 * 1.9.1), as in any other quoted string. RexxJS sent the command with the
 * doubled quotes as written, so a command line holding a quoted value
 * could not go through ADDRESS. Found by spraedsheet's CLI (`sheet run`),
 * which had to carry the line as JSON through a RUNCOMMAND() function.
 */
const { Interpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

describe('ADDRESS env "...": a doubled quote in the string is one quote', () => {
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

  test('doubled double quotes in a double-quoted string are one quote', async () => {
    expect(await run([`ADDRESS REC "say ""hi"" now"`])).toEqual(['say "hi" now']);
  });

  test('doubled single quotes in a single-quoted string are one quote', async () => {
    expect(await run([`ADDRESS REC 'it''s here'`])).toEqual(["it's here"]);
  });

  test('a quoted string holding the other kind of quote goes as it is', async () => {
    expect(await run([`ADDRESS REC 'cell.set input="x"'`])).toEqual(['cell.set input="x"']);
  });
});
