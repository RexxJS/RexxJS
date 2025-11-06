# rexxt - RexxJS Test Runner

## Overview

`rexxt` is RexxJS's native test runner for executing REXX test scripts. It provides pattern matching, tag filtering, test result summaries, and an interactive TUI (Text User Interface) for navigating test results.

**Location**: `./rexxt` (created by `make-binary.sh`)
**Implementation**: `core/src/test-runner-cli.js`
**Test Framework**: `core/src/test-interpreter.js` (TestRexxInterpreter)

## Basic Usage

```bash
# Run all .rexx files in current directory
./rexxt

# Run specific test file
./rexxt tests/math-tests.rexx

# Run multiple test files
./rexxt tests/dogfood/*

# Run with glob pattern
./rexxt "tests/*-test.rexx"
```

## Command-Line Options

### Test Selection

```bash
# Run files matching pattern
./rexxt --pattern "tests/*-specs.rexx"

# Filter by tags
./rexxt --tags math,basic

# Multiple patterns
./rexxt --pattern "tests/*.rexx" --pattern "extras/*.rexx"
```

### Output Control

```bash
# Verbose output (show debug info)
./rexxt --verbose tests/math-tests.rexx
./rexxt -v tests/math-tests.rexx

# Show all SAY output from test scripts
./rexxt --verbose-output tests/math-tests.rexx

# Show SAY output in real-time (no debug info)
./rexxt --live-output tests/debug.rexx

# Show details for passing expectations (normally hidden)
./rexxt --show-passing-expectations tests/math-tests.rexx
```

### Debugging Failed Tests

```bash
# Automatically rerun failed tests with verbose output
./rexxt --rerun-failures-with-verbose tests/*.rexx
```

### TUI Navigation

```bash
# Launch TUI navigator only (browse previous results)
./rexxt --navigate

# Run tests then launch navigator
./rexxt --run-and-navigate tests/*.rexx
```

### Configuration

```bash
# Set test timeout (default: 30000ms = 30 seconds)
./rexxt --timeout 60000 tests/slow-test.rexx

# Show help
./rexxt --help
./rexxt -h
```

## Test File Structure

### Basic Test File

A test file is any `.rexx` file with test subroutines:

```rexx
/* @test-tags math, basic */

-- Test subroutines must end with 'Test'
MathBasicsTest:
  ADDRESS EXPECTATIONS
  EXPECT actual=2+2 equals=4 message="Addition works"
  EXPECT actual=10-3 equals=7 message="Subtraction works"
  RETURN

StringTest:
  ADDRESS EXPECTATIONS
  LET result = UPPER("hello")
  EXPECT actual=result equals="HELLO" message="UPPER works"
  RETURN
```

### Test Tags

Add test tags in a comment at the top of the file:

```rexx
/* @test-tags math, integration, slow */

-- Tags allow filtering:
-- ./rexxt --tags math        (runs this file)
-- ./rexxt --tags integration  (runs this file)
-- ./rexxt --tags unit         (skips this file)
```

### Test Subroutines

Test subroutines are identified by ending with `Test`:

```rexx
-- These are recognized as tests:
BasicMathTest:
  -- test code
  RETURN

AdvancedCalculationTest:
  -- test code
  RETURN

EdgeCaseTest:
  -- test code
  RETURN

-- This is NOT a test (doesn't end with 'Test'):
HelperFunction:
  -- helper code
  RETURN
```

## Using ADDRESS EXPECTATIONS

The test framework uses `ADDRESS EXPECTATIONS` for assertions:

### Basic Expectations

```rexx
ADDRESS EXPECTATIONS

-- Equality
EXPECT actual=result equals=expected message="Values should match"

-- Inequality
EXPECT actual=result not_equals=wrong_value message="Values should differ"

-- Greater than
EXPECT actual=result greater_than=10 message="Should be > 10"

-- Less than
EXPECT actual=result less_than=100 message="Should be < 100"

-- Contains (substring or array element)
EXPECT actual="hello world" contains="world" message="Should contain 'world'"

-- Matches regex
EXPECT actual="test123" matches="test\d+" message="Should match pattern"

-- Type checking
EXPECT actual=result type="number" message="Should be a number"

-- Truthiness
EXPECT actual=result is_true=true message="Should be truthy"
EXPECT actual=result is_false=true message="Should be falsy"
```

### Expecting Errors

```rexx
ADDRESS EXPECTATIONS

-- Expect an error to be thrown
EXPECT_ERROR actual="1/0" message="Division by zero should error"

-- Expect specific error message
EXPECT_ERROR actual="INVALID_FUNCTION()" contains="not defined" message="Should error about undefined function"
```

### Complex Expectations

```rexx
ADDRESS EXPECTATIONS

-- Array length
LET arr = [1, 2, 3, 4, 5]
EXPECT actual=LENGTH(arr) equals=5 message="Array should have 5 elements"

-- Object properties
LET obj = {name: "Alice", age: 25}
EXPECT actual=obj.name equals="Alice" message="Name should be Alice"

-- Computed values
LET sum = REDUCE([1, 2, 3, 4], "acc + val", 0)
EXPECT actual=sum equals=10 message="Sum should be 10"
```

## Test Results

### Summary Output

```
🧪 RexxJS Native Test Runner

Running 25 test files...

✅ math-tests.rexx (5/5 tests passed, 12/12 expectations)
✅ string-tests.rexx (3/3 tests passed, 8/8 expectations)
❌ edge-cases.rexx (2/3 tests passed, 5/7 expectations)
   ❌ DivisionByZeroTest: expected error, but none thrown
   ❌ NegativeInputTest: expected 0, but encountered -1

========================
Summary:
  Files: 25
  Tests: 145 passed, 3 failed
  Expectations: 432 passed, 5 failed
========================
```

### Exit Codes

- **0**: All tests passed
- **1**: One or more tests failed

## Dogfood Tests

RexxJS uses itself to test itself - these are called "dogfood" tests.

### Location

```
core/tests/dogfood/
├── call-syntax-comprehensive.rexx
├── comparison-operators-comprehensive.rexx
├── string-functions-comprehensive.rexx
├── array-functions-comprehensive.rexx
└── ...
```

### Running Dogfood Tests

From the repository root:

```bash
# Run all dogfood tests
./rexxt tests/dogfood/*

# Run with verbose output
./rexxt --verbose-output tests/dogfood/*

# Run specific dogfood test
./rexxt tests/dogfood/string-functions-comprehensive.rexx
```

### Dogfood Test Patterns

Dogfood tests follow consistent patterns:

```rexx
/* @test-tags dogfood, core, string-functions */

-- Test 1: Basic functionality
StringUpperTest:
  ADDRESS EXPECTATIONS
  LET result = UPPER("hello")
  EXPECT actual=result equals="HELLO" message="UPPER should convert to uppercase"
  RETURN

-- Test 2: Edge cases
StringUpperEmptyTest:
  ADDRESS EXPECTATIONS
  LET result = UPPER("")
  EXPECT actual=result equals="" message="UPPER of empty string is empty"
  RETURN

-- Test 3: Special characters
StringUpperSpecialCharsTest:
  ADDRESS EXPECTATIONS
  LET result = UPPER("hello123!@#")
  EXPECT actual=result equals="HELLO123!@#" message="UPPER preserves non-alpha chars"
  RETURN
```

## Test Development Workflow

### 1. Create Test File

```bash
# Create new test file
cat > tests/my-feature-test.rexx <<'EOF'
/* @test-tags my-feature, unit */

FeatureBasicTest:
  ADDRESS EXPECTATIONS
  -- Add expectations here
  EXPECT actual=1 equals=1 message="Placeholder test"
  RETURN
EOF
```

### 2. Run Test

```bash
# Run new test
./rexxt tests/my-feature-test.rexx
```

### 3. Debug Failures

```bash
# Run with verbose output to see what's happening
./rexxt --verbose-output tests/my-feature-test.rexx

# Or use live output for real-time feedback
./rexxt --live-output tests/my-feature-test.rexx

# Or automatically rerun failures with verbose
./rexxt --rerun-failures-with-verbose tests/*.rexx
```

### 4. Add More Tests

```rexx
FeatureEdgeCaseTest:
  ADDRESS EXPECTATIONS
  -- Test edge cases
  EXPECT actual=something equals=expected message="Edge case handling"
  RETURN

FeatureErrorHandlingTest:
  ADDRESS EXPECTATIONS
  -- Test error conditions
  EXPECT_ERROR actual="bad_input()" message="Should error on bad input"
  RETURN
```

### 5. Iterate

```bash
# Run tests after each change
./rexxt tests/my-feature-test.rexx

# When ready, run full test suite
./rexxt tests/dogfood/*
```

## TUI Navigator

The TUI (Text User Interface) navigator allows interactive exploration of test results.

### Launching Navigator

```bash
# Browse previous test results
./rexxt --navigate

# Run tests then browse
./rexxt --run-and-navigate tests/*.rexx
```

### Navigator Features

- **Browse test files**: See which files passed/failed
- **View test details**: Expand files to see individual tests
- **Inspect failures**: See detailed failure messages and stack traces
- **Filter results**: Focus on failed tests or specific tags
- **Re-run tests**: Select and re-run specific tests from the UI

### Navigator Keys

```
↑/↓     - Navigate up/down
Enter   - Expand/collapse test file
Space   - Select test for re-run
r       - Re-run selected tests
f       - Filter to show only failures
q       - Quit navigator
```

## Integration with CI/CD

### GitHub Actions

```yaml
- name: Run RexxJS dogfood tests
  run: |
    ./rexxt tests/dogfood/*
    if [ $? -ne 0 ]; then
      echo "Tests failed!"
      exit 1
    fi
```

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "Running RexxJS tests..."
./rexxt tests/dogfood/*

if [ $? -ne 0 ]; then
  echo "Tests failed. Commit aborted."
  exit 1
fi
```

### Test Coverage Script

```bash
#!/bin/bash
# run-all-tests.sh

echo "Running unit tests..."
npm test

echo "Running dogfood tests..."
./rexxt tests/dogfood/*

echo "Running integration tests..."
./rexxt tests/integration/*

echo "All tests completed!"
```

## Advanced Usage

### Custom Test Patterns

```bash
# Run only comprehensives
./rexxt "tests/dogfood/*-comprehensive.rexx"

# Run only documentation tests
./rexxt "tests/dogfood/*-documentation.rexx"

# Run only demo tests
./rexxt "tests/dogfood/*-demo.rexx"
```

### Tag-Based Test Suites

```bash
# Fast tests (for development)
./rexxt --tags unit,fast

# Integration tests (for CI)
./rexxt --tags integration

# Slow tests (for nightly builds)
./rexxt --tags slow,integration

# Core functionality tests
./rexxt --tags core,dogfood
```

### Test Timeouts

```bash
# Short timeout for unit tests
./rexxt --timeout 5000 tests/unit/*.rexx

# Long timeout for integration tests
./rexxt --timeout 120000 tests/integration/*.rexx
```

### Combining Options

```bash
# Complex test run
./rexxt \
  --pattern "tests/dogfood/*.rexx" \
  --pattern "tests/integration/*.rexx" \
  --tags "core,integration" \
  --timeout 60000 \
  --rerun-failures-with-verbose \
  --run-and-navigate
```

## Test Writing Best Practices

### 1. One Concept Per Test

```rexx
-- GOOD: Focused test
StringUpperBasicTest:
  ADDRESS EXPECTATIONS
  EXPECT actual=UPPER("hello") equals="HELLO" message="UPPER converts to uppercase"
  RETURN

-- BAD: Testing multiple things
StringFunctionsTest:
  ADDRESS EXPECTATIONS
  EXPECT actual=UPPER("hello") equals="HELLO"
  EXPECT actual=LOWER("HELLO") equals="hello"
  EXPECT actual=TRIM(" hello ") equals="hello"
  -- Too much in one test!
  RETURN
```

### 2. Descriptive Test Names

```rexx
-- GOOD: Clear what's being tested
StringUpperWithSpecialCharsTest:
  RETURN

StringUpperEmptyStringTest:
  RETURN

-- BAD: Unclear names
Test1:
  RETURN

StringTest2:
  RETURN
```

### 3. Clear Expectation Messages

```rexx
-- GOOD: Descriptive messages
ADDRESS EXPECTATIONS
EXPECT actual=result equals=expected message="UPPER should convert 'hello' to 'HELLO'"

-- BAD: Generic messages
ADDRESS EXPECTATIONS
EXPECT actual=result equals=expected message="Test failed"
```

### 4. Test Edge Cases

```rexx
StringSubstrTest:
  ADDRESS EXPECTATIONS
  -- Normal case
  EXPECT actual=SUBSTR("hello", 1, 3) equals="hel" message="Basic SUBSTR works"
  RETURN

StringSubstrEdgeCasesTest:
  ADDRESS EXPECTATIONS
  -- Edge cases
  EXPECT actual=SUBSTR("", 1, 3) equals="" message="SUBSTR on empty string"
  EXPECT actual=SUBSTR("hi", 1, 100) equals="hi" message="SUBSTR length exceeds string"
  EXPECT actual=SUBSTR("hello", 10, 3) equals="" message="SUBSTR start beyond end"
  RETURN
```

### 5. Use Helper Functions

```rexx
-- Helper function (doesn't end with 'Test')
SetupTestData:
  PARSE ARG size
  LET data = []
  DO i = 1 TO size
    data[i-1] = i * 2
  END
  RETURN data

-- Test using helper
ArrayMapTest:
  CALL SetupTestData 5
  LET data = RESULT
  ADDRESS EXPECTATIONS
  EXPECT actual=LENGTH(data) equals=5 message="Test data has correct size"
  RETURN
```

## Troubleshooting

### Tests Not Running

```bash
# Check if test file has .rexx extension
ls tests/*.rexx

# Check if test subroutines end with 'Test'
grep "Test:" tests/my-test.rexx

# Run with verbose output
./rexxt --verbose-output tests/my-test.rexx
```

### Tests Timing Out

```bash
# Increase timeout
./rexxt --timeout 60000 tests/slow-test.rexx

# Check for infinite loops or blocking operations
./rexxt --verbose tests/slow-test.rexx
```

### Expectations Not Working

```rexx
-- Make sure ADDRESS EXPECTATIONS is set
BadTest:
  -- Missing ADDRESS EXPECTATIONS!
  EXPECT actual=1 equals=1 message="This won't work"
  RETURN

GoodTest:
  ADDRESS EXPECTATIONS  -- Required!
  EXPECT actual=1 equals=1 message="This works"
  RETURN
```

### TUI Not Launching

```bash
# Check if TERM is set
echo $TERM

# Try running tests without TUI first
./rexxt tests/*.rexx

# Then launch navigator separately
./rexxt --navigate
```

## Test File Examples

See these example test files:

- `tests/dogfood/string-functions-comprehensive.rexx` - Comprehensive string function tests
- `tests/dogfood/call-syntax-comprehensive.rexx` - CALL syntax tests
- `tests/dogfood/comparison-operators-comprehensive.rexx` - Operator tests
- `tests/dogfood/array-functions-comprehensive.rexx` - Array function tests

## Related Documentation

- [Test Framework ADDRESS](31-address-test-framework.md)
- [Expectations ADDRESS](30-address-expectations.md)
- [Language Basics](01-language-basics.md)
- [Error Handling](06-error-handling.md)

## Environment Variables

The test runner sets these environment variables:

```bash
REXXJS_TEST_RUNNER=true  # Indicates tests are running via rexxt
```

Test scripts can check this:

```rexx
IF ENV['REXXJS_TEST_RUNNER'] = 'true' THEN
  SAY "Running in test mode"
```

## Performance Tips

1. **Use tags for fast test subset**: `./rexxt --tags unit,fast`
2. **Run specific files during development**: `./rexxt tests/feature-im-working-on.rexx`
3. **Use `--live-output` for debugging**: Faster feedback than `--verbose-output`
4. **Parallelize in CI**: Split tests across multiple jobs

## Comparison with npm test

RexxJS has two test systems:

| Feature | `npm test` | `./rexxt` |
|---------|-----------|-----------|
| **Test Framework** | Jest | Native REXX |
| **Test Language** | JavaScript | REXX |
| **Use Case** | JavaScript unit tests | REXX dogfood tests |
| **Coverage** | JavaScript code | REXX interpreter |
| **Speed** | Fast (parallel) | Sequential |
| **TUI** | No | Yes |
| **Test Files** | `*.test.js`, `*.spec.js` | `*.rexx` |

Both are required for RexxJS development:
- `npm test` tests the JavaScript implementation
- `./rexxt tests/dogfood/*` tests the REXX language features

## Summary

`rexxt` is RexxJS's powerful native test runner that enables "dogfooding" - using RexxJS to test itself. Key features:

- ✅ Pattern matching and tag filtering
- ✅ Verbose and live output modes
- ✅ Interactive TUI for browsing results
- ✅ Automatic failure re-running with verbose output
- ✅ Integration with ADDRESS EXPECTATIONS framework
- ✅ Comprehensive test result summaries
- ✅ CI/CD friendly with exit codes

For more information, run `./rexxt --help` or browse the dogfood tests in `tests/dogfood/`.
