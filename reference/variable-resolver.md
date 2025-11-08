# Variable Resolver (var_missing) Callback

## Overview

The Variable Resolver is a lazy variable resolution system that allows external environments to provide variable values on-demand without pre-injecting them into the interpreter's variable scope. This enables first-class interoperability between the REXX interpreter and host environments like spreadsheets, databases, or custom data sources.

## Key Features

- **Lazy Resolution**: Variables are resolved only when accessed, not pre-loaded
- **No Caching**: The callback is invoked every time a variable is accessed
- **First-Class Interop**: Enables seamless integration with external data sources
- **Backward Compatible**: Works alongside traditional variable definitions
- **Priority System**: Interpreter variables take precedence over resolved variables

## Implementation

### Setting Up a Variable Resolver

The `variableResolver` callback is set on the interpreter instance:

```javascript
const { Interpreter } = require('./src/interpreter');
const interpreter = new Interpreter();

// Set up variable resolver
interpreter.variableResolver = (name) => {
  // Custom logic to resolve variable
  if (externalData.hasOwnProperty(name)) {
    return externalData[name];
  }
  return undefined;  // Not found
};
```

### Callback Signature

```javascript
variableResolver(name: string) => any | undefined
```

**Parameters:**
- `name`: The variable name being accessed (case-sensitive)

**Returns:**
- The variable value (any type)
- `undefined` if the variable cannot be resolved

## Usage Examples

### Example 1: Spreadsheet Cell References

```javascript
// Spreadsheet adapter sets up variable resolver
interpreter.variableResolver = (name) => {
  // Check if it's a cell reference pattern (A1, B2, AA10, etc.)
  if (/^[A-Z]+\d+$/.test(name)) {
    const value = spreadsheetModel.getCellValue(name);
    const numValue = parseFloat(value);
    return isNaN(numValue) ? value : numValue;
  }
  return undefined;
};

// REXX code can now use cell references directly
// LET total = A1 + A2 + A3
// LET label = UPPER(B1)
```

### Example 2: Database Query Results

```javascript
interpreter.variableResolver = (name) => {
  // Resolve variables from database result set
  if (currentResultRow && currentResultRow.hasOwnProperty(name)) {
    return currentResultRow[name];
  }
  return undefined;
};

// REXX code accesses database columns as variables
// SAY "Customer: " || CustomerName
// SAY "Total: " || OrderTotal
```

### Example 3: Environment Configuration

```javascript
interpreter.variableResolver = (name) => {
  // Resolve from environment or config
  if (name.startsWith('ENV_')) {
    return process.env[name.substring(4)];
  }
  if (name.startsWith('CONFIG_')) {
    return appConfig.get(name.substring(7));
  }
  return undefined;
};

// REXX code accesses config/env
// SAY "Database: " || ENV_DATABASE_URL
// LET port = CONFIG_PORT
```

## Variable Resolution Priority

When a variable is referenced, the interpreter resolves it in this order:

1. **Interpreter's variable map** - Variables set with `LET` or assignment
2. **Variable resolver callback** - External data source (if configured)
3. **Literal value** - If neither resolves it, treated as literal string

### Example: Priority in Action

```javascript
// Set up external data
const externalData = { 'Apple': 100 };
interpreter.variableResolver = (name) => externalData[name];

// Set interpreter variable
interpreter.variables.set('Apple', 999);

// REXX code
const code = parse('SAY Apple');
await interpreter.run(code);
// Output: 999  (interpreter variable takes precedence)
```

## Use Cases

### 1. Spreadsheet Applications

Spreadsheet cell references (`A1`, `B2`) are resolved dynamically from the spreadsheet model without pre-injecting all possible cell values:

```rexx
/* Spreadsheet formula */
LET total = A1 + A2 + A3
LET average = total / 3
LET label = UPPER(B1) || " - " || total
```

### 2. SQL Query Results

Database query results can be accessed as variables:

```rexx
ADDRESS SQL
"SELECT name, age, city FROM users WHERE id = 123"

/* Access columns as variables */
SAY "User: " || name
SAY "Age: " || age
SAY "City: " || city
```

### 3. Template Rendering

External data sources for template rendering:

```rexx
/* Variables resolved from template context */
SAY "Hello " || userName || "!"
SAY "Your order #" || orderId || " has shipped."
SAY "Tracking: " || trackingNumber
```

### 4. Configuration Management

Access application configuration without explicit variable definitions:

```rexx
/* Config values resolved on-demand */
LET host = CONFIG_DATABASE_HOST
LET port = CONFIG_DATABASE_PORT
LET secure = CONFIG_USE_SSL
```

## Technical Details

### Implementation Files

- **`core/src/interpreter-expression-value-resolution.js`**: Core variable resolution logic (lines 179-187)
  - `resolveValue()` function checks for variable-like strings
  - Calls `variableGetFn()` which invokes `variableResolver` callback

- **`core/src/interpreter-variable-stack.js`**: Variable stack management
  - `getVariable()` function checks variables map first, then calls `variableResolver`

- **`core/src/interpreter.js`**: Main interpreter
  - `getVariable()` method threads `variableResolver` through to variable stack utilities
  - `evaluateExpression()` and `resolveValue()` pass callback through evaluation chain

### Test Coverage

Comprehensive test suite at `core/tests/variable-resolver.spec.js` with 12 tests covering:

1. ✅ Basic variable resolution via callback
2. ✅ Arithmetic expressions (`Apple + Orange`)
3. ✅ Built-in functions (`UPPER(Pomegranate)`)
4. ✅ Pipe operations (`Pomegranate |> LOWER`)
5. ✅ Priority (interpreter variables over variableResolver)
6. ✅ Backward compatibility (works without variableResolver)
7. ✅ Undefined variable handling
8. ✅ Callback returning undefined
9. ✅ Complex expressions
10. ✅ String concatenation
11. ✅ Conditional expressions
12. ✅ No caching (callback invoked every time)

## Performance Considerations

### No Caching by Design

The variable resolver is invoked **every time** a variable is accessed. This is intentional for:

- **Data freshness**: Always get current value from external source
- **Dynamic updates**: Variables can change between accesses
- **Memory efficiency**: No need to cache potentially large datasets

### Optimization Strategies

If performance is critical, implement caching in your callback:

```javascript
const cache = new Map();
interpreter.variableResolver = (name) => {
  if (cache.has(name)) {
    return cache.get(name);
  }
  const value = expensiveDataSource.getValue(name);
  cache.set(name, value);
  return value;
};

// Clear cache when data updates
spreadsheet.on('cellChanged', (cellRef) => {
  cache.delete(cellRef);
});
```

## Best Practices

### 1. Return `undefined` for Unknown Variables

Always return `undefined` (not `null` or empty string) when a variable cannot be resolved:

```javascript
interpreter.variableResolver = (name) => {
  if (dataSource.has(name)) {
    return dataSource.get(name);
  }
  return undefined;  // ✅ Correct
  // NOT: return null;      ❌ Wrong
  // NOT: return '';        ❌ Wrong
};
```

### 2. Use Pattern Matching

Limit resolution to specific variable patterns to avoid conflicts:

```javascript
interpreter.variableResolver = (name) => {
  // Only resolve cell references (A1, B2, etc.)
  if (/^[A-Z]+\d+$/.test(name)) {
    return getCellValue(name);
  }
  return undefined;
};
```

### 3. Handle Type Conversion

Convert values to appropriate types:

```javascript
interpreter.variableResolver = (name) => {
  if (cells.has(name)) {
    const value = cells.get(name);
    // Try to parse as number
    const numValue = parseFloat(value);
    return isNaN(numValue) ? value : numValue;
  }
  return undefined;
};
```

### 4. Synchronous Resolution

The callback is synchronous. For async data sources, use a cache:

```javascript
// Pre-populate cache asynchronously
const cache = new Map();
async function loadData() {
  const data = await fetchFromAPI();
  data.forEach(item => cache.set(item.key, item.value));
}

// Synchronous resolver
interpreter.variableResolver = (name) => cache.get(name);
```

## Error Handling

### Resolver Errors

If your callback throws an error, it will propagate to the interpreter:

```javascript
interpreter.variableResolver = (name) => {
  if (name === 'FORBIDDEN') {
    throw new Error('Access denied');
  }
  return dataSource.get(name);
};

// REXX code
// LET x = FORBIDDEN  // Throws: Access denied
```

### Graceful Fallback

Return `undefined` to fall back to REXX's default behavior:

```javascript
interpreter.variableResolver = (name) => {
  try {
    return dataSource.get(name);
  } catch (error) {
    console.error(`Failed to resolve ${name}:`, error);
    return undefined;  // Fall back to REXX default
  }
};
```

## Comparison with Pre-Injection

### Before (Pre-Injection)

```javascript
// Inject all cell values upfront
cells.forEach((value, ref) => {
  interpreter.variables.set(ref, value);
});

// Problems:
// - Memory overhead (all cells injected)
// - Stale data (values don't update)
// - No on-demand resolution
```

### After (Variable Resolver)

```javascript
// Set up lazy resolution
interpreter.variableResolver = (name) => {
  if (/^[A-Z]+\d+$/.test(name)) {
    return getCellValue(name);  // Resolved on-demand
  }
  return undefined;
};

// Benefits:
// ✅ Memory efficient (only accessed cells)
// ✅ Always fresh data
// ✅ Supports dynamic updates
```

## Integration Examples

### Tauri Desktop App (Spreadsheet)

```javascript
// spreadsheet-rexx-adapter.js
class SpreadsheetRexxAdapter {
  initializeInterpreter(RexxInterpreter) {
    this.interpreter = new RexxInterpreter();

    // Set up cell reference resolver
    this.interpreter.variableResolver = (name) => {
      if (/^[A-Z]+\d+$/.test(name)) {
        const value = this.model.getCellValue(name);
        const numValue = parseFloat(value);
        return isNaN(numValue) ? value : numValue;
      }
      return undefined;
    };

    return this.interpreter;
  }
}
```

### Node.js CLI Tool

```javascript
// database-rexx.js
const interpreter = new Interpreter();
let currentRow = null;

interpreter.variableResolver = (name) => {
  if (currentRow && currentRow.hasOwnProperty(name)) {
    return currentRow[name];
  }
  return undefined;
};

// Execute query and access results
await db.query('SELECT * FROM users');
for (const row of results) {
  currentRow = row;
  await interpreter.run(parse('SAY name || " - " || email'));
}
```

### Browser Application

```javascript
// app.js
const interpreter = new RexxInterpreter();

// Resolve from DOM elements
interpreter.variableResolver = (name) => {
  const element = document.getElementById(name);
  if (element) {
    return element.value || element.textContent;
  }
  return undefined;
};

// REXX code can access DOM values
// LET username = txtUsername
// LET age = txtAge
```

## Version History

- **2024-11-06**: Initial implementation with comprehensive test coverage
  - Added `variableResolver` callback to interpreter
  - Implemented lazy resolution in expression evaluation
  - Created 12-test suite for validation
  - Deployed to spreadsheet application (version: var_missing-2024-11-06)

## See Also

- Test Suite: `core/tests/variable-resolver.spec.js`
- Implementation: `core/src/interpreter-expression-value-resolution.js`
- Variable Stack: `core/src/interpreter-variable-stack.js`
- Spreadsheet Integration: `examples/spreadsheet-poc/src/spreadsheet-rexx-adapter.js`
