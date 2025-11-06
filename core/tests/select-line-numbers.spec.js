/*
  Verify that SELECT/WHEN/OTHERWISE produce trace lines with real line numbers.
*/

const { JSDOM } = require('jsdom');

describe('SELECT line numbers in trace', () => {
  let RexxInterpreterBuilder;

  beforeAll(() => {
    // Load the interpreter modules from source (browser-compatible entry)
    // In this repo, core/src/interpreter.js attaches builder to window via bundle entry in browser.
    // For Jest, require the source directly.
    jest.resetModules();
    RexxInterpreterBuilder = require('../src/interpreter.js').RexxInterpreterBuilder || global.RexxInterpreterBuilder;
    if (!RexxInterpreterBuilder) {
      throw new Error('RexxInterpreterBuilder not available for tests');
    }
  });

  function buildInterpreter(capture) {
    const handler = {
      output: (text) => capture.outputs.push(text),
      outputException: (err) => capture.errors.push(String(err))
    };

    const interp = new RexxInterpreterBuilder(null)
      .withOutputHandler(handler)
      .withTraceMode('NORMAL')
      .withTraceToOutput(true)
      .build();
    return interp;
  }

  test('SELECT and WHEN emit numbered trace lines (no (no line#) anywhere)', async () => {
    const script = [
      'SAY "start"',                 // 1
      'SELECT',                       // 2
      '  WHEN 1 = 1 THEN',            // 3
      '    SAY "in when"',           // 4
      '  OTHERWISE',                  // 5
      '    SAY "in otherwise"',      // 6
      'END',                          // 7
      'SAY "done"'                   // 8
    ].join('\n');

    const capture = { outputs: [], errors: [] };
    const interp = buildInterpreter(capture);

    const { parse } = require('../src/parser.js');
    const commands = parse(script);
    await interp.run(commands, script, 'inline.rexx');

    const traceLines = capture.outputs.filter(l => /^\s*>>/.test(l));
    expect(traceLines.length).toBeGreaterThan(0);

    // All trace lines must be numbered; no (no line#) anywhere
    const allNumbered = traceLines.every(l => /^>>\s+\d+\b/.test(l));
    expect(allNumbered).toBe(true);

    // Expect exact multi-line trace snippet as a single comparison
    const expectedTrace =
`>> 1 SAY "start"
>> 2 SELECT
>> 3 WHEN 1 = 1 THEN
>> 4 SAY "in when"
>> 8 SAY "done"`;
    const actualTrace = traceLines.map(l => l.trim()).join('\n');
    expect(actualTrace).toEqual(expectedTrace);

    // Ensure (no line#) does not appear at all
    expect(traceLines.some(l => l.includes('(no line#)'))).toBe(false);
  });

  test('Nested SELECT and multi-line OTHERWISE are numbered', async () => {
    const script = [
      'SAY "start"',                 // 1
      'SELECT',                       // 2
      '  WHEN 1 = 1 THEN DO',         // 3
      '    SAY "level1"',            // 4
      '    SELECT',                   // 5
      '      WHEN 2 = 2 THEN',        // 6
      '        SAY "level2"',        // 7
      '      OTHERWISE',              // 8
      '        SAY "nope"',          // 9
      '    END',                      // 10
      '  OTHERWISE',                  // 11 (multi-line OTHERWISE)
      '    SAY "outer otherwise"',   // 12
      'END',                          // 13
      'SAY "done"'                   // 14
    ].join('\n');

    const capture = { outputs: [], errors: [] };
    const interp = buildInterpreter(capture);
    const { parse } = require('../src/parser.js');
    const commands = parse(script);
    await interp.run(commands, script, 'inline-nested.rexx');

    const traceLines = capture.outputs.filter(l => /^\s*>>/.test(l));
    expect(traceLines.length).toBeGreaterThan(0);

    // All traces must be numbered
    const allNumbered = traceLines.every(l => /^>>\s+\d+\b/.test(l));
    expect(allNumbered).toBe(true);

    // Exact expected trace for nesting as a single comparison
    const expectedNested =
`>> 1 SAY "start"
>> 2 SELECT
>> 3 WHEN 1 = 1 THEN DO
>> 4 SAY "level1"
>> 5 SELECT
>> 6 WHEN 2 = 2 THEN
>> 7 SAY "level2"
>> 14 SAY "done"`;
    const actualTrace2 = traceLines.map(l => l.trim()).join('\n');
    expect(actualTrace2).toEqual(expectedNested);

    // Check OTHERWISE anchors (we expect some activity around line 11 or 8)
    // The taken path is WHENs, so OTHERWISE body might not execute, but the anchor for entry should
    // still be numbered when entered; ensure no (no line#) exists regardless.
    expect(traceLines.some(l => l.includes('(no line#)'))).toBe(false);
  });
});
