/*
  Parser-level assertions for SELECT/WHEN/OTHERWISE line numbers.
  Ensures WHEN headers and OTHERWISE headers carry correct line numbers and
  no executable command is assigned the END line number.
*/

describe('parser: SELECT line numbers', () => {
  const { parse } = require('../src/parser.js');

  test('nested SELECT captures WHEN header lines and excludes END', () => {
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
      '  OTHERWISE',                  // 11
      '    SAY "outer otherwise"',   // 12
      'END',                          // 13
      'SAY "done"'                   // 14
    ].join('\n');

    const commands = parse(script);

    // Find outer SELECT
    const outerSelect = commands.find(c => c.type === 'SELECT');
    expect(outerSelect).toBeTruthy();

    // WHEN header line should be 3
    expect(outerSelect.whenClauses[0].lineNumber).toBe(3);

    // Inside the WHEN, find the inner SELECT
    const innerSelect = outerSelect.whenClauses[0].commands.find(c => c.type === 'SELECT');
    expect(innerSelect).toBeTruthy();

    // Inner WHEN header line should be 6
    expect(innerSelect.whenClauses[0].lineNumber).toBe(6);

    // No command should carry the END line number 10
    const collectAll = (cmds) => cmds.flatMap(c => {
      const nested = [];
      if (c.type === 'SELECT') {
        nested.push(...c.whenClauses.flatMap(w => w.commands));
        nested.push(...c.otherwiseCommands);
      } else if (c.statement) {
        nested.push(c.statement);
      }
      return [c, ...collectAll(nested)];
    });

    const all = collectAll(commands);
    expect(all.some(c => c && c.lineNumber === 10 && c.type !== 'LABEL')).toBe(false);
  });
});

