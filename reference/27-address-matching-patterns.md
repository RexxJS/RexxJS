# ADDRESS MATCHING Patterns

Comprehensive reference for ADDRESS MATCHING pattern syntax and usage in RexxJS.

## Overview

ADDRESS MATCHING extends the [Application Addressing](16-application-addressing.md) system with **regex-based line matching** that takes precedence over normal REXX parsing. This enables natural domain-specific languages, structured test frameworks, and configuration DSLs within ADDRESS contexts.

## ADDRESS Routing Methods

All ADDRESS contexts support multiple ways to send commands to target handlers:

### ADDRESS MATCHING MULTILINE (New)
**Syntax:** `ADDRESS target MATCHING MULTILINE "pattern"`  
**Processing:** Collects matching lines and sends as single multiline string  
**Use Case:** SQL statements, Python code, shell scripts spanning multiple lines

## ADDRESS Routing Methods (Complete List)

All ADDRESS contexts support multiple ways to send commands to target handlers:

| Method | Syntax | Processing | Use Case |
|--------|--------|------------|----------|
| **MATCHING MULTILINE** | `ADDRESS target MATCHING MULTILINE("regex")` | Collect matching lines → Single handler call | Multi-line SQL, Python, scripts |
| **MATCHING Pattern** | `ADDRESS target MATCHING("regex")` | Regex test → Handler | DSLs, Test frameworks |
| **LINES Capture** | `ADDRESS target LINES(n)` | Capture n lines → Handler | Block commands, Scripts |
| **Inline String** | `ADDRESS target "command"`<br>`ADDRESS target 'command'`<br>`ADDRESS target \`command\`` | Direct → Handler | Single commands |
| **Multiline String** | `ADDRESS target`<br>`"command"` (or `'command'`, `` `command` ``) | Direct → Handler | Formatted commands |
| **HEREDOC Block** | `ADDRESS target <<EOF`<br>`content`<br>`EOF` | Direct → Handler | Multi-line content |
| **Function Calls** | `ADDRESS target`<br>`functionCall()` | REXX Parse → Handler | API calls |

### Processing Order (Precedence)

1. **MATCHING MULTILINE patterns** (when active) - Collect matching lines until non-match
2. **MATCHING patterns** (when active) - Override all other parsing  
3. **LINES capture** (when active) - Capture specified number of lines
4. **Quoted strings** - Immediate execution, bypass REXX parsing  
5. **HEREDOC blocks** - Multi-line immediate execution
6. **Function calls** - Normal REXX parsing, routed if function call
7. **Other statements** - Normal REXX processing (not sent to target)

## Quick Reference

```rexx
-- Basic syntax
ADDRESS targetName MATCHING MULTILINE("regex_pattern")  -- NEW: Collect multiline blocks
ADDRESS targetName MATCHING("regex_pattern")
ADDRESS targetName LINES(number)

-- Multiline patterns (NEW)
ADDRESS sqlite3 MATCHING MULTILINE("^  (.*)")           -- SQL statements
ADDRESS python MATCHING MULTILINE("^    (.*)")          -- Python code  
ADDRESS system MATCHING MULTILINE("^  (.*)")            -- Shell scripts

-- Single-line patterns
ADDRESS EXPECTATIONS MATCHING("^[ \\t]*\\. (.*)$")        -- Test assertions
ADDRESS logger MATCHING("^[ \\t]*# (.*)$")              -- Comments
ADDRESS validator MATCHING("^[ \\t]*CHECK: (.*)$")      -- Validation
ADDRESS processor MATCHING("^[ \\t]*> (.*)$")           -- Commands

-- Lines capture examples  
ADDRESS script LINES(3)                                 -- Capture next 3 lines
ADDRESS config LINES(5)                                 -- Capture next 5 lines
ADDRESS batch LINES(10)                                 -- Capture next 10 lines
```

## Detailed ADDRESS Routing Examples

### 1. MATCHING Pattern (Highest Precedence)
```rexx
ADDRESS EXPECTATIONS MATCHING("^[ \\t]*\\. (.*)$")
. {result} should equal 42        -- Sent to EXPECTATIONS handler
LET normal = "assignment"         -- Normal REXX (not sent to handler)
. {status} should be "success"    -- Sent to EXPECTATIONS handler
```
**When**: Active MATCHING pattern exists  
**Processing**: Line tested against regex first, sent to handler if matches  
**Handler receives**: Content from first capture group (or full match)

### 2. LINES Capture (Block Processing)
```rexx
ADDRESS script LINES(3)
LET name = "Alice"               -- Captured (line 1)
SAY "Hello {name}"               -- Captured (line 2) 
LET count = LENGTH string=name   -- Captured (line 3)
SAY "Continuing normally"        -- Normal REXX execution resumes
```
**When**: `LINES(n)` specified with positive number  
**Processing**: Next n raw source lines captured directly, bypassing REXX parsing  
**Handler receives**: Combined multi-line string of raw source lines

#### LINES Capture Examples

**Basic Variable Assignments:**
```rexx
LET data = "test"
ADDRESS config LINES(2)
LET server_host = "{data}.example.com"
LET server_port = 8080
SAY "Configuration sent to handler"
```
Handler receives: `"LET server_host = \"{data}.example.com\"\nLET server_port = 8080"`

**Mixed Command Types:**
```rexx
ADDRESS batch LINES(4)
LET user = "alice"
SAY "Processing user: {user}"
LET result = UPPER string=user
LET status = "processed"
-- Normal execution continues here
```
Handler receives raw source lines: `"LET user = \"alice\"\nSAY \"Processing user: {user}\"\nLET result = UPPER string=user\nLET status = \"processed\""`

**Script Generation:**
```rexx
LET template = "deployment"
ADDRESS generator LINES(5) 
LET script_name = "{template}_deploy.sh"
SAY "#!/bin/bash"
SAY "echo 'Starting {template}'"
SAY "docker run myapp:{template}"
SAY "echo 'Deployment complete'"
```
Handler receives: `"LET script_name = \"{template}_deploy.sh\"\nSAY \"#!/bin/bash\"\nSAY \"echo 'Starting {template}'\"\nSAY \"docker run myapp:{template}\"\nSAY \"echo 'Deployment complete'\""`

#### LINES vs MATCHING Precedence
```rexx
-- MATCHING takes precedence over LINES
ADDRESS test MATCHING("^TEST: (.*)$")
ADDRESS test LINES(2)           -- LINES setting ignored, MATCHING still active
TEST: This goes to handler      -- Matched by MATCHING pattern
LET x = 42                      -- Normal REXX execution

-- Switch to LINES mode
ADDRESS test LINES(2) 
LET first = 1                   -- Captured (line 1)
LET second = 2                  -- Captured (line 2)  
SAY "Normal execution"          -- Normal REXX execution resumes
```

### 3. Inline String (Direct Execution)
```rexx
ADDRESS calculator "clear; press 5; press +; press 3; press ="  -- Double quotes
ADDRESS calculator 'clear; press 5; press +; press 3; press ='  -- Single quotes
ADDRESS calculator `clear; press 5; press +; press 3; press =`  -- Backticks
-- All three quote types work identically, immediately executed, bypasses all REXX parsing
```
**When**: Quoted string on same line as ADDRESS (any quote type: `"`, `'`, `` ` ``)  
**Processing**: Direct execution via `executeQuotedString()`  
**Handler receives**: Exact string content

### 3. Multiline String (Formatted Commands)
```rexx
-- All three quote types work identically for multiline strings
ADDRESS api
"{\"method\": \"POST\", \"data\": {\"user\": \"alice\", \"action\": \"login\"}}"

ADDRESS api  
'{"method": "GET", "endpoint": "/users"}'

ADDRESS api
`{"method": "PUT", "data": {"status": "active"}}`
```
**When**: Quoted string on line following ADDRESS (any quote type: `"`, `'`, `` ` ``)  
**Processing**: Direct execution, bypasses REXX parsing  
**Handler receives**: Complete formatted string (JSON, XML, etc.)

### 4. HEREDOC Block (Multi-line Content)
```rexx
ADDRESS templating <<HTML
<div class="user-card">
  <h2>{user_name}</h2>
  <p>Status: {user_status}</p>
  <button>Contact {user_name}</button>
</div>
HTML
```
**When**: HEREDOC syntax used  
**Processing**: Multi-line content sent as single string  
**Handler receives**: Complete block with preserved formatting

### 5. Function Calls (Normal REXX Parsing)
```rexx
ADDRESS calculator
clear                           -- Sent to calculator.clear()
press button="5"               -- Sent to calculator.press("5") 
LET result = getDisplay        -- Sent to calculator.getDisplay(), result stored
SAY "Result: " || result       -- Normal REXX (not sent to calculator)
```
**When**: No MATCHING active, normal REXX function call syntax  
**Processing**: Standard REXX parsing, function calls routed to ADDRESS target  
**Handler receives**: Function name and parameters

### Precedence Demonstration
```rexx
-- Setup: MATCHING pattern active
ADDRESS logger MATCHING("^[ \\t]*LOG: (.*)$")

LOG: System startup              -- Method 1: MATCHING (highest precedence)
"Direct log entry"               -- Method 3: Quoted string (bypasses MATCHING)
logMessage text="Function call"  -- Method 6: Function call (normal parsing)
LET local = "not sent"          -- Normal REXX (not sent to logger)

-- Clear MATCHING pattern
ADDRESS logger
"Another direct entry"           -- Method 3: Quoted string  
logMessage text="Function call"  -- Method 6: Function call
```

## Quote Type Support

### All Three Quote Types Supported
ADDRESS string commands support double quotes (`"`), single quotes (`'`), and backticks (`` ` ``) interchangeably:

```rexx
-- All these are functionally identical:
ADDRESS target "command string"
ADDRESS target 'command string'  
ADDRESS target `command string`

-- Multiline versions also identical:
ADDRESS target
"multiline command"

ADDRESS target
'multiline command'

ADDRESS target
`multiline command`
```

### Quote Nesting and Escaping
Different quote types enable flexible content handling:

```rexx
-- Use single quotes to contain double quotes
ADDRESS logger 'Log entry: "User login successful"'

-- Use double quotes to contain single quotes  
ADDRESS logger "Error: Can't connect to database"

-- Use backticks to contain both quote types
ADDRESS formatter `Template: "Hello {name}", message: 'Welcome!'`

-- JSON content examples
ADDRESS api '{"message": "Hello world", "status": "active"}'
ADDRESS api `{"user": "alice", "action": "login", "details": "User's session"}`
```

### Parser Implementation
- **Regex pattern**: `/^ADDRESS\s+(\w+)\s+(["`'])(.*?)\2$/i` 
- **Quote matching**: Opening quote type must match closing quote type
- **No escaping needed**: Different quote types naturally handle nesting
- **Identical processing**: All quote types use same `executeQuotedString()` path

## Pattern Syntax Rules

### 1. Precedence over Parsing
- MATCHING patterns take precedence over all normal REXX parsing
- Lines matching the pattern bypass function call and assignment parsing
- Non-matching lines are parsed normally

### 2. Capture Group Processing  
```rexx
-- First capture group becomes processed content
MATCHING("^[ \\t]*\\. (.*)$")
. result should equal 42    -- Sends: "result should equal 42"

-- No capture groups sends full matched portion
MATCHING("^[ \\t]*\\.")  
. result should equal 42    -- Sends: ". result should equal 42"

-- Multiple capture groups uses first
MATCHING("^[ \\t]*TEST\\((\\w+)\\): (.*)$")
TEST(high): Fix bug         -- Sends: "high" (not "Fix bug")
```

### 3. Flexible Whitespace Handling
```rexx
-- ALWAYS account for indentation
MATCHING("^[ \\t]*pattern")    -- GOOD: Handles spaces/tabs
MATCHING("^pattern")           -- AVOID: Fails with indentation
```

### 4. Regex Escaping
```rexx
-- Escape special regex characters
MATCHING("^[ \\t]*\\. (.*)$")        -- Literal dot
MATCHING("^[ \\t]*\\[TEST\\] (.*)$") -- Literal brackets  
MATCHING("^[ \\t]*\\* (.*)$")        -- Literal asterisk
```

## Common Pattern Examples

### Test Framework Patterns
```rexx
-- Dot-prefix assertions (most common)
ADDRESS EXPECTATIONS MATCHING("^[ \\t]*\\. (.*)$")
. result should equal 42
. name should equal "John"

-- Named test patterns  
ADDRESS testRunner MATCHING("^[ \\t]*TEST: (.*)$")
TEST: user login should succeed
TEST: invalid email should fail

-- Bracketed test markers
ADDRESS validator MATCHING("^[ \\t]*\\[VERIFY\\] (.*)$") 
[VERIFY] password meets requirements
[VERIFY] email format is valid
```

### Logging and Documentation
```rexx
-- Hash-style comments
ADDRESS logger MATCHING("^[ \\t]*# (.*)$")
# Starting database connection
# Processing user records
# Backup completed successfully

-- Arrow-style commands
ADDRESS processor MATCHING("^[ \\t]*> (.*)$")
> initialize system
> load configuration  
> start services
```

### Configuration DSL Patterns
```rexx
-- Key-value configuration
ADDRESS config MATCHING("^[ \\t]*(\\w+):\\s+(.*)$")
database: postgresql://localhost:5432/app
api_key: your-secret-key-here
debug_mode: true

-- Multi-pattern matching
ADDRESS tasks MATCHING("^[ \\t]*(?:TODO|FIXME|NOTE):\\s+(.*)$")
TODO: Implement user registration
FIXME: Handle edge case for empty input
NOTE: Consider performance optimization
```

## Advanced Patterns

### Multiple Syntax Support
```rexx
-- Single pattern supporting multiple prefixes
ADDRESS EXPECTATIONS MATCHING("^[ \\t]*(?:\\.\\s+|CHECK:\\s+|VERIFY:\\s+)(.*)$")

-- All these work:
. result should equal 42
CHECK: result should equal 42  
VERIFY: result should equal 42
```

### Priority and Context Patterns
```rexx
-- Capture priority and content separately
ADDRESS tasks MATCHING("^[ \\t]*TODO\\((\\w+)\\):\\s+(.*)$")
TODO(high): Critical security fix
TODO(low): Update documentation
TODO(medium): Performance optimization

-- The first capture group "high", "low", "medium" is sent to handler
```

### Complex Validation Patterns
```rexx
-- API endpoint validation
ADDRESS api_validator MATCHING("^[ \\t]*(?:GET|POST|PUT|DELETE)\\s+(.*)$")
GET /users should return 200
POST /users should create user
PUT /users/123 should update user
DELETE /users/123 should remove user
```

## Integration Examples

### Expectations Framework
```rexx
REQUIRE "expectations-address"

LET user_age = 25
LET user_name = "Alice"

-- Natural test syntax with dot prefix
ADDRESS EXPECTATIONS MATCHING("^[ \\t]*\\. (.*)$")

. user_age should equal 25
. user_name should equal "Alice"
. user_age should be greater than 18
. user_name should match "^[A-Z][a-z]+$"

-- Back to normal REXX
SAY "All expectations passed"
```

### Multi-Context Testing
```rexx
-- Different patterns for different validation types
LET api_response = '{"status": "success", "data": {"id": 123}}'
LET db_query_result = "5 rows affected"

-- API validation context
ADDRESS api_validator MATCHING("^[ \\t]*API: (.*)$")
API: response should have status "success"
API: response.data.id should equal 123

-- Database validation context  
ADDRESS db_validator MATCHING("^[ \\t]*DB: (.*)$")
DB: query should affect 5 rows
DB: transaction should commit successfully
```

### Dynamic Pattern Generation
```rexx
-- Build patterns dynamically
LET test_prefix = "ASSERT"
LET pattern = "^[ \\t]*" || test_prefix || ": (.*)$"

ADDRESS validator MATCHING(pattern)
ASSERT: value should be positive
ASSERT: string should not be empty
```

## Error Handling

### Invalid Regex Patterns
```rexx
-- Invalid regex falls back to normal parsing
ADDRESS target MATCHING("^[invalid")  -- Invalid regex

-- This line falls back to normal function call handling
. test_value should equal 42  -- Goes to ADDRESS target as function call
```

### Pattern Debugging
```rexx
-- Test patterns with simple content first
ADDRESS logger MATCHING("^[ \\t]*LOG: (.*)$")
LOG: This is a test message

-- Then add complexity gradually
LOG: User {user_name} logged in at {timestamp}
```

## Performance Considerations

- **Pattern Compilation**: Regex patterns are compiled once when ADDRESS MATCHING is set
- **Line Processing**: Every line is tested against the active pattern  
- **Pattern Complexity**: Simple patterns (dot-prefix) perform better than complex alternations
- **Fallback Cost**: Invalid patterns have minimal performance overhead

## Best Practices

### 1. Design for Indentation
```rexx
-- Always handle flexible whitespace
ADDRESS target MATCHING("^[ \\t]*prefix (.*)$")  -- GOOD
ADDRESS target MATCHING("^prefix (.*)$")         -- AVOID
```

### 2. Use Specific Patterns
```rexx
-- Specific patterns reduce false matches
ADDRESS logger MATCHING("^[ \\t]*LOG: (.*)$")   -- GOOD: Specific
ADDRESS logger MATCHING("^[ \\t]*(.*)$")        -- AVOID: Too broad
```

### 3. Test Pattern Behavior
```rexx
-- Test patterns with edge cases
ADDRESS target MATCHING("^[ \\t]*\\. (.*)$")

-- Test these cases:
.no space after dot
. single space  
.    multiple spaces
	.	tabs and spaces mixed
```

### 4. Document Pattern Intent
```rexx
-- Clear comments explain pattern purpose
-- Match test assertions with flexible whitespace after dot
ADDRESS EXPECTATIONS MATCHING("^[ \\t]*\\. (.*)$")

-- Match TODO items with optional priority
ADDRESS tasks MATCHING("^[ \\t]*TODO(?:\\((\\w+)\\))?:\\s+(.*)$")
```

## Integration with Other Features

### INTERPRET Inheritance
```rexx
-- INTERPRET inherits ADDRESS MATCHING context
ADDRESS logger MATCHING("^[ \\t]*LOG: (.*)$")

LET message = "System initialized"
LET log_command = "LOG: " || message

-- Executes in logger context with MATCHING active
INTERPRET log_command  -- Sends "System initialized" to logger
```

### Context Switching
```rexx
-- Switch between different MATCHING contexts
ADDRESS validator MATCHING("^[ \\t]*\\. (.*)$")
. first_test should pass

-- Switch to different pattern
ADDRESS logger MATCHING("^[ \\t]*# (.*)$")  
# Logging some information

-- Return to normal processing (both methods work)
ADDRESS DEFAULT           -- Explicit reset (recommended)  
ADDRESS                   -- Standard REXX: bare ADDRESS resets to default
SAY "Processing complete" -- Normal REXX command
```

**Important**: When you reset ADDRESS (using either `ADDRESS DEFAULT` or `ADDRESS` alone):
- The ADDRESS target is reset to 'default' 
- Any active MATCHING pattern is cleared
- Subsequent lines are parsed as normal REXX commands
- No special pattern matching occurs

```rexx  
-- Example: MATCHING pattern cleared on reset
ADDRESS EXPECTATIONS MATCHING("^[ \\t]*\\. (.*)$")
. value should equal 42         -- Sent to EXPECTATIONS handler

ADDRESS DEFAULT                 -- Clear ADDRESS and MATCHING pattern  
. this is parsed as function    -- Parsed as normal function call (not sent to EXPECTATIONS)
SAY "Back to normal parsing"    -- Normal SAY command
```

## ADDRESS MATCHING MULTILINE Reference

### Syntax
```rexx
ADDRESS <target> MATCHING MULTILINE "<pattern>"
```

The MULTILINE variant extends standard ADDRESS MATCHING to **collect multiple matching lines** and send them as a **single multiline string** to the ADDRESS handler.

### Key Differences from Standard MATCHING

| Feature | Standard MATCHING | MULTILINE MATCHING |
|---------|-------------------|-------------------|
| **Line Processing** | Each line sent individually | Lines collected until non-match |
| **Handler Calls** | One call per matching line | One call per collected block |
| **Content Format** | Single line string | Multiline string (lines joined with `\n`) |
| **Use Case** | Individual commands/assertions | Multi-line code blocks |

### Pattern Design

#### **Start Anchor Required: `^`**
```rexx
-- ✅ CORRECT: Matches lines starting with pattern
ADDRESS sqlite3 MATCHING MULTILINE "^  (.*)"

-- ❌ INCORRECT: Matches pattern anywhere in line  
ADDRESS sqlite3 MATCHING MULTILINE "  (.*)"
```

#### **End Anchor Not Needed: `$`**
```rexx
-- ✅ PREFERRED: Captures to end of line automatically
ADDRESS sqlite3 MATCHING MULTILINE "^  (.*)"

-- ⚠️ REDUNDANT: End anchor provides no benefit
ADDRESS sqlite3 MATCHING MULTILINE "^  (.*)$"
```

#### **Common Patterns**
```rexx
-- SQL indentation (2+ spaces)
ADDRESS sqlite3 MATCHING MULTILINE "^  (.*)"

-- Python indentation (4+ spaces)  
ADDRESS python MATCHING MULTILINE "^    (.*)"

-- Comment blocks
ADDRESS processor MATCHING MULTILINE "^# (.*)"

-- Custom prefix
ADDRESS system MATCHING MULTILINE "^>> (.*)"
```

### Collection Algorithm

1. **Pattern Match**: Each line tested against regex
2. **Match Found**: Extract capture group content, add to buffer
3. **Non-Match Found**: 
   - Send buffered content as single multiline string
   - Clear buffer
   - Process non-matching line normally
4. **Program End**: Flush any remaining buffered content

### Multiline Examples

#### **SQL Statements**
```rexx
ADDRESS sqlite3 MATCHING MULTILINE "^  (.*)"

  CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE
  )

-- Non-matching line flushes the CREATE TABLE
SAY "✓ Table created"

  INSERT INTO users (name, email) VALUES 
    ('Alice Smith', 'alice@example.com'),
    ('Bob Jones', 'bob@example.com')

-- ADDRESS change flushes the INSERT  
ADDRESS default
```

**Handler receives:**
1. `"CREATE TABLE users (\nid INTEGER PRIMARY KEY,\nname TEXT NOT NULL,\nemail TEXT UNIQUE\n)"`
2. `"INSERT INTO users (name, email) VALUES\n('Alice Smith', 'alice@example.com'),\n('Bob Jones', 'bob@example.com')"`

#### **Python Code**
```rexx
ADDRESS python MATCHING MULTILINE "^    (.*)"

    def calculate_total(items):
        total = 0
        for item in items:
            total += item.price
        return total

ADDRESS default
```

**Handler receives:**
`"def calculate_total(items):\n    total = 0\n    for item in items:\n        total += item.price\n    return total"`

#### **Shell Scripts**
```rexx
ADDRESS system MATCHING MULTILINE "^  (.*)"

  for file in *.txt; do
    echo "Processing $file"
    wc -l "$file"
  done

ADDRESS default
```

### Termination Triggers

Multiline collection stops and content is sent when:

1. **Non-matching line encountered**
2. **ADDRESS target changes** (`ADDRESS other` or `ADDRESS default`)
3. **End of program/script**
4. **New MATCHING pattern set** (`ADDRESS target MATCHING "other_pattern"`)

### Integration with ADDRESS Handlers

#### **Handler Design**
```javascript
function ADDRESS_HANDLER(commandOrMethod, params) {
  if (typeof commandOrMethod === 'string' && commandOrMethod.includes('\n')) {
    // Multiline content detected
    const lines = commandOrMethod.split('\n');
    // Process as single multiline command
  } else {
    // Single line or method call
  }
}
```

#### **Context Information**
Handlers can detect multiline content via:
- **Newline presence**: `commandOrMethod.includes('\n')`
- **Pattern context**: `params._addressMatchingPattern` field
- **Multiple lines**: `commandOrMethod.split('\n').length > 1`

### Performance Considerations

- **Memory Usage**: Collection buffer grows with matching lines
- **Regex Overhead**: Pattern tested against every line
- **Optimal Patterns**: Simple patterns (`^  (.*)`) perform better than complex alternations
- **Buffer Flushing**: Regular flushing prevents excessive memory usage

### Common Use Cases

#### **Database Operations**
```rexx
-- Multi-line CREATE TABLE with constraints
-- Multi-value INSERT statements  
-- Complex SELECT with JOINs and subqueries
ADDRESS sqlite3 MATCHING MULTILINE "^  (.*)"
```

#### **Code Generation**
```rexx
-- Python functions and classes
-- JavaScript code blocks
-- Shell script generation
ADDRESS generator MATCHING MULTILINE "^    (.*)"
```

#### **Configuration Files**
```rexx  
-- JSON configuration blocks
-- YAML sections
-- INI file groups
ADDRESS config MATCHING MULTILINE "^  (.*)"
```

### Error Handling

#### **Invalid Patterns**
```rexx
-- Invalid regex falls back to normal MATCHING behavior
ADDRESS target MATCHING MULTILINE "^[invalid"  -- Invalid regex
-- Subsequent lines processed as standard MATCHING (line-by-line)
```

#### **Debugging Techniques**
```rexx
-- Test with simple content first
ADDRESS target MATCHING MULTILINE "^  (.*)"
  simple test line

-- Add complexity gradually  
  multi-line
  content block
```

### Best Practices

#### **✅ Do:**
- Use start anchors (`^`) for proper line matching
- Design patterns for consistent indentation
- Flush buffers with non-matching lines regularly
- Test patterns with various content types

#### **❌ Don't:**
- Use overly broad patterns that match unintended lines
- Create patterns without start anchors
- Forget to handle termination cases
- Mix multiline and single-line patterns unnecessarily

## See Also

- [Application Addressing](16-application-addressing.md) - Core ADDRESS functionality
- [Dynamic Execution](15-interpret.md) - INTERPRET with ADDRESS contexts
- [Testing with rexxt](23-testing-rexxt.md) - Test framework integration
- [Expectations Address Implementation](../src/expectations-address.js) - Reference implementation
- [SQLite3 ADDRESS Examples](../extras/addresses/sqlite3/) - Real-world multiline usage

---

**Pattern Examples Repository:**
- [`tests/dogfood/nested-loops-comprehensive.rexx`](../tests/dogfood/nested-loops-comprehensive.rexx) - Production usage
- [`tests/address-matching-simple.spec.js`](../tests/address-matching-simple.spec.js) - Unit tests
- [`tests/address-matching.spec.js`](../tests/address-matching.spec.js) - Integration tests
- [`tests/address-matching-multiline.spec.js`](../tests/address-matching-multiline.spec.js) - Multiline tests
- [`extras/addresses/sqlite3/`](../extras/addresses/sqlite3/) - Multiline SQL examples