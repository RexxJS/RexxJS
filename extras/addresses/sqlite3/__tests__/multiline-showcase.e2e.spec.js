/* E2E test to run the SQLite multiline showcase Rexx script through the interpreter.
 * Verifies ADDRESS MATCHING + RESULT/RC semantics remain intact. */

const fs = require('fs');
const path = require('path');

const { RexxInterpreter } = require('../../../../core/src/interpreter');
const { parse } = require('../../../../core/src/parser');

describe.skip('SQLite multiline showcase (E2E)', () => {
  test('runs showcase and produces expected SAY output markers', async () => {
    const baseDir = path.join(__dirname, '..');
    const scriptPath = path.join(baseDir, 'multiline-showcase.rexx');
    const script = fs.readFileSync(scriptPath, 'utf8');

    // Load sqlite address handler referenced by the script
    const sqliteAddrPath = path.join(baseDir, 'sqlite-address.js');
    if (fs.existsSync(sqliteAddrPath)) {
      // eslint-disable-next-line no-eval
      eval(fs.readFileSync(sqliteAddrPath, 'utf8'));
    } else {
      throw new Error('sqlite-address.js not found; cannot run showcase e2e test');
    }

    // Load expectations address used by the script
    const expectationsPath = path.join(__dirname, '../../../../core/src/expectations-address.js');
    // eslint-disable-next-line no-eval
    eval(fs.readFileSync(expectationsPath, 'utf8'));

    // Capture SAY output
    const sayLines = [];
    const rpc = {
      send: async (namespace, method, params) => {
        const ns = String(namespace || '').toLowerCase();
        if (ns === 'expectations') {
          return await global.ADDRESS_EXPECTATIONS_HANDLER(method, params);
        }
        if (ns === 'sqlite3') {
          if (!global.ADDRESS_SQLITE3_HANDLER) {
            throw new Error('ADDRESS_SQLITE3_HANDLER not available');
          }
          return await global.ADDRESS_SQLITE3_HANDLER(method, params, { variables: new Map() });
        }
        if (ns === 'default') return { status: 'ignored' };
        throw new Error(`Unknown address namespace: ${namespace}`);
      },
      write: () => {},
      writeLine: (text) => { sayLines.push(String(text)); },
      writeError: (text) => { sayLines.push(String(text)); },
    };

    const interpreter = new RexxInterpreter(rpc);
    const commands = parse(script);
    await interpreter.run(commands);

    const out = sayLines.join('\n');
    expect(out).toContain('SQLite3 Multiline ADDRESS MATCHING Showcase');
    expect(out).toContain('✓ Complex table created');
    expect(out).toContain('✓ Batch insert: 4 employees added');
    expect(out).toContain('✓ Aggregation query executed');
    expect(out).toContain('Multiline ADDRESS MATCHING showcase complete');
  });
});

