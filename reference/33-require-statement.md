# REQUIRE Statement Documentation

The REQUIRE statement dynamically loads external libraries and modules into your REXX environment, providing access to additional functions and ADDRESS targets.

## Table of Contents

- [Basic Syntax](#basic-syntax)
- [Library Types](#library-types)
- [AS Clause](#as-clause)
- [Loading Mechanisms](#loading-mechanisms)
- [Examples](#examples)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

## Basic Syntax

### Simple Library Loading

```rexx
REQUIRE "library-path"
```

### Named Parameter Syntax

```rexx
REQUIRE lib="library-path"
```

### With AS Clause

```rexx
REQUIRE lib="library-path" as="prefix-or-name"
```

## Path Formats

REQUIRE supports three different path formats for maximum flexibility:

### 1. Local File Paths
```rexx
REQUIRE "./extras/addresses/sqlite3/sqlite-address.js" AS SQLite
REQUIRE "../shared/utils.js" AS Utils
REQUIRE "/absolute/path/to/module.js" AS Module
```
- Relative paths for development and local modules
- Direct file system access
- Best for development and project-local libraries

### 2. Canonical Registry Names
```rexx
REQUIRE "org.rexxjs/sqlite3-address" AS SQLite
REQUIRE "namespace/module-name" AS MyLib
REQUIRE "registry:rexxjs/system-address" AS System
```
- Clean, version-managed distribution names
- Registry-based lookup with integrity checking
- Best for stable, published libraries
- Registry publishers listed at: https://rexxjs.org/.list-of-public-lib-publishers.txt

### 3. Direct HTTPS URLs
```rexx
REQUIRE "https://cdn.jsdelivr.net/npm/some-rexx-lib@1.0.0/dist/bundle.js" AS RemoteLib
REQUIRE "https://github.com/user/repo/raw/main/my-lib.js" AS GitHubLib
REQUIRE "https://example.com/custom-library.js" AS CustomLib
```
- Direct HTTP/HTTPS fetching for external modules
- Bypasses registry entirely
- Best for third-party or experimental libraries

## Library Types

### 1. Function Libraries

Libraries that provide additional built-in functions:

```rexx
REQUIRE lib="../core/src/r-graphics-functions.js"

// Now available: HIST, R_PLOT, R_SCATTER, etc.
LET chart = HIST data=[1,2,3,4,5]
SHOW chart
```

### 2. ADDRESS Target Libraries

Libraries that provide new ADDRESS targets:

```rexx
REQUIRE lib="./core/src/sqlite-address.js"

ADDRESS sqlite3
LET result = execute sql="CREATE TABLE users (id INTEGER, name TEXT)"
```

### 3. Mixed Libraries

Some libraries may provide both functions and ADDRESS targets.

## AS Clause

The AS clause allows you to customize how imported functionality is named. See [AS Clause Reference](AS-CLAUSE-REFERENCE.md) for complete documentation.

### Function Prefixing

```rexx
REQUIRE lib="../core/src/math-functions.js" as="calc_"
// Functions become: calc_SIN, calc_COS, calc_TAN
```

### ADDRESS Target Renaming

```rexx
REQUIRE lib="./core/src/sqlite-address.js" as="Database"
ADDRESS Database  // Instead of ADDRESS sqlite3
```

## Loading Mechanisms

### 1. Local File Loading

Load libraries from the local filesystem:

```rexx
REQUIRE lib="./core/src/my-library.js"           // Relative path
REQUIRE lib="/absolute/path/library.js"     // Absolute path
REQUIRE lib="../utils/helper-functions.js"  // Parent directory
```

### 2. GitHub Library Loading

Automatically fetch libraries from GitHub:

```rexx
REQUIRE lib="r-graphing"  // Loads from github.com/rexx-libs/r-graphing
```

The system will try:
1. Local file (if path-like)
2. GitHub raw URL: `https://raw.githubusercontent.com/rexx-libs/{name}/main/lib/{name}.js`

### 3. Registry Loading

Load verified libraries from the RexxJS registry using namespaced names:

```rexx
REQUIRE "registry:rexxjs/system-address"        // Official RexxJS library
REQUIRE "registry:com.google--ai/gemini-pro-address"  // Vendor library with subdomain
REQUIRE "registry:com.paulhammant/custom-address"     // Personal domain library
```

Registry syntax: `registry:namespace/library-name` where:
- `namespace` is either `domain` or `domain--subdomain`  
- Libraries must be registered in `.list-of-public-lib-publishers.csv`
- Domain ownership verification required for registration

### 4. Dependency Management

Libraries can have dependencies that are automatically loaded:

```rexx
REQUIRE lib="complex-library"
// Automatically loads any dependencies specified in the library
```

## Examples

### Example 1: Basic Function Library

```rexx
// Load R graphics functions
REQUIRE lib="../core/src/r-graphics-functions.js"

// Create data
LET data = [10, 20, 15, 25, 30, 18, 22]

// Create histogram
LET histogram = HIST data=data bins=5 title="Sales Data"

// Display the chart
SHOW histogram
```

### Example 2: Database Operations

```rexx
// Load SQLite support
REQUIRE lib="./core/src/sqlite-address.js"

// Create table
ADDRESS sqlite3
LET create_result = execute sql="CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, price REAL)"

// Insert data
LET insert_result = execute sql="INSERT INTO products (name, price) VALUES ('Widget', 19.99)"

// Query data
LET query_result = execute sql="SELECT * FROM products"
SAY "Found {query_result.count} products"
```

### Example 3: Multiple Libraries with Prefixes

```rexx
// Load different function sets with prefixes to avoid conflicts
REQUIRE lib="../core/src/string-utilities.js" as="str_"
REQUIRE lib="../core/src/math-utilities.js" as="math_"
REQUIRE lib="../core/src/date-utilities.js" as="date_"

// Use prefixed functions
LET cleaned = str_TRIM input="  hello world  "
LET result = math_SQRT value=25
LET formatted = date_FORMAT date="2025-01-15" format="MM/DD/YYYY"
```

### Example 4: GitHub Library Loading

```rexx
// Load library from GitHub
REQUIRE lib="r-graphing"

// Use functions from the loaded library
LET scatter = R_SCATTER x=[1,2,3,4] y=[2,4,1,5] title="Scatter Plot"
SHOW scatter
```

### Example 5: Registry Library Loading

```rexx
// Load official RexxJS libraries from registry
REQUIRE "registry:rexxjs/system-address"
REQUIRE "registry:rexxjs/jq-address" as="JSON"

// Load vendor-specific libraries  
REQUIRE "registry:com.anthropic/claude-address" as="AI"
REQUIRE "registry:com.google--ai/gemini-pro-address" as="Gemini"

// Use the loaded libraries
ADDRESS system
"ls -al *.rexx"

ADDRESS JSON  
LET result = filter data=json_data query=".items[].name"

ADDRESS AI
LET response = chat message="Explain quantum computing" model="claude-3"
```

### Example 6: Semantic DATABASE Names

```rexx
// Load databases with meaningful names
REQUIRE lib="./core/src/sqlite-address.js" as="LocalCache"
REQUIRE lib="./core/src/postgres-address.js" as="MainDatabase"

// Use semantic names in ADDRESS statements
ADDRESS LocalCache
LET temp_data = execute sql="SELECT * FROM temp_results"

ADDRESS MainDatabase
LET users = execute sql="SELECT name, email FROM users WHERE active=1"
```

## Error Handling

### Common Errors

#### Library Not Found

```rexx
REQUIRE lib="nonexistent-library.js"
// Error: Could not load library: nonexistent-library.js
```

#### Invalid AS Clause

```rexx
REQUIRE lib="./core/src/lib.js" as=123
// Error: AS clause must be a string
```

#### Network Errors (GitHub Loading)

```rexx
REQUIRE lib="nonexistent-github-lib"  
// Warning: GitHub Raw failed for nonexistent-github-lib: Network error
// Error: Could not load library from any source
```

### Error Recovery

```rexx
// Use TRY/CATCH for graceful error handling
TRY
    REQUIRE lib="optional-library"
    SAY "Optional library loaded successfully"
CATCH error
    SAY "Could not load optional library: {error.message}"
    SAY "Continuing with basic functionality..."
END
```

## Best Practices

### 1. Use Descriptive Library Paths

```rexx
// ✅ Good - clear what the library provides
REQUIRE lib="../core/src/r-graphics-functions.js"
REQUIRE lib="./database/sqlite-address.js"

// ❌ Avoid - unclear purpose
REQUIRE lib="../core/src/lib1.js"
REQUIRE lib="./stuff.js"
```

### 2. Use AS Clause for Organization

```rexx
// ✅ Good - organized with prefixes
REQUIRE lib="../core/src/math-functions.js" as="math_"
REQUIRE lib="../core/src/string-functions.js" as="str_"
REQUIRE lib="../core/src/date-functions.js" as="date_"

// Clear usage
LET result = math_SQRT value=25
LET cleaned = str_TRIM input="  hello  "
```

### 3. Load Libraries Early

```rexx
// ✅ Good - load all dependencies at the start
REQUIRE lib="../core/src/r-graphics-functions.js"
REQUIRE lib="./core/src/sqlite-address.js" as="Database"

// Then use throughout the script
LET data = [1,2,3,4,5]
LET chart = HIST data=data
// ... rest of script
```

### 4. Document Your Dependencies

```rexx
/*
 * Required Libraries:
 * - r-graphics-functions.js: Statistical plotting (HIST, SCATTER, etc.)
 * - sqlite-address.js: Local database operations
 * - string-utilities.js: Enhanced string processing
 */

REQUIRE lib="../core/src/r-graphics-functions.js"
REQUIRE lib="./core/src/sqlite-address.js" as="DB"
REQUIRE lib="../core/src/string-utilities.js" as="str_"
```

### 5. Handle Optional Dependencies

```rexx
// Load required libraries
REQUIRE lib="../core/src/core-functions.js"

// Load optional enhancements
TRY
    REQUIRE lib="../core/src/advanced-graphics.js" as="gfx_"
    LET has_advanced_graphics = TRUE
CATCH
    LET has_advanced_graphics = FALSE
    SAY "Advanced graphics not available - using basic functions"
END

// Use conditional functionality
IF has_advanced_graphics THEN
    LET chart = gfx_ADVANCED_PLOT data=data
ELSE  
    LET chart = HIST data=data
ENDIF
```

## Library Development

### Creating Function Libraries

Create a library that exports functions:

```javascript
// my-math-lib.js
function ADVANCED_SIN(angle, unit = 'radians') {
    // Implementation
    return result;
}

function COMPLEX_LOG(value, base = Math.E) {  
    // Implementation
    return result;
}

// Export for REXX
if (typeof window !== 'undefined') {
    // Browser environment
    window.ADVANCED_SIN = ADVANCED_SIN;
    window.COMPLEX_LOG = COMPLEX_LOG;
    
    // Detection function for REQUIRE
    window.MY_MATH_LIB_MAIN = () => ({
        type: 'library',
        name: 'my-math-lib', 
        version: '1.0.0',
        provides: {
            functions: ['ADVANCED_SIN', 'COMPLEX_LOG']
        }
    });
}
```

### Creating ADDRESS Libraries

Create a library that provides ADDRESS targets:

```javascript
// my-service-address.js
function MY_SERVICE_HANDLER(command, options) {
    // Handle ADDRESS commands
    return result;
}

// Export ADDRESS target
if (typeof module !== 'undefined') {
    module.exports = {
        type: 'address-target',
        name: 'My Service Integration',
        version: '1.0.0',
        provides: {
            addressTarget: 'myservice',
            commandSupport: true,
            methodSupport: true
        },
        handler: MY_SERVICE_HANDLER,
        methods: {
            status: () => ({ service: 'myservice', status: 'ready' })
        }
    };
}
```

## See Also

- [AS Clause Reference](AS-CLAUSE-REFERENCE.md) - Complete AS clause documentation
- [ADDRESS Statement Documentation](ADDRESS.md) - Working with ADDRESS targets
- [Function Reference](FUNCTIONS.md) - Built-in function documentation
- [Library Development Guide](LIBRARY-DEVELOPMENT.md) - Creating your own libraries