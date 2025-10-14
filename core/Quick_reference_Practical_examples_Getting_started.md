# RexxJS Rexx Reference Documentation

**📖 For detailed documentation, see the organized reference guide in [`reference/`](reference/00-INDEX.md)**

This document provides a quick overview of RexxJS Rexx features. For comprehensive documentation with examples, tutorials, and detailed API references, visit the complete reference guide.

## 📚 Documentation Structure

The reference documentation is organized into focused sections:

### Core Language
- **[Basic Syntax](reference/01-basic-syntax.md)** - Variables, functions, expressions, string interpolation
- **[Control Flow](reference/02-control-flow.md)** - IF/ELSE, loops, SELECT, SIGNAL statements
- **[Advanced Statements](reference/03-advanced-statements.md)** - NUMERIC, PARSE, stack operations, subroutines, TRACE

### Built-in Functions  
- **[String Functions](reference/04-string-functions.md)** - Text manipulation, regex, validation
- **[Math Functions](reference/05-math-functions.md)** - Arithmetic, statistics, geometry
- **[Array Functions](reference/06-array-functions.md)** - Collection processing and analysis
- **[JSON Functions](reference/08-json-functions.md)** - Data interchange and API integration
- **[Security Functions](reference/12-security-functions.md)** - Hashing, encryption, authentication

### Advanced Features
- **[Dynamic Execution](reference/15-interpret.md)** - INTERPRET statement with security controls
- **[Application Addressing](reference/16-application-addressing.md)** - Cross-application communication

---

## Quick Feature Overview

## Core Language Features

### Variable Management
- **Variable Assignment**: `LET variable = value`
- **Function Result Assignment**: `LET result = functionName param=value`
- **Variable Substitution**: Automatic resolution in function parameters and expressions

### Function Calls and Operations
RexxJS distinguishes between **Operations** (imperative commands) and **Functions** (expressions):

- **Operations** (without parentheses): `SERVE_GUEST guest="alice" bath="herbal"`
  - Side-effect actions that modify state
  - Called directly without parentheses
  - Receive named parameters as object

- **Functions** (with parentheses): `LET result = IDENTIFY_SPIRIT(description="muddy")`
  - Pure/query operations that return values
  - Always use parentheses (even if no parameters: `COUNT_TOKENS()`)
  - Support both positional and named parameters
  - Work in expressions, assignments, and pipe operators

- **Named Parameters** (functions only): `SUBSTR(start=2, length=3)` or `SUBSTR("hello", 2, 3)`
  - Both styles work interchangeably via parameter-converter
  - Named params work in all contexts including pipe operator: `"hello" |> SUBSTR(start=2, length=3)`

- **Application Addressing**: `ADDRESS application` to switch target applications
- **Parameter Types**: Support for strings, numbers, booleans, and expressions

### Control Flow

#### Conditional Statements (IF/ELSE/ENDIF)
```rexx
IF condition THEN
  -- commands
ELSE
  -- alternative commands  
ENDIF
```
- **Comparison Operators**: `>`, `<`, `>=`, `<=`, `=`, `==`
- **Boolean Conditions**: Direct variable evaluation
- **Nested Conditionals**: Full support for nested IF statements

#### Loop Structures (DO/END)

**Range Loops:**
```rexx
DO i = 1 TO 10
  -- commands
END
```

**Step Loops:**
```rexx
DO i = 1 TO 10 BY 2
  -- commands
END
```

**While Loops:**
```rexx
DO WHILE condition
  -- commands
END
```

**Repeat Loops:**
```rexx
DO 5
  -- commands (repeat 5 times)
END
```

#### Multi-way Branching (SELECT/WHEN/OTHERWISE/END)
```rexx
SELECT
  WHEN condition1 THEN
    -- commands
  WHEN condition2 THEN
    -- commands
  OTHERWISE
    -- default commands
END
```

#### NUMERIC Statement - Precision Control
```rexx
NUMERIC DIGITS value    -- Set decimal precision (1-999999999)
NUMERIC FUZZ value      -- Set comparison tolerance (0 to digits-1)
NUMERIC FORM format     -- Set format (SCIENTIFIC or ENGINEERING)
```

**Examples:**
```rexx
NUMERIC DIGITS 15        -- High precision calculations
NUMERIC FUZZ 2          -- Allow 2-digit comparison tolerance
NUMERIC FORM SCIENTIFIC -- Use scientific notation

-- Variable values
LET precision = "20"
NUMERIC DIGITS precision
```

**Default Values:**
- DIGITS: 9
- FUZZ: 0  
- FORM: SCIENTIFIC

#### PARSE Statement - String Template Parsing
```rexx
PARSE VAR variable WITH template       -- Parse from variable
PARSE VALUE expression WITH template   -- Parse from expression  
PARSE ARG variable WITH template       -- Parse from arguments
```

**Template Syntax:**
- **Variables**: `name age job` - Capture space-separated words
- **Quoted Delimiters**: `name "," age ":" job` - Use custom separators
- **Mixed Parsing**: `user "@" domain "." extension` - Combine patterns

**Examples:**
```rexx
-- Space-delimited parsing
LET data = "John 25 Engineer"
PARSE VAR data WITH name age job

-- Custom delimiter parsing  
LET csv = "apple,banana,cherry"
PARSE VAR csv WITH fruit1 "," fruit2 "," fruit3

-- Date parsing
LET dateStr = "2024-12-25"  
PARSE VAR dateStr WITH year "-" month "-" day

-- Email parsing
LET email = "user@example.com"
PARSE VAR email WITH username "@" domain

-- Remaining text capture
LET sentence = "The quick brown fox"
PARSE VAR sentence WITH first second rest
-- first="The", second="quick", rest="brown fox"
```

#### Stack Operations - PUSH/PULL/QUEUE
```rexx
PUSH value      -- Add to top of stack (LIFO)
PULL variable   -- Remove from top into variable  
QUEUE value     -- Add to bottom of stack (FIFO)
```

**Stack Functions:**
```rexx
STACK_SIZE          -- Get number of items
STACK_PEEK          -- Look at top item without removing
STACK_PUSH value    -- Add item, return new size
STACK_PULL          -- Remove and return top item
STACK_QUEUE value   -- Add to bottom, return new size
STACK_CLEAR         -- Empty stack, return cleared count
```

**Examples:**
```rexx
-- LIFO operations (Last In, First Out)
PUSH "first"
PUSH "second"
PUSH "third"
PULL item1    -- Gets "third"
PULL item2    -- Gets "second"

-- FIFO operations (First In, First Out)
QUEUE "task1"
QUEUE "task2" 
QUEUE "task3"
PULL next     -- Gets "task1"

-- Function usage
LET size = STACK_SIZE
LET top = STACK_PEEK
PUSH "new item"
LET pulled = STACK_PULL
STACK_CLEAR

-- Variable values
LET data = "important"
PUSH data
PULL result
```

#### Subroutines - CALL/RETURN
```rexx
CALL subroutine_name             -- Call with no arguments
CALL subroutine_name arg1        -- Call with one argument  
CALL subroutine_name arg1, arg2  -- Call with multiple arguments
RETURN                           -- Return to caller
RETURN value                     -- Return with value
```

**Subroutine Structure:**
```rexx
-- Main program
CALL my_subroutine "param1", "param2"
EXIT

-- Subroutine definition
my_subroutine:
  LET param1 = ARG(1)   -- First argument (1-based)
  LET param2 = ARG(2)   -- Second argument
  LET count = ARG()     -- Argument count (idiomatic REXX)
  -- subroutine code here
  RETURN result_value
```

**Examples:**
```rexx
-- Simple subroutine call
CALL initialize
CALL process_data "input.txt"
EXIT

initialize:
  LET setup = "done"
  RETURN

process_data:
  LET filename = ARG(1)
  LET status = "processed"
  RETURN status

-- Nested calls
CALL main_task "data"
EXIT

main_task:
  LET data = ARG(1)
  CALL validate_data data
  CALL transform_data data
  RETURN

validate_data:
  LET input = ARG(1)
  LET valid = "yes"
  RETURN

transform_data:
  LET input = ARG(1)
  LET transformed = "processed"
  RETURN
```

**Argument Access (Idiomatic REXX):**
- **ARG()** - Number of arguments passed (classic REXX function)
- **ARG(n)** - Get the nth argument (1-based indexing)
- **ARG(n, 'E')** - Check if nth argument exists (returns 1 or 0)
- **ARG(n, 'O')** - Check if nth argument was omitted (returns 1 or 0)

#### TRACE Statement - Execution Debugging
```rexx
TRACE A        -- All instructions (most verbose)
TRACE R        -- Results of assignments and functions  
TRACE I        -- Intermediate (assignments, functions, calls)
TRACE O        -- Output operations only (SAY statements)
TRACE NORMAL   -- Basic execution tracing
TRACE OFF      -- Disable tracing (default)
```

**TRACE Mode Details:**
- **A (All)** - Traces every instruction with full details and results
- **R (Results)** - Traces instructions that produce results (assignments, functions)
- **I (Intermediate)** - Traces assignments, function calls, and subroutine calls
- **O (Output)** - Traces only output operations like SAY statements
- **NORMAL** - Basic instruction flow and subroutine call tracing
- **OFF** - Disables all tracing (default state)

**Examples:**
```rexx
-- Debug a calculation
TRACE A
LET value = 100
LET tax_rate = 0.08
LET total = value * tax_rate
TRACE OFF

-- Monitor subroutine calls
TRACE I
CALL calculate_shipping "priority"
CALL format_results 
TRACE NORMAL

-- Track only assignments
TRACE R
LET processed_data = TRANSFORM input="raw data"
LET final_result = VALIDATE data=processed_data
```

**Trace Output Format:**
```
[HH:MM:SS.sss] MODE:TYPE message => result
[14:32:15.123] A:I ASSIGNMENT 
[14:32:15.124] A:A LET value = "100" => 100
[14:32:15.125] I:C CALL calculate_shipping (1 args)
```

#### SIGNAL Statement - Unconditional Jumps

```rexx
SIGNAL label_name          -- Jump to label
```

**Label Definition:**
```rexx
label_name:               -- Label on its own line
label_name: statement     -- Label with statement on same line  
```

**Examples:**
```rexx
-- Basic jump
LET status = "start"
SIGNAL process_data
LET unreachable = "never executed"

process_data:
  LET status = "processing"
  EXIT

-- State machine pattern
LET state = "init"
check_state:
  IF state = "init" THEN
    SIGNAL initialize
  ELSE IF state = "process" THEN
    SIGNAL process
  ENDIF
  
initialize:
  LET state = "process"
  SIGNAL check_state
  
process:
  SAY "Processing complete"
  EXIT

-- Error handling pattern  
retry_loop:
  LET success = attempt_operation()
  IF success THEN
    SIGNAL success_handler
  ELSE
    LET retry_count = retry_count + 1
    IF retry_count < 3 THEN
      SIGNAL retry_loop
    ELSE
      SIGNAL failure_handler
    ENDIF
  ENDIF

success_handler:
  SAY "Operation succeeded"
  EXIT
  
failure_handler:
  SAY "Operation failed after retries"
  EXIT
```

**Label Rules:**
- Case-insensitive (`MyLabel` = `mylabel`)
- Must start with letter/underscore, followed by letters/numbers/underscores
- Can be on separate line or followed by a statement
- Labels are discovered before execution begins

**Best Practices:**
- Use structured control flow (IF/DO/SELECT) when possible
- SIGNAL is useful for error recovery and state machines
- Avoid complex jumping patterns that make code hard to follow
- Label names should be descriptive of their purpose

### Mathematical Expressions

**Full Arithmetic Support:**
- **Basic Operators**: `+`, `-`, `*`, `/`
- **Operator Precedence**: Proper mathematical precedence (multiplication/division before addition/subtraction)
- **Parentheses Support**: `(expression)` for grouping
- **Variable Integration**: Use variables in expressions

**Examples:**
```rexx
LET base = 10
LET multiplier = 3
LET result = base + multiplier * 4    -- Evaluates to 22
LET withParens = (base + multiplier) * 4  -- Evaluates to 52

-- In function parameters
createMeal potatoes=base*2 chicken=result/5

-- In loop ranges
DO i = 1 TO result/4
  prepareDish servings=i*2+1
END
```

### String Interpolation ✨

**Variable Interpolation in Strings:**

RexxJS supports multiple interpolation patterns that can be switched at runtime:

```rexx
-- Default: Handlebars-style {{var}}
LET name = "Alice"
SAY "Hello {{name}}"  -- Output: Hello Alice

-- Switch to shell-style ${var}
SET_INTERPOLATION('shell')
SAY "Hello ${name}"   -- Output: Hello Alice

-- Switch to batch-style %var%
SET_INTERPOLATION('batch')
SAY "Hello %name%"    -- Output: Hello Alice

-- Switch back to handlebars
SET_INTERPOLATION('handlebars')
SAY "Hello {{name}}"  -- Output: Hello Alice
```

**Available Interpolation Patterns:**
- `'handlebars'` - `{{var}}` (default)
- `'shell'` - `${var}`
- `'batch'` - `%var%`
- `'doubledollar'` - `$$var$$`
- Custom patterns via pattern example: `SET_INTERPOLATION('{v}')`

**Important Notes:**
- Only **double-quoted strings** interpolate: `"Hello {{name}}"` ✅
- Single-quoted strings are literal: `'Hello {{name}}'` ❌ (shows {{name}} literally)
- Pattern changes affect all subsequent string interpolation
- Works in SAY statements, ADDRESS commands, and string assignments

### Built-in Functions ⚡

**Client-Side Function Library:**
```rexx
-- String Functions
LET name = UPPER string="john doe"           -- "JOHN DOE"
LET lower = LOWER string="HELLO WORLD"       -- "hello world" 
LET length = LENGTH string="Hello"           -- 5
LET border = COPIES string="-" count=20      -- "--------------------"
LET clean = STRIP string="  text  "          -- "text"
LET leading = STRIP string="...data..." option="LEADING" character="."  -- "data..."
LET backward = REVERSE string="hello"        -- "olleh"
LET normal = SPACE string="  a   b   c  "    -- "a b c"
LET double = SPACE string="  a   b   c  " n=2 -- "a  b  c"
LET caps = TRANSLATE string="hello"          -- "HELLO" (default to uppercase)
LET cipher = TRANSLATE string="abc" outputTable="123" inputTable="abc"  -- "123"
LET valid = VERIFY string="12345" reference="0123456789"  -- 0 (all digits valid)
LET invalid = VERIFY string="123a5" reference="0123456789"  -- 4 (position of 'a')
LET first = WORD string="hello world test" n=1  -- "hello"
LET third = WORD string="hello world test" n=3  -- "test"
LET count = WORDS string="hello world test"     -- 3
LET empty_count = WORDS string=""               -- 0
LET pos1 = WORDPOS phrase="world" string="hello world test"  -- 2
LET pos2 = WORDPOS phrase="not found" string="hello world test"  -- 0
LET del1 = DELWORD string="one two three four" start=2 length=2  -- "one four"
LET del2 = DELWORD string="one two three four" start=3          -- "one two"
LET sub1 = SUBWORD string="one two three four" start=2 length=2  -- "two three"
LET sub2 = SUBWORD string="one two three four" start=3          -- "three four"

-- Math Functions
LET maximum = MAX x=10 y=5 z=15             -- 15
LET minimum = MIN a=3 b=7 c=2               -- 2
LET absolute = ABS value=-42                 -- 42

-- Utility Functions
LET today = DATE                            -- "2025-08-25"
LET now = TIME                              -- "14:30:15"
LET timestamp = NOW                         -- "2025-08-25T14:30:15.123Z"

-- JSON Functions
LET jsonString = '{"name": "John", "age": 30, "active": true}'
LET parsed = JSON_PARSE string=jsonString   -- JavaScript object
LET backToJson = JSON_STRINGIFY object=parsed  -- JSON string
LET prettyJson = JSON_STRINGIFY object=parsed indent=2  -- Formatted JSON
LET isValid = JSON_VALID string=jsonString  -- true

-- URL/Web Functions
LET url = "https://api.example.com:8080/users?page=2#section1"
LET parsed = URL_PARSE url=url              -- URL components object
LET encoded = URL_ENCODE string="hello world & more"  -- "hello%20world%20%26%20more"
LET decoded = URL_DECODE string=encoded     -- "hello world & more"
LET b64encoded = BASE64_ENCODE string="username:password"  -- "dXNlcm5hbWU6cGFzc3dvcmQ="
LET b64decoded = BASE64_DECODE string=b64encoded  -- "username:password"

-- UUID/ID Generation Functions
LET sessionId = UUID                        -- "f47ac10b-58cc-4372-a567-0e02b2c3d479"
LET shortId = NANOID length=8               -- "V1StGXR8"
LET apiKey = RANDOM_HEX bytes=32            -- "a1b2c3d4e5f67890abcdef1234567890..."
LET randomNum = RANDOM_INT min=1 max=100    -- Random number 1-100
LET secureBytes = RANDOM_BYTES count=16     -- [42, 158, 91, 203, ...]
```

**Built-in Function Categories:**
- **String Functions**: `UPPER`, `LOWER`, `LENGTH`
- **Math Functions**: `MAX`, `MIN`, `ABS` 
- **Utility Functions**: `DATE`, `TIME`, `NOW`
- **JSON Functions**: `JSON_PARSE`, `JSON_STRINGIFY`, `JSON_VALID`
- **URL/Web Functions**: `URL_PARSE`, `URL_ENCODE`, `URL_DECODE`, `BASE64_ENCODE`, `BASE64_DECODE`
- **Dynamic Execution**: `INTERPRET` - Execute Rexx code dynamically with variable control
- **UUID/ID Functions**: `UUID`, `NANOID`, `RANDOM_HEX`, `RANDOM_INT`, `RANDOM_BYTES`
- **Expression Integration**: Functions work seamlessly in mathematical expressions
- **Control Flow Integration**: Functions can be used in IF conditions and DO loop bounds
- **Error Handling**: Graceful handling of invalid inputs with sensible defaults

### Operations vs Functions with REQUIRE 🔧

**Loading External Libraries with Both Operations and Functions:**

RexxJS libraries can export both **operations** (imperative commands) and **functions** (query/expression calls). This enables a clean separation between state-changing actions and data retrieval.

```rexx
-- Load a library that provides both operations and functions
REQUIRE "cwd:libs/bathhouse-library.js"

-- Operations: Side-effect commands (no parentheses)
SERVE_GUEST guest="river_spirit" bath="herbal"
CLEAN_BATHHOUSE area="main_hall" intensity="deep"
FEED_SOOT_SPRITES treats="konpeito" amount=3
ISSUE_TOKEN worker="chihiro" task="cleaning"

-- Functions: Query operations (with parentheses, return values)
LET capacity = BATHHOUSE_CAPACITY()
LET spirit = IDENTIFY_SPIRIT(description="muddy")  -- Named params
LET count = COUNT_TOKENS()
LET energy = SOOT_SPRITE_ENERGY()

-- Functions support both positional and named parameters
LET spirit1 = IDENTIFY_SPIRIT("hungry")            -- Positional
LET spirit2 = IDENTIFY_SPIRIT(description="quiet") -- Named

-- Named parameters work in all contexts including pipes
LET result = "  hello  "
  |> STRIP()
  |> SUBSTR(start=2, length=3)  -- Named params in pipe operator
```

**Using REQUIRE AS for Prefixes:**

```rexx
-- Prefix both operations and functions from a library
REQUIRE "cwd:libs/bathhouse-library.js" AS bh_(.*)

-- Operations with prefix
bh_SERVE_GUEST guest="no_face" bath="luxury"
bh_CLEAN_BATHHOUSE area="lobby"

-- Functions with prefix
LET capacity = bh_BATHHOUSE_CAPACITY()
LET log = bh_GET_LOG()
LET spirit = bh_IDENTIFY_SPIRIT(description="hungry")
```

**Key Differences:**

| Feature | Operations | Functions |
|---------|-----------|-----------|
| **Syntax** | No parentheses | Always use parentheses |
| **Purpose** | Side effects, state changes | Return values, queries |
| **Parameters** | Named only, passed as object | Positional OR named (flexible) |
| **Usage** | `SERVE_GUEST guest="alice"` | `IDENTIFY_SPIRIT(description="x")` |
| **In Expressions** | ❌ Not allowed | ✅ Works everywhere |
| **In Pipes** | ❌ Not allowed | ✅ `x \|> FUNC(param=val)` |

**Parameter Conversion:**

Functions use the parameter-converter system to support both styles:
- Positional: `SUBSTR("hello world", 7, 5)` → `"world"`
- Named: `SUBSTR(start=7, length=5)` with piped data → `"world"`
- Mixed: Pipe provides first arg, named params provide rest

### JSON Processing Functions 🔄

**Modern Data Interchange:**
RexxJS Rexx provides comprehensive JSON processing capabilities for modern web applications and API integration.

```rexx
-- Parse API responses or configuration data
LET apiResponse = '{"users": [{"name": "Alice", "role": "admin"}, {"name": "Bob", "role": "user"}]}'
LET data = JSON_PARSE string=apiResponse

-- Access nested data with dot notation
LET adminName = data.users[0].name  -- "Alice"
LET userCount = LENGTH string=data.users  -- 2

-- Create dynamic JSON from variables
LET config = {
  version: 2,
  enabled: true,
  features: ["auth", "api", "ui"]
}
LET configJson = JSON_STRINGIFY object=config

-- Pretty-print JSON for logging or debugging
LET prettyConfig = JSON_STRINGIFY object=config indent=2
```

**JSON Function Library:**
- **JSON_PARSE(string)**: Convert JSON string to JavaScript object
- **JSON_STRINGIFY(object, indent?)**: Convert object to JSON string with optional formatting  
- **JSON_VALID(string)**: Validate JSON syntax (returns boolean)

**Integration Examples:**
```rexx
-- Validate and process API configuration
LET configJson = loadConfig endpoint="/api/config"
LET isValidJson = JSON_VALID string=configJson

IF isValidJson THEN
  LET config = JSON_PARSE string=configJson
  
  -- Process configuration with control flow
  SELECT
    WHEN config.version >= 2 THEN
      enableFeatures features=config.features
    WHEN config.version = 1 THEN  
      migrateConfig oldConfig=config
    OTHERWISE
      reportError message="Unsupported config version"
  END
ELSE
  reportError message="Invalid JSON configuration"
ENDIF

-- Dynamic JSON creation with string interpolation
LET userName = UPPER string="alice"
LET timestamp = NOW
LET logEntry = JSON_STRINGIFY object={
  user: userName,
  action: "login", 
  timestamp: timestamp,
  success: true
}
sendLog entry=logEntry
```

**Error Handling:**
- **JSON_PARSE**: Returns `null` for invalid JSON strings
- **JSON_STRINGIFY**: Returns empty string for objects that cannot be serialized
- **JSON_VALID**: Always returns boolean, never throws errors

**Advanced Features:**
- **Dot Notation Access**: Parse JSON once, access nested properties with `object.property.subproperty`
- **String Interpolation**: Use parsed JSON data in interpolated strings: `"Welcome {user.profile.firstName}"`
- **Control Flow Integration**: Use JSON validation and parsing in IF/SELECT/DO statements
- **Expression Support**: JSON functions work in mathematical expressions and assignments

### URL/Web Processing Functions 🌐

**Modern Web Integration:**
Essential functions for URL manipulation, API authentication, and web automation in browser and cross-iframe environments.

```rexx
-- Parse and analyze URLs
LET apiUrl = "https://api.example.com:8080/v1/users?page=2&limit=10#results"
LET urlParts = URL_PARSE url=apiUrl

-- Access URL components with dot notation
LET host = urlParts.hostname        -- "api.example.com"
LET path = urlParts.pathname        -- "/v1/users"
LET query = urlParts.search         -- "?page=2&limit=10"
LET isSecure = urlParts.protocol    -- "https:"

-- Build dynamic URLs with proper encoding
LET searchTerm = "hello world & special chars"
LET encoded = URL_ENCODE string=searchTerm
LET searchUrl = "https://api.example.com/search?q=" + encoded
-- Result: "https://api.example.com/search?q=hello%20world%20%26%20special%20chars"
```

**URL Function Library:**
- **URL_PARSE(url)**: Parse URL string into components object (protocol, host, pathname, search, hash, etc.)
- **URL_ENCODE(string)**: URL-encode string for safe use in URLs
- **URL_DECODE(string)**: Decode URL-encoded strings back to original
- **BASE64_ENCODE(string)**: Base64 encode for authentication headers and data encoding
- **BASE64_DECODE(string)**: Decode Base64 strings back to original

**Web Integration Examples:**
```rexx
-- API Authentication with Basic Auth
LET username = "admin"
LET password = "secret123"  
LET colon = ":"
LET credentials = username + colon + password
LET encoded = BASE64_ENCODE string=credentials
LET authHeader = "Basic " + encoded
-- Result: "Basic YWRtaW46c2VjcmV0MTIz"

-- Dynamic API URL construction
LET baseUrl = "https://api.example.com"
LET endpoint = "/users"
LET searchTerm = "john doe"
LET encodedSearch = URL_ENCODE string=searchTerm
LET apiUrl = baseUrl + endpoint + "?name=" + encodedSearch + "&active=true"

-- URL validation and routing
LET requestUrl = getCurrentUrl
LET parsed = URL_PARSE url=requestUrl

SELECT
  WHEN parsed.pathname = "/api/users" THEN
    handleUsersRequest query=parsed.search
  WHEN parsed.pathname = "/api/auth" THEN  
    handleAuthRequest headers=authHeader
  OTHERWISE
    handleNotFound path=parsed.pathname
END
```

**Cross-iframe Communication:**
```rexx
-- Construct postMessage data with Base64 encoding
LET messageData = '{"action": "update", "data": {"id": 123, "name": "Alice"}}'
LET encoded = BASE64_ENCODE string=messageData
sendMessage target="calculator-iframe" payload=encoded

-- Parse incoming URLs from postMessage
LET targetUrl = "https://calculator.example.com/api/calculate?expr=2%2B3"
LET decoded = URL_DECODE string=targetUrl
LET parsed = URL_PARSE url=decoded
-- Extract and process calculation parameters
```

**Error Handling:**
- **URL_PARSE**: Returns `null` for invalid URLs
- **URL_ENCODE/DECODE**: Return empty string for encoding/decoding errors
- **BASE64_ENCODE/DECODE**: Handle encoding errors gracefully with empty string fallback
- **Cross-platform Support**: Uses native browser/Node.js APIs with custom fallbacks

**Advanced Features:**
- **Component Access**: Parse once, access any URL component with dot notation
- **String Interpolation**: Use parsed URL data in interpolated strings: `"Connecting to {parsed.hostname}:{parsed.port}"`
- **Control Flow Integration**: Use URL validation and parsing in conditional statements
- **Authentication Patterns**: Built-in support for Basic Auth header generation
- **Query String Building**: Proper encoding for complex search parameters

### UUID/ID Generation Functions 🎯

**Unique Identifier Generation:**
Essential functions for distributed systems, session tracking, and secure random data generation with cross-platform cryptographic support.

```rexx
-- Standard UUID v4 generation (RFC 4122 compliant)
LET sessionId = UUID
-- Result: "f47ac10b-58cc-4372-a567-0e02b2c3d479"

-- URL-safe short IDs (similar to npm's nanoid)
LET trackingId = NANOID length=12
LET defaultId = NANOID  -- 21 characters by default
-- Results: "V1StGXR8_Z5j", "V1StGXR8_Z5jkuuuuuuu"

-- Secure random data generation
LET apiKey = RANDOM_HEX bytes=32
LET token = RANDOM_HEX bytes=16
-- Results: "a1b2c3d4e5f67890abcdef1234567890...", "f3e4d5c6b7a89012"

-- Random integers for testing and simulation
LET dice = RANDOM_INT min=1 max=6
LET percentage = RANDOM_INT min=0 max=100
-- Results: 4, 73

-- Raw random bytes for cryptographic operations
LET entropy = RANDOM_BYTES count=32
-- Result: [42, 158, 91, 203, 17, 249, ...]
```

**UUID/ID Function Library:**
- **UUID()**: Generate RFC4122 version 4 UUID with proper randomness and formatting
- **NANOID(length?)**: URL-safe unique IDs with customizable length (default: 21)
- **RANDOM_HEX(bytes?)**: Cryptographically secure hexadecimal strings (default: 16 bytes)
- **RANDOM_INT(min?, max?)**: Random integers within specified range (default: 0-100)
- **RANDOM_BYTES(count?)**: Array of random bytes for cryptographic use (default: 32)

**Distributed System Integration:**
```rexx
-- Session and request tracking
LET sessionId = UUID
LET requestId = NANOID length=12
LET timestamp = NOW

-- Create tracking context
LET logPrefix = "Session: "
LET logEntry = logPrefix + sessionId
sendLog entry=logEntry level="INFO"

-- API key generation
LET apiSecret = RANDOM_HEX bytes=64
LET keyId = NANOID length=16
registerApiKey id=keyId secret=apiSecret

-- Load balancing and routing
LET serverId = RANDOM_INT min=1 max=5
LET routingKey = RANDOM_HEX bytes=8

SELECT
  WHEN serverId <= 2 THEN
    routeRequest server="primary" key=routingKey
  WHEN serverId <= 4 THEN  
    routeRequest server="secondary" key=routingKey
  OTHERWISE
    routeRequest server="backup" key=routingKey
END
```

**Cross-iframe Security:**
```rexx
-- Generate secure message IDs for postMessage
LET messageId = UUID
LET nonce = RANDOM_HEX bytes=16

-- Create secure RPC payload
LET rpcCall = '{"id": "' + messageId + '", "nonce": "' + nonce + '", "method": "calculate"}'
sendMessage target="calculator-iframe" payload=rpcCall

-- Session validation with random challenges
LET challengeId = NANOID length=16
LET challengeValue = RANDOM_INT min=1000 max=9999
createChallenge id=challengeId value=challengeValue
```

**Testing and Simulation:**
```rexx
-- Generate test data with consistent patterns
DO testRun = 1 TO 10
  LET userId = "user_" + NANOID(length=8)
  LET score = RANDOM_INT min=0 max=1000
  LET sessionTime = RANDOM_INT min=60 max=3600
  
  createTestUser id=userId score=score duration=sessionTime
END

-- A/B testing with random assignment
LET variant = RANDOM_INT min=1 max=2
IF variant = 1 THEN
  showFeature variant="A" trackingId=UUID
ELSE
  showFeature variant="B" trackingId=UUID
ENDIF
```

**Security & Cryptographic Features:**
- **Cryptographic Randomness**: Uses Web Crypto API (browser) or crypto.randomBytes (Node.js) when available
- **Secure Fallbacks**: Custom implementations maintain security when native APIs unavailable
- **RFC Compliance**: UUID generation follows RFC4122 version 4 specification
- **Collision Resistance**: NANOIDs use 64-character alphabet for maximum entropy
- **Cross-platform**: Works consistently across browser, Node.js, and embedded environments

**Error Handling:**
- **Invalid Parameters**: Graceful fallback to sensible defaults for invalid inputs
- **Zero/Negative Lengths**: Automatically use default values for invalid size parameters
- **Range Validation**: RANDOM_INT handles invalid min/max ranges appropriately
- **Memory Safety**: Byte arrays properly bounded to prevent memory issues

**Advanced Features:**
- **String Interpolation**: Use generated IDs in interpolated strings: `"Request {requestId} for session {sessionId}"`
- **Control Flow Integration**: Random values work in IF/SELECT/DO statements for dynamic behavior
- **Expression Support**: Random numbers integrate with mathematical expressions
- **State Independence**: Each function call generates fresh random values

## Cross-Platform Execution Modes

### 1. Pure Browser Rexx
**Local automation within a single JavaScript context**
- Fully inlined parser and interpreter
- No external dependencies
- Direct function call execution
- Ideal for component self-automation

### 2. Cross-Application Addressing Rexx
**Secure scripting across application boundaries**
- Sandboxed iframe isolation (`sandbox="allow-scripts"`)
- Application addressing protocol over postMessage transport
- Asynchronous communication with promise-based responses
- Cross-origin communication without same-origin access

### 3. Nested Rexx-to-Rexx Addressing
**Rexx interpreters addressing other Rexx interpreters**
- Multi-level automation capabilities
- Rexx scripts that generate and execute other Rexx scripts
- Distributed Rexx execution across multiple contexts

## Security Features

### Iframe Sandboxing
- **Blocked**: `parent.document` access
- **Blocked**: `top.location` manipulation
- **Blocked**: Cross-iframe DOM access
- **Blocked**: Same-origin resource access
- **Blocked**: Popup window creation
- **Allowed**: Script execution (controlled)
- **Allowed**: postMessage communication (controlled channel)

### Communication Security
- All cross-application communication via controlled postMessage API
- No direct DOM access between iframes
- Parent frame acts as message router and security boundary
- Application addressing calls include request IDs to prevent confusion/replay

## Advanced Features

### Variable Scoping
- **Loop Variable Scoping**: Automatic backup and restore of loop variables
- **Nested Scope Management**: Proper handling of nested control structures
- **Global Variable Access**: Variables accessible across function calls

### Error Handling
- **Division by Zero Protection**: Automatic error detection
- **Inventory Validation**: Resource availability checking
- **Loop Safety**: Maximum iteration limits to prevent infinite loops
- **Type Validation**: Proper handling of numeric and string conversions

### Expression Evaluation
- **Complex Expressions**: Multi-level mathematical operations
- **Variable Resolution**: Automatic substitution of variable values
- **Object Property Access**: Dotted notation for nested object properties
- **Function Parameter Expressions**: Mathematical expressions as function arguments

## Real-World Usage Examples

### Kitchen Automation Domain
```rexx
-- Check inventory and plan meals with built-in functions
ADDRESS inventory
LET stock = checkStock item=chicken

-- Dynamic meal planning with interpolation and built-ins
LET mealName = UPPER string="chef's special"  -- "CHEF'S SPECIAL"
LET today = DATE                              -- "2025-08-25"
LET timestamp = TIME                          -- "14:30:15"

SELECT
  WHEN stock.quantity >= 8 THEN
    createMeal name="Large {mealName}" chicken=6 note="For {stock.quantity} available on {today}"
    prepareDish name="Victory Feast with {mealName}" servings=8
  WHEN stock.quantity >= 3 THEN
    createMeal name="Medium {mealName}" chicken=3
    LET message = "Prepared {mealName} for moderate inventory at {timestamp}"
    prepareDish name=message servings=4
  OTHERWISE
    LET simpleName = LOWER string=mealName
    prepareDish name="Simple {simpleName}" servings=2
END

-- Mathematical calculations with built-in functions
LET baseServings = 4
LET multiplier = ABS value=stock.quantity    -- Ensure positive value
LET maxServings = MAX x=baseServings y=multiplier z=8  -- Don't exceed 8
LET nameLength = LENGTH string=mealName      -- For loop bounds

DO i = 1 TO MIN(x=maxServings y=nameLength)
  LET itemName = "Batch {i} of {mealName}"
  LET itemLength = LENGTH string=itemName
  prepareDish name=itemName servings=MIN(x=itemLength y=4)
END
```

### Enhanced String Functions

Advanced string processing with regular expression support for modern text manipulation needs.

```rexx
-- Regular Expression Functions
LET email = "user@example.com"
LET isValid = REGEX_TEST string=email pattern="^[^@]+@[^@]+\.[^@]+$"  -- true
LET username = REGEX_MATCH string=email pattern="^[^@]+"  -- "user"
LET cleaned = REGEX_REPLACE string="Hello   World" pattern="\s+" replacement=" "  -- "Hello World"

-- Array-style Operations
LET words = REGEX_SPLIT string="apple,banana,orange" pattern=","  -- ["apple", "banana", "orange"]
LET sentence = JOIN array=words separator=" and "  -- "apple and banana and orange"

-- String Manipulation
LET text = "  Hello World  "
LET trimmed = TRIM string=text  -- "Hello World"
LET leftTrimmed = TRIM_START string=text  -- "Hello World  "
LET rightTrimmed = TRIM_END string=text  -- "  Hello World"

-- Substring Operations
LET part = SUBSTRING string="Hello World" start=6 length=5  -- "World"
LET index = INDEXOF string="Hello World" substring="World"  -- 6
LET hasWorld = INCLUDES string="Hello World" substring="World"  -- true

-- String Testing and Generation
LET startsWithHello = STARTS_WITH string="Hello World" prefix="Hello"  -- true
LET repeated = REPEAT string="Hi! " count=3  -- "Hi! Hi! Hi! "
LET padded = PAD_START string="42" length=5 padString="0"  -- "00042"

-- URL-friendly Slug Generation
LET title = "My Blog Post Title!"
LET slug = SLUG string=title  -- "my-blog-post-title"
```

### Array/Collection Functions

Comprehensive array manipulation and analysis functions for modern data processing workflows.

```rexx
-- Array Creation and Basic Operations
LET numbers = "[1, 2, 3, 4, 5]"
LET fruits = "[\"apple\", \"banana\", \"orange\"]"
LET length = ARRAY_LENGTH array=numbers  -- 5
LET newArray = ARRAY_PUSH array=numbers item=6  -- [1, 2, 3, 4, 5, 6]
LET lastItem = ARRAY_POP array=newArray  -- 6
LET firstItem = ARRAY_SHIFT array=fruits  -- "apple"

-- Array Slicing and Manipulation
LET slice = ARRAY_SLICE array=numbers start=1 end=4  -- [2, 3, 4]
LET combined = ARRAY_CONCAT array1=numbers array2=fruits  -- [1, 2, 3, 4, 5, "apple", "banana", "orange"]
LET reversed = ARRAY_REVERSE array=numbers  -- [5, 4, 3, 2, 1]
LET sorted = ARRAY_SORT array=fruits order=asc  -- ["apple", "banana", "orange"]

-- Array Searching and Testing
LET hasApple = ARRAY_INCLUDES array=fruits item="apple"  -- true
LET appleIndex = ARRAY_INDEXOF array=fruits item="apple"  -- 0
LET foundItem = ARRAY_FIND array=fruits item="banana"  -- "banana"

-- Array Mathematical Operations
LET values = "[10, 5, 15, 3, 8]"
LET minimum = ARRAY_MIN array=values  -- 3
LET maximum = ARRAY_MAX array=values  -- 15
LET sum = ARRAY_SUM array=values  -- 41
LET average = ARRAY_AVERAGE array=values  -- 8.2

-- Array Processing
LET duplicates = "[1, 2, 2, 3, 3, 3, 4]"
LET unique = ARRAY_UNIQUE array=duplicates  -- [1, 2, 3, 4]
LET nested = "[[1, 2], [3, 4], [5, 6]]"
LET flattened = ARRAY_FLATTEN array=nested depth=1  -- [1, 2, 3, 4, 5, 6]

-- Array Functions in Control Flow
DO i = 1 TO ARRAY_LENGTH(array=fruits)
  LET currentFruit = ARRAY_SLICE array=fruits start=0 end=1
  prepareDish name="Fruit salad with {currentFruit[0]}" servings=i
END

-- Complex Data Processing
LET inventory = "[\"apples:10\", \"bananas:5\", \"oranges:8\"]"
LET totalStock = 0
DO i = 0 TO ARRAY_LENGTH(array=inventory) - 1
  LET item = ARRAY_SLICE array=inventory start=i end=i+1
  -- Process inventory item
END
```

### SAY Statement

Console output and debugging capabilities with support for variable interpolation and mixed content formatting.

```rexx
-- Basic Text Output
SAY "Hello World"
SAY "Script started at initialization"

-- Variable Output
LET name = "John"
LET age = 30
SAY name age  -- Output: John 30

-- String Interpolation
LET user = "Alice"
LET score = 95
SAY "Student {user} scored {score} points"  -- Output: Student Alice scored 95 points

-- Mixed Text and Variables
LET count = 5
SAY "Found" count "items in inventory"  -- Output: Found 5 items in inventory

-- Complex Variable Paths
ADDRESS kitchen
LET stock = checkStock item=chicken
SAY "Current stock:" stock.quantity "units"  -- Output: Current stock: 5 units

-- Debugging Workflows
SAY "Starting meal preparation workflow"
SAY "Debug: Retrieved stock info" stock.item stock.quantity

IF stock.quantity >= 3 THEN
  SAY "Sufficient ingredients available"
  createMeal chicken=3 potatoes=2
  SAY "Meal created successfully"
ELSE
  SAY "Insufficient ingredients, only" stock.quantity "available"
  SAY "Falling back to alternative meal"
ENDIF

SAY "Workflow completed"

-- Loop Progress Tracking
LET iterations = 3
SAY "Starting loop with" iterations "iterations"

DO i = 1 TO iterations
  SAY "Processing iteration" i "of" iterations
  -- Do work here
END

SAY "All iterations completed"

-- Conditional Output
LET temperature = 75
IF temperature > 80 THEN
  SAY "Warning: High temperature detected:" temperature "degrees"
ELSE
  SAY "Normal temperature:" temperature "degrees"
ENDIF

-- Integration with Built-in Functions
LET text = "hello world"
LET processed = UPPER string=text
SAY "Original:" text "Processed:" processed

-- Array Processing Output
LET numbers = "[1, 2, 3, 4, 5]"
LET sum = ARRAY_SUM array=numbers
LET average = ARRAY_AVERAGE array=numbers
SAY "Array sum:" sum "Average:" average

-- Single vs Double Quotes
LET name = "John"
SAY 'Hello {name}'    -- Output: Hello {name} (no interpolation)
SAY "Hello {name}"    -- Output: Hello John (with interpolation)

-- Empty Output
SAY ""  -- Outputs blank line
```

### File System Functions

Unified file system operations supporting both localStorage and HTTP resource access. Files are automatically routed based on filename patterns:

- **localStorage files**: Filenames without path separators (e.g., `"config.txt"`, `"data"`)  
- **HTTP resources**: Filenames with path separators (e.g., `"/data/users.csv"`, `"./config/settings.json"`)

**Browser-only**: File operations require localStorage (persistent files) or fetch API (HTTP files).

```rexx
-- localStorage File Operations (no path separators)
LET writeResult = FILE_WRITE filename="config.txt" content="debug=true\nversion=1.0"
LET readResult = FILE_READ filename="config.txt"
SAY "File contains:" readResult.content

-- HTTP Resource Access (with path separators)
LET csvData = FILE_READ filename="/data/users.csv"
LET configData = FILE_READ filename="./config/settings.json" 
LET apiData = FILE_READ filename="../api/endpoints.json"

IF csvData.success THEN
    SAY "CSV loaded: " || csvData.size || " bytes"
    SAY "Content type: " || csvData.contentType
    SAY "URL: " || csvData.url
ENDIF

-- File Status Operations
LET exists = FILE_EXISTS filename="config.txt"
LET size = FILE_SIZE filename="config.txt"
SAY "Config file exists:" exists "Size:" size "bytes"

-- File Management
LET deleteResult = FILE_DELETE filename="oldfile.txt"
LET copyResult = FILE_COPY source="config.txt" destination="config.backup"
LET moveResult = FILE_MOVE source="temp.txt" destination="archive/temp.txt"

-- Append Operations
LET appendResult = FILE_APPEND filename="log.txt" content="New log entry\n"
LET appendNewFile = FILE_APPEND filename="newlog.txt" content="First entry\n"

-- File Listing with Patterns
LET allFiles = FILE_LIST
LET txtFiles = FILE_LIST pattern="*.txt"
LET configFiles = FILE_LIST pattern="config"

-- Backup Operations
LET backupResult = FILE_BACKUP filename="important.txt"
LET customBackup = FILE_BACKUP filename="data.json" suffix=".snapshot"

-- Dynamic File Operations
LET timestamp = NOW
LET logFile = "session_{timestamp}.log"
LET sessionData = "Session started: {timestamp}"

LET writeSession = FILE_WRITE filename=logFile content=sessionData
SAY "Created session file: {logFile}"

-- Configuration Management Workflow
LET configFile = "app.config"
LET originalConfig = "mode=development\ndebug=true"

SAY "Setting up configuration system"
LET setupResult = FILE_WRITE filename=configFile content=originalConfig

SAY "Creating backup before changes"  
LET backupResult = FILE_BACKUP filename=configFile suffix=".original"

SAY "Updating configuration for production"
LET prodConfig = "mode=production\ndebug=false\nssl=true"
LET updateResult = FILE_WRITE filename=configFile content=prodConfig

LET allConfigs = FILE_LIST pattern="*.config*"
SAY "Configuration files:" allConfigs

-- Workflow Automation with File Operations
LET dataDir = "data"
LET reportFile = "{dataDir}/report.txt" 
LET summaryData = ""

DO i = 1 TO 5
  LET entry = "Processing batch {i}\n"
  LET summaryData = summaryData + entry
  
  IF i = 3 THEN
    SAY "Checkpoint reached, backing up progress"
    LET checkpointResult = FILE_WRITE filename="checkpoint.tmp" content=summaryData
  ENDIF
END

LET finalReport = FILE_WRITE filename=reportFile content=summaryData
LET cleanup = FILE_DELETE filename="checkpoint.tmp"
SAY "Report generated: {reportFile}"

-- Error Handling and Validation
LET testFile = "validation.txt"
LET testContent = "Test data for validation"

LET writeTest = FILE_WRITE filename=testFile content=testContent
IF writeTest.success THEN
  SAY "Write successful: {writeTest.bytes} bytes written"
  
  LET readTest = FILE_READ filename=testFile
  IF readTest.success AND readTest.content = testContent THEN
    SAY "Validation passed: file integrity confirmed"
  ELSE
    SAY "Validation failed: content mismatch"
  ENDIF
ELSE
  SAY "Write failed: {writeTest.error}"
ENDIF

-- Log File Management
LET logFile = "application.log"
LET logExists = FILE_EXISTS filename=logFile

IF NOT logExists THEN
  LET initLog = FILE_WRITE filename=logFile content="=== Application Log Started ===\n"
  SAY "Initialized new log file"
ENDIF

LET timestamp = NOW
LET logEntry = "[{timestamp}] Application event occurred\n"
LET appendLog = FILE_APPEND filename=logFile content=logEntry

LET currentSize = FILE_SIZE filename=logFile
IF currentSize > 1000 THEN
  SAY "Log file getting large, creating archive"
  LET archiveName = "application_{timestamp}.log"
  LET archiveResult = FILE_COPY source=logFile destination=archiveName
  LET resetLog = FILE_WRITE filename=logFile content="=== Log Reset ===\n"
ENDIF

-- HTTP vs localStorage Routing Examples
SAY "=== File System Routing Demo ==="

-- These go to localStorage (no path separators)
LET localWrite1 = FILE_WRITE filename="config" content="local data"
LET localWrite2 = FILE_WRITE filename="app.json" content="{}"
LET localExists = FILE_EXISTS filename="config"

-- These access HTTP resources (path separators detected)
LET httpRead1 = FILE_READ filename="/api/data.json"        -- absolute path
LET httpRead2 = FILE_READ filename="./data/users.csv"      -- relative path  
LET httpRead3 = FILE_READ filename="../config/app.ini"     -- parent path
LET httpRead4 = FILE_READ filename="https://example.com/data.txt"  -- full URL

-- FILE_EXISTS also supports HTTP (uses HEAD request)
LET httpExists1 = FILE_EXISTS filename="/api/status.json" 
LET httpExists2 = FILE_EXISTS filename="./manifest.json"

-- FILE_WRITE is restricted to localStorage only (security)
LET writeError = FILE_WRITE filename="/api/upload" content="data"  
-- Returns: {success: false, error: "FILE_WRITE not supported for HTTP resources"}

SAY "Local write success: " || localWrite1.success
SAY "HTTP read success: " || httpRead1.success  
SAY "Write to HTTP blocked: " || writeError.success
```

**File Operation Routing Rules**:
- **localStorage**: Filenames without `/`, `./`, `../`, `http://`, `https://`
- **HTTP GET**: Filenames starting with `/`, `./`, `../`, or full URLs
- **FILE_WRITE constraint**: Only localStorage files can be written (HTTP resources are read-only)
- **FILE_EXISTS**: Supports both localStorage and HTTP (uses HEAD request for HTTP)
- **Error handling**: HTTP operations return detailed error info including status codes

### Validation Functions
Comprehensive data validation functions for input validation, data integrity checking, and format verification in automation workflows.

```rexx
-- Email and URL Validation  
LET emailValid = IS_EMAIL email="user@example.com"
LET urlValid = IS_URL url="https://api.example.com"
SAY "Email valid:" emailValid "URL valid:" urlValid

-- Phone Number Validation (Worldwide Support)
LET phoneUS = IS_PHONE phone="(555) 123-4567" format="US"
LET phoneUK = IS_PHONE phone="+44 20 1234 5678" format="UK"
LET phoneDE = IS_PHONE phone="+49 30 12345678" format="DE"
LET phoneFR = IS_PHONE phone="+33 1 23 45 67 89" format="FR"
LET phoneIN = IS_PHONE phone="+91 98765 43210" format="IN"
LET phoneJP = IS_PHONE phone="+81 90 1234 5678" format="JP"
LET phoneCN = IS_PHONE phone="+86 138 0013 8000" format="CN"
LET phoneAU = IS_PHONE phone="+61 2 1234 5678" format="AU"
LET phoneBR = IS_PHONE phone="+55 11 98765-4321" format="BR"
LET phoneCA = IS_PHONE phone="+1 (416) 123-4567" format="CA"
LET phoneIntl = IS_PHONE phone="+1-555-123-4567" format="international"
LET phoneAny = IS_PHONE phone="5551234567"

-- Number and Range Validation
LET isNumber = IS_NUMBER value="42.5" 
LET inRange = IS_NUMBER value="75" min="0" max="100"
LET isInteger = IS_INTEGER value="42"
LET isPositive = IS_POSITIVE value="10.5"

-- Date and Time Validation
LET validDate = IS_DATE date="2024-03-15"
LET validTime = IS_TIME time="14:30:00"
LET validDateTime = IS_DATE date="2024-03-15T14:30:00"

-- Credit Card Validation (Luhn Algorithm)
LET visaValid = IS_CREDIT_CARD cardNumber="4532015112830366"
LET cardWithSpaces = IS_CREDIT_CARD cardNumber="4532 0151 1283 0366" 
LET cardWithDashes = IS_CREDIT_CARD cardNumber="4532-0151-1283-0366"

-- Postal Code Validation by Country
LET usZip = IS_POSTAL_CODE code="12345" country="US"
LET usZipPlus4 = IS_POSTAL_CODE code="12345-6789" country="US" 
LET ukPostcode = IS_POSTAL_CODE code="SW1A 1AA" country="UK"
LET canadianPostal = IS_POSTAL_CODE code="K1A 0A6" country="CA"

-- Network Address Validation
LET ipv4Valid = IS_IP ip="192.168.1.1"
LET ipv6Valid = IS_IP ip="2001:db8::1" 
LET macValid = IS_MAC_ADDRESS mac="00:1B:44:11:3A:B7"
LET macDashes = IS_MAC_ADDRESS mac="00-1B-44-11-3A-B7"
LET macDots = IS_MAC_ADDRESS mac="001b.4411.3ab7"

-- String Content Validation
LET isAlpha = IS_ALPHA text="HelloWorld"
LET isNumeric = IS_NUMERIC text="12345"
LET isAlphaNum = IS_ALPHANUMERIC text="Hello123"
LET isLowercase = IS_LOWERCASE text="hello world"
LET isUppercase = IS_UPPERCASE text="HELLO WORLD"

-- Pattern Matching
LET matchesPattern = MATCHES_PATTERN text="abc123" pattern="^[a-z]+[0-9]+$"
LET phonePattern = MATCHES_PATTERN text="555-1234" pattern="[0-9]{3}-[0-9]{4}"

-- Empty/Not Empty Validation
LET isEmpty = IS_EMPTY value=""
LET isNotEmpty = IS_NOT_EMPTY value="data"

-- Practical Automation Example
LET userInput = "john.doe@company.com"
LET phoneInput = "555-123-4567"
LET ageInput = "25"

IF IS_EMAIL email=userInput THEN
  SAY "Valid email format"
  
  IF IS_PHONE phone=phoneInput format="US" THEN
    SAY "Valid US phone number"
    
    IF IS_NUMBER value=ageInput min="18" max="65" THEN
      SAY "Valid age for employment"
      -- Proceed with form processing
      ADDRESS api
      submitForm email=userInput phone=phoneInput age=ageInput
    ELSE
      SAY "Age must be between 18 and 65"
    ENDIF
  ELSE  
    SAY "Invalid phone number format"
  ENDIF
ELSE
  SAY "Invalid email format"
ENDIF

-- Data Validation Pipeline
LET userData = '{"email":"test@example.com","phone":"555-1234","age":"30"}'
LET dataValid = TRUE

-- Extract and validate each field
LET emailField = REGEX_EXTRACT text=userData pattern='"email":"([^"]+)"'
LET phoneField = REGEX_EXTRACT text=userData pattern='"phone":"([^"]+)"'  
LET ageField = REGEX_EXTRACT text=userData pattern='"age":"([^"]+)"'

IF NOT IS_EMAIL email=emailField THEN
  SAY "Invalid email in data"
  LET dataValid = FALSE
ENDIF

IF NOT IS_PHONE phone=phoneField THEN
  SAY "Invalid phone in data" 
  LET dataValid = FALSE
ENDIF

IF NOT IS_NUMBER value=ageField min="0" max="120" THEN
  SAY "Invalid age in data"
  LET dataValid = FALSE
ENDIF

IF dataValid THEN
  SAY "All data validation passed"
  -- Process the validated data
ELSE
  SAY "Data validation failed"
ENDIF
```

### Math/Calculation Functions
Advanced mathematical computations, statistical operations, and geometric calculations for data processing and automation workflows.

```rexx
-- Basic Mathematical Operations
LET absoluteValue = MATH_ABS value="-42.5"
LET ceiledValue = MATH_CEIL value="3.14"
LET flooredValue = MATH_FLOOR value="3.89"
LET roundedValue = MATH_ROUND value="3.14159" precision="2"
SAY "Math operations: abs=" absoluteValue "ceil=" ceiledValue "floor=" flooredValue "round=" roundedValue

-- Aggregate Mathematical Operations
LET maxValue = MATH_MAX a="10" b="25" c="15" d="8"
LET minValue = MATH_MIN a="10" b="25" c="15" d="8"
LET sumValue = MATH_SUM a="10" b="25" c="15" d="8"
LET avgValue = MATH_AVERAGE a="10" b="20" c="30" d="40"
SAY "Aggregates: max=" maxValue "min=" minValue "sum=" sumValue "avg=" avgValue

-- Advanced Mathematical Functions
LET powerValue = MATH_POWER base="2" exponent="10"
LET squareRoot = MATH_SQRT value="64"
LET logBase10 = MATH_LOG value="1000" base="10"
LET naturalLog = MATH_LOG value="2.718"
LET factorial8 = MATH_FACTORIAL value="8"
SAY "Advanced: 2^10=" powerValue "√64=" squareRoot "log₁₀(1000)=" logBase10 "8!=" factorial8

-- Trigonometric Functions (Degrees and Radians)
LET sin90 = MATH_SIN value="90" unit="degrees"
LET cos0 = MATH_COS value="0" unit="degrees" 
LET tan45 = MATH_TAN value="45" unit="degrees"
LET sinPi2 = MATH_SIN value="1.5708" unit="radians"
SAY "Trigonometry: sin(90°)=" sin90 "cos(0°)=" cos0 "tan(45°)=" tan45 "sin(π/2)=" sinPi2

-- Statistical and Utility Functions
LET clampedValue = MATH_CLAMP value="150" min="0" max="100"
LET percentValue = MATH_PERCENTAGE value="75" total="300" 
LET randomFloat = MATH_RANDOM min="1.0" max="10.0"
LET randomInt = MATH_RANDOM_INT min="1" max="100"
SAY "Utilities: clamped=" clampedValue "percent=" percentValue "randomInt=" randomInt

-- Number Theory Functions
LET gcdResult = MATH_GCD a="48" b="18"
LET lcmResult = MATH_LCM a="12" b="8"
SAY "Number theory: GCD(48,18)=" gcdResult "LCM(12,8)=" lcmResult

-- 2D Geometry Functions
LET distance = MATH_DISTANCE_2D x1="0" y1="0" x2="3" y2="4"
LET angleDegrees = MATH_ANGLE_2D x1="0" y1="0" x2="1" y2="1" unit="degrees"
LET angleRadians = MATH_ANGLE_2D x1="0" y1="0" x2="1" y2="0" unit="radians"
SAY "Geometry: distance=" distance "angle=" angleDegrees "° or " angleRadians " radians"

-- Data Analysis Automation Example
LET dataSet = '{"values":[23.5, 18.2, 31.7, 45.1, 29.8, 37.4, 22.9]}'
LET processedData = ""

-- Extract and analyze dataset values
LET value1 = 23.5
LET value2 = 18.2  
LET value3 = 31.7
LET value4 = 45.1
LET value5 = 29.8
LET value6 = 37.4
LET value7 = 22.9

-- Statistical analysis
LET dataMax = MATH_MAX a=value1 b=value2 c=value3 d=value4 e=value5 f=value6 g=value7
LET dataMin = MATH_MIN a=value1 b=value2 c=value3 d=value4 e=value5 f=value6 g=value7
LET dataSum = MATH_SUM a=value1 b=value2 c=value3 d=value4 e=value5 f=value6 g=value7
LET dataAvg = MATH_AVERAGE a=value1 b=value2 c=value3 d=value4 e=value5 f=value6 g=value7
LET dataRange = dataMax - dataMin

SAY "Dataset Analysis:"
SAY "  Maximum: " dataMax
SAY "  Minimum: " dataMin  
SAY "  Sum: " dataSum
SAY "  Average: " dataAvg
SAY "  Range: " dataRange

-- Normalize data to 0-1 scale
LET norm1 = MATH_PERCENTAGE value=(value1-dataMin) total=dataRange
LET norm2 = MATH_PERCENTAGE value=(value2-dataMin) total=dataRange
SAY "Normalized values: " norm1 "%, " norm2 "%"

-- Scientific Calculation Example
LET hypothesis = "Calculate trajectory of projectile"
SAY hypothesis

-- Initial conditions
LET velocity = 50  -- m/s
LET angle = 45     -- degrees
LET gravity = 9.81 -- m/s²

-- Calculate velocity components  
LET vx = velocity * MATH_COS value=angle unit="degrees"
LET vy = velocity * MATH_SIN value=angle unit="degrees"

-- Calculate time of flight (simplified)
LET timeOfFlight = 2 * vy / gravity

-- Calculate range
LET range = vx * timeOfFlight

-- Calculate maximum height
LET maxHeight = MATH_POWER base=vy exponent="2" / (2 * gravity)

SAY "Projectile motion results:"
SAY "  Initial velocity: " velocity " m/s at " angle "°"
SAY "  Velocity components: vx=" vx " m/s, vy=" vy " m/s"
SAY "  Time of flight: " timeOfFlight " seconds"
SAY "  Range: " range " meters"
SAY "  Maximum height: " maxHeight " meters"

-- Financial Calculations Example  
LET principal = 10000  -- Initial investment
LET rate = 0.05        -- 5% annual interest
LET years = 10         -- Investment period

-- Compound interest calculation: A = P(1 + r)^t
LET growthFactor = 1 + rate
LET compoundAmount = principal * MATH_POWER base=growthFactor exponent=years
LET interestEarned = compoundAmount - principal
LET effectiveRate = MATH_PERCENTAGE value=interestEarned total=principal

SAY "Investment Analysis:"
SAY "  Principal: $" principal
SAY "  Annual rate: " (rate * 100) "%"  
SAY "  Final amount: $" compoundAmount
SAY "  Interest earned: $" interestEarned
SAY "  Effective return: " effectiveRate "%"

-- Quality Control Statistical Analysis
LET measurements = "Production quality measurements"
SAY measurements

LET sample1 = 98.2
LET sample2 = 99.1
LET sample3 = 97.8
LET sample4 = 100.3
LET sample5 = 98.9

LET sampleAvg = MATH_AVERAGE a=sample1 b=sample2 c=sample3 d=sample4 e=sample5
LET sampleMax = MATH_MAX a=sample1 b=sample2 c=sample3 d=sample4 e=sample5
LET sampleMin = MATH_MIN a=sample1 b=sample2 c=sample3 d=sample4 e=sample5
LET tolerance = 2.0
LET target = 99.0

-- Check if samples are within tolerance
LET upperLimit = target + tolerance
LET lowerLimit = target - tolerance
LET withinSpec = (sampleMax <= upperLimit) AND (sampleMin >= lowerLimit)

SAY "Quality Control Results:"
SAY "  Sample average: " sampleAvg
SAY "  Target: " target " ±" tolerance
SAY "  Range: [" sampleMin ", " sampleMax "]"
SAY "  Within specification: " withinSpec

-- Generate control chart bounds  
LET upperControlLimit = target + (3 * tolerance / 2)
LET lowerControlLimit = target - (3 * tolerance / 2)
SAY "  Control limits: [" lowerControlLimit ", " upperControlLimit "]"
```

### Browser Automation & DOM Functions

RexxJS provides comprehensive DOM manipulation capabilities through two approaches: **selector-based** functions for simple operations and **element-based** functions for efficient repeated operations and complex DOM manipulation.

#### Selector-Based DOM Functions (Simple Operations)

For quick, one-time DOM operations, use selector-based functions:

```rexx
-- Query elements
LET count = DOM_QUERY selector=".items" operation="count"
LET text = DOM_QUERY selector="#title" operation="text"

-- Interact with elements
DOM_CLICK selector="button.submit"
DOM_TYPE selector="input[name=email]" text="user@example.com"
DOM_SET selector="#title" property="textContent" value="New Title"

-- Style manipulation
DOM_ADD_CLASS selector=".card" class="active"
DOM_REMOVE_CLASS selector=".menu" class="hidden"
DOM_SET_STYLE selector=".banner" property="backgroundColor" value="blue"

-- Form operations
DOM_SELECT_OPTION selector="select[name=country]" value="USA"

-- Wait for elements
DOM_WAIT_FOR selector=".loading" condition="hidden" timeout=5000
DOM_WAIT milliseconds=1000  -- Simple delay
```

#### Element-Based DOM Functions (Efficient Operations)

For repeated operations or complex DOM manipulation, use element references to avoid repeated queries:

**Getting Element References:**
```rexx
-- Get single element
LET button = DOM_GET selector="button.submit"
LET form = DOM_GET selector="form#login"

-- Get multiple elements (returns array)
LET inputs = DOM_GET_ALL selector="input"
LET cards = DOM_GET_ALL selector=".card"
```

**Element Properties:**
```rexx
-- Basic properties
LET text = DOM_ELEMENT_TEXT element=button
LET tag = DOM_ELEMENT_TAG element=button          -- "BUTTON"
LET id = DOM_ELEMENT_ID element=button            -- "submit-btn"
LET classes = DOM_ELEMENT_CLASSES element=button  -- Array: ["submit", "primary"]
LET classStr = DOM_ELEMENT_CLASS element=button   -- String: "submit primary"

-- Attributes
LET type = DOM_ELEMENT_GET_ATTR element=button name="type"

-- Visibility and layout
LET visible = DOM_ELEMENT_VISIBLE element=button
LET bounds = DOM_ELEMENT_BOUNDS element=button  -- {x, y, width, height}
```

**Element Manipulation:**
```rexx
-- Click and style
DOM_ELEMENT_CLICK element=button
DOM_ELEMENT_SET_STYLE element=button property="color" value="red"
DOM_ELEMENT_SET_ATTR element=button name="disabled" value="true"
```

**Element Navigation:**
```rexx
-- Navigate DOM tree
LET parent = DOM_ELEMENT_PARENT element=button
LET children = DOM_ELEMENT_CHILDREN element=form
LET filteredChildren = DOM_ELEMENT_CHILDREN element=form selector="input"
LET siblings = DOM_ELEMENT_SIBLINGS element=button
LET next = DOM_ELEMENT_NEXT_SIBLING element=button
LET prev = DOM_ELEMENT_PREV_SIBLING element=button

-- Query within element
LET nested = DOM_ELEMENT_QUERY element=form selector=".error-message"
LET nestedAll = DOM_ELEMENT_QUERY_ALL element=form selector="input"
```

**Creating and Modifying DOM:**
```rexx
-- Create elements
LET newDiv = DOM_CREATE_ELEMENT tag="div"
LET newInput = DOM_CREATE_ELEMENT tag="input"
LET textNode = DOM_CREATE_TEXT text="Hello World"

-- Insert elements
DOM_ELEMENT_APPEND parent=form child=newInput
DOM_ELEMENT_PREPEND parent=form child=newDiv
DOM_ELEMENT_INSERT_BEFORE reference=button new_element=newDiv
DOM_ELEMENT_INSERT_AFTER reference=button new_element=newDiv

-- Remove and clone
DOM_ELEMENT_REMOVE element=button
LET cloned = DOM_ELEMENT_CLONE element=button deep=true
DOM_ELEMENT_REPLACE old_element=button new_element=newButton
```

**Event Handling:**
```rexx
-- Add event listeners
DOM_ELEMENT_ON_CLICK element=button handler="handleClick"
DOM_ELEMENT_ON_CHANGE element=input handler="handleChange"
DOM_ELEMENT_ON_EVENT element=div event="mouseover" handler="handleHover"

-- Remove event listeners
DOM_ELEMENT_OFF_EVENT element=div event="mouseover" handler="handleHover"

-- Trigger events
DOM_ELEMENT_TRIGGER_EVENT element=button event="click"
```

#### Practical DOM Examples

**Form Processing:**
```rexx
-- Process all form inputs efficiently
LET form = DOM_GET selector="form.registration"
LET inputs = DOM_ELEMENT_QUERY_ALL element=form selector="input, select, textarea"

LET formData = '{}'
DO i = 1 TO ARRAY_LENGTH(inputs)
  LET input = inputs.i
  LET name = DOM_ELEMENT_GET_ATTR element=input name="name"
  LET value = DOM_ELEMENT_TEXT element=input
  LET formData = JSON_SET object=formData key=name value=value
END

SAY "Form data: " || JSON_STRINGIFY(formData)
```

**Dynamic UI Building:**
```rexx
-- Build a list dynamically
LET container = DOM_GET selector=".dynamic-content"

DO i = 1 TO 10
  LET item = DOM_CREATE_ELEMENT tag="div"

  -- Set up the item
  LET textNode = DOM_CREATE_TEXT text="Item " || i
  DOM_ELEMENT_APPEND parent=item child=textNode
  DOM_ELEMENT_SET_ATTR element=item name="data-index" value=i
  DOM_ELEMENT_SET_STYLE element=item property="padding" value="10px"

  -- Add to container
  DOM_ELEMENT_APPEND parent=container child=item
END
```

**Table Data Processing:**
```rexx
-- Process table rows efficiently
LET table = DOM_GET selector="table.data"
LET rows = DOM_ELEMENT_QUERY_ALL element=table selector="tbody tr"

DO i = 1 TO ARRAY_LENGTH(rows)
  LET row = rows.i
  LET cells = DOM_ELEMENT_QUERY_ALL element=row selector="td"

  LET name = DOM_ELEMENT_TEXT element=cells.1
  LET status = DOM_ELEMENT_TEXT element=cells.3

  -- Highlight inactive rows
  IF status = "inactive" THEN
    DOM_ELEMENT_SET_STYLE element=row property="backgroundColor" value="#ffcccc"
  ENDIF

  SAY "Processing: " || name || " - " || status
END
```

**Form Validation:**
```rexx
-- Validate form inputs
LET form = DOM_GET selector="form.contact"
LET inputs = DOM_ELEMENT_QUERY_ALL element=form selector="input[required]"
LET isValid = 1

DO i = 1 TO ARRAY_LENGTH(inputs)
  LET input = inputs.i
  LET value = DOM_ELEMENT_TEXT element=input

  IF value = "" THEN
    DOM_ELEMENT_SET_STYLE element=input property="borderColor" value="red"
    LET isValid = 0
  ELSE
    DOM_ELEMENT_SET_STYLE element=input property="borderColor" value="green"
  ENDIF
END

LET submitBtn = DOM_ELEMENT_QUERY element=form selector="button[type=submit]"
IF isValid THEN
  DOM_ELEMENT_SET_ATTR element=submitBtn name="disabled" value=""
ELSE
  DOM_ELEMENT_SET_ATTR element=submitBtn name="disabled" value="true"
ENDIF
```

**Key Benefits of Element-Based Functions:**
- ✅ **Performance**: Query once, use many times
- ✅ **Navigation**: Move through DOM tree relationships
- ✅ **Complex Operations**: Build dynamic UIs programmatically
- ✅ **Stale Detection**: Automatic handling of removed elements
- ✅ **Memory Efficient**: Opaque references with automatic cleanup

## Security & Hashing Functions

The interpreter includes security and hashing functions that leverage browser-native Web Cryptography API when available, with fallbacks for Node.js and limited environments. These functions appear built-in but adapt to the runtime environment.

### Hashing Functions

#### SHA-256 Hashing
```rexx
-- Generate SHA-256 hash (uses Web Cryptography API in browser)
LET hash = HASH_SHA256 text="password123"
-- Returns: "ef92b778bafe771e89245b89ecbc6b64..."

-- Hash sensitive data
LET userHash = HASH_SHA256 text=userEmail
LET documentHash = HASH_SHA256 data=documentContent
```

#### SHA-1 Hashing
```rexx
-- Generate SHA-1 hash (uses Web Cryptography API in browser)
LET hash = HASH_SHA1 text="data"
-- Returns: "a17c9aaa61e80a1bf71d0d850af4e5ba..."

-- Legacy system compatibility
LET legacyHash = HASH_SHA1 text=legacyData
```

#### MD5 Hashing
```rexx
-- Generate MD5 hash (requires CryptoJS library or Node.js)
LET hash = HASH_MD5 text="content"

-- Falls back to non-cryptographic hash if MD5 not available
-- Returns simple hash or "HASH_ERROR" if completely unavailable
```

### Encoding Functions

#### Base64 Encoding/Decoding
```rexx
-- Encode to base64 (uses btoa in browser, Buffer in Node.js)
LET encoded = BASE64_ENCODE text="Hello World!"
-- Returns: "SGVsbG8gV29ybGQh"

-- Decode from base64
LET decoded = BASE64_DECODE encoded="SGVsbG8gV29ybGQh"
-- Returns: "Hello World!"

-- Handle binary data
LET imageData = FILE_READ filename="image.png"
LET base64Image = BASE64_ENCODE data=imageData
```

#### URL-Safe Base64
```rexx
-- Create URL-safe base64 (no +, /, or = characters)
LET urlSafe = URL_SAFE_BASE64 text="data+with/special=chars"
-- Returns base64 with - instead of +, _ instead of /, no padding

-- Use for URL parameters
LET token = URL_SAFE_BASE64 text=sessionData
prepareDish name="redirect?token={token}"
```

### Random Generation

#### Secure Random Strings
```rexx
-- Generate random strings (uses crypto.getRandomValues when available)
LET sessionId = RANDOM_STRING length=32 charset="alphanumeric"
LET apiKey = RANDOM_STRING length=40 charset="hex"
LET pin = RANDOM_STRING length=6 charset="numeric"

-- Charset options:
-- "alpha" - Letters only
-- "numeric" - Numbers only  
-- "alphanumeric" - Letters and numbers
-- "hex" - Hexadecimal (0-9, a-f)
-- "base64" - Base64 characters
-- Custom - Any string of characters to use

-- Custom charset example
LET code = RANDOM_STRING length=8 charset="ABCDEFG123456"
```

### JWT Handling

#### JWT Decoding
```rexx
-- Decode JWT tokens (no signature verification)
LET token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
LET decoded = JWT_DECODE token=token

-- Access JWT parts
LET header = decoded.header  -- {alg: "HS256", typ: "JWT"}
LET payload = decoded.payload  -- {sub: "1234", name: "John", iat: 1516239022}
LET signature = decoded.signature  -- "SflKxwRJSMeKKF2QT4..."

-- Check JWT claims
IF payload.exp < NOW_TIMESTAMP
  SAY "Token expired"
ENDIF
```

### HMAC Functions

#### HMAC-SHA256
```rexx
-- Generate HMAC signature (uses Web Crypto API when available)
LET signature = HMAC_SHA256 text="message" secret="secret-key"

-- API request signing
LET timestamp = NOW_TIMESTAMP
LET payload = '{"action":"transfer","amount":100}'
LET apiSignature = HMAC_SHA256 text=payload secret=apiSecret
```

### Password Functions

#### Password Hashing and Verification
```rexx
-- Hash password with salt (auto-generates salt)
LET hashedPassword = PASSWORD_HASH password="user-password" algorithm="SHA256"
-- Returns: "sha256$randomsalt$hashedvalue"

-- Verify password against hash
LET isValid = PASSWORD_VERIFY password="user-input" hash=hashedPassword
-- Returns: true or false

-- Support different algorithms
LET sha1Hash = PASSWORD_HASH password="pass" algorithm="SHA1"
```

### Environment Detection

The crypto functions automatically detect and use available APIs:

```rexx
-- Browser environment
-- Uses: Web Crypto API (crypto.subtle)
-- Uses: btoa/atob for base64
-- Uses: crypto.getRandomValues for secure random

-- Node.js environment  
-- Uses: require('crypto') module
-- Uses: Buffer for base64
-- Uses: crypto.randomBytes for secure random

-- Limited environment
-- Throws: Error with clear message about what's missing
-- Random: Falls back to Math.random() (always available)
```

### Security Examples

#### API Authentication
```rexx
-- Generate API credentials
LET apiKey = RANDOM_STRING length=32 charset="hex"
LET apiSecret = RANDOM_STRING length=64 charset="base64"

-- Sign API request
LET timestamp = NOW_TIMESTAMP
LET method = "POST"
LET path = "/api/v1/orders"
LET body = '{"product":"widget","quantity":5}'
LET signatureBase = method + path + timestamp + body
LET signature = HMAC_SHA256 text=signatureBase secret=apiSecret

-- Make authenticated request
ADDRESS api
POST url=path headers='{"X-API-Key":"{apiKey}","X-Signature":"{signature}","X-Timestamp":"{timestamp}"}' body=body
```

#### Session Management
```rexx
-- Create secure session
LET sessionId = RANDOM_STRING length=32 charset="alphanumeric"
LET sessionData = '{"userId":123,"role":"admin"}'
LET sessionToken = BASE64_ENCODE text=sessionData
LET sessionHash = HASH_SHA256 text=sessionToken

-- Store session
FILE_WRITE filename="session_{sessionId}.json" content=sessionData

-- Verify session
LET storedData = FILE_READ filename="session_{sessionId}.json"
LET verifyHash = HASH_SHA256 text=storedData
IF verifyHash = sessionHash
  SAY "Session valid"
ELSE
  SAY "Session tampered"
ENDIF
```

#### Data Integrity
```rexx
-- Calculate file checksum
LET fileContent = FILE_READ filename="important.doc"
LET checksum = HASH_SHA256 text=fileContent

-- Verify file integrity later
LET currentContent = FILE_READ filename="important.doc"
LET currentChecksum = HASH_SHA256 text=currentContent
IF currentChecksum = checksum
  SAY "File unchanged"
ELSE
  SAY "File modified"
ENDIF
```

### Error Handling

Crypto functions throw proper errors when not available or given invalid input:

```rexx
-- Functions will throw if crypto not available
-- This ensures you know immediately if crypto is missing
-- rather than silently getting wrong results

-- JWT error handling (returns object with error property)
LET decoded = JWT_DECODE token=userToken
IF decoded.error
  SAY "Invalid JWT: {decoded.error}"
ENDIF

-- Invalid base64 will throw an error
-- This prevents silent data corruption
LET data = BASE64_DECODE encoded=userInput
-- Throws: "Invalid base64 input: ..." if malformed

-- Missing crypto will throw clear errors
LET hash = HASH_SHA256 text="password"
-- Throws: "SHA256 hashing not available in this environment"

-- MD5 requires external library
LET md5 = HASH_MD5 text="data"  
-- Throws: "MD5 hashing not available - requires CryptoJS library or Node.js"
```

## Excel/Google Sheets Functions

The interpreter includes a comprehensive set of Excel/Google Sheets-compatible functions for spreadsheet-like data analysis, calculations, and automation workflows.

### Logical Functions

#### IF Function
```rexx
-- Basic conditional logic
LET result = IF condition=true trueValue="Yes" falseValue="No"
LET grade = IF score>90 trueValue="A" falseValue="B"
```

#### AND Function  
```rexx
-- Multiple condition AND logic
LET allTrue = AND a=true b=true c=true
LET qualified = AND age>=18 hasLicense=true experience>=2
```

#### OR Function
```rexx  
-- Multiple condition OR logic
LET anyTrue = OR a=false b=true c=false
LET eligible = OR premium=true loyalty>=5 referral=true
```

#### NOT Function
```rexx
-- Logical negation
LET opposite = NOT value=true
LET inactive = NOT status="active"
```

### Statistical Functions

#### Basic Statistics
```rexx
-- Calculate averages
LET average = AVERAGE a=10 b=20 c=30 d=40
LET mean = AVERAGE values="[10, 15, 20, 25, 30]"

-- Find median value  
LET median = MEDIAN a=1 b=2 c=3 d=4 e=5
LET middle = MEDIAN data="[100, 200, 300, 400, 500]"

-- Calculate standard deviation
LET stdev = STDEV a=2 b=4 c=4 d=4 e=5 f=5 g=7 h=9
LET variance = VAR sample="[1, 2, 3, 4, 5]"
```

#### Advanced Statistics
```rexx
-- Mode calculation
LET mostFrequent = MODE a=1 b=2 c=2 d=3 e=2
LET commonValue = MODE dataset="[5, 7, 7, 8, 7, 9]"

-- Percentile calculations
LET p75 = PERCENTILE array="[1,2,3,4,5,6,7,8,9,10]" k=0.75
LET quartile = PERCENTILE data="[10,20,30,40,50]" percentile=0.25
```

### Lookup Functions

#### VLOOKUP Function
```rexx
-- Vertical lookup in tables
LET tableData = '[["A",1],["B",2],["C",3]]'
LET result = VLOOKUP lookupValue="B" tableArray=tableData columnIndex=2

-- Approximate match lookup
LET priceTable = '[["Basic",100],["Premium",200],["Enterprise",500]]'
LET price = VLOOKUP plan="Premium" tableArray=priceTable columnIndex=2
```

#### HLOOKUP Function
```rexx
-- Horizontal lookup in tables  
LET horizontalTable = '[["Q1","Q2","Q3","Q4"],[100,200,300,400]]'
LET quarterValue = HLOOKUP lookupValue="Q3" tableArray=horizontalTable rowIndex=2
```

#### INDEX and MATCH Functions
```rexx
-- Direct array indexing
LET valueAtIndex = INDEX array="[10,20,30,40,50]" row=3

-- Find position of value
LET position = MATCH lookupValue=30 lookupArray="[10,20,30,40,50]"
```

### Text Functions

#### String Manipulation
```rexx
-- Concatenate strings
LET fullName = CONCATENATE firstName="John" separator=" " lastName="Doe"
LET combined = CONCATENATE a="Hello" b=" " c="World"

-- Extract substrings
LET leftPart = LEFT text="Hello World" numChars=5
LET rightPart = RIGHT text="Hello World" numChars=5  
LET midPart = MID text="Hello World" startNum=7 numChars=5

-- String length and formatting
LET length = LEN text="Hello World"
LET upper = EXCEL_UPPER text="hello world"
LET lower = EXCEL_LOWER text="HELLO WORLD"
LET proper = PROPER text="hello world"
LET trimmed = EXCEL_TRIM text="  spaced text  "
```

#### String Replacement
```rexx
-- Text substitution
LET replaced = SUBSTITUTE text="Hello World" oldText="World" newText="Excel"
LET updated = SUBSTITUTE original="abc-def-ghi" find="-" replace="_"
```

### Date Functions

#### Date Operations
```rexx
-- Current date functions
LET today = TODAY
LET currentDateTime = EXCEL_NOW

-- Date component extraction
LET currentYear = YEAR date=today
LET currentMonth = MONTH date=today  
LET currentDay = DAY date=today
LET dayOfWeek = WEEKDAY date=today
```

### Financial Functions

#### Loan Calculations
```rexx
-- Monthly payment calculation
LET monthlyPayment = PMT rate=0.005 nper=360 pv=200000

-- Future value calculation
LET futureValue = FV rate=0.08 nper=10 pmt=1000

-- Present value calculation  
LET presentValue = PV rate=0.1 nper=5 pmt=1000
```

#### Investment Analysis
```rexx
-- Net Present Value
LET npvResult = NPV rate=0.1 a=-1000 b=200 c=300 d=400 e=500

-- Internal Rate of Return (using Newton-Raphson method)
LET irrResult = IRR values="[-1000,200,300,400,500]" guess=0.1
```

### Data Analysis Examples

#### Sales Performance Analysis
```rexx
-- Sales data analysis
LET salesAverage = AVERAGE q1=50000 q2=60000 q3=55000 q4=75000
LET salesStdev = STDEV q1=50000 q2=60000 q3=55000 q4=75000
LET topPerformer = IF condition=(q4>salesAverage) trueValue="Exceeded Target" falseValue="Below Target"
LET variability = VAR q1=50000 q2=60000 q3=55000 q4=75000

SAY "Sales Analysis Results:"
SAY "  Average: {salesAverage}"  
SAY "  Standard Deviation: {salesStdev}"
SAY "  Q4 Performance: {topPerformer}"
```

#### Product Pricing Analysis
```rexx
-- Dynamic pricing based on market data
LET priceTable = '[["Basic",99],["Standard",199],["Premium",399],["Enterprise",999]]'
LET customerTier = "Premium" 
LET basePrice = VLOOKUP lookupValue=customerTier tableArray=priceTable columnIndex=2

-- Apply volume discount
LET volumeDiscount = IF condition=(quantity>100) trueValue=0.15 falseValue=0.05
LET finalPrice = basePrice * (1 - volumeDiscount)

SAY "Pricing Analysis:"
SAY "  Customer Tier: {customerTier}"
SAY "  Base Price: ${basePrice}"
SAY "  Final Price: ${finalPrice}"
```

#### Financial Planning
```rexx
-- Retirement planning calculation
LET monthlyContribution = 500
LET annualRate = 0.07
LET monthlyRate = annualRate / 12
LET years = 30
LET totalPeriods = years * 12

-- Calculate future value of annuity
LET retirementFund = FV rate=monthlyRate nper=totalPeriods pmt=monthlyContribution

-- Calculate required present value for target
LET targetAmount = 1000000
LET requiredPV = PV rate=monthlyRate nper=totalPeriods pmt=monthlyContribution fv=targetAmount

SAY "Retirement Planning:"
SAY "  Monthly Contribution: ${monthlyContribution}"
SAY "  Projected Value: ${retirementFund}"
SAY "  Additional Required: ${requiredPV}"
```

### Error Handling

Excel functions include comprehensive error handling:

## Dynamic Code Execution

### INTERPRET Statement

RexxJS Rexx provides multiple modes of dynamic code execution with different security and scoping models:

| Syntax | Variable Access | Use Cases |
|--------|----------------|----------|
| `INTERPRET "code"` | Full bidirectional sharing | Quick scripting, template processing, legacy code |
| `INTERPRET "code" WITH ISOLATED` | No variable access | Secure execution, untrusted code, sandboxing |
| `INTERPRET "code" WITH ISOLATED (var1 var2)` | Controlled input only | Data processing with specific inputs |
| `INTERPRET "code" WITH ISOLATED EXPORT(result)` | Controlled output only | Computed results without input access |
| `INTERPRET "code" WITH ISOLATED (inputs...) EXPORT(outputs...)` | Full control of I/O | Complex data processing with security |
| `NO-INTERPRET` / `NO_INTERPRET` | Blocks all INTERPRET | High-security environments |

#### Classic INTERPRET (Full Variable Sharing)

Traditional Rexx-style INTERPRET with complete variable sharing:

```rexx
-- Classic INTERPRET statement (full sharing)
LET baseValue = 100
INTERPRET "LET result = baseValue * 2"
SAY "Result: " || result              -- "Result: 200"

-- Multi-line execution
LET script = "LET a = 10\\nLET b = 20\\nLET sum = a + b"
INTERPRET script
SAY "Sum: " || sum                    -- "Sum: 30"

-- Bidirectional variable sharing
LET original = "start"
INTERPRET "LET modified = original || \" processed\"\\nLET new_var = \"created\""
SAY modified                          -- "start processed"
SAY new_var                          -- "created"
```

#### Isolated INTERPRET (Sandboxed Execution)

Sandboxed execution with no variable sharing by default:

```rexx
-- Isolated execution prevents variable leakage
LET secret = "confidential"
INTERPRET "LET isolated_var = \"safe\"\\nLET leaked = secret" WITH ISOLATED

-- isolated_var and leaked are not accessible in parent scope
-- secret remains protected from the isolated code
```

#### Isolated INTERPRET with Import/Export (Controlled Variable Flow)

Control exactly which variables flow in and out of isolated scope:

```rexx
-- Import multiple variables, export single result  
LET price = 100
LET tax_rate = 0.08
LET discount = 10
INTERPRET "LET total = (price - discount) * (1 + tax_rate)" WITH ISOLATED (price tax_rate discount) EXPORT(total)
SAY "Total: " || total               -- "Total: 97.2"

-- Multiple imports and exports
LET base = 10
LET multiplier = 3
LET offset = 5
LET processing = "LET result1 = base * multiplier\\nLET result2 = result1 + offset\\nLET debug = base || \" * \" || multiplier || \" + \" || offset || \" = \" || result2"
INTERPRET processing WITH ISOLATED (base multiplier offset) EXPORT(result1 result2 debug)

SAY "Result1: " || result1           -- "Result1: 30"  
SAY "Result2: " || result2           -- "Result2: 35"
SAY "Debug: " || debug               -- "Debug: 10 * 3 + 5 = 35"

-- Data processing with controlled access
LET users = JSON_PARSE text='[{"name":"John","age":30},{"name":"Jane","age":25}]'
LET min_age = 26
LET filter_code = "LET filtered = []\\nLET count = ARRAY_LENGTH array=users\\nDO i = 1 TO count\\n  LET user = ARRAY_GET array=users index=i\\n  IF ARRAY_GET(array=user key=\"age\") >= min_age THEN\\n    LET filtered = ARRAY_PUSH array=filtered item=user\\n  ENDIF\\nEND\\nLET result_count = ARRAY_LENGTH array=filtered"

INTERPRET filter_code WITH ISOLATED (users min_age) EXPORT(filtered result_count)
SAY "Filtered: " || result_count || " users"
```

### Variable Whitelisting

Control which variables are accessible to interpreted code:

```rexx
-- Set up data
LET publicData = "accessible"
LET secretKey = "confidential"
LET userId = 12345

-- Only allow access to specific variables
LET options = JSON_STRINGIFY data='{
  "shareVars": true,
  "allowedVars": ["publicData", "userId"]
}'

LET code = "LET result = publicData || \" for user \" || userId\\nLET leaked = secretKey"
INTERPRET string=code options=options

SAY result     -- "accessible for user 12345" 
SAY leaked     -- "secretKey" (treated as literal since not whitelisted)
```

### Variable Isolation

Disable variable sharing for complete isolation:

```rexx
LET mainVar = "main scope"

LET isolatedOptions = '{"shareVars": false}'
LET isolatedCode = "LET isolated = \"created\"\\nLET accessed = mainVar"

INTERPRET string=isolatedCode options=isolatedOptions

-- isolated variable not available in main scope
-- accessed becomes literal "mainVar" since variable sharing disabled
```

### Built-in Function Access

INTERPRET has full access to all 259+ built-in functions:

```rexx
-- Dynamic data processing
LET processingScript = "
  LET rawData = '[{\"name\":\"john\",\"score\":85},{\"name\":\"jane\",\"score\":92}]'
  LET parsed = JSON_PARSE text=rawData
  LET count = ARRAY_LENGTH array=parsed
  LET firstUser = ARRAY_GET array=parsed index=1
  LET firstName = UPPER string=ARRAY_GET(array=firstUser key=\"name\")
  LET timestamp = NOW
"

INTERPRET string=processingScript
SAY "Processed " || count || " users at " || timestamp
SAY "First user: " || firstName
```

### Error Handling in INTERPRET

INTERPRET properly propagates parsing and runtime errors:

```rexx
SIGNAL ON ERROR NAME InterpretError

-- This will fail and trigger error handler
INTERPRET string="LET invalid = NONEXISTENT_FUNCTION()"

SAY "This won't execute"
EXIT

InterpretError:
SAY "INTERPRET failed: " || ERROR_MESSAGE
SAY "Error in function: " || ERROR_FUNCTION
SAY "Error context: " || ERROR_VARIABLES
```

### Dynamic Programming Patterns

Use INTERPRET for meta-programming and code generation:

```rexx
-- Generate repetitive code dynamically
LET fields = '["name", "email", "phone", "address"]'
LET fieldArray = JSON_PARSE text=fields
LET fieldCount = ARRAY_LENGTH array=fieldArray

LET validationCode = ""
DO i = 1 TO fieldCount
  LET field = ARRAY_GET array=fieldArray index=i
  LET check = "IF " || field || " = \"\" THEN\\n  SAY \"" || field || " is required\"\\nENDIF\\n"
  LET validationCode = validationCode || check
END

-- Execute the generated validation code
INTERPRET string=validationCode
```

### Address Context Sharing

INTERPRET inherits the current ADDRESS context:

```rexx
ADDRESS calculator
INTERPRET string="press button=5\\npress button=\"+\"\\npress button=3\\npress button=\"=\""
LET result = INTERPRET string="LET total = getDisplay"
SAY "Calculator result: " || total
```

### NO-INTERPRET Security Control

Disable INTERPRET functionality for security-sensitive environments:

```rexx
-- Normal operation
LET result1 = INTERPRET string="LET safe = 42"
SAY "Before: " || safe                -- "Before: 42"

-- Block all INTERPRET operations
NO-INTERPRET

-- Both function and statement forms are blocked
LET result2 = INTERPRET string="LET blocked = 1"  -- Throws error
INTERPRET "LET also_blocked = 2"                  -- Throws error

-- NO_INTERPRET (underscore variant) also supported
NO_INTERPRET
```

**Use cases for NO-INTERPRET:**
- Secure execution environments
- Code sandboxing
- Preventing dynamic code injection
- Compliance with security policies
- Template systems with restricted capabilities

### Performance Considerations

- INTERPRET creates a new interpreter instance for each call
- Variable sharing is controlled and efficient  
- Large code blocks are supported with good performance
- Error handling has minimal overhead when no errors occur
- Classic INTERPRET has fastest variable sharing
- Isolated INTERPRET provides security at minimal performance cost
- Export syntax adds negligible overhead

### INTERPRET API Reference

**Classic INTERPRET - Full Variable Sharing:**
```rexx
INTERPRET codeString                -- Execute with complete variable access
INTERPRET "LET result = var1 + var2"
```

**Isolated INTERPRET - No Variable Sharing:**
```rexx  
INTERPRET codeString WITH ISOLATED  -- Execute in sandbox
INTERPRET "LET safe = 42" WITH ISOLATED
```

**Isolated with Import - Controlled Input:**
```rexx
INTERPRET codeString WITH ISOLATED (var1 var2 var3)
INTERPRET "LET sum = a + b + c" WITH ISOLATED (a b c)
```

**Isolated with Export - Controlled Output:**
```rexx
INTERPRET codeString WITH ISOLATED EXPORT(result1 result2)
INTERPRET "LET x = 10\\nLET y = 20" WITH ISOLATED EXPORT(x y)
```

**Isolated with Import and Export - Full Control:**
```rexx  
INTERPRET codeString WITH ISOLATED (input1 input2) EXPORT(output1 output2)
INTERPRET "LET sum = a + b\\nLET product = a * b" WITH ISOLATED (a b) EXPORT(sum product)
```

**Security Control:**
```rexx
NO-INTERPRET        -- Block all INTERPRET operations (hyphen form)
NO_INTERPRET        -- Block all INTERPRET operations (underscore form)
```

**Legacy Function Form (still supported):**
```rexx
LET result = INTERPRET string=codeString options='{"shareVars": true}'
```

```rexx
-- Functions return appropriate defaults on errors
LET safeDivision = AVERAGE a="invalid" b="text"  -- Returns 0
LET emptyLookup = VLOOKUP lookupValue="missing" tableArray='[]'  -- Returns null
LET invalidDate = YEAR date="not-a-date"  -- Returns current year

-- Use conditional logic for robust calculations
LET result = IF condition=(value>0) trueValue=(100/value) falseValue=0
```

## Implementation Architecture

### Parser Features
- **Multi-line Script Support**: Handles complex scripts with blank lines and comments
- **Expression Parsing**: Full mathematical expression parser with precedence
- **String Interpolation Detection**: Automatic detection of `{variable}` patterns
- **Control Flow Parsing**: Nested IF, DO, and SELECT statement parsing
- **Function Parameter Parsing**: Complex parameter value parsing with expressions

### Interpreter Features
- **Application Integration**: Seamless cross-application communication
- **Variable Management**: Efficient variable storage and retrieval
- **Expression Evaluation**: Complete mathematical expression evaluation
- **String Interpolation**: Dynamic string generation with variable substitution
- **Control Flow Execution**: Proper execution of nested control structures

### Test Coverage
- **253 Comprehensive Tests**: Covering all language features
- **Parser Tests**: String interpolation, expressions, control flow, built-in functions, JSON handling, URL processing, UUID generation, enhanced string functions, array operations, SAY statements
- **Interpreter Tests**: Variable management, application addressing calls, built-in functions, JSON processing, URL/Web operations, UUID/ID generation, enhanced string processing, array/collection manipulation, SAY statement execution, file system operations, Excel/Google Sheets functions, complex scenarios
- **Integration Tests**: End-to-end script execution
- **Cross-iframe Tests**: Browser automation scenarios  
- **Built-in Function Tests**: String manipulation, math operations, utility functions, JSON operations, URL/Web processing, UUID/ID generation, enhanced string functions with regex support, comprehensive array/collection functions, modern file system operations, Excel/Google Sheets functions (logical, statistical, lookup, text, date, financial)
- **SAY Statement Tests**: Console output, variable interpolation, mixed content formatting, control flow integration
- **File System Tests**: Data persistence, file operations, backup management, workflow automation
- **Excel/Google Sheets Function Tests**: Logical operations (IF, AND, OR, NOT), statistical calculations (AVERAGE, MEDIAN, STDEV, VAR, MODE, PERCENTILE), lookup functions (VLOOKUP, HLOOKUP, INDEX, MATCH), text manipulation (CONCATENATE, LEFT, RIGHT, MID, LEN, EXCEL_UPPER, EXCEL_LOWER, PROPER, EXCEL_TRIM, SUBSTITUTE), date operations (TODAY, EXCEL_NOW, YEAR, MONTH, DAY, WEEKDAY), financial calculations (PMT, FV, PV, NPV, IRR)

This feature set makes RexxJS Rexx a powerful, embeddable scripting language suitable for automation tasks, cross-application communication, complex decision-making workflows, modern data processing with comprehensive JSON support, URL/Web integration for API automation, cryptographically secure UUID/ID generation for distributed systems, string interpolation capabilities, advanced string processing with regex support for text manipulation, comprehensive array/collection functions for data analysis and manipulation, debugging and logging capabilities with the SAY statement, modern file system operations for data persistence and configuration management, Excel/Google Sheets-compatible functions for spreadsheet-like data analysis and financial calculations, and extensive built-in function library for client-side operations.