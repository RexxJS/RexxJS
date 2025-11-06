# REQUIRE System - Dynamic Library Loading

The REQUIRE statement enables hot-loading of JavaScript libraries at runtime, supporting all execution modes (Autonomous Web, Controlled Web, Command-line) with automatic dependency resolution.

## Basic Syntax

```rexx
REQUIRE "github.com/<owner>/<library>@<tag>"
REQUIRE "central:<owner>/<library>@<tag>"
REQUIRE "./relative/path/to/library.js"
REQUIRE "../shared/utils.js" 
REQUIRE "github.com/<owner>/<library>@SNAPSHOT"
```

**Examples:**
```rexx
-- Load specific released version (direct GitHub)
REQUIRE "github.com/alice/math-utils@v1.2.3"

-- Load registry-verified version with integrity checking
REQUIRE "central:alice/math-utils@v1.2.3"

-- Load latest released version  
REQUIRE "github.com/bob/chart-lib@latest"

-- Load development version (always fetches latest)
REQUIRE "github.com/alice/math-utils@SNAPSHOT"

-- Load local relative file (development)
REQUIRE "./libs/my-local-utils.js"
REQUIRE "../shared-components/chart-helpers.js"

-- Use loaded functions (same regardless of source)
LET result = CALCULATE_STATISTICS data=[1,2,3,4,5]
LET chart = CREATE_LINE_CHART data=result.values
```

## Environment Detection and Loading

### Browser Environment

**Network requests via `fetch()`:**
- Libraries loaded via HTTP requests to GitHub
- Code executed using `eval()` in global scope
- Functions registered in `window` namespace
- Library detection via `window['library-name']`

**Example flow:**
```javascript
// 1. Fetch library code
fetch('https://github.com/alice/math-utils/releases/download/v1.2.3/math-utils-min.js')
  
// 2. Execute in global scope
eval(libraryCode)

// 3. Functions now available globally
window['math-utils'].CALCULATE_STATISTICS([1,2,3])
```

### Node.js Environment

**Network requests via `https.get()`:**
- Same GitHub URLs, different HTTP client
- Code executed using `vm.runInContext()` with proper global context
- Functions registered in created context + copied to global scope
- Library detection via `global['library-name']`

**Example flow:**
```javascript
// 1. Fetch library code  
https.get('https://github.com/alice/math-utils/releases/download/v1.2.3/math-utils-min.js', ...)

// 2. Execute in isolated context with global access
const context = vm.createContext({ ...global });
vm.runInContext(libraryCode, context);

// 3. Copy functions to main global scope
global['math-utils'] = context['math-utils'];
```

## Library Loading Sequence

### Fallback GET Sequence

For `REQUIRE "github.com/<owner>/<libName>@<tag>"`:

**1st attempt - GitHub Releases (Minified) ⭐:**
```
GET https://github.com/<owner>/<libName>/releases/download/<tag>/<libName>-min.js
```

**2nd attempt - GitHub Releases (Development) ⭐:**
```
GET https://github.com/<owner>/<libName>/releases/download/<tag>/<libName>.js
```

**3rd attempt - GitHub Releases (Versioned fallback):**
```
GET https://github.com/<owner>/<libName>/releases/download/<tag>/<libName>-<tag>.js
```

**4th attempt - GitHub Releases (Generic bundle):**
```
GET https://github.com/<owner>/<libName>/releases/download/<tag>/bundle.js
```

**5th attempt - GitHub Releases (Generic index):**
```
GET https://github.com/<owner>/<libName>/releases/download/<tag>/index.js
```

**6th attempt - GitHub Raw Files (Development fallback):**
```
GET https://raw.githubusercontent.com/<owner>/<libName>/<tag>/libs/<libName>.js
```

**First successful GET wins and stops the sequence.**

## Development Workflows

### Local File References

For libraries under development that aren't released yet:

```rexx
-- Relative paths (resolved from current script location)
REQUIRE "./my-development-lib.js"           -- Same directory
REQUIRE "../shared/common-utils.js"         -- Parent directory  
REQUIRE "../../team-libs/specialized.js"    -- Multiple levels up
REQUIRE "./subfolder/helpers.js"            -- Subdirectory
```

## Node.js Development Mode (Command Line)

**Full compatibility with Node.js ecosystem:**

```rexx
-- Node.js modules work directly via native require()
REQUIRE "./utils.js"              -- Uses Node.js require() automatically
REQUIRE "../shared/helpers.js"    -- Node.js path resolution
REQUIRE "lodash"                  -- npm packages work seamlessly
```

**Loading behavior in Node.js mode:**
- **Native Node.js require()** - `./relative/paths.js` use Node.js module loading
- **Full module.exports support** - Existing Node.js modules work instantly
- **Node.js path resolution** - Relative to current script file
- **No build step required** - Direct execution of development code
- **Mixed dependencies** - Node.js modules + GitHub libraries seamlessly
- **Hot reloading** - File changes reload automatically
- **Full npm ecosystem** - All Node.js packages available via require()

**Example Node.js module (works as-is):**
```javascript
// shared/math-helpers.js - Standard Node.js module
function calculateAverage(numbers) {
  return numbers.reduce((a, b) => a + b) / numbers.length;
}

function findMax(numbers) {
  return Math.max(...numbers);
}

module.exports = { calculateAverage, findMax };
```

**Usage in RexxJS (Node.js mode):**
```rexx
-- Loads Node.js module automatically
REQUIRE "./shared/math-helpers.js"

-- Node.js functions auto-wrapped as RexxJS functions
LET avg = CALCULATEAVERAGE data=[1,2,3,4,5]
LET max = FINDMAX data=[1,2,3,4,5]
SAY "Average:" avg "Max:" max
```

## Browser Development Mode (Webpack Required)

**Webpack preprocessing required for local files:**

```rexx
-- Browser mode - local files must be webpack-bundled
REQUIRE "https://localhost:8080/dist/my-dev-bundle.js"    -- Bundled local code
REQUIRE "https://localhost:8080/dist/shared-bundle.js"    -- Bundled shared code
REQUIRE "github.com/alice/math-utils@latest"              -- GitHub libraries work directly
```

**Loading behavior in browser mode:**
- **No native require()** - Browser cannot resolve `./relative/paths.js`
- **Webpack bundling required** - Local files must be pre-processed
- **HTTP/HTTPS URLs only** - All resources must be web-accessible
- **Build step necessary** - Development workflow requires build process
- **GitHub libraries work directly** - No build step needed for external libraries

**Browser development workflow:**
```bash
# 1. Bundle local development files
webpack-dev-server --mode=development

# 2. RexxJS script can now load bundled code
# REQUIRE "http://localhost:8080/dist/my-feature-bundle.js"
```

## Development Environment Comparison

| Feature | Node.js Mode | Browser Mode |
|---------|--------------|--------------|
| **Local files** | ✅ Direct `./file.js` | ❌ Must bundle first |
| **Node.js modules** | ✅ Native require() | ❌ Must bundle first |
| **npm packages** | ✅ Direct access | ❌ Must bundle first |
| **GitHub libraries** | ✅ Direct REQUIRE | ✅ Direct REQUIRE |
| **Hot reloading** | ✅ Automatic | ⚠️ Via webpack-dev-server |
| **Build step** | ❌ Not needed | ✅ Required |
| **Debugging** | ✅ Native Node.js | ⚠️ Browser DevTools |

**Recommendation for development:**
- **Start in Node.js mode** for rapid development and testing
- **Switch to browser mode** for final testing and deployment

## Local Library Development Workflow

**Phase 1: Local Development (Node.js)**
```rexx
-- Direct development with Node.js modules
REQUIRE "./my-new-library.js"        -- Your library under development
REQUIRE "../shared/team-utils.js"    -- Shared team modules
REQUIRE "lodash"                     -- npm packages
REQUIRE "github.com/alice/math-utils@latest"  -- External GitHub libraries

-- Test your library
LET result = MY_NEW_FUNCTION data=[1,2,3]
SAY "Development result:" result
```

**Phase 2: Pre-Release Testing (SNAPSHOT)**
```bash
# Publish development version to GitHub
gh release create SNAPSHOT my-library.js

# Update RexxJS scripts
# REQUIRE "github.com/me/my-library@SNAPSHOT"
```

**Phase 3: Browser Compatibility (Webpack)**
```bash
# Bundle for browser testing
webpack --mode=development --output-filename=my-library-bundle.js

# Test in browser
# REQUIRE "http://localhost:8080/dist/my-library-bundle.js"
```

**Phase 4: Production Release**
```bash
# Create release
gh release create v1.0.0 my-library.js my-library-min.js

# Update production scripts
# REQUIRE "github.com/me/my-library@v1.0.0"
```

**Example local development library:**
```javascript
/*!
 * my-dev-lib v0.0.0-dev | Development Version
 * @rexxjs-meta {
 *   "dependencies": {
 *     "github.com/alice/math-utils": "latest",
 *     "./other-local-lib.js": "dev"
 *   }
 * }
 */

const myDevLib = {
  'MY_DEV_LIB_MAIN': () => ({
    type: 'library_info',
    name: 'My Development Library',
    version: '0.0.0-dev',
    loaded: true
  }),
  
  'EXPERIMENTAL_FUNCTION': (data) => {
    // Cutting-edge features under development
  }
};

// Standard dual export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 'my-dev-lib': myDevLib };
  if (typeof global !== 'undefined') global['my-dev-lib'] = myDevLib;
} else if (typeof window !== 'undefined') {
  window['my-dev-lib'] = myDevLib;
}
```

### SNAPSHOT Versions

For libraries with ongoing development builds (Maven-style):

```rexx
-- Always fetches latest development version
REQUIRE "github.com/alice/math-utils@SNAPSHOT"
```

**SNAPSHOT loading behavior:**
1. **Skips caching** - Always fetches fresh version
2. **Tries SNAPSHOT-specific URLs first:**
   ```
   GET https://github.com/alice/math-utils/releases/download/SNAPSHOT/math-utils-min.js
   GET https://github.com/alice/math-utils/releases/download/SNAPSHOT/math-utils.js
   ```
3. **Falls back to main branch raw files:**
   ```
   GET https://raw.githubusercontent.com/alice/math-utils/main/libs/math-utils.js
   ```
4. **No integrity verification** - SNAPSHOT versions change constantly
5. **Dependency resolution works** - Can depend on other SNAPSHOTs

### Mixed Development Dependencies

Real-world development often mixes stable releases with local development:

```rexx
-- Production dependencies
REQUIRE "github.com/alice/math-utils@v1.2.3"     -- Stable release
REQUIRE "github.com/bob/chart-lib@v2.1.0"        -- Stable release

-- Development dependencies  
REQUIRE "./my-new-feature.js"                     -- Local development
REQUIRE "github.com/carol/experimental@SNAPSHOT"  -- Latest experimental
REQUIRE "../shared/team-utils.js"                 -- Shared team library

-- All work together seamlessly
LET result = CALCULATE_STATISTICS data=data       -- From stable release
LET enhanced = MY_NEW_FEATURE data=result         -- From local dev
LET chart = CREATE_CHART data=enhanced            -- From stable release
```

### Development Best Practices

**Local file organization:**
```
project/
├── main.rexx                    ← Main script
├── libs/
│   ├── my-feature.js           ← REQUIRE "./libs/my-feature.js"
│   └── helpers.js              ← REQUIRE "./libs/helpers.js"  
├── shared/
│   └── common.js               ← REQUIRE "./shared/common.js"
└── tests/
    └── test-runner.rexx
```

**Dependency declarations in local files:**
```javascript
/*!
 * @rexxjs-meta {
 *   "dependencies": {
 *     "github.com/lodash/lodash": "latest",  // External stable
 *     "./helpers.js": "dev",                // Local relative
 *     "../shared/common.js": "dev"          // Local relative (parent)  
 *   }
 * }
 */
```

**Transitioning to releases:**
1. **Development**: `REQUIRE "./my-lib.js"`
2. **Pre-release**: `REQUIRE "github.com/me/my-lib@SNAPSHOT"`
3. **Release**: `REQUIRE "github.com/me/my-lib@v1.0.0"`

### Zero-Overhead Detection

Before making network requests, REQUIRE checks if library is already loaded:

```javascript
// Check for library detection function
const detectionFunc = `${libraryName.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_MAIN`;

// Try to find function in global scope
if (typeof window !== 'undefined' && window[detectionFunc]) {
  // Already loaded - no network request needed
  return true;
}
```

## Transitive Dependency Resolution

### @rexxjs-meta Format Specification

The `@rexxjs-meta` annotation contains JSON metadata about the library:

```typescript
interface RexxJSMeta {
  // Runtime dependencies (the only type that matters for REQUIRE)
  dependencies?: { [moduleName: string]: string };   // Libraries to load before this one
  
  // Library information (optional)
  name?: string;           // Human-readable library name
  version?: string;        // Semantic version (e.g., "1.2.3")
  author?: string;         // Library author/organization
  license?: string;        // License identifier (e.g., "MIT", "Apache-2.0")
  homepage?: string;       // Documentation/project URL
  repository?: string;     // Source code repository URL
  
  // Build metadata (optional)
  minified?: boolean;      // Whether this file is minified
  buildTime?: string;      // ISO timestamp of build
  buildTool?: string;      // Build tool used (webpack, rollup, etc.)
  
  // Security metadata (optional)
  engines?: { [engine: string]: string };  // Required engine versions
}
```

**Example with full metadata:**
```javascript
/*!
 * advanced-analytics v2.1.0 | (c) 2024 DataCorp | MIT License
 * 
 * @rexxjs-meta {
 *   "dependencies": {
 *     "github.com/alice/math-utils": "^1.0.0",
 *     "github.com/bob/chart-lib": "latest"
 *   },
 *   "name": "Advanced Analytics Library",
 *   "version": "2.1.0",
 *   "author": "DataCorp Engineering",
 *   "license": "MIT",
 *   "homepage": "https://datacorp.com/analytics",
 *   "repository": "https://github.com/datacorp/advanced-analytics",
 *   "minified": true,
 *   "buildTime": "2024-01-15T10:30:00Z",
 *   "buildTool": "webpack@5.89.0",
 *   "engines": {
 *     "rexxjs": ">=1.0.0",
 *     "node": ">=14.0.0"
 *   }
 * }
 */
```

### Dependency Declaration Methods

Libraries can declare dependencies using multiple approaches:

**1. Important Comments (Minification-Safe) - RECOMMENDED:**
```javascript
/*!
 * awesome-data-lib v2.1.0 | MIT License
 * 
 * Dependencies:
 * @rexxjs-meta {
 *   "dependencies": {
 *     "github.com/alice/math-utils": "^1.0.0",
 *     "github.com/bob/chart-lib": "latest"
 *   }
 * }
 */
```

**2. Runtime Metadata (Always Works):**
```javascript
const dataAnalysis = {
  'DATA_ANALYSIS_MAIN': () => ({
    type: 'library_info',
    dependencies: [
      'github.com/alice/math-utils@^1.0.0',
      'github.com/bob/chart-lib@latest'
    ],
    loaded: true
  }),
  // ... library functions
};
```

**3. Standard JSON Format (Development Only):**
```javascript
/**
 * @rexxjs-meta-start
 * {
 *   "dependencies": {
 *     "github.com/alice/math-utils": "^1.0.0"
 *   }
 * }
 * @rexxjs-meta-end
 */
```

### Dependency Resolution Algorithm

1. **Load primary library**
2. **Extract dependencies** from library code (using priority order above)
3. **Recursively load dependencies** using same REQUIRE process
4. **Track dependency graph** to prevent circular dependencies
5. **Register all functions** after entire dependency tree is loaded

**Example:**
```rexx
REQUIRE "github.com/alice/data-analysis"

-- This automatically loads:
-- 1. github.com/alice/data-analysis
-- 2. github.com/alice/math-utils (dependency)
-- 3. github.com/bob/chart-lib (dependency)
-- 4. Any dependencies of those libraries
```

### Circular Dependency Detection

```javascript
// Maintains loading queue to detect cycles
if (this.loadingQueue.has(libraryName)) {
  throw new Error(`Circular dependency detected: ${libraryName} is already loading`);
}
```

## Library Publishing Guide

### GitHub Releases Convention

**Required naming for library authors:**

```
Release v1.2.3:
├── <libraryName>-min.js    ← PREFERRED (tried first)
├── <libraryName>.js        ← REQUIRED (tried second)
└── CHANGELOG.md
```

**Examples:**
- `math-utils-min.js` and `math-utils.js`
- `chart-lib-min.js` and `chart-lib.js`

### Library Structure Template

```javascript
/*!
 * my-library v1.0.0 | MIT License
 * @rexxjs-meta {"dependencies":{"lodash":"^4.17.0"}}
 */

const myLibrary = {
  // Primary detection function (REQUIRED)
  'MY_LIBRARY_MAIN': () => ({
    type: 'library_info',
    name: 'My Library',
    version: '1.0.0',
    dependencies: ['lodash@^4.17.0'], // Backup metadata
    loaded: true
  }),

  // Your functions
  'DO_SOMETHING': (param) => {
    // Implementation here
  }
};

// Dual environment export
if (typeof module !== 'undefined' && module.exports) {
  // Node.js
  module.exports = { 'my-library': myLibrary };
  if (typeof global !== 'undefined') {
    global['my-library'] = myLibrary;
  }
} else if (typeof window !== 'undefined') {
  // Browser
  window['my-library'] = myLibrary;
}
```

### Build Script Example

```json
{
  "scripts": {
    "build": "webpack --mode=development --output-filename=my-library.js",
    "build:min": "webpack --mode=production --output-filename=my-library-min.js", 
    "build:release": "npm run build && npm run build:min",
    "release": "gh release create v$npm_package_version dist/my-library.js dist/my-library-min.js"
  }
}
```

### GitHub Actions Release Automation

```yaml
name: Release
on:
  push:
    tags: ['v*']

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      
      - name: Build library files with correct naming
        run: |
          npm ci
          npm run build:release
        
      - name: Create GitHub release with standard naming
        uses: softprops/action-gh-release@v1
        with:
          files: |
            dist/${{ github.event.repository.name }}.js
            dist/${{ github.event.repository.name }}-min.js
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Minification-Safe Dependencies

### The Problem

Standard comments are removed during minification:
```javascript
/* @dependencies github.com/alice/math-utils */  // ← Gone after minification!
```

### The Solution: Important Comments

Use `/*!` comments that **all minifiers preserve by default**:

```javascript
/*!
 * my-library v1.0.0 | MIT License
 * @rexxjs-meta {"dependencies":{"github.com/alice/math-utils":"^1.0.0"}}
 */
```

**Key benefits:**
- ✅ **Zero configuration** - Works with default minifier settings
- ✅ **Perfect preservation** - Newlines and indentation intact
- ✅ **Universal support** - Webpack, Rollup, ESBuild, Terser all preserve `/*!`
- ✅ **Established pattern** - Same approach as jQuery, Lodash, Bootstrap

### Default Minifier Behavior

These commands preserve important comments out-of-the-box:
```bash
webpack --mode=production
rollup -c
esbuild --minify src/lib.js
terser src/lib.js
```

### Before and After Minification

**Before (source):**
```javascript
/*!
 * math-utils v1.0.0 | MIT License
 * @rexxjs-meta {"dependencies":{"lodash":"4.17.21"}}
 */
const mathUtils = {
  'MATH_UTILS_MAIN': () => ({ loaded: true }),
  'ADD': (a, b) => a + b
};
if (typeof window !== 'undefined') window['math-utils'] = mathUtils;
```

**After (minified):**
```javascript
/*!
 * math-utils v1.0.0 | MIT License  
 * @rexxjs-meta {"dependencies":{"lodash":"4.17.21"}}
 */
const a={MATH_UTILS_MAIN:()=>({loaded:!0}),ADD:(a,b)=>a+b};"undefined"!=typeof window&&(window["math-utils"]=a);
```

✅ **Perfect preservation!** Dependencies survive minification automatically.

## Testing Your Library

```rexx
-- Test basic loading
REQUIRE "github.com/yourname/your-library@v1.2.3"

-- Test detection function
LET info = YOUR_LIBRARY_MAIN
SAY "Library:" info.name
SAY "Version:" info.version

-- Test main functionality
LET result = YOUR_MAIN_FUNCTION param="test"
SAY "Result:" result
```

## Error Handling

```rexx
-- REQUIRE throws errors on failure
SIGNAL ON ERROR

REQUIRE "github.com/nonexistent/library@v1.0.0"

-- This won't execute if library fails to load
SAY "Library loaded successfully"
EXIT

ERROR:
SAY "Failed to load library:" ERRORTEXT()
```

## Security Considerations

- Libraries execute with full access to global scope
- Only load libraries from trusted sources
- Dependency metadata is parsed from untrusted code
- Consider implementing sandboxing for production use

## Migration from ZIP Releases

**Before (❌):**
```
Release v1.2.3:
└── dist.zip
    ├── lib/my-library.js
    └── lib/my-library.min.js
```

**After (✅):**
```
Release v1.2.3:
├── my-library.js          ← Direct download
├── my-library-min.js      ← Direct download  
└── CHANGELOG.md
```

**Migration script:**
```bash
# Extract from existing ZIP and republish
unzip dist.zip
gh release upload v1.2.3 lib/my-library.js lib/my-library-min.js
```

## Best Practices

### For Library Authors
- Always publish both development and minified versions
- Use important comments (`/*!`) for dependency metadata
- Include runtime metadata in detection function (double redundancy)
- Test minified versions preserve dependency information
- Follow GitHub releases naming convention

### For Library Users  
- Prefer versioned imports over `@latest`
- Test transitive dependency loading
- Monitor network requests in development tools
- Cache libraries in production environments

## Remote REQUIRE via CHECKPOINT

### SCRO (Source-Controlled Remote Orchestration)

The Remote REQUIRE system enables RexxJS scripts to load libraries from remote sources through a bidirectional communication channel using the CHECKPOINT protocol. This advanced feature supports distributed computing scenarios where the RexxJS interpreter runs in a controlled environment and needs to request libraries from an orchestration service.

### Environment Detection

Remote orchestration is detected through several mechanisms:

**Environment Variables:**
```bash
export SCRO_REMOTE=true
export SCRO_ORCHESTRATION_ID=orch_123456
```

**RexxJS Variables:**
```rexx
-- Set remoteness via interpreter variables
LET SCRO_REMOTE = "true"
LET SCRO_ORCHESTRATION_ID = "session_789"
```

**Streaming Callback Context:**
```javascript
// Orchestration environment detected via streaming callback presence
interpreter.streamingProgressCallback = (message) => {
  // Handle CHECKPOINT messages
};
```

### CHECKPOINT Communication Protocol

The CHECKPOINT system uses a JSON-based messaging protocol for bidirectional communication:

**Request Message Format:**
```javascript
{
  type: 'rexx-require',
  subtype: 'require_request', 
  data: {
    type: 'require_request',
    libraryName: 'my-remote-library',
    requireId: 'req_12345',
    timestamp: 1640995200000
  }
}
```

**Response Message Format:**
```javascript
{
  type: 'rexx-require-response',
  requireId: 'req_12345',
  success: true,
  libraryCode: 'module.exports = { ... };',
  libraryName: 'my-remote-library'
}
```

### Built-in vs Third-party Detection

The remote REQUIRE system intelligently routes library requests:

**Built-in Libraries (Local Loading):**
```rexx
-- These load locally even in remote context
REQUIRE "string-functions"    -- Built-in, loads locally
REQUIRE "math-functions"      -- Built-in, loads locally
REQUIRE "./src/local-lib.js"  -- src/ directory, loads locally
```

**Third-party Libraries (Remote Loading):**
```rexx
-- These request via CHECKPOINT in remote context
REQUIRE "custom-library"              -- Remote request
REQUIRE "github-user/repo"            -- Remote request  
REQUIRE "./tests/test-lib.js"         -- Non-src local file, remote request
```

### Remote Library Execution

When a library is received via CHECKPOINT, it's executed safely in the interpreter's context:

```javascript
// Remote library code execution
await interpreter.executeRemoteLibraryCode(libraryName, libraryCode);

// Functions become available immediately
const result = interpreter.functions.REMOTE_FUNCTION('param');
```

**Library Caching:**
```javascript
// Libraries are cached after loading
const cached = interpreter.libraryCache.get('remote-library');
// { loaded: true, code: '...', timestamp: 1640995200000 }
```

### Security Considerations

**Code Execution:**
- Remote library code executes with full interpreter privileges
- Libraries run in the same context as the main script
- No sandboxing or permission restrictions applied

**Network Security:**
- All communication goes through the CHECKPOINT channel
- No direct network requests from remote-orchestrated interpreters
- Library resolution handled by orchestration service

**Trust Model:**
- Remote libraries must be trusted by the orchestration service
- Library code integrity depends on the orchestration environment
- Consider implementing additional validation for production use

### Error Handling

**Timeout Handling:**
```javascript
// Configurable timeout for remote requests
const response = await interpreter.waitForCheckpointResponse(requireId, 5000);

if (response.success === false && response.error === 'timeout') {
  throw new Error(`Remote REQUIRE timeout for ${libraryName}`);
}
```

**Communication Channel Errors:**
```javascript
// Handle missing communication channel
if (!interpreter.streamingProgressCallback && !window?.parent?.postMessage) {
  return { success: false, error: 'no_communication_channel' };
}
```

**Library Resolution Errors:**
```rexx
SIGNAL ON ERROR

REQUIRE "non-existent-remote-library"

ERROR:
  SAY "Remote REQUIRE failed:" ERRORTEXT()
  -- Error: Remote REQUIRE failed for non-existent-remote-library: Library not found
```

### Implementation Example

**Setting up Remote Context:**
```rexx
-- Configure for remote orchestration
LET SCRO_REMOTE = "true"
LET SCRO_ORCHESTRATION_ID = "demo_session_123"

-- Load remote library
REQUIRE "analytics-package"

-- Use loaded functions
LET data = PROCESS_ANALYTICS input=rawData
LET report = GENERATE_REPORT data=data
```

**Orchestration Service Integration:**
```javascript
// Orchestration service handles CHECKPOINT messages
interpreter.streamingProgressCallback = async (message) => {
  if (message.type === 'rexx-require') {
    const { libraryName, requireId } = message.data;
    
    // Resolve library from registry/cache
    const libraryCode = await resolveLibrary(libraryName);
    
    // Send response
    window.postMessage({
      type: 'rexx-require-response', 
      requireId: requireId,
      success: true,
      libraryCode: libraryCode,
      libraryName: libraryName
    });
  }
};
```

### Development Workflow

**Phase 1: Local Development**
```rexx
-- Normal local development (no remote context)
REQUIRE "github.com/user/library@latest"  -- Direct GitHub loading
```

**Phase 2: Remote Testing**
```bash
# Set up remote orchestration environment
export SCRO_REMOTE=true
export SCRO_ORCHESTRATION_ID=test_123

# Run with orchestration service
node orchestrator.js --script=my-script.rexx
```

**Phase 3: Production Deployment**
```rexx
-- Script automatically detects remote context
-- No code changes needed - REQUIRE routing is automatic
REQUIRE "production-library"  -- Loaded via orchestration service
```

### Performance Characteristics

**Local Library Loading:**
- ✅ **Zero latency** - Built-in libraries load immediately
- ✅ **No network overhead** - Direct function registration
- ✅ **Caching efficient** - Functions stored in memory

**Remote Library Loading:**
- ⚠️ **Network latency** - CHECKPOINT round-trip required
- ⚠️ **Timeout risk** - Communication channel dependent
- ✅ **One-time cost** - Libraries cached after first load

### Use Cases

**Controlled Execution Environments:**
- Jupyter notebook integrations
- Sandboxed code execution platforms
- Enterprise policy-controlled environments

**Distributed Computing:**
- Microservice architectures
- Container orchestration platforms
- Serverless function environments

**Security-Conscious Deployments:**
- Library approval workflows
- Centralized dependency management
- Audit trail requirements

## Related Functions

- **[INTERPRET](15-interpret.md)** - Dynamic code execution
- **[JSON Functions](08-json-functions.md)** - Parse dependency metadata  
- **[Web Functions](09-web-functions.md)** - HTTP resource access
- **[Security Functions](12-security-functions.md)** - Cryptographic verification

---

**Total Libraries Loaded:** Dynamic based on requirements
**Environments:** Browser (fetch), Node.js (https.get), and Remote Orchestration (CHECKPOINT)
**Security:** Transitive dependency validation, circular dependency detection, and controlled remote execution