# Echo ADDRESS Library for RexxJS

A simple echo/testing ADDRESS handler that returns or processes text, useful for testing and debugging ADDRESS mechanisms in RexxJS.

## Installation

No external dependencies required. Works in all environments.

```bash
# No installation needed - just REQUIRE the handler
REQUIRE "./extras/addresses/echo/echo-address.js"
```

## Quick Start

### Echo Text

```rexx
REQUIRE "./extras/addresses/echo/echo-address.js"

ADDRESS ECHO
"Hello, World!"

SAY RESULT  -- Outputs: Hello, World!
```

### Echo with Processing

```rexx
ADDRESS ECHO
"message='Hello' operation=uppercase"

SAY RESULT  -- Outputs: HELLO
```

## Core Methods

### `message="<text>"`
Echo back the provided text.

**Returns:**
- `success` (boolean) - Always true
- `echo` (string) - The echoed text
- `timestamp` (string) - ISO timestamp

### Text Transformations

#### `operation=uppercase`
Convert text to uppercase.

```rexx
ADDRESS ECHO
"message='hello world' operation=uppercase"

SAY RESULT  -- Outputs: HELLO WORLD
```

#### `operation=lowercase`
Convert text to lowercase.

```rexx
ADDRESS ECHO
"message='HELLO WORLD' operation=lowercase"

SAY RESULT  -- Outputs: hello world
```

#### `operation=reverse`
Reverse the text.

```rexx
ADDRESS ECHO
"message='hello' operation=reverse"

SAY RESULT  -- Outputs: olleh
```

#### `operation=length`
Get text length.

```rexx
ADDRESS ECHO
"message='hello' operation=length"

SAY RESULT.length  -- Outputs: 5
```

#### `operation=count_words`
Count words.

```rexx
ADDRESS ECHO
"message='hello world from rexx' operation=count_words"

SAY RESULT.count  -- Outputs: 4
```

#### `operation=repeat`
Repeat text N times.

```rexx
ADDRESS ECHO
"message='x' operation=repeat times=5"

SAY RESULT  -- Outputs: xxxxx
```

## Usage Examples

### Testing ADDRESS Mechanism

```rexx
-- Verify ADDRESS works before using real handlers
ADDRESS ECHO
"test message"

IF RESULT = "test message" THEN
  SAY "✓ ADDRESS mechanism working"
ELSE
  SAY "✗ ADDRESS mechanism broken"
```

### Debug Helper

```rexx
REQUIRE "./extras/addresses/echo/echo-address.js"
REQUIRE "./extras/addresses/sqlite3/sqlite-address.js"

-- Use echo for debugging
ADDRESS ECHO
"Debug: About to query database"

ADDRESS SQLITE3
"SELECT * FROM users"

ADDRESS ECHO
"Debug: Query returned " || RESULT.rowCount || " rows"
```

### Testing Data Transformations

```rexx
-- Test string operations
ADDRESS ECHO
"message='user_input' operation=uppercase"
upper_version = RESULT

ADDRESS ECHO
"message='" || upper_version || "' operation=length"
text_length = RESULT.length

SAY "Original length: " || LENGTH(user_input)
SAY "Uppercase version: " || upper_version
SAY "Length of uppercase: " || text_length
```

### Response Logging

```rexx
-- Log all responses
ADDRESS ECHO
"message='Processing complete' operation=uppercase"

SAY "Timestamp: " || RESULT.timestamp
SAY "Message: " || RESULT.echo
```

## Return Values

All operations return an object with:

```javascript
{
  success: true,
  echo: "<the text>",
  timestamp: "2025-10-19T14:30:45.123Z",
  operation: "<operation-name>",
  // Operation-specific fields:
  // - length (for length operation)
  // - count (for count_words operation)
  // - etc.
}
```

## Integration with Testing

```rexx
REQUIRE "./src/expectations-address.js"
REQUIRE "./extras/addresses/echo/echo-address.js"

-- Test uppercase operation
ADDRESS ECHO
"message='test' operation=uppercase"

ADDRESS EXPECTATIONS
"{RESULT.echo} should equal 'TEST'"
"{RESULT.success} should equal true"
```

## Use Cases

✅ **Good for:**
- Testing ADDRESS implementation
- Debugging scripts before using real handlers
- Quick string operations
- Development and testing pipelines
- Educational purposes

❌ **Not ideal for:**
- Production text processing (use native functions)
- Large-scale transformations
- Performance-critical operations

## Performance

Echo operations are very fast since they're in-process and don't require external services. Useful for:
- Immediate testing feedback
- Non-blocking operations
- Development workflows

## Error Handling

```rexx
ADDRESS ECHO
LET result = message="test"

IF result.success THEN
  SAY "✓ Echo successful: " || result.echo
ELSE
  SAY "❌ Echo failed: " || result.error
```

## Environment Compatibility

- ✅ **Node.js**: Full support
- ✅ **Browser**: Full support
- ✅ **Testing**: Perfect for test environments
- ✅ **All platforms**: Cross-platform compatible

---

**Part of the RexxJS extras collection** - a lightweight testing and debugging ADDRESS handler for REXX programs.
