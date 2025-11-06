# ADDRESS HEREDOC Patterns

Comprehensive reference for ADDRESS HEREDOC syntax and multiline content handling in RexxJS.

## Overview

ADDRESS HEREDOC extends the [Application Addressing](19-application-addressing.md) system with **multiline string blocks** that provide clean, readable syntax for complex content. This enables natural domain-specific languages, structured test frameworks, and configuration DSLs within ADDRESS contexts.

## ADDRESS Routing Methods

All ADDRESS contexts support multiple ways to send commands to target handlers:

| Method | Syntax | Processing | Use Case |
|--------|--------|------------|----------|
| **HEREDOC Block** | `ADDRESS target <<DELIMITER`<br>`content`<br>`DELIMITER` | Direct → Handler | Multi-line SQL, Python, JSON, XML |
| **LINES Capture** | `ADDRESS target LINES(n)` | Capture n lines → Handler | Block commands, Scripts |
| **Inline String** | `ADDRESS target "command"`<br>`ADDRESS target 'command'`<br>`ADDRESS target \`command\`` | Direct → Handler | Single commands |
| **Multiline String** | `ADDRESS target`<br>`"command"` (or `'command'`, `` `command` ``) | Direct → Handler | Formatted commands |
| **Function Calls** | `ADDRESS target`<br>`functionCall()` | REXX Parse → Handler | API calls |

### Processing Order (Precedence)

1. **HEREDOC blocks** - Multi-line immediate execution, preserves formatting
2. **LINES capture** (when active) - Capture specified number of lines
3. **Quoted strings** - Immediate execution, bypass REXX parsing  
4. **Function calls** - Normal REXX parsing, routed if function call
5. **Other statements** - Normal REXX processing (not sent to target)

## Quick Reference

```rexx
-- HEREDOC syntax
ADDRESS targetName <<DELIMITER
content here
with multiple lines
DELIMITER

-- Examples
ADDRESS sqlite3 <<SQL
SELECT * FROM users WHERE active = 1
SQL

ADDRESS api <<JSON
{
  "method": "POST",
  "data": {
    "user": "alice",
    "action": "login"
  }
}
JSON

ADDRESS templating <<HTML
<div class="user-card">
  <h2>{user_name}</h2>
  <p>Status: {user_status}</p>
</div>
HTML
```

## Detailed ADDRESS Routing Examples

### 1. HEREDOC Block (Preferred for Multiline)

```rexx
ADDRESS sqlite3 <<CREATE_TABLE
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE
)
CREATE_TABLE
```

**When**: HEREDOC syntax used  
**Processing**: Multi-line content sent as single string with preserved formatting  
**Handler receives**: Complete block with exact whitespace and line breaks

### 2. LINES Capture (Legacy Block Processing)

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

### 3. Inline String (Direct Execution)

```rexx
ADDRESS calculator "clear; press 5; press +; press 3; press ="  -- Double quotes
ADDRESS calculator 'clear; press 5; press +; press 3; press ='  -- Single quotes
ADDRESS calculator `clear; press 5; press +; press 3; press =`  -- Backticks
```

**When**: Quoted string on same line as ADDRESS (any quote type: `"`, `'`, `` ` ``)  
**Processing**: Direct execution via `executeQuotedString()`  
**Handler receives**: Exact string content

### 4. Function Calls (Normal REXX Parsing)

```rexx
ADDRESS calculator
clear                           -- Sent to calculator.clear()
press button="5"               -- Sent to calculator.press("5") 
LET result = getDisplay        -- Sent to calculator.getDisplay(), result stored
SAY "Result: " || result       -- Normal REXX (not sent to calculator)
```

**When**: Normal REXX function call syntax  
**Processing**: Standard REXX parsing, function calls routed to ADDRESS target  
**Handler receives**: Function name and parameters

## HEREDOC Syntax Rules

### 1. Delimiter Requirements

- **Custom delimiters**: Choose meaningful names that match content type
- **Case sensitive**: `SQL` and `sql` are different delimiters
- **No nesting**: HEREDOC blocks cannot contain other HEREDOC blocks
- **Exact matching**: Opening and closing delimiters must match exactly

```rexx
-- Good delimiter choices
ADDRESS sqlite3 <<SQL
SELECT * FROM users
SQL

ADDRESS api <<JSON
{"user": "alice"}
JSON

ADDRESS templating <<HTML
<div>Content</div>
HTML

-- Avoid generic delimiters
ADDRESS target <<EOF    -- Less clear what content type is expected
content here
EOF
```

### 2. Content Preservation

```rexx
ADDRESS formatter <<TEMPLATE
    Indented content is preserved
  Different indentation levels
        All whitespace maintained
TEMPLATE
```

**Handler receives**: Exact content with all whitespace and indentation preserved

### 3. Variable Interpolation

HEREDOC content supports variable interpolation using `{variable}` syntax:

```rexx
LET userName = "Alice"
LET userEmail = "alice@example.com"

ADDRESS api <<USER_DATA
{
  "name": "{userName}",
  "email": "{userEmail}",
  "timestamp": "{TIMESTAMP()}"
}
USER_DATA
```

### 4. Error Handling

```rexx
-- Missing closing delimiter causes parse error
ADDRESS target <<BLOCK
content here
-- BLOCK delimiter missing - will cause error

-- Mismatched delimiters cause parse error  
ADDRESS target <<START
content here
END  -- Should be START, not END
```

## Common HEREDOC Examples

### Database Operations

```rexx
-- Table creation with constraints
ADDRESS sqlite3 <<CREATE_USERS
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
CREATE_USERS

-- Complex queries with JOINs
ADDRESS sqlite3 <<QUERY_ORDERS
SELECT 
  u.name,
  u.email,
  COUNT(o.id) as order_count,
  SUM(o.total) as total_spent
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.active = 1
GROUP BY u.id
ORDER BY total_spent DESC
QUERY_ORDERS

-- Batch data insertion
ADDRESS sqlite3 <<INSERT_USERS
INSERT INTO users (name, email) VALUES
  ('Alice Johnson', 'alice@example.com'),
  ('Bob Smith', 'bob@example.com'),
  ('Carol Davis', 'carol@example.com')
INSERT_USERS
```

### API Calls

```rexx
LET userId = "12345"
LET newStatus = "active"

ADDRESS api <<POST_REQUEST
{
  "method": "PUT",
  "endpoint": "/users/{userId}",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer {API_TOKEN}"
  },
  "body": {
    "status": "{newStatus}",
    "updated_at": "{TIMESTAMP()}"
  }
}
POST_REQUEST
```

### Template Generation

```rexx
LET title = "User Dashboard"
LET userName = "Alice"

ADDRESS templating <<HTML_TEMPLATE
<!DOCTYPE html>
<html>
<head>
  <title>{title}</title>
</head>
<body>
  <div class="dashboard">
    <h1>Welcome, {userName}!</h1>
    <nav>
      <a href="/profile">Profile</a>
      <a href="/settings">Settings</a>
      <a href="/logout">Logout</a>
    </nav>
  </div>
</body>
</html>
HTML_TEMPLATE
```

### Configuration Files

```rexx
LET dbHost = "localhost"
LET dbPort = "5432"
LET appEnv = "production"

ADDRESS config <<YAML_CONFIG
database:
  host: {dbHost}
  port: {dbPort}
  name: myapp_{appEnv}
  ssl: true

cache:
  enabled: true
  ttl: 3600

logging:
  level: info
  format: json
YAML_CONFIG
```

### Test Expectations

```rexx
LET result = calculateTotal([10, 20, 30])
LET userName = "testuser"

ADDRESS EXPECTATIONS <<TESTS
{result} should equal 60
{userName} should match "^[a-z]+$"
{result} should be greater than 50
{LENGTH(userName)} should equal 8
TESTS
```

## Integration Examples

### Expectations Framework

```rexx
REQUIRE "expectations-address"

LET user_age = 25
LET user_name = "Alice"

ADDRESS EXPECTATIONS <<VALIDATIONS
{user_age} should equal 25
{user_name} should equal "Alice"
{user_age} should be greater than 18
{user_name} should match "^[A-Z][a-z]+$"
VALIDATIONS

SAY "All expectations passed"
```

### Multi-Context Processing

```rexx
LET apiResponse = '{"status": "success", "data": {"id": 123}}'
LET dbResult = "5 rows affected"

-- API validation
ADDRESS api_validator <<API_TESTS
response should have status "success"
response.data.id should equal 123
response should be valid JSON
API_TESTS

-- Database validation  
ADDRESS db_validator <<DB_TESTS
query should affect 5 rows
transaction should commit successfully
connection should be active
DB_TESTS
```

### Code Generation

```rexx
LET className = "UserService"
LET methods = ["create", "update", "delete", "find"]

ADDRESS generator <<JAVASCRIPT
class {className} {
  constructor(database) {
    this.db = database;
  }

  async create(userData) {
    return await this.db.insert('users', userData);
  }

  async update(id, userData) {
    return await this.db.update('users', userData, {id});
  }

  async delete(id) {
    return await this.db.delete('users', {id});
  }

  async find(criteria) {
    return await this.db.select('users', criteria);
  }
}
JAVASCRIPT
```

## Performance Considerations

- **Memory Usage**: HEREDOC content is stored in memory until processed
- **Parsing Overhead**: Minimal - content is captured as-is without regex processing
- **Size Limits**: Limited by available memory, suitable for reasonable content sizes
- **Processing Speed**: Faster than line-by-line matching approaches

## Best Practices

### 1. Choose Meaningful Delimiters

```rexx
-- Good: Descriptive delimiters
ADDRESS sqlite3 <<CREATE_USERS_TABLE
CREATE TABLE users (...)
CREATE_USERS_TABLE

ADDRESS api <<USER_LOGIN_REQUEST
{"action": "login", ...}
USER_LOGIN_REQUEST

-- Avoid: Generic delimiters
ADDRESS target <<EOF
content
EOF
```

### 2. Consistent Indentation

```rexx
-- Good: Consistent formatting
ADDRESS formatter <<TEMPLATE
  <div>
    <h1>Title</h1>
    <p>Content</p>
  </div>
TEMPLATE

-- Avoid: Inconsistent indentation
ADDRESS formatter <<TEMPLATE
<div>
   <h1>Title</h1>
     <p>Content</p>
  </div>
TEMPLATE
```

### 3. Handle Long Content Appropriately

```rexx
-- For very long content, consider external files
LET templateContent = READ_FILE("template.html")
ADDRESS templating templateContent

-- Or break into logical sections
ADDRESS processor <<SECTION_1
first part of content
SECTION_1

ADDRESS processor <<SECTION_2
second part of content  
SECTION_2
```

### 4. Document Content Types

```rexx
-- Clear comments about expected content
-- SQL query to fetch active users with recent orders
ADDRESS sqlite3 <<ACTIVE_USERS_QUERY
SELECT u.*, COUNT(o.id) as recent_orders
FROM users u
LEFT JOIN orders o ON u.id = o.user_id 
  AND o.created_at > datetime('now', '-30 days')
WHERE u.active = 1
GROUP BY u.id
ACTIVE_USERS_QUERY
```

## Integration with Other Features

### INTERPRET Inheritance

```rexx
-- INTERPRET preserves ADDRESS context
ADDRESS formatter <<TEMPLATE
<div class="user">{userName}</div>
TEMPLATE

LET userName = "Alice"
LET command = "ADDRESS formatter <<TEMPLATE\n<p>Hello {userName}</p>\nTEMPLATE"

-- Executes in current ADDRESS context
INTERPRET command
```

### Context Switching

```rexx
-- Switch between different ADDRESS targets
ADDRESS sqlite3 <<QUERY
SELECT * FROM users
QUERY

-- Switch to different target
ADDRESS api <<REQUEST
{"method": "GET", "endpoint": "/users"}
REQUEST

-- Return to normal processing
ADDRESS DEFAULT
SAY "Processing complete"
```

## Comparison with Legacy MATCHING

| Feature | HEREDOC | Legacy MATCHING |
|---------|---------|-----------------|
| **Syntax** | `<<DELIMITER...DELIMITER` | `MATCHING("regex")` |
| **Content** | Exact preservation | Pattern extraction |
| **Complexity** | Simple, readable | Regex complexity |
| **Performance** | Fast | Regex overhead |
| **Debugging** | Easy to read | Regex debugging needed |
| **Use Case** | Clean multiline content | Pattern-based filtering |

### Migration from MATCHING

```rexx
-- Old MATCHING approach
ADDRESS sqlite3 MATCHING("^  (.*)")
  SELECT * FROM users
  WHERE active = 1

-- New HEREDOC approach  
ADDRESS sqlite3 <<QUERY
SELECT * FROM users
WHERE active = 1
QUERY
```

## Error Handling

### Common Errors

```rexx
-- Missing closing delimiter
ADDRESS target <<START
content here
-- Error: Missing START delimiter

-- Mismatched delimiters
ADDRESS target <<BEGIN
content here
END
-- Error: Expected BEGIN, found END

-- Nested HEREDOC (not supported)
ADDRESS target <<OUTER
content
<<INNER
nested content
INNER
OUTER
-- Error: Nested HEREDOC not allowed
```

### Debugging Techniques

```rexx
-- Test with simple content first
ADDRESS target <<TEST
simple test
TEST

-- Verify delimiter matching
ADDRESS target <<DELIMITER_NAME
content
DELIMITER_NAME

-- Check variable interpolation
LET test = "value"
ADDRESS target <<DEBUG
{test} should appear as "value"
DEBUG
```

## See Also

- [Application Addressing](19-application-addressing.md) - Core ADDRESS functionality
- [Dynamic Execution](18-interpret.md) - INTERPRET with ADDRESS contexts
- [Testing with rexxt](32-testing-rexxt.md) - Test framework integration
- [Expectations Address Implementation](../src/expectations-address.js) - Reference implementation
- [SQLite3 ADDRESS Examples](../extras/addresses/sqlite3/) - Real-world HEREDOC usage

---

**Example Repository:**
- [`tests/dogfood/`](../tests/dogfood/) - Production HEREDOC usage
- [`tests/address-heredoc.spec.js`](../tests/address-heredoc.spec.js) - Unit tests  
- [`extras/addresses/sqlite3/`](../extras/addresses/sqlite3/) - HEREDOC SQL examples