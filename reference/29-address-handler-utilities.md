# ADDRESS Handler Utilities

Shared utilities for creating consistent and robust ADDRESS facility handlers in RexxJS.

## Overview

The Address Handler Utilities provide a standardized toolkit for ADDRESS facility developers, offering consistent variable interpolation, response formatting, error handling, and logging across all address handlers.

## Installation

```javascript
// Node.js
const { interpolateMessage, createResponse, wrapHandler } = require('./src/address-handler-utils');

// Browser
// Utilities are automatically available as window.AddressHandlerUtils
const { interpolateMessage, createResponse } = window.AddressHandlerUtils;
```

## Core Functions

### String Interpolation

#### `interpolateMessage(template, context, options)`

Replaces variable patterns with values from the context object. The interpolation pattern can be configured globally using the interpolation configuration system.

```javascript
const message = "User {name} scored {score} points";
const context = { name: "Alice", score: 95, age: 30 };

const interpolated = await interpolateMessage(message, context);
console.log(interpolated); // "User Alice scored 95 points"
```

#### Configurable Interpolation Patterns

RexxJS supports multiple interpolation patterns that can be switched globally using REXX statements:

```rexx
-- Default RexxJS pattern: {variable}
LET name = "Alice"
SAY "Hello {name}"    -- Outputs: Hello Alice

-- Switch to Handlebars pattern: {{variable}}
INTERPOLATION HANDLEBARS
LET name = "Bob"
SAY "Hello {{name}}"  -- Outputs: Hello Bob

-- Switch to Shell pattern: ${variable}
INTERPOLATION SHELL
LET name = "Charlie"
SAY "Hello ${name}"   -- Outputs: Hello Charlie

-- Reset to default
INTERPOLATION DEFAULT
```

**Available Predefined Patterns:**
- `DEFAULT` or `REXX`: `{variable}` (default)
- `HANDLEBARS`: `{{variable}}`
- `SHELL`: `${variable}`
- `BATCH`: `%variable%`
- `CUSTOM`: `$$variable$$`
- `BRACKETS`: `[variable]`

**Creating Custom Patterns:**
```rexx
-- Define custom angle bracket pattern
INTERPOLATION PATTERN name=ANGLES start="<<" end=">>"

-- Switch to the custom pattern
INTERPOLATION ANGLES
LET name = "Dave"
SAY "Hello <<name>>"  -- Outputs: Hello Dave

-- Create and use multiple custom patterns
INTERPOLATION PATTERN name=RUBY start="#{" end="}"
INTERPOLATION RUBY
LET count = 42
SAY "Found #{count} results"  -- Outputs: Found 42 results
```

**Pattern Switching in Scripts:**
```rexx
-- Switch pattern for specific operations
INTERPOLATION HANDLEBARS
LET user = "Alice"
LET status = "active"

ADDRESS myservice
"User {{user}} is {{status}}"

-- Reset to default for the rest of the script
INTERPOLATION DEFAULT
SAY "User {user} processed"
```

**Options:**
```javascript
const options = {
  throwOnMissing: false,           // Throw error if variable not found
  missingPlaceholder: '[MISSING]', // Placeholder for missing variables  
  transform: async (varName, value) => {
    // Transform values during interpolation
    if (varName === 'score' && value > 90) return `${value}⭐`;
    return value;
  }
};

const result = await interpolateMessage(
  "User {name} scored {score}", 
  { name: "Bob", score: 95 }, 
  options
);
// Result: "User Bob scored 95⭐"
```

#### `extractVariables(template)`

Extracts all variable names from a template string.

```javascript
const variables = extractVariables("Hello {name}, you have {count} messages");
console.log(variables); // ["name", "count"]
```

#### `validateContext(template, context, required)`

Validates that required variables are present in context.

```javascript
const validation = validateContext(
  "User {name} has {score} points",
  { name: "Alice", age: 30 }, // missing 'score'
);

console.log(validation);
// {
//   valid: false,
//   missing: ["score"],
//   found: ["name"]
// }
```

### Response Formatting

#### `createResponse(success, result, message, metadata)`

Creates standardized response objects for ADDRESS handlers.

```javascript
// Success response
const success = createResponse(true, { id: 123 }, "User created successfully");
console.log(success);
// {
//   success: true,
//   result: { id: 123 },
//   message: "User created successfully",
//   timestamp: "2025-01-15T10:30:00.000Z"
// }

// Simple success
const simple = createResponse(true);
// { success: true, timestamp: "2025-01-15T10:30:00.000Z" }
```

#### `createErrorResponse(error, operation, metadata)`

Creates standardized error responses.

```javascript
// Error from exception
const errorResp = createErrorResponse(
  new Error("Database connection failed"),
  "user_creation"
);

// Error from string
const stringError = createErrorResponse(
  "Invalid email format",
  "validation",
  { field: "email", value: "invalid-email" }
);
```

### Command Parsing

#### `parseCommand(message)`

Parses command-style messages with parameters.

```javascript
const parsed = parseCommand("create user name=John age=25 active=true");
console.log(parsed);
// {
//   command: "create",
//   subcommand: "user", 
//   params: { name: "John", age: "25", active: "true" }
// }

const simple = parseCommand("status");
// { command: "status", subcommand: "", params: {} }
```

### Logging

#### `logActivity(handlerName, operation, details, level)`

Consistent logging for ADDRESS handlers.

```javascript
logActivity("database", "query", { 
  table: "users", 
  rows: 5 
});
// Output: [ADDRESS:DATABASE] { timestamp: "...", handler: "database", operation: "query", table: "users", rows: 5 }

logActivity("api", "request_failed", { error: "timeout" }, "error");
// Error-level log with consistent format
```

### Handler Wrapper

#### `wrapHandler(handlerName, handlerFn, options)`

Wraps ADDRESS handlers with common functionality.

```javascript
const myHandler = async (message, context, sourceContext) => {
  // Your handler logic here
  return { processed: message.toUpperCase() };
};

const wrappedHandler = wrapHandler("myservice", myHandler, {
  autoInterpolate: true,     // Automatically interpolate {variables}
  logCalls: true,           // Log all calls
  validateContext: true,    // Validate required variables
  requiredVars: ["user_id"] // Required variables
});

// Register the wrapped handler
interpreter.addressTargets.set('myservice', {
  handler: wrappedHandler,
  methods: {},
  metadata: { name: 'My Service' }
});
```

## Complete Examples

### Basic Address Handler

```javascript
const { interpolateMessage, createResponse, createErrorResponse } = require('./src/address-handler-utils');

async function simpleLogHandler(message, context, sourceContext) {
  try {
    // Interpolate variables in the log message
    const interpolated = await interpolateMessage(message, context);
    
    // Log with timestamp
    console.log(`[${new Date().toISOString()}] ${interpolated}`);
    
    return createResponse(true, null, "Message logged");
  } catch (error) {
    return createErrorResponse(error, "logging");
  }
}

// Register handler
interpreter.addressTargets.set('logger', {
  handler: simpleLogHandler,
  methods: {},
  metadata: { name: 'Simple Logger' }
});

// Usage in REXX
/*
LET user = "Alice"
LET action = "login"

ADDRESS logger <<LOG_ENTRIES
Starting application initialization
Loading configuration file
Database connection established
LOG_ENTRIES
LOG: User {user} performed {action} at {timestamp}
*/
```

### Command-Style Handler

```javascript
const { parseCommand, interpolateMessage, createResponse, wrapHandler } = require('./src/address-handler-utils');

async function databaseHandler(message, context, sourceContext) {
  // Parse command structure
  const { command, subcommand, params } = parseCommand(message);
  
  // Interpolate any variables in parameters
  for (const [key, value] of Object.entries(params)) {
    params[key] = await interpolateMessage(value, context);
  }
  
  switch (command) {
    case 'create':
      if (subcommand === 'user') {
        return createResponse(true, { id: 123 }, `User ${params.name} created`);
      }
      break;
      
    case 'query':
      return createResponse(true, 
        [{ name: params.name || 'John', age: 30 }], 
        "Query executed"
      );
      
    default:
      return createErrorResponse(`Unknown command: ${command}`, "command_parsing");
  }
}

// Wrap with automatic features
const wrappedDbHandler = wrapHandler("database", databaseHandler, {
  logCalls: true,
  validateContext: true
});

// Register handler  
interpreter.addressTargets.set('database', {
  handler: wrappedDbHandler,
  methods: {},
  metadata: { name: 'Database Handler' }
});

// Usage in REXX
/*
LET user_name = "Alice"
LET user_age = 25

ADDRESS database
create user name={user_name} age={user_age}
query users name={user_name}
*/
```

### Validation-Heavy Handler

```javascript
const { 
  validateContext, 
  interpolateMessage, 
  createResponse, 
  createErrorResponse 
} = require('./src/address-handler-utils');

async function apiHandler(message, context, sourceContext) {
  // Validate required variables are present
  const validation = validateContext(message, context, ['api_key', 'endpoint']);
  if (!validation.valid) {
    return createErrorResponse(
      `Missing required variables: ${validation.missing.join(', ')}`,
      "validation"
    );
  }
  
  // Interpolate the full message
  const interpolated = await interpolateMessage(message, context);
  
  // Simulate API call
  const apiResult = {
    status: 200,
    data: { message: interpolated },
    timestamp: new Date().toISOString()
  };
  
  return createResponse(true, apiResult, "API call successful");
}

// Usage with validation
/*
LET api_key = "secret123"
LET endpoint = "/users"
LET user_id = 456

ADDRESS api <<JSON_REQUEST
{
  "method": "GET",
  "endpoint": "/users"
}
JSON_REQUEST  
API: GET {endpoint}/{user_id} with key {api_key}
*/
```

### Multi-Format Response Handler

```javascript
const { 
  interpolateMessage, 
  createResponse, 
  logActivity 
} = require('./src/address-handler-utils');

async function reportHandler(message, context, sourceContext) {
  const interpolated = await interpolateMessage(message, context);
  
  logActivity("report", "generate", { 
    template: message,
    variables: Object.keys(context).length 
  });
  
  // Generate different formats
  const formats = {
    text: interpolated,
    json: JSON.stringify({ message: interpolated, context }),
    html: `<p>${interpolated}</p>`,
    timestamp: new Date().toISOString()
  };
  
  return createResponse(true, formats, "Report generated in multiple formats");
}
```

## Best Practices

### 1. Always Use Standard Response Format

```javascript
// GOOD - Standard format
return createResponse(true, result, "Success message");

// AVOID - Inconsistent format  
return { ok: true, data: result };
```

### 2. Validate Input When Possible

```javascript
// Validate variables are present
const validation = validateContext(message, context);
if (!validation.valid) {
  return createErrorResponse(`Missing: ${validation.missing.join(', ')}`);
}
```

### 3. Use Handler Wrapper for Common Features

```javascript
// GOOD - Wrapped with common functionality
const wrappedHandler = wrapHandler("myservice", myHandler, {
  autoInterpolate: true,
  logCalls: true
});

// MANUAL - Implementing logging and interpolation manually
const manualHandler = async (message, context, sourceContext) => {
  console.log("Handler called"); // Manual logging
  const interpolated = await interpolateMessage(message, context); // Manual interpolation
  return await myHandler(interpolated, context, sourceContext);
};
```

### 4. Handle Errors Gracefully

```javascript
try {
  const result = await someAsyncOperation();
  return createResponse(true, result);
} catch (error) {
  return createErrorResponse(error, "operation_name");
}
```

### 5. Log Important Operations

```javascript
logActivity("myhandler", "important_operation", {
  input: message,
  contextSize: Object.keys(context).length
});
```

## Integration with ADDRESS HEREDOC

The utilities work seamlessly with ADDRESS HEREDOC patterns:

```javascript
// Handler using utilities
const handler = wrapHandler("test", async (message, context) => {
  // Message comes from HEREDOC content block
  // Context contains all variables
  const processed = await interpolateMessage(message, context);
  return createResponse(true, { processed });
}, { 
  autoInterpolate: false, // Handle interpolation manually for more control
  logCalls: true 
});

// REXX usage
/*
LET name = "Alice"
LET score = 95

ADDRESS test <<TEST_CASES
user authentication should succeed
password validation should enforce rules
input sanitization should prevent XSS
TEST_CASES
TEST: {name} achieved {score}% on the exam
*/
```

## Error Handling

All utilities include comprehensive error handling:

```javascript
// Interpolation with missing variables
const result = await interpolateMessage("Hello {missing_var}", {});
console.log(result); // "Hello {missing_var}" (preserves original)

// With error throwing enabled
try {
  await interpolateMessage("Hello {missing_var}", {}, { throwOnMissing: true });
} catch (error) {
  console.log(error.message); // "Variable 'missing_var' not found in context"
}
```

## See Also

- [ADDRESS HEREDOC Patterns](27-address-heredoc-patterns.md) - HEREDOC syntax reference
- [Application Addressing](16-application-addressing.md) - Core ADDRESS functionality  
- [Dynamic Execution](15-interpret.md) - INTERPRET with ADDRESS contexts
- [Testing with rexxt](23-testing-rexxt.md) - Testing ADDRESS handlers

---

**Complete Example Library:**
- [Address Handler Utils Source](../src/address-handler-utils.js) - Full implementation
- [Example Handlers](../tests/address-handler-utils.spec.js) - Working examples and tests