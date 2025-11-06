# REQUIRE System - Module Loading

## Overview

The REQUIRE system in RexxJS allows you to load external modules, function libraries, and ADDRESS handlers dynamically. It's environment-aware and adapts to Node.js, browser, and control-bus contexts.

## Basic Syntax

```rexx
-- Load a module
REQUIRE "path/to/module.js"

-- Load with namespace prefix
REQUIRE "path/to/module.js" AS prefix_(.*)

-- Load ADDRESS handler
REQUIRE "path/to/address-handler.js"
```

## What Can You REQUIRE?

1. **ADDRESS Handlers** - Add new ADDRESS targets
2. **Function Libraries** - Add new functions (VLOOKUP, INTERP1D, etc.)
3. **Operations** - Add new imperative operations
4. **Combined Modules** - Modules with functions, operations, and ADDRESS handlers

## Environment Detection

The REQUIRE system automatically detects the runtime environment:

- **`nodejs`**: Standard Node.js process or pkg binary
- **`web-standalone`**: Browser with standalone bundle
- **`web-controlbus`**: Browser with cross-iframe RPC

Each environment supports different loading strategies.

## Path Resolution

### Explicit Prefixes

Use prefixes to explicitly specify the resolution strategy:

```rexx
-- Current working directory (Node.js only)
REQUIRE "cwd:local/my-functions.js"

-- Project root (where package.json or .git exists)
REQUIRE "root:extras/addresses/docker-address/docker-address.js"

-- Registry (GitHub Pages or custom)
REQUIRE "registry:org.rexxjs/excel-functions"

-- npm packages (Node.js only)
REQUIRE "npm:lodash"

-- GitHub repositories
REQUIRE "github.com/RexxJS/dist@latest"
```

### Relative Paths

Relative to the current script file:

```rexx
-- Same directory
REQUIRE "./helper-functions.js"

-- Parent directory
REQUIRE "../shared/utils.js"

-- Subdirectory
REQUIRE "./lib/validators.js"
```

### Absolute Paths (Node.js only)

```rexx
-- Unix
REQUIRE "/usr/local/lib/rexxjs/my-library.js"

-- Windows
REQUIRE "C:\\Libraries\\RexxJS\\my-library.js"
```

## Module Types

### Function Library Module

A module that exports functions:

```javascript
// math-extended.js
module.exports = {
  metadata: {
    name: 'math-extended',
    version: '1.0.0',
    description: 'Extended math functions'
  },

  functions: {
    SQUARE(params) {
      const { value } = params;
      return value * value;
    },

    CUBE(params) {
      const { value } = params;
      return value * value * value;
    }
  }
};
```

```rexx
-- Load and use
REQUIRE "./math-extended.js"
LET sq = SQUARE(value=5)    -- 25
LET cb = CUBE(value=3)      -- 27
```

### ADDRESS Handler Module

A module that exports an ADDRESS handler:

```javascript
// calculator-address.js
module.exports = {
  metadata: {
    name: 'CALCULATOR',
    version: '1.0.0',
    addressTarget: true
  },

  handler: async function(command, params, context) {
    switch(command.toLowerCase()) {
      case 'add':
        return params.a + params.b;
      case 'subtract':
        return params.a - params.b;
      default:
        throw new Error(`Unknown command: ${command}`);
    }
  },

  methods: ['add', 'subtract', 'multiply', 'divide']
};
```

```rexx
-- Load and use
REQUIRE "./calculator-address.js"
ADDRESS CALCULATOR
LET result = add a=10 b=20  -- 30
```

### Combined Module

A module with both functions and ADDRESS handler:

```javascript
module.exports = {
  metadata: {
    name: 'data-processor',
    addressTarget: true
  },

  functions: {
    VALIDATE_DATA(params) { /* ... */ },
    TRANSFORM_DATA(params) { /* ... */ }
  },

  operations: {
    PROCESS_BATCH(params) { /* ... */ },
    CLEAR_CACHE(params) { /* ... */ }
  },

  handler: async function(command, params, context) {
    // ADDRESS handler logic
  }
};
```

## Namespace Management with AS Clause

The AS clause transforms function names to avoid collisions:

### Basic Prefix

```rexx
-- Add prefix to all functions
REQUIRE "./docker-address.js" AS docker_(.*)

-- Now all functions have docker_ prefix
docker_CREATE_CONTAINER image="node:18"
docker_START_CONTAINER name="app"
```

### ADDRESS Target Renaming

```rexx
-- Rename ADDRESS target
REQUIRE "github.com/RexxJS/dist@latest" AS MY_ECHO

-- Use renamed ADDRESS
ADDRESS MY_ECHO
"Hello from custom name"
```

### Multiple Instances

Load the same module multiple times with different prefixes:

```rexx
-- Create two independent instances
REQUIRE "./database.js" AS db1_(.*)
REQUIRE "./database.js" AS db2_(.*)

-- Each has independent state
db1_CONNECT host="localhost" port=5432
db2_CONNECT host="remote.example.com" port=5432

LET users1 = db1_QUERY sql="SELECT * FROM users"
LET users2 = db2_QUERY sql="SELECT * FROM users"
```

## Registry System

### GitHub Pages Registry

The default registry is hosted on GitHub Pages:

```rexx
-- Load from registry
REQUIRE "registry:org.rexxjs/excel-functions"
```

Registry URL format: `https://{organization}.github.io/rexxjs-registry/{package-name}/index.js`

### Bundled vs Unbundled

```rexx
-- Bundled (all dependencies included)
REQUIRE "registry:org.rexxjs/excel-functions.bundle"

-- Unbundled (loads dependencies at runtime)
REQUIRE "registry:org.rexxjs/excel-functions"

-- Preference list (tries bundled first, falls back to unbundled)
REQUIRE "registry:org.rexxjs/excel-functions.bundle, registry:org.rexxjs/excel-functions"
```

### Custom Registry

Configure a custom registry:

```rexx
-- Set custom registry base URL
SET_REGISTRY "https://my-company.com/rexxjs-modules/"

-- Now registry: prefix uses custom registry
REQUIRE "registry:my-company/custom-functions"
```

## Dependency Management

### Transitive Dependencies

Modules can require other modules:

```javascript
// high-level-functions.js
module.exports = {
  metadata: {
    dependencies: [
      'registry:org.rexxjs/math-functions',
      'registry:org.rexxjs/string-utils'
    ]
  },

  functions: {
    COMPLEX_CALCULATION(params) {
      // Uses functions from dependencies
      const intermediate = MATH_SQRT(params.value);
      return STRING_FORMAT(intermediate);
    }
  }
};
```

### Circular Dependency Detection

RexxJS detects and prevents circular dependencies:

```rexx
-- Module A requires Module B
-- Module B requires Module A
-- Error: Circular dependency detected: A -> B -> A
```

## Environment-Specific Loading

### Node.js Environment

```rexx
-- All loading strategies available
REQUIRE "cwd:local-file.js"                    -- ✅ Supported
REQUIRE "root:extras/functions/excel.js"       -- ✅ Supported
REQUIRE "npm:lodash"                           -- ✅ Supported
REQUIRE "registry:org.rexxjs/excel-functions"  -- ✅ Supported
REQUIRE "./relative-file.js"                   -- ✅ Supported
```

### Web Standalone

```rexx
-- Limited to registry and bundled modules
REQUIRE "registry:org.rexxjs/excel-functions.bundle"  -- ✅ Supported
REQUIRE "https://cdn.example.com/my-module.js"        -- ✅ Supported (if whitelisted)
REQUIRE "cwd:local-file.js"                           -- ❌ Not supported (no filesystem)
REQUIRE "./relative-file.js"                          -- ❌ Not supported (no context)
```

### Web Control Bus

```rexx
-- Modules loaded via director frame
REQUIRE "registry:org.rexxjs/excel-functions.bundle"  -- ✅ Supported (via RPC)
REQUIRE "cwd:local-file.js"                           -- ❌ Not supported
```

## Security

### Permission System

Control what modules can be loaded:

```javascript
const interpreter = new Interpreter({
  security: {
    allowedModules: [
      'registry:org.rexxjs/*',        // Allow all official modules
      'root:extras/**/*.js',          // Allow extras directory
      './safe-local/**/*.js'          // Allow specific local directory
    ],
    blockedModules: [
      '**/dangerous-module.js'        // Block specific modules
    ]
  }
});
```

### Sandboxing

Modules loaded in web environments run in sandboxed contexts with restricted access to:
- File system (completely blocked)
- Network (only whitelisted origins)
- Global objects (limited access)

## Examples

### Loading Excel Functions

```rexx
REQUIRE "registry:org.rexxjs/excel-functions"

-- Now Excel functions are available
LET result = VLOOKUP(lookup_value="Alice", table=data, col=2)
LET sum = SUMIF(range=numbers, criteria=">10")
```

### Loading Docker ADDRESS

```rexx
REQUIRE "root:extras/addresses/docker-address/docker-address.js"

ADDRESS DOCKER
"create image=node:18 name=app"
"start name=app"
"exec container=app command='npm install'"
```

### Loading with Prefix

```rexx
REQUIRE "registry:org.rexxjs/r-stats" AS R_(.*)

LET mean = R_MEAN(data)
LET sd = R_SD(data)
LET summary = R_SUMMARY(data)
```

### Loading Multiple Modules

```rexx
-- Load several modules at once
REQUIRE "registry:org.rexxjs/excel-functions"
REQUIRE "registry:org.rexxjs/r-stats" AS R_(.*)
REQUIRE "root:extras/addresses/docker-address/docker-address.js"

-- Now all are available
LET vlookup_result = VLOOKUP(...)
LET mean_value = R_MEAN(...)
ADDRESS DOCKER
"start name=container"
```

## Troubleshooting

### Module Not Found

```rexx
-- Error: Module not found: path/to/module.js

-- Solutions:
-- 1. Check the path is correct
-- 2. Use explicit prefix (cwd:, root:, registry:)
-- 3. Verify file exists
-- 4. Check file permissions
```

### Circular Dependency

```rexx
-- Error: Circular dependency detected: A -> B -> A

-- Solution: Refactor modules to break the cycle
-- Move shared code to a third module
```

### Permission Denied

```rexx
-- Error: Module loading denied by security policy

-- Solution: Check interpreter security configuration
-- Add module to allowedModules list
```

### Wrong Environment

```rexx
-- Error: cwd: prefix not supported in browser environment

-- Solution: Use registry: prefix instead
-- Or bundle module with webpack
```

## Best Practices

### 1. Use Explicit Prefixes

```rexx
-- Good: Explicit and clear
REQUIRE "root:extras/addresses/docker-address/docker-address.js"

-- Avoid: Ambiguous
REQUIRE "extras/addresses/docker-address/docker-address.js"
```

### 2. Prefer Registry for Portability

```rexx
-- Good: Works in all environments
REQUIRE "registry:org.rexxjs/excel-functions.bundle"

-- Limited: Only works in Node.js
REQUIRE "cwd:local-functions.js"
```

### 3. Use AS Clause for Clarity

```rexx
-- Good: Clear namespace
REQUIRE "registry:org.rexxjs/r-stats" AS R_(.*)
LET mean = R_MEAN(data)  -- Clear this is an R function

-- Avoid: Pollutes global namespace
REQUIRE "registry:org.rexxjs/r-stats"
LET mean = MEAN(data)  -- Which MEAN? Excel's? R's? Built-in?
```

### 4. Load Modules at Script Start

```rexx
-- Good: Load once at start
REQUIRE "registry:org.rexxjs/excel-functions"

DO i = 1 TO 100
  LET result = VLOOKUP(...)  -- Use loaded functions
END

-- Avoid: Loading in loops
DO i = 1 TO 100
  REQUIRE "registry:org.rexxjs/excel-functions"  -- Wasteful!
  LET result = VLOOKUP(...)
END
```

### 5. Handle Load Errors

```rexx
SIGNAL ON ERROR NAME HandleLoadError

REQUIRE "registry:org.rexxjs/maybe-missing-module"

-- Continue with script
EXIT

HandleLoadError:
  SAY "Failed to load module: " || RESULT
  SAY "Continuing with reduced functionality"
  SIGNAL OFF ERROR
  -- Continue execution
```

## Next Steps

- [Module Resolution Details](52-module-resolution.md)
- [Bundling for Web](53-bundling.md)
- [ADDRESS Facility](27-address-facility.md)
- [Security Model](69-security.md)
