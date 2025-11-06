# RexxJS Demo Page Testing

Comprehensive Playwright test infrastructure for validating all RexxJS demo pages.

## Two Testing Approaches

### 1. Assertion-Based Tests (`repl-demo-pages.spec.js`)
**Fast validation of key functionality**

- **42 tests** covering all demo page types
- Tests verify:
  - Page loads without errors
  - REXX scripts execute successfully
  - Output is generated
  - No error styling present
- Results: **39 PASSED, 3 SKIPPED**
- Execution time: ~7.3 seconds

**Quick validation** - good for CI/CD pipelines and quick feedback.

### 2. Snapshot Tests (`repl-demo-pages-snapshot.spec.js`)
**Comprehensive regression detection** ⭐ Recommended for detailed validation

- **22 tests** with full output snapshots
- Each snapshot captures:
  - Complete REXX execution trace
  - All SAY output
  - All intermediate results
- Results: **22 PASSED**
- Execution time: ~4.5 seconds
- **Includes date/time page** with smart normalization using regex placeholders

**Better regression detection** - catches ANY output changes, not just major ones.

## Running Tests

### Run both test suites
```bash
cd core
PLAYWRIGHT_HTML_OPEN=never npx playwright test tests/web/repl-demo-pages* --project=chromium
```

### Run assertion tests only
```bash
PLAYWRIGHT_HTML_OPEN=never npx playwright test tests/web/repl-demo-pages.spec.js --project=chromium
```

### Run snapshot tests only
```bash
PLAYWRIGHT_HTML_OPEN=never npx playwright test tests/web/repl-demo-pages-snapshot.spec.js --project=chromium
```

### View test results
```bash
npx playwright show-report
```

### Update snapshots when intentional changes made
```bash
PLAYWRIGHT_HTML_OPEN=never npx playwright test tests/web/repl-demo-pages-snapshot.spec.js --update-snapshots
```

### Run headed (watch execution in browser)
```bash
PLAYWRIGHT_HTML_OPEN=never npx playwright test tests/web/repl-demo-pages-snapshot.spec.js --headed --project=chromium
```

## Snapshot Files Location & Purpose

Snapshot files are located in: `tests/web/repl-demo-pages-snapshot.spec.js-snapshots/`

### Why Snapshots Must Be Committed

Snapshot testing files **MUST be committed to git** - they are **not** temporary build artifacts. They work like this:

1. **First Test Run** - Creates snapshot files with `--update-snapshots`
2. **Subsequent Runs** - Compare actual output against committed snapshots
3. **On Change** - If output differs:
   - Test fails with a visible diff
   - Developer reviews the diff to understand what changed
   - If change is intentional: `--update-snapshots` to accept new output
   - If change is unintended: Fix the code
4. **Git Tracking** - Snapshot diffs appear in git, enabling code review of output changes

This is identical to how Jest snapshots, Vue snapshots, and other test frameworks work.

### Snapshot File Format

Each file contains:
- **Full REXX command trace** (lines prefixed with `>>`)
- **Actual output** from SAY statements
- **All intermediate results**
- **Date/time normalization** (YYYYMMDD → placeholder for deterministic tests)

Example content:
```
>> 3 SAY "=== REXX Arithmetic Operations Demo ==="
=== REXX Arithmetic Operations Demo ===
>> 4 SAY ""

>> 7 LET a = 10
>> 8 LET b = 3
>> 9 SAY "Basic Arithmetic:"
Basic Arithmetic:
>> 10 SAY "  a = " || a || ", b = " || b
  a = 10, b = 3
```

## Test Coverage

### Pages with Auto-Executing Scripts (✅ All Working - 23 Total)

**Core Language Features (14):**
1. Variables and Assignment
2. Arithmetic Operations
3. Number Formatting
4. Type Checking
5. String Functions
6. String Comparison
7. String Parsing
8. Regular Expressions
9. Advanced String Manipulation
10. Conditionals and Loops
11. Logical Operators
12. Error Handling
13. Procedures and Functions
14. Arrays and Lists

**Advanced Features (5):**
15. Date and Time Functions (with regex normalization)
16. Pipe Operator (|>)
17. Functional Programming (MAP, FILTER, REDUCE)
18. DO OVER Loops
19. SELECT/WHEN/OTHERWISE Statements

**New Demonstrations (2):**
20. Nested Loops
21. Comparison Operators
22. String Escape Sequences (\n, \t, etc.)

**Remote Module Loading (2):**
23. repeat_back_to_me.html - Loads echo ADDRESS from GitHub HTTPS
24. repeat_back_to_me_local.html - Development version (requires local fix)

### Special Cases
- **canned-scripts.html** - Interactive button-driven interface (skipped)
- **repeat_back_to_me_local.html** - HTTP localhost loading (skipped, awaiting script tag path fix)

## CI/CD Integration

All tests pass with `PLAYWRIGHT_HTML_OPEN=never`:
- ✅ No browser windows opened
- ✅ No HTML report window opened
- ✅ Silent execution suitable for automation
- ✅ Machine-parseable output

## Benefits

### Snapshot Testing Advantages
- **Single assertion per page** - No brittle multi-assertion chains
- **Complete regression detection** - Catches all output changes
- **Easy to review** - Just diff the snapshots
- **Git-trackable** - All expected outputs in version control
- **Maintainable** - Update snapshots intentionally with --update-snapshots flag

### When Tests Fail

1. **Assertion test failure**: Specific functionality broke
2. **Snapshot test failure**: Any output changed (major or minor)

Review failed snapshot diffs in:
- Terminal output
- Or: `npx playwright show-report` → click failed test → view attachments

## Snapshot Files

**Important:** Snapshot files in `tests/web/repl-demo-pages-snapshot.spec.js-snapshots/` **MUST be committed to git**. They are:
- The baseline expectations for regression testing
- Version-controlled test fixtures (like any other test data)
- Used by CI/CD to verify test expectations haven't changed
- Reviewable as diffs to show what output changed

When output changes intentionally, update snapshots with:
```bash
PLAYWRIGHT_HTML_OPEN=never npx playwright test tests/web/repl-demo-pages-snapshot.spec.js --update-snapshots
```

## Key Infrastructure

### Files
- `src/output/document-write-styled-output-handler.js` - Styled output display with color-coded traces (>> prefix = blue, results = green, errors = red)
- `src/repl/demo-executor.js` - Shared execution logic for all 23 demo pages
- `tests/web/repl-demo-pages.spec.js` - Assertion-based tests (39 passing, 3 skipped)
- `tests/web/repl-demo-pages-snapshot.spec.js` - Snapshot tests (22 passing)
- `tests/web/repl-demo-pages-snapshot.spec.js-snapshots/` - 22 snapshot files (committed to git)

### All Demo Pages Updated
All 23 HTML demo pages use shared executor pattern with proper error handling and auto-execution.

## Recent Enhancements

### HTTPS Remote Module Loading
- Fixed `loadHttpsLibraryViaFetch()` to extract `@rexxjs-meta` function names from fetched code
- Registers detection functions for proper library discovery
- Enables loading ADDRESS handlers from GitHub or other HTTPS sources

### HTTP/Localhost Support
- Added `http://` support to library type detection
- Allows development server loading (port 8000)
- Enables localhost URLs in security checks

### Output Formatting
- Color-coded traces distinguish REXX commands from results
- REXX trace lines (>>) display in dark blue
- SAY output displays in green
- Errors display in red
- Regex-based date/time normalization for deterministic snapshots

## Next Steps

- [ ] Fix HTTP localhost script tag loading path (currently prepends `/libs/`)
- [ ] Add tests for interactive pages (canned-scripts.html)
- [ ] Integrate snapshot testing into CI/CD pipeline
- [ ] Add performance benchmarking
- [ ] Document ADDRESS handler creation patterns
