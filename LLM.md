# What This Repository Contains

This is a **REXX interpreter and RPC framework** implemented in JavaScript, designed to run both in Node.js and browsers with comprehensive cross-application communication capabilities.

## Core Components

### REXX Language Interpreter (`src/interpreter.js`)
- Complete REXX language implementation with modern extensions
- Supports classic REXX syntax: `SAY`, `LET`, `DO...END`, `IF...THEN...ELSE`, `SELECT...WHEN`
- Advanced control structures: `DO OVER` for iteration, `INTERPRET` for dynamic code execution
- There is `INTERPRET_JS` too dynamic JavaScript code execution - but that's really only for debugging
- Function library system with 200+ built-in functions across multiple domains
- **Variable Resolver (var_missing) Callback**: Lazy variable resolution system that allows external environments (like spreadsheets) to provide variable values on-demand without pre-injection
  - Variables resolved via `variableResolver` callback when not found in interpreter's variable map
  - No caching - callback invoked every time variable is accessed
  - Enables first-class interop with host environments (Tauri, browser, Node.js)
  - Example: Spreadsheet cell references (`A1`, `B2`) resolved dynamically from spreadsheet model
  - Test coverage: 12 comprehensive tests in `core/tests/variable-resolver.spec.js`

### Environment Detection & Awareness

The interpreter automatically detects its execution environment—whether it's running in a standard
Node.js process, as a standalone executable created by `pkg`, or within a web browser. This runtime
context is exposed in two ways: globally to other JavaScript modules via the `REXX_ENVIRONMENT`
object, and directly to REXX scripts through special `RUNTIME.` stem variables (e.g., `RUNTIME.TYPE`,
`RUNTIME.IS_PKG`, `RUNTIME.HAS_DOM`). This powerful feature allows both the core system and user
scripts to implement conditional logic that adapts to the capabilities of the host environment, such
as accessing the file system in Node.js or manipulating the DOM in a browser.

#### Modes of operation

**Node.js Environments:**

1. **Development (un-built)** - Direct source execution in Node.js:
   - **Entry point**: `src/interpreter.js` + `src/parser.js` (loaded directly)
   - **Usage**: Embedded in Jest tests with REXX code and assertions
   - **Command**: Jest test runner (`npm test`)
   - **Example**: Test files in `tests/` directory using `new RexxInterpreter()`

2. **CLI (un-built)** - Repository CLI for development:
   - **Entry point**: `core/src/cli.js` (via `core/rexx` bash wrapper)
   - **Webpack config**: `webpack.config.js` entry point is now `./src/cli.js` (after deleting `src/index.js`)
   - **Usage**: Developer-friendly command-line execution
   - **Command**: `node core/src/cli.js script.rexx` or `./core/rexx script.rexx`
   - **Size**: Minimal (CLI only, no bundled libraries)

3. **Binary (built)** - Standalone executable via `pkg`:
   - **Entry point**: `src/cli.js` compiled into `bin/rexx` binary
   - **Build command**: `create-pkg-binary.js`
   - **Usage**: Production CLI without requiring Node.js installation
   - **Size**: ~49MB standalone binary
   - **Compatibility**: Glibc and Musl x86-64 systems
   - **Capability**: Identical to `core/rexx` but statically compiled

**Web Environments:**

4. **REPL Bundle (built)** - Full-featured browser bundle:
   - **Entry point**: `src/repl/interpreter-bundle-entry.js`
   - **Build command**: `cd core/src/repl && npm install` or GitHub Actions
   - **Published**: `https://repl.rexxjs.org/repl/dist/rexxjs.bundle.js`
   - **Size**: ~357KB (includes all function libraries)
   - **Usage**: Interactive REPL, web applications with full library access
   - **Includes**: All built-in functions, ADDRESS handlers, and utilities

5. **Web Loader (un-built)** - Direct source serving in browser:
   - **Entry point**: `core/src/interpreter-web-loader.js` (loads `src/interpreter.js` + `src/parser.js`)
   - **Usage**: Local development via HTTP server
   - **URL**: `https://localhost:portNum/core/src/interpreter-web-loader.js`
   - **Limitation**: Same-origin policy applies
   - **Advantage**: Easier debugging of source files


## CLI & Distribution

- **./rexx** - Standalone binary (49MB, no Node.js required) created via `create-pkg-binary.js`
- **node core/src/cli.js** - Node.js CLI for development (requires Node.js installation)
- **./rexxt** - Test runner (via src/test-interpreter.js) with modern testing features
  - Test skip capability with `@skip` annotations (inspired by Jest/pytest/RSpec)
  - Tag-based filtering, pattern matching, multiple output modes
  - See `core/REXXT_GUIDE.md` for complete documentation 

### Function Libraries (core `src/` and modular `extras/functions/`)

**Core Functions in `src/` (66 modules):**
- **String Processing**: `string-functions.js`, `string-processing.js`, `regex-functions.js`, `escape-sequence-processor.js`
- **Data Structures**: `array-functions.js`, `data-functions.js`, `json-functions.js`
- **Numeric Operations**: `math-functions.js`, `statistics-functions.js`, `probability-functions.js`, `random-functions.js`
- **Date/Time**: `date-time-functions.js`
- **File System**: `file-functions.js`, `path-functions.js`, `path-resolver.js`
- **HTTP/Web**: `http-functions.js`, `url-functions.js`, `dom-functions.js`, `dom-pipeline-functions.js`
- **Security**: `cryptography-functions.js`, `validation-functions.js`, `security.js`
- **Logic/Flow**: `logic-functions.js`
- **System**: `shell-functions.js` - process management (PS, PGREP, KILLALL, TOP, NICE), environment variables, shell command execution (Node.js only)
- **Utilities**: `interpolation.js`, `interpolation-functions.js`, `utils.js`, `parameter-converter.js`
- **Infrastructure**: `address-handler-utils.js`, `composite-output-handler.js`, `function-parsing-strategies.js`, `test-framework-address.js`, `expectations-address.js`
- **Interpreter Core**: `interpreter.js`, `parser.js`, `executor.js`, `test-interpreter.js`, `test-runner-cli.js`, `cli.js`
- **Interpreter Modules** (40+ supporting modules): `interpreter-address-handling.js`, `interpreter-array-functions.js`, `interpreter-builtin-functions.js`, `interpreter-control-flow.js`, `interpreter-dom-manager.js`, `interpreter-error-handling.js`, `interpreter-library-management.js`, `interpreter-security.js`, `interpreter-trace-formatting.js`, `interpreter-variable-stack.js`, `require-system.js`, and more

**Function Libraries in `extras/functions/` (13 domains):**
- **R Statistical Computing**: `r-inspired/` - data frames, factors, statistical functions (MEAN, MEDIAN, SD, VAR, etc.)
- **SciPy Scientific**: `scipy-inspired/` - interpolation, signal processing, statistical functions
- **Excel Spreadsheet**: `excel/` - VLOOKUP, HLOOKUP, INDEX, MATCH, SUMIF, COUNTIF, etc.
- **Data Processing**: `jq-functions/` (jq-compatible JSON processor), `sed/` (stream editor), `diff/` (file diffing)
- **ML/Numerical**: `numpy-inspired/`, `numpy-via-pyoide/`, `sympy-inspired/` (symbolic math)
- **Visualization**: `graphviz/` (graph generation)
- **Text Processing**: `minimatch/` (glob pattern matching), `matlab-inspired/` (MATLAB compatibility)
- **Lambda Support**: `jq-wasm-functions/` (jq compiled to WebAssembly)

**Modular Design**: Function libraries loaded on-demand via REXX `REQUIRE` statements. Libraries can be loaded by their published name (e.g., `REQUIRE "org.rexxjs/excel-functions"`) or by a relative path to the source file (e.g., `REQUIRE "../path/to/excel-functions.js"`)

### Operations vs Functions Architecture
RexxJS distinguishes between two types of callable code:
- **Operations** (imperative commands without parentheses): Side-effect actions like `SERVE_GUEST guest="alice"` or `CLEAN_BATHHOUSE area="lobby"`
  - Receive parameters as named params object directly
  - Used for state-changing commands and imperative workflows
  - Can be called from REQUIRE'd libraries alongside functions
- **Functions** (expressions with parentheses): Pure/query operations like `COUNT_TOKENS()` or `IDENTIFY_SPIRIT(description="muddy")`
  - Support both positional (`SUBSTR("hello", 2, 3)`) and named parameters (`SUBSTR(start=2, length=3)`)
  - Parameters converted via parameter-converter for flexibility
  - Work in all contexts: assignments, expressions, pipe operators
- **REQUIRE system**: Libraries export both functions and operations, automatically loaded and prefixed via `REQUIRE "lib" AS prefix_(.*)`

### Function Execution Priority
When a function is called, the interpreter resolves it in this order:
1. **Built-in REXX functions** (LENGTH, SUBSTR, POS, etc.) - Always available regardless of ADDRESS context
2. **External functions** from REQUIRE'd libraries
3. **ADDRESS handler custom methods** - Only checked if not a built-in function
4. **Browser functions** (executeBrowserStringFunction)
5. **RPC/fallback** handler

This ensures standard REXX functions always work, while allowing ADDRESS handlers to define custom methods that don't conflict with built-ins. DOM functions use `DOM_` prefix (`DOM_QUERY`, `DOM_CLICK`, etc.) to avoid naming conflicts.

### ADDRESS mechanism
- **Cross-Application Communication** is one way of looking at it
- **Alien parsable/interpretable language** (Sql, bash, english assertion grammar, others)
- **implementations** can modify RC and RESULT vars (the latter a dict if needed)
- **SQL**: SQLite database operations
- **SYSTEM**: OS-level shell command execution (`ADDRESS SYSTEM "ls -la"`, `ADDRESS SYSTEM "cat > file.txt <<'EOF' ... EOF"`)
- **Assertions**: not just for the build in test framework
- **Mock testing**: Comprehensive test framework (`core/tests/mock-address.js`)
- **HEREDOC with interpolation**: `<<SQL` supports variable interpolation with configurable patterns (`{{var}}`, `${var}`, custom)
- **HEREDOC JSON auto-parsing**: `LET config = <<JSON` automatically parses to JavaScript objects
- Supports both traditional command strings (`"CREATE TABLE users"`) and modern method calls (`execute sql="CREATE TABLE users"`)

### ADDRESS Handlers (`extras/addresses/` - 26 handlers)

**Cloud Orchestration & Provisioning:**
- **Google Cloud Platform** (`gcp-address.js`, `google-cloud-platform/`) - 🚀 Killer Feature: Direct Spreadsheet SQL (`SHEET ... SELECT * FROM 'Sales'`), BigQuery, Firestore, Pub/Sub, Cloud Functions, Cloud Run, cross-service data pipelines
- **AWS Lambda** (`lambda-address.js`) - Serverless function execution, deployment
- **OpenFaaS** (`openfaas-address.js`) - Function-as-a-Service platform

**Container Management:**
- **Docker** (`docker-address.js`) - Full Docker container lifecycle
- **Remote Docker** (`remote-docker-address.js`) - Docker operations on remote hosts
- **Podman** (`podman-address.js`) - Rootless container operations
- **systemd-nspawn** (`nspawn-address.js`) - Lightweight OS containers

**Virtual Machine Management:**
- **QEMU/KVM** (`qemu-address.js`) - Production virtualization with Guest Agent (no SSH needed)
- **VirtualBox** (`virtualbox-address.js`) - Desktop/development VMs with Guest Additions
- **Proxmox** (`proxmox-address.js`) - Enterprise virtualization platform
- **Firecracker** (`firecracker-address.js`) - Lightweight VM runtime (AWS)
- **LXD** (`lxd-address.js`) - System container manager

**Database & Data:**
- **SQLite3** (`sqlite3/`) - Local database operations with full CRUD via SQL
- **DuckDB** (`duckdb-address.js`, `duckdb-wasm-address.js`) - OLAP SQL engine, in-process and WebAssembly
- **Pyodide** (`pyodide/`) - Python runtime in browser/Node.js

**AI/ML & APIs:**
- **Anthropic Claude** (`anthropic-ai/claude/`) - Claude API integration
- **OpenAI** (`open-ai/chat-completions/`) - GPT API integration
- **Google Gemini** (`gemini-address.js`, `gemini-pro/`) - Gemini API integration

**System & Testing:**
- **System Shell** (`system/`) - OS-level shell command execution
- **Echo/Testing** (`echo/`) - Simple echo handler for testing and demonstrations

**Shared Utilities:**
- `_shared/`, `shared-utils/` - Common utilities and helper functions

**Key Capabilities:**
- **Cloud-native orchestration**: Single unified interface for all major cloud services
- **Exec without SSH**: Run commands directly in VMs/containers like `docker exec`
- **RexxJS deployment**: Automatically deploy and execute RexxJS scripts in VMs/cloud
- **Idempotent operations**: `start_if_stopped`, `stop_if_running` for safe automation
- **Lifecycle management**: Create, start, stop, pause, resume, restart, snapshot, restore
- **Production features**: Host verification, permissions setup, ISO downloads, guest agent installation
- **Security policies**: Memory/CPU limits, command filtering, audit logging

### Browser Integration (`src/web/`)
- PostMessage-based RPC between iframes
- Secure cross-origin communication
- Real-time streaming with CHECKPOINT functionality (back communication from worker to director)
- Director/worker patterns for distributed processing

### Test Infrastructure (`tests/`)
- **rexxt test runner** - Native RexxJS test runner with modern features (see `core/REXXT_GUIDE.md`)
  - Test skipping with `@skip` annotations
  - Tag-based test filtering (`--tags`)
  - Multiple output modes (live, verbose, minimal)
  - JSON results for CI/CD integration
- 50+ comprehensive test suites
- Playwright browser automation tests
- Jest unit tests for all function libraries
- Mock ADDRESS targets for testing cross-application scenarios

### Documentation (`reference/`)
- **35 comprehensive reference documents** covering all RexxJS features
- Organized by category: basic syntax → built-in functions → advanced features → ADDRESS handlers
- Complete function reference with 400+ built-in functions across all domains
- Integration examples and cross-references between related features
- See `reference/00-INDEX.md` for the complete documentation structure

## Tracing, Line Numbers, and Education-Focused Demos

When guiding an LLM to reason about RexxJS execution or produce UI that “explains” code, prefer the built-in trace facilities which now carry accurate source line numbers for user code.

Key guidance for LLMs:

- Instruction-level tracing
  - Every parsed command carries a `lineNumber`. The interpreter emits a trace for each instruction using the original source line text where available.
  - The interpreter maintains `currentLineNumber` while executing a command so downstream subsystems (e.g., ADDRESS) can attribute traces to the correct Rexx line.

- SELECT/WHEN/OTHERWISE
  - SELECT branch-entry is traced with the exact header line (WHEN or OTHERWISE) before the branch body executes.
  - Branch bodies are executed in-place (not via nested run calls), avoiding duplicate SAY traces and preventing `END` lines from appearing in trace output.
  - For educational UIs, highlight the WHEN/OTHERWISE header line when the branch is chosen and separately highlight executed SAY lines inside the branch.

- CALL (subroutines)
  - The interpreter emits a single, canonical CALL header trace at the caller’s source line: `CALL NAME (n args)`.
  - Code inside the callee traces with the callee’s own source line numbers.
  - This behavior composes across “Rexx calls Rexx calls Rexx” and is a good foundation for future stack traces.

- ADDRESS tracing (quoted and heredoc)
  - Traces for ADDRESS commands include the Rexx script line number that initiated the ADDRESS (`command.lineNumber` or `currentLineNumber`).
  - Handlers receive a non-null `sourceContext` object: `{ lineNumber, sourceLine, sourceFilename, interpreter, interpolation }`. Handlers in `extras/addresses/*` remain API-compatible.

- User-facing vs. internal traces
  - The interpreter no longer emits unnumbered trace lines to the output handler stream. This keeps demo RHS panes (SAY-only) clean while still allowing LHS code highlighting to use numbered traces.
  - Internal trace buffers may still record unnumbered events for diagnostics, but avoid surfacing those in learning-focused UIs.

- Building dual-pane demos
  - Use numbered `>> <line> ...` traces to drive code highlighting in the left pane.
  - Suppress all `>> ...` traces from the SAY output pane on the right; render SAY output only.
  - After execution, visually fade unexecuted lines to teach “paths not taken,” but don’t hide them.

## Testing Guidance (for LLMs writing tests)

- Prefer strict, multi-line `toEqual` comparisons for trace when the format is stable (e.g., SELECT/WHEN, simple CALLs, SAY output order).
- For CALL headers, assert exact `>> <line> CALL NAME (n args)` lines where appropriate.
- Ensure no `"(no line#)"` appears in user-visible trace streams. If helpful, add tests that fail on any such occurrence.
- For ADDRESS tests, register lightweight local handlers (e.g., ECHO) rather than relying on a sender; pass-through results are fine and avoid network/mocks.

## Backwards Compatibility Notes

- No `NOP` commands are generated by the parser anymore. Older references to NOP in code or comments should be removed; the interpreter does not need a NOP case.
- SELECT/WHEN/OTHERWISE and CALL tracing changes are additive and should not break existing scripts; they improve trace clarity for education and debugging.

## Key Features for LLMs

### Language Capabilities
```rexx
-- Modern variable assignment
LET data = [1, 2, 3, 4, 5]
LET processed = MAP(data, "x * 2")

-- Operations (imperative, no parentheses) and Functions (expressions, with parentheses)
REQUIRE "cwd:libs/bathhouse.js"
SERVE_GUEST guest="river_spirit" bath="herbal"     -- Operation: side-effect action
LET count = COUNT_TOKENS()                          -- Function: returns value
LET spirit = IDENTIFY_SPIRIT(description="muddy")   -- Function with named params

-- Named parameters work everywhere (functions only)
LET substr1 = SUBSTR("hello world", 7, 5)           -- Positional: "world"
LET substr2 = SUBSTR(start=7, length=5)             -- Named, data-first via pipe
LET result = "hello world" |> SUBSTR(start=7, length=5)  -- Named params in pipe: "world"

-- Database operations
ADDRESS sql
"CREATE TABLE users (id INTEGER, name TEXT)"
LET result = execute sql="INSERT INTO users VALUES (1, 'Alice')"

-- Statistical functions
LET summary = SUMMARY(data)
LET correlation = COR(x_values, y_values)

-- DOM element extraction and filtering in pipelines
LET email_values = ELEMENT("input.email", "all")
  |> FILTER_BY_ATTR("data-required", "true")
  |> GET_VALUES
  |> JOIN(",")

LET active_text = ELEMENT("div.message", "all")
  |> FILTER_BY_CLASS("active")
  |> GET_TEXT
  |> SORT

LET data_ids = ELEMENT("tr.data-row", "all")
  |> FILTER_BY_CLASS("visible")
  |> GET_ATTRS("data-id")
  |> JOIN("|")
```

### Cross-Application Automation
```rexx
-- Control calculator application
ADDRESS calculator
clear
press button="2"
press button="+"
press button="3"
LET result = getDisplay

-- HTTP API integration
LET response = HTTP_GET("https://api.example.com/users")
LET user_data = HTTP_POST("https://api.example.com/users", '{"name": "Alice", "email": "alice@example.com"}')
LET updated = HTTP_PUT("https://api.example.com/users/123", '{"name": "Alice Smith"}')
LET deleted = HTTP_DELETE("https://api.example.com/users/123")
```

### Infrastructure Automation
```rexx
-- QEMU/KVM virtualization with Guest Agent
ADDRESS QEMU
"create image=debian.qcow2 name=ci-vm memory=4G cpus=4"
"configure_ssh name=ci-vm host=192.168.122.50 user=root"
"install_guest_agent name=ci-vm"
-- Now execute without SSH via qemu-guest-agent
"execute vm=ci-vm command=\"apt update && apt install -y build-essential\""
"deploy_rexx vm=ci-vm rexx_binary=/usr/local/bin/rexx"
"execute_rexx vm=ci-vm script=\"SAY 'Running in VM!'\""

-- VirtualBox with Guest Additions
ADDRESS VIRTUALBOX
"create template=Ubuntu name=test-vm memory=2048"
"start_if_stopped name=test-vm"  -- Idempotent
"install_guest_additions name=test-vm"
"execute vm=test-vm command=\"./run-tests.sh\""
"stop_if_running name=test-vm"  -- Idempotent

-- Docker container management
ADDRESS DOCKER
"create image=node:18 name=app-container"
"exec container=app-container command=\"npm install\""
"exec container=app-container command=\"npm test\""

-- Google Cloud Platform orchestration
ADDRESS GCP
"SHEET 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms SELECT * FROM 'Orders' WHERE date = TODAY()"
"BIGQUERY INSERT INTO analytics.daily_orders SELECT * FROM SHEETS_RESULT"
"FIRESTORE SET /metrics/today {\"orders\": 342, \"revenue\": 125000}"
"PUBSUB PUBLISH daily-metrics MESSAGE 'Dashboard updated'"
"FUNCTIONS DEPLOY process-orders SOURCE './functions' TRIGGER 'pubsub:orders' RUNTIME 'python311'"
```

### Process Management (Node.js only)
```rexx
-- List all running processes
LET processes = PS()
LET count = ARRAY_LENGTH(array=processes)
SAY "Found " || count || " processes"

-- Find processes by name
LET nodePids = PGREP(pattern="node")
LET currentPid = GETPID()
SAY "Current process: " || currentPid

-- Search full command line
LET fullMatch = PGREP(pattern="npm.*test", full=true)

-- Get system information with top processes
LET info = TOP(limit=10, sortBy="cpu")
SAY "System uptime: " || info.system.uptime || " seconds"
SAY "CPU count: " || info.system.cpus
SAY "Memory used: " || info.system.memory.percentUsed || "%"

-- Find high CPU processes
LET topProcs = info.processes.top
LET first = ARRAY_GET(array=topProcs, index=0)
SAY "Top process: " || first.name || " (" || first.cpu || "% CPU)"

-- Run command with modified priority (lower = higher priority)
LET result = NICE(command="echo 'Background task'", priority=10)
SAY result.stdout

-- Kill processes by name (be careful!)
-- LET killed = KILLALL(name="test-process", signal="SIGTERM")
-- SAY "Killed " || killed || " processes"
```

### Modern Extensions
- Array/object manipulation with JSON integration
- Functional programming constructs (`MAP`, `FILTER`, `REDUCE`)
- Async/await patterns for browser operations
- Real-time progress monitoring with `CHECKPOINT()`
- Configurable string interpolation patterns - switch between `{{var}}`, `${var}`, `%var%`, or custom delimiters with `SET_INTERPOLATION('pattern')`
- **JavaScript-style escape sequences** in all strings: `\n`, `\t`, `\r`, `\b`, `\f`, `\v`, `\0`, `\'`, `\"`, `\\`, and Unicode escapes `\uXXXX` and `\uXXXXXXXX` - works in assignments, SAY statements, function parameters, and concatenation (**Note: breaks from classic REXX which doesn't support these escape sequences**)
- **DOM Pipeline Functions** (`dom-pipeline-functions.js`) - Extract and filter DOM elements in data pipelines:
  - `FILTER_BY_ATTR(elements, attrName, value)` - Filter elements by attribute value
  - `FILTER_BY_CLASS(elements, className)` - Filter elements by CSS class
  - `GET_VALUES(elements)` - Extract `.value` from form elements (returns REXX stem array)
  - `GET_TEXT(elements)` - Extract `.textContent` from elements (returns REXX stem array)
  - `GET_ATTRS(elements, attrName)` - Extract attribute values from elements (returns REXX stem array)
- **Chainable DOM Operations** - All ELEMENT mutation operations (`click`, `type`, `focus`, `class`, `text`, `attr`, `style`, `append`, `prepend`, `remove`) now return elements instead of void, enabling seamless pipeline composition:
  ```rexx
  ELEMENT("input.data", "all")
    |> FILTER_BY_ATTR("data-required", "true")
    |> GET_VALUES
    |> JOIN(",")
  ```
- **REXX Stem Array Support in JOIN** - `JOIN()` now handles both JavaScript arrays and REXX stem arrays (format: `{0: count, 1: val1, 2: val2}`)
- **DOM Scoped Interpreters** - Multiple REXX scripts can run on the same page with isolated function registrations:
  - Add `RexxScript` CSS class to container elements for automatic scope isolation
  - Functions register to `element.__rexxFunctions` instead of global `window`
  - Prevents namespace pollution and enables multi-tenant applications
  - Backward compatible: existing code without `RexxScript` class continues to work unchanged
  - Opt-in feature for new pages/applications
  ```html
  <!-- Script 1: Isolated scope -->
  <div class="RexxScript" id="script1">
    <textarea>SAY "Script 1"</textarea>
  </div>

  <!-- Script 2: Isolated scope -->
  <div class="RexxScript" id="script2">
    <textarea>SAY "Script 2"</textarea>
  </div>

  <!-- Script 3: Global scope (backward compatible) -->
  <div id="script3">
    <textarea>SAY "Script 3"</textarea>
  </div>
  ```
  - Demo page: `core/src/repl/dom-scoped-rexx.html`
  - Full reference: `site/reference/35-dom-scoped-interpreters.md`
- **Function Metadata and Reflection System** (`function-metadata-registry.js` + `INFO()` / `FUNCTIONS()` reflection functions):
  - `INFO(functionName)` - Get detailed metadata about any function (module, category, description, parameters, return type, examples)
  - `FUNCTIONS()` - List all 100+ functions grouped by module, or filter by category/module: `FUNCTIONS("String")`, `FUNCTIONS("array-functions.js")`
  - `FUNCTIONS(name)` - Get quick info for a specific function: `FUNCTIONS("UPPER")` returns "string-functions.js - String: Convert string to uppercase"
  - Comprehensive metadata for 100+ functions across 23 modules, organized by 13 categories (String, Math, Array, DOM, Shell, etc.)
  - All returns use REXX stem arrays for seamless integration with REXX code
  - Case-insensitive lookups for user-friendly API

## Architecture

The codebase follows a modular design:
- **Parser** (`src/parser.js`): Converts REXX source to executable commands
- **Interpreter** (`src/interpreter.js`): Executes parsed commands with full language support
- **Function Libraries**: Domain-specific functionality in separate modules
- **ADDRESS Targets**: Plugin architecture for external system integration
- **Web Framework**: Browser-specific enhancements and RPC capabilities

### Module Loading Support Matrix

RexxJS's `REQUIRE` system adapts dynamically to the execution environment, providing consistent module loading across Node.js, web bundles, and browser contexts. The system automatically detects the runtime environment and chooses the appropriate loading strategy.

#### Environment Detection & Loading Strategies

**Node.js Environment (`nodejs`)**

- **Local files**: `REQUIRE "./extras/addresses/sqlite3/sqlite-address.js"` 
- **Node modules**: `REQUIRE "lodash"` (npm packages from node_modules)
- **Remote registries**: `REQUIRE "registry:org.rexxjs/excel-functions"`
- **Dependency resolution**: Full npm-style dependency graph with circular dependency detection
- **Security**: Permission-based loading with configurable restrictions

NodeJS modes are via `bin/rexx`, `core/rexx`, direct to `core/src/cli.js`, and via Jest tests in `core/*` under npm-test execution. Web-specific aspects will have to be mocked for tests to pass, and are unavailable to genuine users on the command line. 

TODO: transitive dep handling.

**Web Standalone (`web-standalone`)**

- **Bundled modules**: `REQUIRE "registry:org.rexxjs/jq-address.bundle"` (webpack-compiled, self-contained)
- **Remote loading**: Fetches unbundled modules from unpkg.com or custom registries
- **Browser-optimized**: Modules adapted for browser environment (no Node.js APIs)
- **Dynamic imports**: Uses browser's native import() for ES modules

Web modes are via the `rexxjs.bundle.js` (main live usage), via http://localhost:port/core/src/interpreter-web-loader.js, and in a more limited way file://path/to/core/src/interpreter-web-loader.js.  Note same-origin policy for those last two.

**Web Control Bus (`web-controlbus`)**
- 
- **Cross-iframe communication**: Modules loaded in parent frame, functions available via postMessage RPC
- **Distributed execution**: Functions execute in director frame, results passed back to worker
- **Security isolation**: Each iframe has separate module scope and permissions
- **Streaming support**: Real-time progress updates via `CHECKPOINT()` mechanism

Web control-bus modes are via the `rexxjs.bundle.js` (main live usage), via http://localhost:port/core/src/interpreter-web-loader.js.

#### Module Resolution Patterns

**Preference Lists** - Automatic fallback through multiple sources:

```rexx
REQUIRE "registry:org.rexxjs/excel-functions.bundle, registry:org.rexxjs/excel-functions, ./local/excel.js"
```
- 
- Tries bundled version first (fastest)
- Falls back to unbundled registry version  
- Finally attempts local file

**Registry Prefixes** - Explicit source specification:

```rexx
REQUIRE "registry:org.rexxjs/sqlite-address"     // GitHub Pages registry
REQUIRE "cwd:local/custom-functions.js"         // Current working directory
REQUIRE "npm:lodash"                             // Node.js modules (Node.js only)
REQUIRE "root:extras/addresses/docker.js"       // Project root directory
```

**Path Resolution Strategies** (Environment-Dependent):

**Node.js Environments** (`nodejs`):
- **`cwd:`** - Resolves relative to current working directory (where command was executed)
  ```rexx
  // If executed from /home/user/project/scripts/
  REQUIRE "cwd:../lib/utils.js"    // → /home/user/project/lib/utils.js
  REQUIRE "cwd:helpers.js"         // → /home/user/project/scripts/helpers.js
  ```
- **`root:`** - Resolves relative to project root (where package.json or .git exists)
  ```rexx
  REQUIRE "root:extras/addresses/sqlite.js"    // Always from project root
  ```
- **`./` or `../`** - Resolves relative to current script file location
  ```rexx
  REQUIRE "./local-helper.js"      // Same directory as current script
  ```
- **`/` or `C:\`** - Absolute filesystem paths
  ```rexx
  REQUIRE "/usr/local/lib/custom.js"           // Unix absolute
  REQUIRE "C:\\Program Files\\MyLib\\lib.js"   // Windows absolute
  ```

**Web Environments** (`web-standalone`, `web-controlbus`):
- **`cwd:` and `root:` are NOT supported** - These require Node.js filesystem access
- **Registry and bundled modules only**:
  ```rexx
  REQUIRE "registry:org.rexxjs/excel-functions.bundle"    // Pre-bundled for web
  REQUIRE "registry:org.rexxjs/lodash-adapter"           // RexxJS wrapper for lodash
  REQUIRE "https://raw.githubusercontent.com/RexxJS/dist/latest/addresses/echo-address.bundle.js"  // Direct bundle URLs
  ```
- **JavaScript libraries need adapters** - Raw JS libraries like lodash require RexxJS wrapper modules that export functions with RexxJS calling conventions

**Cross-Environment Adapter Example** (hypothetical `lodash-adapter`):
```rexx
// Same REQUIRE works in both environments
REQUIRE "registry:org.rexxjs/lodash-adapter" AS _(.*)
LET doubled = _MAP([1,2,3], "x * 2")        // → [2,4,6]
LET filtered = _FILTER(users, "age > 18")   // → adult users only
```

**Behind the scenes**:
- **Node.js**: Adapter uses `require('lodash')` from node_modules and wraps functions
- **Web**: Adapter includes bundled lodash code or loads from unpkg.com, same RexxJS interface
- **Function translation**: Converts RexxJS expression strings (`"x * 2"`) to JavaScript functions (`x => x * 2`)
- **Parameter adaptation**: Handles RexxJS named parameters and type conversion

**GitHub Module Example** (real):
```rexx
// Load echo ADDRESS handler from GitHub repository
REQUIRE "github.com/RexxJS/dist@latest"

// Now use the echo ADDRESS target
ADDRESS echo
"Testing echo functionality"
LET result = getLastEcho()
SAY "Echo result: " || result
```

**GitHub Module with AS Clause** (ADDRESS renaming):
```rexx
// Load same echo handler but rename the ADDRESS target
REQUIRE "github.com/RexxJS/dist@latest" AS REPEAT_BACK_TO_ME

// Now use the renamed ADDRESS target
ADDRESS REPEAT_BACK_TO_ME
"Hello from my custom ADDRESS name"
LET response = getLastEcho()
SAY "Custom ADDRESS response: " || response
```

**Note**: Direct HTTPS URLs (like `https://raw.githubusercontent.com/...`) are currently blocked by RexxJS security validation. Use the GitHub module format (`github.com/username/repo@version`) instead.

- **Relative paths limited** - Only work in specific web loader contexts

**Ambiguous Path Prevention**: RexxJS rejects ambiguous paths and suggests explicit prefixes to prevent confusion about resolution context. Web environments enforce stricter limitations due to browser security restrictions.

**AS Clause** - Namespace management and prefix transformation:

```rexx
REQUIRE "./extras/addresses/docker-address.js" AS docker_(.*)
REQUIRE "registry:org.rexxjs/r-stats" AS stats_(.*)
REQUIRE "cwd:bathhouse-library.js" AS bath_(.*)
```

The AS clause transforms function and operation names from loaded modules by applying prefixes to prevent naming conflicts and provide logical namespacing:

**Regex Pattern Transformation** (`prefix_(.*)`)
- **Pattern**: `bath_(.*)` captures the original function name and prefixes it
- **Example**: `SERVE_GUEST` becomes `bath_SERVE_GUEST`, `GET_LOG` becomes `bath_GET_LOG`
- **Usage**: Both operations and functions get the prefix
  ```rexx
  bath_CLEAN_BATHHOUSE area="lobby" intensity="deep"     // Operation
  LET capacity = bath_BATHHOUSE_CAPACITY()               // Function
  ```

**Simple Prefix** (no regex)
- **Pattern**: `docker` (automatically adds underscore → `docker_`)
- **Example**: `CREATE_CONTAINER` becomes `docker_CREATE_CONTAINER`
- **ADDRESS Targets**: Use exact name replacement (no regex patterns allowed)
  ```rexx
  REQUIRE "cwd:qemu-address.js" AS QEMU                  // ADDRESS QEMU
  ```

**Multiple Namespaces** - Same library with different prefixes:
```rexx
REQUIRE "cwd:bathhouse-library.js" AS yubabaHouse_(.*)
REQUIRE "cwd:bathhouse-library.js" AS zenibaHouse_(.*)

yubabaHouse_SERVE_GUEST guest="chihiro"
zenibaHouse_SERVE_GUEST guest="haku"
LET log1 = yubabaHouse_GET_LOG()      // Independent state
LET log2 = zenibaHouse_GET_LOG()      // Independent state
```

**Namespace Isolation Benefits**:
- **Conflict prevention**: Multiple libraries can have same function names
- **Version management**: Load different versions with different prefixes  
- **Logical grouping**: Group related functionality under meaningful prefixes
- **Independent state**: Each prefixed instance maintains separate internal state

#### Bundling & Distribution Architecture

**Bundled Modules** (`.bundle` suffix)
- **Webpack-compiled**: All dependencies included, no runtime resolution needed
- **Browser-ready**: Compatible with web-standalone and web-controlbus
- **Size optimized**: Tree-shaken and minified for production use
- **GitHub Pages registry**: Published as static files for CDN-like performance

**Unbundled Modules** (standard name)
- **Source distribution**: Raw JavaScript with runtime dependency loading
- **Development-friendly**: Easier debugging and modification
- **Dynamic dependencies**: npm packages fetched from unpkg.com as needed
- **Local development**: Available from `extras/` directory structure

#### Advanced Features

**Dependency Management**
- **Circular detection**: Prevents infinite loading loops
- **Version resolution**: Handles multiple versions of same library
- **Load-time permissions**: Security policies applied during module loading
- **Dependency graphs**: Tracks relationships for debugging and optimization

**Remote Orchestration** (SCRO - Streaming CheckpOint Remote Orchestration)
- **CHECKPOINT-based loading**: Modules requested from director via streaming protocol
- **Distributed libraries**: Functions execute remotely, results streamed back
- **Security boundaries**: Director controls what modules workers can access
- **Real-time updates**: Progress and intermediate results via `CHECKPOINT()`

**Environmental Adaptation**
```rexx
// Same REQUIRE statement works across all environments
REQUIRE "registry:org.rexxjs/excel-functions"

// Node.js: Downloads and caches from registry
// Web bundle: Uses pre-bundled version from dist/
// Web control bus: Requests from director frame
// All provide identical VLOOKUP(), SUMIF(), etc. functions
```

**Key Design Principles:**
- **No fallbacks**: Users explicitly choose bundled vs unbundled via REQUIRE statement
- **Environment-agnostic**: Same module code works in Node.js and browsers
- **Universal dependency source**: npm dependencies always fetched from unpkg.com for consistency
- **Explicit control**: Registry prefixes and preference lists give users full control over loading strategy
- **Security-first**: Permission system prevents unauthorized module access
- **Performance-optimized**: Bundled versions for production, unbundled for development

## Use Cases

1. **Scientific Computing**: R/SciPy-compatible functions for data analysis
2. **Web Automation**: Cross-iframe scripting and browser control
3. **Database Operations**: SQL integration with full CRUD capabilities (SQLite3)
4. **HTTP API Integration**: RESTful service communication with `HTTP_GET`, `HTTP_POST`, `HTTP_PUT`, `HTTP_DELETE` functions
5. **System Administration**: OS command execution, file operations, and process management (PS, PGREP, KILLALL, TOP, NICE) for monitoring and controlling system processes
6. **Testing**: Comprehensive mock frameworks for ADDRESS-based applications
7. **Infrastructure Automation**: VM/container provisioning with QEMU, VirtualBox, Docker, Podman
   - CI/CD test environments with automatic VM creation and teardown
   - Multi-platform testing across different OS versions
   - Development environment provisioning and configuration
   - Container-based microservice orchestration
8. **Cloud Orchestration**: Google Cloud Platform service automation and data workflows
   - Google Sheets as database with SQL-like operations
   - Cross-service data pipelines (Sheets → BigQuery → Firestore → Pub/Sub)
   - Serverless function deployment and management
   - Real-time analytics and machine learning pipelines
   - Business intelligence dashboard automation

## Development Guidelines

### For LLM Assistants (`CLAUDE.md`)
- **Testing Requirements**: All work must have `npm test` passing at 100% before completion
- **Web/DOM Work**: Must also have `npm run test:web` passing for browser-related features
- **Test Execution**: Use `@scratch_test.sh` instructions for all test invocations
- **CI Pipeline Tests**: The `./ci.sh` script runs Jest, Rexxt, and Playwright tests. All must pass before deployment.
- **Playwright Tests**: Prefix with `PLAYWRIGHT_HTML_OPEN=never` to prevent browser windows opening
- **Web Server**: Playwright tests automatically start an HTTP server on port 8000 (via `npx http-server`)
- **No Fallback Logic**: Avoid implementing "fallback" patterns - ask for explicit guidance instead

## Common Test Pitfalls & Patterns

Understanding common patterns in RexxJS tests helps avoid integration issues and ensures consistent cross-platform compatibility. The ADDRESS handler infrastructure and module loading system have specific requirements that must be properly configured.

### ADDRESS Handler Module Export Pattern

ADDRESS handlers must export their functionality to both global scope (for browser/eval contexts) and CommonJS (for Node.js module loading). Tests rely on discovering these exports to validate handler metadata and functionality.

**Correct Pattern** (works in all environments):

```javascript
/*! rexxjs/sqlite-address v1.0.0 | (c) 2025 RexxJS Project | MIT License
 * @rexxjs-meta=SQLITE_ADDRESS_META
 */

// Core metadata function - MUST use {NAME}_ADDRESS_META naming pattern
function SQLITE_ADDRESS_META() {
    return {
        canonical: "org.rexxjs/sqlite-address",
        type: 'address-handler',  // NOT 'address-target'
        name: 'SQLite Service',
        provides: {
            addressTarget: 'sqlite',
            handlerFunction: 'ADDRESS_SQLITE_HANDLER',
            commandSupport: true,
            methodSupport: true
        },
        dependencies: { "sqlite3": "^5.0.0" }
    };
}

// Handler function - receives (method, params) and returns promise
async function ADDRESS_SQLITE_HANDLER(method, params) {
    try {
        // Implementation
        return { success: true, result: data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Methods documentation
const ADDRESS_SQLITE_METHODS = {
    query: { description: "Execute SQL query", params: ["sql"] }
};

// Export to global scope (for browser/eval contexts)
if (typeof window !== 'undefined') {
    window.SQLITE_ADDRESS_META = SQLITE_ADDRESS_META;
    window.ADDRESS_SQLITE_HANDLER = ADDRESS_SQLITE_HANDLER;
    window.ADDRESS_SQLITE_METHODS = ADDRESS_SQLITE_METHODS;
} else if (typeof global !== 'undefined') {
    global.SQLITE_ADDRESS_META = SQLITE_ADDRESS_META;
    global.ADDRESS_SQLITE_HANDLER = ADDRESS_SQLITE_HANDLER;
    global.ADDRESS_SQLITE_METHODS = ADDRESS_SQLITE_METHODS;
}

// CRITICAL: Export via CommonJS for Node.js REQUIRE
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SQLITE_ADDRESS_META,
        ADDRESS_SQLITE_HANDLER,
        ADDRESS_SQLITE_METHODS
    };
}
```

**Key Requirements:**
1. **Naming Convention**: Always use `{UPPERCASE_NAME}_ADDRESS_META` (no "MAIN" suffix)
2. **Metadata Type**: Must return `type: 'address-handler'` (not `'address-target'`)
3. **Handler Function**: Returns object with `{ success: boolean, result?, error? }`
4. **Both Exports**: Global scope AND CommonJS exports for dual environment support
5. **Comment Marker**: Include `@rexxjs-meta={NAME}_ADDRESS_META` in file header for bundling

**Common Mistakes:**
- ❌ Using `*_ADDRESS_MAIN` naming (legacy, breaks modern tests)
- ❌ Having BOTH `*_ADDRESS_META` and `*_ADDRESS_MAIN` (choose one pattern)
- ❌ Returning `type: 'address-target'` instead of `'address-handler'`
- ❌ Missing CommonJS `module.exports` (breaks Node.js require)
- ❌ Async handler that doesn't return promise (breaks await chains)

### Jest Mock Completeness

Jest mocks must include all functions and properties that the code will actually use. Incomplete mocks cause "Received undefined" or "is not a function" errors at runtime.

**Incomplete Mock** (FAILS):
```javascript
// This fails because promisify(exec) tries to use exec before mock is applied
jest.mock('child_process', () => ({
    spawn: jest.fn()  // Missing: exec
}));

// Later in code:
const { exec } = require('child_process');
const execAsync = promisify(exec);  // TypeError: exec is undefined
```

**Complete Mock** (PASSES):
```javascript
jest.mock('child_process', () => ({
    spawn: jest.fn(),
    exec: jest.fn((command, callback) => {
        // Simulate async behavior
        process.nextTick(() => callback(null, 'output', ''));
    })
}));
```

**Pattern for Promisified Functions:**
```javascript
jest.mock('child_process', () => ({
    exec: jest.fn((command, callback) => {
        // Callback signature: (error, stdout, stderr)
        process.nextTick(() => callback(null, 'command output', ''));
    })
}));

// This now works:
const { exec } = require('child_process');
const execAsync = promisify(exec);  // ✅ exec is defined
```

**Common Mistakes:**
- ❌ Mocking only subset of imported functions
- ❌ Using `mockReturnValue` instead of `mockImplementation` for async operations
- ❌ Forgetting callback signature requirements (error-first for Node.js conventions)
- ❌ Not applying mock before module import (mock must be before require)

### REQUIRE Path Resolution

REXX's REQUIRE system works differently in test contexts vs runtime. Tests must use absolute paths with `path.resolve(__dirname, ...)` to ensure files can be found regardless of where tests execute from.

**Inline REXX Script Path Error** (FAILS in tests):
```javascript
test('should load sqlite', async () => {
    const { Interpreter, parse } = require('../../../../core/src/interpreter');
    const interpreter = new Interpreter();

    // This fails: relative path is resolved from interpreter's context, not test file
    await interpreter.run(parse('REQUIRE "./sqlite-address.js"'));
    // Error: Cannot find module "./sqlite-address.js"
});
```

**Absolute Path via Node.js** (PASSES in all contexts):
```javascript
test('should load sqlite', async () => {
    const fs = require('fs');
    const path = require('path');
    const { Interpreter, parse } = require('../../../../core/src/interpreter');
    const interpreter = new Interpreter();

    // Load module source directly
    const source = fs.readFileSync(
        path.resolve(__dirname, 'src/sqlite-address.js'),
        'utf8'
    );

    // Eval in global scope to set up globals
    eval(source);

    // Now globals are available to interpreter
    expect(global.SQLITE_ADDRESS_META).toBeDefined();
});
```

**Alternative: Mock REQUIRE** (For cleaner tests):
```javascript
test('should load sqlite', async () => {
    const sqlite = require('./src/sqlite-address.js');  // Node.js require

    // Mock the REQUIRE statement
    global.SQLITE_ADDRESS_META = sqlite.SQLITE_ADDRESS_META;
    global.ADDRESS_SQLITE_HANDLER = sqlite.ADDRESS_SQLITE_HANDLER;
    global.ADDRESS_SQLITE_METHODS = sqlite.ADDRESS_SQLITE_METHODS;

    // Now verify it works
    expect(global.SQLITE_ADDRESS_META).toBeDefined();
    const metadata = global.SQLITE_ADDRESS_META();
    expect(metadata.provides.addressTarget).toBe('sqlite');
});
```

**Key Strategies:**
1. **Absolute paths in tests**: Always use `path.resolve(__dirname, 'file.js')`
2. **Load module first**: Use Node.js `require()` to get the actual module
3. **Set globals manually**: Assign exports to `global` or `window` for interpreter access
4. **Test module metadata**: Verify that `*_ADDRESS_META()` returns correct structure
5. **Cleanup after tests**: Use `afterEach()` to clear globals between tests

**Common Mistakes:**
- ❌ Using relative paths like `"./address.js"` in inline REXX scripts
- ❌ Expecting interpreter's REQUIRE to work without globals set up
- ❌ Not using `path.resolve(__dirname, ...)` for cross-platform compatibility
- ❌ Forgetting to validate metadata structure (just checking existence is insufficient)
- ❌ Not cleaning up globals between tests (causes flaky tests)

## Implementation Summary

**✅ Core Implementation (`core/src/` - 65 modules)**
All major language features, function domains, and infrastructure components are implemented in source files for transparency and debugging. The comprehensive module breakdown above details every significant component.

**✅ Extended Ecosystems**
- **13 Function Libraries** in `extras/functions/` spanning R, SciPy, Excel, NumPy, SymPy, GraphViz, data processing, and more
- **26 ADDRESS Handlers** in `extras/addresses/` covering cloud platforms (GCP, AWS, Azure), containers (Docker, Podman), VMs (QEMU, VirtualBox, Proxmox), databases (SQLite, DuckDB), AI/ML (Claude, GPT, Gemini), and system integration

**✅ Rapid Feature Overview**
The LLM can quickly reference specific implementations by checking this document:
- Core functions by category (String, Math, Date, File, HTTP, Security, etc.)
- ADDRESS handlers by use case (Cloud, Containers, VMs, Databases, AI)
- Infrastructure capabilities (VM lifecycle, container orchestration, cross-service data pipelines)

This repository provides a complete REXX environment with modern extensions, making it suitable for everything from simple scripting to complex distributed applications running in browsers or Node.js.
