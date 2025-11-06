/*
  Minimal focused spec to debug ADDRESS heredoc handling and ensure heredoc
  payload is not interpreted as Rexx code (e.g., calling LINE()).
*/

describe('debug: ADDRESS heredoc handling', () => {
  let RexxInterpreterBuilder;

  beforeAll(() => {
    jest.resetModules();
    RexxInterpreterBuilder = require('../src/interpreter.js').RexxInterpreterBuilder;
    if (!RexxInterpreterBuilder) throw new Error('RexxInterpreterBuilder not available');
  });

  function buildInterpWithEcho(capture) {
    const handler = {
      output: (t) => capture.outputs.push(t),
      outputException: (e) => capture.errors.push(String(e))
    };
    const interp = new RexxInterpreterBuilder(null)
      .withOutputHandler(handler)
      .withTraceMode('NORMAL')
      .withTraceToOutput(true)
      .build();

    // Register a minimal ECHO handler to capture heredoc payload
    if (typeof interp.registerAddressTarget === 'function') {
      interp.registerAddressTarget('ECHO', {
        handler: async (cmd, ctx, source) => {
          capture.echoCalls.push({ cmd, ctx, source });
          return { success: true, output: cmd };
        }
      });
    }
    return interp;
  }

  test('heredoc payload is delivered to handler and not interpreted as Rexx', async () => {
    const capture = { outputs: [], errors: [], echoCalls: [] };
    const interp = buildInterpWithEcho(capture);

    const script = [
      'SAY "start"',       // 1
      'ADDRESS ECHO <<TXT', // 2
      'line A',             // 3 (payload)
      'TXT',                // 4
      'SAY "done"'         // 5
    ].join('\n');

    const { parse } = require('../src/parser.js');
    const commands = parse(script);

    // Debug: log parsed commands around ADDRESS heredoc
    const addrIdx = commands.findIndex(c => c.type === 'ADDRESS_WITH_LINES' || c.type === 'HEREDOC_STRING' || c.type === 'QUOTED_STRING');
    // eslint-disable-next-line no-console
    console.debug('Parsed command types:', commands.map(c => c.type));
    // eslint-disable-next-line no-console
    console.debug('Address-like command index:', addrIdx, 'command:', commands[addrIdx]);

    await interp.run(commands, script, 'inline-debug-heredoc.rexx');

    // Ensure handler was called exactly once with full payload
    expect(capture.echoCalls.length).toBe(1);
    expect(capture.echoCalls[0].cmd).toBe('line A');
    // Ensure no function error was raised
    const hasLineMissing = capture.errors.some(e => /Function LINE is not available/i.test(e));
    expect(hasLineMissing).toBe(false);

    // Trace should have numbered entries and no (no line#)
    const trace = capture.outputs.filter(l => /^\s*>>/.test(l)).map(l => l.trim()).join('\n');
    expect(trace.includes('(no line#)')).toBe(false);
    expect(trace.includes('\n>> 2 ')).toBe(true);
  });
});

