# ADDRESS Variable Patterns

This document explains how ADDRESS targets handle REXX variables, specifically the difference between command string and method call execution patterns.

## Overview

ADDRESS targets in REXX can be invoked in two distinct ways:
1. **Command strings**: Traditional REXX ADDRESS syntax using quoted strings
2. **Method calls**: Modern function-call syntax with named parameters

Each approach handles REXX variables differently.

## Command String Pattern

### Syntax
```rexx
ADDRESS targetName
"COMMAND PARAMETERS"
```

### Variable Handling
Command strings set **fixed REXX variables** automatically:
- **RC**: Return code (0 for success, non-zero for failure)
- **RESULT**: Result data (can be simple values or complex objects)
- **ERRORTEXT**: Error message (set only on failure)
- **Domain-specific variables**: Like SQLCODE for SQL operations

### Examples

#### SQLite ADDRESS Target
```rexx
ADDRESS sql
"CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT)"
-- Sets: RC=0, RESULT={operation: "CREATE_TABLE", success: true, ...}

"INSERT INTO users (name, email) VALUES ('John Doe', 'john@example.com')" 
-- Sets: RC=0, RESULT={operation: "INSERT", lastInsertId: 1, rowsAffected: 1, ...}, SQLCODE=0

"SELECT * FROM users WHERE name LIKE '%John%'"
-- Sets: RC=0, RESULT={operation: "SELECT", rows: [...], count: 1, ...}, SQLCODE=0

-- Error case
"CREATE INVALID SQL SYNTAX"
-- Sets: RC=1, ERRORTEXT="SQL syntax error...", SQLCODE=-1
```

#### Mock ADDRESS Target  
```rexx
ADDRESS mock
"ECHO Hello World"
-- Sets: RC=0, RESULT="Hello World"

"SET counter 42"
-- Sets: RC=0, RESULT={operation: "SET", key: "counter", value: 42, success: true}

"UNKNOWN_COMMAND"  
-- Sets: RC=1, ERRORTEXT="Unknown command: UNKNOWN_COMMAND"
```

### Accessing Command String Results
```rexx
ADDRESS sql
"CREATE TABLE test (id INTEGER)"
IF RC = 0 THEN DO
  SAY "Table created successfully"
  SAY "Operation: " || RESULT.operation
  SAY "Success: " || RESULT.success
ELSE DO
  SAY "Error occurred: " || ERRORTEXT
  SAY "SQL Code: " || SQLCODE
END
```

## Method Call Pattern

### Syntax
```rexx
ADDRESS targetName
LET variable = methodName param1=value1 param2=value2
```

### Variable Handling
Method calls return results **directly to assigned variables**:
- No automatic RC/RESULT setting
- Direct assignment to user-specified variable
- Full result object available in assigned variable

### Examples

#### SQLite ADDRESS Target
```rexx
ADDRESS sql
LET createResult = execute sql="CREATE TABLE products (id INTEGER, name TEXT, price REAL)"
-- createResult = {operation: "CREATE_TABLE", success: true, sql: "CREATE TABLE...", timestamp: "..."}

LET insertResult = execute sql="INSERT INTO products (name, price) VALUES ('Widget', 19.99)"
-- insertResult = {operation: "INSERT", success: true, lastInsertId: 1, rowsAffected: 1, ...}

LET queryResult = execute sql="SELECT * FROM products"
-- queryResult = {operation: "SELECT", success: true, rows: [...], count: 1, ...}

LET statusInfo = status()
-- statusInfo = {service: "sqlite", version: "3.x", methods: [...], timestamp: "..."}
```

#### Mock ADDRESS Target
```rexx
ADDRESS mock
LET echoResult = ECHO message="Hello World"
-- echoResult = {success: true, method: "ECHO", result: "Hello World", timestamp: "..."}

LET setResult = SET key="username" value="testuser"
-- setResult = {success: true, method: "SET", key: "username", value: "testuser", state: {...}}

LET getResult = GET key="username"
-- getResult = {success: true, method: "GET", key: "username", result: "testuser", found: true}
```

### Accessing Method Call Results
```rexx
ADDRESS sql
LET result = execute sql="INSERT INTO users (name) VALUES ('Alice')"
IF result.success THEN DO
  SAY "Insert successful"
  SAY "Operation: " || result.operation
  SAY "Last Insert ID: " || result.lastInsertId
  SAY "Rows Affected: " || result.rowsAffected
ELSE DO
  SAY "Insert failed: " || result.error
END
```

## RESULT Object Structure

The RESULT variable (from command strings) and method return values are typically structured objects:

### Common Fields
```rexx
{
  operation: "CREATE_TABLE",     -- Operation type performed
  success: true,                 -- Boolean success status  
  timestamp: "2024-01-15T...",   -- ISO timestamp
  sql: "CREATE TABLE...",        -- Original command (SQL example)
  message: "Table created"       -- Human-readable message
}
```

### Operation-Specific Fields

#### INSERT Operations
```rexx
{
  operation: "INSERT",
  success: true,
  rowsAffected: 1,
  lastInsertId: 42,
  timestamp: "..."
}
```

#### SELECT Operations  
```rexx
{
  operation: "SELECT",
  success: true,
  rows: [
    {id: 1, name: "John", email: "john@example.com"},
    {id: 2, name: "Jane", email: "jane@example.com"}
  ],
  count: 2,
  timestamp: "..."
}
```

#### Error Cases
```rexx
{
  operation: "ERROR",
  success: false,
  errorCode: 1,
  errorMessage: "Syntax error in SQL statement",
  timestamp: "..."
}
```

## Domain-Specific Variables

Different ADDRESS targets may set specialized REXX variables:

### SQL Targets
- **SQLCODE**: SQL-specific status code (0 success, -1 error)

### System Targets (hypothetical)
- **EXITCODE**: Process exit code
- **STDOUT**: Standard output
- **STDERR**: Standard error

### API Targets (hypothetical)
- **HTTP_STATUS**: HTTP response code
- **RESPONSE_TIME**: Request duration in milliseconds

## Mixed Usage Patterns

You can combine both patterns in the same script:

```rexx
ADDRESS sql

-- Use command strings for simple operations
"CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)"
IF RC != 0 THEN EXIT

-- Use method calls for complex operations with detailed results
LET insertResult = execute sql="INSERT INTO users (name) VALUES ('John')"
SAY "User inserted with ID: " || insertResult.lastInsertId

-- Back to command strings for simple queries  
"SELECT COUNT(*) as total FROM users"
SAY "Total users: " || RESULT.rows[0].total
```

## Implementation Considerations

### For ADDRESS Target Authors
1. **Command strings**: Must set RC, RESULT, and domain-specific variables
2. **Method calls**: Return full result objects directly
3. **Error handling**: Use RC/ERRORTEXT for command strings, error fields in method results
4. **Consistency**: Ensure both patterns provide equivalent functionality

### For Script Authors
1. **Choose pattern based on needs**: Command strings for simple operations, methods for complex workflows
2. **Check results appropriately**: RC for command strings, .success for method calls
3. **Access data correctly**: RESULT variable vs assigned variable
4. **Handle errors gracefully**: ERRORTEXT vs .error field

## Best Practices

### Use Command Strings When:
- Performing simple operations
- Following traditional REXX patterns
- Need automatic RC/RESULT variable setting
- Porting existing REXX code

### Use Method Calls When:
- Need detailed result information
- Building complex workflows
- Want explicit variable assignment
- Developing new applications

### Error Handling
```rexx
-- Command string error handling
ADDRESS target
"OPERATION parameters"
IF RC != 0 THEN DO
  SAY "Operation failed: " || ERRORTEXT
  EXIT
END

-- Method call error handling  
ADDRESS target
LET result = operation param=value
IF NOT result.success THEN DO
  SAY "Operation failed: " || result.error
  EXIT
END
```

This pattern provides both traditional REXX compatibility (command strings) and modern convenience (method calls) while maintaining consistent behavior across different ADDRESS targets.