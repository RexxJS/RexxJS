# RexxJS Live Tests

Playwright-based browser tests for the RexxJS REPL at https://repl.rexxjs.org

## Installation

```bash
npm install
npx playwright install  # Download browser binaries
```

## Running Tests

### Basic test run
```bash
npm test
```

### Run specific test
```bash
npx playwright test "runs R histogram demo successfully"
```

### Run with visible browser (headed mode)
```bash
npx playwright test --headed
```

### Run with slow motion for debugging
```bash
# Slow down all actions by 1000ms (1 second)
SLOWMO=1000 npx playwright test --headed

# Slow down by 2 seconds for better visibility
SLOWMO=2000 npx playwright test --headed
```

### Run with debugging (pause at each step)
```bash
npx playwright test --debug
```

### Run specific R-graphics tests
```bash
# Run tests matching pattern
npx playwright test -g "graphics|histogram|R"

# Run slowly with visibility
SLOWMO=1500 npx playwright test --headed -g "histogram"
```

## Environment Variables

- `SLOWMO` - Milliseconds to slow down each action (e.g., `SLOWMO=1000`)
- `PLAYWRIGHT_HTML_OPEN=never` - Prevent HTML report from opening automatically (per CLAUDE.md)

## Test Structure

- `repl.spec.js` - Main test suite for REPL functionality including:
  - Basic navigation and loading
  - Command execution
  - Demo scripts (including R-graphics histogram demo)
  - UI controls and auto-render functionality