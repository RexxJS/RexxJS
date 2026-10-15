/**
 * `c = a || b` (no LET) assigned the text "a || b": the parser's LET path
 * knew a top-level || as a concatenation, the no-LET assignment path did
 * not, and its quoted-string test took `"x" || "y"` for one literal.
 * SAY a || b was already right, as was LET c = a || b.
 */

const { Interpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

describe('|| in an assignment without LET', () => {
  let interpreter;
  let said;

  beforeEach(() => {
    said = [];
    interpreter = new Interpreter(null, { output: (line) => said.push(String(line)) });
  });

  const run = async (script) => {
    await interpreter.run(parse(script));
    return said;
  };

  test('c = a || b', async () => {
    await run('a = "ab"\nb = "cd"\nc = a || b\nSAY c');
    expect(said).toEqual(['abcd']);
  });

  test('a variable and a literal, either way round, and three terms', async () => {
    await run('a = "ab"\nb = "cd"\nc = a || "-"\nd = "-" || b\ne = a || "-" || b\nSAY c d e');
    expect(said).toEqual(['ab- -cd ab-cd']);
  });

  test('two literals', async () => {
    await run('c = "x" || "y"\nSAY c');
    expect(said).toEqual(['xy']);
  });

  test('a one-line script with ; between clauses', async () => {
    await run('a = "ab"; b = "cd"; SAY a || b');
    expect(said).toEqual(['abcd']);
  });

  test('the same through the CLI, core/rexx on a file', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rexxjs-concat-'));
    const file = path.join(dir, 'concat.rexx');
    fs.writeFileSync(file, 'a = "ab"; b = "cd"; SAY a || b\nc = a || b\nSAY c\n');
    try {
      const out = execFileSync(path.join(__dirname, '..', 'rexx'), [file], { encoding: 'utf8' });
      const lines = out.split('\n').filter((l) => !l.includes('[INFO]') && l.trim() !== '');
      expect(lines).toEqual(['abcd', 'abcd']);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
