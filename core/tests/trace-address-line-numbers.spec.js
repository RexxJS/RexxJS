/*
  Ensure ADDRESS (quoted and heredoc) traces include Rexx source line numbers, no (no line#).
*/

describe('trace: ADDRESS line numbers', () => {
  let RexxInterpreterBuilder;
  beforeAll(() => {
    jest.resetModules();
    RexxInterpreterBuilder = require('../src/interpreter.js').RexxInterpreterBuilder;
    if (!RexxInterpreterBuilder) throw new Error('RexxInterpreterBuilder not available');
  });

  function runWithTrace(script) {
    const capture = { outputs: [], errors: [] };
    const handler = { output: (t) => capture.outputs.push(t), outputException: (e) => capture.errors.push(String(e)) };
    const interp = new RexxInterpreterBuilder(null)
      .withOutputHandler(handler)
      .withTraceMode('NORMAL')
      .withTraceToOutput(true)
      .build();
    // Register a simple ECHO address handler for tests
    if (typeof interp.registerAddressTarget === 'function') {
      interp.registerAddressTarget('ECHO', {
        handler: async (cmd, ctx, source) => ({ success: true, output: cmd })
      });
    }
    const { parse } = require('../src/parser.js');
    const commands = parse(script);
    return interp.run(commands, script, 'inline-address.rexx').then(() => capture);
  }

  test('quoted ADDRESS is numbered', async () => {
    const script = [
      'SAY "start"',     // 1
      'ADDRESS ECHO "hello"', // 2
      'SAY "done"'       // 3
    ].join('\n');
    const cap = await runWithTrace(script);
    const trace = cap.outputs.filter(l => /^\s*>>/.test(l)).map(l => l.trim()).join('\n');
    const expected =
`>> 1 SAY "start"
>> 2 ADDRESS ECHO "hello"
>> 3 SAY "done"`;
    expect(trace).toEqual(expected);
    expect(trace.includes('(no line#)')).toBe(false);
  });

  test('heredoc ADDRESS is numbered at header', async () => {
    const script = [
      'SAY "start"',       // 1
      'ADDRESS ECHO <<TXT', // 2
      'line A',
      'TXT',
      'SAY "done"'         // 5
    ].join('\n');
    const cap = await runWithTrace(script);
    const trace = cap.outputs.filter(l => /^\s*>>/.test(l)).map(l => l.trim()).join('\n');
    // Expect numbered traces at 1, 2, 5; exact message content for line 2 may vary
    expect(trace.startsWith('>> 1 SAY "start"')).toBe(true);
    expect(trace.includes('\n>> 2 ')).toBe(true);
    expect(trace.endsWith('>> 5 SAY "done"')).toBe(true);
    expect(trace.includes('(no line#)')).toBe(false);
  });
});
