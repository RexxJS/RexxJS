# AS Clause Reference Documentation

The AS clause provides powerful aliasing and prefixing capabilities for the REQUIRE statement, allowing you to customize how imported functions and ADDRESS targets are named in your REXX environment.

## Table of Contents

- [Overview](#overview)
- [Syntax](#syntax)
- [Function Library Prefixing](#function-library-prefixing)
- [ADDRESS Target Renaming](#address-target-renaming)
- [Validation Rules](#validation-rules)
- [Examples](#examples)
- [Technical Implementation](#technical-implementation)

## Overview

The AS clause extends the REQUIRE statement to support:

1. **Function Prefixing** - Add prefixes to imported functions to avoid naming conflicts
2. **Regex Pattern Prefixing** - Use regex patterns for flexible function naming
3. **ADDRESS Target Renaming** - Rename ADDRESS targets for cleaner syntax

## Syntax

```rexx
REQUIRE lib="<library-path>" as="<prefix-or-name>"
```

### Parameters

- `lib` - The library file path (same as the first parameter to REQUIRE)
- `as` - The prefix pattern or new name to apply

## Function Library Prefixing

### Simple Prefixing

Add a simple prefix to all imported functions:

```rexx
REQUIRE lib="../core/src/r-graphics-functions.js" as="math_"

// Original functions: HIST, R_PLOT, R_SCATTER
// Prefixed functions: math_HIST, math_R_PLOT, math_R_SCATTER
```

**Note**: If the prefix doesn't end with `_`, it will be automatically added.

### Regex Pattern Prefixing

Use regex patterns for more flexible naming:

```rexx
REQUIRE lib="../core/src/r-graphics-functions.js" as="gfx_(.*)"

// Original functions: HIST, R_PLOT, R_SCATTER
// Transformed functions: gfx_HIST, gfx_R_PLOT, gfx_R_SCATTER
```

The `(.*)` pattern captures the original function name and replaces it in the prefix.

### Multiple Libraries with Different Prefixes

```rexx
REQUIRE lib="../core/src/r-graphics-functions.js" as="plot_"
REQUIRE lib="../core/src/r-math-functions.js" as="calc_"

// plot_HIST, plot_R_SCATTER
// calc_MEAN, calc_MEDIAN
```

## ADDRESS Target Renaming

Rename ADDRESS targets for cleaner or more semantic naming:

```rexx
REQUIRE lib="./core/src/sqlite-address.js" as="SQL"

ADDRESS SQL
LET result = execute sql="CREATE TABLE users (id INTEGER, name TEXT)"
```

**Original**: The library registers as `sqlite3`
**Renamed**: Available as `SQL` (case-preserved)

### Multiple SQL Providers

```rexx
REQUIRE lib="./core/src/sqlite-address.js" as="SQLite"
REQUIRE lib="./core/src/postgres-address.js" as="PostgreSQL"
REQUIRE lib="./core/src/mysql-address.js" as="MySQL"

ADDRESS SQLite
LET sqlite_result = execute sql="SELECT * FROM local_data"

ADDRESS PostgreSQL  
LET pg_result = execute sql="SELECT * FROM remote_data"
```

## Validation Rules

### 1. Regex Patterns Not Allowed for ADDRESS Modules

```rexx
// ❌ This will fail
REQUIRE lib="./core/src/sqlite-address.js" as="db_(.*)"
// Error: Cannot use regex patterns in AS clause for ADDRESS modules
```

**Reason**: ADDRESS targets must have fixed, known names for the ADDRESS statement to work.

### 2. AS Clause Must Be String

```rexx
// ❌ This will fail
REQUIRE lib="./core/src/lib.js" as=123
// Error: AS clause must be a string
```

### 3. Library Name Must Be String

```rexx
// ❌ This will fail
REQUIRE lib=123 as="prefix_"
// Error: REQUIRE requires a string library name
```

## Examples

### Example 1: Avoiding Function Name Conflicts

```rexx
// Load two libraries with potentially conflicting function names
REQUIRE lib="../core/src/string-utils.js" as="str_"
REQUIRE lib="../core/src/text-processor.js" as="txt_"

// Use prefixed functions
LET cleaned = str_TRIM input="  hello world  "
LET processed = txt_TRIM input="  different processing  "
```

### Example 2: Semantic Database Naming

```rexx
// Load different databases with semantic names
REQUIRE lib="./core/src/sqlite-address.js" as="Cache"
REQUIRE lib="./core/src/postgres-address.js" as="MainDB"

// Use semantic ADDRESS targets
ADDRESS Cache
LET cached_data = execute sql="SELECT * FROM temp_results"

ADDRESS MainDB
LET user_data = execute sql="SELECT * FROM users WHERE active=1"
```

### Example 3: Graphics Library Organization

```rexx
// Organize graphics functions by category
REQUIRE lib="../core/src/r-graphics-functions.js" as="plot_"
REQUIRE lib="../core/src/chart-functions.js" as="chart_"

// Create different types of visualizations
LET histogram = plot_HIST data=[1,2,3,4,5]
SHOW histogram

LET piechart = chart_PIE data=[10,20,30] labels=["A","B","C"]  
SHOW piechart
```

### Example 4: Regex Pattern Usage

```rexx
// Use regex pattern for consistent naming
REQUIRE lib="../core/src/math-extensions.js" as="math_(.*)"

// Original: ADVANCED_SIN, COMPLEX_LOG, MATRIX_MULTIPLY
// Becomes: math_ADVANCED_SIN, math_COMPLEX_LOG, math_MATRIX_MULTIPLY

LET result = math_ADVANCED_SIN angle=45 unit="degrees"
```

## Technical Implementation

### Function Registration Process

1. **Library Loading**: Library loads and registers functions normally
2. **AS Clause Detection**: Interpreter detects AS clause parameter
3. **Name Transformation**: Functions are re-registered with transformed names
4. **Original Cleanup**: Original function names are removed (if prefixed)

### ADDRESS Target Registration Process

1. **Library Loading**: ADDRESS library registers target normally  
2. **AS Clause Detection**: Interpreter detects AS clause for ADDRESS module
3. **Target Renaming**: ADDRESS target is re-registered with new name
4. **Validation**: Ensures no regex patterns are used for ADDRESS modules

### Parameter Conversion

The parser converts named parameters to positional arguments:

```javascript
// Parser output
{
  type: "FUNCTION_CALL", 
  command: "REQUIRE",
  params: {
    lib: "../core/src/r-graphics-functions.js",
    as: "math_"
  }
}

// Converted to function arguments
["../core/src/r-graphics-functions.js", "math_"]
```

### Browser Compatibility

The AS clause works in both Node.js and browser environments:

- **Node.js**: Full functionality with file system access
- **Browser**: Works with web-accessible libraries and browser-compatible modules

## Best Practices

### 1. Use Descriptive Prefixes

```rexx
// ✅ Good - descriptive and clear
REQUIRE lib="../core/src/database-utils.js" as="db_"
REQUIRE lib="../core/src/string-utils.js" as="str_"

// ❌ Avoid - unclear abbreviations  
REQUIRE lib="../core/src/database-utils.js" as="d_"
```

### 2. Consistent Naming Conventions

```rexx
// ✅ Good - consistent underscore convention
REQUIRE lib="../core/src/lib1.js" as="math_"
REQUIRE lib="../core/src/lib2.js" as="text_" 
REQUIRE lib="../core/src/lib3.js" as="data_"

// ❌ Inconsistent
REQUIRE lib="../core/src/lib1.js" as="math_"
REQUIRE lib="../core/src/lib2.js" as="textLib"
REQUIRE lib="../core/src/lib3.js" as="DATA-"
```

### 3. Semantic ADDRESS Names

```rexx
// ✅ Good - semantic and meaningful
REQUIRE lib="./core/src/sqlite-address.js" as="LocalDB"
REQUIRE lib="./core/src/redis-address.js" as="Cache"

// ❌ Less clear
REQUIRE lib="./core/src/sqlite-address.js" as="DB1"
REQUIRE lib="./core/src/redis-address.js" as="DB2"
```

### 4. Document Your Aliases

```rexx
/* Load graphics libraries with organized prefixes */
REQUIRE lib="../core/src/r-graphics-functions.js" as="plot_"    // Statistical plots
REQUIRE lib="../core/src/chart-functions.js" as="chart_"        // Business charts  
REQUIRE lib="../core/src/diagram-functions.js" as="draw_"       // Technical diagrams
```

## Troubleshooting

### Common Errors

#### "Cannot use regex patterns in AS clause for ADDRESS modules"

**Problem**: Trying to use regex patterns with ADDRESS libraries
```rexx
REQUIRE lib="./core/src/sqlite-address.js" as="db_(.*)"  // ❌ Error
```

**Solution**: Use simple string names for ADDRESS targets
```rexx  
REQUIRE lib="./core/src/sqlite-address.js" as="Database"  // ✅ Works
```

#### Functions not found after prefixing

**Problem**: Original function names no longer available
```rexx
REQUIRE lib="../core/src/math-lib.js" as="calc_"
LET result = SQRT value=25  // ❌ SQRT not found
```

**Solution**: Use prefixed function names
```rexx
REQUIRE lib="../core/src/math-lib.js" as="calc_"  
LET result = calc_SQRT value=25  // ✅ Works
```

#### AS clause ignored

**Problem**: Using positional parameters instead of named parameters
```rexx
REQUIRE "../core/src/lib.js" "prefix_"  // ❌ AS clause ignored
```

**Solution**: Use named parameter syntax
```rexx
REQUIRE lib="../core/src/lib.js" as="prefix_"  // ✅ Works
```

## See Also

- [REQUIRE Statement Documentation](REQUIRE.md)
- [ADDRESS Statement Documentation](ADDRESS.md)
- [Function Library Development Guide](LIBRARY-DEVELOPMENT.md)
- [REPL User Guide](REPL.md)