/*
  Ensure CALL tracing shows correct line numbers for caller and callee code.
*/

describe('trace: CALL line numbers', () => {
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
    const { parse } = require('../src/parser.js');
    const commands = parse(script);
    return interp.run(commands, script, 'inline-call.rexx').then(() => capture);
  }

  test('simple CALL with nested CALL reports numbered traces', async () => {
    const script = [
      'CALL sub1',           // 1
      'SAY "done"',         // 2
      'sub1:',               // 3 (label)
      '  SAY "in sub1"',    // 4
      '  CALL sub2',         // 5
      '  RETURN',            // 6
      'sub2:',               // 7 (label)
      '  SAY "in sub2"',    // 8
      '  RETURN'             // 9
    ].join('\n');

    const cap = await runWithTrace(script);
    const trace = cap.outputs.filter(l => /^\s*>>/.test(l)).map(l => l.trim()).join('\n');

    // We expect:
    // - CALL sub1 traced at line 1
    // - SAY in sub1 at line 4
    // - CALL sub2 at line 5
    // - SAY in sub2 at line 8
    // - SAY done at line 2 (after returns)
    const expected = `
>> 1 CALL sub1 (0 args)
>> 4 SAY "in sub1"
>> 5 CALL sub2 (0 args)
>> 8 SAY "in sub2"
>> 2 SAY "done"`;

    // Expect canonical CALL headers and exact SAY lines in order
    const lines = trace.split('\n');
    expect(lines[0]).toBe('>> 1 CALL sub1 (0 args)');
    expect(lines[1]).toBe('>> 4 SAY "in sub1"');
    expect(lines[2]).toBe('>> 5 CALL sub2 (0 args)');
    expect(lines[3]).toBe('>> 8 SAY "in sub2"');
    expect(lines[4]).toBe('>> 2 SAY "done"');

    expect(trace.includes('(no line#)')).toBe(false);
  });
});
