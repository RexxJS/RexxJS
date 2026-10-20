/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

// The major version of the `bash` the SYSTEM handler runs (shell="bash" is
// looked up on PATH). macOS ships bash 3.2; ${X^^} and `declare -A` need 4.
const { execFileSync } = require('child_process');

const bashMajor = Number(execFileSync('bash', ['-c', 'echo ${BASH_VERSINFO[0]}'], { encoding: 'utf8' }).trim());

// `testNeedingBash4(name, fn)` is `test`, or `test.skip` where bash is older
// than 4 (put a bash 4 first on PATH to run them).
const testNeedingBash4 = bashMajor >= 4 ? test : test.skip;

module.exports = { bashMajor, testNeedingBash4 };
