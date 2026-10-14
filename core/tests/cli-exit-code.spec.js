/**
 * EXIT's code reaches the process: executeScript reports it as
 * interpreter.exitCode, and the rexx CLI exits with it (it used to exit 0
 * whatever EXIT said, so a shell or a test harness could not tell a script
 * that gave up from one that finished).
 *
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { executeScript } = require('../src/executor');

const CLI = path.join(__dirname, '..', 'src', 'cli.js');

function runCli(script) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rexx-exit-'));
  const file = path.join(dir, 'script.rexx');
  fs.writeFileSync(file, script);
  const r = spawnSync(process.execPath, [CLI, file], { encoding: 'utf8' });
  fs.rmSync(dir, { recursive: true, force: true });
  return r;
}

describe('EXIT code from executeScript', () => {
  const codeOf = async (script) => (await executeScript(script, null)).exitCode;

  it('is 0 when the script runs to its end', async () => {
    expect(await codeOf('LET x = 1')).toBe(0);
  });

  it('is EXIT\'s code at the top level', async () => {
    expect(await codeOf('EXIT 3')).toBe(3);
    expect(await codeOf('EXIT 0')).toBe(0);
    expect(await codeOf('EXIT')).toBe(0);
  });

  it('is EXIT\'s code inside IF ... DO and a loop', async () => {
    expect(await codeOf('IF 1 = 1 THEN DO\n  EXIT 4\nEND\nEXIT 9')).toBe(4);
    expect(await codeOf('DO i = 1 TO 3\n  IF i = 2 THEN EXIT 5\nEND')).toBe(5);
  });

  it('is EXIT\'s code from inside a subroutine', async () => {
    expect(await codeOf('CALL Quit\nEXIT 0\nQuit:\n  EXIT 6\nRETURN')).toBe(6);
  });

  it('is EXIT\'s code when it is an expression', async () => {
    expect(await codeOf('LET n = 2\nEXIT n + 5')).toBe(7);
  });
});

describe('the rexx CLI exits with EXIT\'s code', () => {
  it('exits 0 when the script runs to its end', () => {
    const r = runCli('SAY "done"\n');
    expect(r.stdout).toContain('done');
    expect(r.status).toBe(0);
  });

  it('exits 1 after EXIT 1, with what it said before', () => {
    const r = runCli('SAY "giving up"\nEXIT 1\nSAY "not reached"\n');
    expect(r.stdout).toContain('giving up');
    expect(r.stdout).not.toContain('not reached');
    expect(r.status).toBe(1);
  });

  it('exits with the code EXIT gives inside IF ... DO', () => {
    expect(runCli('IF 1 = 1 THEN DO\n  EXIT 3\nEND\n').status).toBe(3);
  });

  it('exits 0 after EXIT 0', () => {
    expect(runCli('EXIT 0\n').status).toBe(0);
  });
});
