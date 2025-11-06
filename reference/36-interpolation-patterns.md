# Interpolation Patterns Reference

Comprehensive guide to string interpolation patterns and the `INTERPOLATION PATTERN` statement in RexxJS.

## Overview

RexxJS supports configurable string interpolation patterns that allow you to customize how variables are embedded within strings. You can use predefined patterns or create your own custom patterns for specific use cases.

## Quick Reference

```rexx
-- Switch between predefined patterns
INTERPOLATION HANDLEBARS   -- {{variable}} (default)
INTERPOLATION SHELL        -- ${variable}
INTERPOLATION BATCH        -- %variable%
INTERPOLATION DOUBLEDOLLAR -- $$variable$$

-- Use pattern examples directly
setInterpolationPattern("{{v}}")  -- Switch to handlebars
setInterpolationPattern("${v}")   -- Switch to shell
setInterpolationPattern("%v%")    -- Switch to batch
setInterpolationPattern("$$v$$")  -- Switch to doubledollar
setInterpolationPattern("<<v>>")  -- Create custom angle brackets

-- Create custom patterns
createCustomPattern("ANGLES", "<<", ">>")
```

## Predefined Patterns

### HANDLEBARS (Default)
**Pattern:** `{{variable}}`  
**Default:** Yes

```javascript
// JavaScript API
setInterpolationPattern('handlebars');
// or using pattern example
setInterpolationPattern('{{v}}');

const result = interpolateMessage('Hello {{name}}', { name: 'Alice' });
// Outputs: Hello Alice
```

### SHELL
**Pattern:** `${variable}`

```javascript
// JavaScript API
setInterpolationPattern('shell');
// or using pattern example
setInterpolationPattern('${v}');

const result = interpolateMessage('Hello ${name}', { name: 'Bob' });
// Outputs: Hello Bob
```

### BATCH
**Pattern:** `%variable%`

```javascript
// JavaScript API
setInterpolationPattern('batch');
// or using pattern example
setInterpolationPattern('%v%');

const result = interpolateMessage('Hello %name%', { name: 'Charlie' });
// Outputs: Hello Charlie
```

### DOUBLEDOLLAR
**Pattern:** `$$variable$$`

```javascript
// JavaScript API
setInterpolationPattern('doubledollar');
// or using pattern example
setInterpolationPattern('$$v$$');

const result = interpolateMessage('Hello $$name$$', { name: 'David' });
// Outputs: Hello David
```

## Pattern Example Syntax

### Using Pattern Examples with 'v' Placeholder

The interpolation system now supports a convenient pattern example syntax where you can specify patterns using examples with 'v' as a variable placeholder:

```javascript
// Pattern examples automatically detect existing patterns
setInterpolationPattern('{{v}}');    // Matches handlebars pattern
setInterpolationPattern('${v}');     // Matches shell pattern  
setInterpolationPattern('%v%');      // Matches batch pattern
setInterpolationPattern('$$v$$');    // Matches doubledollar pattern

// Pattern examples create new custom patterns
setInterpolationPattern('<<v>>');    // Creates custom pattern with << and >>
setInterpolationPattern('@@v@@');    // Creates custom pattern with @@ and @@
setInterpolationPattern('<*v*>');    // Creates custom pattern with <* and *>
```

### Pattern Example Rules

- The example string must contain the letter 'v'
- The 'v' cannot be at the start or end of the string
- There must be non-empty text before and after the 'v'
- If the delimiters match an existing pattern, that pattern is returned
- If no match is found, a new custom pattern is created

```javascript
// ✅ Valid pattern examples
setInterpolationPattern('{{v}}');     // Valid: handlebars pattern
setInterpolationPattern('#{v}');      // Valid: creates custom pattern
setInterpolationPattern('((v))');     // Valid: creates custom pattern

// ❌ Invalid pattern examples
setInterpolationPattern('v');         // Invalid: v at edge
setInterpolationPattern('vtest');     // Invalid: v at start  
setInterpolationPattern('testv');     // Invalid: v at end
setInterpolationPattern('test');      // Invalid: no v
```

## JavaScript API Reference

### Core Functions

```javascript
const {
  setInterpolationPattern,
  getCurrentPattern,
  resetToDefault,
  getAvailablePatterns,
  createCustomPattern,
  parsePatternExample
} = require('./src/interpolation-config');
```

### setInterpolationPattern(pattern)

Sets the global interpolation pattern.

**Parameters:**
- `pattern` - String (pattern name or example) or Object (custom pattern)

**Returns:** The configured pattern object

```javascript
// Using predefined pattern names
setInterpolationPattern('handlebars');
setInterpolationPattern('shell');

// Using pattern examples  
setInterpolationPattern('{{v}}');
setInterpolationPattern('${v}');

// Using custom pattern object
setInterpolationPattern({
  name: 'ruby',
  regex: /#{([^}]+)}/g,
  startDelim: '#{',
  endDelim: '}',
  hasDelims: (str) => str.includes('#{'),
  extractVar: (match) => match.slice(2, -1)
});
```

### createCustomPattern(name, startDelim, endDelim)

Creates a custom interpolation pattern.

**Parameters:**
- `name` - Pattern name
- `startDelim` - Start delimiter
- `endDelim` - End delimiter

**Returns:** Custom pattern configuration

```javascript
const pattern = createCustomPattern('ruby', '#{', '}');
setInterpolationPattern(pattern);
```

### parsePatternExample(example)

Parses a pattern example string to create or match a pattern.

**Parameters:**
- `example` - Pattern example string with 'v' placeholder

**Returns:** Pattern configuration or null if invalid

```javascript
const pattern = parsePatternExample('{{v}}');  // Returns handlebars pattern
const custom = parsePatternExample('<<v>>');   // Returns new custom pattern
const invalid = parsePatternExample('test');   // Returns null
```

## INTERPOLATION PATTERN Statement (Legacy)

### Syntax

```rexx
INTERPOLATION PATTERN name=PATTERN_NAME start="start_delimiter" end="end_delimiter"
```

**Parameters:**
- `name` - Unique name for the pattern (required)
- `start` - Starting delimiter string (required, non-empty)
- `end` - Ending delimiter string (required, non-empty)

### Creating Custom Patterns

```rexx
-- Ruby-style interpolation
INTERPOLATION PATTERN name=RUBY start="#{" end="}"

-- XML/JSP-style
INTERPOLATION PATTERN name=XML start="<%" end="%>"

-- Wiki-style
INTERPOLATION PATTERN name=WIKI start="[[" end="]]"

-- Double pipe style
INTERPOLATION PATTERN name=PIPES start="||" end="||"

-- Angle brackets
INTERPOLATION PATTERN name=ANGLES start="<<" end=">>"
```

### Using Custom Patterns

After defining a custom pattern, switch to it using the pattern name:

```rexx
-- Define custom pattern
INTERPOLATION PATTERN name=RUBY start="#{" end="}"

-- Switch to the custom pattern
INTERPOLATION RUBY
LET count = 5
LET type = "items"
SAY "Found #{count} #{type}"  -- Outputs: Found 5 items

-- Switch back to default
INTERPOLATION DEFAULT
SAY "Back to {{count}} {{type}}"  -- Outputs: Back to 5 items
```

## Pattern Lifecycle Management

### Pattern Definition and Usage Workflow

```rexx
-- 1. Define multiple custom patterns
INTERPOLATION PATTERN name=RUBY start="#{" end="}"
INTERPOLATION PATTERN name=XML start="<%" end="%>"
INTERPOLATION PATTERN name=WIKI start="[[" end="]]"

-- 2. Switch between patterns as needed
INTERPOLATION RUBY
LET user = "Alice"
SAY "User: #{user}"

INTERPOLATION XML
SAY "User: <%user%>"

INTERPOLATION WIKI
SAY "User: [[user]]"

-- 3. Return to default when done
INTERPOLATION DEFAULT
SAY "User: {user}"
```

### Pattern Persistence

Custom patterns persist for the duration of the script execution:

```rexx
-- Define pattern early in script
INTERPOLATION PATTERN name=SPECIAL start="@@" end="@@"

-- Use throughout script
PROCEDURE processUser(name)
    INTERPOLATION SPECIAL
    SAY "Processing @@name@@"
    INTERPOLATION DEFAULT
END

-- Pattern remains available
CALL processUser "Alice"
CALL processUser "Bob"
```

## Validation Rules

### Valid Pattern Names
- Must be unique (case-insensitive)
- Cannot conflict with predefined pattern names
- Should be descriptive and meaningful

```rexx
-- ✅ Valid custom pattern names
INTERPOLATION PATTERN name=RUBY start="#{" end="}"
INTERPOLATION PATTERN name=ANGULAR start="{{" end="}}"
INTERPOLATION PATTERN name=VELOCITY start="$" end=""

-- ❌ Invalid pattern names (reserved)
INTERPOLATION PATTERN name=DEFAULT start="[" end="]"  -- Reserved
INTERPOLATION PATTERN name=SHELL start="@" end="@"    -- Reserved
INTERPOLATION PATTERN name=handlebars start="%" end="%" -- Case-insensitive conflict
```

### Valid Delimiters
- Start and end delimiters must be non-empty
- Delimiters can be multi-character
- Special regex characters are automatically escaped

```rexx
-- ✅ Valid delimiters
INTERPOLATION PATTERN name=SIMPLE start="@" end="@"
INTERPOLATION PATTERN name=MULTI start="[[" end="]]"
INTERPOLATION PATTERN name=MIXED start="<%" end="%>"
INTERPOLATION PATTERN name=SPECIAL start="${" end="}"

-- ❌ Invalid delimiters
INTERPOLATION PATTERN name=EMPTY start="" end="@"      -- Empty start
INTERPOLATION PATTERN name=BLANK start="@" end=""      -- Empty end
```

## Advanced Usage Examples

### Context-Specific Patterns

```rexx
-- SQL context with square brackets
INTERPOLATION PATTERN name=SQL start="[" end="]"
INTERPOLATION SQL
ADDRESS sqlite3 <<QUERY
SELECT * FROM users WHERE name = '[userName]' AND status = '[userStatus]'
QUERY

-- API context with double braces
INTERPOLATION HANDLEBARS
ADDRESS api <<JSON
{
  "user": "{{userName}}",
  "status": "{{userStatus}}",
  "timestamp": "{{TIMESTAMP()}}"
}
JSON

-- Reset to default
INTERPOLATION DEFAULT
```

### Template Generation

```rexx
-- HTML template pattern
INTERPOLATION PATTERN name=HTML start="{{" end="}}"
INTERPOLATION HTML

LET title = "Welcome Page"
LET content = "Hello, visitor!"

ADDRESS templating <<HTML_TEMPLATE
<!DOCTYPE html>
<html>
<head>
    <title>{{title}}</title>
</head>
<body>
    <h1>{{title}}</h1>
    <p>{{content}}</p>
    <p>Generated at: {{TIMESTAMP()}}</p>
</body>
</html>
HTML_TEMPLATE
```

### Configuration File Generation

```rexx
-- Configuration with angle brackets
INTERPOLATION PATTERN name=CONFIG start="<" end=">"
INTERPOLATION CONFIG

LET dbHost = "localhost"
LET dbPort = "5432"
LET dbName = "myapp"

ADDRESS config <<INI_CONFIG
[database]
host=<dbHost>
port=<dbPort>
name=<dbName>
ssl=true

[logging]
level=info
file=app.log
INI_CONFIG
```

## Integration with ADDRESS and HEREDOC

Custom interpolation patterns work seamlessly with ADDRESS HEREDOC blocks:

```rexx
-- Define Ruby-style pattern for JSON API
INTERPOLATION PATTERN name=RUBY start="#{" end="}"
INTERPOLATION RUBY

LET userId = "12345"
LET action = "login"
LET timestamp = TIMESTAMP()

ADDRESS api <<JSON_REQUEST
{
  "method": "POST",
  "endpoint": "/users/#{userId}/actions",
  "body": {
    "action": "#{action}",
    "timestamp": "#{timestamp}",
    "source": "rexx-script"
  }
}
JSON_REQUEST

-- Switch back to default for normal processing
INTERPOLATION DEFAULT
SAY "Request sent for user {userId}"
```

## Error Handling

### Common Errors and Solutions

```rexx
-- Error: Duplicate pattern name
INTERPOLATION PATTERN name=TEST start="@" end="@"
INTERPOLATION PATTERN name=TEST start="#" end="#"  -- Error: name already exists

-- Error: Reserved name
INTERPOLATION PATTERN name=DEFAULT start="%" end="%"  -- Error: reserved name

-- Error: Empty delimiter
INTERPOLATION PATTERN name=INVALID start="" end="@"  -- Error: empty start delimiter

-- Error: Unknown pattern
INTERPOLATION UNKNOWN_PATTERN  -- Error: pattern not defined
```

### Error Recovery

```rexx
-- Graceful error handling
TRY
    INTERPOLATION PATTERN name=CUSTOM start="@@" end="@@"
    INTERPOLATION CUSTOM
    SAY "Using @@variable@@ pattern"
CATCH error
    SAY "Pattern creation failed: " || error.message
    -- Fall back to default
    INTERPOLATION DEFAULT
    SAY "Using {variable} pattern"
END
```

## Best Practices

### 1. Choose Meaningful Names
```rexx
-- ✅ Good: Descriptive names
INTERPOLATION PATTERN name=SQL_BRACKETS start="[" end="]"
INTERPOLATION PATTERN name=RUBY_STYLE start="#{" end="}"
INTERPOLATION PATTERN name=XML_TAGS start="<%" end="%>"

-- ❌ Avoid: Generic names
INTERPOLATION PATTERN name=CUSTOM1 start="@" end="@"
INTERPOLATION PATTERN name=PATTERN2 start="#" end="#"
```

### 2. Document Pattern Usage
```rexx
-- Use comments to document pattern choices
-- Ruby-style interpolation for JSON API templates
INTERPOLATION PATTERN name=RUBY start="#{" end="}"
INTERPOLATION RUBY

-- Process API requests with Ruby-style variables
ADDRESS api <<JSON
{
  "user": "#{userName}",
  "action": "#{userAction}"
}
JSON
```

### 3. Reset Patterns When Done
```rexx
-- Save current pattern state
INTERPOLATION RUBY

-- ... use Ruby pattern for specific task ...

-- Always reset to default when task complete
INTERPOLATION DEFAULT
```

### 4. Use Context-Appropriate Patterns
```rexx
-- SQL context: use square brackets (common in SQL)
INTERPOLATION PATTERN name=SQL start="[" end="]"

-- Template context: use double braces (familiar from Handlebars)
INTERPOLATION HANDLEBARS

-- Shell script context: use dollar brace (shell variable style)
INTERPOLATION SHELL
```

## Function Reference

### Pattern Management Functions

While these are typically handled by the REXX interpreter, understanding the underlying concepts helps with pattern usage:

- **Pattern Definition**: `INTERPOLATION PATTERN name=NAME start="delim" end="delim"`
- **Pattern Switching**: `INTERPOLATION PATTERN_NAME`
- **Default Reset**: `INTERPOLATION DEFAULT`
- **Pattern Validation**: Automatic validation during definition

### Predefined Pattern Names

All predefined patterns can be referenced by name:
- `HANDLEBARS` - `{{variable}}` (default)
- `SHELL` - `${variable}`
- `BATCH` - `%variable%`
- `DOUBLEDOLLAR` - `$$variable$$`

## See Also

- [Basic Syntax](01-basic-syntax.md) - String interpolation fundamentals
- [ADDRESS HEREDOC Patterns](27-address-heredoc-patterns.md) - Using interpolation with ADDRESS
- [Address Handler Utilities](29-address-handler-utilities.md) - Interpolation in handlers
- [Dynamic Execution](18-interpret.md) - Interpolation with INTERPRET

---

**Pattern Count:** 4 predefined patterns + unlimited custom patterns  
**Delimiter Support:** Single or multi-character delimiters with automatic escaping  
**Pattern Examples:** Direct pattern specification using 'v' placeholder syntax  
**Scope:** Global pattern switching with script-wide persistence