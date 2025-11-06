# Basic Syntax

Fundamental language constructs and variable management in RexxJS Rexx.

## Variable Management

### Variable Assignment
```rexx
LET variable = value
LET result = functionName param=value
```

**Examples:**
```rexx
LET name = "John"
LET age = 30
LET total = calculateTax amount=100 rate=0.08
```

### Variable Substitution
Variables are automatically resolved in function parameters and expressions:

```rexx
LET base = 10
LET multiplier = 3
LET result = base + multiplier * 4    -- Evaluates to 22
createMeal potatoes=base*2 chicken=result/5
```

## Function Calls

### Basic Function Calls
```rexx
functionName param1=value1 param2=value2
```

**Examples:**
```rexx
-- String functions
LET upper = UPPER string="hello world"
LET length = LENGTH string=upper

-- Math functions  
LET maximum = MAX x=10 y=25 z=15
LET absolute = ABS value=-42

-- Utility functions
LET today = DATE
LET timestamp = NOW
```

### Parameter Types
Functions support multiple parameter types:

```rexx
-- Strings (quoted)
DOM_TYPE selector="#input" text="Hello World"

-- Numbers (unquoted)
LET result = MATH_POWER base=2 exponent=10

-- Booleans
LET valid = IS_EMAIL email="user@example.com"

-- Expressions
LET calculated = MAX x=base*2 y=multiplier+5 z=10
```

## Mathematical Expressions

### Full Arithmetic Support
- **Basic Operators**: `+`, `-`, `*`, `/`
- **Operator Precedence**: Proper mathematical precedence
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

## String Interpolation

### Variable Interpolation in Strings
Use `{variable}` syntax for dynamic string content:

```rexx
LET mealName = 'Special Dinner'
LET guest = 'VIP'

-- Basic interpolation
prepareDish name="Today's {mealName}" servings=4

-- Multiple variables
LET greeting = "Welcome {firstName} {lastName}"

-- Complex variable paths
LET status = "Current stock: {stock.quantity} units"
```

### Configurable Interpolation Patterns

RexxJS supports multiple interpolation patterns that can be switched globally:

```rexx
-- Default RexxJS pattern: {variable} (default)
LET name = "Alice"
SAY "Hello {name}"

-- Switch to Handlebars pattern: {{variable}}
INTERPOLATION HANDLEBARS
SAY "Hello {{name}}"

-- Switch to Shell pattern: ${variable}
INTERPOLATION SHELL  
SAY "Hello ${name}"

-- Switch to Batch pattern: %variable%
INTERPOLATION BATCH
SAY "Hello %name%"

-- Reset to default
INTERPOLATION DEFAULT
```

**Available Patterns:**
- `DEFAULT` or `REXX`: `{variable}` (default)
- `HANDLEBARS`: `{{variable}}`
- `SHELL`: `${variable}`
- `BATCH`: `%variable%`
- `CUSTOM`: `$$variable$$`
- `BRACKETS`: `[variable]`

### Creating Custom Interpolation Patterns

#### INTERPOLATION PATTERN Statement

Create custom interpolation patterns with the `INTERPOLATION PATTERN` statement:

```rexx
-- Syntax: INTERPOLATION PATTERN name=NAME start="delimiter" end="delimiter"
INTERPOLATION PATTERN name=ANGLES start="<<" end=">>"
INTERPOLATION PATTERN name=PIPES start="|" end="|"
INTERPOLATION PATTERN name=RUBY start="#{" end="}"
```

#### Using Custom Patterns

After defining a custom pattern, switch to it using the pattern name:

```rexx
-- Define custom pattern
INTERPOLATION PATTERN name=ANGLES start="<<" end=">>"

-- Switch to the custom pattern
INTERPOLATION ANGLES
LET user = "Bob"
SAY "User: <<user>>"  -- Outputs: User: Bob

-- Define and use another pattern
INTERPOLATION PATTERN name=PIPES start="|" end="|"
INTERPOLATION PIPES
SAY "Status: |user| is active"  -- Outputs: Status: Bob is active

-- Switch back to default
INTERPOLATION DEFAULT
SAY "Back to {user}"  -- Outputs: Back to Bob
```

#### Custom Pattern Examples

```rexx
-- Ruby-style interpolation
INTERPOLATION PATTERN name=RUBY start="#{" end="}"
INTERPOLATION RUBY
LET count = 5
SAY "Found #{count} items"  -- Outputs: Found 5 items

-- Angle bracket style
INTERPOLATION PATTERN name=XML start="<%" end="%>"
INTERPOLATION XML
LET title = "Welcome"
SAY "<%title%> to our site"  -- Outputs: Welcome to our site

-- Double pipe style
INTERPOLATION PATTERN name=WIKI start="||" end="||"
INTERPOLATION WIKI
LET page = "HomePage"
SAY "Visit ||page|| for more info"  -- Outputs: Visit HomePage for more info
```

#### Pattern Validation

Custom patterns must:
- Have unique names (case-insensitive)
- Use non-empty start and end delimiters
- Not conflict with existing pattern names

```rexx
-- ✅ Valid custom patterns
INTERPOLATION PATTERN name=CUSTOM1 start="@@" end="@@"
INTERPOLATION PATTERN name=SPECIAL start="<?" end="?>"

-- ❌ Invalid patterns (will cause errors)
INTERPOLATION PATTERN name=DEFAULT start="[" end="]"  -- Reserved name
INTERPOLATION PATTERN name=EMPTY start="" end="]"     -- Empty delimiter
```

### Interpolation Features
- **Complex Variable Paths**: `{object.property}` notation
- **Missing Variable Handling**: Placeholder preserved if variable not found
- **Control Flow Integration**: Works within IF/DO/SELECT statements
- **Numeric Variable Support**: Automatic string conversion
- **Pattern Switching**: Change delimiters globally with `INTERPOLATION` statement
- **Custom Delimiters**: Create your own patterns with `INTERPOLATION PATTERN`

## HEREDOC Strings

### Multi-line String Literals
Use HEREDOC syntax for multi-line content with custom delimiters:

```rexx
LET content = <<DELIMITER
Multi-line content
can span several lines
and preserve formatting
DELIMITER
```

### JSON Auto-parsing
When the delimiter contains "JSON" (case-insensitive), the content is automatically parsed as JSON:

```rexx
-- ✅ Auto-parsed as JavaScript object
LET user = <<JSON
{
  "name": "Alice Smith",
  "age": 30,
  "settings": {
    "theme": "dark",
    "notifications": true
  }
}
JSON

-- Now you can access properties directly
LET userName = user.name           -- "Alice Smith"
LET userTheme = user.settings.theme   -- "dark"
```

**JSON Auto-parsing Rules:**
- **Delimiter matching**: Contains "json", "JSON", "Json", "MYJSON", etc.
- **Content validation**: Must be valid JSON starting with `{` or `[`
- **Fallback behavior**: Invalid JSON remains as string
- **Array support**: JSON arrays are parsed as JavaScript arrays

**Examples:**
```rexx
-- ✅ These delimiters trigger JSON parsing
LET config = <<JSON
{"theme": "dark"}
JSON

LET data = <<json  
["item1", "item2", "item3"]
json

LET settings = <<CONFIGJSON
{"enabled": true, "timeout": 5000}
CONFIGJSON

-- ❌ These remain as strings  
LET text = <<DATA
{"not": "parsed"}
DATA

LET content = <<CONFIG
{"stays": "as string"}
CONFIG
```

### Use Cases
- **Configuration files**: Store complex settings as JSON
- **API responses**: Handle JSON data from web services
- **Test data**: Define structured test fixtures
- **Templates**: Multi-line content with dynamic variables

## Comments

### Comment Syntax
Lines starting with `--` or `//` are comments:

```rexx
-- This is a comment (traditional REXX style)
// This is also a comment (C/JavaScript style)
LET value = 10        -- End of line comment
LET another = 20      // Also an end of line comment

-- Multi-line comments with --
-- can span multiple lines
-- for detailed explanations

// Multi-line comments with //
// are also supported
// using the same approach
```

Both comment styles are supported for developer convenience:
- **`--`**: Traditional REXX comment syntax
- **`//`**: C/C++/JavaScript style comments for familiarity

## Application Addressing

### ADDRESS Statement
Direct function calls to specific applications:

```rexx
-- Switch target application
ADDRESS calculator
add x=10 y=32

-- Switch to another service  
ADDRESS kitchen
prepareDish name="Pasta" servings=4

-- Switch back to calculator
ADDRESS calculator
display message="Calculation complete"
```

**See also:** [Application Addressing](16-application-addressing.md) for detailed cross-application communication patterns.