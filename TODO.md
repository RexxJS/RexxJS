# To do

Known bugs, with what reproduces them. Fix one with its jest spec in
`core/tests/`, or the module's own tests for an `extras/` one (the spec
failing first), and take its entry out here.

Most of the entries after the first two were found on 2026-10-14, getting
CI green again after a year red: the tests that had stopped loading were
brought back, and these are what they (and the people fixing them) turned
up but left alone. Security first.

## Recursion through CALL never stops

Found 2026-10-14, while making `IF()` lazy for sae's spreadsheet (a
function that calls itself). A routine called by CALL works, and so does
one called once from another; one that CALLs itself does not, for two
reasons, each its own bug.

```rexx
CALL DOWN 3
SAY "done"
EXIT
DOWN: PROCEDURE
  ARG n
  SAY n
  IF n > 0 THEN CALL DOWN n - 1
  RETURN 0
```

1. **An expression as CALL's argument is not worked out.** `CALL DOWN n - 1`
   passes 3 every time: the script says `3` until the heap runs out (Node
   aborts, "JavaScript heap out of memory"), where Rexx says 3, 2, 1, 0 and
   `done`. The usual factorial (`CALL FACT n - 1` ... `RETURN n * RESULT`)
   fails the same way.

2. **A variable holding 0, passed to CALL, arrives as its name.** With the
   argument worked out first,

   ```rexx
     LET m = n - 1
     IF n > 0 THEN CALL DOWN m
   ```

   the script says `3`, `2`, `1`, then `m`, and stops with "Non-numeric
   value in arithmetic: 'm' is not a valid number". At n = 1, m is 0, and
   the callee's `ARG n` gets the text `m`: as if a lookup takes 0 (falsy)
   for "no such variable" and falls back to the name.

Seen in `core/src` at `d27c738`.

## numpy-inspired functions called with no arguments give a value

Found 2026-10-14, when `extras/functions/numpy-inspired/__tests__/
parameter-requirement.spec.js` first loaded (its paths had been one level
short). Registered as built-in functions and called with no arguments,
they return something instead of NumPy's error for a missing argument:

```rexx
SAY ZEROS()     /* 0, where NumPy raises: missing 'shape' */
SAY ONES()      /* 1 */
SAY ARANGE()    /* 0,1,...,9: as if called with 10 */
SAY SUM()       /* nothing */
```

`zeros()` itself, given `undefined`, returns `[]`, so something in calling
a built-in with no parameters supplies an argument (`callConvertParamsToArgs`
is the place to look). `MATMUL()` fails, but on reading an undefined's
`length`. `ARRAY()` now throws "array() needs an object to make an array
of", as NumPy's does; the spec's other eleven are skipped until each
function checks its required argument.

## Security: remote-shell-handler puts the working dir in `cd "..."` unescaped

`extras/addresses/system/src/remote-shell-handler.js`, `executeCommand`
(about line 538): `remoteCommand = \`cd "${options.workingDir}" && ${command}\``.
A `"` in the working dir ends the quoted string and what follows runs on
the remote host:

```rexx
ADDRESS REMOTE_SHELL
"execute command=pwd connection=web working_dir='/tmp\"; rm -rf ~; echo \"'"
```

Quote it for the remote shell (single quotes, with each `'` written
`'\''`), or refuse a working dir with quotes in it.

## Security: remote-shell-handler checks host and key before interpolation

`connect` calls `validateHost` and `validateKeyPath` (about lines 126 and
130) on the raw parameters, and interpolates `{{...}}` only afterwards.
So in strict mode `connect host="{{server}}"` is refused even when
`server` holds an allowed host; and an allowlist entry that is itself a
template would let any host through. Interpolate first, then validate
what will actually be used.

## remote-shell-handler: smaller things

- **Timeouts never cleared.** The connection probe's, upload's and
  download's `setTimeout`s (about lines 512, 636, 690) are not cleared on
  success, so each later calls `kill()` on a finished process and keeps
  Node alive for up to 10 or 30 s. (Its tests use fake timers for this.)
- **Reconnecting an alias replaces it silently** (about line 160): the
  old connection entry is overwritten, with no error and no disconnect.
- **`mode` is accepted on upload and ignored**: documented, never applied
  (no chmod).
- **Execute is logged as `connect_success`** (about lines 213 and 230), for
  success and error alike.

## deployment-orchestrator: what its tests found and left

`extras/addresses/system/src/deployment-orchestrator.js`:

- **Remote runs execute an empty script.** `executeRemoteSimple` (about
  line 737) sends `execute command="cat > /tmp/rexx_N.rexx"` with no
  stdin, then runs the empty file.
- **CHECKPOINT monitoring cannot work** (about lines 923-924): it sends
  `execute host=... script=...`, which the remote shell handler does not
  take (it wants `command=` and `connection=`), and for containers uses
  `deployment.name`, always undefined, with `script=`, where podman's
  execute wants `command=`.
- **One-shot deployments stay listed**: `deploy_and_execute` removes its
  container but leaves the entry in `activeDeployments`.
- **Cleanup ignores its result**: `cleanup_deployment` drops the
  deployment even when the remove or disconnect failed.
- **A `"` in a script breaks it**: the script goes inside `script="..."`,
  and both the orchestrator's and podman-address's quoted-value parsing
  end it at the first `"`.
- **`deployment-index.js` is untested**: its factories and
  `registerSystemHandlers` now build podman-address's and docker-address's
  handlers, which take commands through `handleAddressCommand`, not the
  old `handleMessage`; nothing checks that what it registers works.

## claude ADDRESS: what is parsed and not used

`extras/addresses/anthropic-ai/claude/`:

- **A heredoc's `model=`, `temperature=` and `max_tokens=` are ignored.**
  They are parsed, but `callClaudeAPI` always sends
  `claude-3-5-sonnet-20241022` with `max_tokens: 4000`, and
  `response.model` is always undefined. (The README says so.)
- **Dead code**: `formatClaudeResultForREXX`'s `START_SESSION`,
  `CHAT_MESSAGE` and `END_SESSION` branches (sessions went in 53c4bad),
  and the handler's catch builds a `formatClaudeErrorForREXX` result it
  never uses before rethrowing.
- **`package.json`** lists `@anthropic-ai/sdk`, which the code never
  imports (it calls the API with `fetch`), and its `"main"` is
  `claude-address.js`, which moved to `src/`.
- **`claude-address-simple.spec.js`** replaces `global.fetch` in
  `beforeEach` and never puts it back.

## Packages with no tests of their own

The tests of the docker and proxmox handlers in `extras/addresses/system/`
were deleted (51ab272): the handlers moved to `docker-address` and
`proxmox-address` in 320a693, and the old tests were of the old classes.
Neither package has Jest tests now (docker-address's `npm test` says "No
tests yet"; proxmox-address has only `test-proxmox-cow.rexx`).

## Language gaps the tests ran into

- **A heredoc cannot be a named parameter's value.** `LET r = execute
  shell="bash" command=<<X ... X` parses as `command` empty, then the
  heredoc's lines as statements. A heredoc assigned to a variable works
  (`LET script = <<X ... X`, then `command=script`), as does a bare heredoc
  sent to an ADDRESS.
- **A command called as a function does not set RC.** After `LET r =
  execute command="exit 3"` in ADDRESS SYSTEM, RC is unchanged; the outcome
  is in `r.exitCode`. A quoted or heredoc command sets RC. Decide which is
  meant, and document it.
- **The parameter guard only sees declarations in expressions.** A function
  that declares `requiresParameters` (or a required parameter in
  `parameterMetadata`) and is called with none in an expression now says
  so (0ef6534); one with no declaration still runs with whatever the
  calling convention supplies (see the numpy entry above).

## Test hygiene

- **`core/tests/dom-functions.spec.js` does not exit when run alone.** Its
  31 tests pass, then Jest waits on an open handle (`npx jest
  tests/dom-functions.spec.js`; find it with `--detectOpenHandles`). The
  full run exits, so CI is unaffected.
- **Three bash tests need bash 4** (`${X^^}`, `declare -A`) and fail under
  macOS's bash 3.2: in `extras/addresses/system/__tests__/`,
  system-address-bash-shell's parameter-expansion, associative-array and
  complex-operations tests, and system-address-bash-comprehensive's
  associative arrays. They pass on Linux (CI). Skip them where bash is
  older than 4, or run them with a bash 4 found on PATH.
- **`ci.sh` installs each module with `npm install`**, which rewrites
  `extras/package-lock.json` (it prunes stale "extraneous" entries such as
  `addresses/gemini-ai`) in a local run. Prune it once and commit it, or
  use `npm ci` where a module has a lock file.
